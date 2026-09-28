import { el } from '../utils/dom';
import { UserSession } from '../types';
import { navigate, getCurrentRoute } from '../router';
import { logout } from '../auth';
import { showRetroConfirm, showRetroAlert } from './modal';
import {
  getXpStartLogoSvg,
  getFileExplorerIconSvg,
  getNewEntryIconSvg,
  getDocumentIconSvg,
  getXpUserAvatarSvg,
  getXpLogOffIconSvg,
  getXpShutDownIconSvg
} from './icons';

let isStartMenuOpen = false;

export function renderTaskbar(currentUser: UserSession | null, activeWindowTitle?: string): HTMLElement {
  const taskbar = el('footer', { class: 'taskbar' });

  // 1. XP Green Start Button
  const startBtn = el('button', {
    class: `xp-start-button ${isStartMenuOpen ? 'active' : ''}`,
    onclick: (e: MouseEvent) => {
      e.stopPropagation();
      toggleStartMenu();
    }
  }, [
    el('span', { innerHTML: getXpStartLogoSvg() }),
    el('span', { class: 'xp-start-text' }, ['start'])
  ]);

  const taskbarLeft = el('div', { class: 'taskbar-left' }, [startBtn]);

  // 2. Taskbar Window Tabs
  const taskbarItems = el('div', { class: 'taskbar-items' });

  if (activeWindowTitle) {
    const windowTab = el('div', {
      class: 'taskbar-window-tab active',
      title: activeWindowTitle,
      onclick: () => {
        // Window is currently open and focused
      }
    }, [
      el('span', {}, [activeWindowTitle])
    ]);
    taskbarItems.appendChild(windowTab);
  }

  taskbarLeft.appendChild(taskbarItems);

  // 3. Taskbar Right (Notification / System Tray)
  const taskbarRight = el('div', { class: 'taskbar-right' });
  const tray = el('div', { class: 'taskbar-tray' });

  if (currentUser) {
    const userLabel = el('span', { class: 'taskbar-user-badge', title: currentUser.email || '' }, [
      currentUser.displayName || 'User'
    ]);
    tray.appendChild(userLabel);

    if (currentUser.isAdmin) {
      const adminPill = el('span', { class: 'taskbar-admin-pill' }, ['ADMIN']);
      tray.appendChild(adminPill);
    }
  }

  // Live Digital Clock
  const clockEl = el('span', { id: 'taskbar-clock' }, [formatCurrentTime()]);
  tray.appendChild(clockEl);
  taskbarRight.appendChild(tray);

  taskbar.appendChild(taskbarLeft);
  taskbar.appendChild(taskbarRight);

  // 4. Start Menu Popup (rendered conditionally)
  if (isStartMenuOpen) {
    const startMenu = renderStartMenu(currentUser);
    taskbar.appendChild(startMenu);
  }

  return taskbar;
}

function renderStartMenu(currentUser: UserSession | null): HTMLElement {
  const popup = el('div', {
    class: 'xp-start-menu',
    onclick: (e: MouseEvent) => e.stopPropagation()
  });

  // Start Menu Header with User Avatar
  const username = currentUser?.displayName || (currentUser?.isAdmin ? 'Administrator' : 'Amanda');
  const header = el('div', { class: 'start-menu-header' }, [
    el('div', { class: 'start-menu-avatar', innerHTML: getXpUserAvatarSvg() }),
    el('div', { class: 'start-menu-username' }, [username])
  ]);
  popup.appendChild(header);

  // Two-Column Body
  const body = el('div', { class: 'start-menu-body' });

  // Left Column: Frequent Apps & Programs
  const leftCol = el('div', { class: 'start-menu-left' });

  // Diary Archive (File Explorer)
  leftCol.appendChild(createStartMenuItem({
    iconSvg: getFileExplorerIconSvg(),
    title: 'Diary Archive',
    desc: 'Browse personal diary by Year & Month',
    onClick: () => {
      isStartMenuOpen = false;
      navigate('#/explorer');
    }
  }));

  // New Entry (Admin Only)
  if (currentUser?.isAdmin) {
    leftCol.appendChild(createStartMenuItem({
      iconSvg: getNewEntryIconSvg(),
      title: 'New Entry.exe',
      desc: 'Create or edit daily journal',
      onClick: () => {
        isStartMenuOpen = false;
        navigate('#/new');
      }
    }));
  }

  // Desktop
  leftCol.appendChild(createStartMenuItem({
    iconSvg: getDocumentIconSvg(),
    title: 'Desktop',
    desc: 'Show recent 7-day diary files',
    onClick: () => {
      isStartMenuOpen = false;
      navigate('#/');
    }
  }));

  body.appendChild(leftCol);

  // Right Column: System Destinations
  const rightCol = el('div', { class: 'start-menu-right' });

  rightCol.appendChild(createRightMenuItem('📂', 'My Diary Files', () => {
    isStartMenuOpen = false;
    navigate('#/explorer');
  }));

  rightCol.appendChild(createRightMenuItem('🖼️', 'My Doodles', () => {
    isStartMenuOpen = false;
    navigate('#/explorer');
  }));

  rightCol.appendChild(el('div', { class: 'start-menu-separator' }));

  rightCol.appendChild(createRightMenuItem('⚙️', 'Control Panel', () => {
    isStartMenuOpen = false;
    showRetroAlert('Control Panel', 'Retro Diary OS v1.0 — Windows XP Edition.\nAll administrative settings are automatically configured.', 'ℹ️');
  }));

  rightCol.appendChild(createRightMenuItem('❓', 'Help and Support', () => {
    isStartMenuOpen = false;
    showRetroAlert('Help and Support', 'Retro Diary OS lets you write and archive daily thoughts with custom doodle art.\n- Click on desktop icons to read recent entries.\n- Open Diary Archive to explore historical entries.', '💡');
  }));

  body.appendChild(rightCol);
  popup.appendChild(body);

  // Footer: Log Off and Turn Off Computer
  const footer = el('div', { class: 'start-menu-footer' });

  const logOffBtn = el('div', {
    class: 'start-menu-footer-btn',
    onclick: async () => {
      isStartMenuOpen = false;
      const confirm = await showRetroConfirm('Log Off Windows', 'Are you sure you want to log off your session?');
      if (confirm) {
        await logout();
        navigate('#/login');
      }
    }
  }, [
    el('span', { innerHTML: getXpLogOffIconSvg() }),
    el('span', {}, ['Log Off'])
  ]);

  const shutDownBtn = el('div', {
    class: 'start-menu-footer-btn',
    onclick: async () => {
      isStartMenuOpen = false;
      const confirm = await showRetroConfirm('Shut Down Windows', 'Would you like to sign out and shut down Retro Diary OS?');
      if (confirm) {
        await logout();
        navigate('#/login');
      }
    }
  }, [
    el('span', { innerHTML: getXpShutDownIconSvg() }),
    el('span', {}, ['Turn Off Computer'])
  ]);

  footer.appendChild(logOffBtn);
  footer.appendChild(shutDownBtn);
  popup.appendChild(footer);

  return popup;
}

function createStartMenuItem(opts: {
  iconSvg: string;
  title: string;
  desc: string;
  onClick: () => void;
}): HTMLElement {
  const row = el('div', {
    class: 'start-menu-item-row',
    onclick: opts.onClick
  }, [
    el('div', { class: 'start-menu-item-icon', innerHTML: opts.iconSvg }),
    el('div', { class: 'start-menu-item-text' }, [
      el('div', { class: 'start-menu-item-title' }, [opts.title]),
      el('div', { class: 'start-menu-item-desc' }, [opts.desc])
    ])
  ]);
  return row;
}

function createRightMenuItem(iconEmoji: string, title: string, onClick: () => void): HTMLElement {
  return el('div', {
    class: 'start-menu-item-row',
    onclick: onClick
  }, [
    el('span', { style: { fontSize: '14px', width: '20px', textAlign: 'center' } }, [iconEmoji]),
    el('div', { class: 'start-menu-item-text' }, [
      el('div', { class: 'start-menu-item-title' }, [title])
    ])
  ]);
}

function toggleStartMenu() {
  isStartMenuOpen = !isStartMenuOpen;
  refreshTaskbarDom();
}

function refreshTaskbarDom() {
  const existingTaskbar = document.querySelector('.taskbar');
  if (existingTaskbar && existingTaskbar.parentElement) {
    const parent = existingTaskbar.parentElement;
    const currentUser = (window as any).__CURRENT_USER__ || null;
    const route = getCurrentRoute();
    let title: string | undefined;
    if (route.name === 'explorer') title = 'Diary Archive';
    if (route.name === 'viewer') title = `Entry: ${route.params.date || ''}`;
    if (route.name === 'editor') title = 'Diary Editor';

    const newTaskbar = renderTaskbar(currentUser, title);
    parent.replaceChild(newTaskbar, existingTaskbar);
  }
}

// Close start menu when clicking anywhere on the window
window.addEventListener('click', () => {
  if (isStartMenuOpen) {
    isStartMenuOpen = false;
    refreshTaskbarDom();
  }
});

function formatCurrentTime(): string {
  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

// Update clock periodically
setInterval(() => {
  const clock = document.getElementById('taskbar-clock');
  if (clock) {
    clock.textContent = formatCurrentTime();
  }
}, 20000);
