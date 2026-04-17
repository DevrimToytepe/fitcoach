import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { PT } from '../../types';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import Icon from '../common/Icon';
import { useColors } from '../../constants/colors';
import { Typography, Spacing, BorderRadius, Shadow } from '../../constants/typography';
import { getCapacityColor, getSpecializationLabel, formatPrice } from '../../utils/helpers';

interface PTCardProps {
  pt: PT;
  onPress: () => void;
  horizontal?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function getMinPrice(pt: PT): number {
  if (!pt.packages || pt.packages.length === 0) return 0;
  return Math.min(...pt.packages.map((p) => p.price));
}

export default function PTCard({ pt, onPress, horizontal = false }: PTCardProps) {
  const C = useColors();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const capacityColor = getCapacityColor(pt.students.length, pt.maxStudents);
  const isFull = pt.students.length >= pt.maxStudents;
  const minPrice = getMinPrice(pt);

  const visibleSpecs = pt.specializations.slice(0, 2);
  const extraCount = pt.specializations.length - 2;

  if (horizontal) {
    return (
      <AnimatedTouchable
        style={[styles.horizontalCard, { backgroundColor: C.card }, animatedStyle]}
        onPress={onPress}
        onPressIn={() => { scale.value = withTiming(0.97, { duration: 150 }); }}
        onPressOut={() => { scale.value = withTiming(1, { duration: 150 }); }}
        activeOpacity={0.95}
      >
        <Avatar uri={pt.avatar} name={`${pt.firstName} ${pt.lastName}`} size="lg" />
        <View style={styles.horizontalInfo}>
          <Text style={[styles.name, { color: C.textPrimary }]} numberOfLines={1}>
            {pt.firstName} {pt.lastName}
          </Text>
          <View style={styles.ratingRow}>
            <Icon name="star" size={12} color="#F59E0B" />
            <Text style={[styles.rating, { color: C.textPrimary }]}>{pt.rating.toFixed(1)}</Text>
          </View>
          <Text style={[styles.price, { color: C.accent }]}>{formatPrice(minPrice)}'den</Text>
          <View style={[styles.capacityDot, { backgroundColor: capacityColor }]} />
        </View>
      </AnimatedTouchable>
    );
  }

  return (
    <AnimatedTouchable
      style={[styles.card, { backgroundColor: C.card }, animatedStyle]}
      onPress={onPress}
      onPressIn={() => { scale.value = withTiming(0.97, { duration: 150 }); }}
      onPressOut={() => { scale.value = withTiming(1, { duration: 150 }); }}
      activeOpacity={0.95}
    >
      <View style={styles.header}>
        <Avatar uri={pt.avatar} name={`${pt.firstName} ${pt.lastName}`} size="md" />
        <View style={styles.headerInfo}>
          <Text style={[styles.name, { color: C.textPrimary }]} numberOfLines={1}>
            {pt.firstName} {pt.lastName}
          </Text>
          <View style={styles.ratingRow}>
            <Icon name="star" size={12} color="#F59E0B" />
            <Text style={[styles.rating, { color: C.textPrimary }]}>{pt.rating.toFixed(1)}</Text>
            <Text style={[styles.reviewCount, { color: C.textSecondary }]}>({pt.reviewCount})</Text>
          </View>
        </View>
        <View style={styles.priceBox}>
          <Text style={[styles.priceText, { color: C.accent }]}>{formatPrice(minPrice)}</Text>
          <Text style={[styles.priceLabel, { color: C.textSecondary }]}>den başlayan</Text>
        </View>
      </View>

      <View style={styles.specsRow}>
        {visibleSpecs.map((spec) => (
          <Badge
            key={spec}
            label={getSpecializationLabel(spec)}
            variant="neutral"
            size="sm"
          />
        ))}
        {extraCount > 0 && (
          <Badge label={`+${extraCount}`} variant="outline" size="sm" />
        )}
      </View>

      <View style={[styles.footer, { borderTopColor: C.border }]}>
        <View style={styles.capacityBadge}>
          <View style={[styles.capacityDot, { backgroundColor: capacityColor }]} />
          <Text style={[styles.capacityText, { color: capacityColor }]}>
            {pt.students.length}/{pt.maxStudents}
            {isFull ? ' · Dolu' : ''}
          </Text>
        </View>
        <Text style={[styles.experience, { color: C.textSecondary }]}>{pt.experienceYears} yıl deneyim</Text>
      </View>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.card,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadow.medium,
    gap: Spacing.sm,
  },
  horizontalCard: {
    borderRadius: BorderRadius.card,
    padding: Spacing.base,
    width: 140,
    alignItems: 'center',
    gap: 8,
    ...Shadow.small,
    marginRight: Spacing.sm,
  },
  horizontalInfo: {
    alignItems: 'center',
    gap: 2,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerInfo: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  name: {
    ...Typography.h3,
    fontSize: 15,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rating: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  reviewCount: { ...Typography.caption },
  priceBox: { alignItems: 'flex-end' },
  priceText: { ...Typography.body, fontWeight: '700' },
  priceLabel: { ...Typography.caption },
  price: { ...Typography.caption, fontWeight: '600' },
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  capacityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  capacityText: { ...Typography.caption, fontWeight: '600' },
  experience: { ...Typography.caption },
});
