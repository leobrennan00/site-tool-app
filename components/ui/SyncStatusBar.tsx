import React, { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Brand, Font, Shadow } from '@/constants/theme';
import { useSyncStatus, listPendingSyncItems } from '../../hooks/useSyncStatus';
import type { SyncQueueItem } from '../../lib/syncQueue';

const LABELS: Record<string, string> = {
  report_upsert: 'Report changes',
  report_delete: 'Report deletion',
  photo_upload: 'Photo',
  report_generate: 'Report generation',
};

function statusLabel(status: string, pendingCount: number): string {
  switch (status) {
    case 'offline': return pendingCount > 0 ? `Offline · ${pendingCount} waiting` : 'Offline';
    case 'syncing': return 'Syncing…';
    case 'pending': return `${pendingCount} waiting to sync`;
    default: return 'All saved';
  }
}

function statusColors(status: string): { bg: string; fg: string; dot: string } {
  switch (status) {
    case 'offline': return { bg: Brand.amberTint, fg: Brand.amber, dot: Brand.amber };
    case 'syncing': return { bg: Brand.primaryTint, fg: Brand.primary, dot: Brand.primary };
    case 'pending': return { bg: Brand.amberTint, fg: Brand.amber, dot: Brand.amber };
    default: return { bg: Brand.primaryTint, fg: Brand.primary, dot: Brand.primary };
  }
}

/** Small "Offline / Syncing / All saved" pill with a tappable pending-items
 *  count — meant to sit in an AppHeader's rightNode, or standalone. Never
 *  shows as an error/alert; offline and pending are both normal, expected
 *  states while working on site. */
export function SyncStatusBar() {
  const { status, syncing, pendingCount } = useSyncStatus();
  const [detailVisible, setDetailVisible] = useState(false);
  const [items, setItems] = useState<SyncQueueItem[]>([]);
  const colors = statusColors(status);

  const openDetail = async () => {
    setItems(await listPendingSyncItems());
    setDetailVisible(true);
  };

  return (
    <>
      <Pressable
        onPress={pendingCount > 0 ? openDetail : undefined}
        style={[styles.pill, { backgroundColor: colors.bg }]}
      >
        {syncing ? (
          <ActivityIndicator size="small" color={colors.fg} style={{ marginRight: 6 }} />
        ) : (
          <View style={[styles.dot, { backgroundColor: colors.dot }]} />
        )}
        <Text style={[styles.pillText, { color: colors.fg }]} numberOfLines={1}>
          {statusLabel(status, pendingCount)}
        </Text>
      </Pressable>

      <Modal visible={detailVisible} animationType="slide" transparent onRequestClose={() => setDetailVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setDetailVisible(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Waiting to sync</Text>
            <Text style={styles.sheetSub}>
              These will upload automatically next time you&rsquo;re online — nothing is lost in the meantime.
            </Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {items.length === 0 ? (
                <Text style={styles.emptyText}>Nothing waiting — everything&rsquo;s synced.</Text>
              ) : (
                items.map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <View style={[styles.itemDot, item.status === 'error' && { backgroundColor: Brand.danger }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemLabel}>{LABELS[item.type] || item.type}</Text>
                      {item.status === 'error' && item.last_error ? (
                        <Text style={styles.itemError} numberOfLines={2}>Will retry — {item.last_error}</Text>
                      ) : null}
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
            <Pressable style={styles.closeBtn} onPress={() => setDetailVisible(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, maxWidth: 170,
  },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  pillText: { fontSize: 12, fontFamily: Font.semibold },
  overlay: { flex: 1, backgroundColor: Brand.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Brand.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 32, ...Shadow.card,
  },
  sheetTitle: { fontSize: 18, fontFamily: Font.bold, color: Brand.text },
  sheetSub: { fontSize: 13, color: Brand.textSub, fontFamily: Font.regular, marginTop: 4, marginBottom: 16, lineHeight: 18 },
  emptyText: { color: Brand.textSub, fontFamily: Font.regular, fontSize: 14, paddingVertical: 20, textAlign: 'center' },
  itemRow: {
    flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Brand.borderLight,
  },
  itemDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Brand.amber, marginRight: 10, marginTop: 5 },
  itemLabel: { fontSize: 14, fontFamily: Font.medium, color: Brand.text },
  itemError: { fontSize: 12, fontFamily: Font.regular, color: Brand.textSub, marginTop: 2 },
  closeBtn: { marginTop: 16, alignItems: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: Brand.bg },
  closeBtnText: { color: Brand.primary, fontFamily: Font.semibold, fontSize: 15 },
});
