import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getDB } from '@core/database/db';
import { StockTransfer } from '@core/database/types';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@shared/theme/theme';

const C = Colors.light;

export default function StockTransferListScreen() {
  const navigation = useNavigation<any>();
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);

  useFocusEffect(React.useCallback(() => {
    const db = getDB();
    setTransfers(db.getAllSync<StockTransfer>('SELECT * FROM stock_transfers ORDER BY created_at DESC'));
  }, []));

  const renderItem = ({ item }: { item: StockTransfer }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.id}>Transfer #{item.id.slice(0, 8)}</Text>
        <View style={[styles.badge, { backgroundColor: item.status === 'completed' ? C.success : C.warning }]}>
          <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.route}>
        {item.from_warehouse ?? 'Default'} → {item.to_warehouse ?? 'Default'}
      </Text>
      <Text style={styles.date}>{item.created_at.slice(0, 10)}</Text>
      {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={transfers}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No stock transfers yet.</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('StockTransferForm')}>
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
  route: { fontSize: Typography.sm, color: C.textSecondary, marginBottom: 4 },
  date: { fontSize: Typography.xs, color: C.textMuted },
  notes: { fontSize: Typography.xs, color: C.textMuted, marginTop: 4, fontStyle: 'italic' },
  empty: { textAlign: 'center', color: C.textMuted, marginTop: 60, fontSize: Typography.md },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
});
