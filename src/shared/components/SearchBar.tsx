import React, { useRef, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../theme/theme';

const C = Colors.light;

interface SearchBarProps {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  style?: ViewStyle;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value, onChangeText, placeholder = 'Search...', style,
}) => {
  const inputRef = useRef<TextInput>(null);

  const handleClear = useCallback(() => {
    onChangeText('');
    inputRef.current?.focus();
  }, [onChangeText]);

  return (
    <View style={[styles.container, style]}>
      <Ionicons name="search" size={18} color={C.textMuted} style={styles.icon} />
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.textMuted}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
          <Ionicons name="close-circle" size={18} color={C.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export const EmptyState: React.FC<{
  icon?: string; title: string; subtitle?: string;
  actionLabel?: string; onAction?: () => void;
}> = ({ icon, title, subtitle, actionLabel, onAction }) => (
  <View style={styles.empty}>
    {icon ? <Ionicons name={icon as any} size={56} color={C.border} style={styles.emptyIcon} /> : null}
    <Ionicons name={icon ? icon as any : 'cube-outline'} size={icon ? 0 : 56} color={C.border} />
    <Ionicons name={title as any} size={0} />
    <React.Fragment>
      <Ionicons name="cube-outline" size={0} />
    </React.Fragment>
  </View>
);

// Simplified EmptyState
export const EmptyStateSimple: React.FC<{
  icon?: keyof typeof Ionicons.glyphMap;
  title: string; subtitle?: string;
  actionLabel?: string; onAction?: () => void;
}> = ({ icon = 'cube-outline', title, subtitle, actionLabel, onAction }) => {
  const { TouchableOpacity: TO, Text, View: V } = require('react-native');
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={56} color={C.border} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySub}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity onPress={onAction} style={styles.emptyAction}>
          <Text style={styles.emptyActionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export const LoadingSpinner: React.FC<{ overlay?: boolean }> = ({ overlay }) => {
  const { ActivityIndicator, View: V } = require('react-native');
  return (
    <View style={[styles.spinner, overlay && styles.overlay]}>
      <ActivityIndicator size="large" color={C.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: C.border },
  icon: { marginRight: Spacing.xs },
  input: { flex: 1, fontSize: Typography.md, color: C.textPrimary, paddingVertical: Spacing.sm + 2 },
  clearBtn: { padding: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxxl },
  emptyIcon: { marginBottom: Spacing.md },
  emptyTitle: { fontSize: Typography.lg, fontWeight: '700', color: C.textPrimary, textAlign: 'center', marginTop: Spacing.md },
  emptySub: { fontSize: Typography.sm, color: C.textSecondary, textAlign: 'center', marginTop: Spacing.xs },
  emptyAction: { marginTop: Spacing.lg, backgroundColor: C.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full },
  emptyActionText: { color: '#fff', fontWeight: '700' },
  spinner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 999 },
});
