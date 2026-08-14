/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

/**
 * Brand design system — forest-green re-skin (see design_handoff_site_report_redesign/README.md).
 * Centralised tokens: reference `Brand` everywhere instead of hard-coding hex values.
 */
export const Brand = {
  // Core palette (hue 148°)
  primary: '#2E6B4F',      // buttons, active states, accents, progress
  primaryDark: '#1C4A35',  // gradient tops, headers
  primaryMid: '#4E9A73',   // gradient bottoms, avatars
  primaryTint: '#E4F0E8',  // selected backgrounds, info banners

  bg: '#F7FAF7',           // screen background (off-white green tint)
  surface: '#FFFFFF',      // cards, headers, tab bar
  text: '#18201A',         // primary text
  textSub: '#536054',      // secondary text, labels
  textMuted: '#8FA48C',    // tertiary text, hints, timestamps
  border: '#DDE8DB',       // input borders, dividers
  borderLight: '#EEF4EC',  // card borders, subtle separators
  danger: '#C0392B',       // sign out, delete, errors
  dangerTint: '#FDECEA',   // danger button background
  amber: '#C99A2E',        // draft status dot
  amberTint: '#FBF3E2',    // draft status background
  overlay: 'rgba(8,16,8,0.60)', // modal/sidebar scrim
} as const;

/**
 * DM Sans font family names (registered in app/_layout.tsx).
 * Falls back to system fonts until the fonts finish loading.
 */
export const Font = {
  light: 'DMSans_300Light',
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semibold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
} as const;

/** Reusable shadow presets (React Native form). */
export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  button: {
    shadowColor: '#2E6B4F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.27,
    shadowRadius: 16,
    elevation: 4,
  },
  floating: {
    shadowColor: '#2E6B4F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 6,
  },
} as const;

/** Per-section accent colours + 2-letter abbreviations for SectionIcon tiles. */
export const SectionMeta: Record<string, { label: string; abbr: string; color: string }> = {
  photos:            { label: 'Location, Maps & Photos', abbr: 'PM', color: '#9B59B6' },
  clientInfo:        { label: 'Client & Site Info',       abbr: 'CI', color: '#1F8FB3' },
  deskStudy:         { label: 'Desk Study',               abbr: 'DS', color: '#3F6FC4' },
  visualAssessment:  { label: 'Visual Assessment',        abbr: 'VA', color: '#6B5DD3' },
  trialHole:         { label: 'Trial Hole',               abbr: 'TH', color: '#C77B2E' },
  subsurfacePerc:    { label: 'Subsurface Percolation',   abbr: 'SP', color: '#2480C4' },
  surfacePerc:       { label: 'Surface Percolation',      abbr: 'SF', color: '#1B93A8' },
  conclusion:        { label: 'Conclusion',               abbr: 'CO', color: '#2E7252' },
  selectedDwwts:     { label: 'Selected DWWTS',           abbr: 'DW', color: '#C95B4B' },
  treatmentSystems:  { label: 'Treatment Systems',        abbr: 'TS', color: '#1E8A6E' },
  qualityAssurance:  { label: 'Quality Assurance',        abbr: 'QA', color: '#B85C9E' },
  siteAssessor:      { label: 'Site Assessor',            abbr: 'SA', color: '#8A8526' },
};

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
