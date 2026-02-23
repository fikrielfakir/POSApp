import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

const C = Colors.light;

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

const icons: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle', error: 'alert-circle', info: 'information-circle', warning: 'warning',
};
const bgColors: Record<ToastType, string> = {
  success: '#ECFDF5', error: '#FEF2F2', info: '#EFF6FF', warning: '#FFFBEB',
};
const textColors: Record<ToastType, string> = {
  success: C.success, error: C.danger, info: C.primary, warning: C.warning,
};

const ToastItem: React.FC<{ item: ToastItem; onDismiss: () => void }> = ({ item, onDismiss }) => {
  const slideY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideY, { toValue: -80, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start(() => onDismiss());
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.toast, { backgroundColor: bgColors[item.type], transform: [{ translateY: slideY }], opacity }, Shadows.medium as any]}>
      <Ionicons name={icons[item.type]} size={20} color={textColors[item.type]} />
      <Text style={[styles.toastText, { color: textColors[item.type] }]}>{item.message}</Text>
      <TouchableOpacity onPress={onDismiss} style={styles.dismiss}>
        <Ionicons name="close" size={16} color={textColors[item.type]} />
      </TouchableOpacity>
    </Animated.View>
  );
};

// Global toast manager
type ToastListener = (item: ToastItem) => void;
let listener: ToastListener | null = null;
let idCounter = 0;

export const showToast = (message: string, type: ToastType = 'info') => {
  listener?.({ id: String(idCounter++), message, type });
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  useEffect(() => {
    listener = (item) => setToasts(prev => [...prev, item]);
    return () => { listener = null; };
  }, []);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map(t => (
        <ToastItem
          key={t.id}
          item={t}
          onDismiss={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
        />
      ))}
    </View>
  );
};

export const ConfirmDialog: React.FC<{
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  dangerous?: boolean;
}> = ({ visible, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, dangerous }) => {
  if (!visible) return null;
  return (
    <View style={styles.dialogOverlay}>
      <View style={[styles.dialog, Shadows.heavy as any]}>
        <Text style={styles.dialogTitle}>{title}</Text>
        <Text style={styles.dialogMessage}>{message}</Text>
        <View style={styles.dialogButtons}>
          <TouchableOpacity style={[styles.dialogBtn, styles.cancelBtn]} onPress={onCancel}>
            <Text style={styles.cancelBtnText}>{cancelLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dialogBtn, dangerous ? styles.dangerBtn : styles.confirmBtn]} onPress={onConfirm}>
            <Text style={styles.confirmBtnText}>{confirmLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export const CurrencyText: React.FC<{ value: number; style?: any; symbol?: string }> = ({ value, style, symbol = '$' }) => (
  <Text style={style}>{symbol}{value.toFixed(2)}</Text>
);

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 50, left: 16, right: 16, zIndex: 9999 },
  toast: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: Spacing.sm, gap: Spacing.sm },
  toastText: { flex: 1, fontSize: Typography.sm, fontWeight: '600' },
  dismiss: { padding: 2 },
  dialogOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 999 },
  dialog: { backgroundColor: C.surface, borderRadius: BorderRadius.xl, padding: Spacing.xl, width: '85%', maxWidth: 380 },
  dialogTitle: { fontSize: Typography.lg, fontWeight: '800', color: C.textPrimary, marginBottom: Spacing.sm },
  dialogMessage: { fontSize: Typography.md, color: C.textSecondary, marginBottom: Spacing.xl, lineHeight: 22 },
  dialogButtons: { flexDirection: 'row', gap: Spacing.sm },
  dialogBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center' },
  cancelBtn: { backgroundColor: C.surfaceVariant },
  confirmBtn: { backgroundColor: C.primary },
  dangerBtn: { backgroundColor: C.danger },
  cancelBtnText: { fontSize: Typography.md, fontWeight: '600', color: C.textPrimary },
  confirmBtnText: { fontSize: Typography.md, fontWeight: '700', color: '#fff' },
});
