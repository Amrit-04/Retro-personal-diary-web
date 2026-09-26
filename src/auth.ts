import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
  getIdTokenResult
} from 'firebase/auth';
import { auth, isConfigured } from './firebase';
import { UserSession } from './types';

let currentUserSession: UserSession | null = null;
type AuthCallback = (user: UserSession | null) => void;
const listeners: AuthCallback[] = [];

export function subscribeAuth(cb: AuthCallback): () => void {
  listeners.push(cb);
  cb(currentUserSession);
  return () => {
    const idx = listeners.indexOf(cb);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

export function getCurrentUser(): UserSession | null {
  return currentUserSession;
}

export async function loginWithGoogle(): Promise<UserSession | null> {
  if (!isConfigured) {
    // In local demo mode if Firebase is not yet configured with real API keys
    currentUserSession = {
      uid: 'demo-admin-uid',
      email: 'admin@retro-diary.local',
      displayName: 'Retro Admin (Demo)',
      photoURL: null,
      isAdmin: true,
    };
    notifyListeners();
    return currentUserSession;
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return processFirebaseUser(result.user, true);
}

export async function logout(): Promise<void> {
  if (!isConfigured) {
    currentUserSession = null;
    notifyListeners();
    return;
  }
  await fbSignOut(auth);
}

async function processFirebaseUser(user: User | null, forceTokenRefresh = false): Promise<UserSession | null> {
  if (!user) {
    currentUserSession = null;
    return null;
  }

  // Check the custom claim 'admin: true' directly from the cryptographically signed ID token
  const tokenResult = await getIdTokenResult(user, forceTokenRefresh);
  const isAdmin = Boolean(tokenResult.claims['admin'] === true);

  currentUserSession = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email?.split('@')[0] || 'User',
    photoURL: user.photoURL,
    isAdmin,
  };

  return currentUserSession;
}

function notifyListeners() {
  for (const cb of listeners) {
    try {
      cb(currentUserSession);
    } catch (e) {
      console.error('Auth listener error:', e);
    }
  }
}

// Set up Firebase Auth state listener
if (isConfigured) {
  onAuthStateChanged(auth, async (user) => {
    await processFirebaseUser(user);
    notifyListeners();
  });
}
