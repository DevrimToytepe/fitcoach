import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useAuthStore } from '../../store/authStore';
import { usePTStore } from '../../store/ptStore';
import { ExperienceLevel, FitnessGoal } from '../../types';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { showToast } from '../../components/common/Toast';
import { Colors } from '../../constants/colors';
import { Typography, Spacing } from '../../constants/typography';
import { getExperienceLabel, getGoalLabel, getGoalIconName } from '../../utils/helpers';
import Icon, { IconName } from '../../components/common/Icon';

const step1Schema = z.object({
  firstName: z.string().min(2, 'Ad en az 2 karakter olmalı'),
  lastName: z.string().min(2, 'Soyad en az 2 karakter olmalı'),
  email: z.string().email('Geçerli bir e-posta girin'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı'),
  confirmPassword: z.string().min(6, 'Şifreyi tekrarlayın'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword'],
});

type Step1Data = z.infer<typeof step1Schema>;
type NavProp = NativeStackNavigationProp<AuthStackParamList, 'AthleteRegister'>;

const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: 'beginner', label: 'Başlangıç' },
  { value: 'intermediate', label: 'Orta Seviye' },
  { value: 'advanced', label: 'İleri Seviye' },
];

const GENDERS: { value: 'male' | 'female' | 'other'; label: string; icon: string }[] = [
  { value: 'male', label: 'Erkek', icon: '👨' },
  { value: 'female', label: 'Kadın', icon: '👩' },
  { value: 'other', label: 'Diğer', icon: '🧑' },
];

const FITNESS_GOALS: FitnessGoal[] = ['lose_weight', 'gain_muscle', 'stay_fit', 'healthy_life'];

export default function AthleteRegisterScreen() {
  const navigation = useNavigation<NavProp>();
  const { registerAthlete, isLoading } = useAuthStore();
  const loadPTs = usePTStore((s) => s.loadPTs);

  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);

  // Step 2 — local state (react-hook-form Controller re-render sorununu bypass eder)
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal>('gain_muscle');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('beginner');
  const [step2Error, setStep2Error] = useState('');

  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema) });

  const onStep1Submit = (data: Step1Data) => {
    setStep1Data(data);
    setStep(2);
  };

  const onStep2Submit = async () => {
    const ageNum = parseInt(age);
    if (!age || isNaN(ageNum) || ageNum < 16 || ageNum > 80) {
      setStep2Error('Yaş 16-80 arasında olmalı');
      return;
    }
    setStep2Error('');
    if (!step1Data) return;

    try {
      await registerAthlete({
        ...step1Data,
        age: ageNum,
        gender,
        fitnessGoal,
        experienceLevel,
      });
      loadPTs();
    } catch (error: any) {
      showToast(error?.message ?? 'Kayıt başarısız. Tekrar deneyin.', 'error');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <View style={styles.progressBar}>
        <View style={[styles.progress, { width: step === 1 ? '50%' : '100%' }]} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.back}
            onPress={() => (step === 1 ? navigation.goBack() : setStep(1))}
            activeOpacity={0.7}
          >
            <Text style={styles.backText}>← {step === 2 ? 'Geri' : ''}</Text>
          </TouchableOpacity>

          <Text style={styles.stepLabel}>Adım {step}/2</Text>
          <Text style={styles.title}>
            {step === 1 ? 'Hesap Oluştur' : 'Profilini Tamamla'}
          </Text>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <View style={styles.form}>
              <View style={styles.row}>
                <Controller
                  control={form1.control}
                  name="firstName"
                  render={({ field }) => (
                    <Input
                      label="Ad"
                      placeholder="Adın"
                      returnKeyType="next"
                      autoCapitalize="words"
                      value={field.value}
                      onChangeText={field.onChange}
                      error={form1.formState.errors.firstName?.message}
                      containerStyle={{ flex: 1 }}
                    />
                  )}
                />
                <Controller
                  control={form1.control}
                  name="lastName"
                  render={({ field }) => (
                    <Input
                      label="Soyad"
                      placeholder="Soyadın"
                      returnKeyType="next"
                      autoCapitalize="words"
                      value={field.value}
                      onChangeText={field.onChange}
                      error={form1.formState.errors.lastName?.message}
                      containerStyle={{ flex: 1 }}
                    />
                  )}
                />
              </View>

              <Controller
                control={form1.control}
                name="email"
                render={({ field }) => (
                  <Input
                    label="E-posta"
                    placeholder="ornek@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="next"
                    value={field.value}
                    onChangeText={field.onChange}
                    error={form1.formState.errors.email?.message}
                  />
                )}
              />
              <Controller
                control={form1.control}
                name="password"
                render={({ field }) => (
                  <Input
                    label="Şifre"
                    placeholder="En az 6 karakter"
                    isPassword
                    returnKeyType="next"
                    value={field.value}
                    onChangeText={field.onChange}
                    error={form1.formState.errors.password?.message}
                  />
                )}
              />
              <Controller
                control={form1.control}
                name="confirmPassword"
                render={({ field }) => (
                  <Input
                    label="Şifre Tekrar"
                    placeholder="Şifreni tekrarla"
                    isPassword
                    returnKeyType="done"
                    value={field.value}
                    onChangeText={field.onChange}
                    error={form1.formState.errors.confirmPassword?.message}
                  />
                )}
              />

              <Button
                title="Devam Et"
                onPress={form1.handleSubmit(onStep1Submit)}
                style={styles.button}
              />
            </View>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <View style={styles.form}>

              {/* Yaş */}
              <Input
                label="Yaş"
                placeholder="Yaşın (16-80)"
                keyboardType="number-pad"
                returnKeyType="done"
                value={age}
                onChangeText={setAge}
                error={step2Error}
              />

              {/* Cinsiyet */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Cinsiyet</Text>
                <View style={styles.genderRow}>
                  {GENDERS.map((g) => (
                    <TouchableOpacity
                      key={g.value}
                      activeOpacity={0.6}
                      style={[styles.genderChip, gender === g.value && styles.genderChipSelected]}
                      onPress={() => setGender(g.value)}
                    >
                      <Text style={styles.genderIcon}>{g.icon}</Text>
                      <Text style={[styles.genderLabel, gender === g.value && styles.genderLabelSelected]}>
                        {g.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Fitness Hedefi */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Fitness Hedefin</Text>
                <View style={styles.goalGrid}>
                  {FITNESS_GOALS.map((goal) => {
                    const selected = fitnessGoal === goal;
                    return (
                      <TouchableOpacity
                        key={goal}
                        activeOpacity={0.6}
                        style={[styles.goalCard, selected && styles.goalCardSelected]}
                        onPress={() => setFitnessGoal(goal)}
                      >
                        <Icon
                          name={getGoalIconName(goal) as IconName}
                          size={26}
                          color={selected ? Colors.accent : Colors.textSecondary}
                        />
                        <Text style={[styles.goalLabel, selected && styles.goalLabelSelected]}>
                          {getGoalLabel(goal)}
                        </Text>
                        {selected && (
                          <View style={styles.goalCheck}>
                            <Icon name="check" size={10} color={Colors.white} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Deneyim Seviyesi */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Deneyim Seviyesi</Text>
                <View style={styles.levelRow}>
                  {EXPERIENCE_LEVELS.map((lvl) => (
                    <TouchableOpacity
                      key={lvl.value}
                      activeOpacity={0.6}
                      style={[styles.levelChip, experienceLevel === lvl.value && styles.levelChipSelected]}
                      onPress={() => setExperienceLevel(lvl.value)}
                    >
                      <Text style={[styles.levelLabel, experienceLevel === lvl.value && styles.levelLabelSelected]}>
                        {lvl.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <Button
                title="Kayıt Ol"
                onPress={onStep2Submit}
                isLoading={isLoading}
                style={styles.button}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  progressBar: { height: 4, backgroundColor: Colors.border },
  progress: { height: '100%', backgroundColor: Colors.accent },
  scroll: {
    flexGrow: 1,
    padding: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: 40,
  },
  back: {
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    alignSelf: 'flex-start',
  },
  backText: { fontSize: 16, color: Colors.textPrimary, fontWeight: '600' },
  stepLabel: {
    ...Typography.caption,
    color: Colors.accent,
    fontWeight: '700',
    marginBottom: 4,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
  },
  form: { gap: 4 },
  row: { flexDirection: 'row', gap: 10 },
  section: { marginTop: Spacing.sm, gap: 8 },
  sectionLabel: {
    ...Typography.label,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  button: { marginTop: Spacing.lg },

  // Cinsiyet
  genderRow: { flexDirection: 'row', gap: 8 },
  genderChip: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
  },
  genderChipSelected: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(233,69,96,0.07)',
  },
  genderIcon: { fontSize: 22 },
  genderLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  genderLabelSelected: { color: Colors.accent },

  // Fitness Hedefi
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalCard: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    minHeight: 85,
    justifyContent: 'center',
  },
  goalCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(233,69,96,0.05)',
  },
  goalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  goalLabelSelected: {
    color: Colors.accent,
    fontWeight: '700',
  },
  goalCheck: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Deneyim Seviyesi
  levelRow: { flexDirection: 'row', gap: 8 },
  levelChip: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  levelChipSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent,
  },
  levelLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  levelLabelSelected: { color: Colors.white },
});
