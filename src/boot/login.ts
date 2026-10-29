/**
 * Welcome screen. A single blue band with the wordmark on the left and the user
 * tile on the right, sitting on the dark logon background.
 * The tile is the Google sign-in, and the tap on it doubles as the gesture that
 * unlocks audio. It knows nothing about Firebase: the caller hands it a session
 * (already restored, or null) and a callback for the tap.
 */
import '../styles/login.css';
import { h } from '../lib/dom';
import { userAvatarSvg } from '../ui/icons';
import type { Session } from '../firebase/auth';
import { unlockAudio } from './sound';

export interface LoginOptions {
  session: Session | null;
  onPickUser: (session: Session | null) => void;
  onRestart: () => void;
  demo: boolean;
}

export function mountLogin(host: HTMLElement, options: LoginOptions): HTMLElement {
  const error = h('p', { class: 'login-error', role: 'status', 'aria-live': 'polite', hidden: true });
  let busy = false;

  const tile = h(
    'button',
    {
      class: 'user-tile',
      type: 'button',
      'aria-label': options.session ? `Log in as ${options.session.name}` : 'Sign in with Google',
    },
    [
      h('span', { class: 'user-avatar' }, options.session?.photoURL
        ? h('img', { src: options.session.photoURL, alt: '', width: 56, height: 56, decoding: 'async' })
        : h('span', { class: 'avatar-fallback', html: userAvatarSvg() })),
      h('span', { class: 'user-name' }, options.session ? options.session.name : 'Sign in with Google'),
      h('span', { class: 'user-sub' }, options.session
        ? 'Click to open your diary'
        : options.demo ? 'Demo account' : 'Google account'),
    ],
  );

  tile.addEventListener('click', () => {
    if (busy) return;
    busy = true;
    tile.disabled = true;

    // Must happen inside the gesture handler, before any await.
    unlockAudio();

    Promise.resolve(options.onPickUser(options.session)).catch((problem: unknown) => {
      busy = false;
      tile.disabled = false;
      showError(messageFor(problem));
    });
  });

  function showError(text: string): void {
    error.textContent = text;
    error.hidden = false;
  }

  const screen = h('div', { class: 'login screen is-on' }, [
    h('div', { class: 'login-inner' }, [
      h('div', { class: 'login-brand' }, [
        h('div', { class: 'brand-mark' }, ['DIARY', h('span', { class: 'brand-xp' }, ['XP'])]),
        h('div', { class: 'brand-sub' }, ['personal journal system']),
      ]),
      h('div', { class: 'login-side' }, [
        h('p', { class: 'login-hint' }, ['To begin, click your user name']),
        tile,
        error,
        h('p', { class: 'login-foot' }, ['After you log on, this machine is yours.']),
      ]),
    ]),
    h(
      'button',
      { class: 'login-restart', type: 'button', onclick: () => options.onRestart() },
      [restartGlyph(), 'Restart'],
    ),
  ]);

  host.appendChild(screen);
  return screen;
}

export function unmountLogin(screen: HTMLElement): void {
  screen.remove();
}

function restartGlyph(): HTMLElement {
  return h('span', { class: 'login-restart-icon', html: restartSvgTiny() });
}

function restartSvgTiny(): string {
  return `<svg viewBox="0 0 16 16" width="14" height="14" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M8 2.5A5.5 5.5 0 1 0 13.5 8" fill="none" stroke="#eaf1ff" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M8 0.6 L8 4.4 L4.6 2.5 Z" fill="#eaf1ff"/>
  </svg>`;
}

function messageFor(problem: unknown): string {
  const message = (problem as Error | null)?.message;
  return message && !message.includes('[')
    ? message
    : 'Sign-in failed. Check your connection and try again.';
}
