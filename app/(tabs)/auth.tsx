import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Alert, KeyboardAvoidingView, ScrollView, Platform,
} from 'react-native';
import { useIsDesktop } from '@/hooks/useLayout';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { Brand, Font } from '@/constants/theme';
import { FormInput, PrimaryBtn } from '@/components/ui/kit';
import { IcoLeaf } from '@/components/ui/icons';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const desktop = useIsDesktop();

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Sign In Error', error.message);
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password, options: { data: { full_name: fullName } },
    });
    if (error) {
      Alert.alert('Sign Up Error', error.message);
    } else {
      Alert.alert('Success', 'Account created! You can now sign in.');
      setIsSignUp(false);
    }
    setLoading(false);
  }

  const submit = isSignUp ? signUpWithEmail : signInWithEmail;

  // Enter signs in from any box on the web, as a sign-in form should.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !loading && document.querySelector('[role="alert"]') == null) submit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const form = (
    <>
    <Text style={styles.sheetTitle}>{isSignUp ? 'Create account' : 'Sign in'}</Text>
    <Text style={styles.sheetHelper}>
      {isSignUp ? 'Set up your assessor account' : 'Enter your credentials to continue'}
    </Text>

    {isSignUp && (
      <View style={{ marginBottom: 16 }}>
        <FormInput label="Full Name" value={fullName} onChangeText={setFullName} placeholder="John Smith" autoCapitalize="words" />
      </View>
    )}

    <View style={{ marginBottom: 16 }}>
      <FormInput
        label="Email" value={email} onChangeText={setEmail}
        placeholder="you@company.ie" keyboardType="email-address" autoCapitalize="none"
      />
    </View>

    <View style={{ marginBottom: 22 }}>
      <FormInput
        label="Password" value={password} onChangeText={setPassword}
        placeholder="••••••••" secureTextEntry autoCapitalize="none"
      />
    </View>

    <PrimaryBtn
      title={loading ? 'Loading…' : isSignUp ? 'Sign Up' : 'Sign In'}
      onPress={isSignUp ? signUpWithEmail : signInWithEmail}
      disabled={loading}
    />

    <Pressable style={styles.link} onPress={() => setIsSignUp(!isSignUp)}>
      <Text style={styles.linkText}>
        {isSignUp ? 'Already have an account? Sign In' : 'Forgot password?'}
      </Text>
    </Pressable>
    </>
  );

  if (desktop) {
    return (
      <View style={styles.desk}>
        <LinearGradient colors={[Brand.primaryDark, Brand.primary]} start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 1 }} style={styles.deskBrand}>
          <View style={styles.deskBrandInner}>
            <View style={[styles.glassTile, { width: 60, height: 60, borderRadius: 18 }]}>
              <IcoLeaf size={32} color="#fff" />
            </View>
            <Text style={styles.deskTitle}>SiteReport</Text>
            <Text style={styles.deskTagline}>Site assessments for domestic wastewater treatment systems, from the field to the finished report.</Text>
            <View style={{ marginTop: 36, gap: 18 }}>
              {[
                ['Start on site', 'Record the trial hole, percolation tests and photos on the phone, even with no signal.'],
                ['Finish at your desk', 'Every report you start on the phone is here, ready to pick up where you left off.'],
                ['Generate the report', 'The completed EPA CoP 2021 form and site report as a PDF, ready to send.'],
              ].map(([t, d], i) => (
                <View key={t} style={styles.deskPoint}>
                  <View style={styles.deskPointNum}><Text style={styles.deskPointNumText}>{i + 1}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.deskPointTitle}>{t}</Text>
                    <Text style={styles.deskPointText}>{d}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>
        <View style={styles.deskFormSide}>
          <View style={styles.deskForm}>{form}</View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[Brand.primaryDark, Brand.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.brandWrap}>
          <View style={styles.glassTile}>
            <IcoLeaf size={40} color="#fff" />
          </View>
          <Text style={styles.brandTitle}>Site Assessment Tool</Text>
          <Text style={styles.brandSub}>Professional DWWTS Site Reports</Text>
        </View>
      </LinearGradient>

      {/* 'padding' on Android too: with edge-to-edge (app.json) the window no
          longer resizes for the keyboard, so leaving it off let the keyboard
          cover the email/password fields. This screen is full-screen from the
          top, so no keyboardVerticalOffset is needed. */}
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.sheetWrap}
      >
        <ScrollView contentContainerStyle={styles.sheet} keyboardShouldPersistTaps="handled">
          {form}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.primaryDark },
  gradient: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
  brandWrap: { alignItems: 'center' },
  glassTile: {
    width: 76, height: 76, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  brandTitle: { fontSize: 27, fontFamily: Font.bold, color: '#fff', letterSpacing: -0.6, textAlign: 'center' },
  brandSub: { fontSize: 14, fontFamily: Font.regular, color: 'rgba(255,255,255,0.6)', marginTop: 8 },

  sheetWrap: { backgroundColor: Brand.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  sheet: { padding: 24, paddingTop: 28, paddingBottom: 40 },
  sheetTitle: { fontSize: 22, fontFamily: Font.bold, color: Brand.text, letterSpacing: -0.4 },
  sheetHelper: { fontSize: 14, fontFamily: Font.regular, color: Brand.textSub, marginTop: 4, marginBottom: 22 },
  link: { marginTop: 18, alignItems: 'center' },
  linkText: { color: Brand.primary, fontSize: 14, fontFamily: Font.semibold },

  desk: { flex: 1, flexDirection: 'row', backgroundColor: Brand.surface },
  deskBrand: { flex: 1.05, justifyContent: 'center', paddingHorizontal: 64 },
  deskBrandInner: { maxWidth: 480 },
  deskTitle: { fontSize: 40, fontFamily: Font.bold, color: '#fff', letterSpacing: -1.2 },
  deskTagline: { fontSize: 17, lineHeight: 26, fontFamily: Font.regular, color: 'rgba(255,255,255,0.78)', marginTop: 12 },
  deskPoint: { flexDirection: 'row', gap: 14 },
  deskPointNum: {
    width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  deskPointNumText: { fontSize: 13, fontFamily: Font.bold, color: '#fff' },
  deskPointTitle: { fontSize: 15, fontFamily: Font.semibold, color: '#fff' },
  deskPointText: { fontSize: 14, lineHeight: 20, fontFamily: Font.regular, color: 'rgba(255,255,255,0.68)', marginTop: 2 },
  deskFormSide: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 48 },
  deskForm: { width: '100%', maxWidth: 400 },
});
