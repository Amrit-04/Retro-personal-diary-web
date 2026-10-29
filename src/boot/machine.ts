/**
 * The boot state machine.
 *
 * Phases (brief §5): BIOS ~1.5s -> splash 2-2.5s -> logon (waits for a tap) ->
 * welcome ~1.8s with the startup sound -> desktop. The whole sequence runs once per
 * tab; a later load in the same tab is silent.
 *
 * The interesting part is what happens *during* the animation. Firebase auth, the
 * desktop chunk and the last-7-days query are all kicked off the moment the BIOS
 * screen is up, so by the time the splash bar has run twice the data is already in
 * the session cache and the desktop paints from memory. Nothing on the critical
 * path imports Firebase: this module reaches it only through dynamic import.
 */
import { signal } from '@preact/signals';
import type { ComponentType } from 'preact';
import { reduced } from './motion';
import { playStartup, prepareSound, unlockSound } from './sound';
import type { Session } from '../firebase/auth';

export type Phase = 'loading' | 'bios' | 'splash' | 'login' | 'welcome' | 'desktop';

/** Measured against the references; reduced motion takes every hold out. */
const BIOS_MS = reduced ? 250 : 1500;
const SPLASH_MIN_MS = reduced ? 400 : 2000;
const SPLASH_MAX_MS = reduced ? 1500 : 8000;
const WELCOME_MS = reduced ? 250 : 1800;
const AUTH_TIMEOUT_MS = 6000;

const BOOTED_KEY = 'diary-xp.booted';

function readBooted(): boolean {
  try {
    return sessionStorage.getItem(BOOTED_KEY) === '1';
  } catch {
    return false;
  }
}

function markBooted(): void {
  try {
    sessionStorage.setItem(BOOTED_KEY, '1');
  } catch {
    /* Private mode: the sequence simply plays again on reload. */
  }
}

/** A sleep that skipBoot() can cut short, so no timer has to be tracked by hand. */
const waiters = new Set<() => void>();

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const settle = () => {
      clearTimeout(timer);
      waiters.delete(settle);
      resolve();
    };
    const timer = setTimeout(settle, ms);
    waiters.add(settle);
  });
}

export const phase = signal<Phase>(readBooted() ? 'loading' : 'bios');
export const session = signal<Session | null>(null);
export const authError = signal<string | null>(null);
export const signingIn = signal(false);

/** False when no .env exists: the logon tile then says what it is signing into. */
export const runtimeLive = signal(true);

/** Desktop chunk, loaded while the splash runs; null until it lands. */
const DesktopComponent = signal<ComponentType | null>(null);

interface AuthApi {
  authStateReady(): Promise<Session | null>;
  signInWithGoogle(): Promise<Session | null>;
  signOut(): Promise<void>;
  describeAuthError(error: unknown): string;
}

let auth: AuthApi | null = null;
let started = false;

/** Tap, click, Esc or Enter during phases 1-2 goes straight to the logon screen. */
export function skipBoot(): void {
  if (phase.value !== 'bios' && phase.value !== 'splash') return;
  for (const settle of [...waiters]) settle();
}

export function start(): void {
  if (started) return;
  started = true;
  const runtime = loadRuntime();
  if (phase.value === 'loading') {
    void finishSilently(runtime);
    return;
  }
  markBooted();
  void runSequence(runtime);
}

/** Everything the app needs after boot, downloaded behind the animation. */
async function loadRuntime(): Promise<void> {
  const [authModule, appModule, desktopModule] = await Promise.all([
    import('../firebase/auth'),
    import('../firebase/app'),
    import('../shell/Desktop'),
  ]);
  auth = authModule;
  runtimeLive.value = appModule.isLive;
  DesktopComponent.value = desktopModule.Desktop;
}

async function runSequence(runtime: Promise<void>): Promise<void> {
  phase.value = 'bios';
  await sleep(BIOS_MS);
  if (phase.value !== 'bios') return;

  phase.value = 'splash';
  prepareSound();
  await Promise.race([Promise.all([runtime, sleep(SPLASH_MIN_MS)]), sleep(SPLASH_MAX_MS)]);
  await runtime;

  session.value = await resolveSession();
  await warmRecentEntries();
  if (session.value) await enterWelcome();
  else phase.value = 'login';
}

async function finishSilently(runtime: Promise<void>): Promise<void> {
  await runtime;
  session.value = await resolveSession();
  await warmRecentEntries();
  phase.value = session.value ? 'desktop' : 'login';
}

/**
 * The session, or null if Firebase cannot answer. A hung auth call must not strand
 * the user on the splash, and it must not look like a sign-in failure either: the
 * logon screen still works, and its tile reports the real error when tapped.
 */
async function resolveSession(): Promise<Session | null> {
  if (!auth) return null;
  try {
    return await withTimeout(auth.authStateReady(), AUTH_TIMEOUT_MS, null);
  } catch {
    return null;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([promise, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]);
}

/**
 * The desktop's first query, issued while the splash is still on screen. entries.ts
 * caches the result for the session, so the desktop paints from memory and this is
 * the only place the read is paid for.
 */
async function warmRecentEntries(): Promise<void> {
  if (!session.value) return;
  const { getRecentEntries } = await import('../firebase/entries');
  try {
    await getRecentEntries();
  } catch {
    /* The desktop shows the failure with a Retry button; boot must not stop here. */
  }
}

async function enterWelcome(): Promise<void> {
  phase.value = 'welcome';
  playStartup();
  await sleep(WELCOME_MS);
  phase.value = 'desktop';
}

/**
 * The logon tile. unlockSound() runs first and nothing is awaited before it, so the
 * gesture is still open when iOS decides whether this audio element is allowed.
 */
export function tapUserTile(): void {
  unlockSound();
  if (!auth) return;
  if (session.value) {
    void enterWelcome();
    return;
  }

  signingIn.value = true;
  authError.value = null;
  const api = auth;
  api
    .signInWithGoogle()
    .then((next) => {
      // A redirect sign-in reloads the page and never comes back here.
      if (!next) return;
      session.value = next;
      return afterSignIn(api);
    })
    .catch((error: unknown) => {
      authError.value = auth?.describeAuthError(error) ?? 'Sign-in failed. Try again.';
    })
    .finally(() => {
      signingIn.value = false;
    });
}

async function afterSignIn(api: AuthApi): Promise<void> {
  await api.authStateReady();
  await warmRecentEntries();
  // Already past the splash, so this is the only animation the sign-in gets.
  if (phase.value === 'desktop') return;
  phase.value = 'welcome';
  playStartup();
  await sleep(reduced ? 200 : 900);
  phase.value = 'desktop';
}

/** Start menu -> Log Off: drop the session and sit back down on the logon screen. */
export async function logOff(): Promise<void> {
  const api = auth;
  if (api) {
    try {
      await api.signOut();
    } catch {
      /* Signed out locally either way; the next read will show the real error. */
    }
  }
  const { invalidateEntries } = await import('../firebase/entries');
  invalidateEntries();
  session.value = null;
  authError.value = null;
  phase.value = 'login';
}

/** Start menu -> Restart, and the logon screen's Restart link: replay the boot. */
export function restart(): void {
  authError.value = null;
  void runSequence(Promise.resolve());
}

export function renderPhase(): ComponentType | null {
  return DesktopComponent.value;
}
