import React from "react";
import { ScrollView, View, Text, TextInput, StyleSheet, Platform, Pressable } from "react-native";
import { Brand, Font, Shadow } from "@/constants/theme";
import { KeyboardAwareScrollView } from "@/components/ui/KeyboardAwareScrollView";
import { TimeField } from "@/components/ui/TimeField";
import { SuggestionNote } from "@/components/ui/SuggestionNote";
import { SoilLayer, LAYER_TEXT_FIELDS, newLayer, layerErrors } from "@/lib/trialHole";

// Constants for soil horizons grid - matching the actual report format
// The text box has 50 lines, with depth markers from 0.1m to 3.5m (35 markers)
// Line 50 = 3.5m, so each 0.1m increment spans ~1.43 lines
const TH_LINE_HEIGHT = 16;
const TH_VISIBLE_LINES = 50;  // 50 lines in the text box
const TH_CONTENT_HEIGHT = TH_LINE_HEIGHT * TH_VISIBLE_LINES;
const TH_HEADER_HEIGHT = 28;

const DEPTH_STEPS = Array.from({ length: 35 }, (_, i) => `${((i + 1) / 10).toFixed(1)} m`);

const COL_WIDTHS = {
  classification: 168,  // increased by 22 total
  dilatancy: 133,       // reduced by 2 total (unchanged this round)
  structure: 111,       // reduced by 4 total
  compactness: 161,     // reduced by 4 total
  colour: 103,          // reduced by 2 total (unchanged this round)
  flowpaths: 169,       // reduced by 6 total
};

interface TrialHoleProps {
  trialDepth: string;
  setTrialDepth: (val: string) => void;
  depthBedrock: string;
  setDepthBedrock: (val: string) => void;
  depthWaterTable: string;
  setDepthWaterTable: (val: string) => void;
  depthIngress: string;
  setDepthIngress: (val: string) => void;
  rockType: string;
  setRockType: (val: string) => void;
  excavDate: string;
  setExcavDate: (val: string) => void;
  excavTime: string;
  setExcavTime: (val: string) => void;
  examDate: string;
  setExamDate: (val: string) => void;
  examTime: string;
  setExamTime: (val: string) => void;
  // Soil horizons columns
  thClassificationCol: string;
  setThClassificationCol: (val: string) => void;
  thDilatancyCol: string;
  setThDilatancyCol: (val: string) => void;
  thStructureCol: string;
  setThStructureCol: (val: string) => void;
  thCompactnessCol: string;
  setThCompactnessCol: (val: string) => void;
  thColourCol: string;
  setThColourCol: (val: string) => void;
  thFlowpathsCol: string;
  setThFlowpathsCol: (val: string) => void;
  // Structured soil layers (replace the free-text columns above for new logs)
  soilLayers: SoilLayer[];
  setSoilLayers: (layers: SoilLayer[]) => void;
  // Percolation estimates
  likelySubsurfaceP: string;
  setLikelySubsurfaceP: (val: string) => void;
  likelySurfaceP: string;
  setLikelySurfaceP: (val: string) => void;
  trialHoleEvaluation: string;
  trialHoleEvaluationSuggestion?: string | null;
  setTrialHoleEvaluation: (val: string) => void;
}

export default function TrialHoleTab(props: TrialHoleProps) {
  const {
    trialDepth, setTrialDepth,
    depthBedrock, setDepthBedrock,
    depthWaterTable, setDepthWaterTable,
    depthIngress, setDepthIngress,
    rockType, setRockType,
    excavDate, setExcavDate,
    excavTime, setExcavTime,
    examDate, setExamDate,
    examTime, setExamTime,
    thClassificationCol, setThClassificationCol,
    thDilatancyCol, setThDilatancyCol,
    thStructureCol, setThStructureCol,
    thCompactnessCol, setThCompactnessCol,
    thColourCol, setThColourCol,
    thFlowpathsCol, setThFlowpathsCol,
    soilLayers, setSoilLayers,
    likelySubsurfaceP, setLikelySubsurfaceP,
    likelySurfaceP, setLikelySurfaceP,
    trialHoleEvaluation, setTrialHoleEvaluation, trialHoleEvaluationSuggestion,
  } = props;

  // Helper function to limit text to 50 lines
  const limitTo50Lines = (text: string): string => {
    const lines = text.split('\n');
    if (lines.length > TH_VISIBLE_LINES) {
      return lines.slice(0, TH_VISIBLE_LINES).join('\n');
    }
    return text;
  };

  // Wrapper functions to enforce line limit
  const handleClassificationChange = (text: string) => setThClassificationCol(limitTo50Lines(text));
  const handleDilatancyChange = (text: string) => setThDilatancyCol(limitTo50Lines(text));
  const handleStructureChange = (text: string) => setThStructureCol(limitTo50Lines(text));
  const handleCompactnessChange = (text: string) => setThCompactnessCol(limitTo50Lines(text));
  const handleColourChange = (text: string) => setThColourCol(limitTo50Lines(text));
  const handleFlowpathsChange = (text: string) => setThFlowpathsCol(limitTo50Lines(text));

  // Older reports were logged as free text in six big columns; keep showing
  // those (read/edit) only when a report has them and no structured layers.
  const hasLegacyColumns = [thClassificationCol, thDilatancyCol, thStructureCol, thCompactnessCol, thColourCol, thFlowpathsCol]
    .some((t) => (t || "").trim() !== "");
  const showLegacyGrid = hasLegacyColumns && soilLayers.length === 0;
  const errors = layerErrors(soilLayers, trialDepth);

  const updateLayer = (id: string, key: keyof SoilLayer, value: string) =>
    setSoilLayers(soilLayers.map((l) => (l.id === id ? { ...l, [key]: value } : l)));
  const addLayer = () => {
    const last = soilLayers[soilLayers.length - 1];
    setSoilLayers([...soilLayers, newLayer(last ? last.to : "0.0")]);
  };
  const removeLayer = (id: string) => setSoilLayers(soilLayers.filter((l) => l.id !== id));

  return (
    <KeyboardAwareScrollView style={{ backgroundColor: Brand.bg }} contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Text style={styles.title}>Trial Hole Assessment</Text>
        <Text style={styles.subtitle}>
          Excavation details and soil horizon observations
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Trial Hole Basics</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Depth of Trial Hole (m)</Text>
          <TextInput
            style={styles.input}
            value={trialDepth}
            onChangeText={setTrialDepth}
            keyboardType="numeric"
            placeholder="e.g. 2.1"
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Depth to Bedrock (m)</Text>
          <TextInput
            style={styles.input}
            value={depthBedrock}
            onChangeText={setDepthBedrock}
            keyboardType="numeric"
            placeholder="e.g. 0.7 or None"
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Depth to Water Table (m)</Text>
          <TextInput
            style={styles.input}
            value={depthWaterTable}
            onChangeText={setDepthWaterTable}
            placeholder="e.g. None"
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Depth of Water Ingress (m)</Text>
          <TextInput
            style={styles.input}
            value={depthIngress}
            onChangeText={setDepthIngress}
            placeholder="e.g. None"
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Rock Type (if present)</Text>
          <TextInput
            style={styles.input}
            value={rockType}
            onChangeText={setRockType}
            placeholder="e.g. Limestone"
          />
        </View>

        <View style={styles.dateRow}>
          <View style={styles.dateCol}>
            <Text style={styles.label}>Excavation Date</Text>
            <TextInput
              style={styles.input}
              value={excavDate}
              onChangeText={setExcavDate}
              placeholder="YYYY-MM-DD"
            />
          </View>
          <View style={styles.dateCol}>
            <Text style={styles.label}>Excavation Time</Text>
            <TimeField style={styles.input} value={excavTime} onChange={setExcavTime} />
          </View>
        </View>

        <View style={styles.dateRow}>
          <View style={styles.dateCol}>
            <Text style={styles.label}>Examination Date</Text>
            <TextInput
              style={styles.input}
              value={examDate}
              onChangeText={setExamDate}
              placeholder="YYYY-MM-DD"
            />
          </View>
          <View style={styles.dateCol}>
            <Text style={styles.label}>Examination Time</Text>
            <TimeField style={styles.input} value={examTime} onChange={setExamTime} />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Soil Layers</Text>
        <Text style={styles.note}>
          One entry per layer, from the surface down to the bottom of the hole. Each layer is drawn
          on the report log at its true depth.
        </Text>

        {soilLayers.map((layer, i) => (
          <View key={layer.id} style={styles.layerBox}>
            <View style={styles.layerHeader}>
              <Text style={styles.layerTitle}>Layer {i + 1}</Text>
              <Pressable onPress={() => removeLayer(layer.id)} hitSlop={8} style={styles.layerRemove} accessibilityLabel={`Remove layer ${i + 1}`}>
                <Text style={styles.layerRemoveText}>Remove</Text>
              </Pressable>
            </View>
            <View style={styles.dateRow}>
              <View style={styles.dateCol}>
                <Text style={styles.label}>From (m)</Text>
                <TextInput style={styles.input} value={layer.from} onChangeText={(v) => updateLayer(layer.id, "from", v)}
                  keyboardType="decimal-pad" placeholder="e.g. 0.0" />
              </View>
              <View style={styles.dateCol}>
                <Text style={styles.label}>To (m)</Text>
                <TextInput style={styles.input} value={layer.to} onChangeText={(v) => updateLayer(layer.id, "to", v)}
                  keyboardType="decimal-pad" placeholder="e.g. 0.3" />
              </View>
            </View>
            {LAYER_TEXT_FIELDS.map((f) => (
              <View key={f.key} style={styles.row}>
                <Text style={styles.label}>{f.label}</Text>
                <TextInput style={styles.input} value={layer[f.key]} multiline
                  onChangeText={(v) => updateLayer(layer.id, f.key, v)} />
              </View>
            ))}
          </View>
        ))}

        <Pressable onPress={addLayer} style={styles.addLayer} accessibilityRole="button">
          <Text style={styles.addLayerText}>+ Add layer</Text>
        </Pressable>

        {errors.length > 0 && (
          <View style={styles.warnBox}>
            {errors.map((e) => <Text key={e} style={styles.warnText}>• {e}</Text>)}
          </View>
        )}
      </View>

      {showLegacyGrid && (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Soil Horizons (free text, older report)</Text>
        <Text style={styles.note}>
          This report was logged as free text. Add layers above to have them drawn at their true depths instead.
          Scroll horizontally to view all columns.
        </Text>

        <View style={styles.thGrid}>
          {/* LEFT: depth scale */}
          <View style={styles.thDepthColumn}>
            <View style={styles.thDepthHeaderSpacer} />
            <View style={styles.thDepthList}>
              {DEPTH_STEPS.map((d) => (
                <Text key={d} style={styles.thDepthText}>
                  {d}
                </Text>
              ))}
            </View>
          </View>

          {/* RIGHT: headers + big text boxes */}
          <View style={{ flex: 1 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              contentContainerStyle={styles.thColumnsScrollContent}
            >
              <View>
                <View style={styles.thHeaderRow}>
                  <View style={[styles.thColumn, { width: COL_WIDTHS.classification }]}>
                    <Text style={styles.thColHeader}>Classification</Text>
                  </View>

                  <View style={[styles.thColumn, { width: COL_WIDTHS.dilatancy }]}>
                    <Text style={styles.thColHeader}>Plasticity & dilatancy</Text>
                  </View>

                  <View style={[styles.thColumn, { width: COL_WIDTHS.structure }]}>
                    <Text style={styles.thColHeader}>Soil structure</Text>
                  </View>

                  <View style={[styles.thColumn, { width: COL_WIDTHS.compactness }]}>
                    <Text style={styles.thColHeader}>Density / compactness</Text>
                  </View>

                  <View style={[styles.thColumn, { width: COL_WIDTHS.colour }]}>
                    <Text style={styles.thColHeader}>Colour</Text>
                  </View>

                  <View style={[styles.thColumn, { width: COL_WIDTHS.flowpaths }]}>
                    <Text style={styles.thColHeader}>Preferential flowpaths</Text>
                  </View>
                </View>

                <View style={styles.thInputsRow}>
                  <TextInput
                    style={[styles.thBigInput, { width: COL_WIDTHS.classification }]}
                    multiline
                    value={thClassificationCol}
                    onChangeText={handleClassificationChange}
                    textAlignVertical="top"
                  />

                  <TextInput
                    style={[styles.thBigInput, { width: COL_WIDTHS.dilatancy }]}
                    multiline
                    value={thDilatancyCol}
                    onChangeText={handleDilatancyChange}
                    textAlignVertical="top"
                  />

                  <TextInput
                    style={[styles.thBigInput, { width: COL_WIDTHS.structure }]}
                    multiline
                    value={thStructureCol}
                    onChangeText={handleStructureChange}
                    textAlignVertical="top"
                  />

                  <TextInput
                    style={[styles.thBigInput, { width: COL_WIDTHS.compactness }]}
                    multiline
                    value={thCompactnessCol}
                    onChangeText={handleCompactnessChange}
                    textAlignVertical="top"
                  />

                  <TextInput
                    style={[styles.thBigInput, { width: COL_WIDTHS.colour }]}
                    multiline
                    value={thColourCol}
                    onChangeText={handleColourChange}
                    textAlignVertical="top"
                  />

                  <TextInput
                    style={[styles.thBigInput, { width: COL_WIDTHS.flowpaths }]}
                    multiline
                    value={thFlowpathsCol}
                    onChangeText={handleFlowpathsChange}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Percolation Estimates & Evaluation</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Likely Subsurface Percolation Value</Text>
          <TextInput
            style={styles.input}
            value={likelySubsurfaceP}
            onChangeText={setLikelySubsurfaceP}
            keyboardType="numeric"
            placeholder="e.g. 20"
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Likely Surface Percolation Value</Text>
          <TextInput
            style={styles.input}
            value={likelySurfaceP}
            onChangeText={setLikelySurfaceP}
            keyboardType="numeric"
            placeholder="e.g. 20"
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Evaluation</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={trialHoleEvaluation}
            onChangeText={setTrialHoleEvaluation}
            placeholder="Enter observations (e.g. water ingress, mottling, suitability assessment)..."
            multiline
          />
          <SuggestionNote value={trialHoleEvaluation} suggestion={trialHoleEvaluationSuggestion ?? null} onUse={setTrialHoleEvaluation}
            missing="Add the soil layers and the trial hole depth to get the standard wording." />
        </View>
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
    minHeight: 110,
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
    fontFamily: Font.regular,
  },
  layerBox: {
    borderWidth: 1, borderColor: Brand.borderLight, borderRadius: 12, padding: 12, marginBottom: 12, backgroundColor: Brand.bg,
  },
  layerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  layerTitle: { fontSize: 15, fontFamily: Font.semibold, color: Brand.text },
  layerRemove: { minHeight: 44, justifyContent: "center", paddingHorizontal: 8 },
  layerRemoveText: { fontSize: 14, fontFamily: Font.semibold, color: Brand.danger },
  addLayer: {
    minHeight: 44, borderRadius: 12, borderWidth: 1.5, borderColor: Brand.primary, borderStyle: "dashed",
    alignItems: "center", justifyContent: "center",
  },
  addLayerText: { fontSize: 15, fontFamily: Font.semibold, color: Brand.primary },
  warnBox: { backgroundColor: Brand.amberTint, borderRadius: 10, padding: 10, marginTop: 12 },
  warnText: { fontSize: 13, fontFamily: Font.regular, color: Brand.text, marginTop: 2 },
  thGrid: {
    flexDirection: "row",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    overflow: "hidden",
  },
  thDepthColumn: {
    width: 70,
    backgroundColor: "#fff",
  },
  thDepthHeaderSpacer: {
    height: TH_HEADER_HEIGHT,
  },
  thDepthList: {
    height: TH_CONTENT_HEIGHT,
    paddingHorizontal: 4,
    justifyContent: "space-between",
  },
  thDepthText: {
    fontSize: 12,
    lineHeight: TH_LINE_HEIGHT,
    textAlign: "right",
  },
  thColumnsScrollContent: {
    paddingRight: 8,
  },
  thHeaderRow: {
    flexDirection: "row",
    height: TH_HEADER_HEIGHT,
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 2,
  },
  thInputsRow: {
    flexDirection: "row",
    height: TH_CONTENT_HEIGHT,
    paddingHorizontal: 8,
  },
  thColumn: {
    width: 260,
    marginRight: 12,
  },
  thColHeader: {
    fontWeight: "600",
  },
  thBigInput: {
    height: TH_CONTENT_HEIGHT,
    width: 260,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 0,
    fontSize: 12,
    lineHeight: TH_LINE_HEIGHT,
    textAlignVertical: "top",
    marginRight: 12,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
});
