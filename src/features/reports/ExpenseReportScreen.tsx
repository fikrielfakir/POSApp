import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { getDB } from '@core/database/db';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@shared/theme/theme';
import { getMeta } from '@core/database/dbHelpers';
import { Expense } from '@core/database/types';

const C = Colors.light;
const PERIODS = ['This Week', 'This Month', 'This Year'];

export default function ExpenseReportScreen() {
  const [period, setPeriod] = useState('This Month');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [byCategory, setByCategory] = useState<{ category: string; total: number }[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [currency, setCurrency] = useState('$');

  useEffect(() => { setCurrency(getMeta('currency_symbol') ?? '$'); }, []);
  useEffect(() => { loadData(); }, [period]);

  const getDateRange = () => {
    const now = new Date();
    const start = new Date();
    if (period === 'This Week') { start.setDate(now.getDate() - now.getDay()); }
    else if (period === 'This Month') { start.setDate(1); }
    else { start.setMonth(0, 1); }
    return [start.toISOString().slice(0, 10), now.toISOString().slice(0, 10)];
  };

  const loadData = () => {
    const db = getDB();
    const [start, end] = getDateRange();
    const rows = db.getAllSync<Expense>(
      `SELECT * FROM expenses WHERE expense_date BETWEEN ? AND ? ORDER BY expense_date DESC`, [start, end]
    );
    setExpenses(rows);
    setGrandTotal(rows.reduce((s, r) => s + r.amount, 0));
    const catMap: Record<string, number> = {};
    rows.forEach(r => { catMap[r.category] = (catMap[r.category] ?? 0) + r.amount; });
    setByCategory(Object.entries(catMap).map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total));
  };

  const exportCSV = () => {
    const header = 'Date,Category,Amount,Notes\n';
    const rows = expenses.map(e => `${e.expense_date},${e.category},${e.amount.toFixed(2)},${e.notes ?? ''}`).join('\n');
    Alert.alert('CSV Export', 'Ready to export:\n\n' + header + rows.slice(0, 300));
  };

  const fmt = (n: number) => `${currency}${n.toFixed(2)}`;

  return (
    <View style={styles.container}>
      <View style={styles.periodRow}>
        {PERIODS.map(p => (
          <TouchableOpacity key={p} style={[styles.periodBtn, period === p && styles.periodBtnActive]} onPress={() => setPeriod(p)}>
            <Text style={[styles.periodLabel, period === p && styles.periodLabelActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Total */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Expenses</Text>
        <Text style={styles.totalValue}>{fmt(grandTotal)}</Text>
        <Text style={styles.totalSub}>{expenses.length} records · {period}</Text>
      </View>

      {/* By category */}
      {byCategory.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>By Category</Text>
          {byCategory.map(cat => {
            const pct = grandTotal > 0 ? (cat.total / grandTotal) * 100 : 0;
            return (
              <View key={cat.category} style={styles.catRow}>
                <Text style={styles.catName}>{cat.category}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.bar, { width: `${pct}%`, backgroundColor: C.warning }]} />
                </View>
                <Text style={styles.catAmt}>{fmt(cat.total)}</Text>
              </View>
            );
          })}
        </View>
      )}

      <TouchableOpacity style={styles.exportBtn} onPress={exportCSV}>
        <Text style={styles.exportText}>📤 Export CSV</Text>
      </TouchableOpacity>

      <FlatList
        data={expenses}
        keyExtractor={e => e.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowCat}>{item.category}</Text>
              <Text style={styles.rowNote}>{item.notes ?? 'No notes'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.rowAmt}>{fmt(item.amount)}</Text>
              <Text style={styles.rowDate}>{item.expense_date}</Text>
            </View>
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No expenses in this period.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  periodRow: { flexDirection: 'row', gap: Spacing.xs, padding: Spacing.md, paddingBottom: Spacing.sm },
  periodBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: C.surface, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  periodBtnActive: { backgroundColor: C.warning, borderColor: C.warning },
  periodLabel: { fontSize: Typography.xs, color: C.textSecondary, fontWeight: '600' },
  periodLabelActive: { color: '#fff' },
  totalCard: { marginHorizontal: Spacing.md, backgroundColor: C.warning, borderRadius: BorderRadius.xl, padding: Spacing.xl, marginBottom: Spacing.sm },
  totalLabel: { color: 'rgba(255,255,255,0.8)', fontSize: Typography.sm, fontWeight: '600' },
  totalValue: { color: '#fff', fontSize: Typography.xxxl, fontWeight: '900', marginVertical: 4 },
  totalSub: { color: 'rgba(255,255,255,0.7)', fontSize: Typography.xs },
  card: { marginHorizontal: Spacing.md, backgroundColor: C.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.sm, ...Shadows.light },
  cardTitle: { fontSize: Typography.md, fontWeight: '700', color: C.textPrimary, marginBottom: Spacing.sm },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  catName: { fontSize: Typography.sm, color: C.textSecondary, width: 90 },
  barTrack: { flex: 1, height: 8, backgroundColor: C.surfaceVariant, borderRadius: 4, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 4 },
  catAmt: { fontSize: Typography.sm, fontWeight: '700', color: C.textPrimary, width: 70, textAlign: 'right' },
  exportBtn: { marginHorizontal: Spacing.md, marginBottom: Spacing.sm, backgroundColor: C.surfaceVariant, borderRadius: BorderRadius.md, paddingVertical: Spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  exportText: { color: C.primary, fontWeight: '700', fontSize: Typography.sm },
  list: { paddingHorizontal: Spacing.md, paddingBottom: 40 },
  row: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.xs, ...Shadows.light },
  rowCat: { fontSize: Typography.md, fontWeight: '600', color: C.textPrimary },
  rowNote: { fontSize: Typography.xs, color: C.textSecondary, marginTop: 2 },
  rowAmt: { fontSize: Typography.md, fontWeight: '700', color: C.warning },
  rowDate: { fontSize: Typography.xs, color: C.textMuted },
  empty: { textAlign: 'center', color: C.textMuted, marginTop: 40 },
});
