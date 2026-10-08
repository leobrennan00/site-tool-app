import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { secureSessionStorage } from './secureSessionStorage';

const supabaseUrl = 'https://hosczijqspcgdzofavsg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhvc2N6aWpxc3BjZ2R6b2ZhdnNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNjQ1NTQsImV4cCI6MjA4MzY0MDU1NH0.nhilG3aQ5YTisSIY_9zPBHuQs5I6PG93NlGUs_Cy43o';

// Session is persisted in the device Keychain/Keystore (via expo-secure-store)
// rather than plain AsyncStorage, so a signed-in engineer stays signed in
// across app restarts and phone reboots without the token sitting in
// unencrypted storage. autoRefreshToken+persistSession mean the SDK will
// quietly refresh the access token in the background and reuse the stored
// session when offline rather than requiring a fresh login.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureSessionStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
