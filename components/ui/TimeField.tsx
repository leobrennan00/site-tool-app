import React, { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, Platform, StyleProp, ViewStyle } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brand, Font } from '@/constants/theme';
import { parseHHMM, formatHHMM } from '@/lib/percolation';

interface TimeFieldProps {
  value: string;
  onChange: (hhmm: string) => void;
  /** Box style — screens pass their existing `styles.input` so the field looks the same as before. */
  style?: StyleProp<ViewStyle>;
}

function toDate(hhmm: string): Date {
  const d = new Date();
  const mins = parseHHMM(hhmm);
  if (mins != null) d.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
  else d.setSeconds(0, 0);
  return d;
}

/**
 * 24-hour time input for percolation readings. Replaces free-text "HH:mm"
 * boxes so a time can't be mistyped (e.g. "10.30" or "1030"), which used to
 * make a whole hole silently drop out of the average. Values are still
 * stored as "HH:mm" strings, so saved reports and the stopwatch are
 * unaffected. A legacy value that isn't a valid time is shown as typed,
 * outlined amber, until it is re-picked or cleared.
 */
export function TimeField({ value, onChange, style }: TimeFieldProps) {
  const insets = useSafeAreaInsets();
  const [iosOpen, setIosOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(() => toDate(value));
  const trimmed = (value || '').trim();
  const invalid = !!trimmed && parseHHMM(trimmed) == null;

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: toDate(trimmed),
        mode: 'time',
        is24Hour: true,
        onChange: (event, date) => {
          if (event.type === 'set' && date) onChange(formatHHMM(date));
        },
      });
    } else {
      setDraft(toDate(trimmed));
      setIosOpen(true);
    }
  };

  return (
    <>
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={trimmed ? `Time ${trimmed}, tap to change` : 'Set time'}
        style={[style, styles.box, invalid && styles.invalid]}
      >
        <Text style={[styles.value, !trimmed && styles.placeholder]}>{trimmed || '--:--'}</Text>
        {!!trimmed && (
          <Pressable onPress={() => onChange('')} hitSlop={12} accessibilityLabel="Clear time" style={styles.clear}>
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
                onPress={() => { onChange(formatHHMM(draft)); setIosOpen(false); }}
                hitSlop={8}
                style={styles.sheetBtn}
              >
                <Text style={[styles.sheetBtnText, styles.sheetDone]}>Done</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={draft}
              mode="time"
              display="spinner"
              locale="en_GB"
              is24Hour
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
