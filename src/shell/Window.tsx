/**
 * A Luna window: title bar, three caption buttons, eight resize handles, and the
 * program's body.
 *
 * The frame markup and class names are the reference's (`Windows/index.js` and
 * `HeaderButtons.js`): `.header__bg` paints the 28px band, `.app__header` holds the
 * icon, title and `.header__button`s over it, and `.app__content` clips the body.
 *
 * Drag and resize never pass through state. The gesture writes
 * `transform: translate3d()` (or width/height) onto the node inside one rAF per
 * frame, and the final geometry is committed to the WindowState object on release,
 * which does not bump `revision`. A drag therefore costs zero renders, which is the
 * whole reason this works on a cheap phone.
 */
import { useRef } from 'preact/hooks';
import type { ComponentType } from 'preact';
import { memoize } from '../lib/memoize';
import { XpIcon } from './icons';
import {
  activeId,
  close,
  focus,
  isMobile,
  minimize,
  revision,
  toggleMaximize,
  type WindowState,
} from './windows';
import './window.css';

/** Only the few fields a gesture needs, so no event type has to be name-matched. */
type PointerLike = {
  pointerId: number;
  clientX: number;
  clientY: number;
  target: EventTarget | null;
};

const EDGE = 8;
const TITLE_BAR_KEEP_ON_SCREEN = 80;

type Mode = 'move' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const HANDLES: { mode: Mode; className: string }[] = [
  { mode: 'n', className: 'rz-n' },
  { mode: 's', className: 'rz-s' },
  { mode: 'e', className: 'rz-e' },
  { mode: 'w', className: 'rz-w' },
  { mode: 'ne', className: 'rz-ne' },
  { mode: 'nw', className: 'rz-nw' },
  { mode: 'se', className: 'rz-se' },
  { mode: 'sw', className: 'rz-sw' },
];

/**
 * The key tells Preact when a reused singleton window changed subject: opening a
 * different entry remounts the body, while unrelated repaints do not touch it.
 */
function bodyKey(win: WindowState): string {
  return `${win.props.date ?? ''}|${win.props.file?.name ?? ''}|${win.props.message ?? ''}`;
}

export function Window({ win }: { win: WindowState }) {
  revision.value; // geometry is committed without a re-render; everything else is not
  const active = activeId.value === win.id;
  const mobile = isMobile.value;
  const node = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  if (win.minimized) return null;

  const Body = win.body as ComponentType<{ win: WindowState }> | null;
  const captions = win.captions;

  const onPointerDown = (event: PointerLike) => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-caption]')) return;
    focus(win.id);
    if (mobile || win.maximized || win.minimized) return;

    const handle = target.dataset.resize as Mode | undefined;
    const isTitleBar = target.closest('[data-titlebar]') !== null;
    if (!isTitleBar && !(handle && win.resizable)) return;

    beginGesture(event, handle ?? 'move');
  };

  function beginGesture(event: PointerLike, mode: Mode) {
    const el = node.current;
    if (!el) return;
    const pointerId = event.pointerId;
    const startX = event.clientX;
    const startY = event.clientY;
    const base = { x: win.x, y: win.y, w: win.w, h: win.h };
    let next = base;

    el.classList.add('is-busy');
    el.setPointerCapture(pointerId);

    const write = () => {
      frame.current = 0;
      if (mode === 'move') {
        el.style.transform = `translate3d(${next.x - base.x}px, ${next.y - base.y}px, 0)`;
      } else {
        el.style.left = `${next.x}px`;
        el.style.top = `${next.y}px`;
        el.style.width = `${next.w}px`;
        el.style.height = `${next.h}px`;
      }
    };

    const onMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      next = geometryFor(mode, base, moveEvent.clientX - startX, moveEvent.clientY - startY, win);
      if (!frame.current) frame.current = requestAnimationFrame(write);
    };

    const onEnd = (endEvent: PointerEvent) => {
      if (endEvent.pointerId !== pointerId) return;
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onEnd);
      el.removeEventListener('pointercancel', onEnd);
      el.classList.remove('is-busy');
      if (frame.current) cancelAnimationFrame(frame.current);
      write();

      // Commit straight to the object: no revision bump, so no re-render of anything.
      win.x = next.x;
      win.y = next.y;
      win.w = next.w;
      win.h = next.h;
      if (mode === 'move') {
        el.style.transform = '';
        el.style.left = `${next.x}px`;
        el.style.top = `${next.y}px`;
      }
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onEnd);
    el.addEventListener('pointercancel', onEnd);
  }

  const classes = [
    'window',
    active ? '' : 'is-blurred',
    win.maximized ? 'is-maximized' : '',
    mobile ? 'is-sheet' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const maximizable = !mobile && win.resizable;

  return (
    <div
      ref={node}
      class={classes}
      style={{
        left: `${win.x}px`,
        top: `${win.y}px`,
        width: `${win.w}px`,
        height: `${win.h}px`,
        zIndex: win.z,
      }}
      onPointerDown={onPointerDown}
      onDblClick={(event) => {
        if (mobile || !win.resizable) return;
        if ((event.target as HTMLElement).closest('[data-caption]')) return;
        toggleMaximize(win.id);
      }}
      role="dialog"
      aria-label={win.title}
      aria-modal="false"
    >
      <div class="header__bg" />

      <header class="app__header" data-titlebar="true">
        <span class="app__header__icon">
          <XpIcon name={win.icon} size={15} />
        </span>
        <div class="app__header__title">{win.title}</div>

        <div class="header__buttons">
          {captions.includes('minimize') && (
            <button
              class="header__button header__button--minimize"
              type="button"
              data-caption="true"
              aria-label="Minimize"
              onClick={() => minimize(win.id)}
            />
          )}
          {captions.includes('maximize') && (
            <button
              class={`header__button ${
                win.maximized ? 'header__button--maximized' : 'header__button--maximize'
              }${maximizable ? '' : ' header__button--disable'}`}
              type="button"
              data-caption="true"
              aria-label={win.maximized ? 'Restore' : 'Maximize'}
              onClick={() => maximizable && toggleMaximize(win.id)}
            />
          )}
          <button
            class="header__button header__button--close"
            type="button"
            data-caption="true"
            aria-label="Close"
            onClick={() => close(win.id)}
          />
        </div>
      </header>

      <div class="app__content">
        {Body ? (
          <Body key={bodyKey(win)} win={win} />
        ) : (
          <div class="win-loading" role="status" aria-label="Opening">
            <span class="win-loading-bar" />
          </div>
        )}
      </div>

      {!mobile &&
        win.resizable &&
        HANDLES.map((handle) => (
          <i key={handle.mode} class={`rz ${handle.className}`} data-resize={handle.mode} aria-hidden="true" />
        ))}
    </div>
  );
}

/** All the maths lives here so the component only moves a pointer into a rectangle. */
function geometryFor(
  mode: Mode,
  base: { x: number; y: number; w: number; h: number },
  dx: number,
  dy: number,
  win: WindowState,
): { x: number; y: number; w: number; h: number } {
  const area = { width: window.innerWidth, height: window.innerHeight - EDGE };
  if (mode === 'move') {
    return {
      x: clamp(base.x + dx, EDGE - base.w + TITLE_BAR_KEEP_ON_SCREEN, area.width - TITLE_BAR_KEEP_ON_SCREEN),
      y: clamp(base.y + dy, 0, area.height - 28),
      w: base.w,
      h: base.h,
    };
  }

  let { x, y, w, h } = base;

  if (mode.includes('e')) w = clamp(base.w + dx, win.minWidth, area.width - base.x);
  if (mode.includes('s')) h = clamp(base.h + dy, win.minHeight, area.height - base.y);
  if (mode.includes('w')) {
    w = clamp(base.w - dx, win.minWidth, base.x + base.w);
    x = base.x + base.w - w;
  }
  if (mode.includes('n')) {
    h = clamp(base.h - dy, win.minHeight, base.y + base.h);
    y = base.y + base.h - h;
  }
  return { x, y, w, h };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

export const MemoWindow = memoize(Window);
