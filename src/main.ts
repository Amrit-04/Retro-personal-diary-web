/**
 * Boot orchestrator.
 *
 * Sequence: BIOS POST -> splash (while the SDK and the UI download) -> login if
 * there is no session -> welcome (the startup sound plays here) -> desktop.
 *
 * Nothing in this file may import Firebase at module level: the SDK is reached
 * through dynamic imports that start while the boot animation is already painting,
 * so the critical path stays a few kilobytes of HTML, CSS and this state machine.
 */
import { runBios } from './boot/bios';
import { runSplash } from './boot/splash';
import { showWelcome } from './boot/welcome';
import { mountLogin, unmountLogin } from './boot/login';
import { preloadStartupSound, stopStartupSound } from './boot/sound';
import './styles/base.css';
import type { Session } from './firebase/auth';

type AuthModule = typeof import('./firebase/auth');
type DesktopModule = typeof import('./ui/desktop');

/** Set once the desktop has been shown, so later visits in this tab skip the POST. */
const BOOTED_KEY = 'diaryxp.booted';

const SPLASH_MIN_MS = 1400;
const SPLASH_MAX_MS = 8000;
const WELCOME_MS = 2000;

const bios = document.getElementById('bios');
const splash = document.getElementById('splash');
const welcome = document.getElementById('welcome');
const app = document.getElementById('app');
const overlay = document.getElementById('boot');

// A demo build has no Firebase config; login.ts says so on the tile.
const demo = !import.meta.env.VITE_FIREBASE_PROJECT_ID;

/**
 * The entry stylesheet is preloaded and swapped in on load so it cannot delay the
 * boot paint. A cached response can in principle finish before the swap handler is
 * attached, so the swap is repeated here: setting `rel` on a link whose bytes are
 * already in hand applies them without another request.
 */
for (const link of document.querySelectorAll<HTMLLinkElement>('link[as="style"]')) {
  if (link.rel !== 'stylesheet') link.rel = 'stylesheet';
}

void boot();

async function boot(): Promise<void> {
  if (!app || !overlay || !bios || !splash || !welcome) {
    if (document.body) {
      document.body.textContent = 'Diary XP could not start: the page markup is incomplete.';
    }
    return;
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const skip = installSkipGestures();

  // Downloads start now, so the animation has something honest to cover.
  const loads = Promise.all([import('./firebase/auth'), import('./ui/desktop')] as const);

  try {
    if (hasBooted()) {
      // Already posted in this tab: no animation, straight to the desktop.
      const [auth, desktop] = await loads;
      const session = await signIn(auth, skip);

      if (session) await arrive(auth, desktop, session, reduced, skip, false);
      else await throughLogin(auth, desktop, session, reduced, skip);
      return;
    }

    if (!reduced) await runBios(bios, skip.requested);
    off(bios);

    if (!reduced) preloadStartupSound();
    await runSplash(splash, {
      minMs: reduced ? 0 : SPLASH_MIN_MS,
      maxMs: SPLASH_MAX_MS,
      loaded: loads,
      skip: skip.promise,
    });
    off(splash);

    const [auth, desktop] = await loads;
    const session = await signIn(auth, skip);

    if (session) await arrive(auth, desktop, session, reduced, skip, true);
    else await throughLogin(auth, desktop, session, reduced, skip);
  } catch (error) {
    showFatal(overlay, error);
  }
}

/* ------------------------------------------------------------------ phases */

/**
 * Resolves the restored session and starts the desktop's only read behind the
 * animation. A failure is not fatal: the desktop shows a Retry of its own.
 */
async function signIn(auth: AuthModule, skip: SkipGestures): Promise<Session | null> {
  const session = await auth.authStateReady();
  if (session) warmRecentEntries();
  skip.stop();
  return session;
}

function warmRecentEntries(): void {
  void import('./firebase/entries')
    .then((entries) => entries.getRecentEntries())
    .catch(() => undefined);
}

async function throughLogin(
  auth: AuthModule,
  desktop: DesktopModule,
  restored: Session | null,
  reduced: boolean,
  skip: SkipGestures,
): Promise<void> {
  skip.stop();
  const session = await runLogin(auth, restored);
  await arrive(auth, desktop, session, reduced, skip, true);
}

async function arrive(
  auth: AuthModule,
  desktop: DesktopModule,
  session: Session,
  reduced: boolean,
  skip: SkipGestures,
  withWelcome: boolean,
): Promise<void> {
  skip.stop();

  if (withWelcome) {
    // The startup sound plays here; reduced motion shortens the screen, not the sound.
    await showWelcome(welcome!, reduced ? 0 : WELCOME_MS);
    off(welcome!);
  }

  markBooted();
  overlay!.hidden = true;
  app!.classList.add('is-live');

  desktop.mountDesktop(app!, session, {
    onLogOff: () => logOff(auth),
    onRestart: restart,
  });
}

/** The login screen, mounted over the boot overlay and awaited like a phase. */
function runLogin(auth: AuthModule, restored: Session | null): Promise<Session> {
  return new Promise((resolve) => {
    const screen = mountLogin(overlay!, {
      session: restored,
      demo,
      onRestart: restart,
      onPickUser: async (picked) => {
        // A restored session means the tile is a shortcut, not a sign-in request.
        const next = picked ?? (await auth.signInWithGoogle());
        if (!next) return; // a redirect sign-in is in flight; the page is leaving

        unmountLogin(screen);
        warmRecentEntries();
        resolve(next);
      },
    });
  });
}

/* ------------------------------------------------------------------ exits */

function logOff(auth: AuthModule): void {
  stopStartupSound();
  clearBooted();
  void auth.signOut().finally(() => location.reload());
}

/** A restart re-runs the POST, so the gate is cleared before reloading. */
function restart(): void {
  stopStartupSound();
  clearBooted();
  location.reload();
}

function showFatal(overlayNode: HTMLElement, error: unknown): void {
  console.error('Boot failed:', error);
  overlayNode.hidden = false;
  overlayNode.textContent = '';

  const message = document.createElement('p');
  message.textContent = 'Diary XP could not start. The files may have changed since this page was opened — reload to try again.';
  message.style.cssText = 'margin:auto;padding:24px;font:15px/1.6 system-ui,sans-serif;color:#e5e7eb;text-align:center;';

  const button = document.createElement('button');
  button.textContent = 'Reload';
  button.className = 'btn';
  button.onclick = () => location.reload();

  const box = document.createElement('div');
  box.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;gap:14px;align-items:center;justify-content:center;';
  box.append(message, button);
  overlayNode.appendChild(box);
}

/* ------------------------------------------------------------------ small glue */

interface SkipGestures {
  promise: Promise<void>;
  requested(): boolean;
  stop(): void;
}

/** A tap, Esc or Enter cuts the boot short. Installed once, removed on arrival. */
function installSkipGestures(): SkipGestures {
  let requested = false;
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });

  const fire = () => {
    if (requested) return;
    requested = true;
    resolve();
  };

  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' || event.key === 'Enter') fire();
  };

  window.addEventListener('pointerdown', fire, { passive: true });
  window.addEventListener('keydown', onKey);

  return {
    promise,
    requested: () => requested,
    stop: () => {
      window.removeEventListener('pointerdown', fire);
      window.removeEventListener('keydown', onKey);
    },
  };
}

function off(screen: HTMLElement): void {
  screen.classList.remove('is-on');
}

function hasBooted(): boolean {
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
    /* Private mode: the boot animation simply runs again on the next visit. */
  }
}

function clearBooted(): void {
  try {
    sessionStorage.removeItem(BOOTED_KEY);
  } catch {
    /* Nothing to clear. */
  }
}
