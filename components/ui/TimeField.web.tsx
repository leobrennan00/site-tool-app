import React, { useEffect, useRef, useState } from 'react';
import { View, TextInput, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Brand, Font } from '@/constants/theme';
import { parseHHMM } from '@/lib/percolation';
import { maskHHMM, finishHHMM } from '@/lib/dates';

interface TimeFieldProps {
  value: string;
  onChange: (hhmm: string) => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Web build of TimeField: a typed 24-hour HH:MM box ("1030" becomes 10:30).
 * Only a real time is stored, as on the phone; anything else stays in the
 * box outlined amber until it's fixed.
 */
export function TimeField({ value, onChange, style }: TimeFieldProps) {
  const [text, setText] = useState(value || '');
  const [focused, setFocused] = useState(false);

  // Follow the stored value when it changes from elsewhere (another field
  // pre-filling this one, a report being opened), but not mid-typing. A typed
  // entry that isn't valid stays in the box, outlined, until it's fixed.
  const focusedRef = useRef(false);
  focusedRef.current = focused;
  useEffect(() => {
    if (!focusedRef.current) setText(value || '');
  }, [value]);

  const invalid = !!text.trim() && finishHHMM(text) == null && !focused;

  const change = (raw: string) => {
    const next = maskHHMM(raw);
    setText(next);
    if (/^\d{2}:\d{2}$/.test(next) && parseHHMM(next) != null) onChange(next);
    else if (!next.trim()) onChange('');
  };

  // "930" or "9:30" is a time too, once the box is left: stored as 09:30.
  const blur = () => {
    setFocused(false);
    const finished = finishHHMM(text);
    if (finished) {
      setText(finished);
      if (finished !== value) onChange(finished);
    }
  };

  return (
    <View style={[style, styles.box, focused && styles.focused, invalid && styles.invalid]}>
      <TextInput
        value={text}
        onChangeText={change}
        onFocus={() => setFocused(true)}
        onBlur={blur}
        placeholder="HH:MM"
        placeholderTextColor={Brand.textMuted}
        inputMode="numeric"
        maxLength={5}
        style={styles.text}
        accessibilityLabel="Time, 24 hour"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', minHeight: 44, paddingVertical: 0 },
  focused: { borderColor: Brand.primary, backgroundColor: '#fff' },
  invalid: { borderColor: Brand.amber },
  text: {
    flex: 1, minWidth: 0, fontSize: 15, fontFamily: Font.regular, color: Brand.text,
    paddingVertical: 10, fontVariant: ['tabular-nums'], outlineStyle: 'none',
  } as any,
});
