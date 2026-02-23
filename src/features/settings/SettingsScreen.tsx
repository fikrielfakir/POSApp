import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Alert } from 'react-native';
import { getDB } from '@core/database/db';
import { getMeta, setMeta } from '@core/database/dbHelpers';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@shared/theme/theme';
import * as SecureStore from 'expo-secure-store';

const C = Colors.light;

interface SettingsDraft {
  company_name: string;
  company_address: string;
  company_phone: string;
  currency_symbol: string;
  tax_name: string;
  tax_rate: string;
  receipt_footer: string;
  require_pin: boolean;
  low_stock_alert: string;
}

export default function SettingsScreen() {
  const [draft, setDraft] = useState<SettingsDraft>({
    company_name: '', company_address: '', company_phone: '',
    currency_symbol: '$', tax_name: 'Tax', tax_rate: '0',
    receipt_footer: 'Thank you for your business!',
    require_pin: true, low_stock_alert: '5',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setDraft({
      company_name: getMeta('company_name') ?? '',
      company_address: getMeta('company_address') ?? '',
      company_phone: getMeta('company_phone') ?? '',
      currency_symbol: getMeta('currency_symbol') ?? '$',
      tax_name: getMeta('tax_name') ?? 'Tax',
      tax_rate: getMeta('tax_rate') ?? '0',
      receipt_footer: getMeta('receipt_footer') ?? 'Thank you for your business!',
      require_pin: getMeta('require_pin') !== 'false',
      low_stock_alert: getMeta('low_stock_alert') ?? '5',
    });
    setLoading(false);
  }, []);

  const set = (key: keyof SettingsDraft, val: string | boolean) =>
    setDraft(d => ({ ...d, [key]: val }));

  const handleSave = () => {
    setMeta('company_name', draft.company_name);
    setMeta('company_address', draft.company_address);
    setMeta('company_phone', draft.company_phone);
    setMeta('currency_symbol', draft.currency_symbol || '$');
    setMeta('tax_name', draft.tax_name || 'Tax');
    setMeta('tax_rate', draft.tax_rate || '0');
    setMeta('receipt_footer', draft.receipt_footer);
    setMeta('require_pin', draft.require_pin ? 'true' : 'false');
    setMeta('low_stock_alert', draft.low_stock_alert || '5');
    Alert.alert('Saved', 'Settings updated successfully!');
  };

  const handleChangePin = () => {
    Alert.alert('Change PIN', 'Go to the PIN setup screen to change your PIN.', [{ text: 'OK' }]);
  };

  const handleWipeData = () => {
    Alert.alert(
      '⚠️ Wipe All Data',
      'This will permanently delete ALL local sales, products, contacts and settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'DELETE EVERYTHING', style: 'destructive', onPress: async () => {
            const db = getDB();
            const tables = ['sales', 'sale_items', 'products', 'contacts', 'categories', 'brands', 'purchases', 'purchase_items', 'stock_movements', 'stock_transfers', 'sell_returns', 'expenses', 'field_visits', 'attendance', 'followups', 'app_meta'];
            tables.forEach(t => db.runSync(`DELETE FROM ${t}`));
            await SecureStore.deleteItemAsync('app_pin');
            Alert.alert('Done', 'All data wiped. Please restart the app.');
          },
        },
      ]
    );
  };

  if (loading) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Company */}
      <Section title="🏢 Company Info">
        <Field label="Company Name" value={draft.company_name} onChange={v => set('company_name', v)} placeholder="Acme Corp" />
        <Field label="Address" value={draft.company_address} onChange={v => set('company_address', v)} placeholder="123 Main St" />
        <Field label="Phone" value={draft.company_phone} onChange={v => set('company_phone', v)} placeholder="+1 555-0000" keyboardType="phone-pad" />
      </Section>

      {/* Currency & Tax */}
      <Section title="💰 Currency & Tax">
        <Field label="Currency Symbol" value={draft.currency_symbol} onChange={v => set('currency_symbol', v)} placeholder="$" />
        <Field label="Tax Name" value={draft.tax_name} onChange={v => set('tax_name', v)} placeholder="GST, VAT, Tax" />
        <Field label="Tax Rate (%)" value={draft.tax_rate} onChange={v => set('tax_rate', v)} placeholder="0" keyboardType="numeric" />
      </Section>

      {/* Receipt */}
      <Section title="🧾 Receipt">
        <Field label="Footer Message" value={draft.receipt_footer} onChange={v => set('receipt_footer', v)} placeholder="Thank you!" multiline />
      </Section>

      {/* Security */}
      <Section title="🔐 Security">
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Require PIN on open</Text>
          <Switch value={draft.require_pin} onValueChange={v => set('require_pin', v)} trackColor={{ true: C.primary }} />
        </View>
        <TouchableOpacity style={styles.outlineBtn} onPress={handleChangePin}>
          <Text style={styles.outlineBtnText}>Change PIN</Text>
        </TouchableOpacity>
      </Section>

      {/* Stock */}
      <Section title="📦 Inventory">
        <Field label="Low Stock Alert Threshold" value={draft.low_stock_alert} onChange={v => set('low_stock_alert', v)} placeholder="5" keyboardType="numeric" />
      </Section>

      {/* Save */}
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>💾 Save Settings</Text>
      </TouchableOpacity>

      {/* Danger zone */}
      <Section title="⚠️ Danger Zone">
        <TouchableOpacity style={styles.dangerBtn} onPress={handleWipeData}>
          <Text style={styles.dangerBtnText}>🗑️ Wipe All Local Data</Text>
        </TouchableOpacity>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.sectionCard}>{children}</View>
    </View>
  );
}

function Field({ label, value, onChange, placeholder, keyboardType, multiline }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; keyboardType?: any; multiline?: boolean }) {
  return (
    <View>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={[s.input, multiline && { height: 70, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={C.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );
}

const s = StyleSheet.create({
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: Typography.sm, fontWeight: '700', color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  sectionCard: { backgroundColor: C.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, gap: Spacing.xs, ...Shadows.light },
  label: { fontSize: Typography.xs, fontWeight: '600', color: C.textSecondary, marginBottom: 4 },
  input: { backgroundColor: C.surfaceVariant, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: C.border, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: Typography.md, color: C.textPrimary, marginBottom: Spacing.sm },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { padding: Spacing.md, gap: Spacing.xl, paddingBottom: 60 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
  switchLabel: { fontSize: Typography.md, color: C.textPrimary, fontWeight: '500' },
  outlineBtn: { borderWidth: 1.5, borderColor: C.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.sm, alignItems: 'center', marginTop: Spacing.xs },
  outlineBtnText: { color: C.primary, fontWeight: '700', fontSize: Typography.sm },
  saveBtn: { backgroundColor: C.primary, borderRadius: BorderRadius.lg, paddingVertical: Spacing.lg, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: Typography.lg },
  dangerBtn: { backgroundColor: '#FEF2F2', borderRadius: BorderRadius.md, borderWidth: 1, borderColor: C.danger, paddingVertical: Spacing.md, alignItems: 'center' },
  dangerBtnText: { color: C.danger, fontWeight: '700', fontSize: Typography.md },
});
