import { Platform, TextStyle } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const Typography: Record<string, TextStyle> = {
  h1: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    fontFamily,
  },
  h2: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
    fontFamily,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
    fontFamily,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const BorderRadius = {
  card: 16,
  input: 12,
  button: 28,
  badge: 20,
  small: 8,
  circle: 999,
};

export const ComponentSize = {
  buttonHeight: 52,
  inputHeight: 52,
  minTouchTarget: 44,
  avatarSmall: 36,
  avatarMedium: 48,
  avatarLarge: 80,
  avatarXLarge: 100,
};

export const Shadow = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};
