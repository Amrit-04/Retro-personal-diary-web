/**
 * Startup sound. Browsers block autoplay, so the login tap is the gesture that
 * unlocks the element and the welcome screen is where it actually plays.
 * One short mono file, preloaded only after the splash starts.
 */

const src = '/startup.mp3';
const MUTE_KEY = 'diaryxp.muted';

let element: HTMLAudioElement | null = null;
let muted = readMuted();

function audio(): HTMLAudioElement {
  if (!element) {
    element = new Audio();
    element.preload = 'none';
    element.volume = 0.65;
  }
  return element;
}

export function isMuted(): boolean {
  return muted;
}

/** Called when the splash begins, so the bytes arrive during the animation. */
export function preloadStartupSound(): void {
  if (muted) return;
  audio().src = src;
  audio().load();
}

/**
 * Called synchronously inside the login tap. On iOS Safari this is what marks the
 * element as user-activated; the audible play comes later, on the welcome screen.
 */
export function unlockAudio(): void {
  const player = audio();
  if (!player.src) player.src = src;
  const attempt = player.play();
  if (attempt && typeof attempt.catch === 'function') {
    attempt.catch(() => undefined);
  }
  player.pause();
  player.currentTime = 0;
}

export async function playStartupSound(): Promise<void> {
  if (muted) return;
  const player = audio();
  player.src = src;
  try {
    player.currentTime = 0;
    await player.play();
  } catch {
    /* Blocked or missing file: a silent boot is still a working boot. */
  }
}

export function stopStartupSound(): void {
  element?.pause();
}

/** Returns the new muted state, for the tray icon. */
export function toggleMuted(): boolean {
  muted = !muted;
  writeMuted(muted);
  if (muted) element?.pause();
  return muted;
}

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeMuted(value: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, value ? '1' : '0');
  } catch {
    /* Preference is lost if storage is unavailable; the sound still works. */
  }
}
