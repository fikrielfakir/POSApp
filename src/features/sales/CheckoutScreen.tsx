import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCartStore } from './cartStore';
import { createSale } from './saleRepository';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@shared/theme/theme';

const C = Colors.light;
type PayMethod = 'cash' | 'card' | 'bank' | 'split';

const PAYMENT_METHODS: { key: PayMethod; label: string; emoji: string }[] = [
  { key: 'cash', label: 'Cash', emoji: '💵' },
  { key: 'card', label: 'Card', emoji: '💳' },
  { key: 'bank', label: 'Bank', emoji: '🏦' },
  { key: 'split', label: 'Split', emoji: '✂️' },
];

export default function CheckoutScreen() {
  const navigation = useNavigation<any>();
  const cart = useCartStore();
  const [method, setMethod] = useState<PayMethod>('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [processing, setProcessing] = useState(false);

  const total = cart.getTotal();
  const subtotal = cart.getSubtotal();
  const taxAmt = cart.getTaxAmount();
  const discAmt = cart.getDiscountAmount();
  const paid = parseFloat(amountPaid) || 0;
  const change = Math.max(0, paid - total);

  const handleConfirm = async () => {
    if (cart.items.length === 0) { Alert.alert('Cart Empty', 'Add items before checkout.'); return; }
    if (method === 'cash' && paid < total) { Alert.alert('Insufficient', `Amount paid (${paid.toFixed(2)}) is less than total (${total.toFixed(2)})`); return; }
    setProcessing(true);
    try {
      const saleId = createSale({
        contact_id: cart.contactId,
        subtotal, tax_amount: taxAmt, discount_amount: discAmt, total,
        paid_amount: paid || total,
        payment_method: method,
        items: cart.items.map(i => ({
          product_id: i.productId, product_name: i.name, barcode: i.barcode ?? null,
          quantity: i.quantity, unit_price: i.unitPrice,
          discount_percent: i.discountPercent, tax_percent: i.taxPercent, line_total: i.lineTotal,
        })),
        notes: cart.notes || undefined,
      });
      cart.clearCart();
      navigation.replace('Invoice', { saleId });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Order Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Order Summary</Text>
        {cart.items.map(item => (
          <View key={item.id} style={styles.summaryRow}>
            <Text style={styles.summaryItem}>{item.name} × {item.quantity}</Text>
            <Text style={styles.summaryAmt}>{item.lineTotal.toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <Row label="Subtotal" value={subtotal.toFixed(2)} />
        {discAmt > 0 && <Row label="Discount" value={`-${discAmt.toFixed(2)}`} color={C.danger} />}
        {taxAmt > 0 && <Row label="Tax" value={taxAmt.toFixed(2)} />}
        <View style={[styles.divider, { marginVertical: 4 }]} />
        <Row label="TOTAL" value={total.toFixed(2)} bold accent={C.primary} />
      </View>

      {/* Payment Method */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payment Method</Text>
        <View style={styles.methodRow}>
          {PAYMENT_METHODS.map(m => (
            <TouchableOpacity
              key={m.key}
              style={[styles.methodBtn, method === m.key && styles.methodBtnActive]}
              onPress={() => setMethod(m.key)}
            >
              <Text style={{ fontSize: 24 }}>{m.emoji}</Text>
              <Text style={[styles.methodLabel, method === m.key && styles.methodLabelActive]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Amount Paid (cash) */}
      {method === 'cash' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Amount Paid</Text>
          <TextInput
            style={styles.amountInput}
            value={amountPaid}
            onChangeText={setAmountPaid}
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor={C.textMuted}
          />
          {paid >= total && (
            <View style={styles.changeRow}>
              <Text style={styles.changeLabel}>Change</Text>
              <Text style={styles.changeValue}>{change.toFixed(2)}</Text>
            </View>
          )}
        </View>
      )}

      {/* Confirm Button */}
      <TouchableOpacity
        style={[styles.confirmBtn, processing && { opacity: 0.7 }]}
        onPress={handleConfirm}
        disabled={processing}
      >
        <Text style={styles.confirmText}>{processing ? 'Processing…' : `✓ Confirm Payment — ${total.toFixed(2)}`}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Row({ label, value, bold, accent, color }: { label: string; value: string; bold?: boolean; accent?: string; color?: string }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && { fontWeight: '700' }]}>{label}</Text>
      <Text style={[styles.rowValue, bold && { fontWeight: '800', fontSize: Typography.lg }, accent && { color: accent }, color && { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { padding: Spacing.md, gap: Spacing.md },
  card: { backgroundColor: C.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, ...Shadows.light },
  cardTitle: { fontSize: Typography.lg, fontWeight: '700', color: C.textPrimary, marginBottom: Spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  summaryItem: { fontSize: Typography.sm, color: C.textSecondary, flex: 1 },
  summaryAmt: { fontSize: Typography.sm, fontWeight: '600', color: C.textPrimary },
  divider: { height: 1, backgroundColor: C.border, marginVertical: Spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  rowLabel: { fontSize: Typography.md, color: C.textSecondary },
  rowValue: { fontSize: Typography.md, fontWeight: '600', color: C.textPrimary },
  methodRow: { flexDirection: 'row', gap: Spacing.sm },
  methodBtn: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md, backgroundColor: C.surfaceVariant,
    borderWidth: 2, borderColor: 'transparent',
  },
  methodBtnActive: { borderColor: C.primary, backgroundColor: '#EFF6FF' },
  methodLabel: { fontSize: Typography.xs, color: C.textSecondary, marginTop: 4 },
  methodLabelActive: { color: C.primary, fontWeight: '700' },
  amountInput: {
    backgroundColor: C.surfaceVariant, borderRadius: BorderRadius.md, borderWidth: 1,
    borderColor: C.border, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    fontSize: Typography.xxl, fontWeight: '700', color: C.textPrimary, textAlign: 'center',
  },
  changeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm, padding: Spacing.sm, backgroundColor: '#F0FDF4', borderRadius: BorderRadius.md },
  changeLabel: { fontSize: Typography.md, color: C.success, fontWeight: '600' },
  changeValue: { fontSize: Typography.lg, color: C.success, fontWeight: '800' },
  confirmBtn: {
    backgroundColor: C.success, borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg, alignItems: 'center', marginBottom: Spacing.xxxl,
  },
  confirmText: { color: '#fff', fontWeight: '800', fontSize: Typography.lg },
});
