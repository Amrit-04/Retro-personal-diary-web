/**
 * The blue "welcome" screen. The startup sound plays here, which is also where the
 * audio unlocked by the login tap finally becomes audible.
 */
import { delay } from './splash';
import { playStartupSound } from './sound';

export async function showWelcome(host: HTMLElement, ms: number): Promise<void> {
  host.classList.add('is-on');
  // Next frame, so the opacity transition actually runs.
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  host.classList.add('is-faded');

  await playStartupSound();
  await delay(ms);

  host.classList.remove('is-on', 'is-faded');
}
