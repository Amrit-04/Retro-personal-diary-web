import { el, clearElement } from '../utils/dom';
import { UserSession } from '../types';
import { getEntry, deleteDiaryEntry } from '../db/entries';
import { navigate } from '../router';
import { createRetroWindow } from '../components/window';
import { formatFullDate, parseDateString } from '../utils/date';
import { showRetroAlert, showRetroConfirm } from '../components/modal';

export function renderViewerView(currentUser: UserSession, dateStr: string): HTMLElement {
  const container = el('div', { class: 'viewer-container' });

  // Initial loading state
  const loading = el('div', {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '300px',
      color: '#666',
      fontFamily: 'var(--font-mono)'
    }
  }, ['Opening diary file...']);
  container.appendChild(loading);

  const windowEl = createRetroWindow({
    title: `Diary Viewer — ${dateStr}`,
    icon: '📖',
    onClose: () => {
      // Return to explorer month if available or desktop
      const dateParts = parseDateString(dateStr);
      if (dateParts) {
        navigate(`#/explorer/${dateParts.year}/${dateParts.month}`);
      } else {
        navigate('#/');
      }
    },
    width: '740px',
    statusLeft: dateStr,
    statusRight: 'Read Only'
  }, container);

  loadEntryData(container, currentUser, dateStr);

  return windowEl;
}

async function loadEntryData(container: HTMLElement, currentUser: UserSession, dateStr: string) {
  try {
    const entry = await getEntry(dateStr);
    clearElement(container);

    if (!entry) {
      container.appendChild(el('div', {
        style: {
          padding: '32px',
          textAlign: 'center',
          color: 'var(--color-danger)',
          fontFamily: 'var(--font-mono)'
        }
      }, [
        el('div', { style: { fontSize: '32px', marginBottom: '8px' } }, ['❓']),
        el('h2', {}, ['File Not Found']),
        el('p', { style: { marginTop: '8px', color: '#666' } }, [
          `No entry exists for date "${dateStr}".`
        ]),
        el('button', {
          class: 'bevel-button',
          style: { marginTop: '16px' },
          onclick: () => navigate('#/')
        }, ['Return to Desktop'])
      ]));
      return;
    }

    // Render Entry Viewer Header
    const header = el('div', { class: 'viewer-header' });

    const titleArea = el('div', { class: 'viewer-title-area' }, [
      el('h1', { class: 'viewer-entry-title' }, [entry.title || 'Untitled Entry']),
      el('div', { class: 'viewer-entry-date' }, [
        el('span', {}, ['📅']),
        el('span', {}, [formatFullDate(entry.date)])
      ])
    ]);
    header.appendChild(titleArea);

    // Admin Actions (Edit / Delete)
    if (currentUser.isAdmin) {
      const adminActions = el('div', { class: 'viewer-admin-actions' });

      const editBtn = el('button', {
        class: 'bevel-button',
        onclick: () => navigate(`#/edit/${entry.date}`)
      }, ['✏️ Edit']);

      const deleteBtn = el('button', {
        class: 'bevel-button',
        style: { color: 'var(--color-danger)' },
        onclick: async () => {
          const confirmed = await showRetroConfirm(
            'Confirm Delete',
            `Are you sure you want to permanently delete the entry for ${entry.date}? This action cannot be undone.`
          );
          if (confirmed) {
            try {
              await deleteDiaryEntry(entry.date);
              await showRetroAlert('Deleted', 'Entry removed successfully.', '🗑️');
              navigate('#/');
            } catch (err: any) {
              await showRetroAlert('Error', `Failed to delete entry: ${err.message}`, '⚠️');
            }
          }
        }
      }, ['🗑️ Delete']);

      adminActions.appendChild(editBtn);
      adminActions.appendChild(deleteBtn);
      header.appendChild(adminActions);
    }

    container.appendChild(header);

    // Render Reading Paper
    const paper = el('div', { class: 'viewer-paper' });

    // Doodle Image if present
    if (entry.imageUrl) {
      const doodleWrapper = el('div', { class: 'viewer-doodle-container' }, [
        el('img', {
          src: entry.imageUrl,
          alt: `Doodle for ${entry.date}`,
          class: 'viewer-doodle-image',
          loading: 'eager'
        })
      ]);
      paper.appendChild(doodleWrapper);
    }

    // Journal text content
    const contentEl = el('div', { class: 'viewer-content' }, [
      entry.content || '(No written content for this day)'
    ]);
    paper.appendChild(contentEl);

    container.appendChild(paper);
  } catch (err: any) {
    console.error('Failed to load entry:', err);
    clearElement(container);
    container.appendChild(el('div', {
      style: { padding: '24px', color: 'var(--color-danger)' }
    }, [`Error loading entry: ${err.message || 'Unknown error'}`]));
  }
}
