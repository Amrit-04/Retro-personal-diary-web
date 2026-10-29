/**
 * Original inline SVG icons, drawn for this project — 16 to 48 px, currentColor
 * friendly, no icon font and nothing copied from an operating system. They are
 * inserted as constant markup, never with user data inside.
 */

/**
 * File Explorer: a glossy folder with a sheet peeking out. The gradients use ids
 * of their own; identical definitions mean repeated copies on one page agree.
 */
export function folderIconSvg(): string {
  return `<svg viewBox="0 0 48 48" class="icon-48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="dx-folder-back" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffdf7a"/>
        <stop offset="1" stop-color="#e2a523"/>
      </linearGradient>
      <linearGradient id="dx-folder-front" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffeda8"/>
        <stop offset="0.18" stop-color="#ffd45c"/>
        <stop offset="0.78" stop-color="#efb42b"/>
        <stop offset="1" stop-color="#d39816"/>
      </linearGradient>
    </defs>
    <path d="M4 12.5A2.5 2.5 0 0 1 6.5 10h11.2l3.6 4.5H41.5A2.5 2.5 0 0 1 44 17v23.5a3.5 3.5 0 0 1-3.5 3.5h-33A3.5 3.5 0 0 1 4 40.5z" fill="url(#dx-folder-back)" stroke="#a57312" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M15 7h12l5 5v22a2 2 0 0 1-2 2H15a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" fill="#fdfdf8" stroke="#7c8797" stroke-width="1.2"/>
    <path d="M27 7v5h5" fill="none" stroke="#7c8797" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M17 17h10M17 21h10M17 25h7" stroke="#9aa8b8" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M7 20.5h34V40a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3z" fill="url(#dx-folder-front)" stroke="#a57312" stroke-width="1.3"/>
    <path d="M7.4 21.3h33.2" stroke="#fff6cf" stroke-width="1.2" opacity="0.95"/>
    <path d="M10 25.5h28" stroke="#c98b12" stroke-width="0.8" opacity="0.5"/>
  </svg>`;
}

/** Small folder for list rows. */
export function folderSmallSvg(): string {
  return `<svg viewBox="0 0 24 24" class="svg-icon" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M2 6h7l2 2h11v12H2z" fill="#e8b74a" stroke="#a97d20" stroke-width="1.4" stroke-linejoin="round"/>
  </svg>`;
}

/** A sheet of ruled paper: the text-file icon, also the fallback for a missing doodle. */
export function textFileIconSvg(): string {
  return `<svg viewBox="0 0 48 48" class="icon-48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M11 5h20l7 7v31a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" fill="#fdfdf8" stroke="#6b7a8c" stroke-width="2"/>
    <path d="M31 5v7h7" fill="none" stroke="#6b7a8c" stroke-width="2" stroke-linejoin="round"/>
    <path d="M15 19h16M15 25h16M15 31h11" stroke="#9aa8b8" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
}

export function textFileSmallSvg(): string {
  return `<svg viewBox="0 0 24 24" class="svg-icon" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M6 2h9l4 4v16H6z" fill="#fdfdf8" stroke="#6b7a8c" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M9 11h7M9 15h7" stroke="#9aa8b8" stroke-width="1.4" stroke-linecap="round"/>
  </svg>`;
}

/** Page with a pencil: New Entry. */
export function newEntryIconSvg(): string {
  return `<svg viewBox="0 0 48 48" class="icon-48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M9 5h20l8 8v30H9z" fill="#fdfdf8" stroke="#6b7a8c" stroke-width="2"/>
    <path d="M29 5v8h8" fill="none" stroke="#6b7a8c" stroke-width="2"/>
    <path d="M14 34l14-14 5 5-14 14H14z" fill="#f0b429" stroke="#9c6d00" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M28 20l5-5 5 5-5 5z" fill="#d9534f" stroke="#9c6d00" stroke-width="1.6"/>
  </svg>`;
}

/** Framed landscape: the picture picker mark. */
export function pictureGlyphSvg(): string {
  return `<svg viewBox="0 0 24 24" width="28" height="28" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="2.5" y="4.5" width="19" height="15" rx="1.5" fill="#fff" stroke="#27548c" stroke-width="1.5"/>
    <circle cx="8" cy="9.5" r="1.8" fill="#f2b52c" stroke="#a57312" stroke-width="0.8"/>
    <path d="M4.5 17.5l5-5.5 4 4 2.5-2.5 3.5 4z" fill="#7fb2e5" stroke="#27548c" stroke-width="1.2" stroke-linejoin="round"/>
  </svg>`;
}

/** Speaker for the tray. */
export function volumeIconSvg(): string {
  return `<svg viewBox="0 0 24 24" class="svg-icon" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M4 9h4l5-4v14l-5-4H4z" fill="#eaf3ff" stroke="#0b3b8c" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8 8 0 0 1 0 12" fill="none" stroke="#eaf3ff" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`;
}

export function mutedIconSvg(): string {
  return `<svg viewBox="0 0 24 24" class="svg-icon" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M4 9h4l5-4v14l-5-4H4z" fill="#b9c6dd" stroke="#0b3b8c" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M16 9l6 6M22 9l-6 6" stroke="#ffd0d0" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`;
}

export function backArrowSvg(): string {
  return `<svg viewBox="0 0 16 16" class="svg-icon" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M10 2.5 4.5 8 10 13.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

export function upArrowSvg(): string {
  return `<svg viewBox="0 0 16 16" class="svg-icon" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M8 13V3.5M3.5 8 8 3.5 12.5 8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

/** Generic person, used for the login avatar and the Start menu header. */
export function userAvatarSvg(): string {
  return `<svg viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg" width="56" height="56" aria-hidden="true">
    <rect width="56" height="56" rx="3" fill="#7ba7d9"/>
    <circle cx="28" cy="21" r="9" fill="#f2f6fc"/>
    <path d="M10 50c2-11 9-16 18-16s16 5 18 16z" fill="#f2f6fc"/>
  </svg>`;
}

/** The Start button mark: our own notebook glyph, deliberately not anyone's flag. */
export function startMarkSvg(): string {
  return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true">
    <rect x="4" y="2.5" width="16" height="19" rx="2" fill="#ece9d8" stroke="#0b3b8c" stroke-width="1.2"/>
    <path d="M7 2.5v4M12 2.5v4M17 2.5v4" stroke="#1f5fbf" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M7 12h10M7 16h7" stroke="#5c7bb0" stroke-width="1.4" stroke-linecap="round"/>
  </svg>`;
}

/** Power/exit mark for Log Off. */
export function logOffIconSvg(): string {
  return `<svg viewBox="0 0 20 20" class="svg-icon" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M10 2.5v7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M5.5 5.2a6.5 6.5 0 1 0 9 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
}

export function restartIconSvg(): string {
  return `<svg viewBox="0 0 20 20" class="svg-icon" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M10 3.5A6.5 6.5 0 1 0 16.5 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M10 1v5L6.5 3.5z" fill="currentColor"/>
  </svg>`;
}

/** The X inside a window's close button. */
export function closeGlyphSvg(): string {
  return `<svg viewBox="0 0 10 10" width="10" height="10" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M1.5 1.5l7 7m0-7-7 7" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`;
}

export function minimizeGlyphSvg(): string {
  return `<svg viewBox="0 0 10 10" width="10" height="10" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M2 8h6" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`;
}

export function maximizeGlyphSvg(): string {
  return `<svg viewBox="0 0 10 10" width="10" height="10" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="1.6" y="1.6" width="6.8" height="6.8" rx="0.6" fill="none" stroke="#fff" stroke-width="1.5"/>
    <path d="M1.6 3.4h6.8" stroke="#fff" stroke-width="1.8"/>
  </svg>`;
}

export function restoreGlyphSvg(): string {
  return `<svg viewBox="0 0 10 10" width="10" height="10" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M3.4 1.4h5.2v5.2" fill="none" stroke="#fff" stroke-width="1.4"/>
    <rect x="1.4" y="3.4" width="5.2" height="5.2" rx="0.5" fill="#2f6fd0" stroke="#fff" stroke-width="1.4"/>
  </svg>`;
}
