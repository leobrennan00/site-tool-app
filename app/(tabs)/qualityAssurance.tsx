import React from "react";
import { View } from "react-native";
import { Brand } from "@/constants/theme";
import { Card, CardTitle, FormInput } from "@/components/ui/kit";
import { KeyboardAwareScrollView } from "@/components/ui/KeyboardAwareScrollView";

interface QualityAssuranceProps {
  qaInstall: string;
  setQaInstall: (val: string) => void;
  qaMaintenance: string;
  setQaMaintenance: (val: string) => void;
}

export default function QualityAssuranceTab(props: QualityAssuranceProps) {
  const { qaInstall, setQaInstall, qaMaintenance, setQaMaintenance } = props;

  return (
    <KeyboardAwareScrollView style={{ backgroundColor: Brand.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Card>
        <CardTitle>Installation & Commissioning</CardTitle>
        <FormInput value={qaInstall} onChangeText={setQaInstall} multiline placeholder="Installation and commissioning requirements…" />
      </Card>

      <Card>
        <CardTitle>On-going Maintenance</CardTitle>
        <FormInput value={qaMaintenance} onChangeText={setQaMaintenance} multiline placeholder="Ongoing maintenance requirements…" />
      </Card>
    </KeyboardAwareScrollView>
  );
}
