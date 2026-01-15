import React from "react";
import { ScrollView, View, Text, TextInput, StyleSheet, Pressable } from "react-native";

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
}

export default function DeskStudyTab(props: DeskStudyProps) {
  const {
    soilType, setSoilType,
    subsoilType, setSubsoilType,
    bedrockType, setBedrockType,
    aquiferCategory, setAquiferCategory,
    aquiferCode, setAquiferCode,
    vulnerability, setVulnerability,
    gwBody, setGwBody,
    gwStatus, setGwStatus,
    nearbySupply, setNearbySupply,
    spaZOC, setSpaZOC,
    spaSI, setSpaSI,
    spaSO, setSpaSO,
    gwProtectionResponse, setGwProtectionResponse,
    significantSites, setSignificantSites,
    pastExperience, setPastExperience,
    deskComments, setDeskComments,
  } = props;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Text style={styles.title}>Desk Study</Text>
        <Text style={styles.subtitle}>
          Site geology and environmental details
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Geology</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Soil Type</Text>
          <TextInput
            style={styles.input}
            value={soilType}
            onChangeText={setSoilType}
            placeholder="e.g. Till derived chiefly from limestone"
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Subsoil Type</Text>
          <TextInput
            style={styles.input}
            value={subsoilType}
            onChangeText={setSubsoilType}
            placeholder="e.g. Till derived from limestone"
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Bedrock Type</Text>
          <TextInput
            style={styles.input}
            value={bedrockType}
            onChangeText={setBedrockType}
            placeholder="e.g. Waulsortian Limestones"
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Aquifer Information</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Aquifer Category</Text>
          {["Regionally Important", "Locally Important", "Poor"].map((opt) => (
            <Pressable
              key={opt}
              onPress={() => setAquiferCategory(opt as any)}
              style={styles.radioOption}
            >
              <View style={styles.radioCircle}>
                {aquiferCategory === opt && <View style={styles.radioSelected} />}
              </View>
              <Text style={styles.radioLabel}>{opt}</Text>
            </Pressable>
          ))}
        </View>

        {aquiferCategory === "Regionally Important" && (
          <View style={styles.subSection}>
            <Text style={styles.subLabel}>Regionally Important Code</Text>
            {["Rf", "Rg", "Rk"].map((code) => (
              <Pressable
                key={code}
                onPress={() => setAquiferCode(code)}
                style={styles.radioOption}
              >
                <View style={styles.radioCircleSmall}>
                  {aquiferCode === code && <View style={styles.radioSelectedSmall} />}
                </View>
                <Text style={styles.radioLabel}>{code}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {aquiferCategory === "Locally Important" && (
          <View style={styles.subSection}>
            <Text style={styles.subLabel}>Locally Important Code</Text>
            {["Lg", "Ll", "Lm"].map((code) => (
              <Pressable
                key={code}
                onPress={() => setAquiferCode(code)}
                style={styles.radioOption}
              >
                <View style={styles.radioCircleSmall}>
                  {aquiferCode === code && <View style={styles.radioSelectedSmall} />}
                </View>
                <Text style={styles.radioLabel}>{code}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {aquiferCategory === "Poor" && (
          <View style={styles.subSection}>
            <Text style={styles.subLabel}>Poor Aquifer Code</Text>
            {["Pl", "Pu"].map((code) => (
              <Pressable
                key={code}
                onPress={() => setAquiferCode(code)}
                style={styles.radioOption}
              >
                <View style={styles.radioCircleSmall}>
                  {aquiferCode === code && <View style={styles.radioSelectedSmall} />}
                </View>
                <Text style={styles.radioLabel}>{code}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.row}>
          <Text style={styles.label}>Vulnerability</Text>
          {["Extreme", "High", "Moderate", "Low"].map((opt) => (
            <Pressable
              key={opt}
              onPress={() => setVulnerability(opt as any)}
              style={styles.radioOption}
            >
              <View style={styles.radioCircle}>
                {vulnerability === opt && <View style={styles.radioSelected} />}
              </View>
              <Text style={styles.radioLabel}>{opt}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Groundwater</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Groundwater Body</Text>
          <TextInput
            style={styles.input}
            value={gwBody}
            onChangeText={setGwBody}
            placeholder="e.g. Crusheen IE_SH_G_071"
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Status</Text>
          {["Good", "Poor"].map((opt) => (
            <Pressable
              key={opt}
              onPress={() => setGwStatus(opt as any)}
              style={styles.radioOption}
            >
              <View style={styles.radioCircle}>
                {gwStatus === opt && <View style={styles.radioSelected} />}
              </View>
              <Text style={styles.radioLabel}>{opt}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Water Supply within 1 km</Text>
          <TextInput
            style={styles.input}
            value={nearbySupply}
            onChangeText={setNearbySupply}
            placeholder="e.g. None"
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Source Protection Area</Text>
          <Pressable
            onPress={() => setSpaZOC(!spaZOC)}
            style={styles.checkboxOption}
          >
            <View style={styles.checkbox}>
              {spaZOC && <View style={styles.checkboxSelected} />}
            </View>
            <Text style={styles.radioLabel}>ZOC</Text>
          </Pressable>
          <Pressable
            onPress={() => setSpaSI(!spaSI)}
            style={styles.checkboxOption}
          >
            <View style={styles.checkbox}>
              {spaSI && <View style={styles.checkboxSelected} />}
            </View>
            <Text style={styles.radioLabel}>SI</Text>
          </Pressable>
          <Pressable
            onPress={() => setSpaSO(!spaSO)}
            style={styles.checkboxOption}
          >
            <View style={styles.checkbox}>
              {spaSO && <View style={styles.checkboxSelected} />}
            </View>
            <Text style={styles.radioLabel}>SO</Text>
          </Pressable>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Groundwater Protection Response</Text>
          <View style={styles.chipContainer}>
            {["R1", "R2¹", "R2²", "R2³", "R2", "R3¹", "R3²", "R4"].map((code) => (
              <Pressable
                key={code}
                onPress={() => setGwProtectionResponse(code)}
                style={[
                  styles.chip,
                  gwProtectionResponse === code && styles.chipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    gwProtectionResponse === code && styles.chipTextSelected,
                  ]}
                >
                  {code}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Additional Information</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Significant Sites Nearby</Text>
          <TextInput
            style={styles.input}
            value={significantSites}
            onChangeText={setSignificantSites}
            placeholder="e.g. None within 1 km"
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Past Experience in Area</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={pastExperience}
            onChangeText={setPastExperience}
            placeholder="e.g. Soil generally free-draining"
            multiline
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Desk Study Comments</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={deskComments}
            onChangeText={setDeskComments}
            placeholder="Optional notes..."
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
  subLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#555",
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
  multilineInput: {
    height: 120,
    textAlignVertical: "top",
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#4A90E2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4A90E2",
  },
  radioCircleSmall: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#4A90E2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  radioSelectedSmall: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4A90E2",
  },
  radioLabel: {
    fontSize: 15,
    color: "#333",
  },
  checkboxOption: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#4A90E2",
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    width: 12,
    height: 12,
    backgroundColor: "#4A90E2",
  },
  subSection: {
    marginLeft: 24,
    marginTop: 8,
    marginBottom: 16,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#CCC",
    backgroundColor: "#FFF",
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    borderColor: "#4A90E2",
    backgroundColor: "#E6F0FF",
  },
  chipText: {
    fontSize: 13,
    color: "#333",
  },
  chipTextSelected: {
    color: "#4A90E2",
    fontWeight: "500",
  },
});
