import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Brand, Font } from "@/constants/theme";
import { Card, CardTitle, FormInput, RadioGroup, CheckRow, InfoBanner } from "@/components/ui/kit";
import { KeyboardAwareScrollView } from "@/components/ui/KeyboardAwareScrollView";

interface DeskStudyProps {
  soilType: string;
  setSoilType: (val: string) => void;
  subsoilType: string;
  setSubsoilType: (val: string) => void;
  bedrockType: string;
  setBedrockType: (val: string) => void;
  aquiferCategory: "Regionally Important" | "Locally Important" | "Poor" | null;
  setAquiferCategory: (val: "Regionally Important" | "Locally Important" | "Poor" | null) => void;
  aquiferCode: string;
  setAquiferCode: (val: string) => void;
  vulnerability: "Extreme" | "High" | "Moderate" | "Low" | null;
  setVulnerability: (val: "Extreme" | "High" | "Moderate" | "Low" | null) => void;
  gwBody: string;
  setGwBody: (val: string) => void;
  gwStatus: "Good" | "Poor" | null;
  setGwStatus: (val: "Good" | "Poor" | null) => void;
  nearbySupply: string;
  setNearbySupply: (val: string) => void;
  spaZOC: boolean;
  setSpaZOC: (val: boolean) => void;
  spaSI: boolean;
  setSpaSI: (val: boolean) => void;
  spaSO: boolean;
  setSpaSO: (val: boolean) => void;
  gwProtectionResponse: string;
  setGwProtectionResponse: (val: string) => void;
  significantSites: string;
  setSignificantSites: (val: string) => void;
  pastExperience: string;
  setPastExperience: (val: string) => void;
  deskComments: string;
  setDeskComments: (val: string) => void;
  /** GWPR the app derives from aquifer + vulnerability (+ SPA), or null if
   *  it can't — and the one-line explanation either way. */
  gwprSuggested?: string | null;
  /** GSI category label at the site, e.g. "Extreme (X) – rock at or near surface or karst". */
  vulnerabilityGsiLabel?: string;
  gwprReason?: string;
}

export default function DeskStudyTab(props: DeskStudyProps) {
  const {
    soilType, setSoilType, subsoilType, setSubsoilType, bedrockType, setBedrockType,
    aquiferCategory, setAquiferCategory, aquiferCode, setAquiferCode,
    vulnerability, setVulnerability, gwBody, setGwBody, gwStatus, setGwStatus,
    nearbySupply, setNearbySupply, spaZOC, setSpaZOC, spaSI, setSpaSI, spaSO, setSpaSO,
    gwProtectionResponse, setGwProtectionResponse, significantSites, setSignificantSites,
    pastExperience, setPastExperience, deskComments, setDeskComments,
    gwprSuggested, gwprReason, vulnerabilityGsiLabel,
  } = props;

  const codeOptions =
    aquiferCategory === "Regionally Important" ? ["Rf", "Rf/Rk", "Rg", "Rk"]
    : aquiferCategory === "Locally Important" ? ["Lk", "Ll", "Lm"]
    : aquiferCategory === "Poor" ? ["Pl", "Pu"]
    : [];

  return (
    <KeyboardAwareScrollView style={{ backgroundColor: Brand.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <InfoBanner>Auto-filled from the site GPS — please review each field.</InfoBanner>

      <Card>
        <CardTitle>Soils & Geology</CardTitle>
        <View style={{ gap: 14 }}>
          <FormInput label="Soil Type" value={soilType} onChangeText={setSoilType} placeholder="e.g. Till derived from limestone" />
          <FormInput label="Subsoil Type" value={subsoilType} onChangeText={setSubsoilType} placeholder="e.g. Till derived from limestone" />
          <FormInput label="Bedrock Type" value={bedrockType} onChangeText={setBedrockType} placeholder="e.g. Waulsortian Limestones" />
        </View>
      </Card>

      <Card>
        <CardTitle>Aquifer</CardTitle>
        <RadioGroup
          label="Aquifer Category"
          value={aquiferCategory}
          onChange={(v) => setAquiferCategory(v)}
          options={[
            { label: "Regionally Important", value: "Regionally Important" },
            { label: "Locally Important", value: "Locally Important" },
            { label: "Poor", value: "Poor" },
          ]}
        />
        {codeOptions.length > 0 && (
          <View style={{ marginTop: 14 }}>
            <Text style={styles.label}>Aquifer Code</Text>
            <View style={styles.chipContainer}>
              {codeOptions.map((code) => {
                const active = aquiferCode === code;
                return (
                  <Pressable key={code} onPress={() => setAquiferCode(code)} style={[styles.chip, active && styles.chipSelected]}>
                    <Text style={[styles.chipText, active && styles.chipTextSelected]}>{code}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
        <View style={{ marginTop: 14 }}>
          <RadioGroup
            label="Vulnerability"
            value={vulnerability}
            onChange={(v) => setVulnerability(v)}
            options={[
              { label: "Extreme", value: "Extreme" },
              { label: "High", value: "High" },
              { label: "Moderate", value: "Moderate" },
              { label: "Low", value: "Low" },
            ]}
          />
          {vulnerabilityGsiLabel ? (
            <Text style={styles.hint}>GSI map at site: {vulnerabilityGsiLabel}</Text>
          ) : null}
        </View>
      </Card>

      <Card>
        <CardTitle>Groundwater</CardTitle>
        <View style={{ marginBottom: 14 }}>
          <FormInput label="Groundwater Body" value={gwBody} onChangeText={setGwBody} placeholder="e.g. Crusheen IE_SH_G_071" />
        </View>
        <RadioGroup
          label="Status"
          value={gwStatus}
          onChange={(v) => setGwStatus(v)}
          options={[{ label: "Good", value: "Good" }, { label: "Poor", value: "Poor" }]}
        />
        <View style={{ marginTop: 14 }}>
          <FormInput label="Water Supply within 1 km" value={nearbySupply} onChangeText={setNearbySupply} placeholder="e.g. None" />
        </View>
        <View style={{ marginTop: 14 }}>
          <Text style={styles.label}>Source Protection Area</Text>
          <View style={{ gap: 8 }}>
            <CheckRow label="ZOC (Zone of Contribution)" checked={spaZOC} onToggle={() => setSpaZOC(!spaZOC)} />
            <CheckRow label="SI (Inner Source)" checked={spaSI} onToggle={() => setSpaSI(!spaSI)} />
            <CheckRow label="SO (Outer Source)" checked={spaSO} onToggle={() => setSpaSO(!spaSO)} />
          </View>
        </View>
        <View style={{ marginTop: 14 }}>
          <Text style={styles.label}>Groundwater Protection Response</Text>
          <View style={styles.chipContainer}>
            {["R1", "R2¹", "R2²", "R2³", "R2⁴", "R2", "R3¹", "R3²", "R4"].map((code) => {
              const active = gwProtectionResponse === code;
              return (
                <Pressable key={code} onPress={() => setGwProtectionResponse(code)} style={[styles.chip, active && styles.chipSelected]}>
                  <Text style={[styles.chipText, active && styles.chipTextSelected]}>{code}</Text>
                </Pressable>
              );
            })}
          </View>
          {/* Never a silent blank: either how the value was derived, or a
              clear prompt to pick one manually. Hidden once the assessor has
              chosen a different value themselves, so it can't mislead. */}
          {gwprReason && (!gwProtectionResponse || gwProtectionResponse === gwprSuggested) ? (
            <Text style={gwprSuggested ? styles.hint : styles.hintWarn}>{gwprReason}</Text>
          ) : null}
        </View>
      </Card>

      <Card>
        <CardTitle>Comments</CardTitle>
        <View style={{ gap: 14 }}>
          <FormInput label="Significant Sites Nearby" value={significantSites} onChangeText={setSignificantSites} placeholder="e.g. None within 1 km" />
          <FormInput label="Past Experience in Area" value={pastExperience} onChangeText={setPastExperience} placeholder="e.g. Soil generally free-draining" multiline />
          <FormInput label="Desk Study Comments" value={deskComments} onChangeText={setDeskComments} placeholder="Optional notes…" multiline />
        </View>
      </Card>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontFamily: Font.bold, color: Brand.textSub, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 },
  chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: Brand.border, backgroundColor: Brand.bg,
  },
  chipSelected: { borderColor: Brand.primary, backgroundColor: Brand.primaryTint },
  chipText: { fontSize: 13, color: Brand.text, fontFamily: Font.medium },
  chipTextSelected: { color: Brand.primaryDark, fontFamily: Font.semibold },
  hint: { fontSize: 11, fontFamily: Font.regular, color: Brand.textMuted, marginTop: 8 },
  hintWarn: { fontSize: 12, fontFamily: Font.semibold, color: Brand.amber, marginTop: 8 },
});
