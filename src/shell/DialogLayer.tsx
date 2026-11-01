/**
 * Luna dialogs: message boxes (with an optional Retry), confirmations, and the Log
 * Off screen. Esc closes; there is no click-outside-to-dismiss, because XP's dialogs
 * want a choice.
 */
import { useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { closeDialog, dialog, type ConfirmDialog, type MessageDialog } from './dialogs';
import { XpIcon } from './icons';
import { LogoMark } from './marks';
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
        <XpIcon name={box.icon} size={30} />
        <p class="dlg-text">{box.text}</p>
      </div>
      <div class="dlg-actions">
        <button class="dlg-button" type="button" onClick={closeDialog}>
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
        <XpIcon name="question" size={30} />
        <p class="dlg-text">{box.text}</p>
      </div>
      <div class="dlg-actions">
        <button class="dlg-button" type="button" onClick={accept}>
          {box.yesLabel}
        </button>
        <button class="dlg-button" type="button" onClick={closeDialog}>
          No
        </button>
      </div>
    </DialogFrame>
  );
}

/**
 * The power screen from the reference: a 300x190 box, a navy header with the
 * product mark where the Windows logo sat, two big actions on the gradient, and a
 * small Cancel in the footer.
 */
function LogOffDialog() {
  return (
    <div class="dlg dlg--logoff" role="alertdialog" aria-modal="true" aria-label="Log off">
      <div class="dlg-band">
        <span class="dlg-band__text">Log off Diary XP</span>
        <LogoMark size={30} />
      </div>

      <div class="dlg-logoff-body">
        <button class="dlg-round" type="button" onClick={logOff}>
          <XpIcon name="logoff" size={30} />
          <span class="dlg-round__text">Log Off</span>
        </button>
        <button class="dlg-round" type="button" onClick={restart}>
          <XpIcon name="restart" size={30} />
          <span class="dlg-round__text">Restart</span>
        </button>
      </div>

      <div class="dlg-band dlg-band--foot">
        <button class="dlg-button" type="button" onClick={closeDialog}>
          Cancel
        </button>
      </div>
    </div>
  );
}
