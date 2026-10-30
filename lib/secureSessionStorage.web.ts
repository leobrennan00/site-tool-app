// Web build: the browser has no Keychain, so the Supabase session lives in
// localStorage (the Supabase JS default on the web). Same interface as the
// native SecureStore adapter in secureSessionStorage.ts.
function store(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export const secureSessionStorage = {
  async getItem(key: string): Promise<string | null> {
    return store()?.getItem(key) ?? null;
  },
  async setItem(key: string, value: string): Promise<void> {
    store()?.setItem(key, value);
  },
  async removeItem(key: string): Promise<void> {
    store()?.removeItem(key);
  },
};
