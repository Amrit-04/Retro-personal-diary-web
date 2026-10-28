import { el, clearElement } from '../utils/dom';
import { DiaryEntry, UserSession } from '../types';
import { getRecentEntries } from '../db/entries';
import { navigate } from '../router';
import { getFileExplorerIconSvg, getNewEntryIconSvg, getDocumentIconSvg } from '../components/icons';
import { formatFriendlyDate } from '../utils/date';

export function renderDesktopView(currentUser: UserSession): HTMLElement {
  const container = el('div', { class: 'desktop-container' });
  const grid = el('div', { class: 'desktop-grid' });

  // Marquee selection elements
  const marquee = el('div', { class: 'desktop-selection-marquee' });
  marquee.style.display = 'none';

  // Context menu
  const contextMenu = el('div', { class: 'xp-context-menu' });
  contextMenu.style.display = 'none';

  container.appendChild(grid);
  container.appendChild(marquee);
  container.appendChild(contextMenu);

  // Load and render desktop icons
  loadDesktopContent(grid, currentUser, marquee, contextMenu);

  return container;
}

async function loadDesktopContent(grid: HTMLElement, currentUser: UserSession, marquee: HTMLElement, contextMenu: HTMLElement) {
  clearElement(grid);

  // 1. System Icon: Diary Archive (File Explorer)
  const explorerIcon = el('div', {
    class: 'desktop-icon',
    title: 'Diary Archive (My Computer / Explorer)',
    onclick: () => navigate('#/explorer'),
  }, [
    el('div', { class: 'desktop-icon-img-wrapper', innerHTML: getFileExplorerIconSvg() }),
    el('div', { class: 'desktop-icon-label' }, ['Diary Archive'])
  ]);
  grid.appendChild(explorerIcon);

  // 2. System Icon: New Entry (Admin Only)
  if (currentUser.isAdmin) {
    const newEntryIcon = el('div', {
      class: 'desktop-icon',
      title: 'New Entry (Admin Tool)',
      onclick: () => navigate('#/new'),
    }, [
      el('div', { class: 'desktop-icon-img-wrapper', innerHTML: getNewEntryIconSvg() }),
      el('div', { class: 'desktop-icon-label' }, ['New Entry.exe'])
    ]);
    grid.appendChild(newEntryIcon);
  }

  // 3. Load Recent Entries (Last 7 Days) directly onto Desktop without headers
  try {
    const recentEntries = await getRecentEntries();

    for (const entry of recentEntries) {
      const entryIcon = createRecentEntryIcon(entry, grid, contextMenu);
      grid.appendChild(entryIcon);
    }
  } catch (error: any) {
    console.error('Failed to load recent entries:', error);
  }

  // Add marquee selection and context menu handlers
  setupMarqueeSelection(grid, marquee);
  setupContextMenu(grid, contextMenu, currentUser);
}

function createRecentEntryIcon(entry: DiaryEntry, grid: HTMLElement, contextMenu: HTMLElement): HTMLElement {
  const imgWrapper = el('div', { class: 'desktop-icon-img-wrapper' });

  if (entry.imageUrl) {
    const img = el('img', {
      src: entry.imageUrl,
      alt: entry.title,
      class: 'desktop-icon-img',
      loading: 'lazy',
    });
    imgWrapper.appendChild(img);
  } else {
    imgWrapper.innerHTML = getDocumentIconSvg();
  }

  // Windows XP style filename: "building-the-retro.txt"
  const safeFilename = formatFilename(entry.title);

  const iconEl = el('div', {
    class: 'desktop-icon',
    title: `${entry.title} (${formatFriendlyDate(entry.date)})`,
    onclick: (e: MouseEvent) => {
      // Handle ctrl+click for multi-select
      if (e.ctrlKey || e.metaKey) {
        iconEl.classList.toggle('selected');
      } else {
        // Clear other selections unless ctrl is held
        clearSelection(grid);
        iconEl.classList.add('selected');
      }
      navigate(`#/entry/${entry.date}`);
    },
    oncontextmenu: (e: MouseEvent) => {
      e.preventDefault();
      // Select this item on right-click if not already selected
      if (!iconEl.classList.contains('selected')) {
        clearSelection(grid);
        iconEl.classList.add('selected');
      }
      showContextMenu(contextMenu, e.pageX, e.pageY, iconEl, grid);
    }
  }, [
    imgWrapper,
    el('div', { class: 'desktop-icon-label' }, [safeFilename])
  ]);

  return iconEl;
}

function formatFilename(title: string): string {
  if (!title) return 'entry.txt';
  const clean = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${clean.substring(0, 20)}.txt`;
}

function clearSelection(grid: HTMLElement) {
  const icons = grid.querySelectorAll('.desktop-icon');
  icons.forEach(icon => icon.classList.remove('selected'));
}

function setupMarqueeSelection(grid: HTMLElement, marquee: HTMLElement) {
  let isDragging = false;
  let startX = 0;
  let startY = 0;

  grid.addEventListener('mousedown', (e) => {
    // Only start marquee on left click, not on icons
    if (e.button === 0 && !(e.target as HTMLElement).closest('.desktop-icon')) {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      marquee.style.left = `${startX}px`;
      marquee.style.top = `${startY}px`;
      marquee.style.width = '0px';
      marquee.style.height = '0px';
      marquee.style.display = 'block';

      // Clear selection when starting marquee (unless shift is held for add-to-selection)
      if (!e.shiftKey) {
        clearSelection(grid);
      }
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const currentX = e.clientX;
    const currentY = e.clientY;

    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    const left = Math.min(currentX, startX);
    const top = Math.min(currentY, startY);

    marquee.style.left = `${left}px`;
    marquee.style.top = `${top}px`;
    marquee.style.width = `${width}px`;
    marquee.style.height = `${height}px`;

    // Select icons inside marquee
    const icons = grid.querySelectorAll('.desktop-icon');
    icons.forEach(icon => {
      const iconRect = icon.getBoundingClientRect();
      const marqueeRect = marquee.getBoundingClientRect();

      const isInside = (
        iconRect.left >= marqueeRect.left &&
        iconRect.right <= marqueeRect.right &&
        iconRect.top >= marqueeRect.top &&
        iconRect.bottom <= marqueeRect.bottom
      );

      if (isInside) {
        icon.classList.add('selected');
      } else if (!e.shiftKey) {
        // Only deselect if shift is not held (allow additive selection with shift)
        icon.classList.remove('selected');
      }
    });
  });

  document.addEventListener('mouseup', (e) => {
    if (isDragging && e.button === 0) {
      isDragging = false;
      marquee.style.display = 'none';
    }
  });
}

function setupContextMenu(grid: HTMLElement, contextMenu: HTMLElement, currentUser: UserSession) {
  // Hide context menu when clicking anywhere else
  document.addEventListener('click', () => {
    contextMenu.style.display = 'none';
  });

  // Desktop background right-click
  grid.addEventListener('contextmenu', (e: MouseEvent) => {
    e.preventDefault();
    if (!(e.target as HTMLElement).closest('.desktop-icon')) {
      clearSelection(grid);
      showDesktopContextMenu(contextMenu, e.pageX, e.pageY, currentUser);
    }
  });
}

function showContextMenu(contextMenu: HTMLElement, x: number, y: number, clickedIcon: HTMLElement, grid: HTMLElement) {
  // Position the context menu
  contextMenu.style.left = `${Math.min(x, window.innerWidth - 160)}px`;
  contextMenu.style.top = `${Math.min(y, window.innerHeight - 200)}px`;
  contextMenu.style.display = 'block';

  // Clear existing menu items
  clearElement(contextMenu);

  // Add menu items based on what's selected
  const selectedIcons = grid.querySelectorAll('.desktop-icon.selected');
  const isSingleItem = selectedIcons.length <= 1;

  if (isSingleItem) {
    // Single item context menu
    addContextMenuItem(contextMenu, 'Open', () => {
      clickedIcon.dispatchEvent(new MouseEvent('click'));
      hideContextMenu(contextMenu);
    });

    addContextMenuDivider(contextMenu);

    addContextMenuItem(contextMenu, 'Properties', () => {
      hideContextMenu(contextMenu);
    });
  } else {
    // Multi-item context menu
    addContextMenuItem(contextMenu, 'Open All', () => {
      selectedIcons.forEach(icon => (icon as HTMLElement).click());
      hideContextMenu(contextMenu);
    });

    addContextMenuDivider(contextMenu);

    addContextMenuItem(contextMenu, 'Properties', () => {
      hideContextMenu(contextMenu);
    });
  }
}

function showDesktopContextMenu(contextMenu: HTMLElement, x: number, y: number, currentUser: UserSession) {
  contextMenu.style.left = `${Math.min(x, window.innerWidth - 160)}px`;
  contextMenu.style.top = `${Math.min(y, window.innerHeight - 200)}px`;
  contextMenu.style.display = 'block';

  clearElement(contextMenu);

  if (currentUser.isAdmin) {
    addContextMenuItem(contextMenu, 'New Entry...', () => {
      hideContextMenu(contextMenu);
      navigate('#/new');
    });
    addContextMenuDivider(contextMenu);
  }

  addContextMenuItem(contextMenu, 'Refresh Desktop', () => {
    hideContextMenu(contextMenu);
    window.location.reload();
  });

  addContextMenuItem(contextMenu, 'Open Diary Archive', () => {
    hideContextMenu(contextMenu);
    navigate('#/explorer');
  });

  addContextMenuDivider(contextMenu);

  addContextMenuItem(contextMenu, 'Properties', () => {
    hideContextMenu(contextMenu);
  });
}

function addContextMenuItem(contextMenu: HTMLElement, label: string, action: () => void) {
  const item = el('div', { class: 'xp-context-menu-item' }, [
    el('span', {}, [label])
  ]);

  item.addEventListener('click', (e) => {
    e.stopPropagation();
    action();
  });

  contextMenu.appendChild(item);
}

function addContextMenuDivider(contextMenu: HTMLElement) {
  const divider = el('div', { class: 'xp-context-menu-divider' });
  contextMenu.appendChild(divider);
}

function hideContextMenu(contextMenu: HTMLElement) {
  contextMenu.style.display = 'none';
}
