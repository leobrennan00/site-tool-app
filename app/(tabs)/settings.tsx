import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Alert, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { Brand, Font } from '@/constants/theme';
import { Card, CardTitle, FormInput, PrimaryBtn, GradientHero } from '@/components/ui/kit';
import { IcoSignOut } from '@/components/ui/icons';

interface SettingsProps {
  onClose: () => void;
  onSave: (settings: AssessorDefaults) => void;
}

export interface AssessorDefaults {
  company: string;
  prefix: string;
  firstName: string;
  surname: string;
  address: string;
  qualifications: string;
  phone: string;
  email: string;
  indemnity: string;
  signatureUrl?: string;
}

export default function SettingsTab(props: SettingsProps) {
  const { onSave } = props;

  const [company, setCompany] = useState('');
  const [prefix, setPrefix] = useState('');
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [address, setAddress] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [indemnity, setIndemnity] = useState('');
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('assessor_defaults')
        .eq('id', user.id)
        .single();
      if (error) {
        console.error('Failed to load settings:', error);
      } else if (data?.assessor_defaults) {
        const d = data.assessor_defaults;
        setCompany(d.company || '');
        setPrefix(d.prefix || '');
        setFirstName(d.firstName || '');
        setSurname(d.surname || '');
        setAddress(d.address || '');
        setQualifications(d.qualifications || '');
        setPhone(d.phone || '');
        setEmail(d.email || '');
        setIndemnity(d.indemnity || '');
        setSignatureUrl(d.signatureUrl || null);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  }

  async function pickAndUploadSignature() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { Alert.alert('Error', 'Not authenticated'); return; }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (result.canceled) return;

      const uri = result.assets[0].uri;
      const fileName = `signature_${user.id}_${Date.now()}.jpg`;
      const filePath = `signatures/${fileName}`;

      const response = await fetch(uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('report-assets')
        .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });
      if (uploadError) {
        console.error('Upload error:', uploadError);
        Alert.alert('Error', 'Failed to upload signature');
        return;
      }

      const { data: urlData } = supabase.storage.from('report-assets').getPublicUrl(filePath);
      setSignatureUrl(urlData.publicUrl);
      Alert.alert('Success', 'Signature uploaded');
    } catch (err) {
      console.error('Error uploading signature:', err);
      Alert.alert('Error', 'Failed to upload signature');
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { Alert.alert('Error', 'Not authenticated'); return; }

      const defaults: AssessorDefaults = {
        company, prefix, firstName, surname, address,
        qualifications, phone, email, indemnity,
        signatureUrl: signatureUrl || undefined,
      };

      const { error } = await supabase.from('profiles').update({ assessor_defaults: defaults }).eq('id', user.id);
      if (error) {
        console.error('Failed to save settings:', error);
        Alert.alert('Error', 'Failed to save settings');
      } else {
        Alert.alert('Success', 'Default assessor details saved');
        onSave(defaults);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await supabase.auth.signOut(); } },
    ]);
  }

  const initials = `${firstName?.[0] || ''}${surname?.[0] || ''}`.toUpperCase() || 'SA';
  const fullName = `${prefix} ${firstName} ${surname}`.replace(/\s+/g, ' ').trim();

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={Brand.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: Brand.bg }} contentContainerStyle={styles.content}>
      {/* Profile hero */}
      <View style={styles.profileRow}>
        <GradientHero style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </GradientHero>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.profileName}>{fullName || 'Your Name'}</Text>
          {company ? <Text style={styles.profileCompany}>{company}</Text> : null}
        </View>
      </View>

      <Card>
        <CardTitle>Assessor Profile</CardTitle>
        <View style={{ gap: 14 }}>
          <FormInput label="Company" value={company} onChangeText={setCompany} placeholder="Company name" />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <FormInput label="Prefix" value={prefix} onChangeText={setPrefix} placeholder="Mr/Mrs/Dr" />
            </View>
            <View style={{ flex: 2 }}>
              <FormInput label="First Name" value={firstName} onChangeText={setFirstName} placeholder="First name" />
            </View>
          </View>
          <FormInput label="Surname" value={surname} onChangeText={setSurname} placeholder="Surname" />
          <FormInput label="Address" value={address} onChangeText={setAddress} placeholder="Address" multiline />
          <FormInput label="Qualifications" value={qualifications} onChangeText={setQualifications} placeholder="e.g. BEng, MIEI" />
          <FormInput label="Professional Indemnity Insurance" value={indemnity} onChangeText={setIndemnity} placeholder="Policy details" />
        </View>
      </Card>

      <Card>
        <CardTitle>Contact</CardTitle>
        <View style={{ gap: 14 }}>
          <FormInput label="Email" value={email} onChangeText={setEmail} placeholder="email@company.ie" keyboardType="email-address" autoCapitalize="none" />
          <FormInput label="Phone" value={phone} onChangeText={setPhone} placeholder="08x xxx xxxx" keyboardType="phone-pad" />
        </View>
      </Card>

      <Card>
        <CardTitle>Default E-Signature</CardTitle>
        <Text style={styles.hint}>Automatically included in new reports.</Text>
        <Pressable style={styles.sigBtn} onPress={pickAndUploadSignature}>
          <Text style={styles.sigBtnText}>{signatureUrl ? 'Change Signature' : 'Upload Signature'}</Text>
        </Pressable>
        {signatureUrl ? (
          <View style={styles.sigPreview}>
            <Image source={{ uri: signatureUrl }} style={styles.sigImage} resizeMode="contain" />
          </View>
        ) : null}
      </Card>

      <PrimaryBtn title={saving ? 'Saving…' : 'Save Profile'} onPress={handleSave} disabled={saving} style={{ marginTop: 4, marginBottom: 14 }} />

      <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
        <IcoSignOut size={18} color={Brand.danger} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.bg },
  content: { padding: 16, paddingBottom: 40 },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18, paddingHorizontal: 2 },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 22, fontFamily: Font.bold },
  profileName: { fontSize: 18, fontFamily: Font.bold, color: Brand.text, letterSpacing: -0.3 },
  profileCompany: { fontSize: 14, fontFamily: Font.regular, color: Brand.textSub, marginTop: 2 },
  hint: { fontSize: 12, color: Brand.textMuted, marginBottom: 12, fontFamily: Font.regular },
  sigBtn: {
    borderWidth: 1.5, borderColor: Brand.primary, borderRadius: 12, paddingVertical: 12,
    alignItems: 'center', backgroundColor: Brand.primaryTint,
  },
  sigBtnText: { color: Brand.primary, fontFamily: Font.semibold, fontSize: 15 },
  sigPreview: { marginTop: 12, borderWidth: 1, borderColor: Brand.borderLight, borderRadius: 12, padding: 12, backgroundColor: Brand.bg, alignItems: 'center' },
  sigImage: { width: 200, height: 90 },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Brand.dangerTint, borderWidth: 1.5, borderColor: Brand.danger,
    borderRadius: 14, paddingVertical: 13,
  },
  signOutText: { color: Brand.danger, fontFamily: Font.semibold, fontSize: 15 },
});
