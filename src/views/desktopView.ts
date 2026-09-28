import { el, clearElement } from '../utils/dom';
import { DiaryEntry, UserSession } from '../types';
import { getRecentEntries } from '../db/entries';
import { navigate } from '../router';
import { getFileExplorerIconSvg, getNewEntryIconSvg, getDocumentIconSvg } from '../components/icons';
import { formatFriendlyDate } from '../utils/date';

export function renderDesktopView(currentUser: UserSession): HTMLElement {
  const container = el('div', { class: 'desktop-container' });
  const grid = el('div', { class: 'desktop-grid' });
  container.appendChild(grid);

  // Load and render desktop icons
  loadDesktopContent(grid, currentUser);

  return container;
}

async function loadDesktopContent(grid: HTMLElement, currentUser: UserSession) {
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
      const entryIcon = createRecentEntryIcon(entry);
      grid.appendChild(entryIcon);
    }
  } catch (error: any) {
    console.error('Failed to load recent entries:', error);
  }
}

function createRecentEntryIcon(entry: DiaryEntry): HTMLElement {
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
    onclick: () => {
      navigate(`#/entry/${entry.date}`);
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
