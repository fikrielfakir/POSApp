import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getDB } from '@core/database/db';
import { getAllProducts } from '@features/products/productRepository';
import { Product } from '@core/database/types';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@shared/theme/theme';
import { customAlphabet } from 'nanoid/non-secure';

const C = Colors.light;
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 10);

interface Line { productId: string; productName: string; qty: string; }

export default function StockTransferFormScreen() {
  const navigation = useNavigation<any>();
  const [fromWh, setFromWh] = useState('Main');
  const [toWh, setToWh] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => { setProducts(getAllProducts()); }, []);

  const addProduct = (p: Product) => {
    setShowPicker(false);
    if (lines.find(l => l.productId === p.id)) return;
    setLines(ls => [...ls, { productId: p.id, productName: p.name, qty: '1' }]);
  };

  const handleSave = () => {
    if (!toWh.trim()) { Alert.alert('Error', 'Destination warehouse is required.'); return; }
    if (lines.length === 0) { Alert.alert('Error', 'Add at least one product.'); return; }
    const db = getDB();
    const id = nanoid();
    const timestamp = new Date().toISOString();
    db.runSync('BEGIN TRANSACTION');
    try {
      db.runSync(
        `INSERT INTO stock_transfers (id, from_warehouse, to_warehouse, status, notes, created_at) VALUES (?, ?, ?, 'completed', ?, ?)`,
        [id, fromWh, toWh, notes || null, timestamp]
      );
      for (const line of lines) {
        const qty = parseInt(line.qty) || 0;
        db.runSync(
          `INSERT INTO transfer_items (id, transfer_id, product_id, product_name, qty) VALUES (?, ?, ?, ?, ?)`,
          [nanoid(), id, line.productId, line.productName, qty]
        );
        // Stock adjustment (in real multi-warehouse app this would be more complex)
        db.runSync(`UPDATE products SET stock_qty = MAX(0, stock_qty - ?) WHERE id = ?`, [qty, line.productId]);
        db.runSync(
          `INSERT INTO stock_movements (id, product_id, delta, qty_after, reason, created_at) SELECT ?, ?, ?, stock_qty, 'Transfer out', ? FROM products WHERE id = ?`,
          [nanoid(), line.productId, -qty, timestamp, line.productId]
        );
      }
      db.runSync('COMMIT');
      Alert.alert('Done', 'Stock transfer completed.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e: any) { db.runSync('ROLLBACK'); Alert.alert('Error', e.message); }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Stock Transfer</Text>
          <Text style={styles.label}>From Warehouse</Text>
          <TextInput style={styles.input} value={fromWh} onChangeText={setFromWh} placeholder="Main" placeholderTextColor={C.textMuted} />
          <Text style={styles.label}>To Warehouse *</Text>
          <TextInput style={styles.input} value={toWh} onChangeText={setToWh} placeholder="Branch / Warehouse name" placeholderTextColor={C.textMuted} />
          <Text style={styles.label}>Notes</Text>
          <TextInput style={[styles.input, { height: 60, textAlignVertical: 'top' }]} value={notes} onChangeText={setNotes} multiline placeholder="Notes…" placeholderTextColor={C.textMuted} />
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Items</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowPicker(true)}>
              <Text style={styles.addBtnText}>＋ Add</Text>
            </TouchableOpacity>
          </View>
          {lines.length === 0 && <Text style={styles.empty}>No items yet.</Text>}
          {lines.map((line, idx) => (
            <View key={line.productId} style={styles.lineRow}>
              <Text style={[styles.lineName, { flex: 2 }]}>{line.productName}</Text>
              <TextInput
                style={[styles.lineInput, { flex: 1 }]}
                value={line.qty}
                onChangeText={v => setLines(ls => ls.map((l, i) => i === idx ? { ...l, qty: v } : l))}
                keyboardType="numeric"
                placeholder="Qty"
              />
              <TouchableOpacity onPress={() => setLines(ls => ls.filter((_, i) => i !== idx))}>
                <Text style={{ color: C.danger, fontSize: 18, paddingHorizontal: 8 }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>🔄 Complete Transfer</Text>
        </TouchableOpacity>
      </ScrollView>

      {showPicker && (
        <View style={styles.picker}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Select Product</Text>
            <TouchableOpacity onPress={() => setShowPicker(false)}><Text style={{ color: C.danger, fontWeight: '700' }}>Close</Text></TouchableOpacity>
          </View>
          <ScrollView>
            {products.map(p => (
              <TouchableOpacity key={p.id} style={styles.pickerItem} onPress={() => addProduct(p)}>
                <Text style={styles.pickerName}>{p.name}</Text>
                <Text style={styles.pickerSub}>Stock: {p.stock_qty}</Text>
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
  label: { fontSize: Typography.sm, fontWeight: '600', color: C.textSecondary, marginBottom: 4 },
  input: { backgroundColor: C.surfaceVariant, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: C.border, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: Typography.md, color: C.textPrimary, marginBottom: Spacing.md },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addBtn: { backgroundColor: C.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.md },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: Typography.sm },
  empty: { color: C.textMuted, textAlign: 'center', paddingVertical: Spacing.md },
  lineRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: C.border },
  lineName: { fontSize: Typography.sm, fontWeight: '600', color: C.textPrimary },
  lineInput: { backgroundColor: C.surfaceVariant, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 4, fontSize: Typography.sm, color: C.textPrimary, textAlign: 'center' },
  saveBtn: { backgroundColor: C.primary, borderRadius: BorderRadius.lg, paddingVertical: Spacing.md, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: Typography.md },
  picker: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%', backgroundColor: C.surface, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.md, ...Shadows.heavy },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  pickerTitle: { fontSize: Typography.lg, fontWeight: '700', color: C.textPrimary },
  pickerItem: { paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: C.border },
  pickerName: { fontSize: Typography.md, fontWeight: '600', color: C.textPrimary },
  pickerSub: { fontSize: Typography.xs, color: C.textSecondary },
});
