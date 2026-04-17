import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, Animated, Platform } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

export default function SplashScreen() {
  const opacity = useRef(new Animated.Value(Platform.OS === 'web' ? 1 : 0)).current;
  const scale = useRef(new Animated.Value(Platform.OS === 'web' ? 1 : 0.5)).current;
  const taglineOpacity = useRef(new Animated.Value(Platform.OS === 'web' ? 1 : 0)).current;

  useEffect(() => {
    if (Platform.OS === 'web') return;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();
    const timer = setTimeout(() => {
      Animated.timing(taglineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <Animated.View style={[styles.logoContainer, { opacity, transform: [{ scale }] }]}>
        <Text style={styles.logo}>💪</Text>
        <Text style={styles.appName}>FitCoach</Text>
      </Animated.View>
      <Animated.View style={[styles.taglineContainer, { opacity: taglineOpacity }]}>
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
