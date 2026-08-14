import React from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { Brand, Font } from "@/constants/theme";
import { Card, CardTitle, FormInput, CheckRow, RadioGroup } from "@/components/ui/kit";

interface ConclusionProps {
  slope: string;
  setSlope: (val: string) => void;
  sepDistancesMet: boolean;
  setSepDistancesMet: (val: boolean) => void;
  unsatDepth: string;
  setUnsatDepth: (val: string) => void;
  sPV: number | null;
  ssPV: number | null;
  suitableForDevelopment: boolean;
  setSuitableForDevelopment: (val: boolean) => void;
  optSepticTank: boolean;
  setOptSepticTank: (val: boolean) => void;
  optSecondary: boolean;
  setOptSecondary: (val: boolean) => void;
  optTertiary: boolean;
  setOptTertiary: (val: boolean) => void;
  dischargeRoute: string;
  setDischargeRoute: (val: string) => void;
  setCDirty: (val: any) => void;
}

export default function ConclusionTab(props: ConclusionProps) {
  const {
    slope, setSlope, sepDistancesMet, setSepDistancesMet, unsatDepth, setUnsatDepth,
    sPV, ssPV, suitableForDevelopment, setSuitableForDevelopment,
    optSepticTank, setOptSepticTank, optSecondary, setOptSecondary,
    optTertiary, setOptTertiary, dischargeRoute, setDischargeRoute, setCDirty,
  } = props;

  return (
    <ScrollView style={{ backgroundColor: Brand.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Derived value tiles */}
      <View style={styles.tileRow}>
        <View style={styles.tile}>
          <Text style={styles.tileLabel}>Surface PV</Text>
          <Text style={styles.tileValue}>{sPV != null ? sPV.toFixed(2) : "—"}</Text>
        </View>
        <View style={styles.tile}>
          <Text style={styles.tileLabel}>Subsurface PV</Text>
          <Text style={styles.tileValue}>{ssPV != null ? ssPV.toFixed(2) : "—"}</Text>
        </View>
        <View style={styles.tile}>
          <Text style={styles.tileLabel}>Slope</Text>
          <Text style={styles.tileValueSm} numberOfLines={2}>{slope || "—"}</Text>
        </View>
      </View>

      <Card>
        <CardTitle>Site Conditions</CardTitle>
        <View style={{ gap: 14 }}>
          <FormInput
            label="Slope of proposed infiltration / treatment area"
            value={slope}
            onChangeText={setSlope}
            placeholder="e.g. Relatively flat / Shallow / Steep"
          />
          <CheckRow
            label="All minimum separation distances met"
            checked={sepDistancesMet}
            onToggle={() => {
              setSepDistancesMet(!sepDistancesMet);
              setCDirty((prev: any) => ({ ...prev, sepDistancesMet: true }));
            }}
          />
          <FormInput
            label="Depth of unsaturated soil/subsoil beneath invert (m)"
            value={unsatDepth}
            onChangeText={setUnsatDepth}
            keyboardType="numeric"
            placeholder="e.g. 0.90"
          />
        </View>
      </Card>

      <Card>
        <CardTitle>Suitability</CardTitle>
        <RadioGroup
          value={suitableForDevelopment ? "yes" : "no"}
          onChange={(v) => setSuitableForDevelopment(v === "yes")}
          options={[
            { label: "Suitable for Development", value: "yes" },
            { label: "Not Suitable for Development", value: "no" },
          ]}
        />
        <Text style={[styles.note, { marginTop: 14 }]}>Select all applicable treatment options</Text>
        <View style={{ gap: 8 }}>
          <CheckRow label="Septic tank system" checked={optSepticTank} onToggle={() => setOptSepticTank(!optSepticTank)} />
          <CheckRow label="Secondary treatment + polishing filter" checked={optSecondary} onToggle={() => setOptSecondary(!optSecondary)} />
          <CheckRow label="Tertiary + infiltration/treatment area" checked={optTertiary} onToggle={() => setOptTertiary(!optTertiary)} />
        </View>
      </Card>

      <Card>
        <CardTitle>Discharge Route</CardTitle>
        <FormInput value={dischargeRoute} onChangeText={setDischargeRoute} multiline placeholder="e.g. Via subsoil to groundwater" />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tileRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  tile: {
    flex: 1, backgroundColor: Brand.surface, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: Brand.borderLight, alignItems: "center",
  },
  tileLabel: { fontSize: 10, fontFamily: Font.bold, color: Brand.textMuted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6, textAlign: "center" },
  tileValue: { fontSize: 22, fontFamily: Font.bold, color: Brand.primary },
  tileValueSm: { fontSize: 13, fontFamily: Font.semibold, color: Brand.text, textAlign: "center" },
  note: { fontSize: 12, color: Brand.textMuted, marginBottom: 10, fontFamily: Font.regular },
});
