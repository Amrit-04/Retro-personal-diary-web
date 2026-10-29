/**
 * Our own brand marks.
 *
 * The brief forbids the literal "Windows XP" wordmark and the flag logo, and
 * requires a replacement in the same positions. These two components are that
 * replacement: an open-book mark and a "Diary" + small "XP" wordmark. They are
 * drawn here rather than shipped as files because they must scale from a 16 px
 * start button to a 48 px splash logo without a second asset.
 */
import type { JSX } from 'preact';

interface MarkProps {
  size?: number;
  title?: string;
}

/** An open book with a ribbon — diary, not flag. */
export function LogoMark({ size = 40, title }: MarkProps): JSX.Element {
  const id = `lm${size}`;
  return (
    <svg
      class="logo-mark"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label={title ?? 'Diary XP'}
    >
      <defs>
        <linearGradient id={`${id}-p`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffffff" />
          <stop offset="1" stop-color="#c9d9f2" />
        </linearGradient>
        <linearGradient id={`${id}-s`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#3d7ce6" />
          <stop offset="1" stop-color="#0b3ea8" />
        </linearGradient>
      </defs>
      <path d="M24 12c-4-3-9-4-14-3v28c5-1 10 0 14 3 4-3 9-4 14-3V9c-5-1-10 0-14 3z" fill={`url(#${id}-s)`} />
      <path d="M23 14c-3.6-2.6-8.2-3.4-12-2.6v24.9c3.8-.8 8.4 0 12 2.6z" fill={`url(#${id}-p)`} />
      <path d="M25 14c3.6-2.6 8.2-3.4 12-2.6v24.9c-3.8-.8-8.4 0-12 2.6z" fill={`url(#${id}-p)`} />
      <path d="M15 18h5M15 23h5M15 28h5M28 18h5M28 23h5M28 28h5" stroke="#8fa8d6" stroke-width="1.4" stroke-linecap="round" />
      <path d="M31 12v14l-2.6-2.2L25.8 26V12z" fill="#d8443c" />
    </svg>
  );
}

/**
 * "Diary" with a small raised "XP" — the same typographic position the reference
 * wordmark occupies on the splash and the welcome screen.
 */
export function Wordmark({ size = 40 }: MarkProps): JSX.Element {
  return (
    <span class="splash-word" style={{ fontSize: `${size}px` }}>
      Diary<sup>XP</sup>
    </span>
  );
}

/** The "start" label on the taskbar button, in the reference's italic Trebuchet. */
export function StartLabel(): JSX.Element {
  return <span class="tb-start-text">start</span>;
}
