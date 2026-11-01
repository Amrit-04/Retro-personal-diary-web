/**
 * The Start menu: the programs on the left, the last seven days on the right, and
 * Log Off in the footer band.
 *
 * The structure, class names and geometry are the reference's
 * (`Footer/FooterMenu.js`): a 54px gradient header, a white 190px program column, a
 * light blue 190px shortcut column split by the orange rule, and a 36px footer.
 * The submenu machinery is gone with the apps it opened.
 */
import { useEffect } from 'preact/hooks';
import { signal } from '@preact/signals';
import { session } from '../boot/machine';
import { shortDate } from '../lib/dates';
import { fileName } from '../lib/slug';
import { showLogOff } from './dialogs';
import { launch } from './launch';
import { loadRecent, recent } from './recent';
import { XpIcon, type IconName } from './icons';
import './footer-menu.css';

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
    <div
      class="footer-menu"
      role="menu"
      aria-label="Start"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <header>
        {user?.photoURL ? (
          <img class="header__img" src={user.photoURL} alt="" referrerPolicy="no-referrer" />
        ) : (
          <span class="header__img header__img--icon">
            <XpIcon name="user" size={38} />
          </span>
        )}
        <span class="header__text">{user?.name ?? 'Owner'}</span>
      </header>

      <section class="menu">
        <hr class="orange-hr" />

        <div class="menu__left">
          <MenuItem
            icon="folder"
            label="File Explorer"
            onPick={pick(() => launch('explorer'))}
          />
          <MenuItem
            icon="mine"
            label="Minesweeper"
            onPick={pick(() => launch('minesweeper'))}
          />
          {isAdmin && (
            <MenuItem icon="notepad" label="New Entry" onPick={pick(() => launch('editor'))} />
          )}
        </div>

        <div class="menu__right">
          {entries.map((entry) => (
            <button
              class="menu__item menu__item--entry"
              type="button"
              key={entry.date}
              role="menuitem"
              onClick={pick(() => launch('viewer', { date: entry.date, title: entry.title }))}
            >
              <span class="menu__item__img">
                {entry.thumbUrl || entry.imageUrl ? (
                  <img
                    class="menu__thumb"
                    src={entry.thumbUrl || entry.imageUrl}
                    width={22}
                    height={22}
                    alt=""
                    loading="lazy"
                  />
                ) : (
                  <XpIcon name="text" size={22} />
                )}
              </span>
              <span class="menu__item__texts">
                <span class="menu__item__text">{fileName(entry.title)}</span>
                <span class="menu__item__subtext">{shortDate(entry.date)}</span>
              </span>
            </button>
          ))}
          {entries.length === 0 && recent.value !== null && (
            <p class="menu__empty">Nothing written in the last seven days.</p>
          )}
        </div>
      </section>

      <footer>
        <button class="footer__item" type="button" onClick={pick(showLogOff)}>
          <span class="footer__item__img">
            <XpIcon name="logoff" size={22} />
          </span>
          <span>Log Off</span>
        </button>
      </footer>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onPick,
}: {
  icon: IconName;
  label: string;
  onPick: () => void;
}) {
  return (
    <button class="menu__item" type="button" role="menuitem" onClick={onPick}>
      <span class="menu__item__img">
        <XpIcon name={icon} size={30} />
      </span>
      <span class="menu__item__texts">
        <span class="menu__item__text">{label}</span>
      </span>
    </button>
  );
}
