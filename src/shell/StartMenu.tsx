/**
 * The Start menu: the programs on the left, the last week's entries on the right,
 * and Log Off / Restart in the footer band.
 *
 * It is a plain absolutely-positioned panel above the taskbar — no portal, no
 * stacking context trick — and the desktop's own pointerdown closes it, which is how
 * XP behaves when you click anywhere else.
 */
import { useEffect } from 'preact/hooks';
import { signal } from '@preact/signals';
import { restart, session } from '../boot/machine';
import { fileName } from '../lib/slug';
import { showLogOff } from './dialogs';
import { launch } from './launch';
import { loadRecent, recent } from './recent';
import { XpIcon } from './icons';
import { LogoMark } from './marks';
import './startmenu.css';

export const startOpen = signal(false);

export function StartMenu() {
  const user = session.value;
  const isAdmin = user?.hasAdminClaim === true;
  const entries = (recent.value ?? []).slice(0, 6);

  useEffect(() => {
    void loadRecent();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') startOpen.value = false;
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const pick = (action: () => void) => () => {
    startOpen.value = false;
    action();
  };

  return (
    <div class="sm" onPointerDown={(event) => event.stopPropagation()} role="menu" aria-label="Start">
      <div class="sm-head">
        <span class="sm-avatar">
          {user?.photoURL ? (
            <img src={user.photoURL} width={42} height={42} alt="" referrerPolicy="no-referrer" />
          ) : (
            <XpIcon name="user" size={38} />
          )}
        </span>
        <span class="sm-name">{user?.name ?? 'Owner'}</span>
        <span class="sm-mark">
          <LogoMark size={22} />
        </span>
      </div>

      <div class="sm-body">
        <div class="sm-left">
          <button class="sm-item" type="button" role="menuitem" onClick={pick(() => launch('explorer'))}>
            <XpIcon name="folder" size={30} />
            <span>File Explorer</span>
          </button>
          <button class="sm-item" type="button" role="menuitem" onClick={pick(() => launch('minesweeper'))}>
            <XpIcon name="mine" size={30} />
            <span>Minesweeper</span>
          </button>
          {isAdmin && (
            <button class="sm-item" type="button" role="menuitem" onClick={pick(() => launch('editor'))}>
              <XpIcon name="notepad" size={30} />
              <span>New Entry</span>
            </button>
          )}
          <span class="sm-sep sm-sep--left" />
          <p class="sm-hint">Newest entries sit on the desktop. Everything older is in File Explorer.</p>
        </div>

        <div class="sm-right">
          {entries.map((entry) => (
            <button
              class="sm-item sm-item--side"
              type="button"
              key={entry.date}
              role="menuitem"
              onClick={pick(() => launch('viewer', { date: entry.date, title: entry.title }))}
            >
              {entry.thumbUrl || entry.imageUrl ? (
                <img class="sm-thumb" src={entry.thumbUrl || entry.imageUrl} width={22} height={22} alt="" />
              ) : (
                <XpIcon name="text" size={22} />
              )}
              <span>{fileName(entry.title)}</span>
            </button>
          ))}
          {entries.length === 0 && <p class="sm-hint sm-hint--side">Nothing written in the last seven days.</p>}
        </div>
      </div>

      <div class="sm-foot">
        <button class="sm-foot-item" type="button" onClick={pick(showLogOff)}>
          <XpIcon name="logoff" size={22} />
          <span>Log Off</span>
        </button>
        <button class="sm-foot-item" type="button" onClick={pick(restart)}>
          <XpIcon name="restart" size={22} />
          <span>Restart</span>
        </button>
      </div>
    </div>
  );
}
