import React, { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, Platform, StyleProp, ViewStyle } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brand, Font } from '@/constants/theme';
import { parseDMY, formatDMY, displayDMY } from '@/lib/dates';

interface DateFieldProps {
  value: string;
  onChange: (dmy: string) => void;
  /** Box style — screens pass their existing `styles.input` so the field looks the same as before. */
  style?: StyleProp<ViewStyle>;
}

/**
 * Day-first date input. Picks from a day / month / year wheel and stores
 * "DD/MM/YYYY". Dates saved year-first by older builds are shown day-first;
 * a legacy value that isn't a date is shown as typed, outlined amber, until
 * it is re-picked or cleared.
 */
export function DateField({ value, onChange, style }: DateFieldProps) {
  const insets = useSafeAreaInsets();
  const [iosOpen, setIosOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(() => parseDMY(value) ?? new Date());
  const trimmed = (value || '').trim();
  const invalid = !!trimmed && parseDMY(trimmed) == null;
  const shown = displayDMY(trimmed);

  const open = () => {
    const start = parseDMY(trimmed) ?? new Date();
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: start,
        mode: 'date',
        onChange: (event, date) => {
          if (event.type === 'set' && date) onChange(formatDMY(date));
        },
      });
    } else {
      setDraft(start);
      setIosOpen(true);
    }
  };

  return (
    <>
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={trimmed ? `Date ${shown}, tap to change` : 'Set date'}
        style={[style, styles.box, invalid && styles.invalid]}
      >
        <Text style={[styles.value, !trimmed && styles.placeholder]}>{shown || 'DD/MM/YYYY'}</Text>
        {!!trimmed && (
          <Pressable onPress={() => onChange('')} hitSlop={12} accessibilityLabel="Clear date" style={styles.clear}>
            <Text style={styles.clearText}>×</Text>
          </Pressable>
        )}
      </Pressable>

      {Platform.OS === 'ios' && (
        <Modal visible={iosOpen} transparent animationType="slide" onRequestClose={() => setIosOpen(false)}>
          <Pressable style={styles.scrim} onPress={() => setIosOpen(false)} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}>
            <View style={styles.sheetBar}>
              <Pressable onPress={() => setIosOpen(false)} hitSlop={8} style={styles.sheetBtn}>
                <Text style={styles.sheetBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => { onChange(formatDMY(draft)); setIosOpen(false); }}
                hitSlop={8}
                style={styles.sheetBtn}
              >
                <Text style={[styles.sheetBtnText, styles.sheetDone]}>Done</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={draft}
              mode="date"
              display="spinner"
              locale="en_IE"
              themeVariant="light"
              onChange={(_e, d) => { if (d) setDraft(d); }}
            />
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  invalid: { borderColor: Brand.amber },
  value: { fontSize: 15, fontFamily: Font.regular, color: Brand.text, fontVariant: ['tabular-nums'] },
  placeholder: { color: Brand.textMuted },
  clear: { paddingLeft: 8 },
  clearText: { fontSize: 18, lineHeight: 20, color: Brand.textMuted, fontFamily: Font.semibold },
  scrim: { flex: 1, backgroundColor: Brand.overlay },
  sheet: { backgroundColor: Brand.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  sheetBar: {
    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8,
    borderBottomWidth: 1, borderBottomColor: Brand.borderLight,
  },
  sheetBtn: { minHeight: 44, minWidth: 44, paddingHorizontal: 12, justifyContent: 'center' },
  sheetBtnText: { fontSize: 16, fontFamily: Font.medium, color: Brand.textSub },
  sheetDone: { color: Brand.primary, fontFamily: Font.bold },
});
