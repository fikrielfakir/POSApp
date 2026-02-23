import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getDB } from '@core/database/db';
import { Followup } from '@core/database/types';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@shared/theme/theme';

const C = Colors.light;
const TYPE_EMOJIS: Record<string, string> = { Call: '📞', Visit: '🚗', Email: '✉️', WhatsApp: '💬', Demo: '🖥️' };
const PRIORITY_COLORS: Record<string, string> = { high: C.danger, normal: C.primary, low: C.textMuted };
const STATUS_COLORS: Record<string, string> = { pending: C.warning, completed: C.success, cancelled: C.textMuted };

export default function FollowUpListScreen() {
  const navigation = useNavigation<any>();
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [filter, setFilter] = useState<'pending' | 'completed' | 'all'>('pending');

  useFocusEffect(React.useCallback(() => {
    const db = getDB();
    const rows = db.getAllSync<Followup>('SELECT * FROM followups ORDER BY due_date ASC');
    setFollowups(rows);
  }, []));

  const filtered = filter === 'all' ? followups : followups.filter(f => f.status === filter);

  const markDone = (id: string) => {
    const db = getDB();
    db.runSync(`UPDATE followups SET status = 'completed' WHERE id = ?`, [id]);
    setFollowups(fs => fs.map(f => f.id === id ? { ...f, status: 'completed' as const } : f));
  };

  return (
    <View style={styles.container}>
      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(['pending', 'completed', 'all'] as const).map(f => (
          <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterBtnActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterLabel, filter === f && styles.filterLabelActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={f => f.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No follow-ups found.</Text>}
        renderItem={({ item }) => (
          <View style={[styles.card, { borderLeftColor: PRIORITY_COLORS[item.priority], borderLeftWidth: 4 }]}>
            <View style={styles.header}>
              <Text style={styles.typeEmoji}>{TYPE_EMOJIS[item.type] ?? '📋'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.contact}>{item.contact_name ?? 'No Contact'}</Text>
                <Text style={styles.type}>{item.type}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] }]}>
                <Text style={styles.badgeText}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.due}>Due: {item.due_date.slice(0, 10)}</Text>
            {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
            {item.status === 'pending' && (
              <TouchableOpacity style={styles.doneBtn} onPress={() => markDone(item.id)}>
                <Text style={styles.doneBtnText}>✓ Mark Done</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('FollowupForm', {})}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  filterRow: { flexDirection: 'row', padding: Spacing.md, gap: Spacing.xs },
  filterBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: C.surface, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  filterBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  filterLabel: { fontSize: Typography.sm, color: C.textSecondary, fontWeight: '600' },
  filterLabelActive: { color: '#fff' },
  list: { paddingHorizontal: Spacing.md, paddingBottom: 100, gap: Spacing.sm },
  card: { backgroundColor: C.surface, borderRadius: BorderRadius.md, padding: Spacing.md, ...Shadows.light },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  typeEmoji: { fontSize: 24 },
  contact: { fontSize: Typography.md, fontWeight: '700', color: C.textPrimary },
  type: { fontSize: Typography.xs, color: C.textSecondary },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  badgeText: { color: '#fff', fontSize: Typography.xs, fontWeight: '700' },
  due: { fontSize: Typography.sm, color: C.warning, fontWeight: '600', marginBottom: 4 },
  notes: { fontSize: Typography.xs, color: C.textSecondary, fontStyle: 'italic' },
  doneBtn: { alignSelf: 'flex-start', marginTop: Spacing.sm, backgroundColor: C.success, paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.full },
  doneBtnText: { color: '#fff', fontSize: Typography.xs, fontWeight: '700' },
  empty: { textAlign: 'center', color: C.textMuted, marginTop: 60 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
});
