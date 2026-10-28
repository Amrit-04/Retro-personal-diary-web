/**
 * The entry viewer: a text-editor style window titled with the file name.
 *
 * Content is plain text laid out with `white-space: pre-wrap`. There is no
 * markdown and no HTML, so nothing a diary author types can ever become markup —
 * the body is written with textContent, never innerHTML.
 */
import '../styles/viewer.css';
import { h, replaceChildren, setText } from '../lib/dom';
import { longDate } from '../lib/dates';
import { fileName } from '../lib/slug';
import { getEntry, type Entry } from '../firebase/entries';
import { textFileIconSvg } from './icons';
import { ask } from './dialog';
import type { WindowContent, WindowHandle } from './window';
import type { Session } from '../firebase/auth';

export function buildViewer(date: string, session: Session): WindowContent {
  const page = h('div', { class: 'viewer-page' }, loading('Opening…'));
  const tools = h('div', { class: 'viewer-tools' });

  const body = h('div', { class: 'viewer' }, [tools, page]);

  let current: Entry | null = null;

  return {
    title: fileName(date),
    icon: textFileIconSvg(),
    status: longDate(date),
    body,
    mounted: (handle) => {
      void load(handle, page, tools, date, session, (entry) => { current = entry; });

      // Wired here because deleting needs the window handle to close itself.
      tools.addEventListener('click', (event) => {
        const target = (event.target as HTMLElement).closest('[data-act]') as HTMLElement | null;
        if (target?.dataset.act === 'delete' && current) void confirmDelete(current, handle, tools);
      });
    },
  };
}

/* ------------------------------------------------------------------ loading */

async function load(
  handle: WindowHandle,
  page: HTMLElement,
  tools: HTMLElement,
  date: string,
  session: Session,
  onEntry: (entry: Entry) => void,
): Promise<void> {
  replaceChildren(page, loading('Opening…'));

  let entry: Entry | null = null;
  let failed = false;

  try {
    entry = await getEntry(date);
  } catch {
    failed = true;
  }

  if (failed) {
    replaceChildren(page, h('div', { class: 'viewer-note' }, [
      h('p', { class: 'note-title' }, 'The diary could not be reached.'),
      h('p', {}, 'Check your connection, then try again.'),
      retry(() => void load(handle, page, tools, date, session, onEntry)),
    ]));
    return;
  }

  if (!entry) {
    replaceChildren(page, h('div', { class: 'viewer-note' }, [
      h('p', { class: 'note-title' }, 'File not found'),
      h('p', {}, `There is no diary entry for ${longDate(date)}.`),
      retry(() => void load(handle, page, tools, date, session, onEntry)),
    ]));
    return;
  }

  onEntry(entry);
  handle.setTitle(fileName(entry.title));
  handle.setStatus(`${longDate(entry.date)} · ${wordCount(entry.content)} words`);
  renderEntry(page, entry);

  // Visibility only — firestore.rules and storage.rules are the enforcement.
  if (session.hasAdminClaim) {
    replaceChildren(tools, [
      h('button', { class: 'btn btn-danger', type: 'button', dataset: { act: 'delete' } }, 'Delete'),
    ]);
  }
}

function loading(text: string): HTMLElement {
  return h('p', { class: 'viewer-loading' }, text);
}

function retry(onRetry: () => void): HTMLElement {
  return h('p', {}, h('button', { class: 'btn', type: 'button', onclick: onRetry }, 'Retry'));
}

/* ------------------------------------------------------------------ rendering */

function renderEntry(page: HTMLElement, entry: Entry): void {
  replaceChildren(page, [
    h('h2', { class: 'entry-title' }, entry.title),
    h('p', { class: 'entry-date' }, longDate(entry.date)),
    entry.imageUrl ? doodle(entry) : null,
    h('div', { class: 'entry-text' }, entry.content),
  ]);
}

/**
 * A doodle is capped at 800px on upload, so the frame can reserve a box of the
 * right ratio before the bytes arrive. That keeps layout shift at zero without
 * storing dimensions in the document (the rules allow exactly nine fields).
 */
function doodle(entry: Entry): HTMLElement {
  const image = h('img', {
    class: 'entry-doodle',
    src: entry.imageUrl,
    alt: `Doodle for ${entry.title}`,
    width: 800,
    height: 600,
    loading: 'lazy',
    decoding: 'async',
  });

  const frame = h('div', { class: 'doodle-frame' }, image);

  image.addEventListener('error', () => {
    replaceChildren(frame, h('div', { class: 'doodle-frame is-missing', html: textFileIconSvg() }));
  });

  return h('figure', { class: 'entry-figure' }, [frame, h('figcaption', {}, 'Daily doodle')]);
}

function wordCount(content: string): number {
  const words = content.trim().split(/\s+/);
  return words[0] === '' ? 0 : words.length;
}

/* ------------------------------------------------------------------ admin */

async function confirmDelete(entry: Entry, handle: WindowHandle, tools: HTMLElement): Promise<void> {
  const choice = await ask({
    title: 'Delete Entry',
    message: `"${entry.title}" and its doodle will be permanently deleted. There is no recycle bin.`,
    actions: [
      { label: 'Delete', value: 'delete', kind: 'danger' },
      { label: 'Cancel', value: 'cancel' },
    ],
    focusValue: 'cancel',
  });

  if (choice !== 'delete') return;

  const button = tools.querySelector('[data-act="delete"]') as HTMLButtonElement | null;
  if (button) {
    button.disabled = true;
    setText(button, 'Deleting…');
  }

  try {
    const { deleteEntryEverything } = await import('../firebase/admin');
    await deleteEntryEverything(entry);
    handle.close();
  } catch (error) {
    if (button) {
      button.disabled = false;
      setText(button, 'Delete');
    }
    await ask({
      title: 'Delete Failed',
      message: describe(error),
      actions: [{ label: 'OK', value: 'ok', kind: 'primary' }],
    });
  }
}

function describe(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';
  if (code.includes('permission-denied') || code.includes('failed-precondition')) {
    return 'The server refused this request: only an administrator may delete an entry.';
  }
  return 'The entry could not be deleted. Check your connection and try again.';
}
