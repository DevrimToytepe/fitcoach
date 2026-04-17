import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { showToast } from '../../components/common/Toast';
import { Colors } from '../../constants/colors';
import { Typography, Spacing } from '../../constants/typography';

const schema = z.object({
  email: z.string().email('Geçerli bir e-posta girin'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const [sent, setSent] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (_data: FormData) => {
    await new Promise((r) => setTimeout(r, 800));
    setSent(true);
    showToast('Şifre sıfırlama e-postası gönderildi!', 'success');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>

          <Text style={styles.icon}>{sent ? '✅' : '🔐'}</Text>
          <Text style={styles.title}>{sent ? 'E-posta Gönderildi!' : 'Şifremi Unuttum'}</Text>
          <Text style={styles.subtitle}>
            {sent
              ? 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.'
              : 'E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.'}
          </Text>

          {!sent && (
            <View style={styles.form}>
              <Controller
                control={control}
                name="email"
                render={({ field }) => (
                  <Input
                    label="E-posta"
                    placeholder="ornek@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="done"
                    value={field.value}
                    onChangeText={field.onChange}
                    error={errors.email?.message}
                  />
                )}
              />
              <Button title="Sıfırlama Bağlantısı Gönder" onPress={handleSubmit(onSubmit)} style={styles.button} />
            </View>
          )}

          {sent && (
            <Button
              title="Giriş Sayfasına Dön"
              onPress={() => navigation.goBack()}
              variant="outline"
              style={{ marginTop: Spacing.xl }}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: Spacing.base, paddingTop: Spacing.xl },
  back: { padding: Spacing.sm, marginBottom: Spacing.lg, alignSelf: 'flex-start' },
  backText: { fontSize: 24, color: Colors.textPrimary },
  icon: { fontSize: 56, textAlign: 'center', marginBottom: 16 },
  title: { ...Typography.h1, color: Colors.textPrimary, textAlign: 'center' },
  subtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, marginTop: 8, marginBottom: Spacing.xl },
  form: { gap: 4 },
  button: { marginTop: Spacing.lg },
});
