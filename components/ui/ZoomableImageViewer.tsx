import React from 'react';
import { Modal, View, Text, Image, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, cancelAnimation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Font } from '@/constants/theme';

const MIN_SCALE = 1;
const MAX_SCALE = 6;
const DOUBLE_TAP_SCALE = 2.5;

interface Props {
  visible: boolean;
  uri: string | null;
  title?: string;
  onClose: () => void;
}

/**
 * Full-screen image viewer with pinch-zoom, pan and double-tap zoom, on both
 * iOS and Android. (ScrollView's built-in zoom is iOS-only, hence gesture
 * handler + reanimated.) Works with local file:// URIs, so maps saved for
 * offline use zoom just the same with no signal.
 */
export function ZoomableImageViewer({ visible, uri, title, onClose }: Props) {
  const insets = useSafeAreaInsets();

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const width = useSharedValue(1);
  const height = useSharedValue(1);

  const reset = () => {
    scale.value = 1; savedScale.value = 1;
    tx.value = 0; ty.value = 0; savedTx.value = 0; savedTy.value = 0;
  };

  // Keep the zoomed image covering the viewport instead of panning off into empty space.
  const settle = () => {
    'worklet';
    const s = Math.min(Math.max(scale.value, MIN_SCALE), MAX_SCALE);
    const maxX = (width.value * (s - 1)) / 2;
    const maxY = (height.value * (s - 1)) / 2;
    const x = Math.min(Math.max(tx.value, -maxX), maxX);
    const y = Math.min(Math.max(ty.value, -maxY), maxY);
    scale.value = withTiming(s);
    tx.value = withTiming(x);
    ty.value = withTiming(y);
    savedScale.value = s; savedTx.value = x; savedTy.value = y;
  };

  const pinch = Gesture.Pinch()
    .onStart((e) => {
      cancelAnimation(scale); cancelAnimation(tx); cancelAnimation(ty);
      // Focal point relative to the viewport centre — zoom happens around it.
      focalX.value = e.focalX - width.value / 2;
      focalY.value = e.focalY - height.value / 2;
    })
    .onUpdate((e) => {
      const next = Math.min(Math.max(savedScale.value * e.scale, MIN_SCALE * 0.8), MAX_SCALE);
      const ratio = next / savedScale.value;
      scale.value = next;
      tx.value = focalX.value - ratio * (focalX.value - savedTx.value);
      ty.value = focalY.value - ratio * (focalY.value - savedTy.value);
    })
    .onEnd(() => settle());

  const pan = Gesture.Pan()
    .maxPointers(1)
    .onStart(() => {
      cancelAnimation(tx); cancelAnimation(ty);
      savedTx.value = tx.value; savedTy.value = ty.value;
    })
    .onUpdate((e) => {
      if (scale.value <= 1) return; // nothing to pan around at 1x
      tx.value = savedTx.value + e.translationX;
      ty.value = savedTy.value + e.translationY;
    })
    .onEnd(() => settle());

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      if (scale.value > 1.05) {
        scale.value = withTiming(1); tx.value = withTiming(0); ty.value = withTiming(0);
        savedScale.value = 1; savedTx.value = 0; savedTy.value = 0;
        return;
      }
      // Zoom in around the tapped point, clamped so the image still fills the view.
      const s = DOUBLE_TAP_SCALE;
      const maxX = (width.value * (s - 1)) / 2;
      const maxY = (height.value * (s - 1)) / 2;
      const x = Math.min(Math.max((e.x - width.value / 2) * (1 - s), -maxX), maxX);
      const y = Math.min(Math.max((e.y - height.value / 2) * (1 - s), -maxY), maxY);
      scale.value = withTiming(s); tx.value = withTiming(x); ty.value = withTiming(y);
      savedScale.value = s; savedTx.value = x; savedTy.value = y;
    });

  const gesture = Gesture.Simultaneous(Gesture.Simultaneous(pinch, pan), doubleTap);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  const onLayout = (e: LayoutChangeEvent) => {
    width.value = e.nativeEvent.layout.width;
    height.value = e.nativeEvent.layout.height;
  };

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} onShow={reset} statusBarTranslucent>
      {/* Gesture handler needs its own root inside a Modal (separate native view tree on Android). */}
      <GestureHandlerRootView style={styles.root}>
        <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
          <Text style={styles.title} numberOfLines={1}>{title || 'Map'}</Text>
          <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn} accessibilityLabel="Close map">
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <GestureDetector gesture={gesture}>
          <View style={styles.stage} onLayout={onLayout} collapsable={false}>
            {uri ? (
              <Animated.View style={[StyleSheet.absoluteFill, imageStyle]}>
                <Image source={{ uri }} style={styles.image} resizeMode="contain" />
              </Animated.View>
            ) : null}
          </View>
        </GestureDetector>

        <Text style={[styles.help, { paddingBottom: insets.bottom + 12 }]}>
          Pinch to zoom · drag to move · double-tap to zoom in/out
        </Text>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0F0C' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 4,
  },
  title: { flex: 1, color: '#fff', fontSize: 16, fontFamily: Font.semibold },
  closeBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#fff', fontSize: 22 },
  stage: { flex: 1, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  help: { color: 'rgba(255,255,255,0.6)', fontSize: 12, textAlign: 'center', paddingTop: 10, fontFamily: Font.regular },
});
