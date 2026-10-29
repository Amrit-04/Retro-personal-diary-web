# Diary XP — build plan (from the §17 brief)

Working reference for this build. Replaces everything from earlier attempts.

## 1. Where the fidelity numbers come from

Read from the cloned `ShizukuIchi/winXP` source (`styled-components`, converted to plain CSS), and from
screenshots of `win32.run`, `mitchivin.com` and `winxp.vercel.app` captured at 1440×900 and 390×844.

Already extracted (goes into `src/styles/tokens.css`):

| Thing | Real value |
| --- | --- |
| Window frame | `padding: 3px`, bg `#0831d9` focused / `#6582f5` unfocused, top radii 8px |
| Title bar | 28px band, 25px header row, `font-size: 12px`, `font-weight: 700`, `text-shadow: 1px 1px #000` |
| Title bar gradient (active) | `linear-gradient(to bottom,#0058ee 0%,#3593ff 4%,#288eff 6%,#127dff 8%,#036ffc 10%,#0262ee 14%,#0057e5 20%,#0054e3 24%,#0055eb 56%,#005bf5 66%,#026afe 76%,#0062ef 86%,#0052d6 92%,#0040ab 94%,#003092 100%)` |
| Title bar gradient (inactive) | `linear-gradient(to bottom,#7697e7 0%,#7e9ee3 3%,#94afe8 6%,#97b4e9 8%,#82a5e4 14%,#7c9fe2 17%,#7996de 25%,#7b99e1 56%,#82a9e9 81%,#80a5e7 89%,#7b96e1 94%,#7a93df 97%,#abbae3 100%)` |
| Title bar side glow | 15px `::before`/`::after` overlays, `#1638e6` → transparent, opacity 1 / 0.3–0.4 |
| Caption buttons | 22×22, `border: 1px solid #fff`, `border-radius: 3px`, `margin-right: 1px`, `filter: brightness(120%)` on hover, 90% on active |
| Min/Max fill | `radial-gradient(circle at 90% 90%,#0054e9 0%,#2263d5 55%,#4479e4 70%,#a3bbec 90%,#fff 100%)`, `box-shadow: inset 0 -1px 2px 1px #4646ff` |
| Close fill | `radial-gradient(circle at 90% 90%,#cc4600 0%,#dc6527 55%,#cd7546 70%,#ffccb2 90%,#fff 100%)`, `box-shadow: inset 0 -1px 2px 1px #da4600`, 2×16 white cross bars |
| Taskbar | 30px tall, `linear-gradient(to bottom,#1f2f86 0,#3165c4 3%,#3682e5 6%,#4490e6 10%,#3883e5 12%,#2b71e0 15%,#2663da 18%,#235bd6 20%,#2258d5 23%,#2157d6 38%,#245ddb 54%,#2562df 86%,#245fdc 89%,#2158d4 92%,#1d4ec0 95%,#1941a5 98%)` |
| Task button | 22px tall, `max-width: 150px`, bg `#3c81f3`, `box-shadow: inset -1px 0 rgba(0,0,0,.3), inset 1px 1px 1px rgba(255,255,255,.2)`; focused/pressed bg `#1e52b7` with `inset 0 0 1px 1px rgba(0,0,0,.2), inset 1px 0 1px rgba(0,0,0,.7)`; hover `#53a3ff` |
| Tray | `linear-gradient(to bottom,#0b59b9…)` block, `border-left: 1px solid #1042af`, `box-shadow: inset 1px 0 1px #18bbff`, `padding: 0 10px`, clock 11px |
| Start menu | 5px top radii, header 54px `linear-gradient(to bottom,#1868ce 0%,#0e60cb 12%…#4791eb 100%)` + 3px white top sheen, avatar 42×42 with 2px `#ddd` border, name 14px/700 |
| Start menu columns | left `#fff` 190px (items 34px, icons 30×30), right `#cbe3ff` 190px (items 26px, icons 22×22, text `#00136b`), separators 7.5px gradient hairline, orange 2px rule under the header |
| Start menu footer | 36px `linear-gradient(to bottom,#4282d6 0%…#0f61cb 88%)`, items right-aligned, icons 22×22 |
| Desktop icons | 70px wide, 30×30 image, label 10px white `text-shadow: 0 1px 1px #000`, selected label bg `#0b61ff`, icon 50% opacity + blue drop-shadow |
| BIOS POST | monospace, `Memory Testing : 524288K OK`, blank line between groups, `Verifying DMI Pool Data ......` then `Boot from Hard Disk...` |
| Log Off modal | 300×190, header/footer `#092178`, body `linear-gradient(to right,#3349e0 0%,#617ee6 47%,#617ee6 53%,#3349e0 100%)`, 30px round buttons with 11px bold labels, Cancel bottom-right |

Still to measure from the captures: Explorer toolbar/address-row heights, Notepad body metrics, Minesweeper
cell/LED metrics.

## 2. Assets

Real XP art cannot be fetched or copied by me in this environment, so **you drop the originals into
`public/xp-inbox/`** (git-ignored) and `scripts/optimize-assets.mjs` (sharp) turns them into the small,
hashed files the app actually loads under `public/xp/`. Until the inbox has files, the optimizer leaves the
existing stand-ins in place so the app still runs.

Inbox names (any of these missing → that one keeps its stand-in):

```
bliss.jpg                      wallpaper, any size ≥1600×1080
WsStartup.wav|mp3              startup sound
start.png                      taskbar Start button,  ~24×22 or larger
user.png                       Start menu / logon avatar, 42–48 px
my-computer.png  folder.png  folder-open.png  file-text.png  notepad.png
mine-icon.png  minesweeper.png (sprite sheet, or the individual cell PNGs)
volume.png  logoff.png  shutdown.png  restart.png  help.png  search.png  run.png
error.png  info.png  question.png   (message-box glyphs, 32 px)
```

Outputs the script writes: `wallpaper.webp` (1536 px, q62), `wallpaper-mobile.webp` (900 px crop, q60),
`icons.webp` sprite + `icons.json` frame table, `startup.mp3` (mono 64 kbps, ≤40 KB), `minesweeper.webp`.
Everything is re-measured by `npm run size`.

## 3. Files

```
index.html                     boot overlay + critical CSS, inlined
src/main.tsx                   boot state machine only
src/boot/                      Bios.tsx Splash.tsx Login.tsx Welcome.tsx sound.ts
src/firebase/                  app.ts auth.ts entries.ts admin-storage.ts (admin chunk only)
src/shell/                     Desktop.tsx Taskbar.tsx StartMenu.tsx Window.tsx windows.ts app-registry.ts
src/apps/explorer/             Explorer.tsx
src/apps/viewer/               Viewer.tsx
src/apps/editor/               Editor.tsx            (lazy, only chunk that touches Storage)
src/apps/minesweeper/          Minesweeper.tsx game.ts game.test.ts   (lazy)
src/lib/                       dates.ts dates.test.ts image.ts slug.ts storage.ts
src/styles/                    tokens.css base.css (+ one CSS file per component, imported by it)
scripts/                       set-admin.mjs optimize-assets.mjs measure-size.mjs
```

## 4. How the boot works

1. `index.html` paints the black BIOS screen from inlined CSS; no JS needed for the first frame.
2. `main.tsx` starts `import('firebase/auth')` and `import('shell/Desktop.tsx')` **before** the POST runs,
   so the download happens behind the animation.
3. Phases: BIOS (~1.5 s, line-by-line, skippable) → splash (min 1.4 s, max 8 s, releases as soon as the
   chunks land) → if no session, login; else straight to welcome.
4. The login tile is the sign-in. Its tap handler calls `sound.unlock()` (iOS: `play()` then `pause()`)
   before any `await`, then resolves auth. Welcome plays the real startup sound, then the desktop fades in
   in ≤150 ms.
5. `sessionStorage['diary-xp.booted']` makes the sequence run once per tab; a later load with a live session
   goes straight to the desktop.
6. Tap / click / Esc / Enter during phases 1–2 jumps to login. `prefers-reduced-motion` removes the typing
   and the progress animation and shortens every hold.
7. If a session was restored, the last-7-days query is issued while the splash is still on screen.

## 5. How the window manager works

`src/shell/windows.ts` owns three signals: `windows`, `activeId`, `nextZ`. A `WindowState` is
`{ id, appId, title, icon, x, y, w, h, minimized, maximized, resizable, minWidth, minHeight, props }`.

- `open(appId, props)` reuses a singleton window when the app says so, otherwise creates one, cascading
  `+26 px` and clamping inside the viewport.
- `focus(id)` raises `zIndex` from `nextZ`. Pointer-down anywhere on a window focuses it.
- Drag: pointer-down on the title bar → `setPointerCapture`, moves are applied as
  `transform: translate3d()` written straight to the DOM node inside a `requestAnimationFrame` callback,
  `will-change: transform` only for the duration, and the final `x/y` is committed to the signal on
  `pointerup`. Children never re-render while dragging.
- Resize: eight handles, same direct-write trick for `width`/`height`, committed on release. Body has
  `contain: layout paint`. Minimum size and the viewport clamp are applied per axis.
- Double-click the title bar toggles maximize. Minimize hides the node and leaves the taskbar button.
- Mobile (≤767 px): windows are full-screen sheets above the taskbar, `100dvh` + safe-area insets, no drag,
  no resize, no minimize/maximize; only the top one renders; each open pushes a history entry and
  `popstate` closes the top window, so the Android back gesture behaves.

## 6. Order of work

Checkpoint 1 (stop for approval): boot → login → welcome → desktop shell, side-by-side with the references
at 1440×900 and 390×844. Then: rules + rules tests → auth → data → desktop icons → window manager →
explorer → viewer → editor → Minesweeper → performance pass.

## 7. Budgets

Critical path (HTML + CSS + main JS, Firebase excluded) ≤ 40 KB gz · Minesweeper chunk ≤ 12 KB gz ·
thumbnails ≤ 8 KB · entry images ≤ 150 KB · Lighthouse mobile ≥ 90 with CLS ≈ 0 · no horizontal scroll at
360×640 or 390×844 · tap targets ≥ 44 px · 16 px form text.
