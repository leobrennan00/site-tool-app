import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Brand, Font } from '@/constants/theme';

/**
 * Drag photos from the desktop straight onto the report. Each dropped image
 * is handed on as an object URL plus the file's date, which stands in for
 * the capture time when the browser gives no EXIF.
 */
export function PhotoDropZone({ onFiles, disabled }: {
  onFiles: (files: { uri: string; takenAt: string | null }[]) => void;
  disabled?: boolean;
}) {
  const [over, setOver] = useState(false);

  const take = (list: FileList | null | undefined) => {
    const files = Array.from(list || []).filter((f) => f.type.startsWith('image/'));
    if (!files.length || disabled) return;
    onFiles(files.map((f) => ({ uri: URL.createObjectURL(f), takenAt: f.lastModified ? new Date(f.lastModified).toISOString() : null })));
  };

  return React.createElement(
    'div',
    {
      onDragOver: (e: DragEvent) => { e.preventDefault(); if (!over) setOver(true); },
      onDragLeave: () => setOver(false),
      onDrop: (e: DragEvent) => { e.preventDefault(); setOver(false); take(e.dataTransfer?.files); },
      style: { display: 'flex' },
    },
    <View style={[styles.zone, over && styles.zoneOver]}>
      <Text style={styles.title}>{over ? 'Drop to add these photos' : 'Drag photos here'}</Text>
      <Text style={styles.sub}>From your computer. You tag each one after it uploads.</Text>
    </View>,
  );
}

const styles = StyleSheet.create({
  zone: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 26, paddingHorizontal: 16,
    borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: Brand.border, backgroundColor: Brand.bg,
    marginBottom: 12,
  },
  zoneOver: { borderColor: Brand.primary, backgroundColor: Brand.primaryTint },
  title: { fontSize: 15, fontFamily: Font.semibold, color: Brand.text },
  sub: { fontSize: 13, fontFamily: Font.regular, color: Brand.textSub, marginTop: 4, textAlign: 'center' },
});
