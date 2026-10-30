import { Platform, useWindowDimensions } from 'react-native';

/** Narrowest browser window that gets the desktop layout (sidebar + wide
 *  content); narrower windows, and the phone app, get the phone layout. */
export const DESKTOP_MIN_WIDTH = 1024;

/** Width of the readable column forms sit in on the desktop layout. */
export const DESKTOP_CONTENT_WIDTH = 880;

export function useIsDesktop(): boolean {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= DESKTOP_MIN_WIDTH;
}
