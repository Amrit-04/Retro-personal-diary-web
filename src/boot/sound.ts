/**
 * The startup sound, and the mute switch the tray exposes.
 *
 * iOS only lets audio start from inside a real gesture, and the welcome screen is
 * not one. So the login tile's tap handler calls unlock() — play() then pause() —
 * which claims the gesture for the element, and the welcome screen plays it for
 * real a moment later. Nothing here awaits, or the gesture window closes.
 */
import { signal } from '@preact/signals';
import { STARTUP_SOUND } from '../lib/assets';

const MUTE_KEY = 'diary-xp.muted';

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export const muted = signal(readMuted());

let element: HTMLAudioElement | null = null;

function audio(): HTMLAudioElement | null {
  if (muted.value || typeof Audio === 'undefined') return null;
  if (!element) {
    element = new Audio();
    // Never fetched during the critical path; load() during the splash warms it.
    element.preload = 'none';
    element.src = STARTUP_SOUND;
  }
  return element;
}

/** Called when the splash appears: the file is on its way before it is needed. */
export function prepareSound(): void {
  audio()?.load();
}

export function unlockSound(): void {
  const player = audio();
  if (!player) return;
  const playing = player.play();
  if (playing && typeof playing.catch === 'function') playing.catch(() => undefined);
  player.pause();
  player.currentTime = 0;
}

export function playStartup(): void {
  const player = audio();
  if (!player) return;
  player.volume = 0.7;
  const playing = player.play();
  if (playing && typeof playing.catch === 'function') playing.catch(() => undefined);
}

export function setMuted(value: boolean): void {
  muted.value = value;
  try {
    localStorage.setItem(MUTE_KEY, value ? '1' : '0');
  } catch {
    /* Private mode: the choice just does not survive a reload. */
  }
  if (value) element?.pause();
}

export function toggleMuted(): void {
  setMuted(!muted.value);
}
