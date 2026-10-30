import { supabase } from './supabase';

// Web build of storage.ts: picked files arrive as blob:/data: URIs, which
// fetch() reads directly (there is no expo-file-system on the web).

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'application/pdf': 'pdf',
};

export async function uploadFile(
  fileUri: string,
  bucket: string = 'site-reports',
  folder?: string
): Promise<{ url: string | null; error: any }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return { url: null, error: { message: 'Not authenticated' } };

    const blob = await (await fetch(fileUri)).blob();
    const ext = EXT_BY_TYPE[blob.type] || 'bin';
    const name = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const storagePath = folder ? `${user.id}/${folder}/${name}` : `${user.id}/${name}`;

    const { error } = await supabase.storage.from(bucket).upload(storagePath, blob, {
      contentType: blob.type || 'application/octet-stream',
      upsert: false,
    });
    if (error) return { url: null, error };
    return { url: supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl, error: null };
  } catch (error) {
    return { url: null, error };
  }
}

export async function uploadPhoto(photoUri: string) {
  return uploadFile(photoUri, 'site-reports', 'photos');
}

export async function uploadMap(mapUri: string) {
  return uploadFile(mapUri, 'site-reports', 'maps');
}

export async function uploadPDF(pdfUri: string) {
  return uploadFile(pdfUri, 'site-reports', 'pdfs');
}

export async function deleteFile(fileUrl: string, bucket: string = 'site-reports'): Promise<{ error: any }> {
  const parts = fileUrl.split(`${bucket}/`);
  if (parts.length < 2) return { error: { message: 'Invalid file URL' } };
  const { error } = await supabase.storage.from(bucket).remove([parts[1]]);
  return { error };
}
