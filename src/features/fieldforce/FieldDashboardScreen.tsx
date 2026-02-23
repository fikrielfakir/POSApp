import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { getDB } from '@core/database/db';
import { FieldVisit, AttendanceRecord } from '@core/database/types';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@shared/theme/theme';
import { customAlphabet } from 'nanoid/non-secure';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';

const C = Colors.light;
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 10);

export default function FieldDashboardScreen() {
  const navigation = useNavigation<any>();
  const [todayVisits, setTodayVisits] = useState<FieldVisit[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);

  useFocusEffect(React.useCallback(() => { loadData(); }, []));

  const loadData = () => {
    const db = getDB();
    const today = new Date().toISOString().slice(0, 10);
    const att = db.getFirstSync<AttendanceRecord>('SELECT * FROM attendance WHERE date = ?', [today]) ?? null;
    setAttendance(att);
    setCheckedIn(!!att?.clock_in && !att?.clock_out);
    const visits = db.getAllSync<FieldVisit>(
      `SELECT * FROM field_visits WHERE date(created_at) = ? ORDER BY created_at DESC`, [today]
    );
    setTodayVisits(visits);
  };

  const handleCheckIn = () => {
    const db = getDB();
    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    try {
      const existing = db.getFirstSync<{ id: string }>('SELECT id FROM attendance WHERE date = ?', [today]);
      if (existing) {
        db.runSync(`UPDATE attendance SET clock_out = ?, clock_out_lat = null, clock_out_lng = null, duration_minutes = ROUND((julianday(?) - julianday(clock_in)) * 1440) WHERE id = ?`, [now, now, existing.id]);
        setCheckedIn(false);
        Alert.alert('Checked Out', 'Have a great rest of your day!');
      } else {
        db.runSync(`INSERT INTO attendance (id, clock_in, date) VALUES (?, ?, ?)`, [nanoid(), now, today]);
        setCheckedIn(true);
        Alert.alert('Checked In', `Welcome! Clocked in at ${now.slice(11, 16)}.`);
      }
      loadData();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const formatDuration = (att: AttendanceRecord | null) => {
    if (!att?.clock_in) return '—';
    const start = new Date(att.clock_in);
    const end = att.clock_out ? new Date(att.clock_out) : new Date();
    const mins = Math.round((end.getTime() - start.getTime()) / 60000);
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Attendance card */}
      <View style={[styles.attCard, { backgroundColor: checkedIn ? C.success : C.primary }]}>
        <Text style={styles.attTitle}>{checkedIn ? '✅ Checked In' : attendance?.clock_in ? '🏁 Day Complete' : '👋 Not Checked In'}</Text>
        {attendance?.clock_in && <Text style={styles.attTime}>In: {attendance.clock_in.slice(11, 16)}{attendance.clock_out ? ` · Out: ${attendance.clock_out.slice(11, 16)}` : ''}</Text>}
        <Text style={styles.attDuration}>Duration: {formatDuration(attendance)}</Text>
        {!attendance?.clock_out && (
          <TouchableOpacity style={styles.checkBtn} onPress={handleCheckIn}>
            <Text style={styles.checkBtnText}>{checkedIn ? 'Check Out' : 'Check In'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Today's visits */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today's Visits ({todayVisits.length})</Text>
        <TouchableOpacity onPress={() => navigation.navigate('VisitHistory')}><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
      </View>

      {todayVisits.length === 0 ? (
        <Text style={styles.empty}>No visits logged today.</Text>
      ) : (
        todayVisits.map(visit => (
          <View key={visit.id} style={styles.visitCard}>
            <Text style={styles.visitContact}>{visit.contact_name ?? 'Unknown'}</Text>
            <Text style={styles.visitTime}>
              {visit.check_in_time?.slice(11, 16) ?? '?'} → {visit.check_out_time?.slice(11, 16) ?? 'ongoing'}
            </Text>
            {visit.outcome && <Text style={styles.visitOutcome}>{visit.outcome}</Text>}
          </View>
        ))
      )}

      {/* Quick actions */}
      <View style={styles.actionsRow}>
        <ActionBtn emoji="📍" label="Log Visit" onPress={() => navigation.navigate('VisitHistory')} color={C.primary} />
        <ActionBtn emoji="📅" label="Attendance" onPress={() => navigation.navigate('Attendance')} color={C.success} />
        <ActionBtn emoji="🗺️" label="Map" onPress={() => navigation.navigate('MapView')} color={C.info} />
      </View>
    </ScrollView>
  );
}

function ActionBtn({ emoji, label, onPress, color }: { emoji: string; label: string; onPress: () => void; color: string }) {
  const s = StyleSheet.create({ btn: { flex: 1, backgroundColor: C.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', ...Shadows.light, borderTopWidth: 3, borderTopColor: color }, e: { fontSize: 24 }, l: { fontSize: Typography.xs, color: C.textSecondary, marginTop: 4, fontWeight: '600' } });
  return <TouchableOpacity style={s.btn} onPress={onPress}><Text style={s.e}>{emoji}</Text><Text style={s.l}>{label}</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 40 },
  attCard: { borderRadius: BorderRadius.xl, padding: Spacing.xl },
  attTitle: { color: '#fff', fontSize: Typography.xl, fontWeight: '800', marginBottom: 4 },
  attTime: { color: 'rgba(255,255,255,0.8)', fontSize: Typography.sm },
  attDuration: { color: 'rgba(255,255,255,0.8)', fontSize: Typography.sm, marginBottom: Spacing.md },
  checkBtn: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full },
  checkBtnText: { color: '#fff', fontWeight: '800', fontSize: Typography.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: Typography.md, fontWeight: '700', color: C.textPrimary },
  seeAll: { fontSize: Typography.sm, color: C.primary, fontWeight: '600' },
  visitCard: { backgroundColor: C.surface, borderRadius: BorderRadius.md, padding: Spacing.md, ...Shadows.light },
  visitContact: { fontSize: Typography.md, fontWeight: '700', color: C.textPrimary },
  visitTime: { fontSize: Typography.sm, color: C.textSecondary, marginTop: 2 },
  visitOutcome: { fontSize: Typography.xs, color: C.info, marginTop: 4, fontStyle: 'italic' },
  empty: { textAlign: 'center', color: C.textMuted, paddingVertical: Spacing.lg },
  actionsRow: { flexDirection: 'row', gap: Spacing.sm },
});
