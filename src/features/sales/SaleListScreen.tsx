import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
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
    <TouchableOpacity style={styles.saleCard}>
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
