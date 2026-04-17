import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { useColors } from '../../constants/colors';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonItem({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const C = useColors();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const skeletonColor = C.skeleton;
  const skeletonHighlight = C.skeletonHighlight;

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      shimmer.value,
      [0, 0.5, 1],
      [skeletonColor, skeletonHighlight, skeletonColor],
    ),
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function PTCardSkeleton() {
  const C = useColors();
  return (
    <View style={[styles.ptCard, { backgroundColor: C.card }]}>
      <View style={styles.ptCardRow}>
        <SkeletonItem width={64} height={64} borderRadius={32} />
        <View style={styles.ptCardInfo}>
          <SkeletonItem width="60%" height={16} />
          <SkeletonItem width="80%" height={12} style={{ marginTop: 6 }} />
          <SkeletonItem width="40%" height={12} style={{ marginTop: 6 }} />
        </View>
      </View>
      <View style={styles.ptCardTags}>
        <SkeletonItem width={70} height={24} borderRadius={12} />
        <SkeletonItem width={80} height={24} borderRadius={12} />
      </View>
    </View>
  );
}

export function ConversationSkeleton() {
  const C = useColors();
  return (
    <View style={[styles.conversation, { backgroundColor: C.card, borderBottomColor: C.border }]}>
      <SkeletonItem width={48} height={48} borderRadius={24} />
      <View style={styles.conversationInfo}>
        <SkeletonItem width="50%" height={14} />
        <SkeletonItem width="80%" height={12} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ptCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  ptCardRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  ptCardInfo: {
    flex: 1,
    gap: 4,
  },
  ptCardTags: {
    flexDirection: 'row',
    gap: 8,
  },
  conversation: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
  },
  conversationInfo: {
    flex: 1,
    gap: 4,
  },
});
