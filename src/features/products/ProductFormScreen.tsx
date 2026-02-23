import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Switch,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProductStackParamList } from '@navigation/types';
import { getProductById, createProduct, updateProduct } from './productRepository';
import { Product } from './types';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@shared/theme/theme';
import { findAll } from '@core/database/dbHelpers';
import { Category, Brand } from '@core/database/types';
import { v4 as uuidv4 } from 'uuid';

const C = Colors.light;

type RoutePropType = RouteProp<ProductStackParamList, 'ProductForm'>;
type NavProp = NativeStackNavigationProp<ProductStackParamList>;

interface Field { label: string; key: keyof FormState; numeric?: boolean; multiline?: boolean; }

interface FormState {
  name: string; sku: string; barcode: string; unit: string;
  sale_price: string; cost_price: string; tax_pct: string;
  reorder_level: string; description: string; is_active: boolean;
  category_id: string; brand_id: string;
}

const FIELDS: Field[] = [
  { label: 'Name *', key: 'name' },
  { label: 'SKU', key: 'sku' },
  { label: 'Barcode', key: 'barcode' },
  { label: 'Unit (pcs/kg/box…)', key: 'unit' },
  { label: 'Sale Price *', key: 'sale_price', numeric: true },
  { label: 'Cost Price', key: 'cost_price', numeric: true },
  { label: 'Tax %', key: 'tax_pct', numeric: true },
  { label: 'Reorder Level', key: 'reorder_level', numeric: true },
  { label: 'Description', key: 'description', multiline: true },
];

export default function ProductFormScreen() {
  const route = useRoute<RoutePropType>();
  const navigation = useNavigation<NavProp>();
  const editId = route.params?.productId;
  const isEdit = !!editId;

  const [form, setForm] = useState<FormState>({
    name: '', sku: '', barcode: '', unit: 'pcs',
    sale_price: '0', cost_price: '0', tax_pct: '0',
    reorder_level: '5', description: '', is_active: true,
    category_id: '', brand_id: '',
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCategories(findAll<Category>('categories', {}));
    setBrands(findAll<Brand>('brands', {}));
    if (isEdit && editId) {
      const p = getProductById(editId);
      if (p) setForm({
        name: p.name, sku: p.sku ?? '', barcode: p.barcode ?? '',
        unit: p.unit, sale_price: String(p.sale_price), cost_price: String(p.cost_price),
        tax_pct: String(p.tax_pct), reorder_level: String(p.reorder_level),
        description: p.description ?? '', is_active: !!p.is_active,
        category_id: p.category_id ?? '', brand_id: p.brand_id ?? '',
      });
    }
  }, []);

  const set = (k: keyof FormState, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.name.trim()) { Alert.alert('Validation', 'Product name is required.'); return; }
    if (isNaN(parseFloat(form.sale_price))) { Alert.alert('Validation', 'Sale price must be a number.'); return; }
    setSaving(true);
    const data: Partial<Product> = {
      name: form.name.trim(),
      sku: form.sku || null,
      barcode: form.barcode || null,
      unit: form.unit || 'pcs',
      sale_price: parseFloat(form.sale_price) || 0,
      cost_price: parseFloat(form.cost_price) || 0,
      tax_pct: parseFloat(form.tax_pct) || 0,
      reorder_level: parseInt(form.reorder_level) || 0,
      description: form.description || null,
      is_active: form.is_active ? 1 : 0,
      category_id: form.category_id || null,
      brand_id: form.brand_id || null,
    };
    try {
      if (isEdit && editId) { updateProduct(editId, data); }
      else { createProduct({ ...data, id: uuidv4(), stock_qty: 0, created_at: new Date().toISOString() }); }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setSaving(false); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{isEdit ? 'Edit Product' : 'New Product'}</Text>

        {FIELDS.map(f => (
          <View key={f.key} style={styles.fieldGroup}>
            <Text style={styles.label}>{f.label}</Text>
            <TextInput
              style={[styles.input, f.multiline && styles.inputMulti]}
              value={String(form[f.key])}
              onChangeText={v => set(f.key, v)}
              keyboardType={f.numeric ? 'numeric' : 'default'}
              multiline={f.multiline}
              numberOfLines={f.multiline ? 3 : 1}
              placeholder={f.label}
              placeholderTextColor={C.textMuted}
            />
          </View>
        ))}

        {/* Category picker */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.chips}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.chip, form.category_id === cat.id && styles.chipActive]}
                onPress={() => set('category_id', form.category_id === cat.id ? '' : cat.id)}
              >
                <Text style={[styles.chipText, form.category_id === cat.id && styles.chipTextActive]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Brand picker */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Brand</Text>
          <View style={styles.chips}>
            {brands.map(b => (
              <TouchableOpacity
                key={b.id}
                style={[styles.chip, form.brand_id === b.id && styles.chipActive]}
                onPress={() => set('brand_id', form.brand_id === b.id ? '' : b.id)}
              >
                <Text style={[styles.chipText, form.brand_id === b.id && styles.chipTextActive]}>{b.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Active toggle */}
        <View style={[styles.fieldGroup, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
          <Text style={styles.label}>Active</Text>
          <Switch value={form.is_active} onValueChange={v => set('is_active', v)} />
        </View>
      </View>

      <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? 'Saving…' : isEdit ? '💾 Save Changes' : '➕ Create Product'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { padding: Spacing.md, gap: Spacing.md },
  card: { backgroundColor: C.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, ...Shadows.light },
  cardTitle: { fontSize: Typography.lg, fontWeight: '800', color: C.textPrimary, marginBottom: Spacing.lg },
  fieldGroup: { marginBottom: Spacing.md },
  label: { fontSize: Typography.sm, fontWeight: '600', color: C.textSecondary, marginBottom: Spacing.xs },
  input: {
    backgroundColor: C.surfaceVariant, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: Typography.md, color: C.textPrimary, borderWidth: 1, borderColor: C.border,
  },
  inputMulti: { height: 80, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, backgroundColor: C.surfaceVariant, borderWidth: 1, borderColor: C.border },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: Typography.sm, color: C.textSecondary },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  saveBtn: { backgroundColor: C.primary, borderRadius: BorderRadius.lg, paddingVertical: Spacing.lg, alignItems: 'center', marginBottom: Spacing.xxxl },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: Typography.lg },
});
