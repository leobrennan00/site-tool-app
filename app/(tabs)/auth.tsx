import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetWrap}
      >
        <ScrollView contentContainerStyle={styles.sheet} keyboardShouldPersistTaps="handled">
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
});
