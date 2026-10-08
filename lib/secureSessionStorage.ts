import * as SecureStore from 'expo-secure-store';

// expo-secure-store backs onto the Android Keystore/SharedPreferences, which
// has a documented ~2048 byte limit per value. A persisted Supabase session
// (access token + refresh token + user object) routinely exceeds that, so a
// naive pass-through adapter would fail to save it silently (or throw) on
// Android. We chunk large values across multiple keys and store a small
// manifest under the original key so reads/writes stay transparent to the
// Supabase client, which just sees a normal getItem/setItem/removeItem
// storage interface.
const CHUNK_SIZE = 1800; // bytes, safely under the ~2048 byte ceiling
const MANIFEST_MARKER = '__chunked_v1__';

interface Manifest {
  marker: typeof MANIFEST_MARKER;
  count: number;
}

function chunkKey(key: string, index: number): string {
  return `${key}.chunk${index}`;
}

function byteLength(value: string): number {
  // SecureStore values are UTF-8 on both platforms.
  return new TextEncoder().encode(value).length;
}

function isManifest(raw: string): Manifest | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.marker === MANIFEST_MARKER && typeof parsed.count === 'number') {
      return parsed as Manifest;
    }
  } catch {
    // not JSON / not a manifest — treat as a plain value
  }
  return null;
}

export const secureSessionStorage = {
  async getItem(key: string): Promise<string | null> {
    const raw = await SecureStore.getItemAsync(key);
    if (raw === null) return null;

    const manifest = isManifest(raw);
    if (!manifest) return raw;

    const parts: string[] = [];
    for (let i = 0; i < manifest.count; i++) {
      const part = await SecureStore.getItemAsync(chunkKey(key, i));
      if (part === null) {
        // A chunk went missing (e.g. cleared individually) — treat the
        // whole value as unreadable rather than returning a truncated session.
        return null;
      }
      parts.push(part);
    }
    return parts.join('');
  },

  async setItem(key: string, value: string): Promise<void> {
    // Clear out any previous chunked value under this key first, in case
    // the new value is smaller/larger than before.
    await secureSessionStorage.removeItem(key);

    if (byteLength(value) <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }

    const chunks: string[] = [];
    let remaining = value;
    while (remaining.length > 0) {
      // Slice by character count is a safe under-estimate of byte count for
      // multi-byte UTF-8 (JWTs/JSON are overwhelmingly ASCII), so this stays
      // comfortably under CHUNK_SIZE bytes.
      chunks.push(remaining.slice(0, CHUNK_SIZE));
      remaining = remaining.slice(CHUNK_SIZE);
    }

    for (let i = 0; i < chunks.length; i++) {
      await SecureStore.setItemAsync(chunkKey(key, i), chunks[i]);
    }

    const manifest: Manifest = { marker: MANIFEST_MARKER, count: chunks.length };
    await SecureStore.setItemAsync(key, JSON.stringify(manifest));
  },

  async removeItem(key: string): Promise<void> {
    const raw = await SecureStore.getItemAsync(key);
    if (raw !== null) {
      const manifest = isManifest(raw);
      if (manifest) {
        for (let i = 0; i < manifest.count; i++) {
          await SecureStore.deleteItemAsync(chunkKey(key, i));
        }
      }
    }
    await SecureStore.deleteItemAsync(key);
  },
};
