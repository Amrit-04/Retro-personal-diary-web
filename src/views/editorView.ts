import { el } from '../utils/dom';
import { UserSession } from '../types';
import { getEntry, saveDiaryEntry } from '../db/entries';
import { uploadDoodleImage, uploadInlineImage } from '../db/images';
import { navigate } from '../router';
import { createRetroWindow } from '../components/window';
import { getTodayDateString } from '../utils/date';
import { showRetroAlert } from '../components/modal';
import { createPaintWindow } from '../components/paint';
import { createRichEditor } from '../components/richEditor';

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

  // 3. Rich Document Content Field (WordPad Style)
  const richEditor = createRichEditor({
    initialContent: ''
  });

  const contentField = el('div', { class: 'editor-field' }, [
    el('label', { class: 'editor-label' }, [
      el('span', {}, ['Journal Document (WordPad):']),
      el('span', { style: { fontWeight: 'normal', color: '#666', fontSize: '10px' } }, [
        'Supports formatting, drag-and-drop images & inline drawings'
      ])
    ]),
    richEditor.element
  ]);
  form.appendChild(contentField);

  // 4. Daily Doodle Workflow (Entry Icon / Primary Cover)
  let doodleDataUrl: string | null = null;
  let existingImageUrl: string | undefined = undefined;
  let existingImagePath: string | undefined = undefined;

  const doodlePreviewContainer = el('div', {
    class: 'doodle-preview-container',
    style: { display: 'none' }
  });
  const doodlePreviewImg = el('img', { class: 'doodle-preview-image' });
  const removeDoodleBtn = el('button', {
    type: 'button',
    class: 'bevel-button',
    style: { fontSize: '10px', padding: '2px 8px' },
    onclick: () => {
      doodleDataUrl = null;
      existingImageUrl = undefined;
      existingImagePath = undefined;
      doodlePreviewContainer.style.display = 'none';
      doodlePrompt.style.display = 'flex';
    }
  }, ['Remove Doodle']);

  doodlePreviewContainer.appendChild(doodlePreviewImg);
  doodlePreviewContainer.appendChild(removeDoodleBtn);

  const openPaintBtn = el('button', {
    type: 'button',
    class: 'bevel-button',
    style: { padding: '6px 12px' },
    onclick: () => {
      // Open Paint window
      const paintWindow = createPaintWindow({
        initialImage: doodleDataUrl || existingImageUrl,
        onSave: (imageUrl: string) => {
          doodleDataUrl = imageUrl;
          doodlePreviewImg.src = imageUrl;
          doodlePrompt.style.display = 'none';
          doodlePreviewContainer.style.display = 'flex';
          // Remove paint overlay
          const overlay = document.querySelector('.paint-overlay');
          if (overlay) {
            overlay.remove();
          }
        },
        onCancel: () => {
          // Just remove paint overlay
          const overlay = document.querySelector('.paint-overlay');
          if (overlay) {
            overlay.remove();
          }
        }
      });
      document.body.appendChild(paintWindow);
    }
  }, ['🎨 Open Paint']);

  const doodlePrompt = el('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      padding: '12px',
      border: '1px dashed #7f9db9',
      background: '#f8f9fc',
      borderRadius: '3px'
    }
  }, [
    el('div', { style: { fontSize: '20px' } }, ['🎨']),
    el('div', { style: { fontWeight: 'bold', fontSize: '11px' } }, ['Daily Doodle Icon (Desktop Entry Cover)']),
    openPaintBtn
  ]);

  const doodleField = el('div', { class: 'editor-field' }, [
    el('label', { class: 'editor-label' }, ['Daily Doodle Icon:']),
    doodlePrompt,
    doodlePreviewContainer
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

  async function loadExistingEntry(dateStr: string) {
    statusText.textContent = 'Loading existing entry...';
    try {
      const existing = await getEntry(dateStr);
      if (existing) {
        titleInput.value = existing.title || '';
        // If content is plain text with newlines, convert newlines for contenteditable
        const rawContent = existing.content || '';
        const isHtml = /<[a-z][\s\S]*>/i.test(rawContent);
        richEditor.setContent(isHtml ? rawContent : rawContent.replace(/\n/g, '<br>'));

        if (existing.imageUrl) {
          existingImageUrl = existing.imageUrl;
          existingImagePath = existing.imagePath;
          doodlePreviewImg.src = existing.imageUrl;
          doodlePrompt.style.display = 'none';
          doodlePreviewContainer.style.display = 'flex';
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
    const rawContentHtml = richEditor.getContent().trim();

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

    // Check if content has anything (text or image)
    const tempCheck = document.createElement('div');
    tempCheck.innerHTML = rawContentHtml;
    const hasText = tempCheck.textContent?.trim().length;
    const hasImages = tempCheck.querySelectorAll('img').length > 0;

    if (!hasText && !hasImages) {
      await showRetroAlert('Missing Content', 'Please enter your journal content or insert an image/drawing.', '⚠️');
      richEditor.focus();
      return;
    }

    saveBtn.disabled = true;
    cancelBtn.disabled = true;
    statusText.textContent = 'Processing...';

    try {
      let uploadedUrl = existingImageUrl;
      let uploadedPath = existingImagePath;

      // 1. Process inline images inside WordPad document
      progressContainer.style.display = 'block';
      statusText.textContent = 'Processing document images...';
      progressFill.style.width = '15%';

      const tempDoc = document.createElement('div');
      tempDoc.innerHTML = rawContentHtml;

      const inlineDataImages = Array.from(tempDoc.querySelectorAll('img[src^="data:"]'));
      for (let i = 0; i < inlineDataImages.length; i++) {
        const img = inlineDataImages[i] as HTMLImageElement;
        const dataUrl = img.src;

        statusText.textContent = `Uploading inline image ${i + 1} of ${inlineDataImages.length}...`;
        const pct = Math.round(15 + ((i + 1) / (inlineDataImages.length + 1)) * 50);
        progressFill.style.width = `${pct}%`;

        // Convert Data URL to Blob
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const permanentUrl = await uploadInlineImage(blob, entryDate, i);

        // Update image src to permanent URL
        img.src = permanentUrl;
      }

      const finalHtmlContent = tempDoc.innerHTML;

      // 2. If a new Daily Doodle was drawn in Paint, upload it
      if (doodleDataUrl) {
        statusText.textContent = 'Uploading daily doodle cover...';
        progressFill.style.width = '75%';

        // Convert data URL to Blob/File
        const response = await fetch(doodleDataUrl);
        const blob = await response.blob();
        const file = new File([blob], `doodle-${entryDate}.png`, { type: 'image/png' });

        const result = await uploadDoodleImage(file, entryDate, (pct) => {
          progressFill.style.width = `${75 + Math.round(pct * 0.2)}%`;
        });

        uploadedUrl = result.imageUrl;
        uploadedPath = result.imagePath;
      }

      statusText.textContent = 'Saving entry to disk...';
      progressFill.style.width = '95%';
      await saveDiaryEntry(entryDate, title, finalHtmlContent, uploadedUrl, uploadedPath);

      progressFill.style.width = '100%';
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

  const windowTitle = isEditMode ? `Edit Document — ${targetDate}` : 'New Diary Document';

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
    width: '740px',
    statusLeft: `Date: ${targetDate}`,
    statusRight: 'WordPad Mode'
  }, form);

  return windowEl;
}
