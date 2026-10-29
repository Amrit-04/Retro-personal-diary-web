/**
 * Icon layer.
 *
 * Two sources, one component. Until the real XP art is dropped into
 * public/xp-inbox/ and processed by scripts/optimize-assets.mjs, every glyph is an
 * original stand-in drawn in the sprite below — the same silhouettes, sizes and
 * positions, so swapping the art later is a one-line change here and nothing else.
 *
 * One hidden <svg> holds every symbol; each <XpIcon> is a <use> reference, so the
 * whole set costs one DOM tree instead of dozens of duplicated paths.
 */
import type { JSX } from 'preact';
import { XP_ART } from '../lib/assets';

/** public/xp/ is written by scripts/optimize-assets.mjs; see lib/assets.ts. */
const ART_DIR = '/xp';

export type IconName =
  | 'folder'
  | 'folder-open'
  | 'text'
  | 'notepad'
  | 'mine'
  | 'volume'
  | 'volume-muted'
  | 'logoff'
  | 'shutdown'
  | 'restart'
  | 'help'
  | 'search'
  | 'run'
  | 'error'
  | 'info'
  | 'question'
  | 'user'
  | 'back'
  | 'up';

const ART_FILE: Record<IconName, string> = {
  folder: 'folder.png',
  'folder-open': 'folder-open.png',
  text: 'file-text.png',
  notepad: 'notepad.png',
  mine: 'mine-icon.png',
  volume: 'volume.png',
  'volume-muted': 'volume-muted.png',
  logoff: 'logoff.png',
  shutdown: 'shutdown.png',
  restart: 'restart.png',
  help: 'help.png',
  search: 'search.png',
  run: 'run.png',
  error: 'error.png',
  info: 'info.png',
  question: 'question.png',
  user: 'user.png',
  back: 'back.png',
  up: 'up-folder.png',
};

interface XpIconProps {
  name: IconName;
  size?: number;
  label?: string;
}

export function XpIcon({ name, size = 24, label }: XpIconProps): JSX.Element {
  if (XP_ART) {
    return (
      <img
        class="xp-icon"
        src={`${ART_DIR}/${ART_FILE[name]}`}
        width={size}
        height={size}
        alt={label ?? ''}
        aria-hidden={label ? undefined : 'true'}
        draggable={false}
      />
    );
  }
  return (
    <svg
      class="xp-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : 'true'}
      focusable="false"
    >
      <use href={`#xi-${name}`} />
    </svg>
  );
}

/** Mounted once, next to the app root. Holds every gradient and every symbol. */
export function IconSprite(): JSX.Element {
  return (
    <svg class="visually-hidden" aria-hidden="true" width="0" height="0" focusable="false">
      <defs>
        <linearGradient id="xs-manila" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffe59a" />
          <stop offset="0.5" stop-color="#fbd06a" />
          <stop offset="1" stop-color="#d9a233" />
        </linearGradient>
        <linearGradient id="xs-manila-dark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#e8bc55" />
          <stop offset="1" stop-color="#b8842a" />
        </linearGradient>
        <linearGradient id="xs-paper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffffff" />
          <stop offset="1" stop-color="#d8dde6" />
        </linearGradient>
        <linearGradient id="xs-blue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#63a0f5" />
          <stop offset="1" stop-color="#0a3fb4" />
        </linearGradient>
        <linearGradient id="xs-red" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ff7a5c" />
          <stop offset="1" stop-color="#c32208" />
        </linearGradient>
        <linearGradient id="xs-green" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#8ce07a" />
          <stop offset="1" stop-color="#1a8a1f" />
        </linearGradient>
        <linearGradient id="xs-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffe27a" />
          <stop offset="1" stop-color="#d59400" />
        </linearGradient>
        <linearGradient id="xs-steel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#f3f6fb" />
          <stop offset="0.45" stop-color="#c2cede" />
          <stop offset="1" stop-color="#8b9cb3" />
        </linearGradient>
        <radialGradient id="xs-gloss" cx="0.35" cy="0.25" r="0.75">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.85" />
          <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="xs-iron" cx="0.34" cy="0.28" r="0.85">
          <stop offset="0" stop-color="#8f96a3" />
          <stop offset="0.45" stop-color="#3b4048" />
          <stop offset="1" stop-color="#0c0d10" />
        </radialGradient>
      </defs>

      <symbol id="xi-folder" viewBox="0 0 24 24">
        <path d="M1.6 5.5h7.2l1.8 2h11.8v2.4H1.6z" fill="url(#xs-manila-dark)" stroke="#8a5f18" stroke-width="0.6" />
        <path d="M1.6 8.4h20.8v10.9H1.6z" fill="url(#xs-manila)" stroke="#8a5f18" stroke-width="0.6" />
        <path d="M2.4 9.2h19.2v3.1H2.4z" fill="#fff" opacity="0.35" />
      </symbol>

      <symbol id="xi-folder-open" viewBox="0 0 24 24">
        <path d="M1.6 5.5h7.2l1.8 2h10.6v2.2H1.6z" fill="url(#xs-manila-dark)" stroke="#8a5f18" stroke-width="0.6" />
        <path d="M3.4 10h19l-2.6 9.3H1z" fill="url(#xs-manila)" stroke="#8a5f18" stroke-width="0.6" />
        <path d="M4.6 10.8h15.6l-1.8 6.2H2.9z" fill="#fff" opacity="0.3" />
      </symbol>

      <symbol id="xi-text" viewBox="0 0 24 24">
        <path d="M4.5 1.8h9.6l5.4 5.4v15H4.5z" fill="url(#xs-paper)" stroke="#7c8899" stroke-width="0.8" />
        <path d="M14.1 1.8v5.4h5.4" fill="#aeb9c9" />
        <path d="M7 10.5h10M7 13.5h10M7 16.5h7" stroke="#5a6f8c" stroke-width="1.2" stroke-linecap="round" />
      </symbol>

      <symbol id="xi-notepad" viewBox="0 0 24 24">
        <path d="M3.4 2h12.2v18.4H3.4z" fill="url(#xs-paper)" stroke="#7c8899" stroke-width="0.8" />
        <path d="M6 7h7M6 10.2h7M6 13.4h5" stroke="#4b7fd0" stroke-width="1.2" stroke-linecap="round" />
        <path d="M13.2 20.6l7.6-7.6 2.4 2.4-7.6 7.6-3 .6z" fill="url(#xs-gold)" stroke="#8a5f18" stroke-width="0.7" transform="translate(-2 -3)" />
      </symbol>

      <symbol id="xi-mine" viewBox="0 0 24 24">
        <path
          d="M12 2.6v3.8M12 17.6v3.8M2.6 12h3.8M17.6 12h3.8M5.4 5.4l2.7 2.7M15.9 15.9l2.7 2.7M18.6 5.4l-2.7 2.7M8.1 15.9l-2.7 2.7"
          stroke="#14161a"
          stroke-width="1.6"
          stroke-linecap="round"
        />
        <circle cx="12" cy="12" r="5.9" fill="url(#xs-iron)" />
        <ellipse cx="9.9" cy="9.7" rx="1.9" ry="1.5" fill="#fff" opacity="0.55" transform="rotate(-35 9.9 9.7)" />
      </symbol>

      <symbol id="xi-volume" viewBox="0 0 24 24">
        <path d="M2 2h20v20H2z" fill="url(#xs-blue)" rx="2" opacity="0.001" />
        <path d="M3 9h3.6L11 5v14L6.6 15H3z" fill="url(#xs-steel)" stroke="#3d4a5c" stroke-width="0.8" />
        <path d="M14.4 8.6a5 5 0 0 1 0 6.8M17 6a8.2 8.2 0 0 1 0 12" stroke="#ffe27a" stroke-width="1.8" fill="none" stroke-linecap="round" />
      </symbol>

      <symbol id="xi-volume-muted" viewBox="0 0 24 24">
        <path d="M3 9h3.6L11 5v14L6.6 15H3z" fill="url(#xs-steel)" stroke="#3d4a5c" stroke-width="0.8" />
        <path d="M15 9.5l5 5M20 9.5l-5 5" stroke="#c32208" stroke-width="1.9" stroke-linecap="round" />
      </symbol>

      <symbol id="xi-logoff" viewBox="0 0 24 24">
        <path d="M3 2h10v20H3z" fill="url(#xs-steel)" stroke="#3d4a5c" stroke-width="0.8" />
        <circle cx="11" cy="12" r="1" fill="#3d4a5c" />
        <path d="M13 12h8M18 8.6l3.4 3.4L18 15.4" stroke="url(#xs-blue)" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round" />
      </symbol>

      <symbol id="xi-shutdown" viewBox="0 0 24 24">
        <circle cx="12" cy="12.5" r="8.5" fill="url(#xs-red)" />
        <path d="M12 6.5v6" stroke="#fff" stroke-width="2.4" stroke-linecap="round" />
        <path d="M8 8.6a5.6 5.6 0 1 0 8 0" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" />
      </symbol>

      <symbol id="xi-restart" viewBox="0 0 24 24">
        <circle cx="12" cy="12.5" r="8.5" fill="url(#xs-green)" />
        <path d="M16.5 9.5a5.5 5.5 0 1 0 1 4" stroke="#fff" stroke-width="2.1" fill="none" stroke-linecap="round" />
        <path d="M17.6 5.4v4.4h-4.4" stroke="#fff" stroke-width="2.1" fill="none" stroke-linecap="round" stroke-linejoin="round" />
      </symbol>

      <symbol id="xi-help" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9.5" fill="url(#xs-blue)" />
        <text x="12" y="17" text-anchor="middle" font-family="Tahoma, sans-serif" font-size="13" font-weight="700" fill="#fff">?</text>
      </symbol>

      <symbol id="xi-search" viewBox="0 0 24 24">
        <circle cx="10" cy="10" r="6.5" fill="#cfe4ff" stroke="#1c4fa9" stroke-width="2" />
        <path d="M15 15l6.5 6.5" stroke="#1c4fa9" stroke-width="2.6" stroke-linecap="round" />
      </symbol>

      <symbol id="xi-run" viewBox="0 0 24 24">
        <path d="M2 4h14v11H2z" fill="url(#xs-paper)" stroke="#3d4a5c" stroke-width="0.9" />
        <path d="M4 6.4h10" stroke="#1c4fa9" stroke-width="1.8" />
        <path d="M13 13l8 6-9-1z" fill="url(#xs-gold)" stroke="#8a5f18" stroke-width="0.7" />
      </symbol>

      <symbol id="xi-error" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9.5" fill="url(#xs-red)" />
        <path d="M8.4 8.4l7.2 7.2M15.6 8.4l-7.2 7.2" stroke="#fff" stroke-width="2.6" stroke-linecap="round" />
      </symbol>

      <symbol id="xi-info" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9.5" fill="url(#xs-blue)" />
        <path d="M12 10.5v6.5" stroke="#fff" stroke-width="2.6" stroke-linecap="round" />
        <circle cx="12" cy="6.9" r="1.5" fill="#fff" />
      </symbol>

      <symbol id="xi-question" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9.5" fill="url(#xs-gold)" />
        <text x="12" y="17.2" text-anchor="middle" font-family="Tahoma, sans-serif" font-size="13" font-weight="700" fill="#fff">?</text>
      </symbol>

      <symbol id="xi-user" viewBox="0 0 24 24">
        <path d="M2 2h20v20H2z" fill="url(#xs-blue)" />
        <circle cx="12" cy="9" r="3.6" fill="#ffe0c2" />
        <path d="M4.5 21c1-4.2 4-6 7.5-6s6.5 1.8 7.5 6z" fill="#ffe0c2" />
      </symbol>

      <symbol id="xi-back" viewBox="0 0 24 24">
        <path d="M14 3.5 5.5 12l8.5 8.5" fill="none" stroke="url(#xs-blue)" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" />
      </symbol>

      <symbol id="xi-up" viewBox="0 0 24 24">
        <path d="M3.5 13.5 12 5l8.5 8.5" fill="none" stroke="url(#xs-blue)" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" />
      </symbol>
    </svg>
  );
}
