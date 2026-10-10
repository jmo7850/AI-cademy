import { useEffect, useState } from 'react';

/** Minimal hash router: works from any static host and from file-less previews. */
export function parseHash(hash: string): string[] {
  return hash.replace(/^#\/?/, '').split('?')[0]!.split('/').filter(Boolean).map(decodeURIComponent);
}

export function useRoute(): string[] {
  const [parts, setParts] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const on = () => {
      setParts(parseHash(window.location.hash));
      window.scrollTo?.(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return parts;
}

export const href = (...parts: string[]) => `#/${parts.map(encodeURIComponent).join('/')}`;
export const go = (...parts: string[]) => {
  window.location.hash = href(...parts);
};
