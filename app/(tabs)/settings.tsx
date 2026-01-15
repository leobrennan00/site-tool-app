import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, Pressable, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';

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
  const { onClose, onSave } = props;

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

  useEffect(() => {
    loadSettings();
  }, []);

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
        const defaults = data.assessor_defaults;
        setCompany(defaults.company || '');
        setPrefix(defaults.prefix || '');
        setFirstName(defaults.firstName || '');
        setSurname(defaults.surname || '');
        setAddress(defaults.address || '');
        setQualifications(defaults.qualifications || '');
        setPhone(defaults.phone || '');
        setEmail(defaults.email || '');
        setIndemnity(defaults.indemnity || '');
        setSignatureUrl(defaults.signatureUrl || null);
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
      if (!user) {
        Alert.alert('Error', 'Not authenticated');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled) return;

      const uri = result.assets[0].uri;
      const fileName = `signature_${user.id}_${Date.now()}.jpg`;
      const filePath = `signatures/${fileName}`;

      // Upload to Supabase Storage
      const response = await fetch(uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('report-assets')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        Alert.alert('Error', 'Failed to upload signature');
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('report-assets')
        .getPublicUrl(filePath);

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
      if (!user) {
        Alert.alert('Error', 'Not authenticated');
        return;
      }

      const defaults: AssessorDefaults = {
        company,
        prefix,
        firstName,
        surname,
        address,
        qualifications,
        phone,
        email,
        indemnity,
        signatureUrl: signatureUrl || undefined,
      };

      const { error } = await supabase
        .from('profiles')
        .update({ assessor_defaults: defaults })
        .eq('id', user.id);

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

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Account Settings</Text>
        <Text style={styles.subtitle}>
          Set your default assessor details to auto-fill in new reports
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Default Assessor Details</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Company Name</Text>
          <TextInput
            style={styles.input}
            value={company}
            onChangeText={setCompany}
            placeholder="Enter company name"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Prefix</Text>
            <TextInput
              style={styles.input}
              value={prefix}
              onChangeText={setPrefix}
              placeholder="Mr/Mrs/Dr"
            />
          </View>

          <View style={[styles.field, { flex: 2 }]}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter first name"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Surname</Text>
          <TextInput
            style={styles.input}
            value={surname}
            onChangeText={setSurname}
            placeholder="Enter surname"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter address"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Qualifications</Text>
          <TextInput
            style={styles.input}
            value={qualifications}
            onChangeText={setQualifications}
            placeholder="Enter qualifications"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter email address"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Professional Indemnity Insurance</Text>
          <TextInput
            style={styles.input}
            value={indemnity}
            onChangeText={setIndemnity}
            placeholder="Enter policy details"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Default E-Signature</Text>
          <Text style={styles.fieldDescription}>
            Upload a signature image to automatically include in new reports
          </Text>
          <Pressable
            style={styles.signatureButton}
            onPress={pickAndUploadSignature}
          >
            <Text style={styles.signatureButtonText}>
              {signatureUrl ? 'Change Signature' : 'Upload Signature'}
            </Text>
          </Pressable>
          {signatureUrl && (
            <View style={styles.signaturePreview}>
              <Image
                source={{ uri: signatureUrl }}
                style={styles.signatureImage}
                resizeMode="contain"
              />
            </View>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.button, styles.cancelButton]}
          onPress={onClose}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.saveButton]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  fieldDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  signatureButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 12,
  },
  signatureButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  signaturePreview: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  signatureImage: {
    width: 200,
    height: 100,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    minWidth: 120,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
