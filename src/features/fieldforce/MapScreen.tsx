import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@shared/theme/theme';

const C = Colors.light;

export default function MapScreen() {
  const openMaps = () => {
    // Opens device maps app — replace with a real location in production
    Linking.openURL('geo:0,0?q=My+Location');
  };

  return (
    <View style={styles.container}>
      <View style={styles.placeholder}>
        <Text style={styles.emoji}>🗺️</Text>
        <Text style={styles.title}>Field Map</Text>
        <Text style={styles.desc}>
          Install and configure a maps SDK (e.g. react-native-maps) to display visit locations, routes, and territory coverage on a live map.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={openMaps}>
          <Text style={styles.btnText}>Open Device Maps</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  placeholder: { alignItems: 'center', gap: Spacing.md },
  emoji: { fontSize: 64 },
  title: { fontSize: Typography.xxl, fontWeight: '800', color: C.textPrimary },
  desc: { fontSize: Typography.md, color: C.textSecondary, textAlign: 'center', lineHeight: 22 },
  btn: { backgroundColor: C.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg },
  btnText: { color: '#fff', fontWeight: '700', fontSize: Typography.md },
});
