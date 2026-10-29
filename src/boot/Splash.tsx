/**
 * The brand splash. The bar is three blocks sliding through a well, driven by CSS
 * keyframes in index.html — no rAF, no JavaScript on the frame budget.
 *
 * The wordmark and mark are ours (brief §3): no "Windows XP" text, no flag logo.
 */
import { LogoMark, Wordmark } from '../shell/marks';

export function Splash() {
  return (
    <div class="boot boot-splash">
      <div class="splash-brand">
        <LogoMark size={46} />
        <div>
          <Wordmark size={40} />
          <div class="splash-edition">Personal Diary, Home Edition</div>
        </div>
      </div>
      <div class="splash-bar" role="progressbar" aria-label="Starting">
        <i />
        <i />
        <i />
      </div>
      <div class="splash-legal">An original desktop shell. Not affiliated with Microsoft.</div>
    </div>
  );
}
