import React from "react";
import { ScrollView, View, Platform } from "react-native";
import { Brand } from "@/constants/theme";
import { Card, CardTitle, FormInput, RadioGroup } from "@/components/ui/kit";

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
    dwwtsInstall, setDwwtsInstall, dwwtsDischargeTo, setDwwtsDischargeTo,
    invertLevel, setInvertLevel, siteSpecificConditions, setSiteSpecificConditions,
  } = props;

  const installOptions = [
    "Septic tank system (septic tank and percolation area)",
    "Secondary Treatment System and soil polishing filter",
    "Tertiary Treatment System and Infiltration /treatment area",
  ];

  return (
    <ScrollView style={{ backgroundColor: Brand.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Card>
        <CardTitle>Propose to install</CardTitle>
        <RadioGroup
          value={dwwtsInstall || null}
          onChange={(v) => setDwwtsInstall(v)}
          options={installOptions.map((o) => ({ label: o, value: o }))}
        />
      </Card>

      <Card>
        <CardTitle>and discharge to</CardTitle>
        <RadioGroup
          value={dwwtsDischargeTo || null}
          onChange={(v) => setDwwtsDischargeTo(v)}
          options={[
            { label: "Ground Water", value: "Ground Water" },
            { label: "Surface Water", value: "Surface Water" },
          ]}
        />
      </Card>

      <Card>
        <CardTitle>System Configuration</CardTitle>
        <View style={{ gap: 14 }}>
          <FormInput
            label="Invert level of the trench/bed gravel or drip tubing (m)"
            value={invertLevel}
            onChangeText={setInvertLevel}
            keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "numeric"}
            placeholder="e.g. -0.40"
          />
          <FormInput
            label="Site Specific Conditions"
            value={siteSpecificConditions}
            onChangeText={setSiteSpecificConditions}
            multiline
            placeholder="Special works, site improvement works, testing, etc."
          />
        </View>
      </Card>
    </ScrollView>
  );
}
