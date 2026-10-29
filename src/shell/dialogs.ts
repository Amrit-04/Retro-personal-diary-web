/**
 * The dialog layer: XP message boxes, confirmations, and the Log Off screen.
 *
 * Nothing in this app calls alert(). Every state the user has to react to is a real
 * Luna dialog, opened through one of these four functions and rendered by
 * DialogLayer.tsx above the windows.
 */
import { signal } from '@preact/signals';
import type { IconName } from './icons';

export interface MessageDialog {
  kind: 'message';
  title: string;
  text: string;
  icon: IconName;
  /** Shown as an extra button, e.g. Retry on a failed read. */
  actionLabel?: string;
  action?: () => void;
}

export interface ConfirmDialog {
  kind: 'confirm';
  title: string;
  text: string;
  yesLabel: string;
  onYes: () => void;
}

export interface LogOffDialog {
  kind: 'logoff';
}

export type Dialog = MessageDialog | ConfirmDialog | LogOffDialog;

export const dialog = signal<Dialog | null>(null);

export function showMessage(text: string, title = 'Diary XP', icon: IconName = 'info'): void {
  dialog.value = { kind: 'message', title, text, icon };
}

export function showProblem(text: string, retry: () => void, title = 'Problem'): void {
  dialog.value = { kind: 'message', title, text, icon: 'error', actionLabel: 'Retry', action: retry };
}

export function showConfirm(text: string, yesLabel: string, onYes: () => void, title = 'Confirm'): void {
  dialog.value = { kind: 'confirm', title, text, yesLabel, onYes };
}

export function showLogOff(): void {
  dialog.value = { kind: 'logoff' };
}

export function closeDialog(): void {
  dialog.value = null;
}
