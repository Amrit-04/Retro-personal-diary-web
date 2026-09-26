import { el } from '../utils/dom';
import { UserSession } from '../types';
import { getEntry, saveDiaryEntry } from '../db/entries';
import { uploadDoodleImage } from '../db/images';
import { navigate } from '../router';
import { createRetroWindow } from '../components/window';
import { getTodayDateString } from '../utils/date';
import { showRetroAlert } from '../components/modal';
import { processAndCompressImage, validateImageFile } from '../utils/image';

export function renderEditorView(
  currentUser: UserSession,
  params: { date?: string; mode?: string } = {}
): HTMLElement {
  const isEditMode = params.mode === 'edit' && Boolean(params.date);
  const targetDate = params.date || getTodayDateString();

  // Security guard: Ensure client knows only admins can use this
  if (!currentUser.isAdmin) {
    setTimeout(() => {
      showRetroAlert('Access Denied', 'You do not have Administrator permissions to create or edit diary entries.', '🔒');
      navigate('#/');
    }, 10);
    return el('div', {});
  }

  const form = el('form', {
    class: 'editor-form',
    onsubmit: (e: Event) => {
      e.preventDefault();
    }
  });

  // 1. Date Field
  const dateInput = el('input', {
    type: 'date',
    class: 'editor-input',
    value: targetDate,
    required: true,
    disabled: isEditMode, // Date acts as primary key
    style: { maxWidth: '200px' }
  });

  const dateField = el('div', { class: 'editor-field' }, [
    el('label', { class: 'editor-label' }, ['Entry Date (YYYY-MM-DD):']),
    dateInput
  ]);
  form.appendChild(dateField);

  // 2. Title Field
  const titleInput = el('input', {
    type: 'text',
    class: 'editor-input',
    placeholder: 'e.g. Midnight Coffee & Compilers',
    required: true,
    autocomplete: 'off'
  });

  const titleField = el('div', { class: 'editor-field' }, [
    el('label', { class: 'editor-label' }, ['Title:']),
    titleInput
  ]);
  form.appendChild(titleField);

  // 3. Content Field
  const contentTextarea = el('textarea', {
    class: 'editor-textarea',
    placeholder: 'Write your daily thoughts here...',
    rows: 8,
    required: true
  });

  const contentField = el('div', { class: 'editor-field' }, [
    el('label', { class: 'editor-label' }, ['Journal Content:']),
    contentTextarea
  ]);
  form.appendChild(contentField);

  // 4. Doodle Upload Dropzone
  let selectedFile: File | null = null;
  let existingImageUrl: string | undefined = undefined;
  let existingImagePath: string | undefined = undefined;

  const previewContainer = el('div', { class: 'doodle-preview-container', style: { display: 'none' } });
  const previewImg = el('img', { class: 'doodle-preview-image' });
  const previewInfo = el('span', { style: { fontSize: '10px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' } });
  const removeImgBtn = el('button', {
    type: 'button',
    class: 'bevel-button',
    style: { fontSize: '10px', padding: '2px 8px' },
    onclick: (e: MouseEvent) => {
      e.stopPropagation();
      selectedFile = null;
      existingImageUrl = undefined;
      existingImagePath = undefined;
      previewContainer.style.display = 'none';
      dropPrompt.style.display = 'flex';
      fileInput.value = '';
    }
  }, ['Remove Doodle']);

  previewContainer.appendChild(previewImg);
  previewContainer.appendChild(previewInfo);
  previewContainer.appendChild(removeImgBtn);

  const fileInput = el('input', {
    type: 'file',
    class: 'doodle-file-input',
    accept: 'image/png, image/jpeg, image/webp, image/gif, image/svg+xml',
    onchange: async (e: Event) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files[0]) {
        await handleFileSelection(files[0]);
      }
    }
  });

  const dropPrompt = el('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '6px'
    }
  }, [
    el('div', { style: { fontSize: '24px' } }, ['🎨']),
    el('div', { style: { fontWeight: 'bold' } }, ['Drag & drop doodle image here']),
    el('div', { style: { fontSize: '11px', color: 'var(--color-text-muted)' } }, ['or click to browse from disk (PNG, JPG, WEBP, SVG)'])
  ]);

  const dropzone = el('div', {
    class: 'doodle-dropzone',
    onclick: () => {
      fileInput.click();
    },
    ondragover: (e: DragEvent) => {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    },
    ondragleave: () => {
      dropzone.classList.remove('drag-over');
    },
    ondrop: async (e: DragEvent) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        await handleFileSelection(e.dataTransfer.files[0]);
      }
    }
  }, [
    fileInput,
    dropPrompt,
    previewContainer
  ]);

  const doodleField = el('div', { class: 'editor-field' }, [
    el('label', { class: 'editor-label' }, ['Daily Doodle (Icon & Artwork):']),
    dropzone
  ]);
  form.appendChild(doodleField);

  // Progress Bar
  const progressContainer = el('div', { class: 'progress-bar-container', style: { display: 'none' } });
  const progressFill = el('div', { class: 'progress-bar-fill', style: { width: '0%' } });
  progressContainer.appendChild(progressFill);
  form.appendChild(progressContainer);

  // Status text & Actions
  const statusText = el('span', { class: 'editor-status' }, ['']);

  const saveBtn = el('button', {
    type: 'button',
    class: 'bevel-button',
    style: { minWidth: '100px' },
    onclick: async () => {
      await handleSave();
    }
  }, ['💾 Save Entry']);

  const cancelBtn = el('button', {
    type: 'button',
    class: 'bevel-button',
    onclick: () => {
      if (isEditMode) {
        navigate(`#/entry/${targetDate}`);
      } else {
        navigate('#/');
      }
    }
  }, ['Cancel']);

  const actions = el('div', { class: 'editor-actions' }, [
    statusText,
    cancelBtn,
    saveBtn
  ]);
  form.appendChild(actions);

  // If in edit mode, preload existing entry data
  if (isEditMode) {
    loadExistingEntry(targetDate);
  }

  async function handleFileSelection(file: File) {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      await showRetroAlert('Invalid Image', validation.error || 'Please select a valid image file.', '⚠️');
      return;
    }

    selectedFile = file;
    dropPrompt.style.display = 'none';
    previewContainer.style.display = 'flex';

    // Show instant preview and compression estimate
    try {
      const processed = await processAndCompressImage(file);
      previewImg.src = processed.dataUrl;
      const originalKb = (file.size / 1024).toFixed(1);
      const compressedKb = (processed.sizeBytes / 1024).toFixed(1);
      previewInfo.textContent = `${file.name} (${processed.width}×${processed.height}px, optimized: ${compressedKb} KB from ${originalKb} KB)`;
    } catch (err: any) {
      console.warn('Failed preview compression:', err);
      const url = URL.createObjectURL(file);
      previewImg.src = url;
      previewInfo.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    }
  }

  async function loadExistingEntry(dateStr: string) {
    statusText.textContent = 'Loading existing entry...';
    try {
      const existing = await getEntry(dateStr);
      if (existing) {
        titleInput.value = existing.title || '';
        contentTextarea.value = existing.content || '';
        if (existing.imageUrl) {
          existingImageUrl = existing.imageUrl;
          existingImagePath = existing.imagePath;
          previewImg.src = existing.imageUrl;
          previewInfo.textContent = 'Current attached doodle';
          dropPrompt.style.display = 'none';
          previewContainer.style.display = 'flex';
        }
      }
      statusText.textContent = '';
    } catch (err: any) {
      statusText.textContent = `Error: ${err.message}`;
    }
  }

  async function handleSave() {
    const entryDate = dateInput.value.trim();
    const title = titleInput.value.trim();
    const content = contentTextarea.value.trim();

    if (!entryDate) {
      await showRetroAlert('Missing Date', 'Please specify an entry date.', '⚠️');
      dateInput.focus();
      return;
    }

    if (!title) {
      await showRetroAlert('Missing Title', 'Please enter a title for the diary entry.', '⚠️');
      titleInput.focus();
      return;
    }

    if (!content) {
      await showRetroAlert('Missing Content', 'Please enter your journal content for today.', '⚠️');
      contentTextarea.focus();
      return;
    }

    saveBtn.disabled = true;
    cancelBtn.disabled = true;
    statusText.textContent = 'Processing...';

    try {
      let uploadedUrl = existingImageUrl;
      let uploadedPath = existingImagePath;

      if (selectedFile) {
        progressContainer.style.display = 'block';
        statusText.textContent = 'Optimizing & uploading doodle...';

        const result = await uploadDoodleImage(selectedFile, entryDate, (pct) => {
          progressFill.style.width = `${pct}%`;
        });

        uploadedUrl = result.imageUrl;
        uploadedPath = result.imagePath;
      }

      statusText.textContent = 'Saving entry to disk...';
      await saveDiaryEntry(entryDate, title, content, uploadedUrl, uploadedPath);

      statusText.textContent = 'Saved successfully!';
      await showRetroAlert('Entry Saved', `Diary entry for ${entryDate} has been saved.`, '💾');
      navigate(`#/entry/${entryDate}`);
    } catch (err: any) {
      console.error('Failed to save entry:', err);
      statusText.textContent = 'Save failed!';
      progressContainer.style.display = 'none';
      saveBtn.disabled = false;
      cancelBtn.disabled = false;
      await showRetroAlert('Save Error', `Failed to save diary entry: ${err.message || 'Unknown error'}`, '⚠️');
    }
  }

  const windowTitle = isEditMode ? `Edit Entry — ${targetDate}` : 'New Diary Entry';

  const windowEl = createRetroWindow({
    title: windowTitle,
    icon: '✏️',
    onClose: () => {
      if (isEditMode) {
        navigate(`#/entry/${targetDate}`);
      } else {
        navigate('#/');
      }
    },
    width: '680px',
    statusLeft: `Date: ${targetDate}`,
    statusRight: 'Admin Mode'
  }, form);

  return windowEl;
}
