import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PT } from '../../types';
import Badge from '../common/Badge';
import { Colors } from '../../constants/colors';
import { Typography, Spacing, ComponentSize } from '../../constants/typography';
import { getSpecializationLabel } from '../../utils/helpers';

interface PTProfileHeaderProps {
  pt: PT;
  onBack?: () => void;
}

export default function PTProfileHeader({ pt, onBack }: PTProfileHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: pt.avatar }}
        style={styles.image}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['transparent', 'rgba(26,26,46,0.97)']}
          style={styles.gradient}
          locations={[0.3, 1]}
        >
          <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
            {onBack && (
              <TouchableOpacity style={styles.backButton} onPress={onBack}>
                <Text style={styles.backIcon}>←</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.info}>
            <Text style={styles.name}>
              {pt.firstName} {pt.lastName}
            </Text>
            <Text style={styles.title}>
              Kişisel Antrenör · {pt.experienceYears} Yıl Deneyim
            </Text>

            <View style={styles.ratingRow}>
              <Text style={styles.star}>⭐</Text>
              <Text style={styles.rating}>{pt.rating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>({pt.reviewCount} değerlendirme)</Text>
            </View>

            <View style={styles.specs}>
              {pt.specializations.map((spec) => (
                <Badge
                  key={spec}
                  label={getSpecializationLabel(spec)}
                  variant="primary"
                  size="sm"
                />
              ))}
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 340,
    overflow: 'hidden',
  },
  image: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    paddingHorizontal: Spacing.base,
  },
  backButton: {
    width: ComponentSize.minTouchTarget,
    height: ComponentSize.minTouchTarget,
    borderRadius: ComponentSize.minTouchTarget / 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 22,
    color: Colors.white,
  },
  info: {
    padding: Spacing.base,
    gap: 8,
  },
  name: {
    ...Typography.h1,
    color: Colors.white,
    fontSize: 26,
  },
  title: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.75)',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  star: { fontSize: 14 },
  rating: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.white,
  },
  reviewCount: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.7)',
  },
  specs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
});
