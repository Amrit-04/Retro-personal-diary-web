/**
 * Every non-code asset the shell touches, in one place.
 *
 * Real XP art cannot be fetched or copied here, so it arrives by hand: drop the
 * originals in public/xp-inbox/ and run `node scripts/optimize-assets.mjs`, which
 * writes the resized, re-encoded set to public/xp/. Flipping XP_ART is then the only
 * change needed anywhere in the app — the filenames below are the contract.
 *
 * With XP_ART false the app renders its own stand-ins: an original wallpaper, an
 * original synthesized startup chime, and the SVG glyphs in src/shell/icons.tsx.
 */

export const XP_ART = false;

const DIR = XP_ART ? '/xp' : '';

export const WALLPAPER = `${DIR}/wallpaper.webp`;
export const WALLPAPER_MOBILE = `${DIR}/wallpaper-mobile.webp`;

/** Flat colour behind the wallpaper while it loads, so nothing flashes white. */
export const WALLPAPER_FALLBACK = '#3a6ea5';

export const STARTUP_SOUND = `${DIR}/startup.mp3`;
