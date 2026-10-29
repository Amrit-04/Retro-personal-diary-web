/**
 * File Explorer: Diary > 2026 > March.
 *
 * Three levels, three query shapes, always the cheapest one:
 *   years   — two limit(1) reads give the oldest and the newest document id
 *   months  — one server-side count per month, issued in parallel
 *   entries — one month at a time, at most 31 documents, oldest first
 *
 * Nothing here downloads the collection, and every result is cached for the
 * session, so going Back costs zero reads and opening an entry you just scrolled
 * past is free.
 */
import '../styles/explorer.css';
import { delegate, h, replaceChildren } from '../lib/dom';
import { MONTH_NAMES, shortDate, yearsBetween } from '../lib/dates';
import { fileName } from '../lib/slug';
import { getEntriesForMonth, getMonthCounts, getYearSpan, type Entry } from '../firebase/entries';
import { backArrowSvg, folderSmallSvg, textFileSmallSvg, upArrowSvg } from './icons';
import { openEntryWindow } from './window';
import type { WindowContent, WindowHandle } from './window';
import type { Session } from '../firebase/auth';

type Screen =
  | { level: 'root' }
  | { level: 'year'; year: number }
  | { level: 'month'; year: number; month: number };

const ROOT: Screen = { level: 'root' };

export function buildExplorer(session: Session): WindowContent {
  const list = h('div', { class: 'ex-list', role: 'group', 'aria-label': 'Diary archive' });
  const trail = h('div', { class: 'ex-trail', role: 'navigation', 'aria-label': 'Breadcrumbs' });

  const back = navButton('Back', backArrowSvg(), () => {
    if (crumbs.length > 1) {
      crumbs.pop();
      draw();
    }
  });

  const up = navButton('Up', upArrowSvg(), () => {
    const screen = current();
    if (screen.level === 'root') return;
    crumbs = screen.level === 'month' ? [ROOT, { level: 'year', year: screen.year }] : [ROOT];
    draw();
  }, 'Up One Level');

  const body = h('div', { class: 'explorer' }, [
    h('div', { class: 'ex-bar' }, [
      back,
      up,
      h('span', { class: 'ex-addr-label', 'aria-hidden': 'true' }, 'Address'),
      trail,
    ]),
    h('div', { class: 'ex-head', 'aria-hidden': 'true' }, [
      h('span', {}),
      h('span', {}, 'Name'),
      h('span', { class: 'ex-head-meta' }, 'Contents'),
    ]),
    list,
  ]);

  /** The path walked so far; the last crumb is what is on screen. */
  let crumbs: Screen[] = [ROOT];
  let opened: WindowHandle | null = null;
  let request = 0;

  const current = (): Screen => crumbs[crumbs.length - 1];

  function draw(): void {
    const screen = current();
    const token = ++request;

    back.disabled = crumbs.length < 2;
    up.disabled = screen.level === 'root';
    drawTrail();
    replaceChildren(list, skeleton());

    if (screen.level === 'root') void renderYears(token);
    else if (screen.level === 'year') void renderMonths(token, screen.year);
    else void renderEntries(token, screen.year, screen.month);
  }

  function drawTrail(): void {
    const parts: (HTMLElement | null)[] = [
      h('span', { class: 'ex-addr-icon', 'aria-hidden': 'true', html: folderSmallSvg() }),
    ];

    crumbs.forEach((crumb, index) => {
      if (index > 0) parts.push(h('span', { class: 'ex-sep', 'aria-hidden': 'true' }, '›'));
      parts.push(
        h('button', {
          class: 'ex-crumb',
          type: 'button',
          dataset: { jump: String(index) },
          'aria-current': index === crumbs.length - 1 ? 'page' : null,
        }, labelFor(crumb)),
      );
    });

    replaceChildren(trail, parts);
  }

  /* ------------------------------------------------------------------ levels */

  async function renderYears(token: number): Promise<void> {
    const loaded = await settle(() => getYearSpan(), token, 'The archive could not be read.');
    if (!loaded) return;

    const span = loaded.value;

    if (!span) {
      replaceChildren(list, note('No diary entries yet.'));
      opened?.setStatus('Empty');
      return;
    }

    const years = yearsBetween(span.earliest, span.latest);
    replaceChildren(
      list,
      years.map((year) => folderRow(labelFor({ level: 'year', year }), '', { nav: 'year', value: String(year) })),
    );
    opened?.setStatus(`${years.length} ${years.length === 1 ? 'year' : 'years'}`);
  }

  async function renderMonths(token: number, year: number): Promise<void> {
    const loaded = await settle(() => getMonthCounts(year), token, 'This year could not be read.');
    if (!loaded) return;

    const counts = loaded.value;

    if (counts.length === 0) {
      replaceChildren(list, note(`Nothing recorded in ${year}.`));
      opened?.setStatus('Empty');
      return;
    }

    replaceChildren(
      list,
      counts.map((item) =>
        folderRow(
          MONTH_NAMES[item.month - 1],
          `${item.count} ${item.count === 1 ? 'entry' : 'entries'}`,
          { nav: 'month', year: String(year), month: String(item.month) },
        ),
      ),
    );
    opened?.setStatus(`${counts.length} months`);
  }

  async function renderEntries(token: number, year: number, month: number): Promise<void> {
    const loaded = await settle(() => getEntriesForMonth(year, month), token, 'This month could not be read.');
    if (!loaded) return;

    const entries = loaded.value;

    if (entries.length === 0) {
      replaceChildren(list, note(`Nothing recorded in ${MONTH_NAMES[month - 1]} ${year}.`));
      opened?.setStatus('Empty');
      return;
    }

    replaceChildren(list, entries.map((entry) => entryRow(entry)));
    opened?.setStatus(`${entries.length} ${entries.length === 1 ? 'file' : 'files'}`);
  }

  /**
   * Awaits a loader. A rejection becomes an inline Retry; a response that arrived
   * after the user moved on is dropped, so a slow folder cannot overwrite a fast one.
   */
  async function settle<T>(
    load: () => Promise<T>,
    token: number,
    problem: string,
  ): Promise<{ value: T } | null> {
    try {
      const value = await load();
      return token === request ? { value } : null;
    } catch {
      if (token === request) replaceChildren(list, note(problem, () => draw()));
      return null;
    }
  }

  /* ------------------------------------------------------------------ row taps */

  // One listener for the whole list, however many rows it holds.
  delegate(list, 'click', '[data-nav]', (event, target) => {
    event.preventDefault();
    const { nav, value, month } = target.dataset;
    const screen = current();

    if (nav === 'year') {
      crumbs = [ROOT, { level: 'year', year: Number(value) }];
      draw();
    } else if (nav === 'month' && screen.level === 'year') {
      crumbs = [...crumbs, { level: 'month', year: screen.year, month: Number(month) }];
      draw();
    } else if (nav === 'entry' && value) {
      void openEntryWindow(value, session);
    }
  });

  // A breadcrumb jump truncates the path rather than extending it.
  delegate(trail, 'click', '[data-jump]', (event, target) => {
    event.preventDefault();
    const index = Number(target.dataset.jump);
    if (index === crumbs.length - 1) return;
    crumbs = crumbs.slice(0, index + 1);
    draw();
  });

  return {
    title: 'File Explorer',
    icon: folderSmallSvg(),
    status: 'Diary',
    body,
    mounted: (handle) => {
      opened = handle;
      draw();
    },
  };
}

/* ------------------------------------------------------------------ row builders */

function folderRow(label: string, meta: string, dataset: Record<string, string>): HTMLElement {
  return h('button', { class: 'ex-row', type: 'button', dataset }, [
    h('span', { class: 'ex-cell-icon', html: folderSmallSvg() }),
    h('span', { class: 'ex-cell-name' }, label),
    h('span', { class: 'ex-cell-meta' }, meta),
  ]);
}

function entryRow(entry: Entry): HTMLElement {
  const icon = entry.thumbUrl
    ? h('img', {
        class: 'ex-thumb',
        src: entry.thumbUrl,
        alt: '',
        width: 32,
        height: 32,
        loading: 'lazy',
        decoding: 'async',
      })
    : h('span', { class: 'ex-cell-icon', html: textFileSmallSvg() });

  // A dead thumbnail falls back to the file glyph instead of a broken box.
  icon.addEventListener('error', () => {
    icon.replaceWith(h('span', { class: 'ex-cell-icon', html: textFileSmallSvg() }));
  });

  return h(
    'button',
    {
      class: 'ex-row',
      type: 'button',
      title: entry.title,
      dataset: { nav: 'entry', value: entry.date },
    },
    [
      icon,
      h('span', { class: 'ex-cell-name' }, fileName(entry.title)),
      h('span', { class: 'ex-cell-meta' }, shortDate(entry.date)),
    ],
  );
}

function navButton(
  label: string,
  icon: string,
  onClick: () => void,
  accessibleLabel = label,
): HTMLButtonElement {
  return h('button', {
    class: 'ex-nav',
    type: 'button',
    'aria-label': accessibleLabel,
    title: accessibleLabel,
    onclick: onClick,
  }, [
    h('span', { class: 'ex-nav-icon', html: icon }),
    h('span', { class: 'ex-nav-label' }, label),
  ]);
}

/** Three pulsing bars: the shape of the list that is about to arrive. */
function skeleton(): HTMLElement {
  return h('div', { class: 'ex-skeleton', 'aria-hidden': 'true' }, [
    h('span', { class: 'ex-skel-row' }),
    h('span', { class: 'ex-skel-row' }),
    h('span', { class: 'ex-skel-row' }),
  ]);
}

function note(text: string, onRetry?: () => void): HTMLElement {
  return h('div', { class: 'note ex-note' }, [
    h('strong', {}, text),
    onRetry ? h('button', { class: 'btn', type: 'button', onclick: onRetry }, 'Retry') : null,
  ]);
}

function labelFor(screen: Screen): string {
  if (screen.level === 'root') return 'Diary';
  if (screen.level === 'year') return String(screen.year);
  return MONTH_NAMES[screen.month - 1];
}
