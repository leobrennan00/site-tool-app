import React from "react";
import { ScrollView, View, Text, TextInput, Pressable, StyleSheet, Modal, Button } from "react-native";
import { Brand, Font, Shadow } from "@/constants/theme";

type MediaRow = { area: string; depth: string; invert: string };

interface TreatmentSystemsProps {
  septTankCapacity: string;
  setSeptTankCapacity: (val: string) => void;
  septPercNoTrenches: string;
  setSeptPercNoTrenches: (val: string) => void;
  septPercLenTrenches: string;
  setSeptPercLenTrenches: (val: string) => void;
  septPercInvertLevel: string;
  setSeptPercInvertLevel: (val: string) => void;
  septMoundNoTrenches: string;
  setSeptMoundNoTrenches: (val: string) => void;
  septMoundLenTrenches: string;
  setSeptMoundLenTrenches: (val: string) => void;
  septMoundInvertLevel: string;
  setSeptMoundInvertLevel: (val: string) => void;
  secSandSoil: MediaRow;
  setSecSandSoil: (val: MediaRow) => void;
  secSoil: MediaRow;
  setSecSoil: (val: MediaRow) => void;
  secWetland: MediaRow;
  setSecWetland: (val: MediaRow) => void;
  secOther: MediaRow;
  setSecOther: (val: MediaRow) => void;
  packagedType: string;
  setPackagedType: (val: string) => void;
  packagedPE: string;
  setPackagedPE: (val: string) => void;
  primaryCompartment: string;
  setPrimaryCompartment: (val: string) => void;
  tankModalVisible: boolean;
  setTankModalVisible: (val: boolean) => void;
  TANK_TYPES: readonly string[];
  pfSurfaceArea: string;
  setPfSurfaceArea: (val: string) => void;
  optDirectArea: string;
  setOptDirectArea: (val: string) => void;
  optPumpedArea: string;
  setOptPumpedArea: (val: string) => void;
  optGravityLength: string;
  setOptGravityLength: (val: string) => void;
  optLowPressureLength: string;
  setOptLowPressureLength: (val: string) => void;
  optDripArea: string;
  setOptDripArea: (val: string) => void;
  tertiaryPurpose: string;
  setTertiaryPurpose: (val: string) => void;
  tertiaryPerformance: string;
  setTertiaryPerformance: (val: string) => void;
  tertiaryDesign: string;
  setTertiaryDesign: (val: string) => void;
  dischargeChoice: "groundwater" | "surface";
  setDischargeChoice: (val: "groundwater" | "surface") => void;
  hydraulicLoadingRate: string;
  setHydraulicLoadingRate: (val: string) => void;
  surfaceAreaM2: string;
  setSurfaceAreaM2: (val: string) => void;
  dischargeRateM3hr: string;
  setDischargeRateM3hr: (val: string) => void;
  /** Short "why this number" explanations for the EPA CoP 2021 sizing
   *  suggestions — see lib/designRules/dwwtsSizing.ts. Undefined/empty
   *  hints just render nothing. */
  filterAreaHint?: string;
  trenchHint?: string;
  septicTrenchHint?: string;
  loadingRateHint?: string;
}

export default function TreatmentSystemsTab(props: TreatmentSystemsProps) {
  const {
    septTankCapacity, setSeptTankCapacity,
    septPercNoTrenches, setSeptPercNoTrenches,
    septPercLenTrenches, setSeptPercLenTrenches,
    septPercInvertLevel, setSeptPercInvertLevel,
    septMoundNoTrenches, setSeptMoundNoTrenches,
    septMoundLenTrenches, setSeptMoundLenTrenches,
    septMoundInvertLevel, setSeptMoundInvertLevel,
    secSandSoil, setSecSandSoil,
    secSoil, setSecSoil,
    secWetland, setSecWetland,
    secOther, setSecOther,
    packagedType, setPackagedType,
    packagedPE, setPackagedPE,
    primaryCompartment, setPrimaryCompartment,
    tankModalVisible, setTankModalVisible,
    TANK_TYPES,
    pfSurfaceArea, setPfSurfaceArea,
    optDirectArea, setOptDirectArea,
    optPumpedArea, setOptPumpedArea,
    optGravityLength, setOptGravityLength,
    optLowPressureLength, setOptLowPressureLength,
    optDripArea, setOptDripArea,
    tertiaryPurpose, setTertiaryPurpose,
    tertiaryPerformance, setTertiaryPerformance,
    tertiaryDesign, setTertiaryDesign,
    dischargeChoice, setDischargeChoice,
    hydraulicLoadingRate, setHydraulicLoadingRate,
    surfaceAreaM2, setSurfaceAreaM2,
    dischargeRateM3hr, setDischargeRateM3hr,
    filterAreaHint, trenchHint, septicTrenchHint, loadingRateHint,
  } = props;

  return (
    <ScrollView style={{ backgroundColor: Brand.bg }} contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Text style={styles.title}>Treatment System Details</Text>
        <Text style={styles.subtitle}>
          Configure wastewater treatment systems and discharge routes
        </Text>
      </View>

      {/* SEPTIC TANK SYSTEMS */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Septic Tank Systems (Chapter 7)</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Tank Capacity (m³)</Text>
          <TextInput
            style={styles.input}
            value={septTankCapacity}
            onChangeText={setSeptTankCapacity}
            keyboardType="numeric"
            placeholder="e.g. 3.0"
          />
        </View>

        <Text style={styles.subsectionTitle}>Percolation Area</Text>
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 4 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>No. of Trenches</Text>
            <TextInput
              style={styles.input}
              value={septPercNoTrenches}
              onChangeText={setSeptPercNoTrenches}
              keyboardType="numeric"
              placeholder="e.g. 3"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Length of Trenches (m)</Text>
            <TextInput
              style={styles.input}
              value={septPercLenTrenches}
              onChangeText={setSeptPercLenTrenches}
              keyboardType="numeric"
              placeholder="e.g. 60"
            />
          </View>
        </View>
        {septicTrenchHint ? <Text style={styles.hintText}>{septicTrenchHint}</Text> : null}
        <View style={[styles.row, { marginTop: 12 }]}>
          <Text style={styles.label}>Invert Level (m)</Text>
          <TextInput
            style={styles.input}
            value={septPercInvertLevel}
            onChangeText={setSeptPercInvertLevel}
            keyboardType="numbers-and-punctuation"
            placeholder="e.g. 100.80 or -1.5"
          />
        </View>

        <Text style={styles.subsectionTitle}>Mounded Percolation Area</Text>
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>No. of Trenches</Text>
            <TextInput
              style={styles.input}
              value={septMoundNoTrenches}
              onChangeText={setSeptMoundNoTrenches}
              keyboardType="numeric"
              placeholder="e.g. 3"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Length of Trenches (m)</Text>
            <TextInput
              style={styles.input}
              value={septMoundLenTrenches}
              onChangeText={setSeptMoundLenTrenches}
              keyboardType="numeric"
              placeholder="e.g. 60"
            />
          </View>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Invert Level (m)</Text>
          <TextInput
            style={styles.input}
            value={septMoundInvertLevel}
            onChangeText={setSeptMoundInvertLevel}
            keyboardType="numbers-and-punctuation"
            placeholder="e.g. 100.80 or -1.5"
          />
        </View>
      </View>

      {/* SECONDARY TREATMENT SYSTEMS */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Secondary Treatment System (Chapters 8 & 9) and polishing filter (Section 10.1)
        </Text>

        <Text style={styles.subsectionTitle}>
          Secondary Treatment Systems receiving septic tank effluent (Chapter 8)
        </Text>

        {/* Table Header */}
        <View style={styles.tableContainer}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, styles.tableMediaTypeCol]}>Media Type</Text>
            <Text style={[styles.tableHeaderCell, styles.tableNumericCol]}>Area (m²)*</Text>
            <Text style={[styles.tableHeaderCell, styles.tableNumericCol]}>Depth of Filter</Text>
            <Text style={[styles.tableHeaderCell, styles.tableNumericCol]}>Invert Level</Text>
          </View>

          {/* Sand/Soil Row */}
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.tableMediaTypeCol]}>Sand/Soil</Text>
            <TextInput
              style={[styles.tableInput, styles.tableNumericCol]}
              placeholder=""
              value={secSandSoil.area}
              onChangeText={(v) => setSecSandSoil({ ...secSandSoil, area: v })}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.tableInput, styles.tableNumericCol]}
              placeholder=""
              value={secSandSoil.depth}
              onChangeText={(v) => setSecSandSoil({ ...secSandSoil, depth: v })}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.tableInput, styles.tableNumericCol]}
              placeholder=""
              value={secSandSoil.invert}
              onChangeText={(v) => setSecSandSoil({ ...secSandSoil, invert: v })}
              keyboardType="numbers-and-punctuation"
            />
          </View>

          {/* Soil Row */}
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.tableMediaTypeCol]}>Soil</Text>
            <TextInput
              style={[styles.tableInput, styles.tableNumericCol]}
              placeholder=""
              value={secSoil.area}
              onChangeText={(v) => setSecSoil({ ...secSoil, area: v })}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.tableInput, styles.tableNumericCol]}
              placeholder=""
              value={secSoil.depth}
              onChangeText={(v) => setSecSoil({ ...secSoil, depth: v })}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.tableInput, styles.tableNumericCol]}
              placeholder=""
              value={secSoil.invert}
              onChangeText={(v) => setSecSoil({ ...secSoil, invert: v })}
              keyboardType="numbers-and-punctuation"
            />
          </View>

          {/* Constructed Wetland Row */}
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.tableMediaTypeCol]}>Constructed Wetland</Text>
            <TextInput
              style={[styles.tableInput, styles.tableNumericCol]}
              placeholder=""
              value={secWetland.area}
              onChangeText={(v) => setSecWetland({ ...secWetland, area: v })}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.tableInput, styles.tableNumericCol]}
              placeholder=""
              value={secWetland.depth}
              onChangeText={(v) => setSecWetland({ ...secWetland, depth: v })}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.tableInput, styles.tableNumericCol]}
              placeholder=""
              value={secWetland.invert}
              onChangeText={(v) => setSecWetland({ ...secWetland, invert: v })}
              keyboardType="numbers-and-punctuation"
            />
          </View>

          {/* Other Row */}
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.tableMediaTypeCol]}>Other</Text>
            <TextInput
              style={[styles.tableInput, styles.tableNumericCol]}
              placeholder=""
              value={secOther.area}
              onChangeText={(v) => setSecOther({ ...secOther, area: v })}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.tableInput, styles.tableNumericCol]}
              placeholder=""
              value={secOther.depth}
              onChangeText={(v) => setSecOther({ ...secOther, depth: v })}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.tableInput, styles.tableNumericCol]}
              placeholder=""
              value={secOther.invert}
              onChangeText={(v) => setSecOther({ ...secOther, invert: v })}
              keyboardType="numbers-and-punctuation"
            />
          </View>
        </View>

        <Text style={[styles.subsectionTitle, { marginTop: 16 }]}>
          Packaged Secondary Treatment Systems receiving raw wastewater (Chapter 9)
        </Text>

        <View style={styles.row}>
          <Text style={styles.label}>Tank Type</Text>
          <Pressable
            style={[styles.input, { justifyContent: "center" }]}
            onPress={() => setTankModalVisible(true)}
          >
            <Text style={{ color: packagedType ? "#000" : "#888" }}>
              {packagedType || "Select tank type"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Capacity PE</Text>
          <TextInput
            style={styles.input}
            value={packagedPE}
            onChangeText={setPackagedPE}
            keyboardType="numeric"
            placeholder="e.g. 6"
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Sizing of Primary Compartment (m³)</Text>
          <TextInput
            style={styles.input}
            value={primaryCompartment}
            onChangeText={setPrimaryCompartment}
            keyboardType="numeric"
            placeholder="e.g. 3.00"
          />
        </View>

        {/* Tank Type Modal */}
        <Modal
          visible={tankModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setTankModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select tank type</Text>
              {TANK_TYPES.map((t) => (
                <Pressable
                  key={t}
                  style={styles.modalOption}
                  onPress={() => {
                    setPackagedType(t);
                    setTankModalVisible(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{t}</Text>
                </Pressable>
              ))}
              <Button title="Cancel" onPress={() => setTankModalVisible(false)} />
            </View>
          </View>
        </Modal>

        <Text style={[styles.subsectionTitle, { marginTop: 16 }]}>
          Polishing Filter (Section 10.1)
        </Text>

        <View style={styles.row}>
          <Text style={styles.label}>Surface Area (m²)</Text>
          <TextInput
            style={styles.input}
            value={pfSurfaceArea}
            onChangeText={setPfSurfaceArea}
            keyboardType="numeric"
            placeholder="e.g. 45.00"
          />
          {filterAreaHint ? <Text style={styles.hintText}>{filterAreaHint}</Text> : null}
        </View>

        <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label} numberOfLines={2}>
              Option 1 — Direct Discharge (surface area, m²)
            </Text>
            <TextInput
              style={styles.input}
              value={optDirectArea}
              onChangeText={setOptDirectArea}
              keyboardType="numeric"
              placeholder="—"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label} numberOfLines={2}>
              Option 2 — Pumped Discharge (surface area, m²)
            </Text>
            <TextInput
              style={styles.input}
              value={optPumpedArea}
              onChangeText={setOptPumpedArea}
              keyboardType="numeric"
              placeholder="e.g. 45.00"
            />
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label} numberOfLines={2}>
              Option 3 — Gravity Discharge (trench length, m)
            </Text>
            <TextInput
              style={styles.input}
              value={optGravityLength}
              onChangeText={setOptGravityLength}
              keyboardType="numeric"
              placeholder="—"
            />
            {trenchHint ? <Text style={styles.hintText}>{trenchHint}</Text> : null}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label} numberOfLines={2}>
              Option 4 — Low Pressure Pipe Distribution (trench length, m)
            </Text>
            <TextInput
              style={styles.input}
              value={optLowPressureLength}
              onChangeText={setOptLowPressureLength}
              keyboardType="numeric"
              placeholder="—"
            />
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Option 5 — Drip Dispersal (surface area, m²)</Text>
          <TextInput
            style={styles.input}
            value={optDripArea}
            onChangeText={setOptDripArea}
            keyboardType="numeric"
            placeholder="—"
          />
        </View>
      </View>

      {/* TERTIARY TREATMENT SYSTEM */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Tertiary Treatment System and infiltration / treatment area (Section 10.2)
        </Text>

        <View style={styles.row}>
          <Text style={styles.label}>Identify purpose of tertiary treatment</Text>
          <TextInput
            style={styles.input}
            value={tertiaryPurpose}
            onChangeText={setTertiaryPurpose}
            placeholder="e.g. Additional phosphorus removal"
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>
            Provide performance information demonstrating system will provide required treatment levels
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={tertiaryPerformance}
            onChangeText={setTertiaryPerformance}
            multiline
            placeholder="e.g. Effluent standard BOD < 5 mg/l, SS < 5 mg/l"
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Provide design information</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={tertiaryDesign}
            onChangeText={setTertiaryDesign}
            multiline
            placeholder="e.g. System dimensions, loading rates, configuration"
          />
        </View>
      </View>

      {/* DISCHARGE ROUTE */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Discharge Route</Text>

        <View style={{ marginBottom: 16 }}>
          <Pressable
            onPress={() => setDischargeChoice("groundwater")}
            style={[
              styles.segmentBtn,
              dischargeChoice === "groundwater" && styles.segmentBtnActive,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                dischargeChoice === "groundwater" && styles.segmentTextActive,
              ]}
            >
              Groundwater
            </Text>
          </Pressable>
          {/* A single house is never permitted to discharge to surface
              water — greyed out and non-interactive rather than removed,
              so it's still visible as the (unavailable) alternative. */}
          <View style={[styles.segmentBtn, styles.segmentBtnDisabled]}>
            <Text style={[styles.segmentText, { color: Brand.textMuted }]}>
              Surface Water — not used for a single house
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Hydraulic Loading Rate (l/m²·d)</Text>
            <TextInput
              style={[
                styles.input,
                dischargeChoice === "surface" && styles.dimmedInput,
              ]}
              value={hydraulicLoadingRate}
              onChangeText={setHydraulicLoadingRate}
              keyboardType="numeric"
              placeholder="e.g. 20"
            />
            {loadingRateHint ? <Text style={styles.hintText}>{loadingRateHint}</Text> : null}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Surface Area (m²)</Text>
            <TextInput
              style={[
                styles.input,
                dischargeChoice === "surface" && styles.dimmedInput,
              ]}
              value={surfaceAreaM2}
              onChangeText={setSurfaceAreaM2}
              keyboardType="numeric"
              placeholder="e.g. 45"
            />
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Discharge Rate (m³/hr)</Text>
          <TextInput
            style={styles.input}
            value={dischargeRateM3hr}
            onChangeText={setDischargeRateM3hr}
            keyboardType="numeric"
            placeholder="e.g. 0.0375"
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
  sectionTitle: {
    fontSize: 11,
    fontFamily: Font.bold,
    color: Brand.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  subsectionTitle: {
    fontSize: 14,
    fontFamily: Font.semibold,
    color: Brand.text,
    marginBottom: 12,
    marginTop: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: Font.bold,
    color: Brand.textSub,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 6,
    marginTop: 8,
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
    minHeight: 90,
    textAlignVertical: "top",
  },
  threeColRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  dimmedInput: {
    backgroundColor: Brand.borderLight,
    color: Brand.textMuted,
  },
  segmentBtn: {
    backgroundColor: Brand.bg,
    borderWidth: 1.5,
    borderColor: Brand.border,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  segmentBtnActive: {
    backgroundColor: Brand.primaryTint,
    borderColor: Brand.primary,
  },
  segmentBtnDisabled: {
    backgroundColor: Brand.borderLight,
    opacity: 0.6,
  },
  hintText: {
    fontSize: 11,
    fontFamily: Font.regular,
    color: Brand.textMuted,
    marginTop: 5,
  },
  segmentText: {
    fontSize: 15,
    fontFamily: Font.regular,
    color: Brand.text,
  },
  segmentTextActive: {
    fontFamily: Font.semibold,
    color: Brand.primaryDark,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: Brand.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: Brand.surface,
    borderRadius: 16,
    padding: 20,
    width: "82%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: Font.bold,
    color: Brand.text,
    marginBottom: 16,
    textAlign: "center",
  },
  modalOption: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Brand.borderLight,
  },
  modalOptionText: {
    fontSize: 16,
    color: Brand.text,
    fontFamily: Font.regular,
  },
  // Table styles for Secondary Treatment media type table
  tableContainer: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 8,
    marginBottom: 16,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: Brand.primaryTint,
    borderBottomWidth: 1,
    borderBottomColor: Brand.border,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Brand.borderLight,
  },
  tableHeaderCell: {
    padding: 10,
    fontSize: 12,
    fontFamily: Font.semibold,
    color: Brand.primaryDark,
    textAlign: "center",
  },
  tableCell: {
    padding: 12,
    fontSize: 14,
    fontFamily: Font.medium,
    color: Brand.text,
    justifyContent: "center",
  },
  tableInput: {
    borderWidth: 0,
    borderLeftWidth: 1,
    borderLeftColor: Brand.borderLight,
    padding: 10,
    fontSize: 14,
    fontFamily: Font.regular,
    color: Brand.text,
    backgroundColor: Brand.surface,
    textAlign: "center",
  },
  tableMediaTypeCol: {
    flex: 2,
  },
  tableNumericCol: {
    flex: 1.5,
  },
});
