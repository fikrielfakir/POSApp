import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, FlatList, Image,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProductStackParamList } from '@navigation/types';
import { getProductById, softDeleteProduct } from './productRepository';
import { Product } from './types';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@shared/theme/theme';
import { getDB } from '@core/database/db';

const C = Colors.light;

type RoutePropType = RouteProp<ProductStackParamList, 'ProductDetail'>;
type NavProp = NativeStackNavigationProp<ProductStackParamList>;

interface Movement { id: string; delta: number; qty_after: number; reason: string | null; created_at: string; }

export default function ProductDetailScreen() {
  const route = useRoute<RoutePropType>();
  const navigation = useNavigation<NavProp>();
  const { productId } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);

  useEffect(() => { load(); }, []);

  const load = () => {
    const p = getProductById(productId);
    setProduct(p);
    if (p) {
      const db = getDB();
      const rows = db.getAllSync<Movement>(
        `SELECT * FROM stock_movements WHERE product_id = ? ORDER BY created_at DESC LIMIT 20`,
        [productId]
      );
      setMovements(rows);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Product', 'Delete this product? It will be hidden from lists.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { softDeleteProduct(productId); navigation.goBack(); } },
    ]);
  };

  if (!product) return <View style={styles.center}><Text>Product not found.</Text></View>;

  const stockColor = product.stock_qty <= product.reorder_level ? C.danger : product.stock_qty <= product.reorder_level * 1.5 ? C.warning : C.success;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.productName}>{product.name}</Text>
            {product.sku ? <Text style={styles.sku}>SKU: {product.sku}</Text> : null}
            {product.barcode ? <Text style={styles.sku}>Barcode: {product.barcode}</Text> : null}
          </View>
          {product.image_base64 ? (
            <Image source={{ uri: `data:image/jpeg;base64,${product.image_base64}` }} style={styles.productImage} />
          ) : (
            <View style={styles.imagePlaceholder}><Text style={{ fontSize: 36 }}>📦</Text></View>
          )}
        </View>
        {product.description ? <Text style={styles.desc}>{product.description}</Text> : null}
      </View>

      {/* Pricing */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Pricing</Text>
        <View style={styles.row}>
          <Stat label="Sale Price" value={`${product.sale_price.toFixed(2)}`} accent={C.primary} />
          <Stat label="Cost Price" value={`${product.cost_price.toFixed(2)}`} />
          <Stat label="Tax" value={`${product.tax_pct}%`} />
        </View>
      </View>

      {/* Stock */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Stock</Text>
        <View style={styles.row}>
          <Stat label="In Stock" value={`${product.stock_qty} ${product.unit}`} accent={stockColor} />
          <Stat label="Reorder At" value={`${product.reorder_level}`} />
          <Stat label="Unit" value={product.unit} />
        </View>
      </View>

      {/* Stock movements */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Recent Stock Movements</Text>
        {movements.length === 0 ? (
          <Text style={styles.empty}>No movements yet.</Text>
        ) : (
          movements.map(m => (
            <View key={m.id} style={styles.movementRow}>
              <Text style={[styles.delta, { color: m.delta >= 0 ? C.success : C.danger }]}>
                {m.delta >= 0 ? `+${m.delta}` : m.delta}
              </Text>
              <Text style={styles.movementReason}>{m.reason ?? 'Adjustment'}</Text>
              <Text style={styles.movementDate}>{m.created_at.slice(0, 10)}</Text>
            </View>
          ))
        )}
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: C.primary }]}
          onPress={() => navigation.navigate('ProductForm', { productId })}
        >
          <Text style={styles.btnText}>✏️ Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: C.warning }]}
          onPress={() => navigation.navigate('StockAdjust', { productId })}
        >
          <Text style={styles.btnText}>📊 Adjust Stock</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: C.danger }]} onPress={handleDelete}>
          <Text style={styles.btnText}>🗑️ Delete</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={[styles.statValue, accent ? { color: accent } : {}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { padding: Spacing.md, gap: Spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: C.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, ...Shadows.light },
  headerRow: { flexDirection: 'row', gap: Spacing.md },
  productName: { fontSize: Typography.xl, fontWeight: '800', color: C.textPrimary },
  sku: { fontSize: Typography.sm, color: C.textSecondary, marginTop: 2 },
  desc: { fontSize: Typography.md, color: C.textSecondary, marginTop: Spacing.sm },
  productImage: { width: 80, height: 80, borderRadius: BorderRadius.md },
  imagePlaceholder: { width: 80, height: 80, borderRadius: BorderRadius.md, backgroundColor: C.surfaceVariant, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: Typography.md, fontWeight: '700', color: C.textPrimary, marginBottom: Spacing.sm },
  row: { flexDirection: 'row', gap: Spacing.sm },
  statValue: { fontSize: Typography.lg, fontWeight: '700', color: C.textPrimary },
  statLabel: { fontSize: Typography.xs, color: C.textSecondary, marginTop: 2 },
  movementRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: C.border },
  delta: { fontSize: Typography.md, fontWeight: '700', width: 50 },
  movementReason: { flex: 1, fontSize: Typography.sm, color: C.textSecondary },
  movementDate: { fontSize: Typography.xs, color: C.textMuted },
  empty: { fontSize: Typography.sm, color: C.textMuted, textAlign: 'center', paddingVertical: Spacing.md },
  actionsRow: { flexDirection: 'row', gap: Spacing.sm },
  btn: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: Typography.sm },
});
