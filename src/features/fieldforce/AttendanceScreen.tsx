import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { getDB } from '@core/database/db';
import { AttendanceRecord } from '@core/database/types';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@shared/theme/theme';
import { useFocusEffect } from '@react-navigation/native';

const C = Colors.light;

export default function AttendanceScreen() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  useFocusEffect(React.useCallback(() => {
    const db = getDB();
    setRecords(db.getAllSync<AttendanceRecord>('SELECT * FROM attendance ORDER BY date DESC LIMIT 60'));
  }, []));

  const fmtDuration = (r: AttendanceRecord) => {
    if (!r.duration_minutes && !r.clock_in) return '—';
    if (r.duration_minutes) return `${Math.floor(r.duration_minutes / 60)}h ${r.duration_minutes % 60}m`;
    if (r.clock_in && !r.clock_out) return 'In progress';
    return '—';
  };

  return (
    <View style={styles.container}>
      <View style={styles.summaryBanner}>
        <Text style={styles.summaryTitle}>Attendance Log</Text>
        <Text style={styles.summarySub}>{records.length} days recorded</Text>
      </View>
      <FlatList
        data={records}
        keyExtractor={r => r.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No attendance records yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.date}>{item.date}</Text>
              <View style={[styles.badge, { backgroundColor: item.clock_out ? C.success : C.warning }]}>
                <Text style={styles.badgeText}>{item.clock_out ? 'Complete' : 'Incomplete'}</Text>
              </View>
            </View>
            <Text style={styles.times}>
              In: {item.clock_in?.slice(11, 16) ?? '—'} · Out: {item.clock_out?.slice(11, 16) ?? '—'}
            </Text>
            <Text style={styles.duration}>Duration: {fmtDuration(item)}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  summaryBanner: { backgroundColor: C.primary, padding: Spacing.lg },
  summaryTitle: { color: '#fff', fontSize: Typography.xl, fontWeight: '800' },
  summarySub: { color: 'rgba(255,255,255,0.7)', fontSize: Typography.sm },
  list: { padding: Spacing.md, gap: Spacing.xs, paddingBottom: 40 },
  card: { backgroundColor: C.surface, borderRadius: BorderRadius.md, padding: Spacing.md, ...Shadows.light },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  date: { fontSize: Typography.md, fontWeight: '700', color: C.textPrimary },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  badgeText: { color: '#fff', fontSize: Typography.xs, fontWeight: '700' },
  times: { fontSize: Typography.sm, color: C.textSecondary },
  duration: { fontSize: Typography.sm, fontWeight: '600', color: C.primary, marginTop: 2 },
  empty: { textAlign: 'center', color: C.textMuted, marginTop: 60 },
});
