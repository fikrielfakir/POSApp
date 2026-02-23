import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getAllPurchases, Purchase } from './purchaseRepository';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@shared/theme/theme';

const C = Colors.light;

const STATUS_COLORS: Record<string, string> = {
  draft: C.textMuted, ordered: C.warning, received: C.success, cancelled: C.danger,
};

export default function PurchaseListScreen() {
  const navigation = useNavigation<any>();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(React.useCallback(() => {
    setLoading(true);
    setPurchases(getAllPurchases());
    setLoading(false);
  }, []));

  const renderItem = ({ item }: { item: Purchase }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('PurchaseReceive', { purchaseId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.refNo}>{item.ref_no ?? 'PO-' + item.id.slice(0, 8)}</Text>
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] ?? C.textMuted }]}>
          <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.supplier}>{(item as any).contact_name ?? 'No Supplier'}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.date}>{item.created_at.slice(0, 10)}</Text>
        <Text style={styles.total}>{item.total.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={purchases}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No purchases yet.</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('PurchaseForm', {})}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: 100 },
  card: { backgroundColor: C.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, ...Shadows.light },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  refNo: { fontSize: Typography.md, fontWeight: '700', color: C.textPrimary },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  badgeText: { color: '#fff', fontSize: Typography.xs, fontWeight: '700' },
  supplier: { fontSize: Typography.sm, color: C.textSecondary, marginBottom: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  date: { fontSize: Typography.xs, color: C.textMuted },
  total: { fontSize: Typography.md, fontWeight: '700', color: C.primary },
  empty: { textAlign: 'center', color: C.textMuted, marginTop: 60, fontSize: Typography.md },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
});
