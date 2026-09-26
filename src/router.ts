/**
 * Minimal hash-based router for Retro Diary
 */

export interface ParsedRoute {
  name: 'desktop' | 'explorer' | 'viewer' | 'editor' | 'login';
  params: Record<string, string>;
  rawHash: string;
}

type RouteListener = (route: ParsedRoute) => void;
const listeners: RouteListener[] = [];

export function parseHash(hash: string): ParsedRoute {
  const cleanHash = hash.replace(/^#\/?/, '');
  const segments = cleanHash.split('/').filter(Boolean);

  if (segments.length === 0) {
    return { name: 'desktop', params: {}, rawHash: hash };
  }

  const [root, p1, p2] = segments;

  if (root === 'login') {
    return { name: 'login', params: {}, rawHash: hash };
  }

  if (root === 'entry' && p1) {
    return { name: 'viewer', params: { date: p1 }, rawHash: hash };
  }

  if (root === 'edit' && p1) {
    return { name: 'editor', params: { date: p1, mode: 'edit' }, rawHash: hash };
  }

  if (root === 'new') {
    return { name: 'editor', params: { mode: 'new' }, rawHash: hash };
  }

  if (root === 'explorer') {
    if (p1 && p2) {
      return { name: 'explorer', params: { year: p1, month: p2 }, rawHash: hash };
    }
    if (p1) {
      return { name: 'explorer', params: { year: p1 }, rawHash: hash };
    }
    return { name: 'explorer', params: {}, rawHash: hash };
  }

  return { name: 'desktop', params: {}, rawHash: hash };
}

export function getCurrentRoute(): ParsedRoute {
  return parseHash(window.location.hash);
}

export function navigate(route: string): void {
  if (!route.startsWith('#')) {
    route = '#' + (route.startsWith('/') ? route : '/' + route);
  }
  if (window.location.hash === route) {
    // Manually trigger if setting the same hash
    notifyListeners();
  } else {
    window.location.hash = route;
  }
}

export function subscribeRouter(callback: RouteListener): () => void {
  listeners.push(callback);
  callback(getCurrentRoute());

  return () => {
    const idx = listeners.indexOf(callback);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

function notifyListeners() {
  const route = getCurrentRoute();
  for (const listener of listeners) {
    try {
      listener(route);
    } catch (err) {
      console.error('Route listener error:', err);
    }
  }
}

window.addEventListener('hashchange', notifyListeners);
