export function getFolderIconSvg(): string {
  return `<svg viewBox="0 0 48 48" class="desktop-system-icon-svg" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 10 L18 10 L22 16 L44 16 L44 40 L4 40 Z" fill="#e6b800" stroke="#806000" stroke-width="2"/>
    <path d="M4 16 L44 16 L44 40 L4 40 Z" fill="#ffd700" stroke="#806000" stroke-width="2"/>
    <path d="M7 20 L41 20" stroke="#ffe066" stroke-width="2"/>
  </svg>`;
}

export function getFileExplorerIconSvg(): string {
  return `<svg viewBox="0 0 48 48" class="desktop-system-icon-svg" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="8" width="36" height="32" fill="#c0c0c0" stroke="#000000" stroke-width="2"/>
    <rect x="8" y="10" width="32" height="6" fill="#000080"/>
    <rect x="10" y="19" width="12" height="18" fill="#e6b800" stroke="#806000" stroke-width="1.5"/>
    <rect x="25" y="19" width="13" height="18" fill="#ffffff" stroke="#808080" stroke-width="1.5"/>
    <line x1="28" y1="23" x2="35" y2="23" stroke="#000000" stroke-width="1"/>
    <line x1="28" y1="27" x2="35" y2="27" stroke="#000000" stroke-width="1"/>
    <line x1="28" y1="31" x2="33" y2="31" stroke="#000000" stroke-width="1"/>
  </svg>`;
}

export function getDocumentIconSvg(): string {
  return `<svg viewBox="0 0 48 48" class="desktop-system-icon-svg" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 6 L30 6 L38 14 L38 42 L10 42 Z" fill="#ffffff" stroke="#000000" stroke-width="2"/>
    <path d="M30 6 L30 14 L38 14" fill="#dfdfdf" stroke="#000000" stroke-width="1.5"/>
    <line x1="16" y1="18" x2="32" y2="18" stroke="#000080" stroke-width="1.5"/>
    <line x1="16" y1="24" x2="32" y2="24" stroke="#808080" stroke-width="1.5"/>
    <line x1="16" y1="30" x2="32" y2="30" stroke="#808080" stroke-width="1.5"/>
    <line x1="16" y1="36" x2="26" y2="36" stroke="#808080" stroke-width="1.5"/>
  </svg>`;
}

export function getNewEntryIconSvg(): string {
  return `<svg viewBox="0 0 48 48" class="desktop-system-icon-svg" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 6 L28 6 L36 14 L36 42 L8 42 Z" fill="#ffffff" stroke="#000000" stroke-width="2"/>
    <path d="M28 6 L28 14 L36 14" fill="#dfdfdf" stroke="#000000" stroke-width="1.5"/>
    <!-- Pencil -->
    <path d="M20 32 L36 16 L40 20 L24 36 Z" fill="#ffff00" stroke="#000000" stroke-width="1.5"/>
    <polygon points="20,32 18,38 24,36" fill="#ff9999" stroke="#000000" stroke-width="1"/>
    <line x1="22" y1="22" x2="30" y2="30" stroke="#000000" stroke-width="1.5"/>
  </svg>`;
}
