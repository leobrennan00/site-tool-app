import React from 'react';
import { ScrollView, ScrollViewProps, StyleSheet } from 'react-native';
import { useIsDesktop, DESKTOP_CONTENT_WIDTH } from '@/hooks/useLayout';

/**
 * Web build: there's no on-screen keyboard to dodge, so this is a plain
 * ScrollView. On the desktop layout the content sits in a centred, readable
 * column while the scroll bar stays at the window edge.
 */
export function KeyboardAwareScrollView({ contentContainerStyle, children, ...props }: ScrollViewProps) {
  const desktop = useIsDesktop();
  return (
    <ScrollView {...props} contentContainerStyle={[contentContainerStyle, desktop && styles.column]}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  column: {
    width: '100%',
    maxWidth: DESKTOP_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingTop: 28,
    paddingBottom: 96,
  },
});
