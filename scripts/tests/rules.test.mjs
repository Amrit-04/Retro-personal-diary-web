/**
 * Security-rule tests. These are the tests that matter most in this project: every
 * promise about who may read or write is enforced here, on the server, and nowhere
 * in the UI.
 *
 * They run against the Firebase emulator, so they need Java on the PATH:
 *
 *   npm run test:rules
 *
 * which is `firebase emulators:exec --only firestore,storage --project demo-diary-xp
 * "node --test scripts/tests"`. The emulator hands out its own signed-in users, so a
 * test can present a token with `admin: true` exactly the way the real claim does —
 * and exactly the way a client cannot fake it.
 */
import { readFileSync } from 'node:fs';
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject, getBytes } from 'firebase/storage';

const PROJECT = 'demo-diary-xp';
const BUCKET = `${PROJECT}.appspot.com`;
const FIRESTORE_PORT = Number(process.env.FIRESTORE_PORT ?? 8080);
const STORAGE_PORT = Number(process.env.STORAGE_PORT ?? 9199);

const firestoreRules = readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8');
const storageRules = readFileSync(new URL('../../storage.rules', import.meta.url), 'utf8');

/** A document the app would actually write: nine fields, id equals date. */
function entry(id, over = {}) {
  return {
    date: id,
    title: 'A title',
    content: 'Some words.',
    imageUrl: `https://example/${id}/display.webp`,
    thumbUrl: `https://example/${id}/thumb.webp`,
    imagePath: `entries/${id}/1-display.webp`,
    thumbPath: `entries/${id}/1-thumb.webp`,
    createdAt: new Date('2026-01-02T08:00:00Z'),
    updatedAt: new Date('2026-01-02T08:00:00Z'),
    ...over,
  };
}

let testEnv;
let admin;
let reader;
let anon;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: { host: '127.0.0.1', port: FIRESTORE_PORT, rules: firestoreRules },
    storage: { host: '127.0.0.1', port: STORAGE_PORT, rules: storageRules, storageBucket: BUCKET },
  });

  admin = testEnv.authenticatedContext('admin-user', { admin: true });
  reader = testEnv.authenticatedContext('reader-user');
  anon = testEnv.unauthenticatedContext();

  // Seed one entry through a rules-bypassing context so reads have something to find.
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'entries', '2026-01-02'), entry('2026-01-02'));
  });
});

after(async () => {
  await testEnv?.cleanup();
});

/* ------------------------------------------------------------------ firestore */

describe('entries are never public', () => {
  test('an anonymous client can read nothing', async () => {
    const db = anon.firestore();
    await assertFails(getDoc(doc(db, 'entries', '2026-01-02')));
    await assertFails(getDocs(query(collection(db, 'entries'), where('date', '>=', '2026-01-01'))));
  });

  test('an anonymous client cannot guess a document that does not exist', async () => {
    await assertFails(getDoc(anon.firestore(), 'entries', '2030-12-31'));
  });

  test('any signed-in reader can read the archive', async () => {
    const db = reader.firestore();
    await assertSucceeds(getDoc(doc(db, 'entries', '2026-01-02')));
    await assertSucceeds(getDocs(collection(db, 'entries')));
  });

  test('nothing outside /entries is reachable', async () => {
    const db = reader.firestore();
    await assertFails(getDoc(doc(db, 'users', 'reader-user')));
    await assertFails(setDoc(doc(db, 'entries/x/notes/y'), { hi: true }));
  });
});

describe('only an administrator writes', () => {
  test('a signed-in non-admin cannot create, update or delete', async () => {
    const db = reader.firestore();
    await assertFails(setDoc(doc(db, 'entries', '2026-02-02'), entry('2026-02-02')));
    await assertFails(updateDoc(doc(db, 'entries', '2026-01-02'), { title: 'Vandal' }));
    await assertFails(deleteDoc(doc(db, 'entries', '2026-01-02')));
  });

  test('a field named admin in the document proves nothing', async () => {
    const db = reader.firestore();
    await assertFails(setDoc(doc(db, 'entries', '2026-02-03'), { ...entry('2026-02-03'), admin: true }));
  });

  test('an administrator can create, update and delete', async () => {
    const db = admin.firestore();
    await assertSucceeds(setDoc(doc(db, 'entries', '2026-03-03'), entry('2026-03-03')));
    await assertSucceeds(updateDoc(doc(db, 'entries', '2026-03-03'), { title: 'Renamed' }));
    await assertSucceeds(deleteDoc(doc(db, 'entries', '2026-03-03')));
  });
});

describe('a document must be a well-formed entry', () => {
  const bad = [
    ['the id is not a date', 'not-a-date', entry('not-a-date')],
    ['the date field disagrees with the id', '2026-04-04', entry('2026-04-04', { date: '2026-04-05' })],
    ['a field is missing', '2026-05-05', (() => { const { thumbPath, ...rest } = entry('2026-05-05'); return rest; })()],
    ['an extra field appears', '2026-06-06', entry('2026-06-06', { author: 'someone' })],
    ['the title is empty', '2026-07-07', entry('2026-07-07', { title: '' })],
    ['the title is over 120 characters', '2026-08-08', entry('2026-08-08', { title: 'x'.repeat(121) })],
    ['the content is over 20000 characters', '2026-09-09', entry('2026-09-09', { content: 'x'.repeat(20001) })],
    ['an image url is not a string', '2026-10-10', entry('2026-10-10', { imageUrl: 42 })],
    ['createdAt is not a timestamp', '2026-11-11', entry('2026-11-11', { createdAt: 'yesterday' })],
  ];

  for (const [why, id, data] of bad) {
    test(`an administrator is refused when ${why}`, async () => {
      const db = admin.firestore();
      await assertFails(setDoc(doc(db, 'entries', id), data));
    });
  }

  test('the whole archive range is allowed, so a leap day is fine', async () => {
    const db = admin.firestore();
    await assertSucceeds(setDoc(doc(db, 'entries', '2028-02-29'), entry('2028-02-29')));
  });

  test('createdAt is immutable, updatedAt is not', async () => {
    const db = admin.firestore();
    await assertFails(updateDoc(doc(db, 'entries', '2026-01-02'), { createdAt: new Date('2020-01-01T00:00:00Z') }));
    await assertSucceeds(updateDoc(doc(db, 'entries', '2026-01-02'), { updatedAt: new Date('2026-02-01T00:00:00Z') }));
  });
});

/* ------------------------------------------------------------------ storage */

const pngBytes = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
]);

function imageContext(context, path) {
  return ref(context.storage(`gs://${BUCKET}`), path);
}

describe('entry images follow the same shape as the documents', () => {
  test('an anonymous client cannot read or write a file', async () => {
    const target = imageContext(anon, 'entries/2026-01-02/1-display.webp');
    await assertFails(getDownloadURL(target));
    await assertFails(getBytes(target));
    await assertFails(uploadBytes(target, pngBytes, { contentType: 'image/webp' }));
  });

  test('a signed-in reader can read a file', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await uploadBytes(imageContext(context, 'entries/2026-01-02/1-display.webp'), pngBytes, {
        contentType: 'image/webp',
      });
    });

    await assertSucceeds(getDownloadURL(imageContext(reader, 'entries/2026-01-02/1-display.webp')));
  });

  test('a non-admin cannot upload, replace or delete', async () => {
    const path = 'entries/2026-01-02/2-display.webp';
    await assertFails(uploadBytes(imageContext(reader, path), pngBytes, { contentType: 'image/webp' }));
    await assertFails(deleteObject(imageContext(reader, 'entries/2026-01-02/1-display.webp')));
  });

  test('an administrator can upload and delete under a date folder', async () => {
    const path = 'entries/2026-01-04/1700000000000-display.webp';
    await assertSucceeds(uploadBytes(imageContext(admin, path), pngBytes, { contentType: 'image/webp' }));
    await assertSucceeds(deleteObject(imageContext(admin, path)));
  });

  test('an upload must be an image', async () => {
    await assertFails(
      uploadBytes(imageContext(admin, 'entries/2026-01-05/1-display.webp'), pngBytes, {
        contentType: 'application/x-sh',
      }),
    );
  });

  test('an upload must be under 1 MB', async () => {
    const tooBig = new Uint8Array(1024 * 1024 + 1);
    await assertFails(
      uploadBytes(imageContext(admin, 'entries/2026-01-06/1-display.webp'), tooBig, {
        contentType: 'image/png',
      }),
    );
  });

  test('files outside a date folder are refused even for an admin', async () => {
    await assertFails(uploadBytes(imageContext(admin, 'entries/01-02-2026/1-display.webp'), pngBytes, { contentType: 'image/png' }));
    await assertFails(uploadBytes(imageContext(admin, 'other/2026-01-07/1-display.webp'), pngBytes, { contentType: 'image/png' }));
    await assertFails(uploadBytes(imageContext(admin, 'entries/2026-01-07/a/b-display.webp'), pngBytes, { contentType: 'image/png' }));
  });

  test('nothing outside /entries is readable', async () => {
    await assertFails(getDownloadURL(imageContext(reader, 'secrets/service-account.json')));
  });
});

/* ------------------------------------------------------------------ the claim */

describe('the admin claim comes from the token', () => {
  test('a token without the claim is refused, with the claim it is allowed', async () => {
    const without = testEnv.authenticatedContext('plain-user');
    const withClaim = testEnv.authenticatedContext('claimed-user', { admin: true });

    await assertFails(setDoc(doc(without.firestore(), 'entries', '2026-12-12'), entry('2026-12-12')));
    await assertSucceeds(setDoc(doc(withClaim.firestore(), 'entries', '2026-12-12'), entry('2026-12-12')));

    const stored = await getDoc(doc(reader.firestore(), 'entries', '2026-12-12'));
    assert.equal(stored.data().title, 'A title');
  });

  test('a claim of "true" as a string is not enough', async () => {
    const fuzzy = testEnv.authenticatedContext('fuzzy-user', { admin: 'true' });
    await assertFails(setDoc(doc(fuzzy.firestore(), 'entries', '2026-12-13'), entry('2026-12-13')));
  });
});
