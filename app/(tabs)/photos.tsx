import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, View, Text, Image, StyleSheet, Alert, ActivityIndicator, Pressable } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { capturePhotoOffline, deletePhotoLocal, getLocalPhotosForReport, LocalPhoto } from "../../lib/offlinePhotos";
import { subscribeQueueChanged } from "../../lib/syncQueue";
import { Brand, Font } from "@/constants/theme";
import { Card, CardTitle } from "@/components/ui/kit";

interface PhotosProps {
  reportId: string | null;
  embedded?: boolean;
}

export default function PhotosTab(props: PhotosProps) {
  const { reportId, embedded } = props;
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [capturing, setCapturing] = useState(false);

  const refresh = useCallback(async () => {
    if (!reportId) { setPhotos([]); return; }
    setPhotos(await getLocalPhotosForReport(reportId));
  }, [reportId]);

  useEffect(() => { refresh(); }, [refresh]);

  // Photos finish uploading in the background (lib/syncProcessor.ts) — this
  // keeps the "uploaded" badge below in sync with that without the engineer
  // having to leave and re-enter the screen.
  useEffect(() => subscribeQueueChanged(refresh), [refresh]);

  const pickPhotos = async () => {
    if (!reportId) return;
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
    setCapturing(true);
    try {
      // Saved to the device immediately, one at a time — each is safe on
      // disk (with its GPS + timestamp) before we move to the next, and the
      // actual upload to Supabase happens later in the background whether
      // we're online right now or not.
      for (const asset of result.assets) {
        await capturePhotoOffline(reportId, asset.uri);
      }
      await refresh();
    } catch (err) {
      console.error("Photo capture error:", err);
      Alert.alert("Error", "Failed to save one or more photos to the device.");
    } finally {
      setCapturing(false);
    }
  };

  const removePhoto = async (photoId: string) => {
    await deletePhotoLocal(photoId);
    await refresh();
  };

  const body = (
    <Card>
      <CardTitle>Site Photos</CardTitle>
      <Text style={styles.hint}>Photos are saved to this device immediately and uploaded automatically, included in the final PDF report after the maps.</Text>

      {capturing && (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={styles.uploadingText}>Saving photos…</Text>
        </View>
      )}

      <Pressable onPress={pickPhotos} disabled={capturing || !reportId} style={styles.addBtn}>
        <Text style={styles.addBtnText}>
          {capturing ? "Saving…" : photos.length ? `+ Add More Photos (${photos.length})` : "+ Add Site Photos"}
        </Text>
      </Pressable>

      {photos.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.successText}>✓ {photos.length} photo(s) saved to this device</Text>
          {photos.map((photo) => (
            <View key={photo.id} style={styles.photoContainer}>
              <Image source={{ uri: photo.local_uri }} style={styles.photoImage} resizeMode="cover" />
              <View style={styles.photoRow}>
                <View style={[styles.badge, photo.uploaded ? styles.badgeSynced : styles.badgePending]}>
                  <Text style={[styles.badgeText, photo.uploaded ? styles.badgeTextSynced : styles.badgeTextPending]}>
                    {photo.uploaded ? "Uploaded" : "Waiting to upload"}
                  </Text>
                </View>
                <Pressable onPress={() => removePhoto(photo.id)} style={styles.removeBtn}>
                  <Text style={styles.removeBtnText}>Remove</Text>
                </Pressable>
              </View>
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
  photoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  badgeSynced: { backgroundColor: Brand.primaryTint },
  badgePending: { backgroundColor: Brand.amberTint },
  badgeText: { fontSize: 12, fontFamily: Font.semibold },
  badgeTextSynced: { color: Brand.primary },
  badgeTextPending: { color: Brand.amber },
  removeBtn: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: Brand.dangerTint },
  removeBtnText: { color: Brand.danger, fontFamily: Font.semibold, fontSize: 13 },
  uploadingContainer: { alignItems: "center", marginBottom: 16 },
  uploadingText: { marginTop: 8, fontSize: 14, color: Brand.textSub, fontFamily: Font.regular },
});
