import { useEffect, useState, useCallback } from 'react';
import { useIsOnline } from '../lib/network';
import { subscribeQueueChanged, getPendingCount, getPendingItems, SyncQueueItem } from '../lib/syncQueue';
import { subscribeSyncing } from '../lib/syncProcessor';

export type SyncStatus = 'offline' | 'syncing' | 'synced' | 'pending';

export function useSyncStatus() {
  const online = useIsOnline();
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const refresh = useCallback(() => {
    getPendingCount().then(setPendingCount);
  }, []);

  useEffect(() => {
    refresh();
    const unsubQueue = subscribeQueueChanged(refresh);
    const unsubSyncing = subscribeSyncing(setSyncing);
    return () => { unsubQueue(); unsubSyncing(); };
  }, [refresh]);

  let status: SyncStatus;
  if (!online) status = 'offline';
  else if (syncing) status = 'syncing';
  else if (pendingCount > 0) status = 'pending'; // online, waiting for the next sync pass
  else status = 'synced';

  return { status, online, syncing, pendingCount, refresh };
}

export async function listPendingSyncItems(): Promise<SyncQueueItem[]> {
  return getPendingItems();
}
