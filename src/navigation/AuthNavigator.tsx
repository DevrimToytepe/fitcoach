import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import AthleteRegisterScreen from '../screens/auth/AthleteRegisterScreen';
import PTRegisterScreen from '../screens/auth/PTRegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import UserTypeScreen from '../screens/onboarding/UserTypeScreen';

export type AuthStackParamList = {
  Onboarding: undefined;
  UserType: undefined;
  Login: undefined;
  AthleteRegister: undefined;
  PTRegister: undefined;
  ForgotPassword: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Onboarding"
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="UserType" component={UserTypeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="AthleteRegister" component={AthleteRegisterScreen} />
      <Stack.Screen name="PTRegister" component={PTRegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
