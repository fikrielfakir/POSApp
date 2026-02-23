import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { FollowupStackParamList } from '@navigation/types';
import { getDB } from '@core/database/db';
import { Followup } from '@core/database/types';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@shared/theme/theme';
import { customAlphabet } from 'nanoid/non-secure';

const C = Colors.light;
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 10);
type RoutePropType = RouteProp<FollowupStackParamList, 'FollowupForm'>;

const TYPES = ['Call', 'Visit', 'Email', 'WhatsApp', 'Demo'] as const;
const PRIORITIES = ['high', 'normal', 'low'] as const;

export default function FollowUpFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RoutePropType>();
  const editId = route.params?.followupId;

  const [type, setType] = useState<Followup['type']>('Call');
  const [priority, setPriority] = useState<Followup['priority']>('normal');
  const [contactName, setContactName] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editId) {
      const db = getDB();
      const f = db.getFirstSync<Followup>('SELECT * FROM followups WHERE id = ?', [editId]);
      if (f) { setType(f.type); setPriority(f.priority); setContactName(f.contact_name ?? ''); setDueDate(f.due_date.slice(0, 10)); setNotes(f.notes ?? ''); }
    }
  }, []);

  const handleSave = () => {
    if (!contactName.trim()) { Alert.alert('Error', 'Contact name is required.'); return; }
    const db = getDB();
    const now = new Date().toISOString();
    try {
      if (editId) {
        db.runSync(`UPDATE followups SET type = ?, priority = ?, contact_name = ?, due_date = ?, notes = ? WHERE id = ?`,
          [type, priority, contactName, dueDate, notes || null, editId]);
      } else {
        db.runSync(
          `INSERT INTO followups (id, contact_id, contact_name, type, due_date, notes, status, priority, notification_id, created_at) VALUES (?, null, ?, ?, ?, ?, 'pending', ?, null, ?)`,
          [nanoid(), contactName, type, dueDate, notes || null, priority, now]
        );
      }
      navigation.goBack();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const PRIORITY_COLORS: Record<string, string> = { high: C.danger, normal: C.primary, low: C.textMuted };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{editId ? 'Edit Follow-up' : 'New Follow-up'}</Text>

        <Text style={styles.label}>Type</Text>
        <View style={styles.chips}>
          {TYPES.map(t => (
            <TouchableOpacity key={t} style={[styles.chip, type === t && styles.chipActive]} onPress={() => setType(t)}>
              <Text style={[styles.chipText, type === t && styles.chipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Priority</Text>
        <View style={styles.chips}>
          {PRIORITIES.map(p => (
            <TouchableOpacity key={p} style={[styles.chip, priority === p && { backgroundColor: PRIORITY_COLORS[p], borderColor: PRIORITY_COLORS[p] }]} onPress={() => setPriority(p)}>
              <Text style={[styles.chipText, priority === p && { color: '#fff', fontWeight: '700' }]}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Contact Name *</Text>
        <TextInput style={styles.input} value={contactName} onChangeText={setContactName} placeholder="Customer / lead name" placeholderTextColor={C.textMuted} />

        <Text style={styles.label}>Due Date</Text>
        <TextInput style={styles.input} value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" placeholderTextColor={C.textMuted} />

        <Text style={styles.label}>Notes</Text>
        <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={notes} onChangeText={setNotes} multiline placeholder="What to discuss…" placeholderTextColor={C.textMuted} />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>{editId ? '💾 Update' : '📅 Schedule Follow-up'}</Text>
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
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: Typography.sm, color: C.textSecondary },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  input: { backgroundColor: C.surfaceVariant, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: C.border, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: Typography.md, color: C.textPrimary, marginBottom: Spacing.md },
  saveBtn: { backgroundColor: C.primary, borderRadius: BorderRadius.lg, paddingVertical: Spacing.lg, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: Typography.lg },
});
