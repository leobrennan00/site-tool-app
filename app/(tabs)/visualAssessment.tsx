import React from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { Brand, Font } from "@/constants/theme";
import { Card, CardTitle, FormInput, CheckRow } from "@/components/ui/kit";
import { SLOPE_OPTIONS } from "@/lib/designRules/epaCop2021";

interface VisualAssessmentProps {
  landscapePosition: string; setLandscapePosition: (v: string) => void;
  slope: string; setSlope: (v: string) => void;
  slopeComment: string; setSlopeComment: (v: string) => void;
  houses250m: string; setHouses250m: (v: string) => void;
  existingLandUse: string; setExistingLandUse: (v: string) => void;
  vegIndicators: string; setVegIndicators: (v: string) => void;
  gwFlowDirection: string; setGwFlowDirection: (v: string) => void;
  groundCondition: string; setGroundCondition: (v: string) => void;
  siteBoundaries: string; setSiteBoundaries: (v: string) => void;
  roads: string; setRoads: (v: string) => void;
  outcrops: string; setOutcrops: (v: string) => void;
  ponding: string; setPonding: (v: string) => void;
  lakes: string; setLakes: (v: string) => void;
  beachesShellfish: string; setBeachesShellfish: (v: string) => void;
  wetlands: string; setWetlands: (v: string) => void;
  karstFeatures: string; setKarstFeatures: (v: string) => void;
  watercourses: string; setWatercourses: (v: string) => void;
  drainageDitches: string; setDrainageDitches: (v: string) => void;
  springs: string; setSprings: (v: string) => void;
  wellsText: string; setWellsText: (v: string) => void;
  visualComments: string; setVisualComments: (v: string) => void;
}

export default function VisualAssessmentTab(props: VisualAssessmentProps) {
  const {
    landscapePosition, setLandscapePosition, slope, setSlope, slopeComment, setSlopeComment,
    houses250m, setHouses250m, existingLandUse, setExistingLandUse, vegIndicators, setVegIndicators,
    gwFlowDirection, setGwFlowDirection, groundCondition, setGroundCondition, siteBoundaries, setSiteBoundaries,
    roads, setRoads, outcrops, setOutcrops, ponding, setPonding, lakes, setLakes,
    beachesShellfish, setBeachesShellfish, wetlands, setWetlands, karstFeatures, setKarstFeatures,
    watercourses, setWatercourses, drainageDitches, setDrainageDitches, springs, setSprings,
    wellsText, setWellsText, visualComments, setVisualComments,
  } = props;

  const slopeOpt = (val: string, label: string) => (
    <CheckRow label={label} checked={slope === val} onToggle={() => setSlope(slope === val ? "" : val)} />
  );

  return (
    <ScrollView style={{ backgroundColor: Brand.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Card>
        <CardTitle>Landscape & Terrain</CardTitle>
        <View style={{ gap: 14 }}>
          <FormInput label="Landscape Position" value={landscapePosition} onChangeText={setLandscapePosition} placeholder="e.g. Mid-slope / Hilltop / Valley floor" />
          <View>
            <Text style={styles.label}>Slope</Text>
            <View style={{ gap: 8 }}>
              {slopeOpt(SLOPE_OPTIONS.steep, "Steep (>1.5)")}
              {slopeOpt(SLOPE_OPTIONS.shallow, "Shallow (1.5–1:20)")}
              {slopeOpt(SLOPE_OPTIONS.relativelyFlat, "Relatively Flat (<1:20)")}
            </View>
          </View>
          <FormInput label="Slope Comment" value={slopeComment} onChangeText={setSlopeComment} placeholder="e.g. Slight gradient to the south" />
          <FormInput label="Houses (within 250 m)" value={houses250m} onChangeText={setHouses250m} placeholder="e.g. ~5 houses; nearest ~110 m NE" multiline />
          <FormInput label="Existing Land Use" value={existingLandUse} onChangeText={setExistingLandUse} placeholder="e.g. Pasture / Tillage / Woodland" />
          <FormInput label="Vegetation Indicators" value={vegIndicators} onChangeText={setVegIndicators} placeholder="e.g. Rushes present, improved grassland" multiline />
          <FormInput label="Groundwater Flow Direction" value={gwFlowDirection} onChangeText={setGwFlowDirection} placeholder="e.g. Slight gradient to the south" />
          <FormInput label="Ground Condition" value={groundCondition} onChangeText={setGroundCondition} placeholder="e.g. Firm and dry" multiline />
          <FormInput label="Site Boundaries" value={siteBoundaries} onChangeText={setSiteBoundaries} placeholder="e.g. Hedges and trees" multiline />
        </View>
      </Card>

      <Card>
        <CardTitle>Surface Features</CardTitle>
        <Text style={styles.note}>Within a minimum of 250 m (note distances in metres)</Text>
        <View style={{ gap: 14 }}>
          <FormInput label="Roads" value={roads} onChangeText={setRoads} placeholder="e.g. Local road; nearest ~60 m W" multiline />
          <FormInput label="Outcrops (Bedrock and/or Subsoil)" value={outcrops} onChangeText={setOutcrops} placeholder="e.g. None observed within 250 m" multiline />
        </View>
      </Card>

      <Card>
        <CardTitle>Environmental Features</CardTitle>
        <View style={{ gap: 14 }}>
          <FormInput label="Surface Water Ponding" value={ponding} onChangeText={setPonding} placeholder="e.g. None / isolated shallow pooling NE" multiline />
          <FormInput label="Lakes" value={lakes} onChangeText={setLakes} placeholder="e.g. None within 250 m" multiline />
          <FormInput label="Beaches / Shellfish Areas" value={beachesShellfish} onChangeText={setBeachesShellfish} placeholder="e.g. None within study area" multiline />
          <FormInput label="Wetlands" value={wetlands} onChangeText={setWetlands} placeholder="e.g. None" multiline />
          <FormInput label="Karst Features" value={karstFeatures} onChangeText={setKarstFeatures} placeholder="e.g. None visible" multiline />
          <FormInput label="Watercourses / Streams" value={watercourses} onChangeText={setWatercourses} placeholder="e.g. None; note distance, direction, water level" multiline />
          <FormInput label="Drainage Ditches*" value={drainageDitches} onChangeText={setDrainageDitches} placeholder="e.g. None / open ditch ~40 m S flowing E→W" multiline />
          <FormInput label="Springs*" value={springs} onChangeText={setSprings} placeholder="e.g. None observed" multiline />
          <FormInput label="Wells*" value={wellsText} onChangeText={setWellsText} placeholder="e.g. None; note distance/direction and water level" multiline />
        </View>
        <Text style={styles.note}>*Note and record water level</Text>
      </Card>

      <Card>
        <CardTitle>Comments</CardTitle>
        <FormInput
          label="Visual Assessment Comments"
          value={visualComments}
          onChangeText={setVisualComments}
          placeholder="Integrate observations: suitability, targets at risk, separation distances, proposed system location, etc."
          multiline
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontFamily: Font.bold, color: Brand.textSub, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 },
  note: { fontSize: 12, color: Brand.textMuted, marginBottom: 12, fontFamily: Font.regular },
});
