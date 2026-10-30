import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { Brand, Font } from '@/constants/theme';
import { ProgressRing, StatusPill } from '@/components/ui/kit';
import { IcoPlus, IcoSearch, IcoTrash, IcoChevronRight } from '@/components/ui/icons';
import type { Report } from '@/lib/reports';
import { ReportsMap } from '@/components/ReportsMap';

export interface ReportRowData {
  report: Report;
  title: string;
  location: string;
  percent: number;
}

/** My Reports on the desktop layout: a searchable table of every report —
 *  including those started on the phone — with the same progress rings, and
 *  beside it a map of Ireland with a pin for each site. */
export function DesktopReports({
  rows, loading, onOpen, onNew, onDelete,
}: {
  rows: ReportRowData[];
  loading: boolean;
  onOpen: (r: Report) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [hoverRow, setHoverRow] = useState<string | null>(null);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(({ report, title, location }) => {
      const ci = report.client_info || {};
      return [title, location, ci.fileRef, ci.firstName, ci.surname, ci.address]
        .some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [rows, query]);

  const drafts = rows.filter((r) => r.report.status !== 'completed').length;

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.statsRow}>
        <Stat label="Reports" value={rows.length} />
        <Stat label="In progress" value={drafts} />
        <Stat label="Complete" value={rows.length - drafts} />
        <View style={{ flex: 1 }} />
        <Pressable onPress={onNew} style={({ hovered }: any) => [styles.newBtn, hovered && { backgroundColor: Brand.primaryDark }]}>
          <IcoPlus size={18} color="#fff" />
          <Text style={styles.newBtnText}>New report</Text>
        </Pressable>
      </View>

      <View style={styles.columns}>
      <View style={[styles.card, { flex: 1, minWidth: 0 }]}>
        <View style={styles.toolbar}>
          <View style={styles.search}>
            <IcoSearch size={18} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name, location or file ref"
              placeholderTextColor={Brand.textMuted}
              style={styles.searchInput}
            />
          </View>
        </View>

        <View style={[styles.tr, styles.thead]}>
          <Text style={[styles.th, { flex: 3.2 }]}>Report</Text>
          <Text style={[styles.th, { flex: 1.2 }]}>File ref</Text>
          <Text style={[styles.th, { flex: 1.2 }]}>Status</Text>
          <Text style={[styles.th, { flex: 1.1 }]}>Updated</Text>
          <View style={{ width: 76 }} />
        </View>

        {loading ? (
          <View style={styles.empty}><ActivityIndicator color={Brand.primary} /><Text style={styles.emptyText}>Loading your reports…</Text></View>
        ) : shown.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{rows.length ? 'No matching reports' : 'No reports yet'}</Text>
            <Text style={styles.emptyText}>
              {rows.length ? 'Try a different search.' : 'Reports started on the phone appear here once it has synced.'}
            </Text>
          </View>
        ) : (
          shown.map(({ report, title, location, percent }) => (
            <Pressable key={report.id} onPress={() => onOpen(report)}
              onHoverIn={() => setHoverRow(report.id)}
              onHoverOut={() => setHoverRow((h) => (h === report.id ? null : h))}
              style={({ hovered }: any) => [styles.tr, styles.row, hovered && styles.rowHover]}>
              <View style={[styles.cell, { flex: 3.2, flexDirection: 'row', alignItems: 'center' }]}>
                <ProgressRing size={40} stroke={4} percent={percent} variant="green" />
                <View style={{ marginLeft: 14, flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={styles.title}>{title}</Text>
                  <Text numberOfLines={1} style={styles.sub}>{location || 'No site location yet'}</Text>
                </View>
              </View>
              <Text numberOfLines={1} style={[styles.cell, styles.td, { flex: 1.2 }]}>{report.client_info?.fileRef || '—'}</Text>
              <View style={[styles.cell, { flex: 1.2 }]}>
                <StatusPill status={report.status === 'completed' ? 'completed' : 'draft'} />
              </View>
              <Text style={[styles.cell, styles.td, { flex: 1.1 }]}>{formatUpdated(report.updated_at)}</Text>
              <View style={styles.rowActions}>
                <Pressable onPress={(e: any) => { e?.stopPropagation?.(); onDelete(report.id); }} accessibilityLabel="Delete report"
                  style={({ hovered }: any) => [styles.iconBtn, hovered && { backgroundColor: Brand.dangerTint }]}>
                  <IcoTrash size={17} color={Brand.danger} />
                </Pressable>
                <IcoChevronRight size={18} color={Brand.textMuted} />
              </View>
            </Pressable>
          ))
        )}
      </View>

      <View style={[styles.card, styles.mapCard]}>
        <Text style={styles.mapTitle}>Sites</Text>
        <Text style={styles.mapSub}>{query.trim() ? 'Reports matching your search' : 'Every report, by where the site is'}</Text>
        <ReportsMap items={shown} onOpen={onOpen} highlightId={hoverRow} style={{ marginTop: 14 }} />
      </View>
      </View>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function formatUpdated(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const styles = StyleSheet.create({
  page: { width: '100%', maxWidth: 1480, alignSelf: 'center', padding: 32, paddingBottom: 80 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 22 },
  stat: {
    backgroundColor: Brand.surface, borderRadius: 14, borderWidth: 1, borderColor: Brand.borderLight,
    paddingVertical: 12, paddingHorizontal: 18, minWidth: 128,
  },
  statValue: { fontSize: 24, fontFamily: Font.bold, color: Brand.text, letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 12, fontFamily: Font.medium, color: Brand.textSub, marginTop: 1 },
  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 18, borderRadius: 12,
    backgroundColor: Brand.primary, shadowColor: Brand.primary, shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: 5 },
  },
  newBtnText: { fontSize: 14.5, fontFamily: Font.semibold, color: '#fff' },

  card: {
    backgroundColor: Brand.surface, borderRadius: 18, borderWidth: 1, borderColor: Brand.borderLight, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 2 },
  },
  columns: { flexDirection: 'row', alignItems: 'flex-start', gap: 20 },
  mapCard: { width: 400, padding: 18, position: 'sticky' as any, top: 0 },
  mapTitle: { fontSize: 16, fontFamily: Font.bold, color: Brand.text, letterSpacing: -0.2 },
  mapSub: { fontSize: 13, fontFamily: Font.regular, color: Brand.textSub, marginTop: 2 },
  toolbar: { padding: 16, borderBottomWidth: 1, borderBottomColor: Brand.borderLight },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 10, height: 42, maxWidth: 420, paddingHorizontal: 14,
    borderRadius: 11, borderWidth: 1.5, borderColor: Brand.border, backgroundColor: Brand.bg,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: Font.regular, color: Brand.text, outlineStyle: 'none' } as any,

  tr: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  thead: { height: 40, backgroundColor: Brand.bg, borderBottomWidth: 1, borderBottomColor: Brand.borderLight },
  th: { fontSize: 11, fontFamily: Font.bold, color: Brand.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  row: { minHeight: 68, borderBottomWidth: 1, borderBottomColor: Brand.borderLight },
  rowHover: { backgroundColor: '#FBFDFB' },
  cell: { paddingRight: 12 },
  td: { fontSize: 14, fontFamily: Font.regular, color: Brand.textSub },
  title: { fontSize: 15, fontFamily: Font.semibold, color: Brand.text },
  sub: { fontSize: 13, fontFamily: Font.regular, color: Brand.textSub, marginTop: 2 },
  rowActions: { width: 76, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
  iconBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  empty: { alignItems: 'center', paddingVertical: 56, gap: 8 },
  emptyTitle: { fontSize: 16, fontFamily: Font.semibold, color: Brand.text },
  emptyText: { fontSize: 14, fontFamily: Font.regular, color: Brand.textSub },
});
