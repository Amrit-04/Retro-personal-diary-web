/**
 * The window manager: open, focus, close. Nothing else. No dragging, resizing,
 * minimising or maximising in v1, which keeps it to one file and keeps layout cheap.
 *
 * Desktop (>= 768px): windows are centred and cascaded with a transform offset.
 * Mobile: a window is a full-screen sheet and only the top one is visible.
 *
 * The browser Back button closes the top window. Opening pushes exactly one history
 * entry and closing always happens in the popstate handler, so there is a single
 * teardown path and history can never drift out of step with the stack.
 */
import '../styles/window.css';
import { h, setText } from '../lib/dom';
import { closeGlyphSvg } from './icons';
import type { Session } from '../firebase/auth';

export interface WindowContent {
  title: string;
  icon: string;
  body: HTMLElement;
  status?: string;
  /** Lets a screen refine its own title or status once its data has arrived. */
  mounted?: (handle: WindowHandle) => void;
}

export interface WindowHandle {
  id: number;
  root: HTMLElement;
  body: HTMLElement;
  focus(): void;
  close(): void;
  setTitle(text: string): void;
  setStatus(text: string): void;
}

interface Managed {
  id: number;
  title: string;
  root: HTMLElement;
  body: HTMLElement;
  statusNode: HTMLElement | null;
  /** Applies a new title everywhere it appears: bar, dialog label, close button, taskbar. */
  retitle: (text: string) => void;
  onClose?: () => void;
}

let host: HTMLElement | null = null;
let buttonsHost: HTMLElement | null = null;
let nextId = 1;
const stack: Managed[] = [];
let onChange: () => void = () => undefined;
let popstateArmed = false;
let replacing = false;

/* Window ids restart at 1 on every page load, so a history entry left behind by an
   earlier visit (reload, Log Off, Restart) can name an id that belongs to this one.
   Each load stamps its entries with its own token; a state from another load means
   "no window of ours", which closes the whole stack instead of wedging it. */
const NO_WINDOW = 0;
const loadToken = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function stamp(win: number): Record<string, unknown> {
  return { win, loadToken };
}

function wantedWindow(): number {
  const state = history.state as { win?: number; loadToken?: string } | null;
  return state?.loadToken === loadToken ? (state.win ?? NO_WINDOW) : NO_WINDOW;
}

/** Called once when the desktop mounts, to hand the manager its two layers. */
export function initWindows(windowsHost: HTMLElement, taskButtonsHost: HTMLElement, changed: () => void): void {
  host = windowsHost;
  buttonsHost = taskButtonsHost;
  onChange = changed;

  // The entry we are sitting on is ours now, and it has no windows open.
  history.replaceState(stamp(NO_WINDOW), '');

  if (!popstateArmed) {
    popstateArmed = true;
    window.addEventListener('popstate', onPopState);
  }
}

export function openWindow(options: WindowContent & {
  kind?: string;
  onClose?: () => void;
}): WindowHandle {
  if (!host) throw new Error('The window host is not mounted yet');

  const id = nextId++;
  const cascade = Math.min(stack.length, 4);

  const titleNode = h('span', { class: 'win-title' }, options.title);
  const statusNode = options.status !== undefined
    ? h('div', { class: 'win-status' }, options.status)
    : null;

  const closeButton = h('button', {
    class: 'win-close',
    type: 'button',
    'aria-label': `Close ${options.title}`,
    html: closeGlyphSvg(),
  });

  const bodyHost = h('div', { class: 'win-body' }, options.body);

  const root = h('div', {
    class: `win win-${options.kind ?? 'plain'}`,
    dataset: { winId: String(id) },
    style: { '--dx': `${cascade * 20}px`, '--dy': `${cascade * 14}px` },
    role: 'dialog',
    'aria-label': options.title,
  }, [
    h('div', { class: 'win-titlebar' }, [
      h('span', { class: 'win-icon', html: options.icon }),
      titleNode,
      h('div', { class: 'win-controls' }, closeButton),
    ]),
    bodyHost,
    statusNode,
  ]);

  closeButton.addEventListener('click', (event) => {
    event.stopPropagation();
    requestClose(managed);
  });
  root.addEventListener('pointerdown', () => focusWindow(id));

  // Escape closes a window the way Back does — except while a field has focus, where
  // it would throw away words the author has not saved.
  root.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('input, textarea, [contenteditable]')) return;
    event.stopPropagation();
    requestClose(managed);
  });

  const managed: Managed = {
    id,
    title: options.title,
    root,
    body: bodyHost,
    statusNode,
    retitle: (text) => {
      managed.title = text;
      setText(titleNode, text);
      root.setAttribute('aria-label', text);
      closeButton.setAttribute('aria-label', `Close ${text}`);
      syncButtons();
    },
    onClose: options.onClose,
  };
  stack.push(managed);
  host.appendChild(root);
  restack();

  if (replacing) {
    // This window takes a history slot instead of adding one.
    history.replaceState(stamp(id), '');
    replacing = false;
  } else {
    history.pushState(stamp(id), '');
  }
  requestAnimationFrame(() => root.classList.add('is-open'));
  closeButton.focus({ preventScroll: true });

  const handle: WindowHandle = {
    id,
    root,
    body: bodyHost,
    focus: () => focusWindow(id),
    close: () => requestClose(managed),
    setTitle: (text) => managed.retitle(text),
    setStatus: (text) => {
      if (managed.statusNode) setText(managed.statusNode, text);
    },
  };

  // Screens start their own loading here, so the window itself is already on screen.
  options.mounted?.(handle);

  return handle;
}

/** X and system Back converge here: raise the window, then step back one entry. */
function requestClose(target: Managed): void {
  if (!stack.includes(target)) return;
  if (stack[stack.length - 1] !== target) focusWindow(target.id);
  history.back();
}

function onPopState(): void {
  const wanted = wantedWindow();

  while (stack.length && stack[stack.length - 1].id !== wanted) {
    const closing = stack.pop()!;
    closing.root.remove();
    closing.onClose?.();
  }

  restack();
  onChange();
}

export function focusWindow(id: number): void {
  const target = stack.find((item) => item.id === id);
  if (!target || stack[stack.length - 1] === target) return;

  stack.splice(stack.indexOf(target), 1);
  stack.push(target);
  restack();
  onChange();
}

/** Reapplies z-order, the active title bar and the mobile single-sheet rule. */
function restack(): void {
  stack.forEach((item, index) => {
    const top = index === stack.length - 1;
    item.root.style.zIndex = String(100 + index);
    item.root.classList.toggle('is-active', top);
  });

  syncButtons();
}

/** Taskbar buttons: a handful of nodes, so rebuilding beats diffing. */
function syncButtons(): void {
  if (!buttonsHost) return;

  const fragment = document.createDocumentFragment();
  stack.forEach((item, index) => {
    fragment.appendChild(
      h('button', {
        class: `taskbtn${index === stack.length - 1 ? ' is-active' : ''}`,
        type: 'button',
        'aria-pressed': index === stack.length - 1 ? 'true' : 'false',
        dataset: { winId: String(item.id) },
        onclick: () => focusWindow(item.id),
      }, item.title),
    );
  });

  buttonsHost.replaceChildren(fragment);
}

/** Closes every window through the history stack, so teardown stays single-path. */
export function closeAllWindows(): void {
  if (stack.length) history.go(-stack.length);
}

/**
 * Swaps an open window for another one in the same history slot.
 *
 * The viewer's Edit button uses this: the reader becomes the editor without
 * stacking a window behind it, so Back from the editor still leaves the desktop.
 * Closing by hand goes through history instead, never this shortcut.
 */
export async function replaceWindow(closing: WindowHandle, open: () => Promise<WindowHandle>): Promise<void> {
  const managed = stack.find((item) => item.id === closing.id);

  if (managed) {
    stack.splice(stack.indexOf(managed), 1);
    managed.root.remove();
    managed.onClose?.();
    restack();
  }

  replacing = true;
  try {
    await open();
  } finally {
    replacing = false;
  }
}

export function openWindowCount(): number {
  return stack.length;
}

/* ------------------------------------------------------------------ screen openers
 * Each screen is its own lazy chunk. The Storage SDK reaches the browser only
 * through admin.ts, which the viewer loads on a confirmed delete and the editor
 * loads on save — never from the boot path.
 */

export async function openEntryWindow(date: string, session: Session): Promise<WindowHandle> {
  const { buildViewer } = await import('./viewer');
  return openWindow({ ...buildViewer(date, session), kind: 'viewer' });
}

export async function openExplorerWindow(session: Session): Promise<WindowHandle> {
  const { buildExplorer } = await import('./explorer');
  return openWindow({ ...buildExplorer(session), kind: 'explorer' });
}

/** Admin only in practice: the rules refuse the write for anybody else. */
export async function openEditorWindow(session: Session, date?: string): Promise<WindowHandle> {
  const { buildEditor } = await import('./editor');
  return openWindow({ ...buildEditor(session, date), kind: 'editor' });
}
