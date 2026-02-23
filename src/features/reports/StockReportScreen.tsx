import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { getDB } from '@core/database/db';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@shared/theme/theme';
import { getMeta } from '@core/database/dbHelpers';

const C = Colors.light;

interface StockRow {
  id: string; name: string; sku: string | null; stock_qty: number;
  cost_price: number; sale_price: number; reorder_level: number;
  category_name: string | null;
}

type SortKey = 'name' | 'stock_qty' | 'value';

export default function StockReportScreen() {
  const [rows, setRows] = useState<StockRow[]>([]);
  const [sort, setSort] = useState<SortKey>('name');
  const [currency, setCurrency] = useState('$');
  const [totals, setTotals] = useState({ stockVal: 0, retailVal: 0, lowCount: 0 });

  useEffect(() => { setCurrency(getMeta('currency_symbol') ?? '$'); loadData(); }, []);

  const loadData = () => {
    const db = getDB();
    const data = db.getAllSync<StockRow>(
      `SELECT p.id, p.name, p.sku, p.stock_qty, p.cost_price, p.sale_price, p.reorder_level, c.name as category_name
       FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = 1`
    );
    setRows(data);
    const stockVal = data.reduce((s, r) => s + r.stock_qty * r.cost_price, 0);
    const retailVal = data.reduce((s, r) => s + r.stock_qty * r.sale_price, 0);
    const lowCount = data.filter(r => r.stock_qty <= r.reorder_level).length;
    setTotals({ stockVal, retailVal, lowCount });
  };

  const sorted = [...rows].sort((a, b) => {
    if (sort === 'stock_qty') return a.stock_qty - b.stock_qty;
    if (sort === 'value') return (b.stock_qty * b.cost_price) - (a.stock_qty * a.cost_price);
    return a.name.localeCompare(b.name);
  });

  const fmt = (n: number) => `${currency}${n.toFixed(2)}`;

  return (
    <View style={styles.container}>
      {/* Totals */}
      <View style={styles.statsRow}>
        <StatBox label="Stock Value" value={fmt(totals.stockVal)} color={C.primary} />
        <StatBox label="Retail Value" value={fmt(totals.retailVal)} color={C.success} />
        <StatBox label="Low Stock" value={String(totals.lowCount)} color={C.danger} />
      </View>

      {/* Sort */}
      <View style={styles.sortRow}>
        {(['name', 'stock_qty', 'value'] as SortKey[]).map(k => (
          <TouchableOpacity key={k} style={[styles.sortBtn, sort === k && styles.sortBtnActive]} onPress={() => setSort(k)}>
            <Text style={[styles.sortLabel, sort === k && { color: '#fff' }]}>{k === 'stock_qty' ? 'Stock ↑' : k === 'value' ? 'Value ↓' : 'Name'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={sorted}
        keyExtractor={r => r.id}
        renderItem={({ item }) => {
          const isLow = item.stock_qty <= item.reorder_level;
          const val = item.stock_qty * item.cost_price;
          return (
            <View style={[styles.row, isLow && styles.rowLow]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.sub}>{item.category_name ?? 'Uncategorised'}{item.sku ? ` · ${item.sku}` : ''}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.qty, { color: isLow ? C.danger : C.textPrimary }]}>{item.stock_qty} units</Text>
                <Text style={styles.val}>{fmt(val)}</Text>
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No products found.</Text>}
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
  statsRow: { flexDirection: 'row', padding: Spacing.sm },
  sortRow: { flexDirection: 'row', gap: Spacing.xs, marginHorizontal: Spacing.md, marginBottom: Spacing.sm },
  sortBtn: { flex: 1, paddingVertical: Spacing.xs, borderRadius: BorderRadius.md, backgroundColor: C.surfaceVariant, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  sortBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  sortLabel: { fontSize: Typography.xs, fontWeight: '600', color: C.textSecondary },
  list: { paddingHorizontal: Spacing.md, paddingBottom: 40 },
  row: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.xs, ...Shadows.light },
  rowLow: { borderLeftWidth: 3, borderLeftColor: C.danger },
  name: { fontSize: Typography.md, fontWeight: '600', color: C.textPrimary },
  sub: { fontSize: Typography.xs, color: C.textSecondary, marginTop: 2 },
  qty: { fontSize: Typography.md, fontWeight: '700' },
  val: { fontSize: Typography.xs, color: C.textSecondary },
  empty: { textAlign: 'center', color: C.textMuted, marginTop: 40 },
});
