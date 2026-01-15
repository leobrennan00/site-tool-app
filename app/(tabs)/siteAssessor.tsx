import React from "react";
import { ScrollView, View, Text, TextInput, Button, Image, StyleSheet, Pressable } from "react-native";

interface SiteAssessorProps {
  assCompany: string;
  setAssCompany: (val: string) => void;
  assPrefix: string;
  setAssPrefix: (val: string) => void;
  assFirst: string;
  setAssFirst: (val: string) => void;
  assSurname: string;
  setAssSurname: (val: string) => void;
  assAddress: string;
  setAssAddress: (val: string) => void;
  assQuals: string;
  setAssQuals: (val: string) => void;
  assDateOfReport: string;
  setAssDateOfReport: (val: string) => void;
  assPhone: string;
  setAssPhone: (val: string) => void;
  assEmail: string;
  setAssEmail: (val: string) => void;
  assIndemnity: string;
  setAssIndemnity: (val: string) => void;
  signatureUrl: string | null;
  pickAndUploadSignature: () => void;
  API_BASE: string;
  planPdfUrls: string[];
  pickAndUploadPlans: () => void;
  generateReport: () => void;
}

export default function SiteAssessorTab(props: SiteAssessorProps) {
  const {
    assCompany, setAssCompany,
    assPrefix, setAssPrefix,
    assFirst, setAssFirst,
    assSurname, setAssSurname,
    assAddress, setAssAddress,
    assQuals, setAssQuals,
    assDateOfReport, setAssDateOfReport,
    assPhone, setAssPhone,
    assEmail, setAssEmail,
    assIndemnity, setAssIndemnity,
    signatureUrl,
    pickAndUploadSignature,
    API_BASE,
    planPdfUrls,
    pickAndUploadPlans,
    generateReport,
  } = props;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Text style={styles.title}>Site Assessor Details</Text>
        <Text style={styles.subtitle}>
          Professional information and report signature
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Company Information</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Company</Text>
          <TextInput
            style={styles.input}
            value={assCompany}
            onChangeText={setAssCompany}
            placeholder="Company name"
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Assessor Details</Text>

        <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
          <View style={{ maxWidth: 120 }}>
            <Text style={styles.label}>Prefix</Text>
            <TextInput
              style={styles.input}
              value={assPrefix}
              onChangeText={setAssPrefix}
              placeholder="e.g. Mr/Ms"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={assFirst}
              onChangeText={setAssFirst}
              placeholder="First name"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Surname</Text>
            <TextInput
              style={styles.input}
              value={assSurname}
              onChangeText={setAssSurname}
              placeholder="Surname"
            />
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            value={assAddress}
            onChangeText={setAssAddress}
            placeholder="Full address"
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Qualifications / Experience</Text>
          <TextInput
            style={styles.input}
            value={assQuals}
            onChangeText={setAssQuals}
            placeholder="e.g. MSc (Env Eng), BSc, EPA Approved Site Assessor, MIEI"
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contact Information</Text>

        <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
          <View style={{ maxWidth: 180 }}>
            <Text style={styles.label}>Date of Report</Text>
            <TextInput
              style={styles.input}
              value={assDateOfReport}
              onChangeText={setAssDateOfReport}
              placeholder="YYYY-MM-DD"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={assPhone}
              onChangeText={setAssPhone}
              keyboardType="phone-pad"
              placeholder="e.g. 086 000 0000"
            />
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            value={assEmail}
            onChangeText={setAssEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="name@example.com"
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Indemnity Insurance Number</Text>
          <TextInput
            style={styles.input}
            value={assIndemnity}
            onChangeText={setAssIndemnity}
            placeholder="Policy number"
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>E-signature</Text>

        <Button title="Upload signature" onPress={pickAndUploadSignature} />

        {signatureUrl && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.previewLabel}>Preview</Text>
            <Image
              source={{ uri: `${API_BASE}${signatureUrl}` }}
              style={styles.signatureImage}
              resizeMode="contain"
            />
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Attachments</Text>

        <Pressable onPress={pickAndUploadPlans} style={styles.attachButton}>
          <Text style={styles.attachButtonText}>Attach plan PDFs</Text>
        </Pressable>

        {planPdfUrls.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.label}>{planPdfUrls.length} PDF(s) attached</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Generate Report</Text>
        <Button title="Generate report (Page 1)" onPress={generateReport} />
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
    height: 100,
    textAlignVertical: "top",
  },
  previewLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  signatureImage: {
    width: "100%",
    height: 120,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    backgroundColor: "#FFF",
  },
  attachButton: {
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  attachButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
