import React, { useEffect, useRef, useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Brand, Font } from '@/constants/theme';
import { parseDMY, formatDMY, displayDMY, maskDMY, formatISODate } from '@/lib/dates';
import { IcoCalendar } from './icons';

interface DateFieldProps {
  value: string;
  onChange: (dmy: string) => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Web build of DateField: a typed DD/MM/YYYY box (digits are enough —
 * "25082026" becomes 25/08/2026) with a calendar button for the browser's own
 * date picker. Stored as "DD/MM/YYYY" like the phone; the browser picker's
 * display order can follow the computer's locale, the box never does.
 */
export function DateField({ value, onChange, style }: DateFieldProps) {
  const [text, setText] = useState(displayDMY(value));
  const [focused, setFocused] = useState(false);
  const pickerRef = useRef<HTMLInputElement | null>(null);

  // Follow the stored value when it changes from elsewhere (another field
  // pre-filling this one, a report being opened), but not mid-typing. A typed
  // entry that isn't valid stays in the box, outlined, until it's fixed.
  const focusedRef = useRef(false);
  focusedRef.current = focused;
  useEffect(() => {
    if (!focusedRef.current) setText(displayDMY(value));
  }, [value]);

  const trimmed = text.trim();
  const invalid = !!trimmed && parseDMY(trimmed) == null && !focused;

  const change = (raw: string) => {
    const next = maskDMY(raw);
    setText(next);
    const d = parseDMY(next);
    if (d) onChange(formatDMY(d));
    else if (!next.trim()) onChange('');
  };

  const blur = () => {
    setFocused(false);
    const d = parseDMY(text);
    if (d) setText(formatDMY(d));
  };

  const openPicker = () => {
    const el = pickerRef.current;
    if (!el) return;
    const d = parseDMY(value);
    el.value = d ? formatISODate(d) : '';
    try {
      el.showPicker();
    } catch {
      el.focus();
    }
  };

  return (
    <View style={[style, styles.box, focused && styles.focused, invalid && styles.invalid]}>
      <TextInput
        value={text}
        onChangeText={change}
        onFocus={() => setFocused(true)}
        onBlur={blur}
        placeholder="DD/MM/YYYY"
        placeholderTextColor={Brand.textMuted}
        inputMode="numeric"
        maxLength={10}
        style={styles.text}
        accessibilityLabel="Date, day month year"
      />
      <Pressable onPress={openPicker} accessibilityRole="button" accessibilityLabel="Pick a date" style={styles.calendar}>
        <IcoCalendar size={18} color={Brand.textSub} />
      </Pressable>
      {React.createElement('input', {
        ref: pickerRef,
        type: 'date',
        tabIndex: -1,
        'aria-hidden': true,
        onChange: (e: any) => {
          const [y, m, d] = String(e.target.value || '').split('-').map(Number);
          if (y && m && d) onChange(formatDMY(new Date(y, m - 1, d)));
        },
        style: { position: 'absolute', right: 0, bottom: 0, width: 1, height: 1, opacity: 0, border: 0, padding: 0 },
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', minHeight: 44, paddingVertical: 0, paddingRight: 4, position: 'relative' },
  focused: { borderColor: Brand.primary, backgroundColor: '#fff' },
  invalid: { borderColor: Brand.amber },
  text: {
    flex: 1, minWidth: 0, fontSize: 15, fontFamily: Font.regular, color: Brand.text,
    paddingVertical: 10, fontVariant: ['tabular-nums'], outlineStyle: 'none',
  } as any,
  calendar: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
