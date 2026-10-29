/**
 * The admin editor: date, title, content, doodle, Save.
 *
 * This chunk is the only place that talks to Cloud Storage, which is why it is
 * loaded lazily — a reader never downloads it. The rules decide who may write;
 * this screen only knows whether to warn that the claim is missing.
 *
 * Two promises this screen keeps:
 *   - typed words are never discarded, whatever fails;
 *   - a save writes the document before it deletes the files it replaced.
 */
import '../styles/editor.css';
import { h, setText } from '../lib/dom';
import { isDateId, longDate, today } from '../lib/dates';
import { fileName } from '../lib/slug';
import { getEntry, saveEntry, type Entry } from '../firebase/entries';
import { ACCEPTED_TYPES, prepare, validateSource } from '../lib/image';
import { deleteEntryFiles, uploadEntryImages, type EntryImages } from '../firebase/admin';
import { newEntryIconSvg, pictureGlyphSvg } from './icons';
import type { WindowContent, WindowHandle } from './window';
import type { Session } from '../firebase/auth';

const MAX_TITLE = 120;
const MAX_CONTENT = 20000;

export function buildEditor(session: Session, targetDate?: string): WindowContent {
  const field = makeField(`ed${++editorCount}`);
  const dateInput = h('input', { class: 'ed-input', type: 'date', value: targetDate ?? today() });

  const titleInput = h('input', {
    class: 'ed-input',
    type: 'text',
    maxlength: MAX_TITLE,
    autocomplete: 'off',
    placeholder: 'What is this entry called?',
  });

  const contentInput = h('textarea', {
    class: 'ed-input ed-content',
    rows: 12,
    maxlength: MAX_CONTENT,
    placeholder: 'Write here. Line breaks are kept exactly as you type them.',
  });

  const dateHint = h('span', { class: 'ed-hint' }, longDate(dateInput.value));
  const contentCount = h('span', { class: 'ed-hint' }, '0 words');

  const preview = h('img', { class: 'ed-preview', alt: '', width: 128, height: 128, hidden: true });
  const removeButton = h('button', {
    class: 'btn btn-mini',
    type: 'button',
    hidden: true,
    onclick: () => clearPick(),
  }, 'Remove picture');

  const fileInput = h('input', {
    class: 'ed-file',
    type: 'file',
    accept: ACCEPTED_TYPES.join(','),
    'aria-label': 'Choose a doodle image',
    onchange: (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) void acceptPick(file);
    },
  });

  const drop = h('label', { class: 'ed-drop' }, [
    h('span', { class: 'ed-drop-icon', 'aria-hidden': 'true', html: pictureGlyphSvg() }),
    h('span', { class: 'ed-drop-text' }, [
      h('strong', {}, 'Drop a picture here'),
      h('span', {}, 'or click to choose one. PNG, JPEG, WebP or GIF — resized to 800 px before it uploads.'),
    ]),
    fileInput,
  ]);

  const status = h('p', { class: 'ed-status', role: 'status', 'aria-live': 'polite' });
  const doodleHint = h('span', { class: 'ed-hint' }, 'Required for a new entry; it becomes the icon on the desktop.');
  const fill = h('span', { class: 'ed-fill' });
  const progress = h('div', {
    class: 'ed-progress',
    role: 'progressbar',
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    'aria-valuenow': '0',
    hidden: true,
  }, fill);

  const saveButton = h('button', { class: 'btn btn-primary', type: 'button', onclick: () => void save() }, 'Save entry');
  const cancelButton = h('button', { class: 'btn', type: 'button', onclick: () => handle?.close() }, 'Cancel');

  const body = h('div', { class: 'editor' }, [
    h('div', { class: 'ed-scroll' }, [
      session.hasAdminClaim ? null : h('p', { class: 'ed-warning' }, [
        'Your account has no administrator claim, so the server will refuse this save. ',
        'Run scripts/set-admin.mjs, then sign out and back in.',
      ]),
      field('Date', dateInput, dateHint),
      field('Title', titleInput, h('span', { class: 'ed-hint' }, 'Also becomes the file name on the desktop.')),
      field('Entry', contentInput, contentCount),
      field('Doodle', h('div', { class: 'ed-doodle' }, [drop, h('div', { class: 'ed-picked' }, [preview, removeButton])]),
        doodleHint),
    ]),
    h('div', { class: 'ed-foot' }, [
      status,
      progress,
      h('div', { class: 'ed-actions' }, [cancelButton, saveButton]),
    ]),
  ]);

  let objectUrl: string | null = null;
  let picked: File | null = null;
  let existing: Entry | null = null;
  let handle: WindowHandle | null = null;
  let busy = false;

  drop.addEventListener('dragover', (event) => {
    event.preventDefault();
    drop.classList.add('is-over');
  });
  drop.addEventListener('dragleave', () => drop.classList.remove('is-over'));
  drop.addEventListener('drop', (event) => {
    event.preventDefault();
    drop.classList.remove('is-over');
    const file = (event as DragEvent).dataTransfer?.files?.[0];
    if (file) void acceptPick(file);
  });

  dateInput.addEventListener('change', () => void onDateChange());
  contentInput.addEventListener('input', updateCount);
  body.addEventListener('keydown', (event) => {
    if ((event as KeyboardEvent).ctrlKey || (event as KeyboardEvent).metaKey) {
      if ((event as KeyboardEvent).key === 's') {
        event.preventDefault();
        void save();
      }
    }
  });

  /* ------------------------------------------------------------------ picking */

  function acceptPick(file: File): void {
    const problem = validateSource(file);
    if (problem) {
      showStatus(problem, true);
      return;
    }

    picked = file;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(file);
    preview.src = objectUrl;
    preview.hidden = false;
    removeButton.hidden = false;
    drop.classList.add('has-file');
    showStatus('');
  }

  function clearPick(): void {
    picked = null;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = null;
    fileInput.value = '';

    // Undo my new choice, then fall back to the stored picture if the entry has one,
    // so the preview always matches what Save would write.
    if (existing?.thumbUrl) showSavedDoodle(existing);
    else showNoDoodle();
  }

  /* ------------------------------------------------------------------ dates */

  async function onDateChange(): Promise<void> {
    const value = dateInput.value;

    if (!isDateId(value)) {
      showStatus('That is not a valid date.', true);
      return;
    }

    const found = await getEntry(value).catch(() => null);
    existing = found;

    if (!found) {
      setText(dateHint, `${longDate(value)} — a new entry`);
      setText(doodleHint, 'Required for a new entry; it becomes the icon on the desktop.');
      handle?.setTitle(`New Entry — ${value}`);
      showStatus('');
      return;
    }

    setText(doodleHint, 'Optional when editing: the current picture stays unless you pick another.');
    // Never overwrite words that are already on screen: only a clean form is filled in.
    if (isPristine()) {
      titleInput.value = found.title;
      contentInput.value = found.content;
      updateCount();
      showSavedDoodle(found);
      handle?.setTitle(`Edit ${fileName(found.title)}`);
      setText(dateHint, `${longDate(value)} — editing this entry`);
      showStatus('');
    } else {
      handle?.setTitle(`Edit ${fileName(found.title)}`);
      setText(dateHint, `${longDate(value)} — already has an entry`);
      showStatus('Saving will replace the entry stored on this date. Your words stay on screen.', true);
    }
  }

  /** Shows the picture already stored for this entry. Removing it is not a v1 action,
   *  so the button only appears once a replacement has been chosen. */
  function showSavedDoodle(entry: Entry): void {
    preview.src = entry.thumbUrl;
    preview.hidden = false;
    removeButton.hidden = true;
    drop.classList.add('has-file');
  }

  function showNoDoodle(): void {
    preview.removeAttribute('src');
    preview.hidden = true;
    removeButton.hidden = true;
    drop.classList.remove('has-file');
  }

  function isPristine(): boolean {
    return !picked && !titleInput.value.trim() && !contentInput.value.trim();
  }

  /* ------------------------------------------------------------------ saving */

  async function save(): Promise<void> {
    if (busy) return;

    const problem = validate();
    if (problem) {
      showStatus(problem.message, true);
      problem.field?.focus();
      return;
    }

    const date = dateInput.value;
    const replaced = existing;
    let images: EntryImages | null = replaced
      ? {
          imageUrl: replaced.imageUrl,
          thumbUrl: replaced.thumbUrl,
          imagePath: replaced.imagePath,
          thumbPath: replaced.thumbPath,
        }
      : null;

    busy = true;
    saveButton.disabled = true;
    cancelButton.disabled = true;
    setProgress(3);

    try {
      if (picked) {
        showStatus('Resizing the picture…');
        const prepared = await prepare(picked);

        showStatus('Uploading…');
        images = await uploadEntryImages(date, prepared, (percent) => setProgress(8 + Math.round(percent * 0.62)));
      }

      if (!images) throw new Error('A doodle is required before saving.');

      setProgress(85);
      showStatus('Saving the entry…');

      const now = new Date();
      await saveEntry({
        date,
        title: titleInput.value.trim(),
        content: contentInput.value,
        imageUrl: images.imageUrl,
        thumbUrl: images.thumbUrl,
        imagePath: images.imagePath,
        thumbPath: images.thumbPath,
        createdAt: replaced?.createdAt ?? now, // the rules keep this immutable
        updatedAt: now,
      });

      // Only now is it safe to delete the files the document no longer points at.
      if (picked && replaced?.imagePath) await deleteEntryFiles(replaced).catch(() => undefined);

      setProgress(100);
      handle?.close();
    } catch (error) {
      // The form keeps every word: a failed save must cost the author nothing.
      hideProgress();
      showStatus(describe(error), true);
      busy = false;
      saveButton.disabled = false;
      cancelButton.disabled = false;
    }
  }

  function validate(): { message: string; field?: HTMLElement } | null {
    if (!isDateId(dateInput.value)) return { message: 'Choose a date for this entry.', field: dateInput };
    if (!titleInput.value.trim()) return { message: 'Give the entry a title.', field: titleInput };
    if (!contentInput.value.trim()) return { message: 'Write something first — an empty page is not saved.', field: contentInput };
    if (!existing && !picked) return { message: 'A new entry needs a doodle: it becomes the desktop icon.', field: fileInput };
    return null;
  }

  /* ------------------------------------------------------------------ chrome */

  function updateCount(): void {
    const words = contentInput.value.trim().split(/\s+/).filter(Boolean).length;
    setText(contentCount, `${words} ${words === 1 ? 'word' : 'words'} · ${contentInput.value.length} of ${MAX_CONTENT}`);
  }

  function showStatus(message: string, isError = false): void {
    setText(status, message);
    status.classList.toggle('is-error', isError);
  }

  /** A transform on a bar: the progress animation never touches layout. */
  function setProgress(percent: number): void {
    progress.hidden = false;
    progress.setAttribute('aria-valuenow', String(percent));
    fill.style.transform = `scaleX(${percent / 100})`;
  }

  function hideProgress(): void {
    progress.hidden = true;
  }

  return {
    title: targetDate ? `Edit ${fileName(targetDate)}` : 'New Entry',
    icon: newEntryIconSvg(),
    status: `Today is ${today()}`,
    body,
    mounted: (opened) => {
      handle = opened;
      updateCount();
      if (targetDate) void onDateChange();
      else titleInput.focus();
    },
  };
}

/* ------------------------------------------------------------------ helpers */

let editorCount = 0;

/**
 * A labelled row: the text label, the control, then a hint line under it.
 * Ids carry the instance prefix, so two editors open at once never collide.
 */
function makeField(hostId: string): (labelText: string, control: HTMLElement, hint?: HTMLElement) => HTMLElement {
  let sequence = 0;
  return (labelText, control, hint) => {
    const id = `${hostId}-field-${++sequence}`;
    control.id = id;

    return h('div', { class: 'ed-field' }, [
      h('label', { class: 'ed-label', for: id }, labelText),
      control,
      hint ?? null,
    ]);
  };
}

function describe(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';
  const message = (error as Error | null)?.message ?? '';

  if (code.includes('permission-denied') || code.includes('failed-precondition')) {
    return 'The server refused this save: only an administrator may write. Set the claim with scripts/set-admin.mjs, then sign out and back in.';
  }
  if (code.includes('unauthenticated')) return 'Your session expired. Log off and sign in again, then save.';
  if (code.includes('unavailable') || code.includes('network')) return 'No connection. Your words are still here — try again.';
  if (message) return message;
  return 'The entry could not be saved. Try again.';
}
