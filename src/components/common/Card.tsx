import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useColors } from '../../constants/colors';
import { BorderRadius, Shadow, Spacing } from '../../constants/typography';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padding?: number;
  shadow?: 'none' | 'small' | 'medium' | 'large';
  backgroundColor?: string;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function Card({
  children,
  style,
  onPress,
  padding = Spacing.lg,
  shadow = 'medium',
  backgroundColor,
}: CardProps) {
  const C = useColors();
  const scale = useSharedValue(1);
  const resolvedBg = backgroundColor ?? C.card;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (onPress) {
    return (
      <AnimatedTouchable
        style={[
          styles.card,
          shadow !== 'none' ? Shadow[shadow] : null,
          { padding, backgroundColor: resolvedBg },
          animatedStyle,
          style,
        ]}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withTiming(0.97, { duration: 150 });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 150 });
        }}
        activeOpacity={0.95}
      >
        {children}
      </AnimatedTouchable>
    );
  }

  return (
    <View
      style={[
        styles.card,
        shadow !== 'none' ? Shadow[shadow] : null,
        { padding, backgroundColor: resolvedBg },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
  },
});
