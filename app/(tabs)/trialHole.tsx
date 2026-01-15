import React from "react";
import { ScrollView, View, Text, TextInput, StyleSheet, Platform } from "react-native";

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
  // Percolation estimates
  likelySubsurfaceP: string;
  setLikelySubsurfaceP: (val: string) => void;
  likelySurfaceP: string;
  setLikelySurfaceP: (val: string) => void;
  trialHoleEvaluation: string;
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
    likelySubsurfaceP, setLikelySubsurfaceP,
    likelySurfaceP, setLikelySurfaceP,
    trialHoleEvaluation, setTrialHoleEvaluation,
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

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
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
            <TextInput
              style={styles.input}
              value={excavTime}
              onChangeText={setExcavTime}
              placeholder="HH:mm"
            />
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
            <TextInput
              style={styles.input}
              value={examTime}
              onChangeText={setExamTime}
              placeholder="HH:mm"
            />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Soil Horizons</Text>
        <Text style={styles.note}>Scroll horizontally to view all columns</Text>

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
        </View>
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
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#FFF",
  },
  textArea: {
    height: 120,
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
  },
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
