import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { setOnboardingDone } from '../../utils/storage';
import { Colors } from '../../constants/colors';
import { Typography, Spacing } from '../../constants/typography';
import Button from '../../components/common/Button';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icon: '🏋️',
    title: 'Hedefine Uygun Koçu Bul',
    description:
      'Lisanslı Personal Trainer\'larımızı keşfet. Uzmanlık alanı, fiyat ve değerlendirmelere göre en uygun koçunu seç.',
    bgColor: '#1A1A2E',
  },
  {
    id: '2',
    icon: '📱',
    title: 'Online Antrenman Al',
    description:
      'Koçunla mesajlaşarak programını öğren. İstediğin zaman, istediğin yerden antrenmanlarına devam et.',
    bgColor: '#16213E',
  },
  {
    id: '3',
    icon: '📈',
    title: 'Gelişimini Takip Et',
    description:
      'Koçunun before/after galerisini incele. Başarı hikayelerini gör ve motivasyonunu yüksek tut.',
    bgColor: '#0F3460',
  },
];

type NavProp = NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;

export default function OnboardingScreen() {
  const navigation = useNavigation<NavProp>();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleSkip = async () => {
    await setOnboardingDone();
    navigation.navigate('Login');
  };

  const handleNext = async () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      await setOnboardingDone();
      navigation.navigate('UserType');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
        <Text style={styles.skipText}>Atla</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveIndex(idx);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { backgroundColor: item.bgColor, width }]}>
            <Text style={styles.slideIcon}>{item.icon}</Text>
            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideDesc}>{item.description}</Text>
          </View>
        )}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        <Button
          title={activeIndex === SLIDES.length - 1 ? 'Hadi Başlayalım 🚀' : 'İleri'}
          onPress={handleNext}
          style={styles.button}
        />

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
          <Text style={styles.loginText}>
            Zaten hesabın var mı?{' '}
            <Text style={styles.loginTextBold}>Giriş Yap</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  skipBtn: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
    padding: Spacing.sm,
  },
  skipText: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.7)',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 24,
    paddingBottom: 180,
  },
  slideIcon: {
    fontSize: 80,
  },
  slideTitle: {
    ...Typography.h1,
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 36,
  },
  slideDesc: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 26,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.xl,
    paddingBottom: 48,
    gap: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.accent,
  },
  dotInactive: {
    width: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  button: {
    width: '100%',
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  loginText: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.6)',
  },
  loginTextBold: {
    color: Colors.accent,
    fontWeight: '700',
  },
});
