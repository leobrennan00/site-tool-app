import React, { useState } from "react";
import { ScrollView, View, Text, TextInput, Button, Image, StyleSheet, Platform, Pressable, ActivityIndicator } from "react-native";

const API_BASE = "http://192.168.1.39:8000";

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
}

export default function MapsTab(props: MapsProps) {
  const {
    lat,
    setLat,
    lon,
    setLon,
    loading,
    imgErr,
    imgUris,
    mapDescriptions,
    generateMaps,
    getCurrentLocation,
  } = props;

  const [eircode, setEircode] = useState("");
  const [eircodeErr, setEircodeErr] = useState<string | null>(null);
  const [eircodeLoading, setEircodeLoading] = useState(false);

  async function lookupEircode() {
    const query = eircode.trim();
    if (!query) return;
    setEircodeErr(null);
    setEircodeLoading(true);
    try {
      const url =
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ", Ireland")}&format=json&limit=1&countrycodes=ie`;
      const res = await fetch(url, {
        headers: { "User-Agent": "SiteReportApp/1.0" },
      });
      const data = await res.json();
      if (data && data.length > 0) {
        setLat(String(parseFloat(data[0].lat).toFixed(6)));
        setLon(String(parseFloat(data[0].lon).toFixed(6)));
        setEircodeErr(null);
      } else {
        setEircodeErr("Eircode not found. Check the code and try again.");
      }
    } catch {
      setEircodeErr("Could not look up Eircode. Check your connection.");
    } finally {
      setEircodeLoading(false);
    }
  }

  // Helper function to get description for this map
  const getMapDescription = (mapUri: string): string | null => {
    const filename = mapUri.toLowerCase();
    if (filename.includes('teagasc') || filename.includes('_soils.png')) {
      return mapDescriptions.soils || null;
    }
    if (filename.includes('subsoil') || filename.includes('quaternary')) {
      return mapDescriptions.subsoils || null;
    }
    if (filename.includes('bedrock')) {
      return mapDescriptions.bedrock || null;
    }
    if (filename.includes('aquifer')) {
      return mapDescriptions.aquifer || null;
    }
    if (filename.includes('vulnerability')) {
      return mapDescriptions.vulnerability || null;
    }
    if (filename.includes('groundwater') && filename.includes('body')) {
      return mapDescriptions.groundwater_body || null;
    }
    if (filename.includes('groundwater') && filename.includes('flow')) {
      return mapDescriptions.groundwater_flow || null;
    }
    return null;
  };

  // Get map title from filename
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

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Text style={styles.title}>Generate Desk Study Maps</Text>
        <Text style={styles.subtitle}>
          Enter your site coordinates to generate all required maps automatically
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Site Coordinates</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Eircode</Text>
          <View style={styles.eircodeRow}>
            <TextInput
              style={[styles.input, styles.eircodeInput]}
              value={eircode}
              onChangeText={(t) => { setEircode(t); setEircodeErr(null); }}
              placeholder="e.g. V94 XYZ1"
              autoCapitalize="characters"
            />
            <Pressable
              onPress={lookupEircode}
              disabled={eircodeLoading || !eircode.trim()}
              style={[styles.lookupBtn, (!eircode.trim() || eircodeLoading) && styles.lookupBtnDisabled]}
            >
              {eircodeLoading
                ? <ActivityIndicator size="small" color="#FFF" />
                : <Text style={styles.lookupBtnText}>Look Up</Text>
              }
            </Pressable>
          </View>
          {eircodeErr && <Text style={styles.eircodeErr}>{eircodeErr}</Text>}
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or enter manually</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Latitude</Text>
          <TextInput
            style={styles.input}
            value={lat}
            onChangeText={setLat}
            keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "numeric"}
            placeholder="e.g. 54.393197"
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Longitude</Text>
          <TextInput
            style={styles.input}
            value={lon}
            onChangeText={setLon}
            keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "numeric"}
            placeholder="e.g. -8.523567"
          />
        </View>

        <Button
          title="Use Current Location"
          onPress={getCurrentLocation}
          color="#4A90E2"
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title={loading ? "Generating Maps..." : "Generate Maps"}
          onPress={generateMaps}
          disabled={loading}
          color="#34C759"
        />
      </View>

      {imgErr && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{imgErr}</Text>
        </View>
      )}

      {imgUris.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Generated Maps ({imgUris.length})</Text>
          <Text style={styles.successText}>
            ✓ All maps generated successfully! Proceed to the next tab to add photos.
          </Text>
          {imgUris.map((uri, idx) => {
            const title = getMapTitle(uri);
            const description = getMapDescription(uri);
            // Use full URI if it's a Supabase URL, otherwise prepend API_BASE
            const imageUri = uri.startsWith('http') ? uri : `${API_BASE}${uri}`;
            return (
              <View key={idx} style={styles.mapContainer}>
                <Text style={styles.mapTitle}>{title}</Text>
                <View style={styles.mapPreview}>
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.mapImage}
                    resizeMode="contain"
                  />
                </View>
                {description && (
                  <View style={styles.descriptionBox}>
                    <Text style={styles.descriptionText}>{description}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
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
  eircodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  eircodeInput: {
    flex: 1,
  },
  lookupBtn: {
    backgroundColor: "#4A90E2",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 84,
    alignItems: "center",
    justifyContent: "center",
  },
  lookupBtnDisabled: {
    backgroundColor: "#A0BFEF",
  },
  lookupBtnText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  eircodeErr: {
    color: "#C62828",
    fontSize: 13,
    marginTop: 6,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#DDD",
  },
  dividerText: {
    color: "#999",
    fontSize: 12,
    marginHorizontal: 10,
  },
  hint: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    fontStyle: "italic",
  },
  buttonContainer: {
    marginVertical: 16,
  },
  errorCard: {
    backgroundColor: "#FFEBEE",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    color: "#C62828",
    fontSize: 14,
  },
  successText: {
    color: "#2E7D32",
    fontSize: 14,
    marginBottom: 16,
    fontWeight: "500",
  },
  mapContainer: {
    marginBottom: 24,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  mapPreview: {
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#FFF",
    marginBottom: 12,
  },
  mapImage: {
    width: "100%",
    height: 200,
  },
  descriptionBox: {
    backgroundColor: "#F0F7FF",
    borderLeftWidth: 3,
    borderLeftColor: "#4A90E2",
    padding: 12,
    borderRadius: 6,
  },
  descriptionText: {
    fontSize: 13,
    color: "#333",
    lineHeight: 18,
  },
});
