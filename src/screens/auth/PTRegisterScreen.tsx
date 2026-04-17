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
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as ImagePicker from 'expo-image-picker';
import { generateUUID } from '../../utils/uuid';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useAuthStore } from '../../store/authStore';
import { usePTStore } from '../../store/ptStore';
import { Specialization, CoachingPackage } from '../../types';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Icon from '../../components/common/Icon';
import { showToast } from '../../components/common/Toast';
import { Colors } from '../../constants/colors';
import { Typography, Spacing } from '../../constants/typography';
import { getSpecializationLabel } from '../../utils/helpers';

const ALL_SPECS: Specialization[] = [
  'weight_loss', 'muscle_gain', 'functional', 'yoga', 'pilates', 'nutrition', 'rehabilitation',
];

const PACKAGE_CONFIGS = [
  { level: 'starter' as const, label: 'Başlangıç', weeks: 4, sessions: 2, color: '#0EA5E9' },
  { level: 'intermediate' as const, label: 'Orta Seviye', weeks: 8, sessions: 3, color: '#22C55E' },
  { level: 'professional' as const, label: 'Profesyonel', weeks: 12, sessions: 4, color: '#F97316' },
];

const step1Schema = z.object({
  firstName: z.string().min(2, 'Ad en az 2 karakter'),
  lastName: z.string().min(2, 'Soyad en az 2 karakter'),
  email: z.string().email('Geçerli e-posta girin'),
  password: z.string().min(6, 'En az 6 karakter'),
  confirmPassword: z.string().min(6),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword'],
});

const step3Schema = z.object({
  bio: z.string().min(20, 'Biyografi en az 20 karakter olmalı').max(500),
  starterPrice: z.number().min(100, 'En az 100 TL olmalı'),
  midPrice: z.number().min(200, 'En az 200 TL olmalı'),
  proPrice: z.number().min(300, 'En az 300 TL olmalı'),
  starterFeature: z.string().min(3),
  midFeature: z.string().min(3),
  proFeature: z.string().min(3),
});

type S1 = z.infer<typeof step1Schema>;
type S3 = z.infer<typeof step3Schema>;
type NavProp = NativeStackNavigationProp<AuthStackParamList, 'PTRegister'>;

export default function PTRegisterScreen() {
  const navigation = useNavigation<NavProp>();
  const { registerPT, isLoading } = useAuthStore();
  const loadPTs = usePTStore((s) => s.loadPTs);

  const [step, setStep] = useState(1);
  const [s1Data, setS1Data] = useState<S1 | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);

  // Step 2 — local state (react-hook-form Controller re-render sorununu bypass eder)
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [experienceYears, setExperienceYears] = useState('1');
  const [certificates, setCertificates] = useState('');
  const [step2Error, setStep2Error] = useState('');

  const f1 = useForm<S1>({ resolver: zodResolver(step1Schema) });
  const f3 = useForm<S3>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      bio: '',
      starterPrice: 1500,
      midPrice: 3000,
      proPrice: 5000,
      starterFeature: 'Kişisel antrenman programı, Haftalık takip, Temel rehberlik',
      midFeature: 'Kişisel program, 7/24 mesajlaşma, Haftalık video analizi, İlerleme raporu',
      proFeature: 'Tam kişisel program, Günlük takip, 7/24 öncelikli destek, Aylık görüntülü seans, Supplement rehberi',
    },
  });

  const bioValue = f3.watch('bio');

  const toggleSpec = (spec: Specialization) => {
    setSpecializations((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const pickAvatar = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!res.canceled) setAvatar(res.assets[0].uri);
  };

  const buildPackages = (data: S3): CoachingPackage[] => [
    {
      id: generateUUID(),
      level: 'starter',
      name: 'Başlangıç',
      price: data.starterPrice,
      durationWeeks: 4,
      sessionsPerWeek: 2,
      features: data.starterFeature.split(',').map((f) => f.trim()).filter(Boolean),
    },
    {
      id: generateUUID(),
      level: 'intermediate',
      name: 'Orta Seviye',
      price: data.midPrice,
      durationWeeks: 8,
      sessionsPerWeek: 3,
      features: data.midFeature.split(',').map((f) => f.trim()).filter(Boolean),
      isPopular: true,
    },
    {
      id: generateUUID(),
      level: 'professional',
      name: 'Profesyonel',
      price: data.proPrice,
      durationWeeks: 12,
      sessionsPerWeek: 4,
      features: data.proFeature.split(',').map((f) => f.trim()).filter(Boolean),
    },
  ];

  const onStep2Next = () => {
    if (specializations.length === 0) {
      setStep2Error('En az 1 uzmanlık alanı seçin');
      return;
    }
    if (!certificates.trim() || certificates.trim().length < 3) {
      setStep2Error('Sertifika bilgisi girin');
      return;
    }
    setStep2Error('');
    setStep(3);
  };

  const onFinal = async (data: S3) => {
    if (!s1Data) return;
    try {
      await registerPT({
        ...s1Data,
        specializations,
        experienceYears: parseInt(experienceYears) || 1,
        certificates,
        bio: data.bio,
        packages: buildPackages(data),
        avatar: avatar ?? undefined,
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
        <View style={[styles.progress, { width: `${(step / 3) * 100}%` }]} />
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
            activeOpacity={0.7}
            onPress={() => (step === 1 ? navigation.goBack() : setStep(step - 1))}
          >
            <Icon name="arrow_left" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.stepLabel}>Adım {step}/3</Text>
          <Text style={styles.title}>
            {['Hesap Oluştur', 'Uzmanlık Bilgileri', 'Profil & Paketler'][step - 1]}
          </Text>

          {/* ── STEP 1: Hesap ── */}
          {step === 1 && (
            <View style={styles.form}>
              <View style={styles.row}>
                <Controller control={f1.control} name="firstName" render={({ field }) => (
                  <Input label="Ad" placeholder="Adın" autoCapitalize="words" value={field.value} onChangeText={field.onChange} error={f1.formState.errors.firstName?.message} containerStyle={{ flex: 1 }} />
                )} />
                <Controller control={f1.control} name="lastName" render={({ field }) => (
                  <Input label="Soyad" placeholder="Soyadın" autoCapitalize="words" value={field.value} onChangeText={field.onChange} error={f1.formState.errors.lastName?.message} containerStyle={{ flex: 1 }} />
                )} />
              </View>
              <Controller control={f1.control} name="email" render={({ field }) => (
                <Input label="E-posta" placeholder="ornek@email.com" keyboardType="email-address" autoCapitalize="none" value={field.value} onChangeText={field.onChange} error={f1.formState.errors.email?.message} />
              )} />
              <Controller control={f1.control} name="password" render={({ field }) => (
                <Input label="Şifre" isPassword value={field.value} onChangeText={field.onChange} error={f1.formState.errors.password?.message} />
              )} />
              <Controller control={f1.control} name="confirmPassword" render={({ field }) => (
                <Input label="Şifre Tekrar" isPassword value={field.value} onChangeText={field.onChange} error={f1.formState.errors.confirmPassword?.message} />
              )} />
              <Button title="Devam Et" onPress={f1.handleSubmit((d) => { setS1Data(d); setStep(2); })} style={styles.button} />
            </View>
          )}

          {/* ── STEP 2: Uzmanlık (local state) ── */}
          {step === 2 && (
            <View style={styles.form}>
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Uzmanlık Alanları</Text>
                <View style={styles.chips}>
                  {ALL_SPECS.map((spec) => {
                    const sel = specializations.includes(spec);
                    return (
                      <TouchableOpacity
                        key={spec}
                        activeOpacity={0.6}
                        style={[styles.chip, sel && styles.chipSel]}
                        onPress={() => toggleSpec(spec)}
                      >
                        <Text style={[styles.chipTxt, sel && styles.chipTxtSel]}>
                          {getSpecializationLabel(spec)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <Input
                label="Deneyim Yılı"
                placeholder="Yıl sayısı"
                keyboardType="number-pad"
                value={experienceYears}
                onChangeText={setExperienceYears}
              />
              <Input
                label="Sertifikalar"
                placeholder="Örn: ACSM CPT, ACE Certified..."
                value={certificates}
                onChangeText={setCertificates}
              />

              {step2Error ? <Text style={styles.error}>{step2Error}</Text> : null}

              <Button title="Devam Et" onPress={onStep2Next} style={styles.button} />
            </View>
          )}

          {/* ── STEP 3: Profil & Paketler ── */}
          {step === 3 && (
            <View style={styles.form}>
              {/* Avatar */}
              <View style={styles.avatarSection}>
                <TouchableOpacity style={styles.avatarPicker} onPress={pickAvatar} activeOpacity={0.7}>
                  {avatar ? (
                    <Image source={{ uri: avatar }} style={styles.avatarImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Icon name="camera" size={28} color={Colors.textSecondary} />
                      <Text style={styles.avatarPlaceholderText}>Profil Fotoğrafı Ekle</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Bio */}
              <Controller control={f3.control} name="bio" render={({ field }) => (
                <View>
                  <View style={styles.bioHeader}>
                    <Text style={styles.sectionLabel}>Biyografi</Text>
                    <Text style={styles.charCount}>{bioValue?.length ?? 0}/500</Text>
                  </View>
                  <Input
                    placeholder="Kendin ve uzmanlık alanların hakkında yaz..."
                    multiline
                    numberOfLines={5}
                    maxLength={500}
                    value={field.value}
                    onChangeText={field.onChange}
                    error={f3.formState.errors.bio?.message}
                    style={{ height: 110 }}
                  />
                </View>
              )} />

              {/* Packages */}
              <View style={styles.packagesSection}>
                <Text style={styles.sectionLabel}>Koçluk Paketleri</Text>
                <Text style={styles.packagesHint}>
                  Her paket için fiyat ve öne çıkan özellikleri girin. Özellikler virgülle ayrılır.
                </Text>

                {PACKAGE_CONFIGS.map((cfg) => {
                  const priceField = cfg.level === 'starter' ? 'starterPrice' : cfg.level === 'intermediate' ? 'midPrice' : 'proPrice';
                  const featureField = cfg.level === 'starter' ? 'starterFeature' : cfg.level === 'intermediate' ? 'midFeature' : 'proFeature';

                  return (
                    <View key={cfg.level} style={[styles.packageInput, { borderLeftColor: cfg.color }]}>
                      <View style={styles.packageInputHeader}>
                        <View style={[styles.packageLevelDot, { backgroundColor: cfg.color }]} />
                        <Text style={[styles.packageLevelLabel, { color: cfg.color }]}>{cfg.label}</Text>
                        <Text style={styles.packageMeta}>
                          {cfg.weeks} hafta · Haftada {cfg.sessions} seans
                        </Text>
                      </View>
                      <Controller control={f3.control} name={priceField as any} render={({ field }) => (
                        <Input
                          label="Paket Fiyatı (₺)"
                          placeholder="Örn: 2000"
                          keyboardType="number-pad"
                          value={field.value?.toString() ?? ''}
                          onChangeText={(v) => field.onChange(parseInt(v) || 0)}
                          error={(f3.formState.errors as any)[priceField]?.message}
                        />
                      )} />
                      <Controller control={f3.control} name={featureField as any} render={({ field }) => (
                        <Input
                          label="Özellikler (virgülle ayır)"
                          placeholder="Özellik 1, Özellik 2, Özellik 3..."
                          multiline
                          numberOfLines={3}
                          value={field.value}
                          onChangeText={field.onChange}
                          error={(f3.formState.errors as any)[featureField]?.message}
                          style={{ height: 80 }}
                        />
                      )} />
                    </View>
                  );
                })}
              </View>

              <Button title="Kayıt Ol" onPress={f3.handleSubmit(onFinal)} isLoading={isLoading} style={styles.button} />
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
  scroll: { flexGrow: 1, padding: Spacing.base, paddingTop: Spacing.lg, paddingBottom: 40 },
  back: { padding: Spacing.sm, marginBottom: Spacing.sm, alignSelf: 'flex-start' },
  stepLabel: { ...Typography.caption, color: Colors.accent, fontWeight: '700', marginBottom: 4 },
  title: { ...Typography.h1, color: Colors.textPrimary, marginBottom: Spacing.xl },
  form: { gap: 4 },
  row: { flexDirection: 'row', gap: 10 },
  section: { gap: 8, marginTop: Spacing.sm },
  sectionLabel: { ...Typography.label, color: Colors.textPrimary, marginBottom: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipSel: { borderColor: Colors.accent, backgroundColor: Colors.accent },
  chipTxt: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTxtSel: { color: Colors.white },
  error: { ...Typography.caption, color: Colors.error, marginTop: 4 },
  button: { marginTop: Spacing.lg },
  avatarSection: { alignItems: 'center', marginBottom: Spacing.lg },
  avatarPicker: { width: 100, height: 100, borderRadius: 50, overflow: 'hidden', borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed' },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.surface },
  avatarPlaceholderText: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
  bioHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  charCount: { ...Typography.caption, color: Colors.textSecondary },
  packagesSection: { gap: 12, marginTop: Spacing.sm },
  packagesHint: { ...Typography.caption, color: Colors.textSecondary, marginBottom: 4, lineHeight: 18 },
  packageInput: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.base,
    borderLeftWidth: 4,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  packageInputHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  packageLevelDot: { width: 10, height: 10, borderRadius: 5 },
  packageLevelLabel: { ...Typography.label, fontWeight: '700' },
  packageMeta: { ...Typography.caption, color: Colors.textSecondary, marginLeft: 'auto' },
});
