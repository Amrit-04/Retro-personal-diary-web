import { el } from '../utils/dom';

let nextZIndex = 101; // Start above the overlay's z-index (100)

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
      maxHeight: options.maxHeight || 'calc(100vh - var(--taskbar-height) - 32px)',
      // Initial position: centered
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: `${nextZIndex++}`
    },
    onclick: (e: MouseEvent) => {
      e.stopPropagation();
      bringToFront(windowContainer);
    }
  });

  // Make the window draggable via the titlebar
  makeDraggable(titlebar, windowContainer);

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

/**
 * Makes a window draggable by its title bar.
 */
function makeDraggable(titlebar: HTMLElement, winEl: HTMLElement) {
  let offsetX = 0;
  let offsetY = 0;
  let isDragging = false;

  const startDrag = (e: MouseEvent) => {
    isDragging = true;
    // Get the window's current position
    const rect = winEl.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    // Bring window to front when dragging starts
    bringToFront(winEl);
    // Prevent text selection
    winEl.style.userSelect = 'none';
    titlebar.style.userSelect = 'none';
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
  };

  const drag = (e: MouseEvent) => {
    if (!isDragging) return;
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    // Constrain to viewport (optional, but keep window visible)
    const maxX = window.innerWidth - winEl.offsetWidth;
    const maxY = window.innerHeight - winEl.offsetHeight;
    winEl.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
    winEl.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
    winEl.style.transform = 'none'; // Remove the centering transform
  };

  const stopDrag = () => {
    isDragging = false;
    winEl.style.userSelect = '';
    titlebar.style.userSelect = '';
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDrag);
  };

  titlebar.addEventListener('mousedown', startDrag);
}

/**
 * Brings a window to the front by assigning the highest z-index.
 */
function bringToFront(winEl: HTMLElement) {
  winEl.style.zIndex = `${nextZIndex++}`;
}
