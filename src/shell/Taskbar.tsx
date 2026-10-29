/**
 * The taskbar: Start, one button per open window, and a tray with the volume switch
 * and a local clock.
 *
 * The clock is its own component, so ticking re-renders one text node instead of the
 * whole bar. On a phone the bar is 44px tall: the brief's tap-target floor outranks
 * the 30px measurement from the desktop reference, and the gradient carries the
 * identity either way.
 */
import { useEffect, useState } from 'preact/hooks';
import { muted, toggleMuted } from '../boot/sound';
import { session } from '../boot/machine';
import { startOpen } from './StartMenu';
import { XpIcon } from './icons';
import { LogoMark, StartLabel } from './marks';
import { activeId, focus, minimize, windows, type WindowState } from './windows';
import './taskbar.css';

export function Taskbar() {
  const list = windows.value;
  const active = activeId.value;

  const onTaskClick = (win: WindowState) => {
    if (win.id === active && !win.minimized) minimize(win.id);
    else focus(win.id);
  };

  return (
    <div class="taskbar">
      <button
        class={`tb-start${startOpen.value ? ' is-open' : ''}`}
        type="button"
        aria-haspopup="true"
        aria-expanded={startOpen.value}
        onClick={toggleStart}
      >
        <LogoMark size={18} />
        <StartLabel />
      </button>

      <div class="tb-tasks">
        {list.map((win) => (
          <button
            key={win.id}
            class={`tb-task${win.id === active && !win.minimized ? ' is-active' : ''}`}
            type="button"
            onClick={() => onTaskClick(win)}
          >
            <XpIcon name={win.icon} size={16} />
            <span class="tb-task-text">{win.title}</span>
          </button>
        ))}
      </div>

      <div class="tb-tray">
        <button
          class="tb-tray-button"
          type="button"
          aria-pressed={!muted.value}
          aria-label={muted.value ? 'Unmute the startup sound' : 'Mute the startup sound'}
          title={muted.value ? 'Sound is off' : 'Sound is on'}
          onClick={toggleMuted}
        >
          <XpIcon name={muted.value ? 'volume-muted' : 'volume'} size={16} />
        </button>
        <Clock />
      </div>
    </div>
  );
}

function toggleStart(event: MouseEvent): void {
  event.stopPropagation();
  startOpen.value = !startOpen.value;
}

/** "10:53" — local time, no seconds, so a repaint happens once a minute at most. */
function Clock() {
  const [text, setText] = useState(() => clockText(new Date()));

  useEffect(() => {
    const tick = () => setText(clockText(new Date()));
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, []);

  // The owner's name sits where XP put it: in the tray, left of the clock.
  const owner = session.value?.name;
  return (
    <span class="tb-clock" title={owner ?? undefined}>
      {text}
    </span>
  );
}

function clockText(date: Date): string {
  const hours = date.getHours() % 12 || 12;
  return `${hours}:${String(date.getMinutes()).padStart(2, '0')}`;
}
