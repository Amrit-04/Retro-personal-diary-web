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
}

export function createRetroWindow(
  options: WindowOptions,
  content: HTMLElement
): HTMLElement {
  const overlay = el('div', { class: 'retro-window-overlay' });

  const titlebarLeft = el('div', { class: 'window-titlebar-left' }, [
    el('span', { class: 'window-title-icon' }, [options.icon || '💾']),
    el('span', {}, [options.title]),
  ]);

  const closeBtn = el('button', {
    class: 'window-btn',
    onclick: (e: MouseEvent) => {
      e.stopPropagation();
      if (options.onClose) {
        options.onClose();
      }
    }
  }, ['✕']);

  const titlebar = el('div', { class: 'window-titlebar' }, [
    titlebarLeft,
    el('div', { class: 'window-controls' }, [closeBtn])
  ]);

  const windowContainer = el('div', {
    class: 'retro-window',
    style: {
      width: options.width || '720px',
      maxHeight: options.maxHeight || 'calc(100vh - var(--taskbar-height) - 32px)'
    },
    onclick: (e: MouseEvent) => e.stopPropagation()
  });

  windowContainer.appendChild(titlebar);

  // Optional Menu bar
  if (options.menuItems && options.menuItems.length > 0) {
    const menubar = el('div', { class: 'window-menubar' });
    for (const item of options.menuItems) {
      const menuEl = el('span', {
        class: 'window-menu-item',
        onclick: item.action
      }, [item.label]);
      menubar.appendChild(menuEl);
    }
    windowContainer.appendChild(menubar);
  }

  // Window Body
  const bodyEl = el('div', { class: 'window-body' }, [content]);
  windowContainer.appendChild(bodyEl);

  // Optional Status bar
  if (options.statusLeft !== undefined || options.statusRight !== undefined) {
    const statusbar = el('div', { class: 'window-statusbar' }, [
      el('div', { class: 'statusbar-panel' }, [options.statusLeft || 'Ready']),
      el('div', { class: 'statusbar-panel' }, [options.statusRight || 'Retro OS v1.0']),
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
