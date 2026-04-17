import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import SplashScreen from '../screens/onboarding/SplashScreen';
import AuthNavigator from './AuthNavigator';
import AthleteNavigator from './AthleteNavigator';
import PTNavigator from './PTNavigator';

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  AthleteApp: undefined;
  PTApp: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { isAuthenticated, user } = useAuthStore();
  const { loadTheme } = useThemeStore();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Temayı AsyncStorage'dan yükle
    loadTheme();
    const timer = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) return <SplashScreen />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : user?.userType === 'athlete' ? (
          <Stack.Screen name="AthleteApp" component={AthleteNavigator} />
        ) : (
          <Stack.Screen name="PTApp" component={PTNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
