import { useEffect, useState } from 'react';

// Web build of network.ts: the browser's own online/offline flag. NetInfo's
// extra reachability check pings the page's server and reads a refused
// request as "no internet", which isn't what it means here.
let currentOnline = typeof navigator === 'undefined' ? true : navigator.onLine;
const listeners = new Set<(online: boolean) => void>();

if (typeof window !== 'undefined') {
  const update = () => {
    const online = navigator.onLine;
    if (online !== currentOnline) {
      currentOnline = online;
      listeners.forEach((cb) => cb(online));
    }
  };
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
}

export function isOnline(): boolean {
  return currentOnline;
}

export function subscribeOnline(cb: (online: boolean) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useIsOnline(): boolean {
  const [online, setOnline] = useState(currentOnline);
  useEffect(() => subscribeOnline(setOnline), []);
  return online;
}
