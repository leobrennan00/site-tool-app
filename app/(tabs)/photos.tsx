import React, { useState } from "react";
import { ScrollView, View, Text, Button, Image, StyleSheet, Alert, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { uploadPhoto } from "../../lib/storage";

const API_BASE = "http://192.168.1.39:8080";

interface PhotosProps {
  photoUrls: string[];
  setPhotoUrls: (urls: string[]) => void;
}

export default function PhotosTab(props: PhotosProps) {
  const { photoUrls, setPhotoUrls } = props;
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
      quality: 0.8, // Slightly compress to save storage
    });

    if (result.canceled) return;

    setUploading(true);

    // Upload each selected photo to Supabase Storage
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

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Text style={styles.title}>Site Photos for Report</Text>
        <Text style={styles.subtitle}>
          Add photos that will be included in your PDF report after the maps
        </Text>
      </View>

      <View style={styles.card}>
        {uploading && (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.uploadingText}>Uploading photos...</Text>
          </View>
        )}
        <Button
          title={
            uploading
              ? "Uploading..."
              : photoUrls.length
              ? `Add More Photos (${photoUrls.length} selected)`
              : "Add Site Photos"
          }
          onPress={pickPhotos}
          disabled={uploading}
          color="#4A90E2"
        />
      </View>

      {photoUrls.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Selected Photos ({photoUrls.length})</Text>
          <Text style={styles.successText}>
            ✓ Photos ready to include in report
          </Text>
          {photoUrls.map((url, idx) => (
            <View key={idx} style={styles.photoContainer}>
              <Text style={styles.photoLabel}>Photo {idx + 1}</Text>
              <Image
                source={{ uri: url }}
                style={styles.photoImage}
                resizeMode="cover"
              />
              <Button
                title="Remove"
                onPress={() => removePhoto(idx)}
                color="#E53935"
              />
            </View>
          ))}
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
  successText: {
    color: "#2E7D32",
    fontSize: 14,
    marginBottom: 16,
    fontWeight: "500",
  },
  photoContainer: {
    marginBottom: 20,
    backgroundColor: "#FFF",
    borderRadius: 8,
    padding: 12,
  },
  photoLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  photoImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  uploadingContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  uploadingText: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
  },
});
