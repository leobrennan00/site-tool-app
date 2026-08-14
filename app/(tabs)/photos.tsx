import React, { useState } from "react";
import { ScrollView, View, Text, Image, StyleSheet, Alert, ActivityIndicator, Pressable } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { uploadPhoto } from "../../lib/storage";
import { Brand, Font } from "@/constants/theme";
import { Card, CardTitle } from "@/components/ui/kit";

interface PhotosProps {
  photoUrls: string[];
  setPhotoUrls: (urls: string[]) => void;
  embedded?: boolean;
}

export default function PhotosTab(props: PhotosProps) {
  const { photoUrls, setPhotoUrls, embedded } = props;
  const [uploading, setUploading] = useState(false);

  const pickPhotos = async () => {
    const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permResult.granted) {
      Alert.alert("Permission Required", "Camera roll permission is needed to add photos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (result.canceled) return;
    setUploading(true);

    const newUrls: string[] = [];
    for (const asset of result.assets) {
      try {
        const { url, error } = await uploadPhoto(asset.uri);
        if (error) {
          console.error("Photo upload error:", error);
          Alert.alert("Upload Error", `Failed to upload photo: ${error.message}`);
        } else if (url) {
          newUrls.push(url);
        }
      } catch (err) {
        console.error("Photo upload error:", err);
        Alert.alert("Upload Error", "Failed to upload one or more photos");
      }
    }

    setPhotoUrls([...photoUrls, ...newUrls]);
    setUploading(false);
  };

  const removePhoto = (index: number) => {
    const updated = [...photoUrls];
    updated.splice(index, 1);
    setPhotoUrls(updated);
  };

  const body = (
    <Card>
      <CardTitle>Site Photos</CardTitle>
      <Text style={styles.hint}>Photos are included in the final PDF report after the maps.</Text>

      {uploading && (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={styles.uploadingText}>Uploading photos…</Text>
        </View>
      )}

      <Pressable onPress={pickPhotos} disabled={uploading} style={styles.addBtn}>
        <Text style={styles.addBtnText}>
          {uploading ? "Uploading…" : photoUrls.length ? `+ Add More Photos (${photoUrls.length})` : "+ Add Site Photos"}
        </Text>
      </Pressable>

      {photoUrls.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.successText}>✓ {photoUrls.length} photo(s) ready to include</Text>
          {photoUrls.map((url, idx) => (
            <View key={idx} style={styles.photoContainer}>
              <Image source={{ uri: url }} style={styles.photoImage} resizeMode="cover" />
              <Pressable onPress={() => removePhoto(idx)} style={styles.removeBtn}>
                <Text style={styles.removeBtnText}>Remove</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </Card>
  );

  if (embedded) return <View>{body}</View>;
  return <ScrollView contentContainerStyle={styles.scroll}>{body}</ScrollView>;
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  hint: { fontSize: 13, color: Brand.textSub, marginBottom: 14, fontFamily: Font.regular, lineHeight: 19 },
  addBtn: {
    borderWidth: 1.5, borderColor: Brand.primary, borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', backgroundColor: Brand.primaryTint,
  },
  addBtnText: { color: Brand.primary, fontFamily: Font.semibold, fontSize: 15 },
  successText: { color: Brand.primary, fontSize: 14, marginBottom: 14, fontFamily: Font.medium },
  photoContainer: { marginBottom: 14, backgroundColor: Brand.bg, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: Brand.borderLight },
  photoImage: { width: "100%", height: 200, borderRadius: 8, marginBottom: 10 },
  removeBtn: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: Brand.dangerTint },
  removeBtnText: { color: Brand.danger, fontFamily: Font.semibold, fontSize: 13 },
  uploadingContainer: { alignItems: "center", marginBottom: 16 },
  uploadingText: { marginTop: 8, fontSize: 14, color: Brand.textSub, fontFamily: Font.regular },
});
