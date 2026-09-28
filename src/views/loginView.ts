import { el } from '../utils/dom';
import { loginWithGoogle } from '../auth';
import { navigate } from '../router';
import { isConfigured } from '../firebase';

export function renderLoginView(): HTMLElement {
  const screen = el('div', { class: 'login-screen' });

  // Top blue bar (XP style)
  const topBar = el('div', { class: 'login-header-bar' });
  screen.appendChild(topBar);

  // Main container with explanatory content
  const mainContainer = el('div', { class: 'login-main-container' });

  // Left side: explanatory text and graphics
  const leftSide = el('div', { class: 'login-left-side' }, [
    // Small diary/computer graphic
    el('div', { class: 'login-graphic' }, [
      el('div', { class: 'login-graphic-icon' }, ['📓']), // diary emoji
      el('div', { class: 'login-graphic-icon' }, ['💾']), // disk emoji
    ]),
    // Title
    el('div', { class: 'login-title' }, ['MY DAILY ARCHIVE']),
    // Subtitle
    el('div', { class: 'login-subtitle' }, [
      'A private digital diary',
      el('br', {}),
      'written one day at a time'
    ]),
    // Features list
    el('div', { class: 'login-features' }, [
      el('div', { class: 'login-feature' }, [
        el('span', { class: 'login-feature-icon' }, ['✍️']),
        el('span', {}, ['Write your thoughts'])
      ]),
      el('div', { class: 'login-feature' }, [
        el('span', { class: 'login-feature-icon' }, ['🎨']),
        el('span', {}, ['Draw a daily doodle'])
      ]),
      el('div', { class: 'login-feature' }, [
        el('span', { class: 'login-feature-icon' }, ['🔒']),
        el('span', {}, ['Keep your memories private'])
      ])
    ])
  ]);
  mainContainer.appendChild(leftSide);

  // Right side: Google Sign-in button and demo notice
  const rightSide = el('div', { class: 'login-right-side' }, [
    // Google Sign-in button (XP style)
    el('button', {
      class: 'login-google-btn',
      onclick: async () => {
        try {
          // Button feedback
          const btnEl = document.querySelector('.login-google-btn') as HTMLButtonElement;
          if (btnEl) {
            btnEl.disabled = true;
            btnEl.textContent = 'Signing in...';
          }
          await loginWithGoogle();
          navigate('#/');
        } catch (err: any) {
          console.error('Login error:', err);
          const btnEl = document.querySelector('.login-google-btn') as HTMLButtonElement;
          if (btnEl) {
            btnEl.disabled = false;
            btnEl.textContent = 'Sign in with Google';
          }
          // Show error using existing modal (we'll reuse showRetroAlert from modal)
          // For simplicity, we'll just log and let the user try again.
          // In a real app, we'd show an XP-style message box.
          alert('Login failed: ' + (err.message || 'Unknown error'));
        }
      }
    }, [
      el('span', { class: 'login-google-logo' }, [
        // We'll use a simple Google logo placeholder or emoji
        // Since we don't have the SVG embedded, we'll use colored circles
        el('span', { class: 'login-google-color g-blue' }, []),
        el('span', { class: 'login-google-color g-red' }, []),
        el('span', { class: 'login-google-color g-yellow' }, []),
        el('span', { class: 'login-google-color g-green' }, [])
      ]),
      el('span', {}, ['Sign in with Google'])
    ]),
    // Demo notice if not configured
    !isConfigured ? el('div', { class: 'login-demo-notice' }, [
      el('strong', {}, ['💡 Demo Mode: ']),
      'Firebase credentials not detected. Signing in will grant instant access to demo the application.'
    ]) : null
  ]);
  mainContainer.appendChild(rightSide);

  screen.appendChild(mainContainer);

  // Bottom bar (XP style)
  const bottomBar = el('div', { class: 'login-footer-bar' }, [
    el('span', { class: 'login-footer-text' }, [
      'Your personal archive of thoughts, moments, and doodles.'
    ])
  ]);
  screen.appendChild(bottomBar);

  return screen;
}