# Asset manifest

Drop the files listed here, then run `npm run assets`. Everything is written into
`public/`; nothing in `public/xp-inbox/` or `public/xp/` is committed.

Our own art — the wallpaper stand-in for now — lives in `assets-src/` and is
committed. The inbox is only for files that cannot be committed.

## Wallpaper

| Drop as | Source | Produces | Budget |
| --- | --- | --- | --- |
| `assets-src/wallpaper.webp` *(or png/jpg)* | ≥ 1600 × 900, landscape | `public/wallpaper.webp` — 1440 × 810 WebP | ≤ 80 KB |
| | | `public/wallpaper-mobile.webp` — 720 × 1280 portrait crop, anchored at `x 0.5 / y 0.3` | ≤ 40 KB |

The quality search starts at 80 and steps down by 2 until each output fits its
budget, so a better source means a better picture, not a bigger file.

## Startup sound

| Drop as | Source | Produces | Budget |
| --- | --- | --- | --- |
| `public/startup.mp3` | mono, ~64 kbps, ≤ 2.5 s | *(used as-is, checked against budget)* | ≤ 40 KB |

Encode a WAV with `ffmpeg -i startup.wav -ac 1 -b:a 64k -ar 44100 public/startup.mp3`.
`preload` is `none`, so the file is fetched only when the splash begins.

## Shell icons

Put the PNGs in `public/xp-inbox/icons/`, one file per name below, at **48 × 48 with
a transparent background**. The optimizer downsamples each to 24, 32 and 48 and packs
them into three sprite sheets, `public/xp/icons-24.png`, `-32.png`, `-48.png`.

```
folder.png        folder-open.png   file-text.png     notepad.png
mine-icon.png     volume.png        volume-muted.png  logoff.png
shutdown.png      restart.png       help.png          search.png
run.png           error.png         info.png          question.png
user.png          back.png          up-folder.png
```

Also useful, same folder, same rules:

```
wallpaper-bliss.png      the real Bliss, if you would rather use it than ours
start-logo.png           24 x 24, the Start button mark
splash-logo.png          48 x 48, the boot splash mark
```

After the sheets exist, set `XP_ART = true` in `src/lib/assets.ts`. That flips
`XpIcon` from the inline SVG stand-ins to `<img src="/xp/…">`, and nothing else.

## Entry thumbnails

Nothing to drop. The browser makes them: `src/lib/image.ts` draws each photo to a
canvas at ~800 px and 128 × 128, and `src/firebase/storage.ts` uploads both with an
immutable cache header.
