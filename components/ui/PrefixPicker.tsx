import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Brand, Font } from '@/constants/theme';
import { PREFIXES, normalizePrefix } from '@/lib/names';

const OPTIONS: { label: string; value: string }[] = [{ label: 'None', value: '' }, ...PREFIXES.map((p) => ({ label: p, value: p }))];

/**
 * Prefix as a fixed choice (None / Mr / Ms / Mrs / Dr) instead of free text,
 * so a name can't end up in it and print twice on the cover. A legacy
 * saved value that isn't a title shows as None, with a note.
 */
export function PrefixPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const selected = normalizePrefix(value);
  const legacy = value.trim() && !selected ? value.trim() : '';
  return (
    <View>
      <Text style={styles.label}>Prefix</Text>
      <View style={styles.row}>
        {OPTIONS.map((o) => {
          const active = selected === o.value && !(o.value === '' && legacy);
          return (
            <Pressable
              key={o.label}
              onPress={() => onChange(o.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              style={[styles.chip, active && styles.chipSelected]}
            >
              <Text style={[styles.chipText, active && styles.chipTextSelected]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {!!legacy && (
        <Text style={styles.warn}>Saved prefix “{legacy}” is not a title and will be left off the report. Choose one above.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontFamily: Font.bold, color: Brand.textSub, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 40, minWidth: 52, paddingHorizontal: 14, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Brand.border, backgroundColor: Brand.bg,
  },
  chipSelected: { borderColor: Brand.primary, backgroundColor: Brand.primaryTint },
  chipText: { fontSize: 14, color: Brand.text, fontFamily: Font.medium },
  chipTextSelected: { color: Brand.primaryDark, fontFamily: Font.semibold },
  warn: { fontSize: 12, fontFamily: Font.semibold, color: Brand.amber, marginTop: 8 },
});
