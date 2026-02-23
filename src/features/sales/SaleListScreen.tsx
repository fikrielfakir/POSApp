import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius } from '../../shared/theme/theme';
import { getAllSales, Sale } from './saleRepository';

export default function SaleListScreen() {
  const navigation = useNavigation<any>();
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = () => {
    const list = getAllSales();
    setSales(list);
  };

  const filteredSales = searchQuery
    ? sales.filter(
        (s) =>
          s.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sales;

  const renderSale = ({ item }: { item: Sale }) => (
    <TouchableOpacity 
      style={styles.saleCard}
      onPress={() => navigation.navigate('Invoice', { id: item.id })}
    >
      <View style={styles.saleHeader}>
        <Text style={styles.invoiceNo}>{item.invoice_number}</Text>
        <Text style={[styles.status, item.status === 'voided' && styles.statusVoided]}>
          {item.status.toUpperCase()}
        </Text>
      </View>
      <View style={styles.saleDetails}>
        <Text style={styles.saleDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
        <Text style={styles.saleTotal}>${item.total.toFixed(2)}</Text>
      </View>
      <View style={styles.saleFooter}>
        <Text style={styles.paymentMethod}>{item.payment_method}</Text>
        {item.contact_id && <Text style={styles.contactId}>Customer: {item.contact_id}</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by invoice #..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <FlatList
        data={filteredSales}
        keyExtractor={(item) => item.id}
        renderItem={renderSale}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No sales found</Text>}
      />
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('POS')}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  searchBar: {
    padding: Spacing.md,
  },
  searchInput: {
    backgroundColor: Colors.light.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    fontSize: Typography.md,
  },
  list: { padding: Spacing.md },
  saleCard: {
    backgroundColor: Colors.light.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  invoiceNo: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.light.textPrimary,
  },
  status: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.light.success,
  },
  statusVoided: {
    color: Colors.light.danger,
  },
  saleDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  saleDate: {
    fontSize: Typography.sm,
    color: Colors.light.textMuted,
  },
  saleTotal: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  saleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentMethod: {
    fontSize: Typography.xs,
    color: Colors.light.textSecondary,
    textTransform: 'capitalize',
  },
  contactId: {
    fontSize: Typography.xs,
    color: Colors.light.textMuted,
  },
  empty: {
    textAlign: 'center',
    color: Colors.light.textMuted,
    marginTop: 40,
    fontSize: Typography.md,
  },
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