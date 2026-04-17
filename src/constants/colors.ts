import { useThemeStore } from '../store/themeStore';

export const lightColors = {
  primary: '#1A1A2E',
  accent: '#E94560',
  secondary: '#16213E',
  background: '#F5F5FA',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  white: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.5)',
  capacityFull: '#EF4444',
  capacityLow: '#F59E0B',
  capacityAvailable: '#10B981',
  gradientStart: 'rgba(26,26,46,0)',
  gradientEnd: 'rgba(26,26,46,0.95)',
  inputBackground: '#F3F4F6',
  tabBar: '#FFFFFF',
  tabBarActive: '#E94560',
  tabBarInactive: '#9CA3AF',
  skeleton: '#E5E7EB',
  skeletonHighlight: '#F3F4F6',
  systemMessage: '#9CA3AF',
  messageSent: '#E94560',
  messageReceived: '#F3F4F6',
  cardPressed: 'rgba(233,69,96,0.05)',
};

export const darkColors = {
  primary: '#1A1A2E',
  accent: '#E94560',
  secondary: '#16213E',
  background: '#0A0A14',
  surface: '#13131F',
  card: '#1A1A2A',
  textPrimary: '#EEEEF8',
  textSecondary: '#8080A0',
  border: '#252538',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  white: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.75)',
  capacityFull: '#EF4444',
  capacityLow: '#F59E0B',
  capacityAvailable: '#10B981',
  gradientStart: 'rgba(10,10,20,0)',
  gradientEnd: 'rgba(10,10,20,0.97)',
  inputBackground: '#1A1A2A',
  tabBar: '#0F0F1C',
  tabBarActive: '#E94560',
  tabBarInactive: '#404060',
  skeleton: '#252538',
  skeletonHighlight: '#303050',
  systemMessage: '#8080A0',
  messageSent: '#E94560',
  messageReceived: '#1A1A2A',
  cardPressed: 'rgba(233,69,96,0.1)',
};

// Geriye dönük uyumluluk için – statik renk kullanan eski ekranlar için
export const Colors = darkColors;

export type ThemeColors = typeof darkColors;
export type ColorKey = keyof ThemeColors;

export function useColors(): ThemeColors {
  const isDark = useThemeStore((s) => s.isDark);
  return isDark ? darkColors : lightColors;
}
