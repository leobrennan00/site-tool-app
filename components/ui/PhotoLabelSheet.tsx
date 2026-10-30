import React from 'react';
import { View, Text, Image, Pressable, Modal, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brand, Font } from '@/constants/theme';
import { PHOTO_LABELS, PhotoLabel, isSingleSlot } from '@/lib/photoLabels';
import { useIsDesktop } from '@/hooks/useLayout';

interface Props {
  visible: boolean;
  /** Local file of the photo being labelled. */
  uri: string | null;
  /** Labels already given to other photos of this report (shown as "already used"). */
  usedLabels: string[];
  /** Current label when re-tagging. */
  current?: string | null;
  /** e.g. "Photo 2 of 5" while labelling several in a row. */
  progress?: string;
  onPick: (label: PhotoLabel) => void;
  /** Close without choosing: a new photo is kept as "Other", a re-tag is left unchanged. */
  onClose: () => void;
}

/**
 * "What is this photo?" The report lays photos out by this answer, so it is
 * asked as soon as a photo is added and can be changed later from the photo's
 * card. Every choice is one tap (44 pt rows).
 */
export function PhotoLabelSheet({ visible, uri, usedLabels, current, progress, onPick, onClose }: Props) {
  const insets = useSafeAreaInsets();
  // On the desktop layout it's a centred dialog: photo on the left, choices on the right.
  const desktop = useIsDesktop();
  return (
    <Modal visible={visible} transparent animationType={desktop ? 'fade' : 'slide'} onRequestClose={onClose}>
      <Pressable style={[styles.scrim, desktop && StyleSheet.absoluteFill]} onPress={onClose} />
      {desktop ? <View style={styles.center} pointerEvents="box-none">
        <View style={styles.dialog}>
          <View style={styles.dialogPhoto}>
            {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
          </View>
          <View style={styles.dialogSide}>
            <View style={styles.head}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>What is this photo?</Text>
                {!!progress && <Text style={styles.progress}>{progress}</Text>}
              </View>
              <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn} accessibilityLabel="Skip">
                <Text style={styles.closeText}>{current ? 'Cancel' : 'Skip'}</Text>
              </Pressable>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.list}>
              {PHOTO_LABELS.map((label) => {
                const used = isSingleSlot(label) && usedLabels.includes(label) && label !== current;
                const selected = label === current;
                return (
                  <Pressable
                    key={label}
                    onPress={() => onPick(label)}
                    accessibilityRole="button"
                    style={({ hovered }: any) => [styles.row, styles.rowCompact, hovered && styles.rowHover, selected && styles.rowSelected]}
                  >
                    <Text style={[styles.rowText, selected && styles.rowTextSelected]}>{label}</Text>
                    {used ? <Text style={styles.used}>in use · moves here</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </View> : null}
      {!desktop && <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>What is this photo?</Text>
            {!!progress && <Text style={styles.progress}>{progress}</Text>}
          </View>
          <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn} accessibilityLabel="Skip">
            <Text style={styles.closeText}>{current ? 'Cancel' : 'Skip'}</Text>
          </Pressable>
        </View>
        {uri ? <Image source={{ uri }} style={styles.preview} resizeMode="cover" /> : null}
        <ScrollView style={{ maxHeight: 330 }} contentContainerStyle={styles.list}>
          {PHOTO_LABELS.map((label) => {
            const used = isSingleSlot(label) && usedLabels.includes(label) && label !== current;
            const selected = label === current;
            return (
              <Pressable
                key={label}
                onPress={() => onPick(label)}
                accessibilityRole="button"
                style={[styles.row, selected && styles.rowSelected]}
              >
                <Text style={[styles.rowText, selected && styles.rowTextSelected]}>{label}</Text>
                {used ? <Text style={styles.used}>in use · moves here</Text> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>}
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: Brand.overlay },
  sheet: { backgroundColor: Brand.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16, paddingTop: 12 },
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 18, fontFamily: Font.bold, color: Brand.text },
  progress: { fontSize: 12, fontFamily: Font.regular, color: Brand.textMuted, marginTop: 2 },
  closeBtn: { minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'flex-end' },
  closeText: { fontSize: 15, fontFamily: Font.semibold, color: Brand.textSub },
  preview: { width: '100%', height: 150, borderRadius: 12, marginBottom: 10, backgroundColor: Brand.bg },
  list: { gap: 6, paddingBottom: 6 },
  row: {
    minHeight: 44, borderRadius: 12, borderWidth: 1.5, borderColor: Brand.border, backgroundColor: Brand.bg,
    paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  rowSelected: { borderColor: Brand.primary, backgroundColor: Brand.primaryTint },
  rowText: { fontSize: 15, fontFamily: Font.medium, color: Brand.text },
  rowTextSelected: { color: Brand.primaryDark, fontFamily: Font.semibold },
  used: { fontSize: 12, fontFamily: Font.regular, color: Brand.amber },

  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: 32 },
  dialog: {
    flexDirection: 'row', width: '100%', maxWidth: 880, height: 560, maxHeight: '100%',
    backgroundColor: Brand.surface, borderRadius: 20, overflow: 'hidden',
    shadowColor: '#0B1F14', shadowOpacity: 0.25, shadowRadius: 40, shadowOffset: { width: 0, height: 16 },
  },
  dialogPhoto: { flex: 1.15, backgroundColor: Brand.text },
  dialogSide: { flex: 1, padding: 20 },
  rowCompact: { minHeight: 40 },
  rowHover: { borderColor: Brand.primaryMid },
});
