import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Dimensions, StatusBar, Alert,
} from 'react-native';
import { CameraView, Camera, BarcodeScanningResult } from 'expo-camera';
import { Colors, Spacing, Typography, BorderRadius } from '@shared/theme/theme';
import { decodeQRString, QRInvalidError, QRVersionError, QRCorruptError } from '@core/qr/qrDecoder';
import { globalChunkAssembler } from '@core/qr/chunkAssembler';
import { seedFromPayload, SeedResult } from '@core/qr/dataSeeder';
import { setMeta } from '@core/database/dbHelpers';
import * as SecureStore from 'expo-secure-store';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const C = Colors.light;

type Step = 'welcome' | 'scan' | 'pin' | 'done';

interface SetupScreenProps {
  onComplete: () => void;
  pinOnly?: boolean; // skip to PIN step (for re-import flow, just re-seeds)
}

export default function SetupScreen({ onComplete, pinOnly = false }: SetupScreenProps) {
  const [step, setStep] = useState<Step>(pinOnly ? 'scan' : 'welcome');
  const [hasCamPerm, setHasCamPerm] = useState<boolean | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'chunked' | 'processing' | 'success' | 'error'>('idle');
  const [scanMessage, setScanMessage] = useState('Point camera at your setup QR code');
  const [seedResult, setSeedResult] = useState<SeedResult | null>(null);
  const [chunkProgress, setChunkProgress] = useState(0);
  const [activeSession, setActiveSession] = useState<string | null>(null);

  // PIN setup
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinStage, setPinStage] = useState<'enter' | 'confirm'>('enter');
  const [pinError, setPinError] = useState('');

  const scanLine = useRef(new Animated.Value(0)).current;
  const scannedRef = useRef(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasCamPerm(status === 'granted');
    })();
    startScanAnimation();
  }, []);

  const startScanAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLine, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(scanLine, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  };

  const handleBarcodeScan = useCallback(async (result: BarcodeScanningResult) => {
    if (scannedRef.current) return;
    scannedRef.current = true;

    setScanStatus('scanning');
    setScanMessage('Reading QR code...');

    try {
      const payload = decodeQRString(result.data);

      // Handle chunked QR
      if (payload.chunk) {
        const chunkResult = globalChunkAssembler.addChunk({
          ...payload.chunk,
          data: payload.chunk.data,
        });
        const session = payload.chunk.session;
        setActiveSession(session);
        const progress = globalChunkAssembler.getProgress(session);
        setChunkProgress(progress.pct);
        setScanStatus('chunked');
        setScanMessage(`Scanning chunk ${progress.received}/${progress.total}...`);

        if (chunkResult === 'complete') {
          setScanStatus('processing');
          setScanMessage('Importing data...');
          const assembled = globalChunkAssembler.assemble(session);
          const sr = seedFromPayload(assembled);
          setSeedResult(sr);
          setScanStatus('success');
          setScanMessage(`✓ Imported ${sr.seeded.products} products, ${sr.seeded.contacts} contacts`);
          setTimeout(() => setStep('pin'), 1500);
        } else {
          // Allow next scan
          setTimeout(() => { scannedRef.current = false; }, 800);
        }
        return;
      }

      // Single QR
      setScanStatus('processing');
      setScanMessage('Importing data...');
      const sr = seedFromPayload(payload);
      setSeedResult(sr);
      setScanStatus('success');
      setScanMessage(`✓ Imported ${sr.seeded.products} products, ${sr.seeded.contacts} contacts`);
      if (pinOnly) {
        setTimeout(onComplete, 1500);
      } else {
        setTimeout(() => setStep('pin'), 1500);
      }
    } catch (e) {
      let msg = 'Invalid QR code. Please try again.';
      if (e instanceof QRInvalidError) msg = e.message;
      else if (e instanceof QRVersionError) msg = 'Unsupported QR version.';
      else if (e instanceof QRCorruptError) msg = 'QR data corrupted. Re-try.';
      setScanStatus('error');
      setScanMessage(msg);
      setTimeout(() => {
        setScanStatus('idle');
        setScanMessage('Point camera at your setup QR code');
        scannedRef.current = false;
      }, 2500);
    }
  }, [pinOnly, onComplete]);

  const handlePinDigit = (digit: string) => {
    if (pinStage === 'enter') {
      if (pin.length < 6) setPin(p => p + digit);
    } else {
      if (confirmPin.length < 6) setConfirmPin(p => p + digit);
    }
    setPinError('');
  };

  const handlePinDelete = () => {
    if (pinStage === 'enter') setPin(p => p.slice(0, -1));
    else setConfirmPin(p => p.slice(0, -1));
    setPinError('');
  };

  const handlePinNext = async () => {
    if (pinStage === 'enter') {
      if (pin.length < 4) { setPinError('PIN must be at least 4 digits'); return; }
      setPinStage('confirm');
    } else {
      if (confirmPin !== pin) {
        setPinError('PINs do not match. Try again.');
        setConfirmPin('');
        return;
      }
      await SecureStore.setItemAsync('pos_pin', pin);
      setStep('done');
    }
  };

  // ─── Welcome Step ────────────────────────────────────────
  if (step === 'welcome') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={C.primary} />
        <View style={styles.welcomeInner}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>POS</Text>
          </View>
          <Text style={styles.welcomeTitle}>Welcome to{'\n'}Orbit POS</Text>
          <Text style={styles.welcomeSub}>100% offline. Scan a QR code to get started with your products and settings.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep('scan')}>
            <Text style={styles.primaryBtnText}>Get Started →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Scan Step ───────────────────────────────────────────
  if (step === 'scan') {
    const scanTranslate = scanLine.interpolate({
      inputRange: [0, 1],
      outputRange: [0, SCREEN_W * 0.72],
    });
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <Text style={styles.scanTitle}>Scan Setup QR</Text>
        {hasCamPerm === false && (
          <Text style={styles.errorText}>Camera permission denied. Please enable in Settings.</Text>
        )}
        {hasCamPerm === true && (
          <View style={styles.cameraWrap}>
            <CameraView
              style={styles.camera}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={scanStatus === 'scanning' || scanStatus === 'processing' ? undefined : handleBarcodeScan}
            />
            {/* Corner brackets */}
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
            {/* Scan line */}
            <Animated.View style={[styles.scanLineAnim, { transform: [{ translateY: scanTranslate }] }]} />
          </View>
        )}

        {/* Status bar */}
        <View style={styles.scanStatusWrap}>
          {scanStatus === 'chunked' && (
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${chunkProgress}%` }]} />
            </View>
          )}
          <Text style={[
            styles.scanMsg,
            scanStatus === 'success' && { color: C.success },
            scanStatus === 'error' && { color: C.danger },
          ]}>
            {scanMessage}
          </Text>
          {scanStatus === 'error' && (
            <TouchableOpacity onPress={() => { scannedRef.current = false; setScanStatus('idle'); setScanMessage('Point camera at your setup QR code'); }}>
              <Text style={styles.retryBtn}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // ─── PIN Setup Step ───────────────────────────────────────
  if (step === 'pin') {
    const currentPin = pinStage === 'enter' ? pin : confirmPin;
    const dots = Array.from({ length: 6 }, (_, i) => i < currentPin.length);

    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={C.background} />
        <Text style={styles.pinTitle}>{pinStage === 'enter' ? 'Create Your PIN' : 'Confirm Your PIN'}</Text>
        <Text style={styles.pinSub}>Use 4–6 digits to protect your POS</Text>

        <View style={styles.dotsRow}>
          {dots.map((filled, i) => (
            <View key={i} style={[styles.dot, filled && styles.dotFilled]} />
          ))}
        </View>
        {pinError ? <Text style={styles.errorText}>{pinError}</Text> : null}

        <View style={styles.numpad}>
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.numKey, d === '' && { opacity: 0 }]}
              onPress={() => d === '⌫' ? handlePinDelete() : d !== '' ? handlePinDigit(d) : null}
              disabled={d === ''}
            >
              <Text style={styles.numKeyText}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, currentPin.length < 4 && styles.btnDisabled]}
          onPress={handlePinNext}
          disabled={currentPin.length < 4}
        >
          <Text style={styles.primaryBtnText}>{pinStage === 'enter' ? 'Continue →' : 'Confirm PIN'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Done Step ────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.success} />
      <View style={styles.doneInner}>
        <View style={styles.checkCircle}>
          <Text style={styles.checkMark}>✓</Text>
        </View>
        <Text style={styles.doneTitle}>Your POS is Ready!</Text>
        {seedResult && (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Imported successfully:</Text>
            <Text style={styles.summaryItem}>📦 {seedResult.seeded.products} Products</Text>
            <Text style={styles.summaryItem}>🗂️ {seedResult.seeded.categories} Categories</Text>
            <Text style={styles.summaryItem}>👥 {seedResult.seeded.contacts} Contacts</Text>
            <Text style={styles.summaryItem}>🏪 {seedResult.seeded.warehouses} Warehouses</Text>
          </View>
        )}
        <TouchableOpacity style={styles.primaryBtn} onPress={onComplete}>
          <Text style={styles.primaryBtnText}>Open POS →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background, alignItems: 'center', justifyContent: 'center' },
  // Welcome
  welcomeInner: { alignItems: 'center', paddingHorizontal: Spacing.xxl },
  logoCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xxl },
  logoText: { color: '#fff', fontSize: Typography.xxl, fontWeight: '800' },
  welcomeTitle: { fontSize: Typography.xxxl, fontWeight: '800', color: C.textPrimary, textAlign: 'center', marginBottom: Spacing.md },
  welcomeSub: { fontSize: Typography.md, color: C.textSecondary, textAlign: 'center', marginBottom: Spacing.xxxl, lineHeight: 22 },
  // Scan
  scanTitle: { fontSize: Typography.xl, fontWeight: '700', color: C.textPrimary, marginBottom: Spacing.lg },
  cameraWrap: { width: SCREEN_W * 0.85, height: SCREEN_W * 0.85, borderRadius: BorderRadius.lg, overflow: 'hidden', position: 'relative' },
  camera: { flex: 1 },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: '#fff', borderWidth: 4 },
  tl: { top: 12, left: 12, borderRightWidth: 0, borderBottomWidth: 0 },
  tr: { top: 12, right: 12, borderLeftWidth: 0, borderBottomWidth: 0 },
  bl: { bottom: 12, left: 12, borderRightWidth: 0, borderTopWidth: 0 },
  br: { bottom: 12, right: 12, borderLeftWidth: 0, borderTopWidth: 0 },
  scanLineAnim: { position: 'absolute', left: 12, right: 12, height: 2, backgroundColor: C.primary, opacity: 0.8 },
  scanStatusWrap: { marginTop: Spacing.lg, alignItems: 'center', paddingHorizontal: Spacing.xxl },
  scanMsg: { fontSize: Typography.md, color: C.textSecondary, textAlign: 'center' },
  progressBarBg: { width: SCREEN_W * 0.6, height: 6, backgroundColor: C.border, borderRadius: 3, marginBottom: Spacing.sm },
  progressBarFill: { height: 6, backgroundColor: C.primary, borderRadius: 3 },
  retryBtn: { color: C.primary, fontWeight: '700', marginTop: Spacing.sm, fontSize: Typography.md },
  // PIN
  pinTitle: { fontSize: Typography.xxl, fontWeight: '800', color: C.textPrimary, marginBottom: Spacing.sm },
  pinSub: { fontSize: Typography.sm, color: C.textSecondary, marginBottom: Spacing.xl },
  dotsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: C.border, backgroundColor: 'transparent' },
  dotFilled: { backgroundColor: C.primary, borderColor: C.primary },
  numpad: { flexDirection: 'row', flexWrap: 'wrap', width: 240, justifyContent: 'center', gap: Spacing.md, marginBottom: Spacing.xxl },
  numKey: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  numKeyText: { fontSize: Typography.xxl, fontWeight: '600', color: C.textPrimary },
  // Done
  doneInner: { alignItems: 'center', paddingHorizontal: Spacing.xxl },
  checkCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: C.success, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xxl },
  checkMark: { fontSize: 50, color: '#fff' },
  doneTitle: { fontSize: Typography.xxxl, fontWeight: '800', color: C.textPrimary, textAlign: 'center', marginBottom: Spacing.xl },
  summaryBox: { backgroundColor: C.surface, borderRadius: BorderRadius.lg, padding: Spacing.xl, width: '100%', marginBottom: Spacing.xxl },
  summaryTitle: { fontSize: Typography.md, fontWeight: '700', color: C.textPrimary, marginBottom: Spacing.md },
  summaryItem: { fontSize: Typography.md, color: C.textSecondary, marginTop: Spacing.xs },
  // Shared
  primaryBtn: { backgroundColor: C.primary, paddingHorizontal: Spacing.xxxl, paddingVertical: Spacing.lg, borderRadius: BorderRadius.full },
  primaryBtnText: { color: '#fff', fontSize: Typography.lg, fontWeight: '700' },
  btnDisabled: { backgroundColor: C.border },
  errorText: { color: C.danger, fontSize: Typography.sm, marginBottom: Spacing.md, textAlign: 'center' },
});
