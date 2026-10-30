import React, { useEffect, useState } from 'react';
import { Alert, AlertButton, View, Text, Pressable, StyleSheet } from 'react-native';
import { Brand, Font } from '@/constants/theme';

// react-native-web's Alert.alert does nothing, and every confirmation in the
// app goes through it (delete report, generate report, upload results…).
// On the web it is replaced with this in-app dialog, so the shared screens
// get the same prompts as on the phone.

interface Dialog {
  id: number;
  title: string;
  message?: string;
  buttons: AlertButton[];
}

let queue: Dialog[] = [];
let nextId = 1;
const listeners = new Set<(q: Dialog[]) => void>();
const publish = () => listeners.forEach((cb) => cb(queue));

Alert.alert = (title: string, message?: string, buttons?: AlertButton[]) => {
  queue = [...queue, { id: nextId++, title, message, buttons: buttons?.length ? buttons : [{ text: 'OK' }] }];
  publish();
};

export function DialogHost() {
  const [dialogs, setDialogs] = useState<Dialog[]>(queue);
  useEffect(() => {
    listeners.add(setDialogs);
    return () => { listeners.delete(setDialogs); };
  }, []);
  const dialog = dialogs[0];

  const close = (button?: AlertButton) => {
    queue = queue.filter((d) => d.id !== dialog?.id);
    publish();
    button?.onPress?.();
  };

  useEffect(() => {
    if (!dialog) return;
    const cancel = dialog.buttons.find((b) => b.style === 'cancel');
    const primary = [...dialog.buttons].reverse().find((b) => b.style !== 'cancel');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close(cancel ?? (dialog.buttons.length === 1 ? dialog.buttons[0] : undefined)); }
      if (e.key === 'Enter') { e.preventDefault(); close(primary ?? dialog.buttons[0]); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialog?.id]);

  if (!dialog) return null;
  // Cancel first, then the rest in the order given — the last is the main action.
  const ordered = [
    ...dialog.buttons.filter((b) => b.style === 'cancel'),
    ...dialog.buttons.filter((b) => b.style !== 'cancel'),
  ];

  return (
    <View style={styles.scrim} accessibilityViewIsModal>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => {
        const cancel = dialog.buttons.find((b) => b.style === 'cancel');
        if (cancel || dialog.buttons.length === 1) close(cancel ?? dialog.buttons[0]);
      }} />
      <View style={styles.card} accessibilityRole="alert">
        <Text style={styles.title}>{dialog.title}</Text>
        {dialog.message ? <Text style={styles.message}>{dialog.message}</Text> : null}
        <View style={styles.buttons}>
          {ordered.map((b, i) => {
            const main = i === ordered.length - 1 && b.style !== 'cancel';
            const destructive = b.style === 'destructive';
            return (
              <Pressable
                key={`${b.text}-${i}`}
                onPress={() => close(b)}
                style={({ hovered, pressed }: any) => [
                  styles.btn,
                  main ? (destructive ? styles.btnDanger : styles.btnPrimary) : styles.btnGhost,
                  hovered && styles.btnHover,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={[styles.btnText, main ? { color: '#fff' } : destructive ? { color: Brand.danger } : null]}>
                  {b.text || 'OK'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: 'fixed' as any, top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
    backgroundColor: 'rgba(12,24,16,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  card: {
    width: '100%', maxWidth: 440, backgroundColor: Brand.surface, borderRadius: 18, padding: 24,
    shadowColor: '#0B1F14', shadowOpacity: 0.22, shadowRadius: 40, shadowOffset: { width: 0, height: 16 },
  },
  title: { fontSize: 18, fontFamily: Font.bold, color: Brand.text, letterSpacing: -0.2 },
  message: { fontSize: 14.5, lineHeight: 21, fontFamily: Font.regular, color: Brand.textSub, marginTop: 8 },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 10, marginTop: 22 },
  btn: { minHeight: 40, paddingHorizontal: 18, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: Brand.primary },
  btnDanger: { backgroundColor: Brand.danger },
  btnGhost: { backgroundColor: Brand.bg, borderWidth: 1, borderColor: Brand.border },
  btnHover: { opacity: 0.92 },
  btnText: { fontSize: 14, fontFamily: Font.semibold, color: Brand.text },
});
