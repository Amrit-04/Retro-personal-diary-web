import { el, clearElement } from '../utils/dom';
import { UserSession } from '../types';
import { getArchiveYears, getArchiveMonthsForYear, getEntriesForMonth } from '../db/entries';
import { navigate } from '../router';
import { createRetroWindow } from '../components/window';
import { getFolderIconSvg, getDocumentIconSvg } from '../components/icons';
import { MONTH_NAMES } from '../utils/date';

export function renderExplorerView(
  _currentUser: UserSession,
  params: { year?: string; month?: string } = {}
): HTMLElement {
  const selectedYear = params.year ? parseInt(params.year, 10) : undefined;
  const selectedMonth = params.month ? parseInt(params.month, 10) : undefined;

  const container = el('div', { class: 'explorer-container' });

  // Toolbar with Back / Up / Path bar
  const toolbar = el('div', { class: 'explorer-toolbar' });

  const pathStr = buildPathString(selectedYear, selectedMonth);

  const upBtn = el('button', {
    class: 'bevel-button',
    disabled: !selectedYear,
    onclick: () => {
      if (selectedMonth !== undefined) {
        navigate(`#/explorer/${selectedYear}`);
      } else if (selectedYear !== undefined) {
        navigate('#/explorer');
      }
    }
  }, ['⬆ Up']);

  const pathBar = el('div', { class: 'explorer-path-bar' }, [
    upBtn,
    el('span', { class: 'explorer-path-label' }, ['Location:']),
    el('input', {
      type: 'text',
      class: 'explorer-path-input',
      readOnly: true,
      value: pathStr
    })
  ]);

  toolbar.appendChild(pathBar);
  container.appendChild(toolbar);

  // Content pane (grid of items)
  const contentPane = el('div', { class: 'explorer-content-pane' });
  const grid = el('div', { class: 'explorer-grid' });
  contentPane.appendChild(grid);
  container.appendChild(contentPane);

  // Lazy loading state based on current depth
  loadExplorerLevel(grid, selectedYear, selectedMonth);

  const windowEl = createRetroWindow({
    title: `File Explorer — ${pathStr}`,
    icon: '📂',
    onClose: () => navigate('#/'),
    width: '780px',
    statusLeft: `${getItemTypeLabel(selectedYear, selectedMonth)}`,
    statusRight: 'Diary Archive'
  }, container);

  return windowEl;
}

function buildPathString(year?: number, month?: number): string {
  let path = 'C:\\DIARY';
  if (year) {
    path += `\\${year}`;
    if (month) {
      const mName = MONTH_NAMES[month - 1] || `Month-${month}`;
      path += `\\${mName.toUpperCase()}`;
    }
  }
  return path + '\\';
}

function getItemTypeLabel(year?: number, month?: number): string {
  if (month !== undefined) return `Month View (${MONTH_NAMES[month - 1]} ${year})`;
  if (year !== undefined) return `Year View (${year})`;
  return 'Root Archive';
}

async function loadExplorerLevel(grid: HTMLElement, year?: number, month?: number) {
  clearElement(grid);

  const loading = el('div', {
    class: 'explorer-empty-state'
  }, [
    el('div', { class: 'explorer-empty-icon' }, ['⏳']),
    el('div', {}, ['Reading directory contents...'])
  ]);
  grid.appendChild(loading);

  try {
    if (year !== undefined && month !== undefined) {
      // Level 3: Entries inside a Month (sorted chronologically)
      await renderEntriesLevel(grid, year, month);
    } else if (year !== undefined) {
      // Level 2: Months inside a Year
      await renderMonthsLevel(grid, year);
    } else {
      // Level 1: Years in Diary
      await renderYearsLevel(grid);
    }
  } catch (err: any) {
    console.error('Failed to load explorer level:', err);
    clearElement(grid);
    grid.appendChild(el('div', { class: 'explorer-empty-state' }, [
      el('div', { class: 'explorer-empty-icon' }, ['⚠️']),
      el('div', {}, [`Failed to open folder: ${err.message || 'Error'}`])
    ]));
  }
}

// 1. Root Level: Years
async function renderYearsLevel(grid: HTMLElement) {
  const years = await getArchiveYears();
  clearElement(grid);

  if (years.length === 0) {
    grid.appendChild(el('div', { class: 'explorer-empty-state' }, [
      el('div', { class: 'explorer-empty-icon' }, ['📁']),
      el('div', {}, ['Archive is empty. No years found.'])
    ]));
    return;
  }

  for (const y of years) {
    const item = el('div', {
      class: 'explorer-item',
      title: `Open Year ${y}`,
      onclick: () => navigate(`#/explorer/${y}`)
    }, [
      el('div', { class: 'explorer-item-icon', innerHTML: getFolderIconSvg() }),
      el('div', { class: 'explorer-item-title' }, [String(y)])
    ]);
    grid.appendChild(item);
  }
}

// 2. Year Level: Months
async function renderMonthsLevel(grid: HTMLElement, year: number) {
  const months = await getArchiveMonthsForYear(year);
  clearElement(grid);

  if (months.length === 0) {
    grid.appendChild(el('div', { class: 'explorer-empty-state' }, [
      el('div', { class: 'explorer-empty-icon' }, ['📁']),
      el('div', {}, [`No logged entries found in ${year}.`])
    ]));
    return;
  }

  for (const m of months) {
    const item = el('div', {
      class: 'explorer-item',
      title: `Open ${m.monthName} ${year} (${m.count} entries)`,
      onclick: () => navigate(`#/explorer/${year}/${m.month}`)
    }, [
      el('div', { class: 'explorer-item-icon', innerHTML: getFolderIconSvg() }),
      el('div', { class: 'explorer-item-title' }, [m.monthName]),
      el('div', { class: 'explorer-item-date' }, [`${m.count} entry${m.count === 1 ? '' : 'ies'}`])
    ]);
    grid.appendChild(item);
  }
}

// 3. Month Level: Entries (sorted chronologically)
async function renderEntriesLevel(grid: HTMLElement, year: number, month: number) {
  const entries = await getEntriesForMonth(year, month);
  clearElement(grid);

  if (entries.length === 0) {
    grid.appendChild(el('div', { class: 'explorer-empty-state' }, [
      el('div', { class: 'explorer-empty-icon' }, ['📄']),
      el('div', {}, [`No entries found in ${MONTH_NAMES[month - 1]} ${year}.`])
    ]));
    return;
  }

  for (const entry of entries) {
    const iconContainer = el('div', { class: 'explorer-item-icon' });
    if (entry.imageUrl) {
      const img = el('img', {
        src: entry.imageUrl,
        alt: entry.title,
        class: 'explorer-item-img',
        loading: 'lazy'
      });
      iconContainer.appendChild(img);
    } else {
      iconContainer.innerHTML = getDocumentIconSvg();
    }

    const item = el('div', {
      class: 'explorer-item',
      title: `${entry.title} (${entry.date})`,
      onclick: () => navigate(`#/entry/${entry.date}`)
    }, [
      iconContainer,
      el('div', { class: 'explorer-item-title' }, [entry.title || entry.date]),
      el('div', { class: 'explorer-item-date' }, [entry.date])
    ]);
    grid.appendChild(item);
  }
}
