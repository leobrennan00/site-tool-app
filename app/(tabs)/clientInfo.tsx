import React from "react";
import { ScrollView, View, Text, TextInput, StyleSheet, Pressable } from "react-native";

interface ClientInfoProps {
  fileRef: string;
  setFileRef: (val: string) => void;
  prefix: string;
  setPrefix: (val: string) => void;
  firstName: string;
  setFirstName: (val: string) => void;
  surname: string;
  setSurname: (val: string) => void;
  address: string;
  setAddress: (val: string) => void;
  siteLocation: string;
  setSiteLocation: (val: string) => void;
  bedrooms: string;
  setBedrooms: (val: string) => void;
  residents: string;
  setResidents: (val: string) => void;
  populationEquivalent: string;
  setPopulationEquivalent: (val: string) => void;
  waterSupply: "Mains" | "Private" | "Group" | null;
  setWaterSupply: (val: "Mains" | "Private" | "Group" | null) => void;
  privateWellDetail: "Existing well on-site" | "To be bored on-site" | null;
  setPrivateWellDetail: (val: "Existing well on-site" | "To be bored on-site" | null) => void;
}

export default function ClientInfoTab(props: ClientInfoProps) {
  const {
    fileRef,
    setFileRef,
    prefix,
    setPrefix,
    firstName,
    setFirstName,
    surname,
    setSurname,
    address,
    setAddress,
    siteLocation,
    setSiteLocation,
    bedrooms,
    setBedrooms,
    residents,
    setResidents,
    populationEquivalent,
    setPopulationEquivalent,
    waterSupply,
    setWaterSupply,
    privateWellDetail,
    setPrivateWellDetail,
  } = props;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Text style={styles.title}>Client & Site Information</Text>
        <Text style={styles.subtitle}>
          General details from planning application
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>File & Client Details</Text>

        <View style={styles.row}>
          <Text style={styles.label}>File Reference</Text>
          <TextInput
            style={styles.input}
            value={fileRef}
            onChangeText={setFileRef}
            placeholder="e.g. EPC-25028"
            autoCapitalize="characters"
          />
        </View>

        <View style={[styles.row, { flexDirection: "row", gap: 8 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Prefix</Text>
            <TextInput
              style={styles.input}
              value={prefix}
              onChangeText={setPrefix}
              placeholder="Mr / Ms / Dr"
              autoCapitalize="words"
            />
          </View>
          <View style={{ flex: 2 }}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="John Paul"
              autoCapitalize="words"
            />
          </View>
          <View style={{ flex: 2 }}>
            <Text style={styles.label}>Surname</Text>
            <TextInput
              style={styles.input}
              value={surname}
              onChangeText={setSurname}
              placeholder="Dixon"
              autoCapitalize="words"
            />
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={address}
            onChangeText={setAddress}
            placeholder="Street, Town, County"
            multiline
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Site Location & Townland</Text>
          <TextInput
            style={styles.input}
            value={siteLocation}
            onChangeText={setSiteLocation}
            placeholder="e.g. Townland, County"
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Property Details</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Number of Bedrooms</Text>
          <TextInput
            style={styles.input}
            value={bedrooms}
            onChangeText={setBedrooms}
            keyboardType="numeric"
            placeholder="e.g. 3"
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Max Number of Residents</Text>
          <TextInput
            style={styles.input}
            value={residents}
            onChangeText={setResidents}
            keyboardType="numeric"
            placeholder="e.g. 5"
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Comments on Population Equivalent</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={populationEquivalent}
            onChangeText={setPopulationEquivalent}
            placeholder="e.g. Population equivalent: 6 PE based on 4 bedroom house"
            multiline
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Water Supply</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Proposed Water Supply</Text>
          {["Mains", "Private", "Group"].map((opt) => (
            <Pressable
              key={opt}
              onPress={() => setWaterSupply(opt as any)}
              style={styles.radioOption}
            >
              <View style={styles.radioCircle}>
                {waterSupply === opt && <View style={styles.radioSelected} />}
              </View>
              <Text style={styles.radioLabel}>{opt}</Text>
            </Pressable>
          ))}
        </View>

        {waterSupply === "Private" && (
          <View style={styles.row}>
            <Text style={styles.label}>Private Well / Borehole Detail</Text>
            {["Existing well on-site", "To be bored on-site"].map((opt) => (
              <Pressable
                key={opt}
                onPress={() => setPrivateWellDetail(opt as any)}
                style={styles.radioOption}
              >
                <View style={styles.radioCircle}>
                  {privateWellDetail === opt && <View style={styles.radioSelected} />}
                </View>
                <Text style={styles.radioLabel}>{opt}</Text>
              </Pressable>
            ))}
          </View>
        )}
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
  multilineInput: {
    height: 90,
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
  radioLabel: {
    fontSize: 15,
    color: "#333",
  },
});
