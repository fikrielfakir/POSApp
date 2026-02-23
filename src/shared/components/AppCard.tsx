import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../theme/theme';

const C = Colors.light;
type BadgeType = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

const bgMap: Record<BadgeType, string> = {
  success: '#DCFCE7', warning: '#FEF3C7', danger: '#FEE2E2',
  info: '#E0F2FE', neutral: '#F1F5F9', primary: '#EFF6FF',
};
const textMap: Record<BadgeType, string> = {
  success: C.success, warning: C.warning, danger: C.danger,
  info: C.info, neutral: C.textSecondary, primary: C.primary,
};

export const AppBadge: React.FC<{ label: string; type?: BadgeType; style?: ViewStyle }> = ({
  label, type = 'neutral', style,
}) => (
  <View style={[styles.badge, { backgroundColor: bgMap[type] }, style]}>
    <Text style={[styles.badgeText, { color: textMap[type] }]}>{label}</Text>
  </View>
);

export const AppCard: React.FC<{ children: React.ReactNode; style?: ViewStyle; flat?: boolean }> = ({
  children, style, flat,
}) => (
  <View style={[styles.card, !flat && Shadows.light as any, style]}>{children}</View>
);

export const StatCard: React.FC<{
  label: string; value: string | number; icon?: string;
  trend?: number; color?: string; style?: ViewStyle;
}> = ({ label, value, icon, trend, color = C.primary, style }) => (
  <View style={[styles.statCard, Shadows.light as any, style]}>
    {icon ? <Text style={[styles.statIcon, { color }]}>{icon}</Text> : null}
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    {trend !== undefined ? (
      <Text style={[styles.statTrend, { color: trend >= 0 ? C.success : C.danger }]}>
        {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}%
      </Text>
    ) : null}
  </View>
);

export const SectionHeader: React.FC<{
  title: string; action?: string; onAction?: () => void;
}> = ({ title, action, onAction }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {action ? (
      <Text style={styles.sectionAction} onPress={onAction}>{action}</Text>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full, alignSelf: 'flex-start' },
  badgeText: { fontSize: Typography.xs, fontWeight: '700' },
  card: { backgroundColor: C.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md },
  statCard: { backgroundColor: C.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, alignItems: 'center', flex: 1, margin: Spacing.xs / 2 },
  statIcon: { fontSize: 24, marginBottom: Spacing.xs },
  statValue: { fontSize: Typography.xxl, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: Typography.xs, color: C.textSecondary, textAlign: 'center' },
  statTrend: { fontSize: Typography.xs, fontWeight: '600', marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md, marginTop: Spacing.sm },
  sectionTitle: { fontSize: Typography.lg, fontWeight: '700', color: C.textPrimary },
  sectionAction: { fontSize: Typography.sm, color: C.primary, fontWeight: '600' },
});
