import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { UserType } from '../../types';
import Button from '../../components/common/Button';
import { Colors } from '../../constants/colors';
import { Typography, Spacing, BorderRadius, Shadow } from '../../constants/typography';

type NavProp = NativeStackNavigationProp<AuthStackParamList, 'UserType'>;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface TypeCardProps {
  icon: string;
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}

function TypeCard({ icon, title, description, selected, onPress }: TypeCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      style={[styles.typeCard, selected && styles.typeCardSelected, animatedStyle]}
      onPress={() => {
        scale.value = withTiming(0.95, { duration: 100 }, () => {
          scale.value = withTiming(1, { duration: 150 });
        });
        onPress();
      }}
      activeOpacity={0.9}
    >
      <Text style={styles.typeIcon}>{icon}</Text>
      <Text style={[styles.typeTitle, selected && styles.typeTitleSelected]}>{title}</Text>
      <Text style={[styles.typeDesc, selected && styles.typeDescSelected]}>{description}</Text>
      {selected && (
        <View style={styles.checkCircle}>
          <Text style={styles.checkText}>✓</Text>
        </View>
      )}
    </AnimatedTouchable>
  );
}

export default function UserTypeScreen() {
  const navigation = useNavigation<NavProp>();
  const [selectedType, setSelectedType] = useState<UserType | null>(null);

  const handleContinue = () => {
    if (!selectedType) return;
    if (selectedType === 'athlete') {
      navigation.navigate('AthleteRegister');
    } else {
      navigation.navigate('PTRegister');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Sen kimsin?</Text>
        <Text style={styles.subtitle}>
          Sana özel deneyim için kullanıcı tipini seç
        </Text>

        <View style={styles.cards}>
          <TypeCard
            icon="🏃"
            title="Ben Sporcuyum"
            description="PT bulmak ve online koçluk almak istiyorum"
            selected={selectedType === 'athlete'}
            onPress={() => setSelectedType('athlete')}
          />
          <TypeCard
            icon="💪"
            title="Ben PT'yim"
            description="Öğrencilerimi yönetmek ve koçluk vermek istiyorum"
            selected={selectedType === 'pt'}
            onPress={() => setSelectedType('pt')}
          />
        </View>

        <Button
          title="Devam Et"
          onPress={handleContinue}
          disabled={!selectedType}
          style={styles.button}
        />

        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={styles.loginLink}
        >
          <Text style={styles.loginText}>
            Zaten hesabın var mı?{' '}
            <Text style={styles.loginTextBold}>Giriş Yap</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backBtn: {
    padding: Spacing.base,
    paddingTop: Spacing.md,
  },
  backText: {
    fontSize: 24,
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    padding: Spacing.base,
    paddingTop: Spacing.xl,
    gap: 16,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: -8,
  },
  cards: {
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  typeCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.card,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadow.medium,
    position: 'relative',
  },
  typeCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(233,69,96,0.04)',
  },
  typeIcon: { fontSize: 52 },
  typeTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  typeTitleSelected: {
    color: Colors.accent,
  },
  typeDesc: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  typeDescSelected: {
    color: Colors.textPrimary,
  },
  checkCircle: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  button: {
    marginTop: Spacing.xl,
  },
  loginLink: {
    alignItems: 'center',
    padding: Spacing.sm,
  },
  loginText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  loginTextBold: {
    color: Colors.accent,
    fontWeight: '700',
  },
});
