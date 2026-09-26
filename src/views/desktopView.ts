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
    title: 'Open Diary Archive (File Explorer)',
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
      title: 'Create Today\'s Diary Entry',
      onclick: () => navigate('#/new'),
    }, [
      el('div', { class: 'desktop-icon-img-wrapper', innerHTML: getNewEntryIconSvg() }),
      el('div', { class: 'desktop-icon-label' }, ['New Entry.exe'])
    ]);
    grid.appendChild(newEntryIcon);
  }

  // 3. Section Header for Recent Entries (Last 7 Days)
  const header = el('div', { class: 'desktop-section-header' }, ['Recent Entries (Last 7 Days)']);
  grid.appendChild(header);

  // Loading placeholder
  const loadingIndicator = el('div', {
    style: {
      gridColumn: '1 / -1',
      color: '#ffffff',
      fontSize: '11px',
      fontFamily: 'var(--font-mono)',
      padding: '8px'
    }
  }, ['Scanning disk for recent entries...']);
  grid.appendChild(loadingIndicator);

  try {
    // Only fetches the 7-day window (enforced by Firestore query)
    const recentEntries = await getRecentEntries();

    if (grid.contains(loadingIndicator)) {
      grid.removeChild(loadingIndicator);
    }

    if (recentEntries.length === 0) {
      const emptyNote = el('div', {
        style: {
          gridColumn: '1 / -1',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          padding: '8px',
          fontStyle: 'italic'
        }
      }, ['No diary entries logged in the past 7 days. Open File Explorer to view the complete archive.']);
      grid.appendChild(emptyNote);
      return;
    }

    // Render each entry as an icon.
    // Important: Skip days with no entry. Do not create placeholder icons.
    for (const entry of recentEntries) {
      const entryIcon = createRecentEntryIcon(entry);
      grid.appendChild(entryIcon);
    }
  } catch (error: any) {
    console.error('Failed to load recent entries:', error);
    if (grid.contains(loadingIndicator)) {
      grid.removeChild(loadingIndicator);
    }
    const errorNote = el('div', {
      style: {
        gridColumn: '1 / -1',
        color: '#ffaaaa',
        fontSize: '11px',
        padding: '8px'
      }
    }, [`Error loading entries: ${error.message || 'Unknown network error'}`]);
    grid.appendChild(errorNote);
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

  // Sanitize filename presentation: e.g. "today-at-the-lab.txt" or clean title
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
  return `${clean.substring(0, 18)}.txt`;
}
