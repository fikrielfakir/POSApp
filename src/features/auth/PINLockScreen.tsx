import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Alert, StatusBar, AppState, AppStateStatus,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@core/store/authStore';
import { Colors, Spacing, Typography, BorderRadius } from '@shared/theme/theme';
import { getMeta } from '@core/database/dbHelpers';
import { getDB } from '@core/database/db';
import { runMigrations } from '@core/database/migrations';

const C = Colors.light;

interface PINLockScreenProps {
  onUnlocked: () => void;
  onForgotPIN: () => void;
}

export default function PINLockScreen({ onUnlocked, onForgotPIN }: PINLockScreenProps) {
  const [pin, setPin] = useState('');
  const [companyName, setCompanyName] = useState('Orbit POS');
  const [countdown, setCountdown] = useState(0);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const { incrementFailedAttempts, unlock, isLockedOut, lockoutSecondsRemaining, failedAttempts } = useAuthStore();

  useEffect(() => {
    const name = getMeta('company_name');
    if (name) setCompanyName(name);
  }, []);

  // Countdown timer for lockout
  useEffect(() => {
    if (!isLockedOut()) return;
    setCountdown(lockoutSecondsRemaining());
    const interval = setInterval(() => {
      const secs = lockoutSecondsRemaining();
      setCountdown(secs);
      if (secs <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [failedAttempts]);

  useEffect(() => {
    if (pin.length === 6) verifyPIN();
  }, [pin]);

  const verifyPIN = async () => {
    if (isLockedOut()) return;
    const saved = await SecureStore.getItemAsync('pos_pin');
    if (pin === saved) {
      unlock();
      onUnlocked();
    } else {
      triggerShake();
      incrementFailedAttempts();
      setPin('');
    }
  };

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleDigit = (d: string) => {
    if (isLockedOut() || pin.length >= 6) return;
    setPin(p => p + d);
  };

  const handleDelete = () => { setPin(p => p.slice(0, -1)); };

  const handleForgotPIN = () => {
    Alert.alert(
      'Forgot PIN?',
      'This will WIPE ALL DATA from the device and reset the app. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Wipe & Reset', style: 'destructive',
          onPress: async () => {
            await SecureStore.deleteItemAsync('pos_pin');
            const db = getDB();
            // Drop and recreate all tables
            db.execSync(`
              DROP TABLE IF EXISTS sale_items;
              DROP TABLE IF EXISTS sales;
              DROP TABLE IF EXISTS purchase_items;
              DROP TABLE IF EXISTS purchases;
              DROP TABLE IF EXISTS transfer_items;
              DROP TABLE IF EXISTS stock_transfers;
              DROP TABLE IF EXISTS return_items;
              DROP TABLE IF EXISTS sell_returns;
              DROP TABLE IF EXISTS stock_movements;
              DROP TABLE IF EXISTS products;
              DROP TABLE IF EXISTS contacts;
              DROP TABLE IF EXISTS categories;
              DROP TABLE IF EXISTS brands;
              DROP TABLE IF EXISTS warehouses;
              DROP TABLE IF EXISTS expenses;
              DROP TABLE IF EXISTS field_visits;
              DROP TABLE IF EXISTS attendance;
              DROP TABLE IF EXISTS followups;
              DROP TABLE IF EXISTS shipments;
              DROP TABLE IF EXISTS app_meta;
            `);
            runMigrations(db);
            onForgotPIN();
          },
        },
      ]
    );
  };

  const locked = isLockedOut();
  const dots = Array.from({ length: 6 }, (_, i) => i < pin.length);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.background} />

      <Text style={styles.company}>{companyName}</Text>
      <Text style={styles.title}>Enter PIN</Text>

      <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
        {dots.map((filled, i) => (
          <View key={i} style={[styles.dot, filled && styles.dotFilled]} />
        ))}
      </Animated.View>

      {locked ? (
        <View style={styles.lockoutBox}>
          <Text style={styles.lockoutText}>Too many attempts. Wait {countdown}s</Text>
        </View>
      ) : failedAttempts > 0 ? (
        <Text style={styles.errorText}>Incorrect PIN ({5 - failedAttempts} attempts left)</Text>
      ) : null}

      <View style={styles.numpad}>
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.numKey, (d === '' || locked) && styles.numKeyDisabled]}
            onPress={() => { if (d === '⌫') handleDelete(); else if (d) handleDigit(d); }}
            disabled={d === '' || locked}
          >
            <Text style={[styles.numKeyText, locked && { color: C.textMuted }]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity onPress={handleForgotPIN} style={styles.forgotBtn}>
        <Text style={styles.forgotText}>Forgot PIN?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
  company: { fontSize: Typography.sm, fontWeight: '600', color: C.textSecondary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: Spacing.sm },
  title: { fontSize: Typography.xxl, fontWeight: '800', color: C.textPrimary, marginBottom: Spacing.xl },
  dotsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: C.border },
  dotFilled: { backgroundColor: C.primary, borderColor: C.primary },
  lockoutBox: { backgroundColor: '#FEF2F2', borderRadius: BorderRadius.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, marginBottom: Spacing.md },
  lockoutText: { color: C.danger, fontSize: Typography.sm, fontWeight: '600' },
  errorText: { color: C.danger, fontSize: Typography.sm, marginBottom: Spacing.md },
  numpad: { flexDirection: 'row', flexWrap: 'wrap', width: 252, justifyContent: 'center', gap: Spacing.md, marginBottom: Spacing.xxl },
  numKey: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  numKeyDisabled: { backgroundColor: C.surfaceVariant },
  numKeyText: { fontSize: Typography.xxl, fontWeight: '600', color: C.textPrimary },
  forgotBtn: { paddingVertical: Spacing.sm },
  forgotText: { color: C.primary, fontSize: Typography.sm, fontWeight: '600' },
});
