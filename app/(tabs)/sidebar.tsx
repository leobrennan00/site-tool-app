import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, SafeAreaView, Animated } from 'react-native';
import { supabase } from '../../lib/supabase';

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: 'currentReport' | 'myReports' | 'settings') => void;
  currentReportId: string | null;
}

export default function Sidebar(props: SidebarProps) {
  const { visible, onClose, onNavigate, currentReportId } = props;
  const slideAnim = useRef(new Animated.Value(-280)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -280,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
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

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.sidebar,
            {
              transform: [{ translateX: slideAnim }]
            }
          ]}
        >
          <Pressable onPress={(e) => e.stopPropagation()} style={{ flex: 1 }}>
          <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Navigation</Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>

            {/* Menu Items */}
            <View style={styles.menuItems}>
              {currentReportId && (
                <Pressable
                  style={styles.menuItem}
                  onPress={() => handleNavigation('currentReport')}
                >
                  <Text style={styles.menuIcon}>📝</Text>
                  <Text style={styles.menuText}>Current Report</Text>
                </Pressable>
              )}

              <Pressable
                style={styles.menuItem}
                onPress={() => handleNavigation('myReports')}
              >
                <Text style={styles.menuIcon}>📋</Text>
                <Text style={styles.menuText}>My Reports</Text>
              </Pressable>

              <Pressable
                style={styles.menuItem}
                onPress={() => handleNavigation('settings')}
              >
                <Text style={styles.menuIcon}>⚙️</Text>
                <Text style={styles.menuText}>Settings</Text>
              </Pressable>

              <View style={styles.divider} />

              <Pressable
                style={styles.menuItem}
                onPress={handleSignOut}
              >
                <Text style={styles.menuIcon}>🚪</Text>
                <Text style={styles.menuText}>Sign Out</Text>
              </Pressable>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Site Assessment Tool</Text>
              <Text style={styles.footerVersion}>v1.0.0</Text>
            </View>
          </SafeAreaView>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    width: 280,
    height: '100%',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  menuItems: {
    flex: 1,
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingLeft: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 32,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  divider: {
    height: 8,
    backgroundColor: '#f8f9fa',
    marginVertical: 8,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 10,
    color: '#999',
  },
});
