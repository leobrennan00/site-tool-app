import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard, KeyboardEvent, NativeScrollEvent, NativeSyntheticEvent, Platform,
  ScrollView, ScrollViewProps, TextInput, View,
} from 'react-native';

// Gap kept between the bottom of the focused field and the top of the keyboard.
const MARGIN = 24;

/**
 * Drop-in replacement for a screen's top-level ScrollView that keeps the
 * focused text field visible above the keyboard, on iOS and Android.
 *
 * Works from absolute window positions (measureInWindow vs the keyboard's
 * screenY), so it needs no per-screen offset for headers / safe area — unlike
 * KeyboardAvoidingView, which measures relative to its parent.
 *  - iOS: native automaticallyAdjustKeyboardInsets does the heavy lifting.
 *  - Android: with edge-to-edge (app.json) the window no longer resizes for
 *    the keyboard, so the scroll area is shrunk by exactly the overlap; the
 *    native scroll view then keeps the focused field visible, including when
 *    moving between fields. If a device *does* resize the window, the overlap
 *    measures as 0 and nothing changes.
 *  - Both: after the keyboard appears, the focused field is scrolled into
 *    view explicitly if it's still covered.
 */
export function KeyboardAwareScrollView({ children, onScroll, style, ...props }: ScrollViewProps) {
  const scrollRef = useRef<ScrollView>(null);
  const wrapperRef = useRef<View>(null);
  const scrollY = useRef(0);
  const [androidOverlap, setAndroidOverlap] = useState(0);

  useEffect(() => {
    const scrollFocusedIntoView = (keyboardTop: number) => {
      const input = TextInput.State.currentlyFocusedInput?.() as any;
      if (!input?.measureInWindow) return;
      input.measureInWindow((_x: number, y: number, _w: number, h: number) => {
        const overflow = y + h + MARGIN - keyboardTop;
        if (overflow > 0) {
          scrollRef.current?.scrollTo({ y: scrollY.current + overflow, animated: true });
        }
      });
    };

    const onShow = (e: KeyboardEvent) => {
      const keyboardTop = e.endCoordinates.screenY;
      if (Platform.OS === 'android') {
        // The wrapper's own height never changes (only its padding does), so
        // this measures the true overlap even if the keyboard resizes again.
        wrapperRef.current?.measureInWindow((_x, y, _w, h) => {
          setAndroidOverlap(Math.max(0, y + h - keyboardTop));
        });
      }
      // Let the native inset / shrink land first, then check the field.
      setTimeout(() => scrollFocusedIntoView(keyboardTop), Platform.OS === 'ios' ? 300 : 150);
    };
    const onHide = () => setAndroidOverlap(0);

    const subs = [
      Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', onShow),
      Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', onHide),
    ];
    return () => subs.forEach((s) => s.remove());
  }, []);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
    onScroll?.(e);
  };

  return (
    <View ref={wrapperRef} style={{ flex: 1, paddingBottom: androidOverlap }} collapsable={false}>
      <ScrollView
        ref={scrollRef}
        style={style}
        automaticallyAdjustKeyboardInsets
        onScroll={handleScroll}
        scrollEventThrottle={props.scrollEventThrottle ?? 16}
        {...props}
      >
        {children}
      </ScrollView>
    </View>
  );
}
