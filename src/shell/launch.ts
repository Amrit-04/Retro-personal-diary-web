/**
 * The one place that turns a click into a window.
 *
 * Until an app is registered in registry.ts there is nothing to open, and the honest
 * answer is a dialog saying so — not an empty frame. Every diary app added later
 * removes its case from this by existing, without changing a single call site.
 */
import { showMessage } from './dialogs';
import { APP_LABEL, hasApp } from './registry';
import { open, type AppId, type WindowProps } from './windows';

export function launch(app: AppId, props: WindowProps = {}): void {
  if (!hasApp(app)) {
    showMessage(
      `${APP_LABEL[app]} is not installed yet. Its window is built right after this desktop look is approved.`,
      APP_LABEL[app],
      'info',
    );
    return;
  }
  open(app, props);
}
