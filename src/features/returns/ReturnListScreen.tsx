import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getDB } from '@core/database/db';
import { SellReturn } from '@core/database/types';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@shared/theme/theme';

const C = Colors.light;
const STATUS_COLORS: Record<string, string> = { pending: C.warning, approved: C.success, rejected: C.danger };

export default function ReturnListScreen() {
  const navigation = useNavigation<any>();
  const [returns, setReturns] = useState<SellReturn[]>([]);

  useFocusEffect(React.useCallback(() => {
    const db = getDB();
    setReturns(db.getAllSync<SellReturn>('SELECT * FROM sell_returns ORDER BY created_at DESC'));
  }, []));

  const renderItem = ({ item }: { item: SellReturn }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.id}>Return #{item.id.slice(0, 8)}</Text>
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] ?? C.textMuted }]}>
          <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.reason}>{item.reason ?? 'No reason given'}</Text>
      <View style={styles.footer}>
        <Text style={styles.date}>{item.created_at.slice(0, 10)}</Text>
        <Text style={styles.total}>{item.total.toFixed(2)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={returns}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No returns yet.</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateReturn')}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: 100 },
  card: { backgroundColor: C.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, ...Shadows.light },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  id: { fontSize: Typography.md, fontWeight: '700', color: C.textPrimary },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  badgeText: { color: '#fff', fontSize: Typography.xs, fontWeight: '700' },
  reason: { fontSize: Typography.sm, color: C.textSecondary, marginBottom: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
  date: { fontSize: Typography.xs, color: C.textMuted },
  total: { fontSize: Typography.md, fontWeight: '700', color: C.danger },
  empty: { textAlign: 'center', color: C.textMuted, marginTop: 60, fontSize: Typography.md },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: C.danger, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
});
