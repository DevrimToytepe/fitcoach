import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
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
import { useMessageStore } from '../../store/messageStore';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { showToast } from '../../components/common/Toast';
import { Colors } from '../../constants/colors';
import { Typography, Spacing } from '../../constants/typography';

const schema = z.object({
  email: z.string().email('Geçerli bir e-posta girin'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı'),
});

type FormData = z.infer<typeof schema>;
type NavProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<NavProp>();
  const { login, isLoading } = useAuthStore();
  const loadPTs = usePTStore((s) => s.loadPTs);
  const loadConversations = useMessageStore((s) => s.loadConversations);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      loadPTs();
      await loadConversations();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Giriş başarısız', 'error');
    }
  };

  const fillTestAthlete = () => {
    setValue('email', 'ali@test.com');
    setValue('password', '123456');
  };

  const fillTestPT = () => {
    setValue('email', 'ahmet@test.com');
    setValue('password', '123456');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.logo}>💪</Text>
            <Text style={styles.title}>Hoş Geldin!</Text>
            <Text style={styles.subtitle}>Hesabına giriş yap</Text>
          </View>

          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="E-posta"
                  placeholder="ornek@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="next"
                  value={value}
                  onChangeText={onChange}
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Şifre"
                  placeholder="••••••"
                  isPassword
                  autoComplete="password"
                  returnKeyType="done"
                  value={value}
                  onChangeText={onChange}
                  error={errors.password?.message}
                />
              )}
            />

            <View style={styles.rememberRow}>
              <View style={styles.rememberLeft}>
                <Switch
                  value={rememberMe}
                  onValueChange={setRememberMe}
                  trackColor={{ false: Colors.border, true: Colors.accent }}
                  thumbColor={Colors.white}
                />
                <Text style={styles.rememberText}>Beni Hatırla</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotText}>Şifremi Unuttum</Text>
              </TouchableOpacity>
            </View>

            <Button
              title="Giriş Yap"
              onPress={handleSubmit(onSubmit)}
              isLoading={isLoading}
              style={styles.button}
            />
          </View>

          {/* Test accounts */}
          <View style={styles.testBox}>
            <Text style={styles.testTitle}>🧪 Test Hesapları</Text>
            <View style={styles.testButtons}>
              <TouchableOpacity style={styles.testBtn} onPress={fillTestAthlete}>
                <Text style={styles.testBtnText}>🏃 Sporcu</Text>
                <Text style={styles.testBtnSub}>ali@test.com</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.testBtn} onPress={fillTestPT}>
                <Text style={styles.testBtnText}>💪 PT</Text>
                <Text style={styles.testBtnSub}>ahmet@test.com</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Hesabın yok mu? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('UserType')}>
              <Text style={styles.signupLink}>Kayıt Ol</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  kav: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: Spacing.base,
    paddingTop: Spacing.xl,
  },
  back: {
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    alignSelf: 'flex-start',
  },
  backText: { fontSize: 24, color: Colors.textPrimary },
  header: {
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.xxl,
  },
  logo: { fontSize: 48 },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  form: { gap: 4 },
  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  rememberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rememberText: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
  },
  forgotText: {
    ...Typography.bodySmall,
    color: Colors.accent,
    fontWeight: '600',
  },
  button: { marginTop: Spacing.sm },
  testBox: {
    marginTop: Spacing.xl,
    padding: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  testTitle: {
    ...Typography.label,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  testButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  testBtn: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 2,
  },
  testBtnText: {
    ...Typography.label,
    color: Colors.textPrimary,
  },
  testBtnSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
    padding: Spacing.sm,
  },
  signupText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  signupLink: {
    ...Typography.body,
    color: Colors.accent,
    fontWeight: '700',
  },
});
