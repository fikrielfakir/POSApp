import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createPurchase } from './purchaseRepository';
import { getAllProducts } from '@features/products/productRepository';
import { Product } from '@core/database/types';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@shared/theme/theme';

const C = Colors.light;

interface LineItem { productId: string; productName: string; qty: string; costPrice: string; }

export default function PurchaseFormScreen() {
  const navigation = useNavigation<any>();
  const [refNo, setRefNo] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => { setProducts(getAllProducts()); }, []);

  const addProduct = (p: Product) => {
    setShowPicker(false);
    if (lines.find(l => l.productId === p.id)) return;
    setLines(ls => [...ls, { productId: p.id, productName: p.name, qty: '1', costPrice: String(p.cost_price) }]);
  };

  const updateLine = (idx: number, field: 'qty' | 'costPrice', val: string) => {
    setLines(ls => ls.map((l, i) => i === idx ? { ...l, [field]: val } : l));
  };

  const removeLine = (idx: number) => setLines(ls => ls.filter((_, i) => i !== idx));

  const subtotal = lines.reduce((s, l) => s + (parseFloat(l.qty) || 0) * (parseFloat(l.costPrice) || 0), 0);

  const handleSave = () => {
    if (lines.length === 0) { Alert.alert('Error', 'Add at least one product.'); return; }
    try {
      createPurchase({
        ref_no: refNo || null,
        notes: notes || null,
        items: lines.map(l => ({
          product_id: l.productId,
          product_name: l.productName,
          qty: parseFloat(l.qty) || 1,
          cost_price: parseFloat(l.costPrice) || 0,
        })),
      });
      Alert.alert('Created', 'Purchase order created.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.cardTitle}>New Purchase Order</Text>
          <Text style={styles.label}>Reference No.</Text>
          <TextInput style={styles.input} value={refNo} onChangeText={setRefNo} placeholder="PO-001" placeholderTextColor={C.textMuted} />
          <Text style={styles.label}>Notes</Text>
          <TextInput style={[styles.input, { height: 60, textAlignVertical: 'top' }]} value={notes} onChangeText={setNotes} multiline placeholder="Notes…" placeholderTextColor={C.textMuted} />
        </View>

        {/* Lines */}
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
              <View style={{ flex: 2 }}>
                <Text style={styles.lineName}>{line.productName}</Text>
              </View>
              <TextInput style={[styles.lineInput, { flex: 1 }]} value={line.qty} onChangeText={v => updateLine(idx, 'qty', v)} keyboardType="numeric" placeholder="Qty" />
              <TextInput style={[styles.lineInput, { flex: 1 }]} value={line.costPrice} onChangeText={v => updateLine(idx, 'costPrice', v)} keyboardType="numeric" placeholder="Cost" />
              <TouchableOpacity onPress={() => removeLine(idx)} style={styles.removeBtn}>
                <Text style={{ color: C.danger, fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.divider} />
          <View style={styles.rowBetween}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{subtotal.toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>💾 Save Purchase Order</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Product picker modal */}
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
                <Text style={styles.pickerSub}>Cost: {p.cost_price.toFixed(2)} · Stock: {p.stock_qty}</Text>
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
  removeBtn: { paddingHorizontal: Spacing.xs },
  divider: { height: 1, backgroundColor: C.border, marginVertical: Spacing.sm },
  totalLabel: { fontSize: Typography.md, fontWeight: '700', color: C.textPrimary },
  totalValue: { fontSize: Typography.lg, fontWeight: '800', color: C.primary },
  saveBtn: { backgroundColor: C.primary, borderRadius: BorderRadius.lg, paddingVertical: Spacing.md, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: Typography.md },
  picker: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%', backgroundColor: C.surface, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.md, ...Shadows.heavy },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  pickerTitle: { fontSize: Typography.lg, fontWeight: '700', color: C.textPrimary },
  pickerItem: { paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: C.border },
  pickerName: { fontSize: Typography.md, fontWeight: '600', color: C.textPrimary },
  pickerSub: { fontSize: Typography.xs, color: C.textSecondary },
});
