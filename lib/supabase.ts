import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hosczijqspcgdzofavsg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhvc2N6aWpxc3BjZ2R6b2ZhdnNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNjQ1NTQsImV4cCI6MjA4MzY0MDU1NH0.nhilG3aQ5YTisSIY_9zPBHuQs5I6PG93NlGUs_Cy43o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
