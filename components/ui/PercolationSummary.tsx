import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Brand, Font } from '@/constants/theme';
import { HoleStatus, OverallResult, fmt2 } from '@/lib/percolation';

/**
 * Per-hole check under a percolation hole: the working ("how this number
 * was calculated") when complete, or what's missing when it isn't, so an
 * incomplete hole is never silently left out of the average.
 */
export function HoleCheck({ result }: { result: { status: HoleStatus; issues: string[]; formula: string | null } }) {
  if (result.status === 'empty') return null;
  if (result.status === 'incomplete') {
    return (
      <View style={styles.warnBox}>
        <Text style={styles.warnTitle}>Incomplete: this hole is left out of the average</Text>
        {result.issues.map((m) => <Text key={m} style={styles.warnText}>• {m}</Text>)}
      </View>
    );
  }
  return result.formula ? <Text style={styles.formula}>{result.formula}</Text> : null;
}

/** "Result of Test" card showing the value, how it was averaged, and any holes left out. */
export function OverallResultCard({ title, result }: { title: string; result: OverallResult }) {
  const incomplete = result.value != null && !result.complete;
  return (
    <View style={[styles.card, incomplete && styles.cardWarn]}>
      <Text style={styles.title}>
        {title}: {result.value != null ? fmt2(result.value) : '—'} (min/25 mm)
        {incomplete ? `  (INCOMPLETE: ${result.holesUsed} of ${result.holesTotal} holes)` : ''}
      </Text>
      {!!result.formula && <Text style={styles.formula}>{result.formula}</Text>}
      {result.warnings.map((w) => <Text key={w} style={styles.warnText}>• {w}</Text>)}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Brand.primaryTint, borderRadius: 16, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: Brand.primary,
  },
  cardWarn: { backgroundColor: Brand.amberTint, borderColor: Brand.amber },
  title: { fontSize: 15, fontFamily: Font.bold, color: Brand.primaryDark },
  formula: { fontSize: 13, fontFamily: Font.regular, color: Brand.textSub, marginTop: 6 },
  warnBox: { backgroundColor: Brand.amberTint, borderRadius: 10, padding: 10, marginTop: 8 },
  warnTitle: { fontSize: 13, fontFamily: Font.semibold, color: Brand.amber, marginBottom: 2 },
  warnText: { fontSize: 12, fontFamily: Font.regular, color: Brand.text, marginTop: 2 },
});
