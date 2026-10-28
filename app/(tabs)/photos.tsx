import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, View, Text, Image, StyleSheet, Alert, ActivityIndicator, Pressable } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { capturePhotoOffline, deletePhotoLocal, getLocalPhotosForReport, setPhotoLabel, LocalPhoto } from "../../lib/offlinePhotos";
import { PhotoLabelSheet } from "@/components/ui/PhotoLabelSheet";
import { PhotoLabel, normalizePhotoLabel, exifTakenAt, isSingleSlot, DEFAULT_PHOTO_LABEL } from "../../lib/photoLabels";
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
  // Photos still waiting to be told what they show, asked one after another,
  // plus the single photo being re-tagged from its card.
  const [tagQueue, setTagQueue] = useState<LocalPhoto[]>([]);
  const [tagTotal, setTagTotal] = useState(0);
  const [retag, setRetag] = useState<LocalPhoto | null>(null);

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
      exif: true,
    });

    if (result.canceled) return;
    await saveAssets(result.assets);
  };

  const takePhoto = async () => {
    if (!reportId) return;
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission Required", "Camera permission is needed to take photos");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8, exif: true });
    if (result.canceled) return;
    await saveAssets(result.assets);
  };

  // Saved to the device immediately, one at a time — each is safe on disk
  // (with its GPS + capture time) before we move to the next, and the actual
  // upload to Supabase happens later in the background whether we're online
  // right now or not. Then the engineer is asked what each one shows.
  const saveAssets = async (assets: ImagePicker.ImagePickerAsset[]) => {
    if (!reportId) return;
    setCapturing(true);
    try {
      const saved: LocalPhoto[] = [];
      for (const asset of assets) {
        saved.push(await capturePhotoOffline(reportId, asset.uri, 'photo', { takenAt: exifTakenAt(asset.exif as any) }));
      }
      await refresh();
      setTagTotal(saved.length);
      setTagQueue(saved);
    } catch (err) {
      console.error("Photo capture error:", err);
      Alert.alert("Error", "Failed to save one or more photos to the device.");
    } finally {
      setCapturing(false);
    }
  };

  const usedLabels = photos.map((p) => normalizePhotoLabel(p.label));
  const labelCurrent = async (label: PhotoLabel) => {
    const target = retag ?? tagQueue[0];
    if (!target) return;
    // A slot holds one photo: taking a label another photo already has moves
    // it here, and the other photo goes back to "Other" (so the report
    // doesn't print a second "Subsurface percolation hole 2" after the grid).
    if (isSingleSlot(label)) {
      for (const p of photos) {
        if (p.id !== target.id && normalizePhotoLabel(p.label) === label) await setPhotoLabel(p.id, DEFAULT_PHOTO_LABEL);
      }
    }
    await setPhotoLabel(target.id, label);
    if (retag) setRetag(null); else setTagQueue((q) => q.slice(1));
    await refresh();
  };
  // Skipping leaves a new photo as "Other" (it can be changed from its card later).
  const skipCurrent = () => {
    if (retag) setRetag(null); else setTagQueue((q) => q.slice(1));
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

      <Pressable onPress={takePhoto} disabled={capturing || !reportId} style={[styles.addBtn, { marginBottom: 10 }]}>
        <Text style={styles.addBtnText}>Take Photo</Text>
      </Pressable>
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
              <Pressable onPress={() => setRetag(photo)} style={styles.labelBtn} accessibilityLabel="Change what this photo shows">
                <Text style={styles.labelBtnText}>{normalizePhotoLabel(photo.label)}  ▾</Text>
              </Pressable>
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

  const sheet = (
    <PhotoLabelSheet
      visible={!!retag || tagQueue.length > 0}
      uri={(retag ?? tagQueue[0])?.local_uri ?? null}
      usedLabels={usedLabels}
      current={retag ? normalizePhotoLabel(retag.label) : null}
      progress={!retag && tagTotal > 1 ? `Photo ${tagTotal - tagQueue.length + 1} of ${tagTotal}` : undefined}
      onPick={labelCurrent}
      onClose={skipCurrent}
    />
  );

  if (embedded) return <View>{body}{sheet}</View>;
  return <ScrollView contentContainerStyle={styles.scroll}>{body}{sheet}</ScrollView>;
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
  labelBtn: {
    minHeight: 44, borderRadius: 10, borderWidth: 1.5, borderColor: Brand.border, backgroundColor: Brand.surface,
    justifyContent: 'center', paddingHorizontal: 12, marginBottom: 10,
  },
  labelBtnText: { fontSize: 14, fontFamily: Font.semibold, color: Brand.text },
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
