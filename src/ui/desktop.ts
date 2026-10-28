/**
 * The desktop: one File Explorer icon, then one icon per entry from the last seven
 * calendar days, newest first. Missing days get no placeholder. A single tap opens
 * anything — no double-click, on any device.
 */
import '../styles/desktop.css';
import { h, replaceChildren, delegate } from '../lib/dom';
import { fileName } from '../lib/slug';
import { getRecentEntries, type Entry } from '../firebase/entries';
import { explorerIconSvg, textFileIconSvg } from './icons';
import { initWindows, openEntryWindow, openExplorerWindow, openWindowCount } from './window';
import { mountTaskbar } from './taskbar';
import type { Session } from '../firebase/auth';

export interface DesktopHandlers {
  onLogOff: () => void;
  onRestart: () => void;
  /** Absent until the admin editor exists, so the Start menu never offers a dead item. */
  onNewEntry?: () => void;
}

export function mountDesktop(app: HTMLElement, session: Session, handlers: DesktopHandlers): void {
  const icons = h('div', { class: 'desk-icons', role: 'list', 'aria-label': 'Desktop items' });
  const windowLayer = h('div', { class: 'win-layer' });

  const taskbar = mountTaskbar({
    session,
    onLogOff: handlers.onLogOff,
    onRestart: handlers.onRestart,
    onNewEntry: handlers.onNewEntry,
    onOpenExplorer: () => void openExplorerWindow(session),
  });

  replaceChildren(app, [
    h('h1', { class: 'sr-only' }, 'Diary desktop'),
    h('div', { class: 'desktop' }, [icons, windowLayer]),
    taskbar,
  ]);

  const render = () => renderIcons(icons);

  initWindows(windowLayer, taskbar.querySelector('.taskbtns')!, () => {
    // When the last window closes, an entry saved or deleted inside it may be new here.
    if (openWindowCount() === 0) void render();
  });

  // One listener for the whole grid, however many icons it holds.
  delegate(icons, 'click', '[data-open]', (event, target) => {
    event.preventDefault();
    const { open, date } = target.dataset;
    if (open === 'explorer') void openExplorerWindow(session);
    else if (open === 'entry' && date) void openEntryWindow(date, session);
  });

  void render();
}

async function renderIcons(host: HTMLElement): Promise<void> {
  const explorer = h(
    'button',
    { class: 'desk-icon', type: 'button', dataset: { open: 'explorer' }, title: 'File Explorer' },
    [
      h('span', { class: 'desk-icon-art', html: explorerIconSvg() }),
      h('span', { class: 'desk-icon-label' }, 'File Explorer'),
    ],
  );

  let entries: Entry[] | null = null;
  let failed = false;

  try {
    entries = await getRecentEntries();
  } catch {
    failed = true;
  }

  const children: HTMLElement[] = [explorer];

  if (failed) {
    children.push(h('p', { class: 'desk-note' }, [
      h('span', {}, 'Could not read the last 7 days.'),
      h('button', { class: 'btn btn-mini', type: 'button', onclick: () => void renderIcons(host) }, 'Retry'),
    ]));
  } else if (!entries || entries.length === 0) {
    children.push(h('p', { class: 'desk-note' }, 'No entries in the last 7 days.'));
  } else {
    for (const entry of entries) children.push(entryIcon(entry));
  }

  replaceChildren(host, children);
}

function entryIcon(entry: Entry): HTMLElement {
  const image = h('img', {
    class: 'desk-thumb',
    src: entry.thumbUrl,
    alt: '',
    width: 64,
    height: 64,
    loading: 'lazy',
    decoding: 'async',
  });

  // A missing doodle must not leave a broken box: swap in the text-file icon.
  image.addEventListener('error', () => {
    const holder = image.closest('.desk-icon-thumb');
    if (holder) replaceChildren(holder as HTMLElement, h('span', { class: 'thumb-fallback', html: textFileIconSvg() }));
  });

  const thumb = entry.thumbUrl
    ? h('span', { class: 'desk-icon-thumb' }, image)
    : h('span', { class: 'desk-icon-thumb' }, h('span', { class: 'thumb-fallback', html: textFileIconSvg() }));

  return h(
    'button',
    {
      class: 'desk-icon',
      type: 'button',
      dataset: { open: 'entry', date: entry.date },
      title: entry.title,
      'aria-label': `${entry.title}, ${entry.date}`,
    },
    [thumb, h('span', { class: 'desk-icon-label' }, fileName(entry.title))],
  );
}
