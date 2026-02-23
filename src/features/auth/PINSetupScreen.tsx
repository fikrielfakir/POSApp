import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  StatusBar, Alert,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Colors, Spacing, Typography, BorderRadius } from '@shared/theme/theme';

const C = Colors.light;

type Step = 'enter' | 'confirm';

interface PINSetupScreenProps {
  onComplete: () => void;
  title?: string;
}

export default function PINSetupScreen({ onComplete, title = 'Create PIN' }: PINSetupScreenProps) {
  const [step, setStep] = useState<Step>('enter');
  const [firstPin, setFirstPin] = useState('');
  const [pin, setPin] = useState('');
  const shakeAnim = useState(new Animated.Value(0))[0];

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleDigit = (d: string) => {
    if (pin.length >= 6) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 6) {
      setTimeout(() => advance(next), 80);
    }
  };

  const advance = async (current: string) => {
    if (step === 'enter') {
      setFirstPin(current);
      setPin('');
      setStep('confirm');
    } else {
      if (current === firstPin) {
        await SecureStore.setItemAsync('pos_pin', current);
        Alert.alert('PIN Set', 'Your PIN has been saved successfully.', [
          { text: 'OK', onPress: onComplete },
        ]);
      } else {
        triggerShake();
        setPin('');
        setFirstPin('');
        setStep('enter');
        Alert.alert('Mismatch', 'PINs did not match. Please try again.');
      }
    }
  };

  const handleDelete = () => setPin(p => p.slice(0, -1));

  const dots = Array.from({ length: 6 }, (_, i) => i < pin.length);
  const subtitle = step === 'enter' ? 'Enter a 6-digit PIN' : 'Confirm your PIN';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.background} />

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
        {dots.map((filled, i) => (
          <View key={i} style={[styles.dot, filled && styles.dotFilled]} />
        ))}
      </Animated.View>

      <View style={styles.numpad}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((d, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.numKey, d === '' && styles.numKeyHidden]}
            onPress={() => { if (d === '⌫') handleDelete(); else if (d) handleDigit(d); }}
            disabled={d === ''}
          >
            <Text style={styles.numKeyText}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
  title: { fontSize: Typography.xxl, fontWeight: '800', color: C.textPrimary, marginBottom: Spacing.xs },
  subtitle: { fontSize: Typography.md, color: C.textSecondary, marginBottom: Spacing.xl },
  dotsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xxl },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: C.border },
  dotFilled: { backgroundColor: C.primary, borderColor: C.primary },
  numpad: { flexDirection: 'row', flexWrap: 'wrap', width: 252, justifyContent: 'center', gap: Spacing.md },
  numKey: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: C.surface,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  numKeyHidden: { backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0 },
  numKeyText: { fontSize: Typography.xxl, fontWeight: '600', color: C.textPrimary },
});
