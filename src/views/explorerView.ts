import { el, clearElement } from '../utils/dom';
import { UserSession } from '../types';
import { getArchiveYears, getArchiveMonthsForYear, getEntriesForMonth } from '../db/entries';
import { navigate } from '../router';
import { createRetroWindow } from '../components/window';
import {
  getFolderIconSvg,
  getDocumentIconSvg,
  getXpBackArrowSvg,
  getXpUpArrowSvg,
  getXpSearchSvg,
  getXpFoldersIconSvg
} from '../components/icons';
import { MONTH_NAMES } from '../utils/date';

export function renderExplorerView(
  currentUser: UserSession,
  params: { year?: string; month?: string } = {}
): HTMLElement {
  const selectedYear = params.year ? parseInt(params.year, 10) : undefined;
  const selectedMonth = params.month ? parseInt(params.month, 10) : undefined;

  const container = el('div', { class: 'explorer-container' });

  // 1. Standard Buttons Toolbar
  const toolbar = el('div', { class: 'explorer-toolbar' });

  const backBtn = el('button', {
    class: 'explorer-tool-btn',
    title: 'Back',
    disabled: !selectedYear,
    onclick: () => {
      if (selectedMonth !== undefined) {
        navigate(`#/explorer/${selectedYear}`);
      } else if (selectedYear !== undefined) {
        navigate('#/explorer');
      }
    }
  }, [
    el('span', { innerHTML: getXpBackArrowSvg() }),
    el('span', {}, ['Back'])
  ]);

  const upBtn = el('button', {
    class: 'explorer-tool-btn',
    title: 'Up to Parent Folder',
    disabled: !selectedYear,
    onclick: () => {
      if (selectedMonth !== undefined) {
        navigate(`#/explorer/${selectedYear}`);
      } else if (selectedYear !== undefined) {
        navigate('#/explorer');
      }
    }
  }, [
    el('span', { innerHTML: getXpUpArrowSvg() }),
    el('span', {}, ['Up'])
  ]);

  const searchBtn = el('button', {
    class: 'explorer-tool-btn',
    title: 'Search Diary',
    onclick: () => {
      // Focus or navigate to root
      navigate('#/explorer');
    }
  }, [
    el('span', { innerHTML: getXpSearchSvg() }),
    el('span', {}, ['Search'])
  ]);

  const foldersBtn = el('button', {
    class: 'explorer-tool-btn',
    title: 'Folders Hierarchy',
    onclick: () => navigate('#/explorer')
  }, [
    el('span', { innerHTML: getXpFoldersIconSvg() }),
    el('span', {}, ['Folders'])
  ]);

  toolbar.appendChild(backBtn);
  toolbar.appendChild(upBtn);
  toolbar.appendChild(el('div', { class: 'explorer-tool-separator' }));
  toolbar.appendChild(searchBtn);
  toolbar.appendChild(foldersBtn);
  container.appendChild(toolbar);

  // 2. XP Address Bar
  const pathStr = buildPathString(selectedYear, selectedMonth);

  const addressBar = el('div', { class: 'explorer-address-bar' }, [
    el('span', { class: 'explorer-address-label' }, ['Address']),
    el('div', { class: 'explorer-address-input-wrapper' }, [
      el('span', { class: 'explorer-address-icon' }, ['📂']),
      el('input', {
        type: 'text',
        class: 'explorer-address-input',
        readOnly: true,
        value: pathStr
      })
    ]),
    el('button', {
      class: 'explorer-go-btn',
      onclick: () => {
        // Reload or jump
      }
    }, [
      el('span', { style: { color: '#2e7d32', fontSize: '11px' } }, ['➔']),
      el('span', {}, ['Go'])
    ])
  ]);
  container.appendChild(addressBar);

  // 3. Two-Column Main Split (Left Task Pane + Right Content Pane)
  const mainSplit = el('div', { class: 'explorer-main-split' });

  // Left Task Pane (Accordion Blue Panels)
  const taskPane = el('div', { class: 'explorer-task-pane' });

  // Panel 1: Diary Tasks
  const diaryTasksBox = el('div', { class: 'xp-task-box' }, [
    el('div', { class: 'xp-task-box-header' }, [
      el('span', {}, ['Diary Tasks']),
      el('span', { style: { fontSize: '10px' } }, ['▲'])
    ]),
    el('div', { class: 'xp-task-box-body' }, [
      currentUser.isAdmin ? el('div', {
        class: 'xp-task-link',
        onclick: () => navigate('#/new')
      }, [
        el('span', {}, ['✏️']),
        el('span', {}, ['Write new diary entry'])
      ]) : null,
      el('div', {
        class: 'xp-task-link',
        onclick: () => navigate('#/')
      }, [
        el('span', {}, ['🖥️']),
        el('span', {}, ['View recent 7-day files'])
      ]),
      el('div', {
        class: 'xp-task-link',
        onclick: () => navigate('#/explorer')
      }, [
        el('span', {}, ['📂']),
        el('span', {}, ['Open archive root'])
      ])
    ].filter(Boolean) as HTMLElement[])
  ]);
  taskPane.appendChild(diaryTasksBox);

  // Panel 2: Other Places
  const otherPlacesBox = el('div', { class: 'xp-task-box' }, [
    el('div', { class: 'xp-task-box-header' }, [
      el('span', {}, ['Other Places']),
      el('span', { style: { fontSize: '10px' } }, ['▲'])
    ]),
    el('div', { class: 'xp-task-box-body' }, [
      el('div', {
        class: 'xp-task-link',
        onclick: () => navigate('#/')
      }, [
        el('span', {}, ['💻']),
        el('span', {}, ['Desktop'])
      ]),
      el('div', {
        class: 'xp-task-link',
        onclick: () => navigate('#/explorer')
      }, [
        el('span', {}, ['📁']),
        el('span', {}, ['My Diary Documents'])
      ])
    ])
  ]);
  taskPane.appendChild(otherPlacesBox);

  // Panel 3: Details Panel
  const detailsBox = el('div', { class: 'xp-task-box' }, [
    el('div', { class: 'xp-task-box-header' }, [
      el('span', {}, ['Details']),
      el('span', { style: { fontSize: '10px' } }, ['▲'])
    ]),
    el('div', { class: 'xp-task-box-body' }, [
      el('div', { class: 'xp-task-details-text' }, [
        el('strong', {}, [getItemTypeLabel(selectedYear, selectedMonth)]),
        el('br', {}),
        el('span', { style: { color: '#666666', fontSize: '10px' } }, [
          selectedMonth !== undefined ? 'Browsing logged diary entries.' : 'Select a folder to view contents.'
        ])
      ])
    ])
  ]);
  taskPane.appendChild(detailsBox);

  mainSplit.appendChild(taskPane);

  // Right Content Pane (Grid of folders / files)
  const contentPane = el('div', { class: 'explorer-content-pane' });
  const grid = el('div', { class: 'explorer-grid' });
  contentPane.appendChild(grid);
  mainSplit.appendChild(contentPane);

  container.appendChild(mainSplit);

  // Lazy loading state based on current depth
  loadExplorerLevel(grid, selectedYear, selectedMonth);

  const windowEl = createRetroWindow({
    title: `Diary Archive — ${pathStr}`,
    icon: '📂',
    onClose: () => navigate('#/'),
    width: '820px',
    statusLeft: `${getItemTypeLabel(selectedYear, selectedMonth)}`,
    statusRight: 'My Computer'
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
  if (month !== undefined) return `${MONTH_NAMES[month - 1]} ${year}`;
  if (year !== undefined) return `Year ${year}`;
  return 'Diary Archive Root';
}

async function loadExplorerLevel(grid: HTMLElement, year?: number, month?: number) {
  clearElement(grid);

  const loading = el('div', {
    class: 'explorer-empty-state'
  }, [
    el('div', { class: 'explorer-empty-icon' }, ['⏳']),
    el('div', {}, ['Reading folder contents...'])
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
      el('div', {}, [`No entries found in ${year}.`])
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

// 3. Month Level: Entries
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
