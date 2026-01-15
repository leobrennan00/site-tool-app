import React from "react";
import { ScrollView, View, Text, TextInput, StyleSheet, Pressable } from "react-native";

interface VisualAssessmentProps {
  landscapePosition: string;
  setLandscapePosition: (val: string) => void;
  slope: string;
  setSlope: (val: string) => void;
  slopeComment: string;
  setSlopeComment: (val: string) => void;
  houses250m: string;
  setHouses250m: (val: string) => void;
  existingLandUse: string;
  setExistingLandUse: (val: string) => void;
  vegIndicators: string;
  setVegIndicators: (val: string) => void;
  gwFlowDirection: string;
  setGwFlowDirection: (val: string) => void;
  groundCondition: string;
  setGroundCondition: (val: string) => void;
  siteBoundaries: string;
  setSiteBoundaries: (val: string) => void;
  roads: string;
  setRoads: (val: string) => void;
  outcrops: string;
  setOutcrops: (val: string) => void;
  ponding: string;
  setPonding: (val: string) => void;
  lakes: string;
  setLakes: (val: string) => void;
  beachesShellfish: string;
  setBeachesShellfish: (val: string) => void;
  wetlands: string;
  setWetlands: (val: string) => void;
  karstFeatures: string;
  setKarstFeatures: (val: string) => void;
  watercourses: string;
  setWatercourses: (val: string) => void;
  drainageDitches: string;
  setDrainageDitches: (val: string) => void;
  springs: string;
  setSprings: (val: string) => void;
  wellsText: string;
  setWellsText: (val: string) => void;
  visualComments: string;
  setVisualComments: (val: string) => void;
}

export default function VisualAssessmentTab(props: VisualAssessmentProps) {
  const {
    landscapePosition, setLandscapePosition,
    slope, setSlope,
    slopeComment, setSlopeComment,
    houses250m, setHouses250m,
    existingLandUse, setExistingLandUse,
    vegIndicators, setVegIndicators,
    gwFlowDirection, setGwFlowDirection,
    groundCondition, setGroundCondition,
    siteBoundaries, setSiteBoundaries,
    roads, setRoads,
    outcrops, setOutcrops,
    ponding, setPonding,
    lakes, setLakes,
    beachesShellfish, setBeachesShellfish,
    wetlands, setWetlands,
    karstFeatures, setKarstFeatures,
    watercourses, setWatercourses,
    drainageDitches, setDrainageDitches,
    springs, setSprings,
    wellsText, setWellsText,
    visualComments, setVisualComments,
  } = props;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Text style={styles.title}>Visual Assessment</Text>
        <Text style={styles.subtitle}>
          On-site observations and environmental features
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Site Characteristics</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Landscape Position</Text>
          <TextInput
            style={styles.input}
            value={landscapePosition}
            onChangeText={setLandscapePosition}
            placeholder="e.g. Mid-slope / Hilltop / Valley floor"
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Slope</Text>
          <View style={styles.checkboxGroup}>
            <Pressable
              style={styles.checkboxRow}
              onPress={() => setSlope(slope === "Steep (>1.5)" ? "" : "Steep (>1.5)")}
            >
              <View style={[styles.checkbox, slope === "Steep (>1.5)" && styles.checkboxChecked]}>
                {slope === "Steep (>1.5)" && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Steep (&gt;1.5)</Text>
            </Pressable>

            <Pressable
              style={styles.checkboxRow}
              onPress={() => setSlope(slope === "Shallow (1.5-1:20)" ? "" : "Shallow (1.5-1:20)")}
            >
              <View style={[styles.checkbox, slope === "Shallow (1.5-1:20)" && styles.checkboxChecked]}>
                {slope === "Shallow (1.5-1:20)" && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Shallow (1.5-1:20)</Text>
            </Pressable>

            <Pressable
              style={styles.checkboxRow}
              onPress={() => setSlope(slope === "Relatively Flat (<1:20)" ? "" : "Relatively Flat (<1:20)")}
            >
              <View style={[styles.checkbox, slope === "Relatively Flat (<1:20)" && styles.checkboxChecked]}>
                {slope === "Relatively Flat (<1:20)" && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Relatively Flat (&lt;1:20)</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Slope Comment</Text>
          <TextInput
            style={styles.input}
            value={slopeComment}
            onChangeText={setSlopeComment}
            placeholder="e.g. Slight gradient to the south"
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Houses (within 250 m)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={houses250m}
            onChangeText={setHouses250m}
            placeholder="e.g. ~5 houses within 250 m; nearest ~110 m NE"
            multiline
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Existing Land Use</Text>
          <TextInput
            style={styles.input}
            value={existingLandUse}
            onChangeText={setExistingLandUse}
            placeholder="e.g. Pasture / Tillage / Woodland"
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Vegetation Indicators</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={vegIndicators}
            onChangeText={setVegIndicators}
            placeholder="e.g. Rushes present, improved grassland"
            multiline
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Groundwater Flow Direction</Text>
          <TextInput
            style={styles.input}
            value={gwFlowDirection}
            onChangeText={setGwFlowDirection}
            placeholder="e.g. Slight gradient to the south"
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Ground Condition</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={groundCondition}
            onChangeText={setGroundCondition}
            placeholder="e.g. Firm and dry"
            multiline
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Site Boundaries</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={siteBoundaries}
            onChangeText={setSiteBoundaries}
            placeholder="e.g. Hedges and trees"
            multiline
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Surface Features</Text>
        <Text style={styles.note}>Within a minimum of 250 m (note distances in metres)</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Roads</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={roads}
            onChangeText={setRoads}
            placeholder="e.g. Local road; nearest ~60 m W"
            multiline
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Outcrops (Bedrock and/or Subsoil)</Text>
          <TextInput
            style={[styles.input, styles.textAreaLarge]}
            value={outcrops}
            onChangeText={setOutcrops}
            placeholder="e.g. None observed within 250 m"
            multiline
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Water Features</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Surface Water Ponding</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={ponding}
            onChangeText={setPonding}
            placeholder="e.g. None / isolated shallow pooling near NE corner"
            multiline
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Lakes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={lakes}
            onChangeText={setLakes}
            placeholder="e.g. None within 250 m"
            multiline
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Beaches / Shellfish Areas</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={beachesShellfish}
            onChangeText={setBeachesShellfish}
            placeholder="e.g. None within study area"
            multiline
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Wetlands</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={wetlands}
            onChangeText={setWetlands}
            placeholder="e.g. None"
            multiline
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Karst Features</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={karstFeatures}
            onChangeText={setKarstFeatures}
            placeholder="e.g. None visible"
            multiline
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Watercourses / Streams</Text>
          <TextInput
            style={[styles.input, styles.textAreaLarge]}
            value={watercourses}
            onChangeText={setWatercourses}
            placeholder="e.g. None; if present note distance, direction, and observed water level"
            multiline
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Drainage Ditches*</Text>
          <TextInput
            style={[styles.input, styles.textAreaMedium]}
            value={drainageDitches}
            onChangeText={setDrainageDitches}
            placeholder="e.g. None / open ditch ~40 m S flowing E→W"
            multiline
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Springs*</Text>
          <TextInput
            style={[styles.input, styles.textAreaMedium]}
            value={springs}
            onChangeText={setSprings}
            placeholder="e.g. None observed"
            multiline
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Wells*</Text>
          <TextInput
            style={[styles.input, styles.textAreaLarge]}
            value={wellsText}
            onChangeText={setWellsText}
            placeholder="e.g. None; if present note distance/direction and water level"
            multiline
          />
        </View>

        <Text style={styles.note}>*Note and record water level</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Visual Assessment Comments</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Comments</Text>
          <TextInput
            style={[styles.input, styles.textAreaLarge]}
            value={visualComments}
            onChangeText={setVisualComments}
            placeholder="Integrate observations: suitability, targets at risk, separation distances, proposed system location, etc."
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
  note: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 12,
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
    height: 80,
    textAlignVertical: "top",
  },
  textAreaMedium: {
    height: 120,
    textAlignVertical: "top",
  },
  textAreaLarge: {
    height: 140,
    textAlignVertical: "top",
  },
  checkboxGroup: {
    gap: 12,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#4A90E2",
    borderRadius: 4,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: "#4A90E2",
  },
  checkmark: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  checkboxLabel: {
    fontSize: 16,
    color: "#333",
  },
});
