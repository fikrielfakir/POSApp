import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { PurchaseStackParamList } from '@navigation/types';
import { getPurchaseById, getPurchaseItems, receivePurchase, Purchase, PurchaseItem } from './purchaseRepository';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@shared/theme/theme';

const C = Colors.light;
type RoutePropType = RouteProp<PurchaseStackParamList, 'PurchaseReceive'>;

export default function PurchaseReceiveScreen() {
  const route = useRoute<RoutePropType>();
  const { purchaseId } = route.params;
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [items, setItems] = useState<PurchaseItem[]>([]);

  useEffect(() => {
    const p = getPurchaseById(purchaseId);
    setPurchase(p);
    if (p) setItems(getPurchaseItems(purchaseId));
  }, []);

  const handleReceive = () => {
    if (purchase?.status === 'received') { Alert.alert('Already Received', 'This purchase has already been received.'); return; }
    Alert.alert('Receive Stock', 'Mark this purchase as received and update stock?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Receive', onPress: () => {
          try {
            receivePurchase(purchaseId);
            setPurchase(p => p ? { ...p, status: 'received' } : p);
            Alert.alert('Done', 'Stock updated successfully!');
          } catch (e: any) { Alert.alert('Error', e.message); }
        },
      },
    ]);
  };

  if (!purchase) return <View style={styles.center}><Text>Purchase not found.</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>{purchase.ref_no ?? `PO-${purchase.id.slice(0, 8)}`}</Text>
        <Text style={styles.sub}>Date: {purchase.created_at.slice(0, 10)}</Text>
        <View style={[styles.badge, { backgroundColor: purchase.status === 'received' ? C.success : C.warning }]}>
          <Text style={styles.badgeText}>{purchase.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Items to Receive</Text>
        {items.map(item => (
          <View key={item.id} style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.product_name}</Text>
              <Text style={styles.itemSub}>Cost: {item.cost_price.toFixed(2)}</Text>
            </View>
            <Text style={styles.qty}>{item.qty} units</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalVal}>{purchase.total.toFixed(2)}</Text>
        </View>
      </View>

      {purchase.status !== 'received' && (
        <TouchableOpacity style={styles.receiveBtn} onPress={handleReceive}>
          <Text style={styles.receiveBtnText}>📥 Mark as Received & Update Stock</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { padding: Spacing.md, gap: Spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: C.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, ...Shadows.light },
  title: { fontSize: Typography.xl, fontWeight: '800', color: C.textPrimary },
  sub: { fontSize: Typography.sm, color: C.textSecondary, marginTop: 4, marginBottom: Spacing.sm },
  badge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.full },
  badgeText: { color: '#fff', fontSize: Typography.xs, fontWeight: '700' },
  cardTitle: { fontSize: Typography.md, fontWeight: '700', color: C.textPrimary, marginBottom: Spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: C.border },
  itemName: { fontSize: Typography.md, fontWeight: '600', color: C.textPrimary },
  itemSub: { fontSize: Typography.xs, color: C.textSecondary },
  qty: { fontSize: Typography.md, fontWeight: '700', color: C.primary },
  divider: { height: 1, backgroundColor: C.border, marginVertical: Spacing.sm },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: Typography.md, fontWeight: '700', color: C.textPrimary },
  totalVal: { fontSize: Typography.lg, fontWeight: '800', color: C.primary },
  receiveBtn: { backgroundColor: C.success, borderRadius: BorderRadius.lg, paddingVertical: Spacing.lg, alignItems: 'center' },
  receiveBtnText: { color: '#fff', fontWeight: '700', fontSize: Typography.md },
});
