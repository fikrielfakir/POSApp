import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle,
} from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../theme/theme';

const C = Colors.light;

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

const bgColors: Record<Variant, string> = {
  primary: C.primary,
  secondary: C.secondary,
  danger: C.danger,
  ghost: 'transparent',
  outline: 'transparent',
  success: C.success,
};
const textColors: Record<Variant, string> = {
  primary: '#fff', secondary: '#fff', danger: '#fff', ghost: C.primary, outline: C.primary, success: '#fff',
};
const paddings: Record<Size, { px: number; py: number }> = {
  sm: { px: Spacing.md, py: Spacing.xs },
  md: { px: Spacing.xl, py: Spacing.sm + 2 },
  lg: { px: Spacing.xxl, py: Spacing.md },
};
const fontSizes: Record<Size, number> = { sm: Typography.sm, md: Typography.md, lg: Typography.lg };

export const AppButton: React.FC<AppButtonProps> = ({
  label, onPress, variant = 'primary', size = 'md',
  fullWidth = false, loading = false, disabled = false,
  style, textStyle, icon,
}) => {
  const { px, py } = paddings[size];
  const isOutline = variant === 'outline';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.btn,
        { backgroundColor: bgColors[variant], paddingHorizontal: px, paddingVertical: py, borderRadius: BorderRadius.md },
        isOutline && { borderWidth: 1.5, borderColor: C.primary },
        fullWidth && { width: '100%', alignItems: 'center' },
        (disabled || loading) && { opacity: 0.5 },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColors[variant]} />
      ) : (
        <>
          {icon}
          <Text style={[{ color: textColors[variant], fontSize: fontSizes[size], fontWeight: '700' }, textStyle]}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs },
});
