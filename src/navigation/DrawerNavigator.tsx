import React from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DrawerParamList, MainTabParamList, ProductStackParamList } from './types';
import { Colors, Typography, Spacing } from '../shared/theme/theme';
import ProductListScreen from '../features/products/ProductListScreen';
import ProductFormScreen from '../features/products/ProductFormScreen';

const Drawer = createDrawerNavigator<DrawerParamList>();
const ProductStack = createNativeStackNavigator<ProductStackParamList>();

function ProductStackNavigator() {
  return (
    <ProductStack.Navigator screenOptions={{ headerShown: false }}>
      <ProductStack.Screen name="ProductList" component={ProductListScreen} />
      <ProductStack.Screen name="ProductForm" component={ProductFormScreen} />
    </ProductStack.Navigator>
  );
}
const Tab = createBottomTabNavigator<MainTabParamList>();

const C = Colors.light;

function CustomDrawerContent(props: DrawerContentComponentProps) {
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
      <View style={styles.drawerHeader}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>POS</Text>
        </View>
        <Text style={styles.companyName}>Orbit POS</Text>
      </View>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}

function MoreScreen() {
  return (
    <View style={styles.placeholderScreen}>
      <Text style={styles.placeholderText}>More Options</Text>
    </View>
  );
}

function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'help';
          if (route.name === 'POSTab') iconName = focused ? 'cart' : 'cart-outline';
          else if (route.name === 'ProductsTab') iconName = focused ? 'cube' : 'cube-outline';
          else if (route.name === 'SalesTab') iconName = focused ? 'receipt' : 'receipt-outline';
          else if (route.name === 'ContactsTab') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'MoreTab') iconName = focused ? 'menu' : 'menu-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.textMuted,
        tabBarStyle: { paddingBottom: 4, height: 60 },
        tabBarLabelStyle: { fontSize: Typography.xs, fontWeight: '600' },
        headerShown: false,
      })}
    >
      <Tab.Screen name="POSTab" component={POSPlaceholder} options={{ tabBarLabel: 'POS' }} />
      <Tab.Screen name="ProductsTab" component={ProductsPlaceholder} options={{ tabBarLabel: 'Products' }} />
      <Tab.Screen name="SalesTab" component={SalesPlaceholder} options={{ tabBarLabel: 'Sales' }} />
      <Tab.Screen name="ContactsTab" component={ContactsPlaceholder} options={{ tabBarLabel: 'Contacts' }} />
      <Tab.Screen name="MoreTab" component={MoreScreen} options={{ tabBarLabel: 'More' }} />
    </Tab.Navigator>
  );
}

function POSPlaceholder() {
  return (
    <View style={styles.placeholderScreen}>
      <Text style={styles.placeholderText}>POS Screen</Text>
    </View>
  );
}

function ProductsPlaceholder() {
  return (
    <View style={styles.placeholderScreen}>
      <Text style={styles.placeholderText}>Products Screen</Text>
    </View>
  );
}

function SalesPlaceholder() {
  return (
    <View style={styles.placeholderScreen}>
      <Text style={styles.placeholderText}>Sales Screen</Text>
    </View>
  );
}

function ContactsPlaceholder() {
  return (
    <View style={styles.placeholderScreen}>
      <Text style={styles.placeholderText}>Contacts Screen</Text>
    </View>
  );
}

export function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: C.surface },
        headerTintColor: C.textPrimary,
        headerTitleStyle: { fontWeight: '700' },
        drawerActiveTintColor: C.primary,
        drawerInactiveTintColor: C.textSecondary,
        drawerLabelStyle: { fontSize: Typography.md, fontWeight: '500' },
        drawerStyle: { width: 280 },
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        component={BottomTabs}
        options={{
          title: 'Dashboard',
          drawerIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="POS"
        component={POSPlaceholder}
        options={{
          title: 'Point of Sale',
          drawerIcon: ({ color, size }) => <Ionicons name="cart" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Products"
        component={ProductStackNavigator}
        options={{
          title: 'Products',
          drawerIcon: ({ color, size }) => <Ionicons name="cube" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Sales"
        component={SalesPlaceholder}
        options={{
          title: 'Sales',
          drawerIcon: ({ color, size }) => <Ionicons name="receipt" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Contacts"
        component={ContactsPlaceholder}
        options={{
          title: 'Contacts',
          drawerIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Purchases"
        component={POSPlaceholder}
        options={{
          title: 'Purchases',
          drawerIcon: ({ color, size }) => <Ionicons name="cart-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="StockTransfers"
        component={POSPlaceholder}
        options={{
          title: 'Stock Transfers',
          drawerIcon: ({ color, size }) => <Ionicons name="swap-horizontal" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Shipments"
        component={POSPlaceholder}
        options={{
          title: 'Shipments',
          drawerIcon: ({ color, size }) => <Ionicons name="airplane" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="SellReturns"
        component={POSPlaceholder}
        options={{
          title: 'Returns',
          drawerIcon: ({ color, size }) => <Ionicons name="return-up-back" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Expenses"
        component={POSPlaceholder}
        options={{
          title: 'Expenses',
          drawerIcon: ({ color, size }) => <Ionicons name="wallet" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Reports"
        component={POSPlaceholder}
        options={{
          title: 'Reports',
          drawerIcon: ({ color, size }) => <Ionicons name="bar-chart" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="FieldForce"
        component={POSPlaceholder}
        options={{
          title: 'Field Force',
          drawerIcon: ({ color, size }) => <Ionicons name="location" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Followups"
        component={POSPlaceholder}
        options={{
          title: 'Follow-ups',
          drawerIcon: ({ color, size }) => <Ionicons name="notifications" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={POSPlaceholder}
        options={{
          title: 'Settings',
          drawerIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
    paddingTop: 0,
  },
  drawerHeader: {
    padding: Spacing.xl,
    paddingTop: Spacing.xxl,
    backgroundColor: C.primary,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  logoText: {
    color: '#fff',
    fontSize: Typography.xl,
    fontWeight: '800',
  },
  companyName: {
    color: '#fff',
    fontSize: Typography.lg,
    fontWeight: '700',
  },
  placeholderScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.background,
  },
  placeholderText: {
    fontSize: Typography.lg,
    color: C.textSecondary,
  },
});
