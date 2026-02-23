import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { Colors, Typography, Spacing, BorderRadius } from '@shared/theme/theme';
import { Product } from '@core/database/types';
import { getAllProducts } from './ProductListScreen.helper';
import { createProduct } from './productRepository';
import { customAlphabet } from 'nanoid/non-secure';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 10);

export default function ProductListScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadProducts = useCallback(() => {
    try {
      const list = getAllProducts();
      setProducts(list);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProducts();
    setRefreshing(false);
  }, [loadProducts]);

  const handleImportJSON = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const fileUri = result.assets[0].uri;
      
      // Use fetch instead of deprecated FileSystem API
      const response = await fetch(fileUri);
      const fileContent = await response.text();
      const importedData = JSON.parse(fileContent);

      const productsToImport = Array.isArray(importedData) ? importedData : [importedData];
      
      let importedCount = 0;
      for (const p of productsToImport) {
        if (!p.name || !p.sale_price) continue;
        
        createProduct({
          id: p.id || nanoid(),
          name: p.name,
          sku: p.sku || null,
          barcode: p.barcode || null,
          unit: p.unit || 'pcs',
          sale_price: parseFloat(p.sale_price) || 0,
          cost_price: parseFloat(p.cost_price) || 0,
          tax_pct: parseFloat(p.tax_pct) || 0,
          stock_qty: parseInt(p.stock_qty) || 0,
          reorder_level: parseInt(p.reorder_level) || 0,
          description: p.description || null,
          is_active: p.is_active !== undefined ? (p.is_active ? 1 : 0) : 1,
          category_id: p.category_id || null,
          brand_id: p.brand_id || null,
          created_at: new Date().toISOString(),
        });
        importedCount++;
      }

      Alert.alert('Import Success', `Successfully imported ${importedCount} products.`);
      loadProducts();
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Import Error', 'Failed to parse or import JSON file.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.importBtn} onPress={handleImportJSON}>
          <Text style={styles.importBtnText}>📥 Import JSON</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={products}
        keyExtractor={(p) => p.id || ''}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.sub}>Stock: {item.stock_qty ?? 0} | Price: ${item.sale_price}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No products found</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('ProductForm')}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerActions: { padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  importBtn: { 
    backgroundColor: Colors.light.surfaceVariant, 
    padding: Spacing.sm, 
    borderRadius: BorderRadius.md, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border
  },
  importBtnText: { color: Colors.light.primary, fontWeight: '600' },
  item: { padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.light.border, backgroundColor: Colors.light.surface },
  name: { fontSize: Typography.md, fontWeight: '600', color: Colors.light.textPrimary },
  sub: { fontSize: Typography.sm, color: Colors.light.textSecondary, marginTop: 4 },
  empty: { textAlign: 'center', color: Colors.light.textSecondary, marginTop: 40 },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 28 },
});
