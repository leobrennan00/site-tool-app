import React from "react";
import { ScrollView, View, Text, TextInput, Pressable, StyleSheet } from "react-native";

interface ConclusionProps {
  slope: string;
  setSlope: (val: string) => void;
  sepDistancesMet: boolean;
  setSepDistancesMet: (val: boolean) => void;
  unsatDepth: string;
  setUnsatDepth: (val: string) => void;
  sPV: number | null;
  ssPV: number | null;
  suitableForDevelopment: boolean;
  setSuitableForDevelopment: (val: boolean) => void;
  optSepticTank: boolean;
  setOptSepticTank: (val: boolean) => void;
  optSecondary: boolean;
  setOptSecondary: (val: boolean) => void;
  optTertiary: boolean;
  setOptTertiary: (val: boolean) => void;
  dischargeRoute: string;
  setDischargeRoute: (val: string) => void;
  setCDirty: (val: any) => void;
}

export default function ConclusionTab(props: ConclusionProps) {
  const {
    slope,
    setSlope,
    sepDistancesMet,
    setSepDistancesMet,
    unsatDepth,
    setUnsatDepth,
    sPV,
    ssPV,
    suitableForDevelopment,
    setSuitableForDevelopment,
    optSepticTank,
    setOptSepticTank,
    optSecondary,
    setOptSecondary,
    optTertiary,
    setOptTertiary,
    dischargeRoute,
    setDischargeRoute,
    setCDirty,
  } = props;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Text style={styles.title}>Conclusion of Site Characterisation</Text>
        <Text style={styles.subtitle}>
          Site assessment summary and suitability determination
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Site Conditions</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Slope of proposed infiltration / treatment area</Text>
          <TextInput
            style={styles.input}
            value={slope}
            onChangeText={setSlope}
            placeholder="e.g. Relatively flat / Shallow / Steep"
          />
        </View>

        <Pressable
          onPress={() => {
            console.log('Before toggle:', sepDistancesMet);
            setSepDistancesMet(!sepDistancesMet);
            setCDirty((prev: any) => ({ ...prev, sepDistancesMet: true }));
            console.log('After toggle:', !sepDistancesMet);
          }}
          style={[
            styles.checkboxBtn,
            {
              marginBottom: 8,
              backgroundColor: sepDistancesMet ? "#d9ead3" : "#EFEFEF",
              borderWidth: 2,
              borderColor: sepDistancesMet ? "#93c47d" : "#DDD"
            }
          ]}
        >
          <Text style={[styles.checkboxText, { fontWeight: sepDistancesMet ? "600" : "500" }]}>
            {sepDistancesMet ? "✓" : "○"} All minimum separation distances met
          </Text>
        </Pressable>

        <View style={styles.row}>
          <Text style={styles.label}>Depth of unsaturated soil/subsoil beneath invert (m)</Text>
          <TextInput
            style={styles.input}
            value={unsatDepth}
            onChangeText={setUnsatDepth}
            keyboardType="numeric"
            placeholder="e.g. 0.90"
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Percolation Test Results</Text>
        <Text style={styles.note}>
          These values are calculated from the Subsurface Perc and Surface Perc tabs
        </Text>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Surface Percolation Value</Text>
            <TextInput
              style={[styles.input, styles.readOnly]}
              value={sPV != null ? sPV.toFixed(2) : ""}
              editable={false}
              placeholder="—"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Sub-surface Percolation Value</Text>
            <TextInput
              style={[styles.input, styles.readOnly]}
              value={ssPV != null ? ssPV.toFixed(2) : ""}
              editable={false}
              placeholder="—"
            />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Suitability Assessment</Text>

        <View style={{ flexDirection: "column", gap: 8 }}>
          <Pressable
            onPress={() => setSuitableForDevelopment(false)}
            style={[
              styles.suitabilityBtn,
              { backgroundColor: !suitableForDevelopment ? "#fce5cd" : "#efefef" }
            ]}
          >
            <Text style={styles.suitabilityText}>Not Suitable for Development</Text>
          </Pressable>
          <Pressable
            onPress={() => setSuitableForDevelopment(true)}
            style={[
              styles.suitabilityBtn,
              { backgroundColor: suitableForDevelopment ? "#d9ead3" : "#efefef" }
            ]}
          >
            <Text style={styles.suitabilityText}>Suitable for Development</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Suitable Options</Text>
        <Text style={styles.note}>Select all applicable treatment system options</Text>

        <View style={{ flexDirection: "column", gap: 8, marginTop: 8 }}>
          <Pressable
            onPress={() => setOptSepticTank(!optSepticTank)}
            style={[
              styles.optionBtn,
              { backgroundColor: optSepticTank ? "#d9ead3" : "#efefef" }
            ]}
          >
            <Text style={styles.optionText}>Septic tank system</Text>
          </Pressable>
          <Pressable
            onPress={() => setOptSecondary(!optSecondary)}
            style={[
              styles.optionBtn,
              { backgroundColor: optSecondary ? "#d9ead3" : "#efefef" }
            ]}
          >
            <Text style={styles.optionText}>Secondary treatment + polishing filter</Text>
          </Pressable>
          <Pressable
            onPress={() => setOptTertiary(!optTertiary)}
            style={[
              styles.optionBtn,
              { backgroundColor: optTertiary ? "#d9ead3" : "#efefef" }
            ]}
          >
            <Text style={styles.optionText}>Tertiary + infiltration/treatment area</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Discharge Route</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={dischargeRoute}
          onChangeText={setDischargeRoute}
          multiline
          placeholder="e.g. Via subsoil to groundwater"
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
  readOnly: {
    backgroundColor: "#F5F5F5",
    color: "#666",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  note: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 12,
  },
  checkboxBtn: {
    backgroundColor: "#EFEFEF",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  checkboxText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
  },
  suitabilityBtn: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  suitabilityText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  optionBtn: {
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  optionText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
  },
});
