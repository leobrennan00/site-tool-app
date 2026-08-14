import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, SafeAreaView, Animated } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Brand, Font } from '@/constants/theme';
import { GradientHero } from '@/components/ui/kit';
import { IcoDoc, IcoLeaf, IcoSettings, IcoSignOut } from '@/components/ui/icons';

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: 'currentReport' | 'myReports' | 'settings') => void;
  currentReportId: string | null;
}

export default function Sidebar(props: SidebarProps) {
  const { visible, onClose, onNavigate, currentReportId } = props;
  const slideAnim = useRef(new Animated.Value(-280)).current;
  const [email, setEmail] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email || ''));
  }, []);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -280,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    onClose();
  }

  function handleNavigation(screen: 'currentReport' | 'myReports' | 'settings') {
    onNavigate(screen);
    onClose();
  }

  if (!visible) return null;

  const NavRow = ({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) => (
    <Pressable style={styles.navRow} onPress={onPress}>
      <View style={styles.navIcon}>{icon}</View>
      <Text style={styles.navText}>{label}</Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ flex: 1 }}>
            <GradientHero style={styles.header}>
              <SafeAreaView>
                <View style={styles.avatar}>
                  <IcoLeaf size={26} color="#fff" />
                </View>
                <Text style={styles.headerTitle}>Site Assessment Tool</Text>
                {email ? <Text style={styles.headerEmail}>{email}</Text> : null}
              </SafeAreaView>
            </GradientHero>

            <View style={styles.menuItems}>
              {currentReportId && (
                <NavRow icon={<IcoLeaf size={22} color={Brand.primary} />} label="Current Report" onPress={() => handleNavigation('currentReport')} />
              )}
              <NavRow icon={<IcoDoc size={22} color={Brand.primary} />} label="My Reports" onPress={() => handleNavigation('myReports')} />
              <NavRow icon={<IcoSettings size={22} color={Brand.primary} />} label="Settings" onPress={() => handleNavigation('settings')} />
              <View style={styles.divider} />
              <NavRow icon={<IcoSignOut size={22} color={Brand.danger} />} label="Sign Out" onPress={handleSignOut} />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Site Assessment Tool</Text>
              <Text style={styles.footerVersion}>v1.0.0</Text>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Brand.overlay },
  sidebar: {
    width: 272, height: '100%', backgroundColor: Brand.surface,
    shadowColor: '#000', shadowOffset: { width: 6, height: 0 }, shadowOpacity: 0.14, shadowRadius: 40, elevation: 8,
  },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 22 },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  headerTitle: { fontSize: 17, fontFamily: Font.bold, color: '#fff', letterSpacing: -0.3 },
  headerEmail: { fontSize: 13, fontFamily: Font.regular, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  menuItems: { flex: 1, paddingTop: 12 },
  navRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20 },
  navIcon: { width: 32 },
  navText: { fontSize: 15, fontFamily: Font.medium, color: Brand.text },
  divider: { height: 1, backgroundColor: Brand.borderLight, marginVertical: 8, marginHorizontal: 20 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: Brand.borderLight, alignItems: 'center' },
  footerText: { fontSize: 12, color: Brand.textSub, marginBottom: 4, fontFamily: Font.regular },
  footerVersion: { fontSize: 10, color: Brand.textMuted, fontFamily: Font.regular },
});
