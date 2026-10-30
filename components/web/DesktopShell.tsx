import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Brand, Font, SectionMeta } from '@/constants/theme';
import { ProgressRing } from '@/components/ui/kit';
import { IcoDoc, IcoSettings, IcoSignOut, IcoLeaf, IcoCheck, IcoChevronLeft, IcoChevronRight } from '@/components/ui/icons';
import { SyncStatusBar } from '@/components/ui/SyncStatusBar';
import { SECTION_GROUPS, ALL_SECTIONS, SectionId } from '@/components/ui/ReportOverview';

// Desktop layout for the website (browser windows ≥ DESKTOP_MIN_WIDTH, see
// hooks/useLayout.ts): a dark-green sidebar with the app's places and, once a
// report is open, every section of it with its progress; a top bar with the
// page title, the save status and the page's actions; the page itself to
// the right. The pages are the phone's screens, unchanged.

export type MainView = 'myReports' | 'currentReport' | 'settings';

export interface ShellReport {
  title: string;
  location: string;
  percent: number;
  sectionsComplete: Record<string, boolean>;
  /** null = the report overview. */
  section: SectionId | null;
  onOpen: (section: SectionId | null) => void;
}

interface Props {
  view: MainView;
  onNavigate: (view: MainView) => void;
  user: { name: string; email: string };
  onSignOut: () => void;
  report: ShellReport | null;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function DesktopShell({ view, onNavigate, user, onSignOut, report, title, subtitle, actions, children }: Props) {
  const initials = (user.name || user.email).split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');

  return (
    <View style={styles.root}>
      <LinearGradient colors={[Brand.primaryDark, '#163B2A']} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} style={styles.sidebar}>
        <View style={styles.brand}>
          <View style={styles.brandTile}><IcoLeaf size={22} color="#fff" /></View>
          <View>
            <Text style={styles.brandName}>SiteReport</Text>
            <Text style={styles.brandSub}>Site assessments</Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
          <NavItem label="Reports" active={view === 'myReports'} onPress={() => onNavigate('myReports')}
            icon={<IcoDoc size={18} color={view === 'myReports' ? '#fff' : 'rgba(255,255,255,0.7)'} />} />
          <NavItem label="Settings" active={view === 'settings'} onPress={() => onNavigate('settings')}
            icon={<IcoSettings size={18} color={view === 'settings' ? '#fff' : 'rgba(255,255,255,0.7)'} />} />

          {report ? (
            <View style={styles.reportBlock}>
              <Text style={styles.groupLabel}>Open report</Text>
              <Pressable
                onPress={() => { onNavigate('currentReport'); report.onOpen(null); }}
                style={({ hovered }: any) => [
                  styles.reportCard,
                  view === 'currentReport' && report.section === null && styles.reportCardActive,
                  hovered && styles.hover,
                ]}
              >
                <ProgressRing size={38} stroke={4} percent={report.percent} variant="white" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text numberOfLines={1} style={styles.reportTitle}>{report.title}</Text>
                  <Text numberOfLines={1} style={styles.reportSub}>{report.location || 'Overview'}</Text>
                </View>
              </Pressable>

              {SECTION_GROUPS.map((group) => (
                <View key={group.title} style={{ marginTop: 12 }}>
                  <Text style={styles.groupLabel}>{group.title}</Text>
                  {group.ids.map((id) => {
                    const active = view === 'currentReport' && report.section === id;
                    const done = !!report.sectionsComplete[id];
                    return (
                      <Pressable
                        key={id}
                        onPress={() => { onNavigate('currentReport'); report.onOpen(id); }}
                        style={({ hovered }: any) => [styles.sectionItem, active && styles.itemActive, hovered && !active && styles.hover]}
                      >
                        <View style={[styles.sectionDot, { backgroundColor: SectionMeta[id]?.color || Brand.primaryMid }]}>
                          <Text style={styles.sectionAbbr}>{SectionMeta[id]?.abbr}</Text>
                        </View>
                        <Text numberOfLines={1} style={[styles.sectionLabel, active && { color: '#fff' }]}>
                          {SectionMeta[id]?.label || id}
                        </Text>
                        {done ? (
                          <View style={styles.doneDot}><IcoCheck size={10} color={Brand.primaryDark} strokeWidth={3} /></View>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.userRow}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials || '·'}</Text></View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={styles.userName}>{user.name || 'Signed in'}</Text>
            <Text numberOfLines={1} style={styles.userEmail}>{user.email}</Text>
          </View>
          <Pressable onPress={onSignOut} accessibilityRole="button" accessibilityLabel="Sign out"
            style={({ hovered }: any) => [styles.signOut, hovered && styles.hover]}>
            <IcoSignOut size={18} color="rgba(255,255,255,0.75)" />
          </Pressable>
        </View>
      </LinearGradient>

      <View style={styles.main}>
        <View style={styles.topBar}>
          <View style={{ flex: 1, minWidth: 0 }}>
            {subtitle ? <Text numberOfLines={1} style={styles.crumb}>{subtitle}</Text> : null}
            <Text numberOfLines={1} style={styles.title}>{title}</Text>
          </View>
          <View style={styles.actions}>
            <SyncStatusBar />
            {actions}
          </View>
        </View>
        <View style={styles.content}>{children}</View>
      </View>
    </View>
  );
}

function NavItem({ label, icon, active, onPress }: { label: string; icon: React.ReactNode; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ hovered }: any) => [styles.navItem, active && styles.itemActive, hovered && !active && styles.hover]}>
      {icon}
      <Text style={[styles.navLabel, active && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

/** Previous / next section buttons for the top bar of a section page. */
export function SectionStepper({ section, onOpen }: { section: SectionId; onOpen: (s: SectionId) => void }) {
  const i = ALL_SECTIONS.indexOf(section);
  const prev = i > 0 ? ALL_SECTIONS[i - 1] : null;
  const next = i < ALL_SECTIONS.length - 1 ? ALL_SECTIONS[i + 1] : null;
  return (
    <View style={styles.stepper}>
      <Pressable disabled={!prev} onPress={() => prev && onOpen(prev)} accessibilityLabel={prev ? `Previous: ${SectionMeta[prev]?.label}` : undefined}
        style={({ hovered }: any) => [styles.stepBtn, !prev && { opacity: 0.35 }, hovered && prev && styles.stepHover]}>
        <IcoChevronLeft size={18} color={Brand.textSub} />
      </Pressable>
      <Text style={styles.stepText}>{i + 1} of {ALL_SECTIONS.length}</Text>
      <Pressable disabled={!next} onPress={() => next && onOpen(next)} accessibilityLabel={next ? `Next: ${SectionMeta[next]?.label}` : undefined}
        style={({ hovered }: any) => [styles.stepBtn, !next && { opacity: 0.35 }, hovered && next && styles.stepHover]}>
        <IcoChevronRight size={18} color={Brand.textSub} />
      </Pressable>
    </View>
  );
}

/** The top bar's main button (e.g. Generate PDF). */
export function TopBarButton({ title, onPress, busy, icon, variant = 'primary' }: {
  title: string; onPress: () => void; busy?: boolean; icon?: React.ReactNode; variant?: 'primary' | 'ghost';
}) {
  const primary = variant === 'primary';
  return (
    <Pressable onPress={onPress} disabled={busy}
      style={({ hovered, pressed }: any) => [
        styles.topBtn, primary ? styles.topBtnPrimary : styles.topBtnGhost,
        hovered && !busy && (primary ? { backgroundColor: Brand.primaryDark } : { backgroundColor: Brand.bg }),
        pressed && { transform: [{ scale: 0.98 }] }, busy && { opacity: 0.7 },
      ]}>
      {icon}
      <Text style={[styles.topBtnText, { color: primary ? '#fff' : Brand.text }]}>{busy ? 'Working…' : title}</Text>
    </Pressable>
  );
}

const SIDEBAR_WIDTH = 272;

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: Brand.bg, height: '100%' as any },
  sidebar: { width: SIDEBAR_WIDTH, paddingHorizontal: 14, paddingTop: 20, paddingBottom: 14 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 8, marginBottom: 26 },
  brandTile: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center',
  },
  brandName: { fontSize: 17, fontFamily: Font.bold, color: '#fff', letterSpacing: -0.3 },
  brandSub: { fontSize: 12, fontFamily: Font.regular, color: 'rgba(255,255,255,0.6)', marginTop: 1 },

  navItem: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 40, paddingHorizontal: 12, borderRadius: 10, marginBottom: 2 },
  navLabel: { fontSize: 14, fontFamily: Font.medium, color: 'rgba(255,255,255,0.78)' },
  itemActive: { backgroundColor: 'rgba(255,255,255,0.14)' },
  hover: { backgroundColor: 'rgba(255,255,255,0.07)' },

  reportBlock: { marginTop: 22, paddingTop: 18, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  groupLabel: {
    fontSize: 10.5, fontFamily: Font.bold, color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase', letterSpacing: 0.9, paddingHorizontal: 12, marginBottom: 6,
  },
  reportCard: {
    flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  reportCardActive: { backgroundColor: 'rgba(255,255,255,0.16)', borderColor: 'rgba(255,255,255,0.2)' },
  reportTitle: { fontSize: 14, fontFamily: Font.semibold, color: '#fff' },
  reportSub: { fontSize: 12, fontFamily: Font.regular, color: 'rgba(255,255,255,0.6)', marginTop: 1 },

  sectionItem: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 34, paddingHorizontal: 12, borderRadius: 9 },
  sectionDot: { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  sectionAbbr: { fontSize: 9, fontFamily: Font.bold, color: '#fff' },
  sectionLabel: { flex: 1, fontSize: 13, fontFamily: Font.medium, color: 'rgba(255,255,255,0.75)' },
  doneDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#9FD8B5', alignItems: 'center', justifyContent: 'center' },

  userRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 14, paddingHorizontal: 6,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)',
  },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: Brand.primaryMid, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontFamily: Font.bold, color: '#fff' },
  userName: { fontSize: 13, fontFamily: Font.semibold, color: '#fff' },
  userEmail: { fontSize: 11.5, fontFamily: Font.regular, color: 'rgba(255,255,255,0.55)' },
  signOut: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },

  main: { flex: 1, minWidth: 0 },
  topBar: {
    height: 72, flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 32,
    backgroundColor: Brand.surface, borderBottomWidth: 1, borderBottomColor: Brand.borderLight,
  },
  crumb: { fontSize: 12, fontFamily: Font.medium, color: Brand.textMuted, marginBottom: 2 },
  title: { fontSize: 20, fontFamily: Font.bold, color: Brand.text, letterSpacing: -0.4 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  content: { flex: 1, minHeight: 0 },

  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Brand.border, borderRadius: 10, padding: 3 },
  stepBtn: { width: 30, height: 30, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  stepHover: { backgroundColor: Brand.bg },
  stepText: { fontSize: 12, fontFamily: Font.medium, color: Brand.textSub, minWidth: 52, textAlign: 'center', fontVariant: ['tabular-nums'] },

  topBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, paddingHorizontal: 16, borderRadius: 10 },
  topBtnPrimary: { backgroundColor: Brand.primary, shadowColor: Brand.primary, shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  topBtnGhost: { backgroundColor: Brand.surface, borderWidth: 1, borderColor: Brand.border },
  topBtnText: { fontSize: 14, fontFamily: Font.semibold },
});
