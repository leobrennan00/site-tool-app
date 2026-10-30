import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Brand, Font, Shadow, SectionMeta } from '@/constants/theme';
import { ProgressRing, StatusPill, SectionIcon, PrimaryBtn, GradientHero } from './kit';
import { IcoChevronRight, IcoCheck } from './icons';

export type SectionId =
  | 'photos' | 'clientInfo' | 'deskStudy' | 'visualAssessment'
  | 'trialHole' | 'subsurfacePerc' | 'surfacePerc'
  | 'conclusion' | 'selectedDwwts' | 'treatmentSystems' | 'qualityAssurance'
  | 'siteAssessor';

/** Section id used to open the combined Location/Maps/Photos screen. */
export const ALL_SECTIONS: SectionId[] = [
  'photos', 'clientInfo', 'deskStudy', 'visualAssessment',
  'trialHole', 'subsurfacePerc', 'surfacePerc',
  'conclusion', 'selectedDwwts', 'treatmentSystems', 'qualityAssurance',
  'siteAssessor',
];

export const SECTION_GROUPS: { title: string; ids: SectionId[] }[] = [
  { title: 'Setup', ids: ['photos'] },
  { title: 'Site Data', ids: ['clientInfo', 'deskStudy', 'visualAssessment'] },
  { title: 'Site Investigation', ids: ['trialHole', 'subsurfacePerc', 'surfacePerc'] },
  { title: 'Assessment', ids: ['conclusion', 'selectedDwwts', 'treatmentSystems', 'qualityAssurance'] },
  { title: 'Sign-Off', ids: ['siteAssessor'] },
];

export function ReportOverview({
  siteName, location, clientName, fileRef, status,
  sectionsComplete, onOpenSection, onGenerate, generating,
}: {
  siteName: string;
  location: string;
  clientName: string;
  fileRef: string;
  status: 'draft' | 'completed';
  sectionsComplete: Record<string, boolean>;
  onOpenSection: (id: SectionId) => void;
  onGenerate: () => void;
  generating: boolean;
}) {
  const total = ALL_SECTIONS.length;
  const done = ALL_SECTIONS.filter((id) => sectionsComplete[id]).length;
  const percent = total ? (done / total) * 100 : 0;

  return (
    <View style={{ flex: 1, backgroundColor: Brand.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        {/* Green hero */}
        <GradientHero style={styles.hero}>
          <ProgressRing size={80} stroke={6} percent={percent} variant="white" />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text numberOfLines={1} style={styles.heroTitle}>{siteName || 'Untitled Report'}</Text>
            {location ? <Text numberOfLines={1} style={styles.heroLoc}>{location}</Text> : null}
            <View style={styles.heroMetaRow}>
              <StatusPill status={status} />
              <Text style={styles.heroCount}>{done}/{total} sections done</Text>
            </View>
          </View>
        </GradientHero>

        {/* Meta bar */}
        <View style={styles.metaBar}>
          <Text style={styles.metaRef}>
            <Text style={{ color: Brand.textMuted }}>Ref </Text>
            <Text style={{ fontFamily: Font.semibold, color: Brand.text }}>{fileRef || '—'}</Text>
          </Text>
          {clientName ? <Text style={styles.metaClient}>{clientName}</Text> : null}
        </View>

        {/* Grouped sections */}
        <View style={{ padding: 16 }}>
          {SECTION_GROUPS.map((group) => (
            <View key={group.title} style={{ marginBottom: 18 }}>
              <Text style={styles.groupLabel}>{group.title}</Text>
              <View style={styles.groupCard}>
                {group.ids.map((id, idx) => {
                  const complete = !!sectionsComplete[id];
                  const meta = SectionMeta[id];
                  return (
                    <Pressable
                      key={id}
                      onPress={() => onOpenSection(id)}
                      style={[styles.row, idx < group.ids.length - 1 && styles.rowDivider]}
                    >
                      <SectionIcon sectionId={id} size={40} />
                      <Text style={styles.rowLabel}>{meta?.label || id}</Text>
                      {complete ? (
                        <View style={styles.checkCircle}>
                          <IcoCheck size={14} color="#fff" />
                        </View>
                      ) : (
                        <IcoChevronRight size={20} color={Brand.textMuted} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Sticky generate button */}
      <View style={styles.stickyWrap}>
        <PrimaryBtn
          title={generating ? 'Generating…' : 'Generate PDF Report'}
          onPress={onGenerate}
          disabled={generating}
          loading={generating}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 22, paddingBottom: 24,
  },
  heroTitle: { fontSize: 20, fontFamily: Font.bold, color: '#fff', letterSpacing: -0.3 },
  heroLoc: { fontSize: 13, fontFamily: Font.regular, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  heroCount: { fontSize: 12, fontFamily: Font.medium, color: 'rgba(255,255,255,0.85)' },

  metaBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Brand.surface, paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Brand.borderLight,
  },
  metaRef: { fontSize: 13, fontFamily: Font.regular },
  metaClient: { fontSize: 13, fontFamily: Font.medium, color: Brand.textSub },

  groupLabel: {
    fontSize: 11, fontFamily: Font.bold, color: Brand.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginLeft: 2,
  },
  groupCard: {
    backgroundColor: Brand.surface, borderRadius: 16, borderWidth: 1, borderColor: Brand.borderLight,
    overflow: 'hidden', ...Shadow.card,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: Brand.borderLight },
  rowLabel: { flex: 1, fontSize: 15, fontFamily: Font.medium, color: Brand.text },
  checkCircle: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: Brand.primary,
    alignItems: 'center', justifyContent: 'center',
  },

  stickyWrap: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16,
    backgroundColor: Brand.bg, borderTopWidth: 1, borderTopColor: Brand.borderLight,
  },
});
