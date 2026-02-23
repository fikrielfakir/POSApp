
const { width } = Dimensions.get('window');

const C = Colors.light;

interface StatCardProps {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}

    totalSales: 0,
    totalRevenue: 0,
    totalTax: 0,
    count: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    try {
      const summary = getSalesSummary();
      setStats(summary);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const quickActions: Array<{ title: string; icon: keyof typeof Ionicons.glyphMap; color: string; screen: string }> = [
    { title: 'New Sale', icon: 'cart', color: C.primary, screen: 'POS' },
    { title: 'Add Product', icon: 'cube', color: C.success, screen: 'Products' },
    { title: 'Add Contact', icon: 'person-add', color: C.info, screen: 'Contacts' },
    { title: 'Expenses', icon: 'wallet', color: C.warning, screen: 'Expenses' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back!</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          title="Total Sales"
          value={stats.count.toString()}
          icon="receipt"
          color={C.primary}
        />
        <StatCard
          title="Revenue"
          value={'$' + stats.totalRevenue.toFixed(2)}
          icon="cash"
          color={C.success}
        />
        <StatCard
          title="Tax Collected"
          value={'$' + stats.totalTax.toFixed(2)}
          icon="document-text"
          color={C.info}
        />
        <StatCard
          title="Total Value"
          value={'$' + stats.totalSales.toFixed(2)}
          icon="trending-up"
          color={C.secondary}
        />
      </View>

              <Ionicons name={action.icon} size={28} color={action.color} />
            </View>
            <Text style={styles.actionTitle}>{action.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <View style={styles.activityCard}>
        <Text style={styles.emptyActivity}>No recent activity</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  content: {
    padding: Spacing.md,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontSize: Typography.xxl,
    fontWeight: '800',
    color: C.textPrimary,
  },
  date: {
    fontSize: Typography.sm,
    color: C.textMuted,
    marginTop: Spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - Spacing.md * 3) / 2,
    backgroundColor: C.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: Typography.xl,
    fontWeight: '700',
    color: C.textPrimary,
  },
  statTitle: {
    fontSize: Typography.sm,
    color: C.textMuted,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: C.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - Spacing.md * 3) / 2,
    backgroundColor: C.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  actionTitle: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: C.textPrimary,
  },
  activityCard: {
    backgroundColor: C.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  emptyActivity: {
    textAlign: 'center',
    color: C.textMuted,
  },
});
