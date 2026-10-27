import React from "react";
import { Stopwatch } from "@/components/ui/Stopwatch";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { Brand, Font, Shadow } from "@/constants/theme";
import { KeyboardAwareScrollView } from "@/components/ui/KeyboardAwareScrollView";
import { TimeField } from "@/components/ui/TimeField";
import { SuggestionNote } from "@/components/ui/SuggestionNote";
import { HoleCheck, OverallResultCard } from "@/components/ui/PercolationSummary";
import { standardHole, modifiedHole, t100Hole, overallResult } from "@/lib/percolation";

// Types
type SurfHole = {
  id: string;
  topDepth: string;
  baseDepth: string;
  holeDepth: string;
  dimensions: string;
  preSoak1Date: string;
  preSoak1Time: string;
  preSoak2Date: string;
  preSoak2Time: string;
  testDate: string;
  fillTime: string;
  waterLevelTime: string;
  t100?: number;
};

type SurfStdFill = { start: string; finish: string; deltaMin?: number };
type SurfStdHole = {
  id: string;
  fills: [SurfStdFill, SurfStdFill, SurfStdFill];
  avgDelta?: number;
  ts?: number;
};

type SurfModBand = {
  start: string;
  finish: string;
  tn?: number;
  kt?: number;
  tVal?: number;
};

type SurfModHole = {
  id: string;
  bands: [SurfModBand, SurfModBand, SurfModBand, SurfModBand];
  holeT?: number;
  comments?: string;
};

type SurfDateField = "preSoak1Date" | "preSoak2Date" | "testDate";

interface SurfacePercProps {
  // Step 1-3: Surface percolation test holes
  surfHoles: SurfHole[];
  setSurfField: (holeIdx: number, field: keyof SurfHole, value: string) => void;
  updateSurfDateField: (idx: number, field: SurfDateField, value: string) => void;

  // Step 4: Standard method
  surfStdHoles: SurfStdHole[];
  setSurfStdField: (holeIdx: number, fillIdx: number, field: "start" | "finish", value: string) => void;
  surfStdResult: number | null;
  surfStdComments: string;
  surfStdCommentsSuggestion?: string | null;
  setSurfStdComments: (val: string) => void;

  // Step 5: Modified method
  surfModHoles: SurfModHole[];
  setSurfModField: (holeIdx: number, bandIdx: number, field: "start" | "finish", value: string) => void;
  surfModResult: number | null;
  surfaceStep5Comments: string;
  setSurfaceStep5Comments: (val: string) => void;
  SURF_TF_FACTORS: readonly [number, number, number, number];
}

const SectionHeader = ({ title }: { title: string }) => (
  <View style={styles.section}>
    <Text style={styles.sectionText}>{title}</Text>
  </View>
);

export default function SurfacePercTab(props: SurfacePercProps) {
  const {
    surfHoles,
    setSurfField,
    updateSurfDateField,
    surfStdHoles,
    setSurfStdField,
    surfStdComments,
    surfStdCommentsSuggestion,
    setSurfStdComments,
    surfModHoles,
    setSurfModField,
    surfaceStep5Comments,
    setSurfaceStep5Comments,
    SURF_TF_FACTORS,
  } = props;

  return (
    <KeyboardAwareScrollView style={{ backgroundColor: Brand.bg }} contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Text style={styles.title}>Surface Percolation Test</Text>
        <Text style={styles.subtitle}>
          Percolation testing for soil (Steps 1-5)
        </Text>
      </View>

      <SectionHeader title="Steps 1-3: Preparation, Pre-soak & Measuring T₁₀₀" />

      {surfHoles.map((hole, hi) => (
        <View key={hole.id} style={styles.card}>
          <Text style={styles.cardTitle}>Percolation Test Hole {hole.id}</Text>

          {/* Step 1: Preparation */}
          <View style={styles.row}>
            <Text style={styles.label}>Depth to top (mm)</Text>
            <TextInput
              style={styles.input}
              value={hole.topDepth}
              onChangeText={(v) => setSurfField(hi, "topDepth", v)}
              keyboardType="numeric"
              placeholder="e.g. 0"
            />
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Depth to base (mm)</Text>
            <TextInput
              style={styles.input}
              value={hole.baseDepth}
              onChangeText={(v) => setSurfField(hi, "baseDepth", v)}
              keyboardType="numeric"
              placeholder="e.g. 300"
            />
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Hole depth (mm)</Text>
            <TextInput
              style={styles.input}
              value={hole.holeDepth}
              onChangeText={(v) => setSurfField(hi, "holeDepth", v)}
              keyboardType="numeric"
              placeholder="e.g. 300"
            />
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Dimensions (mm)</Text>
            <TextInput
              style={styles.input}
              value={hole.dimensions}
              onChangeText={(v) => setSurfField(hi, "dimensions", v)}
              placeholder="e.g. 300 × 300"
            />
          </View>

          {/* Step 2: Pre-soak */}
          <Text style={[styles.label, styles.stepHeader]}>Step 2: Pre-soak</Text>

          <View style={styles.dateRow}>
            <View style={styles.dateCol}>
              <Text style={styles.label}>Pre-soak 1 Date</Text>
              <TextInput
                style={styles.input}
                value={hole.preSoak1Date}
                onChangeText={(v) => updateSurfDateField(hi, "preSoak1Date", v)}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.dateCol}>
              <Text style={styles.label}>Pre-soak 1 Time</Text>
              <TimeField
                style={styles.input}
                value={hole.preSoak1Time}
                onChange={(v) => setSurfField(hi, "preSoak1Time", v)}
              />
            </View>
          </View>

          <View style={styles.dateRow}>
            <View style={styles.dateCol}>
              <Text style={styles.label}>Pre-soak 2 Date</Text>
              <TextInput
                style={styles.input}
                value={hole.preSoak2Date}
                onChangeText={(v) => updateSurfDateField(hi, "preSoak2Date", v)}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.dateCol}>
              <Text style={styles.label}>Pre-soak 2 Time</Text>
              <TimeField
                style={styles.input}
                value={hole.preSoak2Time}
                onChange={(v) => setSurfField(hi, "preSoak2Time", v)}
              />
            </View>
          </View>

          {/* Step 3: Measuring T100 */}
          <Text style={[styles.label, styles.stepHeader]}>Step 3: Measuring T₁₀₀</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Test Date</Text>
            <TextInput
              style={styles.input}
              value={hole.testDate}
              onChangeText={(v) => updateSurfDateField(hi, "testDate", v)}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.dateRow}>
            <View style={styles.dateCol}>
              <Text style={styles.label}>Time filled to 400 mm</Text>
              <TimeField
                style={styles.input}
                value={hole.fillTime}
                onChange={(v) => setSurfField(hi, "fillTime", v)}
              />
            </View>
            <View style={styles.dateCol}>
              <Text style={styles.label}>Time at 300 mm</Text>
              <TimeField
                style={styles.input}
                value={hole.waterLevelTime}
                onChange={(v) => setSurfField(hi, "waterLevelTime", v)}
              />
            </View>
          </View>

          <View style={styles.resultBox}>
            <Text style={styles.resultText}>
              T₁₀₀ (min): {typeof hole.t100 === "number" ? hole.t100 : "—"}
            </Text>
          </View>
          <HoleCheck result={t100Hole(hole.fillTime, hole.waterLevelTime)} />
        </View>
      ))}

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          If T₁₀₀ &gt; 300 → Surface Percolation value &gt; 90 (unsuitable).{"\n"}
          If T₁₀₀ ≤ 210 → use Standard Method (Step 4).{"\n"}
          If 210 &lt; T₁₀₀ ≤ 300 → use Modified Method (Step 5).
        </Text>
      </View>

      <SectionHeader title="Step 4: Standard Method (T₁₀₀ ≤ 210 min)" />
      <Text style={styles.note}>
        Fill to 300 mm and record time taken for water to fall to 200 mm
      </Text>

      {surfStdHoles.map((hole, hi) => (
        <View key={hole.id} style={styles.card}>
          <Text style={styles.cardTitle}>Percolation Test Hole {hole.id}</Text>

          {hole.fills.map((fill, fi) => (
            <View key={fi} style={styles.fillContainer}>
              <Text style={styles.fillLabel}>Fill {fi + 1}</Text>
              <View style={styles.dateRow}>
                <View style={styles.dateCol}>
                  <Text style={styles.label}>Start Time (at 300 mm)</Text>
                  <TimeField
                    style={styles.input}
                    value={fill.start}
                    onChange={(v) => setSurfStdField(hi, fi, "start", v)}
                  />
                </View>
                <View style={styles.dateCol}>
                  <Text style={styles.label}>Finish Time (at 200 mm)</Text>
                  <TimeField
                    style={styles.input}
                    value={fill.finish}
                    onChange={(v) => setSurfStdField(hi, fi, "finish", v)}
                  />
                </View>
              </View>
              <Stopwatch
                startValue={fill.start}
                finishValue={fill.finish}
                onStart={(hhmm) => setSurfStdField(hi, fi, "start", hhmm)}
                onStop={(hhmm) => setSurfStdField(hi, fi, "finish", hhmm)}
              />
              {typeof fill.deltaMin === "number" && (
                <Text style={styles.calcText}>Δt: {fill.deltaMin.toFixed(2)} min</Text>
              )}
            </View>
          ))}

          <View style={styles.resultBox}>
            <Text style={styles.calcText}>
              Average Δt: {typeof hole.avgDelta === "number" ? hole.avgDelta.toFixed(2) : "—"} min
            </Text>
            <Text style={styles.calcText}>
              Average Δt / 4 (tₛ): {typeof hole.ts === "number" ? hole.ts.toFixed(2) : "—"} min/25 mm
            </Text>
          </View>
          <HoleCheck result={standardHole(hole.fills)} />
        </View>
      ))}

      <OverallResultCard
        title="Result of Test — Surface Percolation Value"
        result={overallResult(surfStdHoles.map((h) => standardHole(h.fills)))}
      />

      <View style={styles.card}>
        <Text style={styles.label}>Step 4 Comments</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          value={surfStdComments}
          onChangeText={setSurfStdComments}
          placeholder="Enter comments for Step 4 (Standard method)..."
          textAlignVertical="top"
        />
        <SuggestionNote value={surfStdComments} suggestion={surfStdCommentsSuggestion ?? null} onUse={setSurfStdComments} />
      </View>

      <SectionHeader title="Step 5: Modified Method (210 < T₁₀₀ ≤ 300 min)" />
      <Text style={styles.note}>
        Measure time for water to fall through each 50 mm band
      </Text>

      {surfModHoles.map((hole, hi) => (
        <View key={hole.id} style={styles.card}>
          <Text style={styles.cardTitle}>Percolation Test Hole {hole.id}</Text>

          {hole.bands.map((band, bi) => (
            <View key={bi} style={styles.bandContainer}>
              <Text style={styles.bandLabel}>
                Fall of water (mm):{" "}
                {bi === 0 ? "300→250" : bi === 1 ? "250→200" : bi === 2 ? "200→150" : "150→100"}
                {" "} (T_f = {SURF_TF_FACTORS[bi]})
              </Text>

              <View style={styles.dateRow}>
                <View style={styles.dateCol}>
                  <Text style={styles.label}>Start (hh:mm)</Text>
                  <TimeField
                    style={styles.input}
                    value={band.start}
                    onChange={(v) => setSurfModField(hi, bi, "start", v)}
                  />
                </View>
                <View style={styles.dateCol}>
                  <Text style={styles.label}>Finish (hh:mm)</Text>
                  <TimeField
                    style={styles.input}
                    value={band.finish}
                    onChange={(v) => setSurfModField(hi, bi, "finish", v)}
                  />
                </View>
              </View>
              <Stopwatch
                startValue={band.start}
                finishValue={band.finish}
                onStart={(hhmm) => setSurfModField(hi, bi, "start", hhmm)}
                onStop={(hhmm) => setSurfModField(hi, bi, "finish", hhmm)}
              />

              <View style={styles.calcBox}>
                <Text style={styles.calcText}>
                  Time of fall Tₘ: {typeof band.tn === "number" ? band.tn.toFixed(2) : "—"} min
                </Text>
                <Text style={styles.calcText}>
                  K = T_f / Tₘ: {typeof band.kt === "number" ? band.kt.toFixed(3) : "—"}
                </Text>
                <Text style={styles.calcText}>
                  T-Value (band) = 4.45 / K: {typeof band.tVal === "number" ? band.tVal.toFixed(2) : "—"}
                </Text>
              </View>
            </View>
          ))}

          <View style={styles.resultBox}>
            <Text style={styles.resultText}>
              T-Value (Hole {hole.id}): {typeof hole.holeT === "number" ? hole.holeT.toFixed(2) : "—"} (min/25 mm)
            </Text>
          </View>
          <HoleCheck result={modifiedHole(hole.bands)} />

          <View style={styles.row}>
            <Text style={styles.label}>Comments</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={hole.comments || ""}
              onChangeText={(v) => {
                const copy = JSON.parse(JSON.stringify(surfModHoles)) as SurfModHole[];
                copy[hi].comments = v;
                // Note: This would need a setSurfModHoles prop to be fully functional
              }}
              multiline
              placeholder="Notes for this test hole…"
              textAlignVertical="top"
            />
          </View>
        </View>
      ))}

      <OverallResultCard
        title="Result of Test — Surface Percolation Value"
        result={overallResult(surfModHoles.map((h) => modifiedHole(h.bands)))}
      />

      <View style={styles.card}>
        <Text style={styles.label}>Step 5 Comments</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          value={surfaceStep5Comments}
          onChangeText={setSurfaceStep5Comments}
          placeholder="Enter comments for Step 5 (Modified method)..."
          textAlignVertical="top"
        />
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 18,
  },
  title: {
    fontSize: 20,
    fontFamily: Font.bold,
    color: Brand.text,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: Brand.textSub,
    lineHeight: 20,
    fontFamily: Font.regular,
  },
  section: {
    backgroundColor: Brand.primaryTint,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginVertical: 16,
    borderRadius: 10,
  },
  sectionText: {
    fontSize: 15,
    fontFamily: Font.semibold,
    color: Brand.primaryDark,
  },
  card: {
    backgroundColor: Brand.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Brand.borderLight,
    ...Shadow.card,
  },
  cardTitle: {
    fontSize: 11,
    fontFamily: Font.bold,
    color: Brand.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  row: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontFamily: Font.bold,
    color: Brand.textSub,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  stepHeader: {
    fontSize: 14,
    fontFamily: Font.semibold,
    color: Brand.primaryDark,
    marginTop: 12,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Brand.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: Font.regular,
    color: Brand.text,
    backgroundColor: Brand.bg,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  dateRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  dateCol: {
    flex: 1,
  },
  note: {
    fontSize: 12,
    color: Brand.textMuted,
    marginBottom: 12,
    marginTop: -4,
    fontFamily: Font.regular,
  },
  infoCard: {
    backgroundColor: Brand.amberTint,
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Brand.amber,
  },
  infoText: {
    fontSize: 14,
    color: "#8A5A00",
    lineHeight: 20,
    fontFamily: Font.regular,
  },
  resultBox: {
    backgroundColor: Brand.primaryTint,
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  resultText: {
    fontSize: 15,
    fontFamily: Font.semibold,
    color: Brand.primaryDark,
  },
  resultCard: {
    backgroundColor: Brand.primaryTint,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Brand.primary,
  },
  resultTitle: {
    fontSize: 15,
    fontFamily: Font.bold,
    color: Brand.primaryDark,
  },
  fillContainer: {
    backgroundColor: Brand.surface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Brand.borderLight,
  },
  fillLabel: {
    fontSize: 15,
    fontFamily: Font.semibold,
    color: Brand.text,
    marginBottom: 8,
  },
  calcText: {
    fontSize: 14,
    color: Brand.primary,
    marginTop: 4,
    fontFamily: Font.regular,
  },
  bandContainer: {
    backgroundColor: Brand.surface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Brand.borderLight,
  },
  bandLabel: {
    fontSize: 14,
    fontFamily: Font.semibold,
    color: Brand.text,
    marginBottom: 8,
  },
  calcBox: {
    backgroundColor: Brand.bg,
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
});
