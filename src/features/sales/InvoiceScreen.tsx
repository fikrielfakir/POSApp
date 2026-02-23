import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Alert,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { SaleStackParamList } from '@navigation/types';
import { getSaleById, getSaleItems, Sale, SaleItem } from './saleRepository';
import { getMeta } from '@core/database/dbHelpers';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@shared/theme/theme';

const C = Colors.light;
type RoutePropType = RouteProp<SaleStackParamList, 'Invoice'>;

export default function InvoiceScreen() {
  const route = useRoute<RoutePropType>();
  const { saleId } = route.params;
  const [sale, setSale] = useState<Sale | null>(null);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [taxName, setTaxName] = useState('Tax');
  const [footer, setFooter] = useState('Thank you for your business!');
  const [currency, setCurrency] = useState('$');

  useEffect(() => {
    const s = getSaleById(saleId);
    if (s) { setSale(s); setItems(getSaleItems(saleId)); }
    setCompanyName(getMeta('company_name') ?? 'My Company');
    setCompanyAddress(getMeta('company_address') ?? '');
    setCompanyPhone(getMeta('company_phone') ?? '');
    setTaxName(getMeta('tax_name') ?? 'Tax');
    setFooter(getMeta('receipt_footer') ?? 'Thank you for your business!');
    setCurrency(getMeta('currency_symbol') ?? '$');
  }, []);

  const fmt = (n: number) => `${currency}${n.toFixed(2)}`;

  const handleShare = async () => {
    if (!sale) return;
    const lines = [
      `===== INVOICE =====`,
      companyName,
      companyAddress,
      companyPhone,
      ``,
      `Invoice: ${sale.invoice_number}`,
      `Date: ${sale.created_at.slice(0, 10)}`,
      `-------------------`,
      ...items.map(i => `${i.product_name}\n  ${i.quantity} × ${fmt(i.unit_price)}  =  ${fmt(i.line_total)}`),
      `-------------------`,
      `Subtotal: ${fmt(sale.subtotal)}`,
      sale.discount_amount > 0 ? `Discount: -${fmt(sale.discount_amount)}` : '',
      sale.tax_amount > 0 ? `${taxName}: ${fmt(sale.tax_amount)}` : '',
      `TOTAL: ${fmt(sale.total)}`,
      `Paid: ${fmt(sale.paid_amount)}`,
      `Change: ${fmt(Math.max(0, sale.paid_amount - sale.total))}`,
      ``,
      footer,
    ].filter(Boolean).join('\n');
    await Share.share({ message: lines, title: `Invoice ${sale.invoice_number}` });
  };

  if (!sale) return <View style={styles.center}><Text>Invoice not found.</Text></View>;

  const change = Math.max(0, sale.paid_amount - sale.total);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Invoice card */}
      <View style={styles.invoice}>
        {/* Header */}
        <View style={styles.invoiceHeader}>
          <Text style={styles.companyName}>{companyName}</Text>
          {companyAddress ? <Text style={styles.companyInfo}>{companyAddress}</Text> : null}
          {companyPhone ? <Text style={styles.companyInfo}>{companyPhone}</Text> : null}
        </View>

        <View style={styles.divider} />

        <View style={styles.metaRow}>
          <View>
            <Text style={styles.metaLabel}>INVOICE</Text>
            <Text style={styles.metaValue}>{sale.invoice_number}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.metaLabel}>DATE</Text>
            <Text style={styles.metaValue}>{sale.created_at.slice(0, 10)}</Text>
          </View>
        </View>

        <View style={[styles.divider, { marginBottom: Spacing.md }]} />

        {/* Items */}
        <View style={styles.itemsHeader}>
          <Text style={[styles.colHead, { flex: 3 }]}>Item</Text>
          <Text style={[styles.colHead, { flex: 1, textAlign: 'center' }]}>Qty</Text>
          <Text style={[styles.colHead, { flex: 1.5, textAlign: 'right' }]}>Total</Text>
        </View>
        {items.map(item => (
          <View key={item.id} style={styles.itemRow}>
            <View style={{ flex: 3 }}>
              <Text style={styles.itemName}>{item.product_name}</Text>
              <Text style={styles.itemSub}>{fmt(item.unit_price)} each</Text>
            </View>
            <Text style={[styles.itemQty, { flex: 1 }]}>{item.quantity}</Text>
            <Text style={[styles.itemTotal, { flex: 1.5 }]}>{fmt(item.line_total)}</Text>
          </View>
        ))}

        <View style={styles.divider} />

        {/* Totals */}
        <TotalRow label="Subtotal" value={fmt(sale.subtotal)} />
        {sale.discount_amount > 0 && <TotalRow label="Discount" value={`-${fmt(sale.discount_amount)}`} color={C.danger} />}
        {sale.tax_amount > 0 && <TotalRow label={taxName} value={fmt(sale.tax_amount)} />}
        <View style={[styles.divider, { marginVertical: 4 }]} />
        <TotalRow label="TOTAL" value={fmt(sale.total)} bold />
        <TotalRow label="Paid" value={fmt(sale.paid_amount)} />
        {change > 0 && <TotalRow label="Change" value={fmt(change)} color={C.success} />}

        <View style={styles.divider} />
        <Text style={styles.footer}>{footer}</Text>

        {/* Status badge */}
        <View style={[styles.badge, { backgroundColor: sale.status === 'voided' ? C.danger : C.success }]}>
          <Text style={styles.badgeText}>{sale.status.toUpperCase()}</Text>
        </View>
      </View>

      {/* Actions */}
      <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
        <Text style={styles.shareBtnText}>📤 Share Invoice</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function TotalRow({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <View style={styles.totalRow}>
      <Text style={[styles.totalLabel, bold && { fontWeight: '700', color: C.textPrimary }]}>{label}</Text>
      <Text style={[styles.totalValue, bold && { fontWeight: '800', fontSize: Typography.lg }, color ? { color } : {}]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  invoice: { backgroundColor: C.surface, borderRadius: BorderRadius.lg, padding: Spacing.xl, ...Shadows.medium },
  invoiceHeader: { alignItems: 'center', marginBottom: Spacing.md },
  companyName: { fontSize: Typography.xl, fontWeight: '800', color: C.textPrimary },
  companyInfo: { fontSize: Typography.sm, color: C.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: C.border, marginVertical: Spacing.sm },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaLabel: { fontSize: Typography.xs, color: C.textMuted, fontWeight: '600', letterSpacing: 1 },
  metaValue: { fontSize: Typography.md, fontWeight: '700', color: C.textPrimary },
  itemsHeader: { flexDirection: 'row', marginBottom: Spacing.xs },
  colHead: { fontSize: Typography.xs, fontWeight: '700', color: C.textMuted, letterSpacing: 0.5 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.xs },
  itemName: { fontSize: Typography.sm, fontWeight: '600', color: C.textPrimary },
  itemSub: { fontSize: Typography.xs, color: C.textMuted },
  itemQty: { fontSize: Typography.sm, color: C.textSecondary, textAlign: 'center' },
  itemTotal: { fontSize: Typography.sm, fontWeight: '600', color: C.textPrimary, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalLabel: { fontSize: Typography.md, color: C.textSecondary },
  totalValue: { fontSize: Typography.md, fontWeight: '600', color: C.textPrimary },
  footer: { textAlign: 'center', fontSize: Typography.sm, color: C.textMuted, marginTop: Spacing.md, fontStyle: 'italic' },
  badge: { alignSelf: 'flex-end', paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.full, marginTop: Spacing.sm },
  badgeText: { color: '#fff', fontSize: Typography.xs, fontWeight: '800', letterSpacing: 1 },
  shareBtn: { backgroundColor: C.primary, borderRadius: BorderRadius.lg, paddingVertical: Spacing.md, alignItems: 'center' },
  shareBtnText: { color: '#fff', fontWeight: '700', fontSize: Typography.md },
});
