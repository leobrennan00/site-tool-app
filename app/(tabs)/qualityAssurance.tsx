import React from "react";
import { ScrollView, View, Text, TextInput, StyleSheet } from "react-native";

interface QualityAssuranceProps {
  qaInstall: string;
  setQaInstall: (val: string) => void;
  qaMaintenance: string;
  setQaMaintenance: (val: string) => void;
}

export default function QualityAssuranceTab(props: QualityAssuranceProps) {
  const { qaInstall, setQaInstall, qaMaintenance, setQaMaintenance } = props;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Text style={styles.title}>Quality Assurance</Text>
        <Text style={styles.subtitle}>
          Installation, commissioning, and maintenance requirements
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Installation & Commissioning</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            value={qaInstall}
            onChangeText={setQaInstall}
            placeholder="Enter installation and commissioning requirements..."
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>On-going Maintenance</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            value={qaMaintenance}
            onChangeText={setQaMaintenance}
            placeholder="Enter ongoing maintenance requirements..."
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
});
