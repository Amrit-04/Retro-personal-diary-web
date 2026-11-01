/**
 * The screen between signing in and the desktop — ~1.8s, and the place the startup
 * sound plays (machine.enterWelcome starts it). Same bar as the splash.
 */
import { LogoMark } from '../shell/marks';

export function Welcome() {
  return (
    <div class="boot boot-welcome">
      <div class="welcome-brand">
        <LogoMark size={38} />
        <span>Welcome</span>
      </div>
      <div class="splash-bar" role="progressbar" aria-label="Loading your desktop">
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}
