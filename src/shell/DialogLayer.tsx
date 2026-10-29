/**
 * Luna dialogs: message boxes (with an optional Retry), confirmations, and the
 * Log Off screen. Mounted above the windows on a dimmed desktop; Esc or Cancel
 * dismisses, Enter takes the default action.
 */
import { useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { closeDialog, dialog, type ConfirmDialog, type MessageDialog } from './dialogs';
import { XpIcon } from './icons';
import { logOff, restart } from '../boot/machine';
import './dialog.css';

export function DialogLayer() {
  const current = dialog.value;

  useEffect(() => {
    if (!current) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      closeDialog();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [current]);

  if (!current) return null;

  return (
    <div class="dlg-scrim">
      {current.kind === 'logoff' && <LogOffDialog />}
      {current.kind === 'message' && <MessageBox box={current} />}
      {current.kind === 'confirm' && <ConfirmBox box={current} />}
    </div>
  );
}

function DialogFrame({ title, children }: { title: string; children: ComponentChildren }) {
  return (
    <div class="dlg dlg--box" role="alertdialog" aria-modal="true" aria-label={title}>
      <div class="dlg-title">
        <span>{title}</span>
        <button class="dlg-x" type="button" onClick={closeDialog} aria-label="Close">
          <span class="dlg-x-bar" />
          <span class="dlg-x-bar dlg-x-bar--flip" />
        </button>
      </div>
      {children}
    </div>
  );
}

function MessageBox({ box }: { box: MessageDialog }) {
  const accept = () => {
    closeDialog();
    box.action?.();
  };
  return (
    <DialogFrame title={box.title}>
      <div class="dlg-main">
        <XpIcon name={box.icon} size={32} />
        <p class="dlg-text">{box.text}</p>
      </div>
      <div class="dlg-actions">
        <button class="dlg-button dlg-button--default" type="button" onClick={closeDialog}>
          OK
        </button>
        {box.actionLabel && (
          <button class="dlg-button" type="button" onClick={accept}>
            {box.actionLabel}
          </button>
        )}
      </div>
    </DialogFrame>
  );
}

function ConfirmBox({ box }: { box: ConfirmDialog }) {
  const accept = () => {
    closeDialog();
    box.onYes();
  };
  return (
    <DialogFrame title={box.title}>
      <div class="dlg-main">
        <XpIcon name="question" size={32} />
        <p class="dlg-text">{box.text}</p>
      </div>
      <div class="dlg-actions">
        <button class="dlg-button dlg-button--default" type="button" onClick={accept}>
          {box.yesLabel}
        </button>
        <button class="dlg-button" type="button" onClick={closeDialog}>
          No
        </button>
      </div>
    </DialogFrame>
  );
}

function LogOffDialog() {
  return (
    <div class="dlg dlg--logoff" role="alertdialog" aria-modal="true" aria-label="Log off">
      <div class="dlg-band">
        <span>Log off Diary XP</span>
        <button class="dlg-x dlg-x--band" type="button" onClick={closeDialog} aria-label="Close">
          <span class="dlg-x-bar" />
          <span class="dlg-x-bar dlg-x-bar--flip" />
        </button>
      </div>
      <div class="dlg-logoff-body">
        <p class="dlg-lead">Are you sure you want to log off your diary?</p>
        <div class="dlg-round-row">
          <button class="dlg-round" type="button" onClick={logOff}>
            <span class="dlg-round-circle">
              <XpIcon name="logoff" size={20} />
            </span>
            <span>Log Off</span>
          </button>
          <button class="dlg-round" type="button" onClick={restart}>
            <span class="dlg-round-circle">
              <XpIcon name="restart" size={20} />
            </span>
            <span>Restart</span>
          </button>
        </div>
      </div>
      <div class="dlg-band dlg-band--foot">
        <button class="dlg-button" type="button" onClick={closeDialog}>
          Cancel
        </button>
      </div>
    </div>
  );
}
