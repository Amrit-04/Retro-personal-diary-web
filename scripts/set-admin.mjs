#!/usr/bin/env node
/**
 * One-off local script that mints the `admin: true` custom claim on the diary owner's
 * Firebase Auth account. Runs with a service-account key that never leaves this machine.
 *
 *   ADMIN_EMAIL=you@example.com node scripts/set-admin.mjs
 *   ADMIN_EMAIL=you@example.com node scripts/set-admin.mjs --revoke
 *
 * Nothing here is shipped to the browser: ADMIN_EMAIL has no VITE_ prefix, so Vite
 * excludes it from the client bundle, and firebase-admin is a devDependency.
 */
import { readFileSync } from 'node:fs';
import { credential, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const email = (process.env.ADMIN_EMAIL || '').trim();
const keyPath = (process.env.SERVICE_ACCOUNT_KEY || 'firebase/serviceAccountKey.json').trim();
const revoke = process.argv.includes('--revoke');

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Set ADMIN_EMAIL to the account\'s Google email, e.g. ADMIN_EMAIL=you@example.com');
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
} catch (error) {
  console.error(`Could not read the service-account key at ${keyPath}.`);
  console.error('Download it from Firebase Console > Project Settings > Service Accounts,');
  console.error('or point SERVICE_ACCOUNT_KEY at it. The file is git-ignored.');
  console.error(String(error.message));
  process.exit(1);
}

initializeApp({ credential: certFrom(serviceAccount) });

function certFrom(account) {
  return credential.cert({
    projectId: account.project_id,
    clientEmail: account.client_email,
    privateKey: account.private_key.replace(/\\n/g, '\n'),
  });
}

const auth = getAuth();

try {
  const user = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid, revoke ? {} : { admin: true });
  console.log(`${revoke ? 'Removed' : 'Set'} admin claim for ${email} (uid ${user.uid}).`);
  console.log('That account must sign out and sign in once for a fresh ID token to carry the claim.');
} catch (error) {
  if (error?.code === 'auth/user-not-found') {
    console.error(`No Auth user with that email yet. Sign in to the site once with ${email}, then re-run.`);
  } else {
    console.error('Failed:', error?.message ?? error);
  }
  process.exit(1);
}
