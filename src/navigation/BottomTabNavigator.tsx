import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { MainTabParamList } from './types';
import { Colors, Typography, Spacing } from '@shared/theme/theme';

import POSScreen from '@features/sales/POSScreen';
import ProductListScreen from '@features/products/ProductListScreen';
import SaleListScreen from '@features/sales/SaleListScreen';
import ContactListScreen from '@features/contacts/ContactListScreen';
import { DrawerNavigator } from './DrawerNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();
const C = Colors.light;

interface TabIconProps {
  emoji: string;
  label: string;
  focused: boolean;
}
function TabIcon({ emoji, label, focused }: TabIconProps) {
  return (
    <View style={styles.tabIcon}>
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="POSTab"
        component={POSScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🛒" label="POS" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ProductsTab"
        component={ProductListScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📦" label="Products" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="SalesTab"
        component={SaleListScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🧾" label="Sales" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ContactsTab"
        component={ContactListScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Contacts" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="MoreTab"
        component={DrawerNavigator}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="☰" label="More" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: C.surface,
    borderTopColor: C.border,
    borderTopWidth: 1,
    height: 62,
    paddingBottom: 6,
  },
  tabIcon: {
    alignItems: 'center',
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: Typography.xs,
    color: C.textSecondary,
    marginTop: 2,
  },
  tabLabelActive: {
    color: C.primary,
    fontWeight: '600',
  },
});
