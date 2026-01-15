import React from "react";
import { ScrollView, View, Text, TextInput, StyleSheet } from "react-native";

// Types
type PercTestHole = {
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
  t100: string;
};

type StandardFill = { start: string; finish: string; deltaMin?: number };
type StandardHole = {
  id: string;
  fills: [StandardFill, StandardFill, StandardFill];
  avgDelta?: number;
  ts?: number;
};

type ModifiedBand = {
  start: string;
  finish: string;
  tn?: number;
  kt?: number;
  tVal?: number;
};

type ModifiedHole = {
  id: string;
  bands: [ModifiedBand, ModifiedBand, ModifiedBand, ModifiedBand];
  holeT?: number;
  comments?: string;
};

type PercDateField = "preSoak1Date" | "preSoak2Date" | "testDate";

interface SubsurfacePercProps {
  // Step 1-3: Percolation test holes
  percHoles: PercTestHole[];
  setPercHoles: (holes: PercTestHole[]) => void;
  updatePercDateField: (idx: number, field: PercDateField, value: string) => void;

  // Step 4: Standard method
  stdHoles: StandardHole[];
  setStdHoles: (holes: StandardHole[]) => void;
  setStdField: (holeIdx: number, fillIdx: number, field: "start" | "finish", value: string) => void;
  stdResult: number | null;
  step4Comments: string;
  setStep4Comments: (val: string) => void;

  // Step 5: Modified method
  modHoles: ModifiedHole[];
  setModHoles: (holes: ModifiedHole[]) => void;
  setModField: (holeIdx: number, bandIdx: number, field: "start" | "finish", value: string) => void;
  modResult: number | null;
  TF_FACTORS: readonly [number, number, number, number];
}

const SectionHeader = ({ title }: { title: string }) => (
  <View style={styles.section}>
    <Text style={styles.sectionText}>{title}</Text>
  </View>
);

export default function SubsurfacePercTab(props: SubsurfacePercProps) {
  const {
    percHoles,
    setPercHoles,
    updatePercDateField,
    stdHoles,
    setStdHoles,
    setStdField,
    stdResult,
    step4Comments,
    setStep4Comments,
    modHoles,
    setModHoles,
    setModField,
    modResult,
    TF_FACTORS,
  } = props;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Text style={styles.title}>Subsurface Percolation Test</Text>
        <Text style={styles.subtitle}>
          Percolation testing for subsoil (Steps 1-5)
        </Text>
      </View>

      <SectionHeader title="Steps 1-3: Preparation, Pre-soak & Measuring T₁₀₀" />

      {percHoles.map((hole, idx) => (
        <View key={hole.id} style={styles.card}>
          <Text style={styles.cardTitle}>Percolation Test Hole {hole.id}</Text>

          {/* Step 1: Preparation */}
          <View style={styles.row}>
            <Text style={styles.label}>Depth to top (mm)</Text>
            <TextInput
              style={styles.input}
              value={hole.topDepth}
              onChangeText={(v) => {
                const copy = [...percHoles];
                copy[idx].topDepth = v;
                setPercHoles(copy);
              }}
              keyboardType="numeric"
              placeholder="e.g. 250"
            />
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Depth to base (mm)</Text>
            <TextInput
              style={styles.input}
              value={hole.baseDepth}
              onChangeText={(v) => {
                const copy = [...percHoles];
                copy[idx].baseDepth = v;
                setPercHoles(copy);
              }}
              keyboardType="numeric"
              placeholder="e.g. 550"
            />
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Hole depth (mm)</Text>
            <TextInput
              style={styles.input}
              value={hole.holeDepth}
              onChangeText={(v) => {
                const copy = [...percHoles];
                copy[idx].holeDepth = v;
                setPercHoles(copy);
              }}
              keyboardType="numeric"
              placeholder="e.g. 300"
            />
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Dimensions (mm)</Text>
            <TextInput
              style={styles.input}
              value={hole.dimensions}
              onChangeText={(v) => {
                const copy = [...percHoles];
                copy[idx].dimensions = v;
                setPercHoles(copy);
              }}
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
                onChangeText={(v) => updatePercDateField(idx, "preSoak1Date", v)}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.dateCol}>
              <Text style={styles.label}>Pre-soak 1 Time</Text>
              <TextInput
                style={styles.input}
                value={hole.preSoak1Time}
                onChangeText={(v) => {
                  const copy = [...percHoles];
                  copy[idx].preSoak1Time = v;
                  setPercHoles(copy);
                }}
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
                onChangeText={(v) => updatePercDateField(idx, "preSoak2Date", v)}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.dateCol}>
              <Text style={styles.label}>Pre-soak 2 Time</Text>
              <TextInput
                style={styles.input}
                value={hole.preSoak2Time}
                onChangeText={(v) => {
                  const copy = [...percHoles];
                  copy[idx].preSoak2Time = v;
                  setPercHoles(copy);
                }}
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
              onChangeText={(v) => updatePercDateField(idx, "testDate", v)}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.dateRow}>
            <View style={styles.dateCol}>
              <Text style={styles.label}>Time filled to 400 mm</Text>
              <TextInput
                style={styles.input}
                value={hole.fillTime}
                onChangeText={(v) => {
                  const copy = [...percHoles];
                  copy[idx].fillTime = v;
                  setPercHoles(copy);
                }}
                placeholder="HH:mm"
              />
            </View>
            <View style={styles.dateCol}>
              <Text style={styles.label}>Time at 300 mm</Text>
              <TextInput
                style={styles.input}
                value={hole.waterLevelTime}
                onChangeText={(v) => {
                  const copy = [...percHoles];
                  copy[idx].waterLevelTime = v;
                  setPercHoles(copy);
                }}
                placeholder="HH:mm"
              />
            </View>
          </View>

          <View style={styles.resultBox}>
            <Text style={styles.resultText}>
              T₁₀₀ (min): {hole.t100 && hole.t100.trim() !== "" ? hole.t100 : "—"}
            </Text>
          </View>
        </View>
      ))}

      <SectionHeader title="Step 4: Standard Method (T₁₀₀ ≤ 210 min)" />
      <Text style={styles.note}>
        Fill to 300 mm and record time taken for water to fall to 200 mm
      </Text>

      {stdHoles.map((hole, hi) => (
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
                    onChangeText={(v) => setStdField(hi, fi, "start", v)}
                  />
                </View>
                <View style={styles.dateCol}>
                  <Text style={styles.label}>Finish Time (at 200 mm)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="HH:mm"
                    value={fill.finish}
                    onChangeText={(v) => setStdField(hi, fi, "finish", v)}
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
          Result of Test — Subsurface Percolation Value: {stdResult !== null ? stdResult.toFixed(2) : "—"} (min/25 mm)
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Step 4 Comments</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          value={step4Comments}
          onChangeText={setStep4Comments}
          placeholder="Enter comments for Step 4 (Standard method)..."
          textAlignVertical="top"
        />
      </View>

      <SectionHeader title="Step 5: Modified Method (T₁₀₀ > 210 min)" />
      <Text style={styles.note}>
        Measure time for water to fall through each 50 mm band
      </Text>

      {modHoles.map((hole, hi) => (
        <View key={hole.id} style={styles.card}>
          <Text style={styles.cardTitle}>Percolation Test Hole {hole.id}</Text>

          {hole.bands.map((band, bi) => (
            <View key={bi} style={styles.bandContainer}>
              <Text style={styles.bandLabel}>
                Fall of water (mm):{" "}
                {bi === 0 ? "300→250" : bi === 1 ? "250→200" : bi === 2 ? "200→150" : "150→100"}
                {" "} (T_f = {TF_FACTORS[bi]})
              </Text>

              <View style={styles.dateRow}>
                <View style={styles.dateCol}>
                  <Text style={styles.label}>Start (hh:mm)</Text>
                  <TextInput
                    style={styles.input}
                    value={band.start}
                    onChangeText={(v) => setModField(hi, bi, "start", v)}
                    placeholder="HH:mm"
                  />
                </View>
                <View style={styles.dateCol}>
                  <Text style={styles.label}>Finish (hh:mm)</Text>
                  <TextInput
                    style={styles.input}
                    value={band.finish}
                    onChangeText={(v) => setModField(hi, bi, "finish", v)}
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
                const copy = JSON.parse(JSON.stringify(modHoles)) as ModifiedHole[];
                copy[hi].comments = v;
                setModHoles(copy);
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
          Result of Test — Subsurface Percolation Value: {modResult !== null ? modResult.toFixed(2) : "—"} (min/25 mm)
        </Text>
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
