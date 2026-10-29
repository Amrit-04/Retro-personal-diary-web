/**
 * Taskbar: Start button, one button per open window (rendered by the window
 * manager into .taskbtns), and a tray with the mute toggle and a local clock.
 * The Start menu holds exactly three things: File Explorer, New Entry (admin only)
 * and Log Off.
 */
import '../styles/taskbar.css';
import { h, setText } from '../lib/dom';
import {
  folderIconSvg,
  logOffIconSvg,
  mutedIconSvg,
  newEntryIconSvg,
  restartIconSvg,
  startMarkSvg,
  userAvatarSvg,
  volumeIconSvg,
} from './icons';
import { ask } from './dialog';
import { isMuted, toggleMuted } from '../boot/sound';
import type { Session } from '../firebase/auth';

export interface TaskbarOptions {
  session: Session;
  onLogOff: () => void;
  onRestart: () => void;
  onOpenExplorer: () => void;
  /** Provided only once the admin editor is wired up, so the menu has no dead item. */
  onNewEntry?: () => void;
}

export function mountTaskbar(options: TaskbarOptions): HTMLElement {
  let menu: HTMLElement | null = null;

  const startButton = h('button', {
    class: 'tb-start',
    type: 'button',
    'aria-label': 'Start',
    'aria-haspopup': 'true',
    'aria-expanded': 'false',
  }, [h('span', { class: 'tb-start-mark', html: startMarkSvg() }), 'start']);

  const buttons = h('div', { class: 'taskbtns', role: 'toolbar', 'aria-label': 'Open windows' });

  const muteButton = h('button', {
    class: 'tb-tray-btn',
    type: 'button',
    'aria-pressed': String(isMuted()),
    'aria-label': isMuted() ? 'Unmute startup sound' : 'Mute startup sound',
    html: isMuted() ? mutedIconSvg() : volumeIconSvg(),
    onclick: () => {
      const muted = toggleMuted();
      muteButton.setAttribute('aria-pressed', String(muted));
      muteButton.setAttribute('aria-label', muted ? 'Unmute startup sound' : 'Mute startup sound');
      setHtml(muteButton, muted ? mutedIconSvg() : volumeIconSvg());
    },
  });

  const clock = h('span', { class: 'tb-clock', 'aria-live': 'off' }, clockText());
  startClock(clock);

  const taskbar = h('div', { class: 'taskbar', role: 'contentinfo' }, [
    startButton,
    buttons,
    h('div', { class: 'tb-tray' }, [muteButton, clock]),
  ]);

  startButton.addEventListener('click', (event) => {
    event.stopPropagation();
    menu ? closeMenu() : openMenu();
  });

  function openMenu(): void {
    const main: HTMLElement[] = [
      menuItem('File Explorer', folderIconSvg(), 'Years, months and entries', () => {
        closeMenu();
        options.onOpenExplorer();
      }),
    ];

    // The claim only decides visibility; firestore.rules decides what is allowed.
    if (options.session.hasAdminClaim && options.onNewEntry) {
      const open = options.onNewEntry;
      main.push(menuItem('New Entry', newEntryIconSvg(), "Write today's page", () => {
        closeMenu();
        open();
      }));
    }

    menu = h('div', { class: 'start-menu', role: 'menu', 'aria-label': 'Start menu' }, [
      h('div', { class: 'sm-head' }, [
        h('span', { class: 'sm-avatar', html: userAvatarSvg() }),
        h('span', { class: 'sm-name' }, options.session.name),
      ]),
      h('div', { class: 'sm-body' }, [
        h('div', { class: 'sm-main' }, main),
        h('div', { class: 'sm-side' }, [
          sideItem('Log Off', logOffIconSvg(), () => {
            closeMenu();
            void logOffDialog(options);
          }),
          sideItem('Restart', restartIconSvg(), () => {
            closeMenu();
            options.onRestart();
          }),
        ]),
      ]),
      h('div', { class: 'sm-foot' }, [
        h('span', { class: 'sm-foot-brand' }, 'Diary XP'),
        h('span', { class: 'sm-foot-user' }, options.session.name),
      ]),
    ]);

    document.body.appendChild(menu);
    startButton.setAttribute('aria-expanded', 'true');
    // Deferred so the click that opened the menu does not immediately close it.
    requestAnimationFrame(() => {
      document.addEventListener('click', closeMenu);
      menu?.querySelector<HTMLElement>('.sm-item, .sm-side-item')?.focus({ preventScroll: true });
    });
    document.addEventListener('keydown', onMenuKey);
  }

  function closeMenu(): void {
    const hadFocus = menu?.contains(document.activeElement);
    menu?.remove();
    menu = null;
    startButton.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', closeMenu);
    document.removeEventListener('keydown', onMenuKey);
    if (hadFocus) startButton.focus({ preventScroll: true });
  }

  const onMenuKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') closeMenu();
  };

  return taskbar;
}

function menuItem(label: string, icon: string, description: string, onSelect: () => void): HTMLElement {
  return h('button', { class: 'sm-item', type: 'button', role: 'menuitem', onclick: onSelect }, [
    h('span', { class: 'sm-icon', html: icon }),
    h('span', { class: 'sm-text' }, [
      h('span', { class: 'sm-title' }, label),
      h('span', { class: 'sm-desc' }, description),
    ]),
  ]);
}

function sideItem(label: string, icon: string, onSelect: () => void): HTMLElement {
  return h('button', { class: 'sm-side-item', type: 'button', role: 'menuitem', onclick: onSelect }, [
    h('span', { html: icon }),
    label,
  ]);
}

/** The XP-style three-button question: Log Off, Restart, Cancel. */
async function logOffDialog(options: TaskbarOptions): Promise<void> {
  const choice = await ask({
    title: 'Log Off Diary',
    message: 'Are you sure you want to log off?',
    actions: [
      { label: 'Log Off', value: 'off', kind: 'primary' },
      { label: 'Restart', value: 'restart' },
      { label: 'Cancel', value: 'cancel' },
    ],
    focusValue: 'cancel',
  });

  if (choice === 'off') options.onLogOff();
  else if (choice === 'restart') options.onRestart();
}

function clockText(): string {
  return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/**
 * One self-terminating loop: it stops by itself when the node leaves the document,
 * so nothing leaks when the desktop is unmounted at log off.
 */
function startClock(node: HTMLElement): void {
  const tick = () => {
    if (!node.isConnected) return;
    setText(node, clockText());
    setTimeout(tick, 1000 - (Date.now() % 1000));
  };
  tick();
}

function setHtml(node: HTMLElement, markup: string): void {
  node.innerHTML = markup;
}
