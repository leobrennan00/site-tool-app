import React, { useState, useEffect } from 'react';
import {
  ScrollView, View, Text, StyleSheet, Pressable, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { getUserReports, deleteReport, Report } from '../../lib/reports';
import { processQueue } from '../../lib/syncProcessor';
import { isOnline } from '../../lib/network';
import { Brand, Font, Shadow } from '@/constants/theme';
import { ProgressRing, StatusPill, GradientHero } from '@/components/ui/kit';
import { IcoChevronRight, IcoPlus, IcoTrash } from '@/components/ui/icons';
import { useIsDesktop } from '@/hooks/useLayout';
import { DesktopReports } from '@/components/web/DesktopReports';
import { ReportsMap } from '@/components/ReportsMap';

interface MyReportsProps {
  onLoadReport: (report: Report) => void;
  onNewReport: () => void;
  currentReportId: string | null;
}

const TOTAL_SECTIONS = 12;

function computeProgress(r: Report): number {
  const ci = r.client_info || {};
  const ds = r.desk_study || {};
  const va = r.visual_assessment || {};
  const th = r.trial_hole || {};
  const sp = r.subsurface_perc || {};
  const sf = r.surface_perc || {};
  const co = r.conclusion || {};
  const dw = r.selected_dwwts || {};
  const ts = r.treatment_systems || {};
  const qa = r.quality_assurance || {};
  const sa = r.site_assessor || {};
  const checks = [
    (r.map_urls?.length ?? 0) > 0 || (r.photo_urls?.length ?? 0) > 0,
    !!(ci.firstName || ci.surname || ci.siteLocation),
    !!(ds.soilType || ds.aquiferCategory || ds.vulnerability),
    !!(va.landscapePosition || va.slope),
    !!(th.trialDepth || th.thClassificationCol),
    !!sp.likelySubsurfaceP,
    !!sf.likelySurfaceP,
    !!(co.dischargeRoute || co.suitableForDevelopment || co.unsatDepth),
    !!(dw.dwwtsInstall || dw.dwwtsDischargeTo),
    !!(ts.packagedType || ts.septTankCapacity),
    !!(qa.qaInstall || qa.qaMaintenance),
    !!(sa.assFirst || sa.assSurname || sa.assCompany),
  ];
  const done = checks.filter(Boolean).length;
  return (done / TOTAL_SECTIONS) * 100;
}

export default function MyReportsTab(props: MyReportsProps) {
  const { onLoadReport, onNewReport, currentReportId } = props;
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<'list' | 'map'>('list');
  const desktop = useIsDesktop();

  useEffect(() => { loadReports(); }, []);

  async function loadReports() {
    setLoading(true);
    const { data, error } = await getUserReports();
    if (error) {
      console.error('Failed to load reports:', error);
      Alert.alert('Error', 'Failed to load your reports');
    } else if (data) {
      setReports(data);
    }
    setLoading(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    // Pull-to-refresh is the one place we explicitly wait on the network:
    // pick up anything created/changed on another device, then push any of
    // this device's pending changes, before re-reading the (now up to date)
    // local list. Silently skipped offline — the local list is already
    // what's shown, same as on a normal load.
    // (processQueue pulls first, then pushes.)
    if (isOnline()) {
      await processQueue().catch(() => {});
    }
    await loadReports();
    setRefreshing(false);
  }

  function handleDelete(reportId: string) {
    Alert.alert(
      'Delete Report',
      'Are you sure you want to delete this report? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            const { error } = await deleteReport(reportId);
            if (error) Alert.alert('Error', 'Failed to delete report');
            else setReports(reports.filter((r) => r.id !== reportId));
          },
        },
      ]
    );
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  const titleOf = (report: Report) => {
    const ci = report.client_info || {};
    return report.site_name && report.site_name !== 'Untitled Report'
      ? report.site_name
      : `${ci.firstName || ''} ${ci.surname || ''}`.trim() || 'Untitled Report';
  };

  if (desktop) {
    return (
      <DesktopReports
        loading={loading}
        rows={reports.map((report) => ({
          report,
          // Client first, as on the report overview; the location is the line below.
          title: `${report.client_info?.firstName || ''} ${report.client_info?.surname || ''}`.trim() || titleOf(report),
          location: report.client_info?.siteLocation || '',
          percent: computeProgress(report),
        }))}
        onOpen={onLoadReport}
        onNew={onNewReport}
        onDelete={handleDelete}
      />
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Brand.primary} />
        <Text style={styles.loadingText}>Loading your reports…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: Brand.bg }}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Brand.primary} />}
    >
      {/* New Report CTA */}
      <Pressable onPress={onNewReport}>
        <GradientHero style={styles.cta}>
          <View style={styles.ctaIcon}>
            <IcoPlus size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaTitle}>New Report</Text>
            <Text style={styles.ctaSub}>Start a new site assessment</Text>
          </View>
          <IcoChevronRight size={22} color="rgba(255,255,255,0.8)" />
        </GradientHero>
      </Pressable>

      <View style={styles.segment}>
        {(['list', 'map'] as const).map((v) => (
          <Pressable key={v} onPress={() => setView(v)} style={[styles.segmentBtn, view === v && styles.segmentOn]}
            accessibilityRole="tab" accessibilityState={{ selected: view === v }}>
            <Text style={[styles.segmentText, view === v && styles.segmentTextOn]}>{v === 'list' ? 'List' : 'Map'}</Text>
          </Pressable>
        ))}
      </View>

      {view === 'map' ? (
        <View style={styles.mapCard}>
          <ReportsMap
            items={reports.map((report) => ({
              report,
              // Client first, as on the desktop map; the location is the line below.
              title: `${report.client_info?.firstName || ''} ${report.client_info?.surname || ''}`.trim() || titleOf(report),
              location: report.client_info?.siteLocation || '',
            }))}
            onOpen={onLoadReport}
          />
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No Reports Yet</Text>
          <Text style={styles.emptyStateText}>Create your first site assessment to get started</Text>
        </View>
      ) : (
        reports.map((report) => {
          const percent = computeProgress(report);
          const ci = report.client_info || {};
          const location = ci.siteLocation || '';
          const title = titleOf(report);
          return (
            <Pressable
              key={report.id}
              style={styles.reportCard}
              onPress={() => onLoadReport(report)}
              onLongPress={() => handleDelete(report.id)}
            >
              <ProgressRing size={52} stroke={5} percent={percent} variant="green" />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text numberOfLines={1} style={styles.reportTitle}>{title}</Text>
                {location ? <Text numberOfLines={1} style={styles.reportLoc}>{location}</Text> : null}
                <View style={{ marginTop: 6 }}>
                  <StatusPill status={report.status === 'completed' ? 'completed' : 'draft'} />
                </View>
              </View>
              <View style={{ alignItems: 'flex-end', justifyContent: 'space-between', height: 52 }}>
                <Pressable hitSlop={10} onPress={() => handleDelete(report.id)} style={styles.deleteBtn}>
                  <IcoTrash size={18} color={Brand.danger} />
                </Pressable>
                <Text style={styles.reportDate}>{formatDate(report.updated_at)}</Text>
              </View>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: Brand.bg },
  loadingText: { marginTop: 16, fontSize: 15, color: Brand.textSub, fontFamily: Font.regular },

  cta: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 18, padding: 16, marginBottom: 22, ...Shadow.floating,
  },
  ctaIcon: {
    width: 46, height: 46, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  ctaTitle: { fontSize: 17, fontFamily: Font.bold, color: '#fff', letterSpacing: -0.2 },
  ctaSub: { fontSize: 13, fontFamily: Font.regular, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  segment: {
    flexDirection: 'row', backgroundColor: Brand.borderLight, borderRadius: 12, padding: 3, marginBottom: 14,
  },
  segmentBtn: { flex: 1, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  segmentOn: { backgroundColor: Brand.surface, ...Shadow.card },
  segmentText: { fontSize: 13.5, fontFamily: Font.semibold, color: Brand.textSub },
  segmentTextOn: { color: Brand.primary },
  mapCard: {
    backgroundColor: Brand.surface, borderRadius: 18, padding: 14,
    borderWidth: 1, borderColor: Brand.borderLight, ...Shadow.card,
  },

  emptyState: { alignItems: 'center', padding: 40 },
  emptyStateTitle: { fontSize: 18, fontFamily: Font.semibold, color: Brand.text, marginBottom: 8 },
  emptyStateText: { fontSize: 14, color: Brand.textSub, textAlign: 'center', fontFamily: Font.regular },

  reportCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Brand.surface, borderRadius: 18, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: Brand.borderLight, ...Shadow.card,
  },
  deleteBtn: {
    width: 30, height: 30, borderRadius: 8, backgroundColor: Brand.dangerTint,
    alignItems: 'center', justifyContent: 'center',
  },
  reportTitle: { fontSize: 15, fontFamily: Font.semibold, color: Brand.text },
  reportLoc: { fontSize: 13, fontFamily: Font.regular, color: Brand.textSub, marginTop: 2 },
  reportDate: { fontSize: 11, fontFamily: Font.regular, color: Brand.textMuted },
});
