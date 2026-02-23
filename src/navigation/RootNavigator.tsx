import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../core/store/authStore';
import { initializeDatabase } from '../core/database/db';
import { getSecureItem } from '../core/utils/storage';
import SetupScreen from '../features/setup/SetupScreen';
import PINLockScreen from '../features/auth/PINLockScreen';
import { DrawerNavigator } from './DrawerNavigator';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [appState, setAppState] = useState<'checking' | 'setup' | 'locked' | 'unlocked'>('checking');
  const { isUnlocked, unlock, lock } = useAuthStore();

  useEffect(() => {
    async function init() {
      try {
        await initializeDatabase();
        const hasPin = await getSecureItem('pos_pin');
        const isSetup = await getSecureItem('app_setup_complete');
        
        if (!isSetup) {
          setAppState('setup');
        } else if (!hasPin) {
          setAppState('locked');
        } else {
          setAppState('unlocked');
        }
      } catch (error) {
        console.error('Init error:', error);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (isUnlocked && appState === 'locked') {
      setAppState('unlocked');
    }
  }, [isUnlocked]);

  const handleUnlock = () => {
    setAppState('unlocked');
  };

  const handleSetupComplete = async () => {
    await getSecureItem('app_setup_complete');
    setAppState('locked');
  };

  const handleForgotPIN = () => {
    setAppState('setup');
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {appState === 'setup' && (
          <Stack.Screen name="Setup">
            {(props) => <SetupScreen {...props} onComplete={handleSetupComplete} />}
          </Stack.Screen>
        )}
        {appState === 'locked' && (
          <Stack.Screen name="PINLock">
            {(props) => <PINLockScreen {...props} onUnlocked={handleUnlock} onForgotPIN={handleForgotPIN} />}
          </Stack.Screen>
        )}
        {appState === 'unlocked' && (
          <Stack.Screen name="Main" component={DrawerNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
