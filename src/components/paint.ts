/**
 * Windows XP Inspired Paint Application
 * A simple drawing tool for diary doodles
 */

import { el } from '../utils/dom';

// Drawing tool types
type Tool = 'pencil' | 'brush' | 'eraser' | 'fill' | 'line' | 'rect' | 'ellipse' | 'colorpicker';

// Color palette (XP classic colors)
const XP_COLORS = [
  '#000000', '#FFFFFF', '#808080', '#C0C0C0',
  '#800000', '#FF0000', '#808000', '#FFFF00',
  '#008000', '#00FF00', '#008080', '#00FFFF',
  '#000080', '#0000FF', '#800080', '#FF00FF'
];

export interface PaintOptions {
  onSave: (imageUrl: string) => void;
  onCancel: () => void;
  initialImage?: string; // Optional initial image to load (for editing)
}

export function createPaintWindow(options: PaintOptions): HTMLElement {
  const { onSave, onCancel, initialImage } = options;

  // State
  let currentTool: Tool = 'pencil';
  let currentColor = '#000000';
  let brushSize = 3;
  let isDrawing = false;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;

  // Canvas and context
  const canvas = el('canvas', {
    class: 'paint-canvas',
    width: '560',
    height: '400'
  }) as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;

  // Initialize canvas
  function initCanvas() {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (initialImage) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = initialImage;
    }
  }

  // Drawing functions
  function startDrawing(e: PointerEvent) {
    isDrawing = true;
    [startX, startY] = [e.offsetX, e.offsetY];
    [lastX, lastY] = [e.offsetX, e.offsetY];
  }

  function draw(e: PointerEvent) {
    if (!isDrawing) return;

    const [offsetX, offsetY] = [e.offsetX, e.offsetY];

    switch (currentTool) {
      case 'pencil':
        drawPencil(lastX, lastY, offsetX, offsetY);
        break;
      case 'brush':
        drawBrush(lastX, lastY, offsetX, offsetY);
        break;
      case 'eraser':
        drawEraser(lastX, lastY, offsetX, offsetY);
        break;
      case 'line':
      case 'rect':
      case 'ellipse':
      case 'colorpicker':
      case 'fill':
        break;
    }

    [lastX, lastY] = [offsetX, offsetY];
  }

  function endDrawing() {
    isDrawing = false;
    // For line, rect, ellipse we draw on mouse up
    switch (currentTool) {
      case 'line':
        drawLine(startX, startY, lastX, lastY);
        break;
      case 'rect':
        drawRect(startX, startY, lastX, lastY);
        break;
      case 'ellipse':
        drawEllipse(startX, startY, lastX, lastY);
        break;
      default:
        break;
    }
  }

  function drawPencil(x1: number, y1: number, x2: number, y2: number) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  function drawBrush(x1: number, y1: number, x2: number, y2: number) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize * 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  function drawEraser(x1: number, y1: number, x2: number, y2: number) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = brushSize * 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  function drawLine(x1: number, y1: number, x2: number, y2: number) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize;
    ctx.stroke();
  }

  function drawRect(x1: number, y1: number, x2: number, y2: number) {
    ctx.beginPath();
    ctx.rect(
      Math.min(x1, x2),
      Math.min(y1, y2),
      Math.abs(x2 - x1),
      Math.abs(y2 - y1)
    );
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize;
    ctx.stroke();
  }

  function drawEllipse(x1: number, y1: number, x2: number, y2: number) {
    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;
    const radiusX = Math.abs(x2 - x1) / 2;
    const radiusY = Math.abs(y2 - y1) / 2;

    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize;
    ctx.stroke();
  }

  function fillCanvas() {
    ctx.fillStyle = currentColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function pickColor(e: PointerEvent) {
    const pixel = ctx.getImageData(e.offsetX, e.offsetY, 1, 1).data;
    const color = `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1].toString(16).padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`;
    currentColor = color;
    updateColorDisplay();
  }

  // UI Elements
  function createToolButton(tool: Tool, title: string, icon: string): HTMLElement {
    const btn = el('button', {
      class: `paint-tool-btn ${tool === currentTool ? 'active' : ''}`,
      title,
      onclick: () => {
        setTool(tool);
      }
    }, [icon]);
    return btn;
  }

  function setTool(tool: Tool) {
    currentTool = tool;
    document.querySelectorAll('.paint-tool-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`.paint-tool-btn[data-tool="${tool}"]`) as HTMLElement;
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
    canvas.style.cursor = getCursorForTool(tool);
  }

  function getCursorForTool(tool: Tool): string {
    switch (tool) {
      case 'pencil': return 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><line x1="0" y1="0" x2="8" y2="8" stroke="%23000000" stroke-width="2"/></svg>\"), auto';
      case 'brush': return 'crosshair';
      case 'eraser': return 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="7" stroke="%23FF0000" stroke-width="2" fill="none"/></svg>\"), auto';
      case 'colorpicker': return 'crosshair';
      case 'fill': return 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect x="2" y="2" width="12" height="12" stroke="%23008000" stroke-width="2" fill="%2300800020"/></svg>\"), auto';
      default: return 'default';
    }
  }

  function createColorPalette(): HTMLElement {
    const palette = el('div', { class: 'paint-palette' });
    XP_COLORS.forEach(color => {
      const colorEl = el('div', {
        class: 'paint-color',
        style: { backgroundColor: color },
        title: color,
        onclick: () => {
          currentColor = color;
          updateColorDisplay();
        }
      });
      if (color === currentColor) {
        colorEl.classList.add('selected');
      }
      palette.appendChild(colorEl);
    });
    return palette;
  }

  function updateColorDisplay() {
    const colorDisplay = document.getElementById('paint-color-display');
    if (colorDisplay) {
      colorDisplay.style.backgroundColor = currentColor;
    }
    document.querySelectorAll('.paint-color').forEach(el => {
      const htmlEl = el as HTMLElement;
      htmlEl.classList.remove('selected');
      if (htmlEl.style.backgroundColor === currentColor) {
        htmlEl.classList.add('selected');
      }
    });
    if (currentTool === 'colorpicker') {
      canvas.style.cursor = 'crosshair';
    } else {
      canvas.style.cursor = getCursorForTool(currentTool);
    }
  }

  function createSizeSlider(): HTMLElement {
    const container = el('div', { class: 'paint-size-container' });
    const label = el('span', {}, ['Size: ']);
    const valueSpan = el('span', { id: 'paint-size-value' }, [String(brushSize)]);
    const slider = el('input', {
      type: 'range',
      min: '1',
      max: '20',
      value: String(brushSize),
      oninput: (e: Event) => {
        brushSize = Number((e.target as HTMLInputElement).value);
        valueSpan.textContent = String(brushSize);
      }
    });
    container.appendChild(label);
    container.appendChild(slider);
    container.appendChild(valueSpan);
    return container;
  }

  // Build the Paint window content
  const toolbar = el('div', { class: 'paint-toolbar' }, [
    createToolButton('pencil', 'Pencil', '✏️'),
    createToolButton('brush', 'Brush', '🖌️'),
    createToolButton('eraser', 'Eraser', '🧽'),
    createToolButton('fill', 'Fill Bucket', '🪣'),
    createToolButton('colorpicker', 'Color Picker', '🎨'),
    createToolButton('line', 'Line', '➖'),
    createToolButton('rect', 'Rectangle', '🔲'),
    createToolButton('ellipse', 'Ellipse', '⭕'),
    createSizeSlider()
  ]);

  const colorPalette = createColorPalette();
  const colorDisplay = el('div', {
    id: 'paint-color-display',
    class: 'paint-color-display',
    style: { backgroundColor: currentColor, width: '20px', height: '20px', border: '1px solid #000' }
  });

  const statusBar = el('div', { class: 'paint-status-bar' }, [
    el('span', { id: 'paint-status-tool' }, ['Tool: Pencil']),
    el('span', { id: 'paint-status-color' }, ['Color: #000000']),
    el('span', { id: 'paint-status-pos' }, ['X: 0, Y: 0'])
  ]);

  // Update status bar on mouse move
  canvas.addEventListener('pointermove', (e: PointerEvent) => {
    document.getElementById('paint-status-pos')!.textContent = `X: ${e.offsetX}, Y: ${e.offsetY}`;
    document.getElementById('paint-status-tool')!.textContent = `Tool: ${currentTool}`;
    document.getElementById('paint-status-color')!.textContent = `Color: ${currentColor}`;
  });

  // Canvas events
  canvas.addEventListener('pointerdown', (e: PointerEvent) => startDrawing(e));
  canvas.addEventListener('pointermove', (e: PointerEvent) => draw(e));
  canvas.addEventListener('pointerup', () => endDrawing());
  canvas.addEventListener('pointerleave', () => endDrawing());
  canvas.addEventListener('pointerdown', (e: PointerEvent) => {
    if (currentTool === 'fill') {
      fillCanvas();
    } else if (currentTool === 'colorpicker') {
      pickColor(e);
    }
  });

  // Buttons
  const saveBtn = el('button', {
    class: 'bevel-button',
    onclick: () => {
      const imageUrl = canvas.toDataURL('image/png');
      onSave(imageUrl);
    }
  }, ['💾 Save']);

  const cancelBtn = el('button', {
    class: 'bevel-button',
    onclick: () => {
      onCancel();
    }
  }, ['Cancel']);

  const buttonContainer = el('div', { class: 'paint-button-container' }, [
    saveBtn,
    cancelBtn
  ]);

  // Main content
  const content = el('div', { class: 'paint-content' }, [
    toolbar,
    el('div', { class: 'paint-main' }, [
      el('div', { class: 'paint-canvas-container' }, [canvas]),
      el('div', { class: 'paint-options' }, [
        el('div', { class: 'paint-color-section' }, [
          el('span', {}, ['Color: ']),
          colorDisplay,
          colorPalette
        ]),
        el('div', { class: 'paint-size-section' }, [
          el('span', {}, ['Brush Size: ']),
          createSizeSlider()
        ])
      ])
    ]),
    statusBar,
    buttonContainer
  ]);

  const windowContainer = el('div', {
    class: 'retro-window',
    style: {
      width: '600px',
      maxHeight: 'calc(100vh - var(--taskbar-height) - 32px)'
    }
  });

  // Title bar
  const titlebar = el('div', { class: 'window-titlebar' }, [
    el('div', { class: 'window-titlebar-left' }, [
      el('span', { class: 'window-title-icon' }, ['🎨']),
      el('span', {}, ['Paint'])
    ]),
    el('div', { class: 'window-controls' }, [
      el('button', {
        class: 'window-btn-xp window-btn-close',
        title: 'Close',
        onclick: () => {
          onCancel();
          const overlay = document.querySelector('.paint-overlay');
          if (overlay) {
            overlay.remove();
          }
        }
      }, ['✕'])
    ])
  ]);

  windowContainer.appendChild(titlebar);
  windowContainer.appendChild(content);

  const overlay = el('div', { class: 'paint-overlay' });
  overlay.appendChild(windowContainer);

  initCanvas();

  return overlay;
}