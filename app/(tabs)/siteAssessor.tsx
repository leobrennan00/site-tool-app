import React, { useState } from "react";
import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import GoogleDrivePicker from "../components/GoogleDrivePicker";
import { Brand, Font } from "@/constants/theme";
import { Card, CardTitle, FormInput, PrimaryBtn } from "@/components/ui/kit";
import { KeyboardAwareScrollView } from "@/components/ui/KeyboardAwareScrollView";
import { PrefixPicker } from "@/components/ui/PrefixPicker";

interface SiteAssessorProps {
  assCompany: string; setAssCompany: (val: string) => void;
  assPrefix: string; setAssPrefix: (val: string) => void;
  assFirst: string; setAssFirst: (val: string) => void;
  assSurname: string; setAssSurname: (val: string) => void;
  assAddress: string; setAssAddress: (val: string) => void;
  assQuals: string; setAssQuals: (val: string) => void;
  assDateOfReport: string; setAssDateOfReport: (val: string) => void;
  assPhone: string; setAssPhone: (val: string) => void;
  assEmail: string; setAssEmail: (val: string) => void;
  assIndemnity: string; setAssIndemnity: (val: string) => void;
  signatureUrl: string | null;
  pickAndUploadSignature: () => void;
  generateSignature: () => void;
  API_BASE: string;
  planPdfUrls: string[];
  pickAndUploadPlans: () => void;
  onDrivePlanPicked: (fileId: string, name: string, accessToken: string) => void;
  generateReport: () => void;
}

export default function SiteAssessorTab(props: SiteAssessorProps) {
  const {
    assCompany, setAssCompany, assPrefix, setAssPrefix, assFirst, setAssFirst,
    assSurname, setAssSurname, assAddress, setAssAddress, assQuals, setAssQuals,
    assDateOfReport, setAssDateOfReport, assPhone, setAssPhone, assEmail, setAssEmail,
    assIndemnity, setAssIndemnity, signatureUrl, pickAndUploadSignature, generateSignature,
    API_BASE, planPdfUrls, pickAndUploadPlans, onDrivePlanPicked, generateReport,
  } = props;

  const [drivePickerVisible, setDrivePickerVisible] = useState(false);

  return (
    <KeyboardAwareScrollView style={{ backgroundColor: Brand.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Card>
        <CardTitle>Assessor Details</CardTitle>
        <View style={{ gap: 14 }}>
          <FormInput label="Company" value={assCompany} onChangeText={setAssCompany} placeholder="Company name" />
          <PrefixPicker value={assPrefix} onChange={setAssPrefix} />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <FormInput label="First Name" value={assFirst} onChangeText={setAssFirst} placeholder="First name" />
            </View>
            <View style={{ flex: 1 }}>
              <FormInput label="Surname" value={assSurname} onChangeText={setAssSurname} placeholder="Surname" />
            </View>
          </View>
          <FormInput label="Address" value={assAddress} onChangeText={setAssAddress} placeholder="Full address" multiline />
          <FormInput label="Qualifications / Experience" value={assQuals} onChangeText={setAssQuals} placeholder="e.g. MSc (Env Eng), EPA Approved Site Assessor" />
        </View>
      </Card>

      <Card>
        <CardTitle>Contact</CardTitle>
        <View style={{ gap: 14 }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <FormInput label="Date of Report" value={assDateOfReport} onChangeText={setAssDateOfReport} placeholder="YYYY-MM-DD" />
            </View>
            <View style={{ flex: 1 }}>
              <FormInput label="Phone" value={assPhone} onChangeText={setAssPhone} keyboardType="phone-pad" placeholder="086 000 0000" />
            </View>
          </View>
          <FormInput label="E-mail" value={assEmail} onChangeText={setAssEmail} keyboardType="email-address" autoCapitalize="none" placeholder="name@example.com" />
          <FormInput label="Indemnity Insurance Number" value={assIndemnity} onChangeText={setAssIndemnity} placeholder="Policy number" />
        </View>
      </Card>

      <Card>
        <CardTitle>E-signature</CardTitle>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable onPress={pickAndUploadSignature} style={[styles.btn, styles.btnOutline, { flex: 1 }]}>
            <Text style={styles.btnOutlineText}>Upload image</Text>
          </Pressable>
          <Pressable onPress={generateSignature} style={[styles.btn, styles.btnFilled, { flex: 1 }]}>
            <Text style={styles.btnFilledText}>Generate from name</Text>
          </Pressable>
        </View>
        {signatureUrl ? (
          <View style={{ marginTop: 14 }}>
            <Text style={styles.previewLabel}>Preview</Text>
            <Image source={{ uri: `${API_BASE}${signatureUrl}` }} style={styles.signatureImage} resizeMode="contain" />
          </View>
        ) : null}
      </Card>

      <Card>
        <CardTitle>Attachments</CardTitle>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable onPress={pickAndUploadPlans} style={[styles.btn, styles.btnOutline, { flex: 1 }]}>
            <Text style={styles.btnOutlineText}>From Device</Text>
          </Pressable>
          <Pressable onPress={() => setDrivePickerVisible(true)} style={[styles.btn, styles.btnFilled, { flex: 1 }]}>
            <Text style={styles.btnFilledText}>Google Drive</Text>
          </Pressable>
        </View>
        {planPdfUrls.length > 0 && (
          <Text style={styles.attachedText}>{planPdfUrls.length} PDF(s) attached</Text>
        )}
        <GoogleDrivePicker
          visible={drivePickerVisible}
          onClose={() => setDrivePickerVisible(false)}
          onFilePicked={(fileId, name, token) => {
            setDrivePickerVisible(false);
            onDrivePlanPicked(fileId, name, token);
          }}
        />
      </Card>

      <PrimaryBtn title="Generate Report" onPress={generateReport} style={{ marginTop: 4 }} />
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  btn: { paddingVertical: 13, borderRadius: 12, alignItems: "center" },
  btnOutline: { borderWidth: 1.5, borderColor: Brand.border, backgroundColor: Brand.bg },
  btnOutlineText: { color: Brand.primary, fontFamily: Font.semibold, fontSize: 14 },
  btnFilled: { backgroundColor: Brand.primary },
  btnFilledText: { color: "#fff", fontFamily: Font.semibold, fontSize: 14 },
  previewLabel: { fontSize: 12, color: Brand.textMuted, marginBottom: 8, fontFamily: Font.medium, textTransform: "uppercase", letterSpacing: 0.4 },
  signatureImage: { width: "100%", height: 120, borderWidth: 1, borderColor: Brand.borderLight, borderRadius: 12, backgroundColor: "#fff" },
  attachedText: { marginTop: 12, fontSize: 14, color: Brand.primary, fontFamily: Font.medium },
});
