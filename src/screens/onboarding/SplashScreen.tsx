import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

export default function SplashScreen() {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.5)) });
    opacity.value = withTiming(1, { duration: 500 });

    const timer = setTimeout(() => {
      taglineOpacity.value = withTiming(1, { duration: 400 });
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <Text style={styles.logo}>💪</Text>
        <Text style={styles.appName}>FitCoach</Text>
      </Animated.View>
      <Animated.View style={[styles.taglineContainer, taglineStyle]}>
        <Text style={styles.tagline}>Hedefine Ulaşmanın En İyi Yolu</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  logoContainer: {
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    fontSize: 72,
  },
  appName: {
    ...Typography.h1,
    fontSize: 42,
    color: Colors.white,
    letterSpacing: 2,
    fontWeight: '800',
  },
  taglineContainer: {
    position: 'absolute',
    bottom: 80,
  },
  tagline: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
  },
});
