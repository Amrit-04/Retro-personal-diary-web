import { el } from '../utils/dom';

export interface WindowOptions {
  title: string;
  icon?: string;
  onClose?: () => void;
  width?: string;
  maxHeight?: string;
  menuItems?: { label: string; action: () => void }[];
  statusLeft?: string;
  statusRight?: string;
  showDefaultMenuBar?: boolean;
}

export function createRetroWindow(
  options: WindowOptions,
  content: HTMLElement
): HTMLElement {
  const overlay = el('div', { class: 'retro-window-overlay' });

  // 1. Title bar Left (Icon + Text)
  const titlebarLeft = el('div', { class: 'window-titlebar-left' }, [
    el('span', { class: 'window-title-icon' }, [options.icon || '📁']),
    el('span', { class: 'window-title-text' }, [options.title]),
  ]);

  // 2. XP Window Controls: Minimize, Maximize, Close
  const minBtn = el('button', {
    class: 'window-btn-xp window-btn-min',
    title: 'Minimize',
    onclick: (e: MouseEvent) => {
      e.stopPropagation();
      if (options.onClose) options.onClose();
    }
  }, ['_']);

  const maxBtn = el('button', {
    class: 'window-btn-xp window-btn-max',
    title: 'Maximize',
    onclick: (e: MouseEvent) => {
      e.stopPropagation();
      // Maximize toggle can toggle window size if needed
    }
  }, ['□']);

  const closeBtn = el('button', {
    class: 'window-btn-xp window-btn-close',
    title: 'Close',
    onclick: (e: MouseEvent) => {
      e.stopPropagation();
      if (options.onClose) {
        options.onClose();
      }
    }
  }, ['✕']);

  const windowControls = el('div', { class: 'window-controls' }, [
    minBtn,
    maxBtn,
    closeBtn
  ]);

  const titlebar = el('div', { class: 'window-titlebar' }, [
    titlebarLeft,
    windowControls
  ]);

  const windowContainer = el('div', {
    class: 'retro-window',
    style: {
      width: options.width || '760px',
      maxHeight: options.maxHeight || 'calc(100vh - var(--taskbar-height) - 32px)'
    },
    onclick: (e: MouseEvent) => e.stopPropagation()
  });

  windowContainer.appendChild(titlebar);

  // 3. XP Menu bar (File, Edit, View, Favorites, Tools, Help)
  const menubar = el('div', { class: 'window-menubar' });
  if (options.menuItems && options.menuItems.length > 0) {
    for (const item of options.menuItems) {
      const menuEl = el('span', {
        class: 'window-menu-item',
        onclick: item.action
      }, [item.label]);
      menubar.appendChild(menuEl);
    }
    windowContainer.appendChild(menubar);
  } else if (options.showDefaultMenuBar !== false) {
    const defaultMenus = ['File', 'Edit', 'View', 'Favorites', 'Tools', 'Help'];
    for (const label of defaultMenus) {
      const menuEl = el('span', { class: 'window-menu-item' }, [label]);
      menubar.appendChild(menuEl);
    }
    windowContainer.appendChild(menubar);
  }

  // 4. Window Body
  const bodyEl = el('div', { class: 'window-body' }, [content]);
  windowContainer.appendChild(bodyEl);

  // 5. XP Status bar
  if (options.statusLeft !== undefined || options.statusRight !== undefined) {
    const statusbar = el('div', { class: 'window-statusbar' }, [
      el('div', { class: 'statusbar-panel' }, [options.statusLeft || 'Ready']),
      el('div', { class: 'statusbar-panel' }, [options.statusRight || 'My Computer']),
    ]);
    windowContainer.appendChild(statusbar);
  }

  overlay.appendChild(windowContainer);

  // Clicking backdrop (outside the window frame) navigates back / closes
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && options.onClose) {
      options.onClose();
    }
  });

  return overlay;
}
