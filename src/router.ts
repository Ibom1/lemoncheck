import { useEffect, useState } from 'react';

// A tiny hash router: the app is a handful of screens, so a library would be overkill.
// Routes: #/  ·  #/new  ·  #/i/<id>  ·  #/i/<id>/edit  ·  #/i/<id>/report  ·  #/compare

export type Route =
  | { name: 'home' }
  | { name: 'new' }
  | { name: 'inspect'; id: string }
  | { name: 'edit'; id: string }
  | { name: 'report'; id: string }
  | { name: 'compare' };

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'new') return { name: 'new' };
  if (parts[0] === 'compare') return { name: 'compare' };
  if (parts[0] === 'i' && parts[1]) {
    if (parts[2] === 'report') return { name: 'report', id: parts[1] };
    if (parts[2] === 'edit') return { name: 'edit', id: parts[1] };
    return { name: 'inspect', id: parts[1] };
  }
  return { name: 'home' };
}

export function href(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/';
    case 'new':
      return '#/new';
    case 'compare':
      return '#/compare';
    case 'inspect':
      return `#/i/${route.id}`;
    case 'edit':
      return `#/i/${route.id}/edit`;
    case 'report':
      return `#/i/${route.id}/report`;
  }
}

export function go(route: Route): void {
  window.location.hash = href(route);
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
