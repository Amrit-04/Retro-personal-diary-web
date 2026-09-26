import { el } from '../utils/dom';

export function showRetroAlert(title: string, message: string, icon = '⚠️'): Promise<void> {
  return new Promise((resolve) => {
    const overlay = el('div', { class: 'modal-overlay' });

    const okBtn = el('button', {
      class: 'bevel-button',
      onclick: () => {
        document.body.removeChild(overlay);
        resolve();
      }
    }, ['OK']);

    const dialog = el('div', { class: 'modal-dialog' }, [
      el('div', { class: 'window-titlebar' }, [
        el('div', { class: 'window-titlebar-left' }, [
          el('span', { class: 'window-title-icon' }, [icon]),
          el('span', {}, [title])
        ]),
        el('div', { class: 'window-controls' }, [
          el('button', {
            class: 'window-btn',
            onclick: () => {
              document.body.removeChild(overlay);
              resolve();
            }
          }, ['✕'])
        ])
      ]),
      el('div', { class: 'modal-body' }, [
        el('div', { class: 'modal-icon' }, [icon]),
        el('div', { class: 'modal-message' }, [message])
      ]),
      el('div', { class: 'modal-footer' }, [okBtn])
    ]);

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    okBtn.focus();
  });
}

export function showRetroConfirm(title: string, message: string, icon = '❓'): Promise<boolean> {
  return new Promise((resolve) => {
    const overlay = el('div', { class: 'modal-overlay' });

    const cleanup = (result: boolean) => {
      document.body.removeChild(overlay);
      resolve(result);
    };

    const okBtn = el('button', {
      class: 'bevel-button',
      onclick: () => cleanup(true)
    }, ['Yes']);

    const cancelBtn = el('button', {
      class: 'bevel-button',
      onclick: () => cleanup(false)
    }, ['Cancel']);

    const dialog = el('div', { class: 'modal-dialog' }, [
      el('div', { class: 'window-titlebar' }, [
        el('div', { class: 'window-titlebar-left' }, [
          el('span', { class: 'window-title-icon' }, [icon]),
          el('span', {}, [title])
        ]),
        el('div', { class: 'window-controls' }, [
          el('button', {
            class: 'window-btn',
            onclick: () => cleanup(false)
          }, ['✕'])
        ])
      ]),
      el('div', { class: 'modal-body' }, [
        el('div', { class: 'modal-icon' }, [icon]),
        el('div', { class: 'modal-message' }, [message])
      ]),
      el('div', { class: 'modal-footer' }, [okBtn, cancelBtn])
    ]);

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    okBtn.focus();
  });
}
