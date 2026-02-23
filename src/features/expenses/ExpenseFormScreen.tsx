import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getDB } from '@core/database/db';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@shared/theme/theme';
import { customAlphabet } from 'nanoid/non-secure';

const C = Colors.light;
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 10);

const CATEGORIES = ['Rent', 'Utilities', 'Salaries', 'Transport', 'Marketing', 'Maintenance', 'Supplies', 'Other'];

export default function ExpenseFormScreen() {
  const navigation = useNavigation<any>();
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    if (!category) { Alert.alert('Error', 'Please select a category.'); return; }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { Alert.alert('Error', 'Enter a valid amount.'); return; }
    setSaving(true);
    try {
      const db = getDB();
      db.runSync(
        `INSERT INTO expenses (id, category, amount, notes, receipt_image_base64, expense_date, created_at) VALUES (?, ?, ?, ?, null, ?, ?)`,
        [nanoid(), category, amt, notes || null, date, new Date().toISOString()]
      );
      navigation.goBack();
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Log Expense</Text>

        <Text style={styles.label}>Category *</Text>
        <View style={styles.chips}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat} style={[styles.chip, category === cat && styles.chipActive]} onPress={() => setCategory(cat)}>
              <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Amount *</Text>
        <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0.00" placeholderTextColor={C.textMuted} />

        <Text style={styles.label}>Date</Text>
        <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={C.textMuted} />

        <Text style={styles.label}>Notes</Text>
        <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={notes} onChangeText={setNotes} multiline placeholder="Description…" placeholderTextColor={C.textMuted} />
      </View>

      <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? 'Saving…' : '💰 Save Expense'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 60 },
  card: { backgroundColor: C.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, ...Shadows.light },
  cardTitle: { fontSize: Typography.lg, fontWeight: '800', color: C.textPrimary, marginBottom: Spacing.lg },
  label: { fontSize: Typography.sm, fontWeight: '600', color: C.textSecondary, marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.md },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, backgroundColor: C.surfaceVariant, borderWidth: 1, borderColor: C.border },
  chipActive: { backgroundColor: C.warning, borderColor: C.warning },
  chipText: { fontSize: Typography.sm, color: C.textSecondary },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  input: { backgroundColor: C.surfaceVariant, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: C.border, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: Typography.md, color: C.textPrimary, marginBottom: Spacing.md },
  saveBtn: { backgroundColor: C.warning, borderRadius: BorderRadius.lg, paddingVertical: Spacing.lg, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: Typography.lg },
});
