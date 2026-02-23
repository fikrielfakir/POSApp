import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing } from '@shared/theme/theme';
import { Product } from './types';
import { getAllProducts } from './ProductListScreen.helper';

// Lightweight product list screen as a starting point for Phase 6
export default function ProductListScreen() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await getAllProducts();
        if (mounted) {
          setProducts(list);
        }
      } catch {
        // ignore fetch errors for now
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(p) => p.id || ''}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.sub}>Stock: {item.stock ?? 0}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No products found</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => {}}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  item: { padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  name: { fontSize: Typography.md, fontWeight: '600' },
  sub: { fontSize: Typography.sm, color: Colors.light.textSecondary },
  empty: { textAlign: 'center', color: Colors.light.textSecondary, marginTop: 20 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 28 },
});
