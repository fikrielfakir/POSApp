import { Platform } from 'react-native';

export const Colors = {
  light: {
    primary: '#2563EB',
    primaryLight: '#3B82F6',
    primaryDark: '#1D4ED8',
    secondary: '#7C3AED',
    success: '#16A34A',
    danger: '#DC2626',
    warning: '#D97706',
    info: '#0891B2',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceVariant: '#F1F5F9',
    border: '#E2E8F0',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    textOnPrimary: '#FFFFFF',
    overlay: 'rgba(0,0,0,0.5)',
    cardShadow: '#00000015',
  },
  dark: {
    primary: '#3B82F6',
    primaryLight: '#60A5FA',
    primaryDark: '#2563EB',
    secondary: '#8B5CF6',
    success: '#22C55E',
    danger: '#EF4444',
    warning: '#F59E0B',
    info: '#06B6D4',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceVariant: '#334155',
    border: '#334155',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    textOnPrimary: '#FFFFFF',
    overlay: 'rgba(0,0,0,0.7)',
    cardShadow: '#00000040',
  },
};

export const Typography = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  giant: 64,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

export const Shadows = {
  light: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
    },
    android: { elevation: 2 },
    default: {},
  }),
  medium: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    android: { elevation: 5 },
    default: {},
  }),
  heavy: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
    },
    android: { elevation: 12 },
    default: {},
  }),
};

export type ThemeColors = typeof Colors.light;

export const FontFamily = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  mono: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
};
