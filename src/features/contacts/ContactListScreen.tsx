import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../shared/theme/theme';
import { getAllContacts, Contact } from './contactRepository';

export default function ContactListScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'customer' | 'supplier'>('all');

  useEffect(() => {
    loadContacts();
  }, [filterType]);

    ? contacts.filter(
        (c) =>
          c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.phone?.includes(searchQuery) ||
          c.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : contacts;

        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        {item.phone && <Text style={styles.contactPhone}>{item.phone}</Text>}
        {item.email && <Text style={styles.contactEmail}>{item.email}</Text>}
      </View>
      <View style={styles.contactType}>
        <Text style={[styles.typeBadge, item.contact_type === 'customer' && styles.typeCustomer, item.contact_type === 'supplier' && styles.typeSupplier]}>
          {item.contact_type}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <View style={styles.filterRow}>
        {(['all', 'customer', 'supplier'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.filterButton, filterType === type && styles.filterButtonActive]}
            onPress={() => setFilterType(type)}
          >
            <Text style={[styles.filterText, filterType === type && styles.filterTextActive]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  searchBar: { padding: Spacing.md },
  searchInput: {
    backgroundColor: Colors.light.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    fontSize: Typography.md,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.surface,
    marginRight: Spacing.sm,
  },
  filterButtonActive: {
    backgroundColor: Colors.light.primary,
  },
  filterText: {
    fontSize: Typography.sm,
    color: Colors.light.textSecondary,
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  list: { padding: Spacing.md },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: Typography.lg,
    fontWeight: '700',
  },
  contactInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  contactName: {
    fontSize: Typography.md,
    fontWeight: '600',
    color: Colors.light.textPrimary,
  },
  contactPhone: {
    fontSize: Typography.sm,
    color: Colors.light.textSecondary,
  },
  contactEmail: {
    fontSize: Typography.xs,
    color: Colors.light.textMuted,
  },
  contactType: {},
  typeBadge: {
    fontSize: Typography.xs,
    fontWeight: '600',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  typeCustomer: {
    backgroundColor: Colors.light.success + '20',
    color: Colors.light.success,
  },
  typeSupplier: {
    backgroundColor: Colors.light.info + '20',
    color: Colors.light.info,
  },
