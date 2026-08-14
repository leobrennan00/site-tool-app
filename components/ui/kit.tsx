import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ViewStyle, TextStyle,
  Animated, Easing, KeyboardTypeOptions, StyleProp,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Brand, Font, Shadow, SectionMeta } from '@/constants/theme';
import { IcoChevronLeft, IcoCheck } from './icons';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/* ───────────────────────── Card ───────────────────────── */
export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function CardTitle({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.cardTitle, style]}>{children}</Text>;
}

/* ───────────────────────── AppHeader ───────────────────────── */
export function AppHeader({
  title, onBack, onMenu, rightLabel, onRightPress, rightNode,
}: {
  title: string;
  onBack?: () => void;
  onMenu?: () => void;
  rightLabel?: string;
  onRightPress?: () => void;
  rightNode?: React.ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerSide}>
        {onBack ? (
          <Pressable hitSlop={10} onPress={onBack} style={styles.headerBtn}>
            <IcoChevronLeft size={26} color={Brand.primary} />
          </Pressable>
        ) : onMenu ? (
          <Pressable hitSlop={10} onPress={onMenu} style={styles.headerBtn}>
            <View style={styles.menuLines}>
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
            </View>
          </Pressable>
        ) : null}
      </View>
      <Text numberOfLines={1} style={styles.headerTitle}>{title}</Text>
      <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>
        {rightNode
          ? rightNode
          : rightLabel ? (
            <Pressable hitSlop={10} onPress={onRightPress} style={styles.headerBtn}>
              <Text style={styles.headerAction}>{rightLabel}</Text>
            </Pressable>
          ) : null}
      </View>
    </View>
  );
}

/* ───────────────────────── FormInput ───────────────────────── */
export function FormInput({
  label, value, onChangeText, placeholder, multiline, hint,
  keyboardType, secureTextEntry, autoCapitalize, editable = true, style,
}: {
  label?: string;
  value: string;
  onChangeText?: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  hint?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  editable?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[{ marginBottom: 0 }, style]}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Brand.textMuted}
        multiline={multiline}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        editable={editable}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          focused && styles.inputFocused,
          !editable && { opacity: 0.6 },
        ]}
      />
      {hint ? <Text style={styles.inputHint}>{hint}</Text> : null}
    </View>
  );
}

/* ───────────────────────── RadioGroup ───────────────────────── */
export function RadioGroup<T extends string>({
  label, options, value, onChange,
}: {
  label?: string;
  options: { label: string; value: T }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <View>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <View style={{ gap: 8 }}>
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={[styles.choiceRow, active && styles.choiceRowActive]}
            >
              <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
                {active ? <View style={styles.radioDot} /> : null}
              </View>
              <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/* ───────────────────────── CheckRow ───────────────────────── */
export function CheckRow({
  label, checked, onToggle,
}: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} style={[styles.choiceRow, checked && styles.choiceRowActive]}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked ? <IcoCheck size={15} color="#fff" /> : null}
      </View>
      <Text style={[styles.choiceText, checked && styles.choiceTextActive, { flex: 1 }]}>{label}</Text>
    </Pressable>
  );
}

/* ───────────────────────── PrimaryBtn ───────────────────────── */
export function PrimaryBtn({
  title, onPress, disabled, style,
}: { title: string; onPress?: () => void; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.primaryBtn, disabled ? styles.primaryBtnDisabled : Shadow.button, style]}
    >
      <Text style={[styles.primaryBtnText, disabled && { color: Brand.textMuted }]}>{title}</Text>
    </Pressable>
  );
}

export function SecondaryBtn({
  title, onPress, danger, style,
}: { title: string; onPress?: () => void; danger?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.secondaryBtn,
        danger ? { backgroundColor: Brand.dangerTint, borderColor: Brand.danger } : { backgroundColor: Brand.surface, borderColor: Brand.border },
        style,
      ]}
    >
      <Text style={[styles.secondaryBtnText, { color: danger ? Brand.danger : Brand.primary }]}>{title}</Text>
    </Pressable>
  );
}

/* ───────────────────────── StatusPill ───────────────────────── */
export function StatusPill({ status }: { status: 'completed' | 'draft' }) {
  const completed = status === 'completed';
  return (
    <View style={[styles.pill, { backgroundColor: completed ? Brand.primaryTint : Brand.amberTint }]}>
      <View style={[styles.pillDot, { backgroundColor: completed ? Brand.primary : Brand.amber }]} />
      <Text style={[styles.pillText, { color: completed ? Brand.primary : Brand.amber }]}>
        {completed ? 'Complete' : 'Draft'}
      </Text>
    </View>
  );
}

/* ───────────────────────── ProgressRing ───────────────────────── */
export function ProgressRing({
  size = 52, stroke = 5, percent, variant = 'green',
}: { size?: number; stroke?: number; percent: number; variant?: 'green' | 'white' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: clamped,
      duration: 550,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [clamped]);

  const dashOffset = anim.interpolate({
    inputRange: [0, 100],
    outputRange: [circ, 0],
  });

  const trackColor = variant === 'white' ? 'rgba(255,255,255,0.25)' : Brand.borderLight;
  const fillColor = variant === 'white' ? '#fff' : Brand.primary;
  const labelColor = variant === 'white' ? '#fff' : Brand.primary;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2} cy={size / 2} r={r}
          stroke={fillColor} strokeWidth={stroke} fill="none"
          strokeDasharray={circ} strokeDashoffset={dashOffset} strokeLinecap="round"
        />
      </Svg>
      <Text style={{ fontSize: size * 0.26, fontFamily: Font.bold, color: labelColor }}>
        {Math.round(clamped)}%
      </Text>
    </View>
  );
}

/* ───────────────────────── ProgressBar ─────────────────────────
   Determinate "creeping" bar for long operations with no real percentage.
   While `active`, it eases toward ~92%; when `active` turns false it
   snaps to 100%. */
export function ProgressBar({ active, label }: { active: boolean; label?: string }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      anim.setValue(0.06);
      Animated.timing(anim, {
        toValue: 0.92,
        duration: 28000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(anim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  }, [active]);

  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.progressWrap}>
      {label ? <Text style={styles.progressLabel}>{label}</Text> : null}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width }]} />
      </View>
    </View>
  );
}

/* ───────────────────────── SectionIcon ───────────────────────── */
export function SectionIcon({ sectionId, size = 40 }: { sectionId: string; size?: number }) {
  const meta = SectionMeta[sectionId] || { abbr: '??', color: Brand.primary };
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.27, backgroundColor: meta.color, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontFamily: Font.bold, fontSize: size * 0.34 }}>{meta.abbr}</Text>
    </View>
  );
}

/* ───────────────────────── InfoBanner ───────────────────────── */
export function InfoBanner({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.infoBanner}>
      <Text style={styles.infoBannerText}>{children}</Text>
    </View>
  );
}

/* ───────────────────────── GradientHero ───────────────────────── */
export function GradientHero({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <LinearGradient
      colors={[Brand.primaryDark, Brand.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.3, y: 1 }}
      style={style}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Brand.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Brand.borderLight,
    marginBottom: 14,
    ...Shadow.card,
  },
  cardTitle: {
    fontSize: 11,
    fontFamily: Font.bold,
    color: Brand.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    backgroundColor: Brand.surface,
    borderBottomWidth: 1,
    borderBottomColor: Brand.borderLight,
  },
  headerSide: { width: 64, justifyContent: 'center' },
  headerBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontSize: 16, fontFamily: Font.semibold, color: Brand.text, letterSpacing: -0.2,
  },
  headerAction: { fontSize: 15, fontFamily: Font.semibold, color: Brand.primary },
  menuLines: { width: 22, gap: 4 },
  menuLine: { height: 2, borderRadius: 1, backgroundColor: Brand.text },

  inputLabel: {
    fontSize: 12, fontFamily: Font.bold, color: Brand.textSub,
    textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6,
  },
  input: {
    borderWidth: 1.5, borderColor: Brand.border, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 14, fontSize: 15,
    fontFamily: Font.regular, color: Brand.text, backgroundColor: Brand.bg,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  inputFocused: { borderColor: Brand.primary, backgroundColor: '#fff' },
  inputHint: { fontSize: 11, fontFamily: Font.regular, color: Brand.textMuted, marginTop: 5 },

  choiceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderColor: Brand.border, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 14, backgroundColor: Brand.bg,
  },
  choiceRowActive: { borderColor: Brand.primary, backgroundColor: Brand.primaryTint },
  choiceText: { fontSize: 15, fontFamily: Font.regular, color: Brand.text },
  choiceTextActive: { fontFamily: Font.medium, color: Brand.primaryDark },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Brand.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOuterActive: { borderColor: Brand.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Brand.primary },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Brand.border,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff',
  },
  checkboxChecked: { backgroundColor: Brand.primary, borderColor: Brand.primary },

  primaryBtn: {
    backgroundColor: Brand.primary, borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnDisabled: { backgroundColor: Brand.border },
  primaryBtnText: { color: '#fff', fontSize: 16, fontFamily: Font.semibold },
  secondaryBtn: {
    borderRadius: 14, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
  },
  secondaryBtnText: { fontSize: 15, fontFamily: Font.semibold },

  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start',
  },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 12, fontFamily: Font.semibold },

  infoBanner: {
    backgroundColor: Brand.primaryTint, borderRadius: 12, padding: 14, marginBottom: 14,
  },
  infoBannerText: { fontSize: 13, fontFamily: Font.regular, color: Brand.primaryDark, lineHeight: 19 },

  progressWrap: { marginTop: 4, marginBottom: 14 },
  progressLabel: { fontSize: 13, fontFamily: Font.medium, color: Brand.textSub, marginBottom: 8 },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: Brand.borderLight, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: Brand.primary },
});
