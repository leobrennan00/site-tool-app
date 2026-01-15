import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  filePath: string,
  bucket: string = 'site-reports',
  folder?: string
): Promise<{ url: string | null; error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { url: null, error: { message: 'Not authenticated' } };
    }

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(filePath, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Generate unique filename
    const fileName = filePath.split('/').pop() || `file-${Date.now()}`;
    const fileExt = fileName.split('.').pop();
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Build storage path: userId/folder/filename
    const storagePath = folder
      ? `${user.id}/${folder}/${uniqueFileName}`
      : `${user.id}/${uniqueFileName}`;

    // Convert base64 to ArrayBuffer
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload to Supabase Storage using ArrayBuffer directly
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, bytes.buffer, {
        contentType: getContentType(fileExt || ''),
        upsert: false,
      });

    if (uploadError) {
      return { url: null, error: uploadError };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(storagePath);

    return { url: publicUrl, error: null };
  } catch (error) {
    return { url: null, error };
  }
}

/**
 * Upload a photo to Supabase Storage
 */
export async function uploadPhoto(photoUri: string): Promise<{ url: string | null; error: any }> {
  return uploadFile(photoUri, 'site-reports', 'photos');
}

/**
 * Upload a map image to Supabase Storage
 */
export async function uploadMap(mapUri: string): Promise<{ url: string | null; error: any }> {
  return uploadFile(mapUri, 'site-reports', 'maps');
}

/**
 * Upload a PDF to Supabase Storage
 */
export async function uploadPDF(pdfUri: string): Promise<{ url: string | null; error: any }> {
  return uploadFile(pdfUri, 'site-reports', 'pdfs');
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(
  fileUrl: string,
  bucket: string = 'site-reports'
): Promise<{ error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: { message: 'Not authenticated' } };
    }

    // Extract path from URL
    const urlParts = fileUrl.split(`${bucket}/`);
    if (urlParts.length < 2) {
      return { error: { message: 'Invalid file URL' } };
    }
    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    return { error };
  } catch (error) {
    return { error };
  }
}

/**
 * Get content type from file extension
 */
function getContentType(extension: string): string {
  const ext = extension.toLowerCase();

  const contentTypes: { [key: string]: string } = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'pdf': 'application/pdf',
    'json': 'application/json',
  };

  return contentTypes[ext] || 'application/octet-stream';
}
