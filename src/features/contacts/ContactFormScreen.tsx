import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../shared/theme/theme';
import { createContact } from './contactRepository';
import { nanoid } from 'nanoid/non-secure';

export function ContactFormScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState<'customer' | 'supplier' | 'both'>('customer');

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    try {
      createContact({
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        contact_type: type,
      });
      Alert.alert('Success', 'Contact saved successfully!');
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
    } catch (error) {
      Alert.alert('Error', 'Failed to save contact');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter name"
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Enter phone"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter email"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Address</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={address}
          onChangeText={setAddress}
          placeholder="Enter address"
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Type</Text>
        <View style={styles.typeRow}>
          {(['customer', 'supplier', 'both'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeBtn, type === t && styles.typeBtnActive]}
              onPress={() => setType(t)}
            >
              <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Contact</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  form: { padding: Spacing.md },
  label: { fontSize: Typography.sm, fontWeight: '600', color: Colors.light.textSecondary, marginBottom: Spacing.xs },
  input: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', marginBottom: Spacing.md },
  typeBtn: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surface,
    marginRight: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  typeBtnActive: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  typeBtnText: { color: Colors.light.textSecondary, fontWeight: '600' },
  typeBtnTextActive: { color: '#fff' },
  saveBtn: { backgroundColor: Colors.light.primary, padding: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center', marginTop: Spacing.md },
  saveBtnText: { color: '#fff', fontSize: Typography.md, fontWeight: '700' },
});
