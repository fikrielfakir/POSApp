import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, Alert } from 'react-native';
import { getDB } from '@core/database/db';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@shared/theme/theme';
import { getMeta } from '@core/database/dbHelpers';
import { Sale } from '@features/sales/saleRepository';

const C = Colors.light;
const PERIODS = ['Today', 'This Week', 'This Month', 'This Year'];

export default function SalesReportScreen() {
  const [period, setPeriod] = useState('This Month');
  const [sales, setSales] = useState<Sale[]>([]);
  const [totals, setTotals] = useState({ revenue: 0, tax: 0, discount: 0, count: 0 });
  const [currency, setCurrency] = useState('$');

  useEffect(() => { setCurrency(getMeta('currency_symbol') ?? '$'); }, []);
  useEffect(() => { loadData(); }, [period]);

  const getDateRange = () => {
    const now = new Date();
    const start = new Date();
    if (period === 'Today') { start.setHours(0, 0, 0, 0); }
    else if (period === 'This Week') { start.setDate(now.getDate() - now.getDay()); start.setHours(0, 0, 0, 0); }
    else if (period === 'This Month') { start.setDate(1); start.setHours(0, 0, 0, 0); }
    else { start.setMonth(0, 1); start.setHours(0, 0, 0, 0); }
    return [start.toISOString(), now.toISOString()];
  };

  const loadData = () => {
    const db = getDB();
    const [start, end] = getDateRange();
    const rows = db.getAllSync<Sale>(
      `SELECT s.*, c.name as contact_name FROM sales s LEFT JOIN contacts c ON s.contact_id = c.id 
       WHERE s.status = 'completed' AND s.created_at BETWEEN ? AND ? ORDER BY s.created_at DESC`,
      [start, end]
    );
    setSales(rows);
    const t = rows.reduce((acc, s) => ({ revenue: acc.revenue + s.total, tax: acc.tax + s.tax_amount, discount: acc.discount + s.discount_amount, count: acc.count + 1 }), { revenue: 0, tax: 0, discount: 0, count: 0 });
    setTotals(t);
  };

  const exportCSV = () => {
    const header = 'Invoice,Date,Customer,Total,Tax,Discount,Payment\n';
    const rows = sales.map(s =>
      `${s.invoice_number},${s.created_at.slice(0, 10)},${(s as any).contact_name ?? ''},${s.total.toFixed(2)},${s.tax_amount.toFixed(2)},${s.discount_amount.toFixed(2)},${s.payment_method}`
    ).join('\n');
    Alert.alert('CSV Export', 'CSV export feature requires expo-sharing. Data ready to export:\n\n' + header + rows.slice(0, 200));
  };

  const fmt = (n: number) => `${currency}${n.toFixed(2)}`;

  return (
    <View style={styles.container}>
      {/* Period */}
      <View style={styles.periodRow}>
        {PERIODS.map(p => (
          <TouchableOpacity key={p} style={[styles.periodBtn, period === p && styles.periodBtnActive]} onPress={() => setPeriod(p)}>
            <Text style={[styles.periodLabel, period === p && styles.periodLabelActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatBox label="Revenue" value={fmt(totals.revenue)} color={C.primary} />
        <StatBox label="Tax" value={fmt(totals.tax)} color={C.warning} />
        <StatBox label="Count" value={String(totals.count)} color={C.info} />
      </View>

      {/* Export */}
      <TouchableOpacity style={styles.exportBtn} onPress={exportCSV}>
        <Text style={styles.exportText}>📤 Export CSV</Text>
      </TouchableOpacity>

      {/* List */}
      <FlatList
        data={sales}
        keyExtractor={s => s.id}
        renderItem={({ item }) => (
          <View style={styles.saleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.saleInv}>{item.invoice_number}</Text>
              <Text style={styles.saleSub}>{(item as any).contact_name ?? 'Walk-in'} · {item.payment_method}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.saleTotal}>{fmt(item.total)}</Text>
              <Text style={styles.saleDate}>{item.created_at.slice(0, 10)}</Text>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>No sales in this period.</Text>}
      />
    </View>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  const s = StyleSheet.create({ card: { flex: 1, backgroundColor: C.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', margin: Spacing.xs, ...Shadows.light }, val: { fontSize: Typography.lg, fontWeight: '800' }, lbl: { fontSize: Typography.xs, color: C.textSecondary, marginTop: 2 } });
  return <View style={s.card}><Text style={[s.val, { color }]}>{value}</Text><Text style={s.lbl}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  periodRow: { flexDirection: 'row', gap: Spacing.xs, padding: Spacing.md, paddingBottom: 0 },
  periodBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: C.surface, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  periodBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  periodLabel: { fontSize: Typography.xs, color: C.textSecondary, fontWeight: '600' },
  periodLabelActive: { color: '#fff' },
  statsRow: { flexDirection: 'row', padding: Spacing.sm },
  exportBtn: { marginHorizontal: Spacing.md, marginBottom: Spacing.sm, backgroundColor: C.surfaceVariant, borderRadius: BorderRadius.md, paddingVertical: Spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  exportText: { color: C.primary, fontWeight: '700', fontSize: Typography.sm },
  listContent: { paddingHorizontal: Spacing.md, paddingBottom: 40 },
  saleRow: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.xs, ...Shadows.light },
  saleInv: { fontSize: Typography.md, fontWeight: '700', color: C.textPrimary },
  saleSub: { fontSize: Typography.xs, color: C.textSecondary, marginTop: 2 },
  saleTotal: { fontSize: Typography.md, fontWeight: '800', color: C.primary },
  saleDate: { fontSize: Typography.xs, color: C.textMuted },
  empty: { textAlign: 'center', color: C.textMuted, marginTop: 40 },
});
