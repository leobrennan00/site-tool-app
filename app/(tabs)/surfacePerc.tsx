import React from "react";
import { ScrollView, View, Text, TextInput, StyleSheet } from "react-native";

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
    surfStdResult,
    surfStdComments,
    setSurfStdComments,
    surfModHoles,
    setSurfModField,
    surfModResult,
    surfaceStep5Comments,
    setSurfaceStep5Comments,
    SURF_TF_FACTORS,
  } = props;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
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
              <TextInput
                style={styles.input}
                value={hole.preSoak1Time}
                onChangeText={(v) => setSurfField(hi, "preSoak1Time", v)}
                placeholder="HH:mm"
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
              <TextInput
                style={styles.input}
                value={hole.preSoak2Time}
                onChangeText={(v) => setSurfField(hi, "preSoak2Time", v)}
                placeholder="HH:mm"
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
              <TextInput
                style={styles.input}
                value={hole.fillTime}
                onChangeText={(v) => setSurfField(hi, "fillTime", v)}
                placeholder="HH:mm"
              />
            </View>
            <View style={styles.dateCol}>
              <Text style={styles.label}>Time at 300 mm</Text>
              <TextInput
                style={styles.input}
                value={hole.waterLevelTime}
                onChangeText={(v) => setSurfField(hi, "waterLevelTime", v)}
                placeholder="HH:mm"
              />
            </View>
          </View>

          <View style={styles.resultBox}>
            <Text style={styles.resultText}>
              T₁₀₀ (min): {typeof hole.t100 === "number" ? hole.t100.toFixed(2) : "—"}
            </Text>
          </View>
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
                  <TextInput
                    style={styles.input}
                    placeholder="HH:mm"
                    value={fill.start}
                    onChangeText={(v) => setSurfStdField(hi, fi, "start", v)}
                  />
                </View>
                <View style={styles.dateCol}>
                  <Text style={styles.label}>Finish Time (at 200 mm)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="HH:mm"
                    value={fill.finish}
                    onChangeText={(v) => setSurfStdField(hi, fi, "finish", v)}
                  />
                </View>
              </View>
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
        </View>
      ))}

      <View style={styles.resultCard}>
        <Text style={styles.resultTitle}>
          Result of Test — Surface Percolation Value: {surfStdResult !== null ? surfStdResult.toFixed(2) : "—"} (min/25 mm)
        </Text>
      </View>

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
                  <TextInput
                    style={styles.input}
                    value={band.start}
                    onChangeText={(v) => setSurfModField(hi, bi, "start", v)}
                    placeholder="HH:mm"
                  />
                </View>
                <View style={styles.dateCol}>
                  <Text style={styles.label}>Finish (hh:mm)</Text>
                  <TextInput
                    style={styles.input}
                    value={band.finish}
                    onChangeText={(v) => setSurfModField(hi, bi, "finish", v)}
                    placeholder="HH:mm"
                  />
                </View>
              </View>

              <View style={styles.calcBox}>
                <Text style={styles.calcText}>
                  Time of fall Tₙ: {typeof band.tn === "number" ? band.tn.toFixed(2) : "—"} min
                </Text>
                <Text style={styles.calcText}>
                  Kₜ = Tₙ / T_f: {typeof band.kt === "number" ? band.kt.toFixed(2) : "—"}
                </Text>
                <Text style={styles.calcText}>
                  T-Value (band) = 4.45 / Kₜ: {typeof band.tVal === "number" ? band.tVal.toFixed(2) : "—"}
                </Text>
              </View>
            </View>
          ))}

          <View style={styles.resultBox}>
            <Text style={styles.resultText}>
              T-Value (Hole {hole.id}): {typeof hole.holeT === "number" ? hole.holeT.toFixed(2) : "—"} (min/25 mm)
            </Text>
          </View>

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

      <View style={styles.resultCard}>
        <Text style={styles.resultTitle}>
          Result of Test — Surface Percolation Value: {surfModResult !== null ? surfModResult.toFixed(2) : "—"} (min/25 mm)
        </Text>
      </View>

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  section: {
    backgroundColor: "#E3F2FD",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 16,
    borderRadius: 6,
  },
  sectionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1565C0",
  },
  card: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 16,
  },
  row: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 6,
  },
  stepHeader: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1565C0",
    marginTop: 12,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#FFF",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  dateRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  dateCol: {
    flex: 1,
  },
  note: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 12,
    marginTop: -8,
  },
  infoCard: {
    backgroundColor: "#FFF3E0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFB74D",
  },
  infoText: {
    fontSize: 14,
    color: "#E65100",
    lineHeight: 20,
  },
  resultBox: {
    backgroundColor: "#E8F5E9",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  resultText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2E7D32",
  },
  resultCard: {
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1B5E20",
  },
  fillContainer: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  fillLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  calcText: {
    fontSize: 14,
    color: "#2E7D32",
    marginTop: 4,
  },
  bandContainer: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  bandLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  calcBox: {
    backgroundColor: "#F5F5F5",
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
});
