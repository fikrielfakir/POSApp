import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { getDB } from '@core/database/db';
import { FieldVisit } from '@core/database/types';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@shared/theme/theme';
import { useFocusEffect } from '@react-navigation/native';

const C = Colors.light;

export default function VisitHistoryScreen() {
  const [visits, setVisits] = useState<FieldVisit[]>([]);

  useFocusEffect(React.useCallback(() => {
    const db = getDB();
    setVisits(db.getAllSync<FieldVisit>('SELECT * FROM field_visits ORDER BY created_at DESC LIMIT 100'));
  }, []));

  const duration = (v: FieldVisit) => {
    if (!v.check_in_time || !v.check_out_time) return 'In progress';
    const diff = (new Date(v.check_out_time).getTime() - new Date(v.check_in_time).getTime()) / 60000;
    return `${Math.round(diff)} min`;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={visits}
        keyExtractor={v => v.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No visits recorded yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.name}>{item.contact_name ?? 'Unknown Contact'}</Text>
              <Text style={styles.time}>{duration(item)}</Text>
            </View>
            <Text style={styles.sub}>
              In: {item.check_in_time?.slice(11, 16) ?? '?'} · Out: {item.check_out_time?.slice(11, 16) ?? '—'}
            </Text>
            <Text style={styles.date}>{item.created_at.slice(0, 10)}</Text>
            {item.outcome ? <Text style={styles.outcome}>Outcome: {item.outcome}</Text> : null}
            {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  list: { padding: Spacing.md, gap: Spacing.xs, paddingBottom: 40 },
  card: { backgroundColor: C.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, ...Shadows.light },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: Typography.md, fontWeight: '700', color: C.textPrimary },
  time: { fontSize: Typography.sm, fontWeight: '600', color: C.info },
  sub: { fontSize: Typography.sm, color: C.textSecondary, marginTop: 2 },
  date: { fontSize: Typography.xs, color: C.textMuted, marginTop: 2 },
  outcome: { fontSize: Typography.xs, color: C.success, marginTop: 4, fontWeight: '600' },
  notes: { fontSize: Typography.xs, color: C.textSecondary, marginTop: 2, fontStyle: 'italic' },
  empty: { textAlign: 'center', color: C.textMuted, marginTop: 60 },
});
