import React from "react";
import { ScrollView, View } from "react-native";
import { Brand } from "@/constants/theme";
import { Card, CardTitle, FormInput, RadioGroup } from "@/components/ui/kit";

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
    fileRef, setFileRef, prefix, setPrefix, firstName, setFirstName,
    surname, setSurname, address, setAddress, siteLocation, setSiteLocation,
    bedrooms, setBedrooms, residents, setResidents,
    populationEquivalent, setPopulationEquivalent,
    waterSupply, setWaterSupply, privateWellDetail, setPrivateWellDetail,
  } = props;

  return (
    <ScrollView style={{ backgroundColor: Brand.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Card>
        <CardTitle>File Reference</CardTitle>
        <FormInput label="File Reference" value={fileRef} onChangeText={setFileRef} placeholder="e.g. EPC-25028" autoCapitalize="characters" />
      </Card>

      <Card>
        <CardTitle>Client Details</CardTitle>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          <View style={{ flex: 1 }}>
            <FormInput label="Prefix" value={prefix} onChangeText={setPrefix} placeholder="Mr/Ms/Dr" autoCapitalize="words" />
          </View>
          <View style={{ flex: 2 }}>
            <FormInput label="First Name" value={firstName} onChangeText={setFirstName} placeholder="John" autoCapitalize="words" />
          </View>
          <View style={{ flex: 2 }}>
            <FormInput label="Surname" value={surname} onChangeText={setSurname} placeholder="O'Brien" autoCapitalize="words" />
          </View>
        </View>
        <FormInput label="Address" value={address} onChangeText={setAddress} placeholder="Street, Town, County" multiline />
      </Card>

      <Card>
        <CardTitle>Site Details</CardTitle>
        <View style={{ marginBottom: 14 }}>
          <FormInput label="Site Location & Townland" value={siteLocation} onChangeText={setSiteLocation} placeholder="e.g. Townland, County" />
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <FormInput label="Bedrooms" value={bedrooms} onChangeText={setBedrooms} keyboardType="numeric" placeholder="4" />
          </View>
          <View style={{ flex: 1 }}>
            <FormInput label="Max Residents" value={residents} onChangeText={setResidents} keyboardType="numeric" placeholder="6" />
          </View>
        </View>
        <View style={{ marginTop: 14 }}>
          <FormInput
            label="Comments on Population Equivalent"
            value={populationEquivalent}
            onChangeText={setPopulationEquivalent}
            placeholder="e.g. 6 PE based on 4 bedroom house"
            multiline
          />
        </View>
      </Card>

      <Card>
        <CardTitle>Water Supply</CardTitle>
        <RadioGroup
          label="Proposed Water Supply"
          value={waterSupply}
          onChange={(v) => setWaterSupply(v)}
          options={[
            { label: "Mains", value: "Mains" },
            { label: "Private", value: "Private" },
            { label: "Group", value: "Group" },
          ]}
        />
        {waterSupply === "Private" && (
          <View style={{ marginTop: 14 }}>
            <RadioGroup
              label="Private Well / Borehole Detail"
              value={privateWellDetail}
              onChange={(v) => setPrivateWellDetail(v)}
              options={[
                { label: "Existing well on-site", value: "Existing well on-site" },
                { label: "To be bored on-site", value: "To be bored on-site" },
              ]}
            />
          </View>
        )}
      </Card>
    </ScrollView>
  );
}
