import React from "react";
import { ScrollView, View, Text, TextInput, Pressable, StyleSheet, Platform } from "react-native";

interface SelectedDwwtsProps {
  dwwtsInstall: string;
  setDwwtsInstall: (val: string) => void;
  dwwtsDischargeTo: string;
  setDwwtsDischargeTo: (val: string) => void;
  invertLevel: string;
  setInvertLevel: (val: string) => void;
  siteSpecificConditions: string;
  setSiteSpecificConditions: (val: string) => void;
}

export default function SelectedDwwtsTab(props: SelectedDwwtsProps) {
  const {
    dwwtsInstall,
    setDwwtsInstall,
    dwwtsDischargeTo,
    setDwwtsDischargeTo,
    invertLevel,
    setInvertLevel,
    siteSpecificConditions,
    setSiteSpecificConditions,
  } = props;

  const installOptions = [
    "Septic tank system (septic tank and percolation area)",
    "Secondary Treatment System and soil polishing filter",
    "Tertiary Treatment System and Infiltration /treatment area",
  ];

  const dischargeOptions = ["Ground Water", "Surface Water"];

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Text style={styles.title}>Selected DWWTS</Text>
        <Text style={styles.subtitle}>
          Domestic Wastewater Treatment System selection
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Propose to install</Text>

        {installOptions.map((opt) => (
          <Pressable
            key={opt}
            onPress={() => setDwwtsInstall(opt)}
            style={styles.radioContainer}
          >
            <View style={styles.radioOuter}>
              {dwwtsInstall === opt && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioLabel}>{opt}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>and discharge to</Text>

        {dischargeOptions.map((opt) => (
          <Pressable
            key={opt}
            onPress={() => setDwwtsDischargeTo(opt)}
            style={styles.radioContainer}
          >
            <View style={styles.radioOuter}>
              {dwwtsDischargeTo === opt && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioLabel}>{opt}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>System Configuration</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Invert level of the trench/bed gravel or drip tubing (m)</Text>
          <TextInput
            style={styles.input}
            value={invertLevel}
            onChangeText={setInvertLevel}
            keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "numeric"}
            placeholder="e.g. -0.40"
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>
            Site Specific Conditions (e.g. special works, site improvement works testing etc.)
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={siteSpecificConditions}
            onChangeText={setSiteSpecificConditions}
            multiline
            placeholder="Enter the narrative that will appear in the report..."
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
    height: 140,
    textAlignVertical: "top",
  },
  radioContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#333",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#333",
  },
  radioLabel: {
    flex: 1,
    fontSize: 15,
    color: "#333",
  },
});
