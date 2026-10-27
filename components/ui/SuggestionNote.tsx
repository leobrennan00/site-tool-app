import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Brand, Font } from '@/constants/theme';

/**
 * Line under a paragraph box that the app can pre-fill. While the box holds
 * the suggestion it says so; once the assessor has changed it, it offers to
 * put the suggested wording back (a single tap, so edits are never lost by
 * accident). Shows nothing when there is no suggestion yet.
 */
export function SuggestionNote({ value, suggestion, onUse, missing }: {
  value: string;
  suggestion: string | null;
  onUse: (text: string) => void;
  /** Shown when there is no suggestion, e.g. "Choose the system above to get suggested wording." */
  missing?: string;
}) {
  if (!suggestion) {
    return missing ? <Text style={styles.hint}>{missing}</Text> : null;
  }
  const inUse = value.trim() === suggestion.trim();
  return (
    <View style={styles.row}>
      <Text style={styles.hint}>
        {inUse ? 'Standard wording, filled in from this report. Edit freely.' : 'Edited. Your wording is kept.'}
      </Text>
      {!inUse && (
        <Pressable onPress={() => onUse(suggestion)} hitSlop={8} style={styles.btn} accessibilityRole="button">
          <Text style={styles.btnText}>Use standard wording</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  hint: { fontSize: 12, fontFamily: Font.regular, color: Brand.textMuted, marginTop: 6, flexShrink: 1 },
  btn: { minHeight: 44, justifyContent: 'center' },
  btnText: { fontSize: 13, fontFamily: Font.semibold, color: Brand.primary },
});
