import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

// Thin wrapper around NetInfo so the rest of the app only has one place to
// ask "are we online?". We treat "online" as "connected AND internet appears
// reachable" when NetInfo can tell us (isInternetReachable is null on some
// platforms/transitions, in which case we fall back to isConnected so we
// don't get stuck permanently "offline" on devices that never report it).
function resolveOnline(state: { isConnected: boolean | null; isInternetReachable: boolean | null }): boolean {
  if (state.isInternetReachable !== null) return !!state.isInternetReachable;
  return !!state.isConnected;
}

let currentOnline = true;
const listeners = new Set<(online: boolean) => void>();

NetInfo.fetch().then((state) => {
  currentOnline = resolveOnline(state);
});

NetInfo.addEventListener((state) => {
  const online = resolveOnline(state);
  if (online !== currentOnline) {
    currentOnline = online;
    listeners.forEach((cb) => cb(online));
  }
});

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
