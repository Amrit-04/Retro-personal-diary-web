import './styles/global.css';
import './styles/window.css';
import './styles/desktop.css';
import './styles/explorer.css';
import './styles/viewer.css';
import './styles/login.css';
import './styles/taskbar.css';
import './styles/modal.css';

import { subscribeAuth } from './auth';
import { subscribeRouter, getCurrentRoute, navigate, ParsedRoute } from './router';
import { UserSession } from './types';
import { clearElement } from './utils/dom';
import { renderDesktopView } from './views/desktopView';
import { renderExplorerView } from './views/explorerView';
import { renderViewerView } from './views/viewerView';
import { renderLoginView } from './views/loginView';
import { renderTaskbar } from './components/taskbar';

const appRoot = document.getElementById('app') as HTMLElement;

let currentUser: UserSession | null = null;
let currentRoute: ParsedRoute = getCurrentRoute();

// Make current user accessible globally for taskbar updates
(window as any).__CURRENT_USER__ = null;

function renderApp() {
  clearElement(appRoot);

  // 1. If not authenticated, always show the login view
  if (!currentUser) {
    const loginView = renderLoginView();
    appRoot.appendChild(loginView);
    return;
  }

  (window as any).__CURRENT_USER__ = currentUser;

  // 2. Base Desktop Layer (Home screen with 7-day recent entries)
  const desktopLayer = renderDesktopView(currentUser);
  appRoot.appendChild(desktopLayer);

  // 3. Active Window Layer (if user has opened Explorer, Viewer, or Editor)
  let activeWindowTitle: string | undefined;

  if (currentRoute.name === 'explorer') {
    const explorerWindow = renderExplorerView(currentUser, currentRoute.params);
    appRoot.appendChild(explorerWindow);
    activeWindowTitle = '📂 Diary Archive';
  } else if (currentRoute.name === 'viewer' && currentRoute.params.date) {
    const viewerWindow = renderViewerView(currentUser, currentRoute.params.date);
    appRoot.appendChild(viewerWindow);
    activeWindowTitle = `📖 Entry: ${currentRoute.params.date}`;
  }

  // 4. Taskbar Layer (always visible at bottom)
  const taskbar = renderTaskbar(currentUser, activeWindowTitle);
  appRoot.appendChild(taskbar);
}

// Subscribe to Auth state changes
subscribeAuth((user) => {
  currentUser = user;
  if (!user && window.location.hash !== '#/login') {
    navigate('#/login');
  } else if (user && window.location.hash === '#/login') {
    navigate('#/');
  }
  renderApp();
});

// Subscribe to Router hash changes
subscribeRouter((route) => {
  currentRoute = route;
  renderApp();
});