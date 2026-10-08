import React from "react";
import { ScrollView, View, Platform } from "react-native";
import { Brand } from "@/constants/theme";
import { Card, CardTitle, FormInput, RadioGroup } from "@/components/ui/kit";
import { DWWTS_INSTALL_OPTIONS } from "@/lib/designRules/epaCop2021";

interface SelectedDwwtsProps {
  dwwtsInstall: string;
  setDwwtsInstall: (val: string) => void;
  dwwtsDischargeTo: string;
  setDwwtsDischargeTo: (val: string) => void;
  invertLevel: string;
  setInvertLevel: (val: string) => void;
  siteSpecificConditions: string;
  setSiteSpecificConditions: (val: string) => void;
  /** Short explanation of where the Site Specific Conditions paragraph
   *  suggestion came from (or why there isn't one yet) — see
   *  lib/designRules/dwwtsSizing.ts. */
  siteSpecificConditionsHint?: string;
}

export default function SelectedDwwtsTab(props: SelectedDwwtsProps) {
  const {
    dwwtsInstall, setDwwtsInstall, dwwtsDischargeTo, setDwwtsDischargeTo,
    invertLevel, setInvertLevel, siteSpecificConditions, setSiteSpecificConditions,
    siteSpecificConditionsHint,
  } = props;

  const installOptions = [
    DWWTS_INSTALL_OPTIONS.septicTank,
    DWWTS_INSTALL_OPTIONS.secondaryAndPolishingFilter,
    DWWTS_INSTALL_OPTIONS.tertiary,
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
            // A single house is never permitted to discharge to surface
            // water — greyed out rather than removed, so it's still clear
            // what the other option is.
            { label: "Surface Water (not used for a single house)", value: "Surface Water", disabled: true },
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
            hint={siteSpecificConditionsHint}
          />
        </View>
      </Card>
    </ScrollView>
  );
}
