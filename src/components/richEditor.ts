/**
 * Windows XP WordPad-inspired Rich Text Editor
 * Provides contenteditable editing with XP-styled toolbar for formatting,
 * inserting images, and inline drawings.
 */

import { el } from '../utils/dom';
import { processAndCompressImage, validateImageFile } from '../utils/image';
import { createPaintWindow } from './paint';

export interface RichEditorOptions {
  /** Called when the editor content changes */
  onChange?: (html: string) => void;
  /** Initial HTML content to load */
  initialContent?: string;
}

export function createRichEditor(options: RichEditorOptions = {}): {
  element: HTMLElement;
  getContent: () => string;
  setContent: (html: string) => void;
  focus: () => void;
} {
  const { onChange, initialContent = '' } = options;

  // State
  let currentRange: Range | null = null;

  // Toolbar container
  const toolbar = el('div', { class: 'rich-toolbar' }, []);

  // Content editable area
  const editor = el('div', {
    class: 'rich-doc-editor',
    contenteditable: 'true',
    spellcheck: 'true',
    innerHTML: initialContent
  });

  // Initialize toolbar with XP WordPad controls
  initToolbar();

  // Set up event listeners
  editor.addEventListener('keyup', saveRange);
  editor.addEventListener('mouseup', saveRange);
  editor.addEventListener('input', () => {
    if (onChange) onChange(editor.innerHTML);
  });
  editor.addEventListener('paste', handlePaste);
  editor.addEventListener('dragover', (e) => e.preventDefault());
  editor.addEventListener('drop', handleDrop);

  // Focus the editor when clicking inside
  editor.addEventListener('click', () => {
    // Restore range if we have one (e.g., after clicking a toolbar button)
    if (currentRange) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(currentRange);
      }
    }
  });

  const container = el('div', { class: 'rich-editor-container' }, [
    toolbar,
    editor
  ]);

  // Public API
  return {
    element: container,
    getContent: () => editor.innerHTML,
    setContent: (html: string) => {
      editor.innerHTML = html;
      if (onChange) onChange(editor.innerHTML);
    },
    focus: () => editor.focus()
  };

  // --- Toolbar Initialization ---

  function initToolbar() {
    // Font Family
    const fontFamily = createFontFamilySelect();
    toolbar.appendChild(createToolbarGroup(fontFamily, 'Font'));

    // Font Size
    const fontSize = createFontSizeSelect();
    toolbar.appendChild(createToolbarGroup(fontSize, 'Size'));

    toolbar.appendChild(createSeparator());

    // Formatting buttons
    const boldBtn = createFormatButton('bold', 'B', 'Bold', 'Ctrl+B');
    const italicBtn = createFormatButton('italic', 'I', 'Italic', 'Ctrl+I');
    const underlineBtn = createFormatButton('underline', 'U', 'Underline', 'Ctrl+U');
    const strikethroughBtn = createFormatButton('strikethrough', 'S', 'Strikethrough');

    toolbar.appendChild(createToolbarGroup([boldBtn, italicBtn, underlineBtn, strikethroughBtn], 'Font Styles'));

    toolbar.appendChild(createSeparator());

    // Alignment
    const alignLeftBtn = createAlignmentButton('justifyleft', 'Align Left');
    const alignCenterBtn = createAlignmentButton('justifycenter', 'Align Center');
    const alignRightBtn = createAlignmentButton('justifyright', 'Align Right');
    const justifyBtn = createAlignmentButton('justifyfull', 'Justify');

    toolbar.appendChild(createToolbarGroup([alignLeftBtn, alignCenterBtn, alignRightBtn, justifyBtn], 'Alignment'));

    toolbar.appendChild(createSeparator());

    // Text Color
    const colorInput = el('input', {
      type: 'color',
      class: 'rich-color-picker',
      value: '#000000',
      title: 'Text Color',
      onchange: (e: Event) => {
        const color = (e.target as HTMLInputElement).value;
        document.execCommand('foreColor', false, color);
        restoreRange();
        if (onChange) onChange(editor.innerHTML);
      }
    });
    toolbar.appendChild(createToolbarGroup(colorInput, 'Text Color'));

    toolbar.appendChild(createSeparator());

    // Lists
    const ulBtn = createListButton('insertunorderedlist', '• List', 'Bulleted List');
    const olBtn = createListButton('insertorderedlist', '1. List', 'Numbered List');

    toolbar.appendChild(createToolbarGroup([ulBtn, olBtn], 'Lists'));

    toolbar.appendChild(createSeparator());

    // Insert Image
    const imageInput = el('input', {
      type: 'file',
      accept: 'image/*',
      class: 'rich-file-input',
      style: { display: 'none' }
    });
    const imageBtn = el('button', {
      class: 'rich-toolbar-btn',
      title: 'Insert Image',
      onclick: () => imageInput.click()
    }, ['🖼️']);

    imageInput.addEventListener('change', async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        await insertImageFile(file);
        imageInput.value = ''; // Reset for same file re-selection
      }
    });

    toolbar.appendChild(createToolbarGroup(imageBtn, 'Insert Image'));

    // Inline Draw
    const drawBtn = el('button', {
      class: 'rich-toolbar-btn',
      title: 'Draw Inline',
      onclick: () => openInlinePaint()
    }, ['🎨 Draw']);

    toolbar.appendChild(createToolbarGroup(drawBtn, 'Inline Drawing'));
  }

  function createToolbarGroup(content: HTMLElement | HTMLElement[], label?: string): HTMLElement {
    const group = el('div', { class: 'rich-toolbar-group' });
    if (label) {
      const labelEl = el('span', { class: 'rich-toolbar-label' }, [label]);
      group.appendChild(labelEl);
    }
    const contentEl = Array.isArray(content) ? el('div', { class: 'rich-toolbar-content' }, content) : content;
    group.appendChild(contentEl);
    return group;
  }

  function createSeparator(): HTMLElement {
    return el('div', { class: 'rich-toolbar-separator' });
  }

  function createFontFamilySelect(): HTMLSelectElement {
    const select = el('select', {
      class: 'rich-select',
      onchange: (e: Event) => {
        const font = (e.target as HTMLSelectElement).value;
        document.execCommand('fontName', false, font);
        restoreRange();
        if (onChange) onChange(editor.innerHTML);
      }
    }, [
      el('option', { value: 'Tahoma', selected: true }, ['Tahoma']),
      el('option', { value: 'Arial' }, ['Arial']),
      el('option', { value: 'Georgia' }, ['Georgia']),
      el('option', { value: 'Courier New' }, ['Courier New']),
      el('option', { value: 'Times New Roman' }, ['Times New Roman']),
      el('option', { value: 'Comic Sans MS' }, ['Comic Sans MS'])
    ]);
    return select;
  }

  function createFontSizeSelect(): HTMLSelectElement {
    const select = el('select', {
      class: 'rich-select',
      onchange: (e: Event) => {
        const size = (e.target as HTMLSelectElement).value;
        document.execCommand('fontSize', false, size);
        restoreRange();
        if (onChange) onChange(editor.innerHTML);
      }
    }, [
      el('option', { value: '1' }, ['8 pt']),
      el('option', { value: '2' }, ['10 pt']),
      el('option', { value: '3', selected: true }, ['12 pt']),
      el('option', { value: '4' }, ['14 pt']),
      el('option', { value: '5' }, ['18 pt']),
      el('option', { value: '6' }, ['24 pt']),
      el('option', { value: '7' }, ['36 pt'])
    ]);
    return select;
  }

  function createFormatButton(command: string, text: string, title: string, shortcut?: string): HTMLButtonElement {
    const btn = el('button', {
      class: 'rich-toolbar-btn',
      title: title + (shortcut ? ` (${shortcut})` : ''),
      onclick: () => {
        document.execCommand(command, false, undefined);
        restoreRange();
        if (onChange) onChange(editor.innerHTML);
      }
    }, [text]);
    return btn;
  }

  function createAlignmentButton(command: string, title: string): HTMLButtonElement {
    const btn = el('button', {
      class: 'rich-toolbar-btn',
      title: title,
      onclick: () => {
        document.execCommand(command, false, undefined);
        restoreRange();
        if (onChange) onChange(editor.innerHTML);
      }
    }, [getAlignmentIcon(command)]);
    return btn;
  }

  function getAlignmentIcon(command: string): string {
    switch (command) {
      case 'justifyleft': return '⎿';
      case 'justifycenter': return '⎺';
      case 'justifyright': return '⎾';
      case 'justifyfull': return '⎔';
      default: return '';
    }
  }

  function createListButton(command: string, text: string, title: string): HTMLButtonElement {
    const btn = el('button', {
      class: 'rich-toolbar-btn',
      title: title,
      onclick: () => {
        document.execCommand(command, false, undefined);
        restoreRange();
        if (onChange) onChange(editor.innerHTML);
      }
    }, [text]);
    return btn;
  }

  function saveRange() {
    const selection = window.getSelection();
    if (selection?.rangeCount && selection.getRangeAt(0)) {
      currentRange = selection.getRangeAt(0).cloneRange();
    }
  }

  function restoreRange() {
    if (currentRange) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(currentRange);
      }
    }
  }

  async function insertImageFile(file: File) {
    try {
      // Validate and process image
      const validation = validateImageFile(file);
      if (!validation.valid) {
        showError(validation.error || 'Invalid image file');
        return;
      }

      const processed = await processAndCompressImage(file);
      const img = el('img', {
        src: processed.dataUrl,
        style: { maxWidth: '100%', height: 'auto', display: 'block', margin: '8px 0' }
      });

      // Insert at current range or cursor position
      if (currentRange) {
        currentRange.deleteContents();
        currentRange.insertNode(img);
        // Place cursor after the image
        const rangeAfter = document.createRange();
        rangeAfter.setStartAfter(img);
        rangeAfter.collapse(true);
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(rangeAfter);
        }
      } else {
        editor.appendChild(img);
        editor.appendChild(document.createElement('br'));
      }

      if (onChange) onChange(editor.innerHTML);
    } catch (err) {
      console.error('Failed to insert image:', err);
      showError('Failed to process image');
    }
  }

  function showError(message: string) {
    // Alert or modal
    alert(message);
  }

  async function handlePaste(e: ClipboardEvent) {
    // Check for image in clipboard
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const blob = items[i].getAsFile();
          if (blob) {
            const file = new File([blob], 'pasted-image.png', { type: blob.type });
            await insertImageFile(file);
          }
          return;
        }
      }
    }
    // Allow default paste for text
  }

  async function handleDrop(e: DragEvent) {
    e.preventDefault();
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length > 0) {
      const file = dt.files[0];
      if (file.type.startsWith('image/')) {
        await insertImageFile(file);
      }
    }
  }

  async function openInlinePaint() {
    // Save current range
    saveRange();

    // Create paint window with callback to insert drawing
    const paintWindow = createPaintWindow({
      onSave: async (imageUrl: string) => {
        // Remove paint overlay
        const overlay = document.querySelector('.paint-overlay');
        if (overlay) overlay.remove();

        // Convert data URL to blob for insertion
        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const file = new File([blob], 'inline-drawing.png', { type: 'image/png' });
          await insertImageFile(file);
        } catch (err) {
          console.error('Failed to process drawing:', err);
          showError('Failed to insert drawing');
        }
      },
      onCancel: () => {
        // Remove paint overlay and restore range
        const overlay = document.querySelector('.paint-overlay');
        if (overlay) overlay.remove();
        restoreRange();
      }
    });

    document.body.appendChild(paintWindow);
  }
}
