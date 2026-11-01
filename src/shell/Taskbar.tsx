/**
 * The taskbar: Start, one button per open window, and a tray with the volume switch
 * and a local clock.
 *
 * The markup and every class name are the reference's (`Footer/index.js`): a
 * `.footer` with a `.footer__items.left` run of `.footer__window` buttons and a
 * `.footer__items.right` tray. The clock is its own component, so ticking repaints a
 * single text node instead of the whole bar.
 */
import { useEffect, useState } from 'preact/hooks';
import { muted, toggleMuted } from '../boot/sound';
import { StartMenu, startOpen } from './StartMenu';
import { XpIcon } from './icons';
import { LogoMark } from './marks';
import { activeId, focus, minimize, windows, type WindowState } from './windows';
import './footer.css';

export function Taskbar() {
  const list = windows.value;
  const active = activeId.value;

  const onTaskPointerDown = (win: WindowState) => {
    if (win.id === active && !win.minimized) minimize(win.id);
    else focus(win.id);
  };

  return (
    <footer class="footer">
      <div class="footer__items left">
        <div class="footer__start__menu">{startOpen.value && <StartMenu />}</div>

        <button
          class="footer__start"
          type="button"
          aria-haspopup="true"
          aria-expanded={startOpen.value}
          onPointerDown={(event) => {
            event.stopPropagation();
            startOpen.value = !startOpen.value;
          }}
        >
          <LogoMark size={20} />
          <span>start</span>
        </button>

        {list.map((win) => (
          <button
            key={win.id}
            class={`footer__window ${win.id === active && !win.minimized ? 'focus' : 'cover'}`}
            type="button"
            onPointerDown={() => onTaskPointerDown(win)}
          >
            <span class="footer__icon">
              <XpIcon name={win.icon} size={15} />
            </span>
            <span class="footer__text">{win.title}</span>
          </button>
        ))}
      </div>

      <div class="footer__items right">
        <button
          class="footer__tray-button"
          type="button"
          aria-pressed={!muted.value}
          aria-label={muted.value ? 'Unmute the startup sound' : 'Mute the startup sound'}
          title={muted.value ? 'Sound is off' : 'Sound is on'}
          onClick={toggleMuted}
        >
          <XpIcon name={muted.value ? 'volume-muted' : 'volume'} size={15} />
        </button>
        <Clock />
      </div>
    </footer>
  );
}

/** "12:49 PM" — the reference's own formatter. */
function Clock() {
  const [text, setText] = useState(getTime);

  useEffect(() => {
    const timer = setInterval(() => {
      const next = getTime();
      setText((current) => (next === current ? current : next));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return <span class="footer__time">{text}</span>;
}

function getTime(): string {
  const date = new Date();
  let hour = date.getHours();
  let hourPostFix = 'AM';
  let min: string | number = date.getMinutes();
  if (hour >= 12) {
    hour -= 12;
    hourPostFix = 'PM';
  }
  if (hour === 0) {
    hour = 12;
  }
  if (min < 10) {
    min = '0' + min;
  }
  return `${hour}:${min} ${hourPostFix}`;
}
