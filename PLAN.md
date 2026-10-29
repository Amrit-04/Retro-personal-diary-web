# Diary XP — build plan (working reference)

This file is my own working reference while building. It is not user documentation.
`README.md` stays the short user-facing setup doc. Delete or ignore this file at the end.

Spec source: `attachments/…/592c40ac-…txt` ("Build prompt: Diary XP"). Section numbers below (§)
refer to that spec. Priorities in order: performance → clean code → backend-enforced security →
retro feel.

---

## 0. Findings that steer the plan

**Repo state.** Vite 5.4.21 + TS 5.6 + `firebase` 10.14.1, vanilla TS, no framework. Two commits:
initial app, then "making it more like windows xp". ~24 KB of hand CSS already tuned to a
retro-XP look (bevels, title bars, taskbar) — worth keeping.

**Installed Firebase API surface (verified in `node_modules`).**
`firebase/firestore/lite` in firestore 4.7.3 does **not** export `getCountFromServer` — that name
was superseded by `getCount(query(collection, …))` (see
`@firebase/firestore/dist/firestore/src/lite-api/aggregate.d.ts`), which the lite entry **does**
export (`getCount`, `getAggregate`, `count`, `sum`, `average`). Same server-side count, same
one-doc-read pricing, no document download. → **Use lite + `getCount`.** Do not fall back to the
full SDK: lite is the whole point of the budget and the capability is present. Report this
substitution explicitly in the final summary (spec §2 asked me to check exactly this).

**Toolchain available:** node v24, npm 11, **ffmpeg 9.0.1 present** (so a placeholder startup chime
can be encoded as real MP3), **java absent** → the Firestore emulator cannot run locally, so rules
tests will be written and their run command documented, but I must report them as *not executed*
unless I find another way. No `.env` file exists, only `.env.example` → no real Firebase project is
wired up yet.

**Existing code vs spec — material gaps.**

| # | Current behaviour | Spec requires |
|---|---|---|
| 1 | No boot sequence at all: login screen is the first paint. Zero audio anywhere. | BIOS POST → splash → login → welcome+sound → desktop (§3.1) |
| 2 | Single 532 KB (raw) unsplit JS chunk; Firebase statically imported from `main.ts`; all 10 CSS files static | Critical path ≤ ~25 KB gz; Firebase lazy chunks *during* splash; Storage SDK only in admin chunk (§2) |
| 3 | Hash router + `renderApp()` does `clearElement(appRoot)` on every change → full re-render, window state destroyed; per-element listeners; `desktopView` adds `document` mousemove/mouseup/click **on every render without removal** (leak); permanent `setInterval` | One tiny window manager, event delegation, only-changed DOM, back button closes top window (§3.4) |
| 4 | `getArchiveYears()` downloads **the entire collection** to derive years; months derived from a full-year download; no `getCountFromServer`; no caching between navigations; desktop 7-day query has no `limit` | Two cheap queries for the year range, `getCount` per month in parallel, one month ≤ 31 docs, session cache (§3.5, §4) |
| 5 | One image size, 1200 px cap, `uploadBytes` with fake 20/60/90 progress, **no `cacheControl`**, `dataUrl` kept in memory, `inline/` path never cleaned | 800 px + 128×128 cover thumb, WebP q0.8 with JPEG fallback, unique names, `cacheControl immutable`, `uploadBytesResumable` (§5) |
| 6 | `content` stores **HTML** from a `contenteditable` + `document.execCommand` rich editor; viewer sniffs HTML and uses `innerHTML` | Plain text, `white-space: pre-wrap`, no markdown (§3.6, §12) |
| 7 | `paint.ts` (409 lines) + `richEditor.ts` (401 lines) + their CSS, imported into the main graph | Explicitly out of scope (§12) → delete |
| 8 | Rules: `allow create, update, delete: if isAdmin()` with **no field validation**; `inline/**` unmatched so all inline image writes fail; `alert()` used for auth errors | Validated create/update (id↔date, allowed fields, lengths, types), deny-by-default, inline error messages (§6, §11) |
| 9 | `firebase/set-admin.js`, client `UserSession.isAdmin` flag, `firestore.indexes.json` missing, no `.firebaserc`, no tests, README claims features that don't exist | `scripts/set-admin.mjs`, claim read from ID token only for UI visibility, rules tests, honest README (§6, §10) |

Dates are already local-safe (`src/utils/date.ts`, no `toISOString()` anywhere) — keep.

---

## 1. Stack decision

Keep: Vite + TypeScript + plain CSS, vanilla DOM (tiny `h()` helper already exists in `utils/dom.ts`),
Firebase Auth (Google) + Firestore **lite** + Storage (admin chunk only).
No router, no state lib, no animation lib, no icon font, no web fonts. No Preact — the current
hand-rolled DOM code is small and readable; the messiness threshold is not reached.
Dev-only additions: `firebase-admin` (set-admin script), `@firebase/rules-unit-testing`,
`firebase-tools` (emulator run), nothing that ships to the browser.

Deleting `paint.ts` and `richEditor.ts` is justified by spec §12 + §13.4 and is recoverable from git
(commit `e878287`).

---

## 2. Target file tree

```
index.html                     inline boot overlay + critical CSS only
src/
  main.ts                      boot orchestration only (no static Firebase import)
  boot/   bios.ts splash.ts login.ts welcome.ts sound.ts
  firebase/ app.ts auth.ts entries.ts admin-storage.ts demo.ts
  ui/     desktop.ts taskbar.ts window.ts explorer.ts viewer.ts editor.ts icons.ts dialog.ts
  lib/    dates.ts image.ts dom.ts slug.ts text.ts
  styles/ base.css boot.css desktop.css window.css explorer.css viewer.css editor.css taskbar.css
public/   startup.mp3 favicon.svg
scripts/  set-admin.mjs tests/rules.test.mjs
firebase/ firestore.rules storage.rules set-admin.js → moved
firestore.rules storage.rules firestore.indexes.json firebase.json .firebaserc
.env.example .gitignore README.md PLAN.md
```

Move/reuse map: `auth.ts`→`firebase/auth.ts`, `firebase.ts`→`firebase/app.ts`,
`db/entries.ts`→`firebase/entries.ts`, `db/images.ts`→`firebase/admin-storage.ts`,
`views/desktopView.ts`→`ui/desktop.ts`, `views/explorerView.ts`→`ui/explorer.ts`,
`views/viewerView.ts`→`ui/viewer.ts`, `views/editorView.ts`→`ui/editor.ts`,
`views/loginView.ts`→`boot/login.ts`, `components/window.ts`→`ui/window.ts` (rewrite, drop
drag/min/max/menu-bar), `components/taskbar.ts`→`ui/taskbar.ts` (rewrite, add tray mute +
open-window buttons), `components/icons.ts`→`ui/icons.ts`, `components/modal.ts`→`ui/dialog.ts`,
`utils/date.ts`→`lib/dates.ts`, `utils/dom.ts`→`lib/dom.ts`, `utils/image.ts`→`lib/image.ts`.
`router.ts` deleted (window stack + `pushState` for Back instead).

CSS: keep the tuned tokens (`variables.css` merged into `base.css`); split so that **only
`base.css` + `boot.css` are inlined in `index.html`**; the rest is imported by the module that owns
it, so Vite emits a lazily loaded stylesheet per chunk.

---

## 3. Boot mechanics (the part that must feel instant)

`index.html` ships the BIOS `<pre>` and the splash markup **inline**, with critical CSS inline in
`<style>`, so first paint is the black BIOS screen before any JS executes. `main.ts` is the only
script on the critical path.

State machine in `main.ts`:

```
gate()  → sessionStorage 'diaryxp.boot' === 'done' && auth restores → silent desktop (no audio needed)
        → otherwise → bios(≈1.5s) → splash(≈2–2.5s) → login → welcome(≈2s, sound) → desktop(fade ≤150ms)
```

1. **BIOS POST** — monospace `#e5e7eb` on `#000`, 13 px, line-height 1.6, padding 16/24 px
   (measured on win32.run). Our own branding (no Award/ASUS/Microsoft strings):
   `Diary Modular BIOS v1.00, An Energy Star Ally` / `Copyright (C) 2026, Diary Software` /
   `Main Processor : Imaginary CPU 2.40GHz` / `Memory Testing : 524,288K OK` (rAF count-up over
   1400 ms, `toLocaleString()`, white `OK` appended at the end) /
   `IDE Channel 0 Device 0 : DIARY-HDD 40GB` / `Verifying DMI Pool Data ...` (blinking cursor).
   Lines appended into a single text node with `textContent` writes; blinking cursor is CSS-only.
2. **Splash** — wordmark + classic 3-block bar, `transform: translateX` only, 150×20 px track with
   2 px `#b2b2b2` border, blocks 9 px, ~2 s per traverse. No canvas/GIF/video.
3. **Login** — two-tone `#002d99` band over `#587cdb` inset (mitchivin pattern), wordmark left,
   "To begin, click your user to log in" right, real `<button>` user tile ≥ 44 px, small Restart
   control. Tile state: signed out → "Sign in with Google"; session already restored → avatar +
   name, one tap enters with **no popup**.
4. **Welcome** — blue full-screen, `welcome` at 3rem Tahoma, `text-shadow`, opacity 0→1 over
   `.7s`; **startup sound plays here**.
5. **Desktop fade** ≤ 150 ms.

Skip: pointerdown / Esc / Enter during BIOS or splash → jump straight to login.
Reduced motion: static splash, no typing, no bar, immediately skippable.
Returning visit (same tab, signed in): silent path straight to desktop.
Audio unlock happens in the **login tap handler** (`play()` then `pause()` on the element, iOS
Safari requirement); real play on the welcome screen. `preload="none"`, `src` assigned only when
the splash starts. ≤ 40 KB mono MP3 ~3–5 s @64 kbps. `public/startup.mp3` is an ffmpeg-generated
sine chime placeholder — README says exactly where to drop the real file.

**Parallel work during boot** (this is why the desktop is populated on arrival):
`splash.start()` fires `import('./firebase/app.ts')` chain → `authStateReady()` → if signed in,
the last-7-days query is issued immediately → `import('./ui/desktop.ts')` etc. Login tile reflects
whatever auth resolved by the time the splash ends.

Budget guard: main chunk must not statically import any `firebase/*` symbol. I'll verify by
grepping the emitted main chunk for `identitytoolkit` / `FirebaseError`.

---

## 4. Data layer & queries

Doc `entries/{YYYY-MM-DD}`: `date, title, content, imageUrl, thumbUrl, imagePath, thumbPath,
createdAt, updatedAt`.

- `getRecentEntries()` — range over the last 7 **local** calendar days, `orderBy date desc`,
  `limit(7)`, `select()`-style projection is unavailable in lite (`select` not exported) → fetch
  whole docs; ≤ 7 docs is cheap.
- `getYearRange()` — two `limit(1)` queries (`orderBy asc` / `orderBy desc`) returning only the
  boundary docs; the year list is derived from that range. **Never** download the collection.
- `getMonthsWithCounts(year)` — for each year-month, `getCount(query(col, where(date >= 'YYYY-MM-01'),
  where(date <= 'YYYY-MM-31')))`; only months with entries, parallel `Promise.allSettled`; the
  month range is a string comparison on `YYYY-MM-DD` ids so the single-field index serves it.
  ≤ 12 count reads, 1 doc read each.
- `getEntriesForMonth(year, month)` — ≤ 31 docs, `orderBy date asc`, **including content**, cached
  in a session `Map` so opening an entry costs zero extra reads and going back never re-fetches.
- All Firebase calls live in `src/firebase/`. UI modules import from there only.
- `lib/dates.ts` owns every date derivation (local, never `toISOString`).
- Missing doc → friendly "File not found" in the viewer.
- `firestore.indexes.json`: single-field indexes cover all queries; ship
  `{"indexes": [], "fieldOverrides": []}` and confirm no `FAILED_PRECONDITION` during testing.

Demo backend: `src/firebase/demo.ts` — in-memory entries with seeded sample data, used **only** when
`VITE_FIREBASE_API_KEY`/`PROJECT_ID` are absent, loaded lazily like the real one. Lets me verify
§14 items 5–10 without credentials; it never ships a security relaxation because real config
switches the adapter and the server rules are the enforcement either way. Clearly labelled in the
UI as demo when active.

---

## 5. Image pipeline (`lib/image.ts`)

`createImageBitmap` → canvas → two outputs: display (longest side 800 px) and 128×128
**cover-crop** thumb; `toBlob('image/webp', 0.8)`, check `blob.type`, fall back to JPEG when the
browser hands back PNG. Validate MIME against an allowlist and ≤ 15 MB source. Unique names
`entries/{date}/{ts}-display.webp` + `-thumb.webp`, `uploadBytesResumable` for real progress,
`uploadMetadata = { cacheControl: 'public,max-age=31536000,immutable' }`.
Save order: **upload new pair → write Firestore doc → delete old pair**. No `dataUrl` retained.

---

## 6. Auth, authorization, rules, tests

- Google popup (`signInWithPopup`), automatic `signInWithRedirect` fallback on
  `operation-not-supported-in-this-environment` / popup blocked; auth errors render inline on the
  login screen with Retry, never `alert()`. Same-domain auth (`firebase hosting` channel) noted in
  README for the mobile-Safari reason.
- Admin = custom claim `admin: true`, set by `scripts/set-admin.mjs` (`ADMIN_EMAIL` env, no `VITE_`
  prefix, service-account key git-ignored). Frontend reads the claim from `getIdTokenResult`
  **only** to hide/show UI; the variable is named `claims.admin`, no client `isAdmin` truth.
  README documents the sign-out/sign-in token refresh.
- `firestore.rules`: read = signed in; create/update = admin **and** validated — `request.resource.id
  == date`, id matches the `YYYY-MM-DD` regex, only the seven allowed keys, title 1–120, content
  ≤ 20000, url/path fields strings, `createdAt`/`updatedAt` timestamps; delete = admin.
- `storage.rules`: `entries/**` read = signed in; write/delete = admin, `contentType matches
  'image/.*'`, size ≤ 1 MB; everything else `if false`.
- `tests/rules.test.mjs` on `@firebase/rules-unit-testing` + `node:test`, run by
  `firebase-tools emulators:exec`. Cases: anon read denied; signed-in non-admin read allowed;
  non-admin create/update/delete denied (Firestore + Storage); admin write allowed; malformed doc
  rejected (id≠date, title too long, extra field, content too big); non-image and > 1 MB upload
  rejected. **Java is missing here** — I'll attempt the run; if the emulator cannot start I report
  the tests as written-but-unexecuted with the exact command, rather than claiming a pass.

---

## 7. Performance playbook (applies to every file)

One delegated `click`/`pointerdown` listener per container (desktop grid, explorer list, taskbar).
Build lists with `DocumentFragment`; patch only what changed; no `innerHTML` for user content
(text goes through `textContent`). Animate `transform`/`opacity` only; no habitual `will-change`,
no heavy shadows/filters on lists. `content-visibility: auto` on long lists; `loading="lazy"`,
explicit `width`/`height`, `decoding="async"` on every thumbnail; `aspect-ratio` boxes to keep
CLS ≈ 0. `Cache-Control` immutable for hashed assets + `no-cache` for `index.html` in
`firebase.json` headers. No polyfills, no unused deps.

Measurement, reported at the end: `npm run build`, then a throwaway Node script printing raw + gzip
bytes per emitted asset, compared against the §2 budgets; `dist/index.html` inlined CSS counted as
the critical path. Lighthouse mobile: attempt `npx lighthouse` with Chrome headless; if no Chrome
binary is reachable, report the bundle/transfer-size evidence and say the Lighthouse number was not
measured, with the command to run.

---

## 8. Mobile rules

`viewport-fit=cover`, `100dvh`, `env(safe-area-inset-*)`, `touch-action: manipulation`,
tap targets ≥ 44 px, 16 px form text, no horizontal scroll, `overscroll-behavior: contain` in
windows, windows are full-screen sheets with a 44 px title bar, only the top one visible, taskbar
thumb-reachable above the home-indicator. Icons become a 3–4 column grid. Verified at 360×640 and
390×844. Single tap opens everything (no double-click).

---

## 9. Visual direction

Deliberate Windows-XP-era chrome, in the spirit of the three reference sites (win32.run for the
POST, mitchivin.com for the wallpaper, tray and login gate, winxp.vercel.app for the windows and
Start menu): an original SVG hill wallpaper, labelled desktop icons, a 30 px blue taskbar with a
green italic Start button, tray clock, a two-column Start menu, and a full three-button window
frame. All artwork stays original: icons, glyphs, wallpaper and sound are drawn or synthesised for
this project; no Microsoft assets. System font stack (Tahoma, Verdana, system-ui). Visible
`:focus-visible`, real `<button>`s, labels and `aria-live` for the clock.

**Revised after the first review (29 Oct 2026).** The first build read the old "minimal, not a
parody" restraint too literally: it had a flat desktop colour and almost none of the XP furniture,
so it did not resemble the references. The visual layer described above is what now exists.
Functional minimise/maximise ships with the three-button chrome, and the phone-sheet breakpoint
moved from 768 px to 480 px so a narrow desktop (including the 531 px preview where the site was
first reviewed) still reads as a desktop rather than a phone app.

---

## 10. Build order → one commit per step

1. **Scaffold + rules** — tree restructure, delete out-of-scope, `index.html` inline boot + critical
   CSS, `vite.config.ts` (target, chunking, minify), `.firebaserc`, `firestore.indexes.json`,
   rewritten rules, set-admin script move, `.gitignore`/`.env.example`, typecheck + build green.
2. **Auth + login** — `firebase/app.ts`, `firebase/auth.ts`, demo adapter, `boot/login.ts` tile,
   inline auth errors, redirect fallback.
3. **Boot sequence** — `bios.ts`, `splash.ts`, `welcome.ts`, `sound.ts`, gate/skip/reduced-motion,
   ffmpeg placeholder chime, lazy chunk kick-off from the splash.
4. **Data layer** — `firebase/entries.ts` (7-day, year range, month counts, month entries, cache),
   `lib/dates.ts`, `lib/slug.ts`.
5. **Window manager + taskbar + desktop** — `ui/window.ts` (open/close/focus, cascade, mobile sheet,
   Back closes top window), `ui/taskbar.ts` (start menu, window buttons, mute, clock), `ui/desktop.ts`
   (icons, single tap, empty state), delegated events.
6. **Explorer** — breadcrumbs, Year→Month→Entries, cache, lazy thumbs, skeletons/empty/error states.
7. **Viewer** — filename title, long date, doodle (explicit dims), pre-wrap plain text, admin
   Edit/Delete with confirm, "File not found".
8. **Admin editor** — lazy chunk, `admin-storage.ts` + Storage SDK only here, drag-drop **and**
   file picker, client compression, resumable progress, date-pick loads existing entry (edit mode),
   save order + old-file cleanup, keep typed text on failure.
9. **Polish + verify** — a11y pass, states/errors, dead-code sweep, bundle report, mobile viewport
   pass, README rewrite, §14 checklist reported.

---

## 11. Need from the user (ask only at the point it blocks)

Firebase web config (`VITE_FIREBASE_*`) to test real Auth/Firestore/Storage; the admin Google email
for the claim; the service-account key (locally, never committed) if they want me to run set-admin;
the real startup sound to replace the placeholder; Firebase project id for `.firebaserc`/deploy.

## 12. Honest deviations to report at the end

1. **`getCount(query)` instead of `getCountFromServer`.** Firebase retired the latter; the lite SDK
   exports the replacement with identical server-side counting. Using it keeps us on
   `firebase/firestore/lite` rather than the much larger full SDK.
2. **`uploadBytesResumable` progress via `task.on('state_changed')`.** This SDK version (10.14) has
   no four-argument options overload, so the progress callback is wired through the task listener
   instead. Same real byte counts, same resumable task.
3. **Rules tests are written but not executed here.** `npm run test:rules` needs Java for the
   emulator and this machine has none (`Could not spawn java -version`). The suite covers anon
   denial, reader access, non-admin denial, malformed documents, immutable `createdAt`, upload
   type/size/path limits and the claim itself; it needs one run on a machine with a JRE.
4. **Content is plain text.** The viewer renders `pre-wrap` with no markdown. Any HTML left over
   from the earlier rich-text version is displayed as literal characters and becomes plain text on
   the next save.
5. **Single tap opens an icon,** not XP's double-click: one gesture on touch, and the brief asks for
   single-tap on mobile. Desktop keeps the same rule rather than having two.
6. **A demo store exists** until Firebase config is supplied, so the app can be opened and tried.
   It is a separate lazy chunk selected by one `isLive` check; nothing about it bypasses a rule.
7. **Startup sound is synthesised** (`scripts/make-chime.mjs` → 17 KB mono MP3, inside the ~40 KB
   budget) because no audio file was provided. Replace it with a personal one at
   `public/startup.mp3`.
8. **Both layouts were verified visually.** Desktop geometry was captured at 1280 × 800 in
   headless Chrome; phone sheets were checked at 360 × 640 and 390 × 844 in same-origin iframes.
   The 531 × 558 preview also reads as a desktop because the sheet breakpoint sits at 480 px.
9. **Lighthouse SEO is 63 on purpose:** `public/robots.txt` says `Disallow: /` because a private
   diary should not be crawled, which trips the `is-crawlable` audit. Performance, accessibility and
   best practices are all 100 (mobile, simulated Fast 3G).
10. **The entry stylesheet is preloaded rather than render-blocking**, which is what took
    `render-blocking-resources` from 0 to 1; a cached-response guard in `main.ts` re-applies it so the
    desktop can never come up unstyled.
11. **Window controls grew to three, and the phone breakpoint moved to 480 px.** The original plan
    said close-only; the reference sites show the full three-button chrome and the user asked for
    that look, so minimise and maximise now work rather than being decoration. Dragging and
    resizing remain out of scope.
12. **The first-review screenshots came from the dev server** while the final audit ran against the
    production build served on port 4173. Both use the same source; the build is the one that was
    measured.
