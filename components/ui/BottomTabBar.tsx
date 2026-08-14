import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Brand, Font } from '@/constants/theme';
import { IcoDoc, IcoLeaf, IcoSettings } from './icons';

export type MainView = 'myReports' | 'currentReport' | 'settings';

export function BottomTabBar({
  active, onChange, hasCurrentReport,
}: {
  active: MainView;
  onChange: (v: MainView) => void;
  hasCurrentReport: boolean;
}) {
  const tabs: { key: MainView; label: string; render: (c: string) => React.ReactNode; disabled?: boolean }[] = [
    { key: 'myReports', label: 'Reports', render: (c) => <IcoDoc size={24} color={c} /> },
    { key: 'currentReport', label: 'Current', render: (c) => <IcoLeaf size={24} color={c} />, disabled: !hasCurrentReport },
    { key: 'settings', label: 'Settings', render: (c) => <IcoSettings size={24} color={c} /> },
  ];

  return (
    <View style={styles.bar}>
      {tabs.map((t) => {
        const isActive = active === t.key;
        const color = t.disabled ? Brand.border : isActive ? Brand.primary : Brand.textMuted;
        return (
          <Pressable
            key={t.key}
            style={styles.tab}
            disabled={t.disabled}
            onPress={() => onChange(t.key)}
          >
            {t.render(color)}
            <Text style={[styles.label, { color }]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: Brand.surface,
    borderTopWidth: 1,
    borderTopColor: Brand.borderLight,
    paddingTop: 8,
    paddingBottom: 24,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4 },
  label: { fontSize: 10, fontFamily: Font.semibold, letterSpacing: 0.3 },
});
