import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Brand, Font, SectionMeta } from '@/constants/theme';
import { ProgressRing, StatusPill, SectionIcon, GradientHero } from '@/components/ui/kit';
import { IcoCheck, IcoChevronRight } from '@/components/ui/icons';
import { SECTION_GROUPS, ALL_SECTIONS, SectionId } from '@/components/ui/ReportOverview';

/** The report overview on the desktop layout: the phone's hub (progress,
 *  sections by group) laid out across the wider page, with the next
 *  unfinished section offered first. */
export function DesktopOverview({
  siteName, location, clientName, fileRef, status, sectionsComplete, onOpenSection,
}: {
  siteName: string;
  location: string;
  clientName: string;
  fileRef: string;
  status: 'draft' | 'completed';
  sectionsComplete: Record<string, boolean>;
  onOpenSection: (id: SectionId) => void;
}) {
  const done = ALL_SECTIONS.filter((id) => sectionsComplete[id]).length;
  const percent = (done / ALL_SECTIONS.length) * 100;
  const nextUp = ALL_SECTIONS.find((id) => !sectionsComplete[id]) ?? null;

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <GradientHero style={styles.hero}>
        <ProgressRing size={92} stroke={7} percent={percent} variant="white" />
        <View style={{ flex: 1, marginLeft: 24, minWidth: 0 }}>
          <Text numberOfLines={1} style={styles.heroTitle}>{siteName || 'Untitled Report'}</Text>
          {location ? <Text numberOfLines={1} style={styles.heroLoc}>{location}</Text> : null}
          <View style={styles.heroMeta}>
            <StatusPill status={status} />
            <Text style={styles.heroCount}>{done} of {ALL_SECTIONS.length} sections done</Text>
          </View>
        </View>
        <View style={styles.heroFacts}>
          <Fact label="File ref" value={fileRef || '—'} />
          <Fact label="Client" value={clientName || '—'} />
        </View>
      </GradientHero>

      {nextUp ? (
        <Pressable onPress={() => onOpenSection(nextUp)} style={({ hovered }: any) => [styles.next, hovered && styles.nextHover]}>
          <SectionIcon sectionId={nextUp} size={40} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.nextLabel}>{done ? 'Continue with' : 'Start with'}</Text>
            <Text style={styles.nextTitle}>{SectionMeta[nextUp]?.label}</Text>
          </View>
          <Text style={styles.nextCta}>Open</Text>
          <IcoChevronRight size={18} color={Brand.primary} />
        </Pressable>
      ) : null}

      <View style={styles.grid}>
        {SECTION_GROUPS.map((group) => (
          <View key={group.title} style={styles.groupCard}>
            <Text style={styles.groupLabel}>{group.title}</Text>
            {group.ids.map((id, i) => {
              const complete = !!sectionsComplete[id];
              return (
                <Pressable
                  key={id}
                  onPress={() => onOpenSection(id)}
                  style={({ hovered }: any) => [styles.row, i > 0 && styles.rowDivider, hovered && styles.rowHover]}
                >
                  <SectionIcon sectionId={id} size={34} />
                  <Text style={styles.rowLabel}>{SectionMeta[id]?.label || id}</Text>
                  {complete ? (
                    <View style={styles.check}><IcoCheck size={12} color="#fff" /></View>
                  ) : (
                    <Text style={styles.todo}>To do</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.factValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { width: '100%', maxWidth: 1080, alignSelf: 'center', padding: 32, paddingBottom: 80 },
  hero: { flexDirection: 'row', alignItems: 'center', borderRadius: 22, paddingVertical: 28, paddingHorizontal: 30 },
  heroTitle: { fontSize: 26, fontFamily: Font.bold, color: '#fff', letterSpacing: -0.6 },
  heroLoc: { fontSize: 14, fontFamily: Font.regular, color: 'rgba(255,255,255,0.72)', marginTop: 4 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  heroCount: { fontSize: 13, fontFamily: Font.medium, color: 'rgba(255,255,255,0.85)' },
  heroFacts: { gap: 10, marginLeft: 24, minWidth: 180 },
  fact: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14 },
  factLabel: { fontSize: 10.5, fontFamily: Font.bold, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.8 },
  factValue: { fontSize: 14, fontFamily: Font.semibold, color: '#fff', marginTop: 2 },

  next: {
    flexDirection: 'row', alignItems: 'center', marginTop: 20, padding: 16, borderRadius: 16,
    backgroundColor: Brand.primaryTint, borderWidth: 1, borderColor: '#CFE4D6',
  },
  nextHover: { backgroundColor: '#D9EBDF' },
  nextLabel: { fontSize: 12, fontFamily: Font.medium, color: Brand.textSub },
  nextTitle: { fontSize: 16, fontFamily: Font.bold, color: Brand.text, marginTop: 1 },
  nextCta: { fontSize: 14, fontFamily: Font.semibold, color: Brand.primary, marginRight: 4 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginTop: 24 },
  groupCard: {
    flexGrow: 1, flexBasis: 420, backgroundColor: Brand.surface, borderRadius: 18,
    borderWidth: 1, borderColor: Brand.borderLight, paddingTop: 16, paddingBottom: 6,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  groupLabel: {
    fontSize: 11, fontFamily: Font.bold, color: Brand.textMuted, textTransform: 'uppercase',
    letterSpacing: 0.8, paddingHorizontal: 18, marginBottom: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 18 },
  rowDivider: { borderTopWidth: 1, borderTopColor: Brand.borderLight },
  rowHover: { backgroundColor: Brand.bg },
  rowLabel: { flex: 1, fontSize: 15, fontFamily: Font.medium, color: Brand.text },
  check: { width: 22, height: 22, borderRadius: 11, backgroundColor: Brand.primary, alignItems: 'center', justifyContent: 'center' },
  todo: { fontSize: 12, fontFamily: Font.medium, color: Brand.textMuted },
});
