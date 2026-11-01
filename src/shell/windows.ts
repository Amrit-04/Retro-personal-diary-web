/**
 * The window manager.
 *
 * Geometry lives in mutable WindowState objects, not in signal values: dragging a
 * window must not re-render it. The array is replaced only when windows open or
 * close, and `revision` is bumped for the few things the chrome actually has to
 * repaint (focus, minimize, maximize). Pointer moves are written straight to the
 * DOM node by Window.tsx and committed to the object on release, so an entire drag
 * costs zero renders.
 *
 * Mobile is not a smaller desktop: below 768px a window is a full-height sheet,
 * only the top one is mounted, and browser Back closes it (brief §7).
 */
import { signal } from '@preact/signals';
import { memoize } from '../lib/memoize';
import type { ComponentType } from 'preact';
import { getSpec, type AppSpec } from './registry';
import type { IconName } from './icons';

export type AppId = 'explorer' | 'viewer' | 'editor' | 'minesweeper';

export interface WindowProps {
  /** Entry id, "YYYY-MM-DD". */
  date?: string;
  /** Entry title, known when the window was opened from an icon or a list row. */
  title?: string;
  file?: File;
  message?: string;
}

export interface WindowBodyProps {
  win: WindowState;
}

/** The caption buttons XP draws, in order, right-aligned in the title band. */
export type CaptionName = 'minimize' | 'maximize' | 'close';

export interface WindowState {
  id: number;
  app: AppId;
  title: string;
  icon: IconName;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
  resizable: boolean;
  captions: CaptionName[];
  minWidth: number;
  minHeight: number;
  props: WindowProps;
  body: ComponentType<WindowBodyProps> | null;
}

const TASKBAR_PX = 30;
const CASCADE_PX = 26;
const FIRST_X = 56;
const FIRST_Y = 40;

export const windows = signal<WindowState[]>([]);
export const activeId = signal<number | null>(null);
export const revision = signal(0);

const mobileQuery = matchMedia('(max-width: 767px)');
export const isMobile = signal(mobileQuery.matches);
mobileQuery.addEventListener('change', (event) => {
  isMobile.value = event.matches;
});

let nextId = 1;
let topZ = 20;
let sheetDepth = 0;

function bump(): void {
  revision.value++;
}

function workArea(): { width: number; height: number } {
  return { width: window.innerWidth, height: window.innerHeight - TASKBAR_PX };
}

function topmost(): WindowState | undefined {
  return [...windows.value].sort((a, b) => b.z - a.z).find((win) => !win.minimized);
}

export function byId(id: number): WindowState | undefined {
  return windows.value.find((win) => win.id === id);
}

export function open(app: AppId, props: WindowProps = {}): WindowState | null {
  const spec = getSpec(app);
  if (!spec) return null;

  const existing = spec.singleton ? windows.value.find((win) => win.app === app) : undefined;
  if (existing) {
    existing.props = props;
    existing.title = spec.title(props);
    existing.minimized = false;
    loadBody(existing, spec);
    focus(existing.id);
    return existing;
  }

  const area = workArea();
  const count = windows.value.length;
  const w = Math.min(spec.width, area.width - 20);
  const h = Math.min(spec.height, area.height - 20);
  const win: WindowState = {
    id: nextId++,
    app,
    title: spec.title(props),
    icon: spec.icon,
    x: Math.max(0, Math.min(FIRST_X + count * CASCADE_PX, area.width - w)),
    y: Math.max(0, Math.min(FIRST_Y + count * CASCADE_PX, area.height - h)),
    w,
    h,
    z: ++topZ,
    minimized: false,
    maximized: false,
    resizable: spec.resizable,
    captions: spec.captions ?? ['minimize', 'maximize', 'close'],
    minWidth: spec.minWidth,
    minHeight: spec.minHeight,
    props,
    body: null,
  };

  windows.value = [...windows.value, win];
  activeId.value = win.id;
  loadBody(win, spec);
  if (isMobile.value) pushSheet();
  return win;
}

/** The app chunk arrives after the window frame, so the chrome never waits for it. */
function loadBody(win: WindowState, spec: AppSpec): void {
  void spec.load().then((component) => {
    // The window may have been closed while the chunk was in flight.
    if (!byId(win.id)) return;
    // memoize() + a stable WindowState object means a focus change or a drag commit
    // repaints the chrome without re-rendering the program inside it.
    win.body = memoize(component);
    bump();
  });
}

export function focus(id: number): void {
  const win = byId(id);
  if (!win) return;
  win.minimized = false;
  win.z = ++topZ;
  activeId.value = id;
  bump();
}

/** The viewer only learns the real filename once the document has been read. */
export function setTitle(id: number, title: string): void {
  const win = byId(id);
  if (!win || win.title === title) return;
  win.title = title;
  bump();
}

export function minimize(id: number): void {
  const win = byId(id);
  if (!win) return;
  win.minimized = true;
  if (activeId.value === id) activeId.value = topmost()?.id ?? null;
  bump();
}

export function toggleMaximize(id: number): void {
  const win = byId(id);
  if (!win) return;
  win.maximized = !win.maximized;
  focus(id);
}

export function close(id: number): void {
  // On a phone the sheet is a history entry, so closing walks Back instead.
  if (isMobile.value && sheetDepth > 0 && topmost()?.id === id) {
    history.back();
    return;
  }
  remove(id);
}

function remove(id: number): void {
  const win = byId(id);
  if (!win) return;
  windows.value = windows.value.filter((item) => item.id !== id);
  if (activeId.value === id) activeId.value = topmost()?.id ?? null;
  bump();
}

function pushSheet(): void {
  history.pushState({ 'diary-xp': 'sheet' }, '');
  sheetDepth++;
}

window.addEventListener('popstate', () => {
  if (sheetDepth === 0) return;
  sheetDepth--;
  const top = topmost();
  if (top) remove(top.id);
});

/** Cascade positions are clamped to the work area after a rotation or resize. */
export function clampAllWindows(): void {
  const area = workArea();
  let moved = false;
  for (const win of windows.value) {
    const x = Math.max(0, Math.min(win.x, area.width - 60));
    const y = Math.max(0, Math.min(win.y, area.height - 30));
    if (x !== win.x || y !== win.y) {
      win.x = x;
      win.y = y;
      moved = true;
    }
  }
  if (moved) bump();
}
