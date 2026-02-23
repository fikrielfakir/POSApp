import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getDB } from '@core/database/db';
import { Expense } from '@core/database/types';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@shared/theme/theme';
import { getMeta } from '@core/database/dbHelpers';

const C = Colors.light;

export default function ExpenseListScreen() {
  const navigation = useNavigation<any>();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [currency, setCurrency] = useState('$');

  useEffect(() => { setCurrency(getMeta('currency_symbol') ?? '$'); }, []);

  useFocusEffect(React.useCallback(() => {
    const db = getDB();
    const rows = db.getAllSync<Expense>('SELECT * FROM expenses ORDER BY expense_date DESC LIMIT 100');
    setExpenses(rows);
    setTotal(rows.reduce((s, r) => s + r.amount, 0));
  }, []));

  return (
    <View style={styles.container}>
      <View style={styles.totalBanner}>
        <Text style={styles.totalLabel}>Total (all time)</Text>
        <Text style={styles.totalVal}>{currency}{total.toFixed(2)}</Text>
      </View>
      <FlatList
        data={expenses}
        keyExtractor={e => e.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.category}>{item.category}</Text>
              <Text style={styles.notes}>{item.notes ?? 'No notes'}</Text>
              <Text style={styles.date}>{item.expense_date}</Text>
            </View>
            <Text style={styles.amount}>{currency}{item.amount.toFixed(2)}</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No expenses yet.</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('ExpenseForm', {})}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  totalBanner: { backgroundColor: C.warning, padding: Spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: 'rgba(255,255,255,0.8)', fontSize: Typography.sm },
  totalVal: { color: '#fff', fontSize: Typography.xxl, fontWeight: '900' },
  list: { padding: Spacing.md, gap: Spacing.xs, paddingBottom: 100 },
  card: { backgroundColor: C.surface, borderRadius: BorderRadius.md, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', ...Shadows.light },
  category: { fontSize: Typography.md, fontWeight: '700', color: C.textPrimary },
  notes: { fontSize: Typography.xs, color: C.textSecondary, marginTop: 2 },
  date: { fontSize: Typography.xs, color: C.textMuted, marginTop: 2 },
  amount: { fontSize: Typography.lg, fontWeight: '800', color: C.warning },
  empty: { textAlign: 'center', color: C.textMuted, marginTop: 60 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: C.warning, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
});
