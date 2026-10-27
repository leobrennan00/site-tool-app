import React from "react";
import { View } from "react-native";
import { Brand } from "@/constants/theme";
import { Card, CardTitle, FormInput } from "@/components/ui/kit";
import { KeyboardAwareScrollView } from "@/components/ui/KeyboardAwareScrollView";
import { SuggestionNote } from "@/components/ui/SuggestionNote";

interface QualityAssuranceProps {
  qaInstall: string;
  setQaInstall: (val: string) => void;
  qaMaintenance: string;
  setQaMaintenance: (val: string) => void;
  qaInstallSuggestion?: string | null;
  qaMaintenanceSuggestion?: string | null;
}

export default function QualityAssuranceTab(props: QualityAssuranceProps) {
  const { qaInstall, setQaInstall, qaMaintenance, setQaMaintenance, qaInstallSuggestion, qaMaintenanceSuggestion } = props;

  return (
    <KeyboardAwareScrollView style={{ backgroundColor: Brand.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Card>
        <CardTitle>Installation & Commissioning</CardTitle>
        <FormInput value={qaInstall} onChangeText={setQaInstall} multiline placeholder="Installation and commissioning requirements…" />
        <SuggestionNote value={qaInstall} suggestion={qaInstallSuggestion ?? null} onUse={setQaInstall}
          missing="Choose the system in Selected DWWTS to get the standard wording." />
      </Card>

      <Card>
        <CardTitle>On-going Maintenance</CardTitle>
        <FormInput value={qaMaintenance} onChangeText={setQaMaintenance} multiline placeholder="Ongoing maintenance requirements…" />
        <SuggestionNote value={qaMaintenance} suggestion={qaMaintenanceSuggestion ?? null} onUse={setQaMaintenance} />
      </Card>
    </KeyboardAwareScrollView>
  );
}
