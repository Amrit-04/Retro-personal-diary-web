/**
 * A small modal question used for Log Off / Restart and for Delete confirmation.
 * Resolves with the chosen action's value, or null on Cancel, Escape or backdrop
 * click. Replaces every alert() in the app.
 */
import '../styles/dialog.css';
import { h } from '../lib/dom';

export interface DialogAction {
  label: string;
  value: string;
  kind?: 'primary' | 'danger' | 'default';
}

export interface DialogOptions {
  title: string;
  message: string;
  actions: DialogAction[];
  /** Which action gets focus; safety first, so the default is the last one. */
  focusValue?: string;
}

export function ask(options: DialogOptions): Promise<string | null> {
  const previous = document.activeElement as HTMLElement | null;

  return new Promise((resolve) => {
    const settle = (value: string | null) => {
      document.removeEventListener('keydown', onKey, true);
      backdrop.remove();
      previous?.focus?.({ preventScroll: true });
      resolve(value);
    };

    const buttons = options.actions.map((action) =>
      h('button', {
        class: `btn btn-${action.kind ?? 'default'}`,
        type: 'button',
        onclick: () => settle(action.value),
      }, action.label),
    );

    const backdrop = h('div', { class: 'dialog-backdrop' }, [
      h('div', { class: 'dialog', role: 'dialog', 'aria-modal': 'true', 'aria-label': options.title }, [
        h('h2', { class: 'dialog-title' }, options.title),
        h('p', { class: 'dialog-message' }, options.message),
        h('div', { class: 'dialog-actions' }, buttons),
      ]),
    ]);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        settle(null);
      }
    };

    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) settle(null);
    });
    document.addEventListener('keydown', onKey, true);

    document.body.appendChild(backdrop);
    const wanted = options.focusValue
      ? options.actions.findIndex((action) => action.value === options.focusValue)
      : buttons.length - 1;
    buttons[wanted >= 0 ? wanted : buttons.length - 1]?.focus({ preventScroll: true });
  });
}
