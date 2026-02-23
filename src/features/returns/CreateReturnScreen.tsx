import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getDB } from '@core/database/db';
import { getAllSales } from '@features/sales/saleRepository';
import { Sale, SaleItem } from '@features/sales/saleRepository';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@shared/theme/theme';
import { customAlphabet } from 'nanoid/non-secure';

const C = Colors.light;
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 10);

export default function CreateReturnScreen() {
  const navigation = useNavigation<any>();
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [returnQtys, setReturnQtys] = useState<Record<string, string>>({});
  const [reason, setReason] = useState('');
  const [refundMethod, setRefundMethod] = useState<'cash' | 'card' | 'store_credit'>('cash');
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => { setSales(getAllSales().filter(s => s.status === 'completed').slice(0, 50)); }, []);

  const selectSale = (sale: Sale) => {
    setSelectedSale(sale);
    setShowPicker(false);
    const db = getDB();
    const items = db.getAllSync<SaleItem>('SELECT * FROM sale_items WHERE sale_id = ?', [sale.id]);
    setSaleItems(items);
    const qtys: Record<string, string> = {};
    items.forEach(i => { qtys[i.id] = '0'; });
    setReturnQtys(qtys);
  };

  const total = saleItems.reduce((s, item) => {
    const qty = parseInt(returnQtys[item.id] ?? '0') || 0;
    return s + qty * item.unit_price;
  }, 0);

  const handleSubmit = () => {
    const returnLines = saleItems.filter(i => (parseInt(returnQtys[i.id] ?? '0') || 0) > 0);
    if (returnLines.length === 0) { Alert.alert('Error', 'Select at least one item to return.'); return; }
    const db = getDB();
    const id = nanoid();
    const timestamp = new Date().toISOString();
    db.runSync('BEGIN TRANSACTION');
    try {
      db.runSync(
        `INSERT INTO sell_returns (id, original_sale_id, contact_id, total, refund_method, reason, status, created_at)
         VALUES (?, ?, null, ?, ?, ?, 'approved', ?)`,
        [id, selectedSale?.id ?? null, total, refundMethod, reason || null, timestamp]
      );
      for (const item of returnLines) {
        const qty = parseInt(returnQtys[item.id] ?? '0') || 0;
        db.runSync(
          `INSERT INTO return_items (id, return_id, product_id, product_name, qty, unit_price, line_total) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [nanoid(), id, item.product_id, item.product_name, qty, item.unit_price, qty * item.unit_price]
        );
        if (item.product_id) {
          db.runSync(`UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?`, [qty, item.product_id]);
          db.runSync(
            `INSERT INTO stock_movements (id, product_id, delta, qty_after, reason, created_at) SELECT ?, ?, ?, stock_qty, 'Return', ? FROM products WHERE id = ?`,
            [nanoid(), item.product_id, qty, timestamp, item.product_id]
          );
        }
      }
      db.runSync('COMMIT');
      Alert.alert('Done', 'Return processed and stock restored.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e: any) { db.runSync('ROLLBACK'); Alert.alert('Error', e.message); }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Sale selector */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Original Sale</Text>
          <TouchableOpacity style={styles.saleBtn} onPress={() => setShowPicker(true)}>
            <Text style={styles.saleBtnText}>{selectedSale ? selectedSale.invoice_number : 'Select Sale…'}</Text>
          </TouchableOpacity>
        </View>

        {/* Items */}
        {selectedSale && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Return Items</Text>
            {saleItems.map(item => (
              <View key={item.id} style={styles.itemRow}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.itemName}>{item.product_name}</Text>
                  <Text style={styles.itemSub}>Sold: {item.quantity} @ {item.unit_price.toFixed(2)}</Text>
                </View>
                <TextInput
                  style={styles.qtyInput}
                  value={returnQtys[item.id] ?? '0'}
                  onChangeText={v => setReturnQtys(r => ({ ...r, [item.id]: v }))}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.rowBetween}><Text style={styles.totalLabel}>Refund Total</Text><Text style={styles.totalValue}>{total.toFixed(2)}</Text></View>
          </View>
        )}

        {/* Reason & method */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Details</Text>
          <Text style={styles.label}>Reason</Text>
          <TextInput style={styles.input} value={reason} onChangeText={setReason} placeholder="Defective, wrong item…" placeholderTextColor={C.textMuted} />
          <Text style={styles.label}>Refund Method</Text>
          <View style={styles.methodRow}>
            {(['cash', 'card', 'store_credit'] as const).map(m => (
              <TouchableOpacity key={m} style={[styles.methodBtn, refundMethod === m && styles.methodBtnActive]} onPress={() => setRefundMethod(m)}>
                <Text style={[styles.methodLabel, refundMethod === m && { color: '#fff' }]}>{m.replace('_', ' ')}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitBtnText}>↩️ Process Return</Text>
        </TouchableOpacity>
      </ScrollView>

      {showPicker && (
        <View style={styles.picker}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Select Sale</Text>
            <TouchableOpacity onPress={() => setShowPicker(false)}><Text style={{ color: C.danger, fontWeight: '700' }}>Close</Text></TouchableOpacity>
          </View>
          <ScrollView>
            {sales.map(s => (
              <TouchableOpacity key={s.id} style={styles.pickerItem} onPress={() => selectSale(s)}>
                <Text style={styles.pickerName}>{s.invoice_number}</Text>
                <Text style={styles.pickerSub}>{s.created_at.slice(0, 10)} · {s.total.toFixed(2)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 80 },
  card: { backgroundColor: C.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, ...Shadows.light },
  cardTitle: { fontSize: Typography.lg, fontWeight: '700', color: C.textPrimary, marginBottom: Spacing.md },
  saleBtn: { backgroundColor: C.surfaceVariant, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: C.border },
  saleBtnText: { fontSize: Typography.md, color: C.primary, fontWeight: '600' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: C.border },
  itemName: { fontSize: Typography.sm, fontWeight: '600', color: C.textPrimary },
  itemSub: { fontSize: Typography.xs, color: C.textSecondary },
  qtyInput: { flex: 1, backgroundColor: C.surfaceVariant, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 4, textAlign: 'center', fontSize: Typography.md, color: C.textPrimary },
  divider: { height: 1, backgroundColor: C.border, marginVertical: Spacing.sm },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: Typography.md, fontWeight: '700', color: C.textPrimary },
  totalValue: { fontSize: Typography.lg, fontWeight: '800', color: C.danger },
  label: { fontSize: Typography.sm, fontWeight: '600', color: C.textSecondary, marginBottom: 4 },
  input: { backgroundColor: C.surfaceVariant, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: C.border, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: Typography.md, color: C.textPrimary, marginBottom: Spacing.md },
  methodRow: { flexDirection: 'row', gap: Spacing.sm },
  methodBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: C.surfaceVariant, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  methodBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  methodLabel: { fontSize: Typography.sm, color: C.textSecondary, fontWeight: '600', textTransform: 'capitalize' },
  submitBtn: { backgroundColor: C.danger, borderRadius: BorderRadius.lg, paddingVertical: Spacing.md, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: Typography.md },
  picker: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', backgroundColor: C.surface, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.md, ...Shadows.heavy },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  pickerTitle: { fontSize: Typography.lg, fontWeight: '700', color: C.textPrimary },
  pickerItem: { paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: C.border },
  pickerName: { fontSize: Typography.md, fontWeight: '600', color: C.textPrimary },
  pickerSub: { fontSize: Typography.xs, color: C.textSecondary },
});
