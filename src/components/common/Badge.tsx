import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography, BorderRadius, Spacing } from '../../constants/typography';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'outline';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; border?: string }> = {
  primary: { bg: Colors.accent, text: Colors.white },
  success: { bg: 'rgba(16,185,129,0.12)', text: Colors.success },
  warning: { bg: 'rgba(245,158,11,0.12)', text: Colors.warning },
  error: { bg: 'rgba(239,68,68,0.12)', text: Colors.error },
  neutral: { bg: Colors.surface, text: Colors.textSecondary },
  outline: { bg: 'transparent', text: Colors.accent, border: Colors.accent },
};

export default function Badge({ label, variant = 'neutral', size = 'md', style, textStyle }: BadgeProps) {
  const vs = variantStyles[variant];

  return (
    <View
      style={[
        styles.badge,
        size === 'sm' ? styles.badgeSm : styles.badgeMd,
        {
          backgroundColor: vs.bg,
          borderColor: vs.border ?? 'transparent',
          borderWidth: vs.border ? 1 : 0,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          size === 'sm' ? styles.textSm : styles.textMd,
          { color: vs.text },
          textStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.badge,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  badgeMd: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  textSm: { fontSize: 10 },
  textMd: { fontSize: 12 },
});
