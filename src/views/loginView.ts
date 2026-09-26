import { el } from '../utils/dom';
import { loginWithGoogle } from '../auth';
import { navigate } from '../router';
import { isConfigured } from '../firebase';

export function renderLoginView(): HTMLElement {
  const container = el('div', { class: 'login-screen' });

  const errorEl = el('div', {
    class: 'login-error-box',
    style: { display: 'none', color: 'var(--color-danger)', fontSize: '11px', fontWeight: 'bold' }
  });

  const googleBtn = el('button', {
    class: 'bevel-button login-google-btn',
    onclick: async () => {
      try {
        googleBtn.disabled = true;
        googleBtn.textContent = 'Connecting to Secure Server...';
        await loginWithGoogle();
        navigate('#/');
      } catch (err: any) {
        console.error('Login error:', err);
        googleBtn.disabled = false;
        googleBtn.innerHTML = `
          <svg class="login-google-logo" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Sign in with Google
        `;
        errorEl.textContent = err.message || 'Authentication failed. Please try again.';
        errorEl.style.display = 'block';
      }
    }
  }, [
    el('span', {
      innerHTML: `
        <svg class="login-google-logo" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
      `
    }),
    el('span', {}, ['Sign in with Google'])
  ]);

  const dialog = el('div', { class: 'retro-window login-dialog' }, [
    el('div', { class: 'window-titlebar' }, [
      el('div', { class: 'window-titlebar-left' }, [
        el('span', { class: 'window-title-icon' }, ['🔒']),
        el('span', {}, ['Retro Diary OS — Authentication'])
      ])
    ]),
    el('div', { class: 'window-body login-content' }, [
      el('div', { class: 'login-hero-icon' }, ['💾']),
      el('h1', { class: 'login-app-title' }, ['Personal Diary Archive']),
      el('p', { class: 'login-app-subtitle' }, [
        'Private daily journal system. Please authenticate to verify access credentials.'
      ]),
      errorEl,
      googleBtn,
      !isConfigured ? el('div', {
        style: {
          background: '#ffffe0',
          border: '1px solid #c0c000',
          padding: '6px 10px',
          fontSize: '11px',
          color: '#555',
          textAlign: 'left',
          marginTop: '8px'
        }
      }, [
        '💡 ',
        el('strong', {}, ['Demo Mode:']),
        ' Firebase keys not detected in .env. Clicking "Sign in with Google" will log in as the demo Administrator.'
      ]) : null,
      el('div', { class: 'login-footer-note' }, ['Security: Cryptographic custom claims enforced.'])
    ])
  ]);

  container.appendChild(dialog);
  return container;
}
