# Diary XP

A private personal diary that boots like an old home computer: a BIOS POST screen, a
loading bar, a startup chime, a login tile, a welcome screen, then a desktop where each
entry of the last seven days sits as its own `.txt` icon.

Single user, no comments, no social anything. Reads are fast on a cheap phone; writes are
restricted to the one account that holds an `admin` claim on its ID token.

```bash
npm install
npm run dev        # http://localhost:5173 — runs with sample data until Firebase is configured
```

With no `.env` the app runs against a local sample store so the whole experience can be
opened before credentials exist. It is clearly marked as sample data and nothing about it
relaxes a rule: the live store is still governed by `firestore.rules` and `storage.rules`.

## What is in the box

| Path | Purpose |
| --- | --- |
| `index.html` | Boot markup and critical CSS, inlined so the first paint needs no extra request |
| `src/main.ts` | The boot orchestrator: POST → splash → login gate → welcome → desktop |
| `src/boot/` | BIOS text, splash bar, welcome screen, startup-sound unlocking |
| `src/firebase/` | App config, Google auth, the entry store (live + sample), Storage uploads |
| `src/ui/` | Window manager, desktop, taskbar/Start menu, File Explorer, viewer, editor |
| `src/lib/` | Dates, file names, DOM helpers, the image pipeline |
| `firestore.rules`, `storage.rules` | The actual security boundary |
| `scripts/` | `set-admin.mjs`, `make-chime.mjs`, `measure-size.mjs`, rules tests |

## Setting up the real backend

1. **Create the project.** Firebase Console → Add project → enable Firestore (production
   mode, pick a region) and Storage (default bucket).

2. **Enable Google sign-in.** Authentication → Sign-in method → Google. Add the domain you
   will serve from under Authentication → Settings → Authorized domains
   (`localhost` is already there).

3. **Copy the web config.** Project settings → General → Your apps → Web app → SDK setup and
   configuration. Copy the values into `.env` (start from `.env.example`):

   ```bash
   cp .env.example .env
   ```

   The six `VITE_FIREBASE_*` variables are inlined into the browser bundle by Vite, which is
   fine — they are public keys, and the rules are what protect the data. `ADMIN_EMAIL` and
   `SERVICE_ACCOUNT_KEY` have no `VITE_` prefix, so they never reach the client.

4. **Sign in once** with the Google account that will own the diary, so the Auth user exists.

5. **Mint the admin claim.** Download a service-account key (Project settings → Service
   accounts → Generate new private key) and save it as `firebase/serviceAccountKey.json`.
   That path is git-ignored, along with `.env`; never commit either.

   ```bash
   ADMIN_EMAIL=you@example.com node scripts/set-admin.mjs
   ```

   Add `--revoke` to take it away again. The account must sign out and back in once for a
   fresh ID token to carry the claim.

6. **Deploy the rules.**

   ```bash
   npx firebase login
   npx firebase deploy --only firestore:rules,firestore:indexes,storage
   ```

   `.firebaserc` currently holds the placeholder `REPLACE_WITH_YOUR_FIREBASE_PROJECT_ID`;
   put your project id in `projects.default` before deploying.

## Scripts

```bash
npm run dev          # dev server
npm run build        # tsc + vite build into dist/
npm run preview      # serve the production build locally
npm run typecheck    # tsc --noEmit
npm run size         # gzipped bundle report against the size budgets
npm run test:rules   # security-rule tests against the Firebase emulator
```

`test:rules` runs `firebase emulators:exec --only firestore,storage` and needs a Java
runtime on the `PATH` (the emulator is a Java program). It exercises the rules, not the
UI: anonymous reads denied, signed-in reads allowed, non-admin writes denied on both
Firestore and Storage, malformed documents refused, `createdAt` immutable, uploads capped
at 1 MB and restricted to `image/*`, and anything outside `/entries` unreachable.

## How it stays fast

The critical path is HTML + entry CSS + entry JS, about **10.7 KB gzipped** against a
25 KB budget (`npm run size` prints the table). Everything else is a lazy chunk:

* Firestore is loaded from `firebase/firestore/lite`, and the Storage SDK lives only in the
  admin chunk, so a reader never downloads either.
* The boot animation is not a wait: while it runs, the auth and desktop chunks are already
  being imported and the last-seven-days query is already in flight. The splash screen ends
  as soon as both the minimum time and the data are satisfied.
* The desktop shows one icon per entry of the last seven calendar days, newest first, with
  no placeholders for empty days. That is a single range query.
* File Explorer needs two `limit(1)` reads to list years, then twelve parallel server-side
  counts for one year, then one range read per month. Counts never download documents, and
  every result is cached for the session, so Back is free.
* Thumbnails on the desktop are the 128 px image, not the full picture. Doodles load
  lazily with explicit dimensions, so scrolling into one does not move the text.
* Animation is `transform` and `opacity` only. Lists are built in one mutation. The clock
  stops when nothing shows it.
* The startup sound is 17 KB, `preload="none"`, and is only unlocked by the tap on the
  login tile (that tap is also what lets iOS play it). The tray speaker mutes it, and the
  choice is remembered.

## How an entry is stored

`entries/{YYYY-MM-DD}` — the document id *is* the date, so one entry per day is a property
of the store rather than a rule the client has to remember. Exactly nine fields:

```
date, title, content, imageUrl, thumbUrl, imagePath, thumbPath, createdAt, updatedAt
```

Dates are local calendar dates built from `getFullYear/getMonth/getDate`. `toISOString()`
is never used, because it would move an entry written at 11 pm into the previous day for
some timezone somewhere.

Content is plain text. The viewer renders it with `pre-wrap` and no markdown, and the rules
cap it at 20,000 characters.

Images are resized in the browser before they upload: an 800 px display copy and a
128 × 128 cover-cropped icon, WebP when the browser can encode it and JPEG when it cannot,
with a quality ladder that stops as soon as the bytes are small enough. Uploads land at
`entries/{date}/{timestamp}-display.webp` with `cacheControl: public, max-age=31536000,
immutable`, so a saved page never re-fetches a picture it already has.

A save uploads, writes the document, and only then deletes the files it replaced. A failed
save keeps every typed word on screen and shows an inline message with the reason.

## Security model

The rules enforce everything; the UI only knows whether to draw a button.

* Nobody who is not signed in can read any document or any file.
* A signed-in reader can read the archive and nothing else.
* Only a token carrying `admin: true` can write, and only a document that matches the shape
  above, with an id equal to its `date` field, and with an immutable `createdAt`.
* Storage writes require the same claim, a date-shaped folder, an `image/*` content type and
  a size under 1 MB.
* The claim is minted server-side by `scripts/set-admin.mjs`. The client reads it from the
  signed ID token to decide what to render, and a write attempt with a forged claim fails
  because the token is not something a client can edit.

## Assets

Nothing here is Microsoft's. The chrome, icons, glyphs and the hill wallpaper
(`public/wallpaper.svg`) are drawn from scratch as inline SVG, a standalone SVG and CSS; the
startup chime is synthesised by `scripts/make-chime.mjs`
(a rising major arpeggio written as a WAV, then encoded to MP3 by `ffmpeg`). Replace it with
your own short mono MP3 at `public/startup.mp3` — keep it under about 40 KB, since it is
fetched on the way into the desktop:

```bash
ffmpeg -i your-sound.wav -ac 1 -b:a 56k -map_metadata -1 public/startup.mp3
```

## Known limits of v1

No comments, likes, search, tags, markdown, rich text, notifications, analytics, settings,
multi-user authoring, window dragging or resizing, CRT filter, Paint or Minesweeper. Windows
can be minimised, maximised and closed; Back closes the top window.
