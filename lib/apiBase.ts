import { Platform } from 'react-native';

// Backend base URL. Phone dev builds talk to the backend running on this
// machine (update the IP if it changes); release builds and the website use
// Railway. EXPO_PUBLIC_API_BASE overrides both, e.g. to point a local web
// build at a local backend.
const PRODUCTION = 'https://web-production-133cf.up.railway.app';
const LOCAL = 'http://192.168.0.51:8000';

export const API_BASE: string =
  process.env.EXPO_PUBLIC_API_BASE || (__DEV__ && Platform.OS !== 'web' ? LOCAL : PRODUCTION);
