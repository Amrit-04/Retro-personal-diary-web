/**
 * Authentic Windows XP Vector Icons
 */

// XP Start Button 4-color Flag Logo
export function getXpStartLogoSvg(): string {
  return `<svg viewBox="0 0 32 32" class="xp-start-logo-svg" xmlns="http://www.w3.org/2000/svg">
    <!-- Red Top-Left -->
    <path d="M4 14 C4 11, 7 8, 14 7 L14 15 C8 15, 5 15, 4 14 Z" fill="#eb3c24" filter="drop-shadow(0 1px 1px rgba(0,0,0,0.3))"/>
    <!-- Green Top-Right -->
    <path d="M16 7 C23 6, 26 9, 28 12 C27 13, 24 13, 16 15 Z" fill="#66bb22" filter="drop-shadow(0 1px 1px rgba(0,0,0,0.3))"/>
    <!-- Blue Bottom-Left -->
    <path d="M4 17 C5 17, 8 17, 14 17 L14 25 C7 24, 4 21, 4 17 Z" fill="#0077e6" filter="drop-shadow(0 1px 1px rgba(0,0,0,0.3))"/>
    <!-- Yellow Bottom-Right -->
    <path d="M16 17 C24 15, 27 15, 28 16 C26 19, 23 22, 16 25 Z" fill="#fdb813" filter="drop-shadow(0 1px 1px rgba(0,0,0,0.3))"/>
  </svg>`;
}

// XP Yellow Folder Icon
export function getFolderIconSvg(): string {
  return `<svg viewBox="0 0 48 48" class="desktop-system-icon-svg" xmlns="http://www.w3.org/2000/svg">
    <!-- Back Tab -->
    <path d="M6 10 C6 9, 7 8, 8 8 L18 8 C20 8, 22 11, 24 11 L40 11 C41 11, 42 12, 42 13 L42 22 L6 22 Z" fill="#f6b834" stroke="#c48612" stroke-width="1.5"/>
    <!-- Interior Paper -->
    <rect x="10" y="12" width="28" height="12" fill="#ffffff" rx="1"/>
    <!-- Front Pocket with 3D slope -->
    <path d="M4 16 L44 16 L40 40 C40 41, 39 42, 38 42 L10 42 C9 42, 8 41, 8 40 Z" fill="url(#xpFolderGrad)" stroke="#c48612" stroke-width="1.5"/>
    <path d="M8 20 L40 20" stroke="#fce488" stroke-width="1.5" opacity="0.6"/>
    <defs>
      <linearGradient id="xpFolderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffd55c"/>
        <stop offset="100%" stop-color="#e89d10"/>
      </linearGradient>
    </defs>
  </svg>`;
}

// XP My Computer / File Explorer Icon
export function getFileExplorerIconSvg(): string {
  return `<svg viewBox="0 0 48 48" class="desktop-system-icon-svg" xmlns="http://www.w3.org/2000/svg">
    <!-- Monitor Body -->
    <rect x="8" y="6" width="32" height="24" rx="2" fill="#4676b5" stroke="#2a4c82" stroke-width="1.5"/>
    <!-- Screen Bezel -->
    <rect x="11" y="9" width="26" height="18" fill="#5b92e5" rx="1"/>
    <!-- CRT Screen Display with Bliss mini hill -->
    <rect x="13" y="11" width="22" height="14" fill="#3283e8"/>
    <path d="M13 19 C17 17, 25 15, 35 18 L35 25 L13 25 Z" fill="#58b32e"/>
    <!-- Stand -->
    <path d="M20 30 L28 30 L30 35 L18 35 Z" fill="#9eb0c6" stroke="#465e7d" stroke-width="1.5"/>
    <!-- Base -->
    <rect x="14" y="35" width="20" height="4" rx="1" fill="#758ea8" stroke="#465e7d" stroke-width="1.5"/>
  </svg>`;
}

// XP Text Document / Notepad Icon
export function getDocumentIconSvg(): string {
  return `<svg viewBox="0 0 48 48" class="desktop-system-icon-svg" xmlns="http://www.w3.org/2000/svg">
    <!-- Paper Page with folded top-right corner -->
    <path d="M10 6 L30 6 L38 14 L38 42 C38 43, 37 44, 36 44 L12 44 C11 44, 10 43, 10 42 Z" fill="#ffffff" stroke="#5a6e85" stroke-width="1.5" filter="drop-shadow(1px 2px 2px rgba(0,0,0,0.25))"/>
    <!-- Folded Corner -->
    <path d="M30 6 L30 14 L38 14 Z" fill="#d2d9e1" stroke="#5a6e85" stroke-width="1.5"/>
    <!-- Blue Ruled Lines -->
    <line x1="16" y1="18" x2="32" y2="18" stroke="#3377dd" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="16" y1="24" x2="32" y2="24" stroke="#8ca6c8" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="16" y1="30" x2="32" y2="30" stroke="#8ca6c8" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="16" y1="36" x2="26" y2="36" stroke="#8ca6c8" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`;
}

// XP Executable / New Entry Icon (Pencil with Notepad)
export function getNewEntryIconSvg(): string {
  return `<svg viewBox="0 0 48 48" class="desktop-system-icon-svg" xmlns="http://www.w3.org/2000/svg">
    <!-- Base Notepad -->
    <rect x="8" y="10" width="28" height="32" rx="2" fill="#ffffff" stroke="#5a6e85" stroke-width="1.5" filter="drop-shadow(1px 2px 2px rgba(0,0,0,0.25))"/>
    <rect x="8" y="10" width="28" height="6" fill="#3069c9" rx="1"/>
    <!-- Yellow Pencil on top -->
    <g transform="translate(4, -2) rotate(15 24 24)">
      <path d="M26 10 L32 10 L32 32 L26 32 Z" fill="#f5af19" stroke="#9e6600" stroke-width="1.2"/>
      <polygon points="26,32 32,32 29,38" fill="#fcd9b0" stroke="#9e6600" stroke-width="1.2"/>
      <polygon points="28,36 30,36 29,38" fill="#222222"/>
      <!-- Eraser -->
      <rect x="26" y="6" width="6" height="4" rx="1" fill="#e85d75" stroke="#9e6600" stroke-width="1.2"/>
      <rect x="26" y="8" width="6" height="2" fill="#c0c0c0"/>
    </g>
  </svg>`;
}

// XP Explorer Navigation Icons
export function getXpBackArrowSvg(): string {
  return `<svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="url(#xpGreenCircle)" stroke="#228833" stroke-width="1.5"/>
    <path d="M14 7 L9 12 L14 17" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <defs>
      <linearGradient id="xpGreenCircle" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#55cc44"/>
        <stop offset="100%" stop-color="#229922"/>
      </linearGradient>
    </defs>
  </svg>`;
}

export function getXpUpArrowSvg(): string {
  return `<svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 7 L10 7 L12 9 L20 9 L20 18 L4 18 Z" fill="#ffd55c" stroke="#c48612" stroke-width="1"/>
    <path d="M12 17 L12 8 M9 11 L12 8 L15 11" stroke="#0055ea" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

export function getXpSearchSvg(): string {
  return `<svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="6" fill="none" stroke="#2255bb" stroke-width="2.5"/>
    <line x1="14.5" y1="14.5" x2="20" y2="20" stroke="#cc7700" stroke-width="3.5" stroke-linecap="round"/>
  </svg>`;
}

export function getXpFoldersIconSvg(): string {
  return `<svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 6 L7 6 L9 8 L17 8 L17 15 L2 15 Z" fill="#ffd55c" stroke="#c48612" stroke-width="1"/>
    <path d="M6 10 L11 10 L13 12 L22 12 L22 20 L6 20 Z" fill="#f5af19" stroke="#c48612" stroke-width="1"/>
  </svg>`;
}

// XP Start Menu Avatar (User Tile)
export function getXpUserAvatarSvg(): string {
  return `<svg viewBox="0 0 36 36" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
    <rect width="36" height="36" rx="3" fill="#ffffff" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 1px 3px rgba(0,0,0,0.4))"/>
    <rect x="2" y="2" width="32" height="32" rx="2" fill="#f59e0b"/>
    <!-- XP Chess / Rubber Duck / Flower / Sun avatar symbol -->
    <circle cx="18" cy="18" r="8" fill="#ffffff"/>
    <circle cx="18" cy="18" r="5" fill="#f59e0b"/>
  </svg>`;
}

// XP Log Off (Yellow Key) & Shut Down (Red Button)
export function getXpLogOffIconSvg(): string {
  return `<svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="12" r="5" fill="none" stroke="#f59e0b" stroke-width="2.5"/>
    <path d="M14 12 L21 12 L21 15 M18 12 L18 15" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`;
}

export function getXpShutDownIconSvg(): string {
  return `<svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" fill="#dc2626" stroke="#991b1b" stroke-width="1"/>
    <path d="M12 6 L12 12" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M8 8.5 C6.5 10 6 12 6.5 14 C7.2 16.5 9.5 18 12 18 C14.5 18 16.8 16.5 17.5 14 C18 12 17.5 10 16 8.5" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
}
