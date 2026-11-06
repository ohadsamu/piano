import { useCallback, useEffect, useState } from 'react';
import { CURRICULUM_LESSONS, SONG_LIBRARY, getLessonById } from '../data';
import type { Selection } from '../components/practice/types';

export type Route =
  | { name: 'home' }
  | { name: 'lesson'; lessonId: string; stepNumber: number }
  | { name: 'song'; songId: string }
  | { name: 'drills' };

/** Parses `#/…`. Unknown or malformed routes go Home rather than silently opening lesson 1. */
export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  if (parts[0] === 'lesson' && parts[1]) {
    const lesson = CURRICULUM_LESSONS.find((l) => l.id === parts[1]);
    if (!lesson) return { name: 'home' };
    const n = Number(parts[2] ?? 1);
    const stepNumber = lesson.steps.some((s) => s.stepNumber === n) ? n : lesson.steps[0].stepNumber;
    return { name: 'lesson', lessonId: lesson.id, stepNumber };
  }
  if (parts[0] === 'song' && parts[1]) {
    return SONG_LIBRARY.some((s) => s.id === parts[1]) ? { name: 'song', songId: parts[1] } : { name: 'home' };
  }
  if (parts[0] === 'drills') return { name: 'drills' };
  return { name: 'home' };
}

export function routeToHash(route: Route): string {
  switch (route.name) {
    case 'lesson':
      return `#/lesson/${encodeURIComponent(route.lessonId)}/${route.stepNumber}`;
    case 'song':
      return `#/song/${encodeURIComponent(route.songId)}`;
    case 'drills':
      return '#/drills';
    default:
      return '#/';
  }
}

export function useHashRoute(): [Route, (route: Route, opts?: { replace?: boolean }) => void] {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((next: Route, opts?: { replace?: boolean }) => {
    const hash = routeToHash(next);
    if (window.location.hash === hash) return;
    if (opts?.replace) {
      window.history.replaceState(null, '', hash);
      setRoute(parseHash(hash));
    } else {
      window.location.hash = hash;
    }
  }, []);

  return [route, navigate];
}

export function routeToSelection(route: Route): Selection | null {
  if (route.name === 'lesson') {
    const lesson = getLessonById(route.lessonId);
    const idx = lesson.steps.findIndex((s) => s.stepNumber === route.stepNumber);
    return { kind: 'lesson', lessonId: lesson.id, stepIndex: Math.max(0, idx) };
  }
  if (route.name === 'song') return { kind: 'song', songId: route.songId };
  return null;
}
