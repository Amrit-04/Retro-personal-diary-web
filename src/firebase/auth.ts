/**
 * Google sign-in and the signed-in session.
 *
 * The admin decision is read from the cryptographically signed ID token
 * (`token.admin`) and is used only to show or hide admin controls. It is not a
 * security boundary: firestore.rules and storage.rules enforce the same claim on
 * every request. There is no client-side admin flag of any other kind.
 */
import {
  GoogleAuthProvider,
  getAuth,
  getRedirectResult,
  getIdTokenResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  type Auth,
  type User,
} from 'firebase/auth';
import { firebaseApp, isLive } from './app';

export interface Session {
  uid: string;
  name: string;
  email: string | null;
  photoURL: string | null;
  /** Custom claim on the ID token. UI hint only; the rules are the enforcement. */
  hasAdminClaim: boolean;
}

const DEMO_KEY = 'diaryxp.demo-session';
const DEMO_SESSION: Session = {
  uid: 'demo-user',
  name: 'Demo Owner',
  email: 'demo@localhost',
  photoURL: null,
  hasAdminClaim: true,
};

let session: Session | null = null;
let ready: Promise<Session | null> | null = null;

const listeners = new Set<(s: Session | null) => void>();

export function currentSession(): Session | null {
  return session;
}

export function onSessionChange(cb: (s: Session | null) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function emit(next: Session | null): void {
  session = next;
  for (const cb of [...listeners]) cb(next);
}

/**
 * Resolves once Firebase has told us whether a session was restored. The boot
 * animation runs while this settles, so the login tile can already show an avatar.
 */
export function authStateReady(): Promise<Session | null> {
  if (ready) return ready;

  if (!isLive) {
    const stored = readDemo();
    session = stored;
    ready = Promise.resolve(stored);
    return ready;
  }

  const auth = authInstance();
  ready = new Promise<Session | null>((resolve) => {
    onAuthStateChanged(auth, (user) => {
      void finish(user).then((next) => {
        emit(next);
        resolve(next);
      });
    });
  });

  // A redirected sign-in resolves here after the page reloads.
  void getRedirectResult(auth).catch(() => undefined);

  return ready;
}

async function finish(user: User | null): Promise<Session | null> {
  if (!user) return null;
  const token = await getIdTokenResult(user, false);
  return {
    uid: user.uid,
    name: user.displayName || user.email?.split('@')[0] || 'Owner',
    email: user.email,
    photoURL: user.photoURL,
    hasAdminClaim: token.claims.admin === true,
  };
}

function authInstance(): Auth {
  return getAuth(firebaseApp());
}

export async function signInWithGoogle(): Promise<Session | null> {
  if (!isLive) {
    emit(DEMO_SESSION);
    writeDemo(DEMO_SESSION);
    return DEMO_SESSION;
  }

  const auth = authInstance();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const result = await signInWithPopup(auth, provider);
    const next = await finish(result.user);
    emit(next);
    return next;
  } catch (error) {
    if (isPopupUnavailable(error)) {
      // Same-domain redirect: the only flow that survives mobile Safari.
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw error;
  }
}

export async function signOut(): Promise<void> {
  if (!isLive) {
    localStorage.removeItem(DEMO_KEY);
    emit(null);
    return;
  }
  await fbSignOut(authInstance());
  emit(null);
}

/** Forces a token refresh so a newly granted admin claim is picked up. */
export async function refreshClaims(): Promise<void> {
  if (!isLive || !session) return;
  const user = authInstance().currentUser;
  if (!user) return;
  emit(await finish(user));
}

/** Turns Firebase error codes into a sentence a person can act on. */
export function describeAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'That sign-in window was closed. Click the user tile to try again.';
  }
  if (code === 'auth/popup-blocked') return 'Your browser blocked the sign-in window. Allow pop-ups for this site.';
  if (code === 'auth/unauthorized-domain') return 'This domain is not authorised in Firebase Authentication.';
  if (code === 'auth/network-request-failed') return 'No connection. Check your network and try again.';
  if (code === 'auth/operation-not-allowed') return 'Google sign-in is not enabled in this Firebase project.';
  return 'Sign-in failed. Check your connection and try again.';
}

function isPopupUnavailable(error: unknown): boolean {
  const code = (error as { code?: string })?.code ?? '';
  return code === 'auth/operation-not-supported-in-this-environment' || code === 'auth/popup-blocked';
}

function readDemo(): Session | null {
  try {
    return sessionStorage.getItem(DEMO_KEY) ? DEMO_SESSION : null;
  } catch {
    return null;
  }
}

function writeDemo(value: Session): void {
  try {
    sessionStorage.setItem(DEMO_KEY, JSON.stringify(value));
  } catch {
    /* Private mode: the session simply does not survive a reload. */
  }
}
