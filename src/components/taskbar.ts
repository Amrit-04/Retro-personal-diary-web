import { el } from '../utils/dom';
import { UserSession } from '../types';
import { navigate, getCurrentRoute } from '../router';
import { logout } from '../auth';
import { showRetroConfirm } from './modal';

let isStartMenuOpen = false;

export function renderTaskbar(currentUser: UserSession | null, activeWindowTitle?: string): HTMLElement {
  const taskbar = el('footer', { class: 'taskbar' });

  // Start Button
  const startBtn = el('button', {
    class: `bevel-button start-button ${isStartMenuOpen ? 'active' : ''}`,
    onclick: (e: MouseEvent) => {
      e.stopPropagation();
      toggleStartMenu();
    }
  }, [
    el('span', { class: 'start-button-logo' }, ['💾']),
    el('span', {}, ['Start'])
  ]);

  const taskbarLeft = el('div', { class: 'taskbar-left' }, [startBtn]);

  // Window Tab if a window is active
  if (activeWindowTitle) {
    const windowTab = el('div', {
      class: 'bevel-button taskbar-window-tab active',
      onclick: () => {
        // Window is already active
      }
    }, [activeWindowTitle]);
    taskbarLeft.appendChild(windowTab);
  }

  // Taskbar Right (User Info, Admin Badge, Clock)
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

  // Live Clock
  const clockEl = el('span', { id: 'taskbar-clock' }, [formatCurrentTime()]);
  tray.appendChild(clockEl);
  taskbarRight.appendChild(tray);

  taskbar.appendChild(taskbarLeft);
  taskbar.appendChild(taskbarRight);

  // Start Menu Popup (rendered conditionally)
  if (isStartMenuOpen) {
    const startMenu = renderStartMenu(currentUser);
    taskbar.appendChild(startMenu);
  }

  return taskbar;
}

function renderStartMenu(currentUser: UserSession | null): HTMLElement {
  const popup = el('div', {
    class: 'start-menu-popup',
    onclick: (e: MouseEvent) => e.stopPropagation()
  });

  const banner = el('div', { class: 'start-menu-banner' }, [
    el('span', {}, ['Retro Diary OS'])
  ]);
  popup.appendChild(banner);

  const itemsContainer = el('div', { class: 'start-menu-items' });

  // Home / Desktop
  itemsContainer.appendChild(el('div', {
    class: 'start-menu-item',
    onclick: () => {
      isStartMenuOpen = false;
      navigate('#/');
    }
  }, [
    el('span', {}, ['🖥️']),
    el('span', {}, ['Desktop (Recent)'])
  ]));

  // File Explorer
  itemsContainer.appendChild(el('div', {
    class: 'start-menu-item',
    onclick: () => {
      isStartMenuOpen = false;
      navigate('#/explorer');
    }
  }, [
    el('span', {}, ['📂']),
    el('span', {}, ['Diary Archive'])
  ]));

  // Admin: New Entry option
  if (currentUser && currentUser.isAdmin) {
    itemsContainer.appendChild(el('div', {
      class: 'start-menu-item',
      onclick: () => {
        isStartMenuOpen = false;
        navigate('#/new');
      }
    }, [
      el('span', {}, ['✏️']),
      el('span', {}, ['New Entry...'])
    ]));
  }

  // Separator
  itemsContainer.appendChild(el('div', { class: 'start-menu-separator' }));

  // Sign out
  itemsContainer.appendChild(el('div', {
    class: 'start-menu-item',
    onclick: async () => {
      isStartMenuOpen = false;
      const confirm = await showRetroConfirm('Sign Out', 'Are you sure you want to shut down your session?');
      if (confirm) {
        await logout();
        navigate('#/login');
      }
    }
  }, [
    el('span', {}, ['🚪']),
    el('span', {}, ['Shut Down / Sign Out...'])
  ]));

  popup.appendChild(itemsContainer);
  return popup;
}

function toggleStartMenu() {
  isStartMenuOpen = !isStartMenuOpen;
  // Re-render taskbar
  const existingTaskbar = document.querySelector('.taskbar');
  if (existingTaskbar && existingTaskbar.parentElement) {
    const parent = existingTaskbar.parentElement;
    const currentUser = (window as any).__CURRENT_USER__ || null;
    const route = getCurrentRoute();
    let title: string | undefined;
    if (route.name === 'explorer') title = '📂 Diary Archive';
    if (route.name === 'viewer') title = `📖 Entry: ${route.params.date || ''}`;
    if (route.name === 'editor') title = '✏️ Diary Editor';

    const newTaskbar = renderTaskbar(currentUser, title);
    parent.replaceChild(newTaskbar, existingTaskbar);
  }
}

// Close start menu when clicking anywhere else
window.addEventListener('click', () => {
  if (isStartMenuOpen) {
    isStartMenuOpen = false;
    const existingTaskbar = document.querySelector('.taskbar');
    if (existingTaskbar && existingTaskbar.parentElement) {
      const parent = existingTaskbar.parentElement;
      const currentUser = (window as any).__CURRENT_USER__ || null;
      const route = getCurrentRoute();
      let title: string | undefined;
      if (route.name === 'explorer') title = '📂 Diary Archive';
      if (route.name === 'viewer') title = `📖 Entry: ${route.params.date || ''}`;
      if (route.name === 'editor') title = '✏️ Diary Editor';

      const newTaskbar = renderTaskbar(currentUser, title);
      parent.replaceChild(newTaskbar, existingTaskbar);
    }
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

// Update clock every 30 seconds
setInterval(() => {
  const clock = document.getElementById('taskbar-clock');
  if (clock) {
    clock.textContent = formatCurrentTime();
  }
}, 30000);
