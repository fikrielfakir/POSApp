import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@shared/theme/theme';

export default function BrandScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Brands (placeholder)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.md, backgroundColor: Colors.light.background },
  title: { fontSize: Typography.lg, fontWeight: '700', color: Colors.light.textPrimary },
});
