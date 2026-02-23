import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { getDB } from '@core/database/db';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@shared/theme/theme';
import { getMeta } from '@core/database/dbHelpers';

const C = Colors.light;

interface PLData {
  revenue: number; cogs: number; grossProfit: number;
  expenses: number; netProfit: number; salesCount: number;
}

const PERIODS = ['Today', 'This Week', 'This Month', 'This Year'];

export default function ProfitLossScreen() {
  const [period, setPeriod] = useState('This Month');
  const [data, setData] = useState<PLData>({ revenue: 0, cogs: 0, grossProfit: 0, expenses: 0, netProfit: 0, salesCount: 0 });
  const [currency, setCurrency] = useState('$');

  useEffect(() => { setCurrency(getMeta('currency_symbol') ?? '$'); }, []);
  useEffect(() => { loadData(); }, [period]);

  const getDateRange = () => {
    const now = new Date();
    const start = new Date();
    if (period === 'Today') start.setHours(0, 0, 0, 0);
    else if (period === 'This Week') { start.setDate(now.getDate() - now.getDay()); start.setHours(0, 0, 0, 0); }
    else if (period === 'This Month') { start.setDate(1); start.setHours(0, 0, 0, 0); }
    else { start.setMonth(0, 1); start.setHours(0, 0, 0, 0); }
    return [start.toISOString(), now.toISOString()];
  };

  const loadData = () => {
    const db = getDB();
    const [start, end] = getDateRange();
    const sales = db.getFirstSync<{ revenue: number; count: number }>(
      `SELECT COALESCE(SUM(total), 0) as revenue, COUNT(*) as count FROM sales WHERE status = 'completed' AND created_at BETWEEN ? AND ?`,
      [start, end]
    );
    const cogs = db.getFirstSync<{ cogs: number }>(
      `SELECT COALESCE(SUM(si.qty * p.cost_price), 0) as cogs FROM sale_items si
       JOIN sales s ON si.sale_id = s.id JOIN products p ON si.product_id = p.id
       WHERE s.status = 'completed' AND s.created_at BETWEEN ? AND ?`,
      [start, end]
    );
    const expenses = db.getFirstSync<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE expense_date BETWEEN ? AND ?`,
      [start.slice(0, 10), end.slice(0, 10)]
    );
    const revenue = sales?.revenue ?? 0;
    const cogsAmt = cogs?.cogs ?? 0;
    const expAmt = expenses?.total ?? 0;
    const gross = revenue - cogsAmt;
    setData({ revenue, cogs: cogsAmt, grossProfit: gross, expenses: expAmt, netProfit: gross - expAmt, salesCount: sales?.count ?? 0 });
  };

  const fmt = (n: number) => `${currency}${n.toFixed(2)}`;
  const pct = (n: number, base: number) => base > 0 ? ` (${((n / base) * 100).toFixed(1)}%)` : '';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Period selector */}
      <View style={styles.periodRow}>
        {PERIODS.map(p => (
          <TouchableOpacity key={p} style={[styles.periodBtn, period === p && styles.periodBtnActive]} onPress={() => setPeriod(p)}>
            <Text style={[styles.periodLabel, period === p && styles.periodLabelActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* P&L Statement */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Profit & Loss — {period}</Text>
        <Text style={styles.subtitle}>{data.salesCount} sales</Text>

        <PLRow label="Revenue" value={fmt(data.revenue)} color={C.primary} />
        <PLRow label="Cost of Goods Sold" value={`-${fmt(data.cogs)}`} />
        <View style={styles.divider} />
        <PLRow label="Gross Profit" value={fmt(data.grossProfit)} color={data.grossProfit >= 0 ? C.success : C.danger} bold extra={pct(data.grossProfit, data.revenue)} />
        <PLRow label="Operating Expenses" value={`-${fmt(data.expenses)}`} />
        <View style={styles.divider} />
        <PLRow label="Net Profit" value={fmt(data.netProfit)} color={data.netProfit >= 0 ? C.success : C.danger} bold extra={pct(data.netProfit, data.revenue)} />
      </View>

      {/* Summary stats */}
      <View style={styles.statsRow}>
        <StatCard label="Gross Margin" value={data.revenue > 0 ? `${((data.grossProfit / data.revenue) * 100).toFixed(1)}%` : '—'} color={C.primary} />
        <StatCard label="Net Margin" value={data.revenue > 0 ? `${((data.netProfit / data.revenue) * 100).toFixed(1)}%` : '—'} color={data.netProfit >= 0 ? C.success : C.danger} />
        <StatCard label="Avg Sale" value={data.salesCount > 0 ? fmt(data.revenue / data.salesCount) : '—'} color={C.info} />
      </View>
    </ScrollView>
  );
}

function PLRow({ label, value, color, bold, extra }: { label: string; value: string; color?: string; bold?: boolean; extra?: string }) {
  const styles2 = StyleSheet.create({
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    l: { fontSize: Typography.md, color: C.textSecondary, fontWeight: bold ? '700' : '400' },
    v: { fontSize: Typography.md, fontWeight: bold ? '800' : '600', color: color ?? C.textPrimary },
    e: { fontSize: Typography.xs, color: C.textMuted },
  });
  return (
    <View style={styles2.row}>
      <Text style={styles2.l}>{label}</Text>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles2.v}>{value}</Text>
        {extra ? <Text style={styles2.e}>{extra}</Text> : null}
      </View>
    </View>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const s = StyleSheet.create({ card: { flex: 1, backgroundColor: C.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', ...Shadows.light }, val: { fontSize: Typography.xl, fontWeight: '800' }, lbl: { fontSize: Typography.xs, color: C.textSecondary, marginTop: 4, textAlign: 'center' } });
  return <View style={s.card}><Text style={[s.val, { color }]}>{value}</Text><Text style={s.lbl}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxxl },
  periodRow: { flexDirection: 'row', gap: Spacing.xs },
  periodBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: C.surface, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  periodBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  periodLabel: { fontSize: Typography.xs, color: C.textSecondary, fontWeight: '600' },
  periodLabelActive: { color: '#fff' },
  card: { backgroundColor: C.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, ...Shadows.medium },
  cardTitle: { fontSize: Typography.xl, fontWeight: '800', color: C.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: Typography.sm, color: C.textSecondary, marginBottom: Spacing.md },
  divider: { height: 1, backgroundColor: C.border, marginVertical: Spacing.xs },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
});
