import React, { useState, useEffect } from "react";
import { ScrollView, View, Text, TextInput, Image, StyleSheet, Platform, Pressable, ActivityIndicator } from "react-native";
import { Brand, Font } from "@/constants/theme";
import { Card, CardTitle, PrimaryBtn, InfoBanner, ProgressBar } from "@/components/ui/kit";

const API_BASE = "http://192.168.1.35:8000";

interface MapsProps {
  lat: string;
  setLat: (val: string) => void;
  lon: string;
  setLon: (val: string) => void;
  loading: boolean;
  imgErr: string | null;
  imgUris: string[];
  mapDescriptions: Record<string, string>;
  generateMaps: () => void;
  getCurrentLocation: () => void;
  embedded?: boolean;
}

export default function MapsTab(props: MapsProps) {
  const {
    lat, setLat, lon, setLon, loading, imgErr, imgUris,
    mapDescriptions, generateMaps, getCurrentLocation, embedded,
  } = props;

  const [eircode, setEircode] = useState("");
  const [eircodeErr, setEircodeErr] = useState<string | null>(null);
  const [eircodeLoading, setEircodeLoading] = useState(false);
  const [latFocus, setLatFocus] = useState(false);
  const [lonFocus, setLonFocus] = useState(false);
  const [eircodeFocus, setEircodeFocus] = useState(false);

  // Keep the progress bar mounted briefly after `loading` ends so it can
  // animate to 100% before disappearing.
  const [showProgress, setShowProgress] = useState(false);
  useEffect(() => {
    if (loading) {
      setShowProgress(true);
    } else if (showProgress) {
      const t = setTimeout(() => setShowProgress(false), 650);
      return () => clearTimeout(t);
    }
  }, [loading]);

  async function lookupEircode() {
    const query = eircode.trim();
    if (!query) return;
    setEircodeErr(null);
    setEircodeLoading(true);
    try {
      const url =
        `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates` +
        `?SingleLine=${encodeURIComponent(query + ", Ireland")}&countryCode=IRL&maxLocations=1&f=json&outFields=`;
      const res = await fetch(url);
      const data = await res.json();
      const candidates = data?.candidates ?? [];
      if (candidates.length > 0 && candidates[0].score >= 70) {
        const { x, y } = candidates[0].location;
        setLat(String(parseFloat(y).toFixed(6)));
        setLon(String(parseFloat(x).toFixed(6)));
        setEircodeErr(null);
      } else {
        setEircodeErr("Eircode not found. Check the code or enter coordinates manually.");
      }
    } catch {
      setEircodeErr("Could not look up Eircode. Check your connection.");
    } finally {
      setEircodeLoading(false);
    }
  }

  const getMapDescription = (mapUri: string): string | null => {
    const filename = mapUri.toLowerCase();
    if (filename.includes('teagasc') || filename.includes('_soils.png')) return mapDescriptions.soils || null;
    if (filename.includes('subsoil') || filename.includes('quaternary')) return mapDescriptions.subsoils || null;
    if (filename.includes('bedrock')) return mapDescriptions.bedrock || null;
    if (filename.includes('aquifer')) return mapDescriptions.aquifer || null;
    if (filename.includes('vulnerability')) return mapDescriptions.vulnerability || null;
    if (filename.includes('groundwater') && filename.includes('body')) return mapDescriptions.groundwater_body || null;
    if (filename.includes('groundwater') && filename.includes('flow')) return mapDescriptions.groundwater_flow || null;
    return null;
  };

  const getMapTitle = (mapUri: string): string => {
    const filename = mapUri.toLowerCase();
    if (filename.includes('location')) return 'Site Location';
    if (filename.includes('teagasc') || filename.includes('_soils')) return 'Soils Map';
    if (filename.includes('subsoil') || filename.includes('quaternary')) return 'Subsoils Map';
    if (filename.includes('bedrock')) return 'Bedrock Map';
    if (filename.includes('aquifer')) return 'Aquifer Map';
    if (filename.includes('vulnerability')) return 'Groundwater Vulnerability';
    if (filename.includes('groundwater') && filename.includes('body')) return 'Groundwater Body';
    if (filename.includes('groundwater') && filename.includes('flow')) return 'Groundwater Flow';
    return 'Map';
  };

  const body = (
    <>
      <InfoBanner>
        Start here — generating maps will auto-fill your Desk Study fields from the site coordinates.
      </InfoBanner>

      <Card>
        <CardTitle>Site Location</CardTitle>

        <Text style={styles.label}>Eircode</Text>
        <View style={styles.eircodeRow}>
          <TextInput
            style={[styles.input, styles.eircodeInput, eircodeFocus && styles.inputFocused]}
            value={eircode}
            onChangeText={(t) => { setEircode(t); setEircodeErr(null); }}
            onFocus={() => setEircodeFocus(true)}
            onBlur={() => setEircodeFocus(false)}
            placeholder="e.g. V94 XYZ1"
            placeholderTextColor={Brand.textMuted}
            autoCapitalize="characters"
          />
          <Pressable
            onPress={lookupEircode}
            disabled={eircodeLoading || !eircode.trim()}
            style={[styles.lookupBtn, (!eircode.trim() || eircodeLoading) && styles.lookupBtnDisabled]}
          >
            {eircodeLoading
              ? <ActivityIndicator size="small" color="#FFF" />
              : <Text style={styles.lookupBtnText}>Look Up</Text>}
          </Pressable>
        </View>
        {eircodeErr ? <Text style={styles.eircodeErr}>{eircodeErr}</Text> : null}

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable onPress={getCurrentLocation} style={styles.locBtn}>
          <Text style={styles.locBtnText}>⊹  Use Current Location</Text>
        </Pressable>

        <View style={styles.coordRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Latitude</Text>
            <TextInput
              style={[styles.input, latFocus && styles.inputFocused]}
              value={lat}
              onChangeText={setLat}
              onFocus={() => setLatFocus(true)}
              onBlur={() => setLatFocus(false)}
              keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "numeric"}
              placeholder="54.393197"
              placeholderTextColor={Brand.textMuted}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Longitude</Text>
            <TextInput
              style={[styles.input, lonFocus && styles.inputFocused]}
              value={lon}
              onChangeText={setLon}
              onFocus={() => setLonFocus(true)}
              onBlur={() => setLonFocus(false)}
              keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "numeric"}
              placeholder="-8.523567"
              placeholderTextColor={Brand.textMuted}
            />
          </View>
        </View>
      </Card>

      <PrimaryBtn
        title={loading ? "Generating Maps…" : "Generate Maps"}
        onPress={generateMaps}
        disabled={loading}
        style={{ marginBottom: showProgress ? 8 : 14 }}
      />

      {showProgress ? (
        <ProgressBar
          active={loading}
          label={loading ? "Generating desk study maps…" : "Maps ready"}
        />
      ) : null}

      {imgErr ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{imgErr}</Text>
        </View>
      ) : null}

      {imgUris.length > 0 && (
        <Card>
          <CardTitle>Generated Maps ({imgUris.length})</CardTitle>
          <Text style={styles.successText}>✓ All maps generated. Desk Study fields auto-filled.</Text>
          {imgUris.map((uri, idx) => {
            const title = getMapTitle(uri);
            const description = getMapDescription(uri);
            const imageUri = uri.startsWith('http') ? uri : `${API_BASE}${uri}`;
            return (
              <View key={idx} style={styles.mapContainer}>
                <Text style={styles.mapTitle}>{title}</Text>
                <View style={styles.mapPreview}>
                  <Image source={{ uri: imageUri }} style={styles.mapImage} resizeMode="contain" />
                </View>
                {description ? (
                  <View style={styles.descriptionBox}>
                    <Text style={styles.descriptionText}>{description}</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </Card>
      )}
    </>
  );

  if (embedded) return <View>{body}</View>;
  return <ScrollView contentContainerStyle={styles.scroll}>{body}</ScrollView>;
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 12, fontFamily: Font.bold, color: Brand.textSub, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: Brand.border, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14,
    fontSize: 15, fontFamily: Font.regular, color: Brand.text, backgroundColor: Brand.bg,
  },
  inputFocused: { borderColor: Brand.primary, backgroundColor: '#fff' },
  eircodeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  eircodeInput: { flex: 1 },
  lookupBtn: {
    backgroundColor: Brand.primary, paddingHorizontal: 16, paddingVertical: 13, borderRadius: 12,
    minWidth: 88, alignItems: "center", justifyContent: "center",
  },
  lookupBtnDisabled: { backgroundColor: Brand.border },
  lookupBtnText: { color: "#FFF", fontFamily: Font.semibold, fontSize: 14 },
  eircodeErr: { color: Brand.danger, fontSize: 13, marginTop: 6, fontFamily: Font.regular },
  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Brand.border },
  dividerText: { color: Brand.textMuted, fontSize: 12, marginHorizontal: 10, fontFamily: Font.regular },
  locBtn: {
    borderWidth: 1.5, borderColor: Brand.border, borderRadius: 12, paddingVertical: 13,
    alignItems: 'center', backgroundColor: Brand.bg, marginBottom: 16,
  },
  locBtnText: { color: Brand.primary, fontFamily: Font.semibold, fontSize: 15 },
  coordRow: { flexDirection: 'row', gap: 12 },
  errorCard: { backgroundColor: Brand.dangerTint, borderRadius: 12, padding: 16, marginBottom: 14 },
  errorText: { color: Brand.danger, fontSize: 14, fontFamily: Font.regular },
  successText: { color: Brand.primary, fontSize: 14, marginBottom: 16, fontFamily: Font.medium },
  mapContainer: { marginBottom: 20 },
  mapTitle: { fontSize: 15, fontFamily: Font.semibold, color: Brand.text, marginBottom: 8 },
  mapPreview: { borderRadius: 12, overflow: "hidden", backgroundColor: Brand.bg, marginBottom: 10, borderWidth: 1, borderColor: Brand.borderLight },
  mapImage: { width: "100%", height: 200 },
  descriptionBox: { backgroundColor: Brand.primaryTint, borderLeftWidth: 3, borderLeftColor: Brand.primary, padding: 12, borderRadius: 8 },
  descriptionText: { fontSize: 13, color: Brand.primaryDark, lineHeight: 18, fontFamily: Font.regular },
});
