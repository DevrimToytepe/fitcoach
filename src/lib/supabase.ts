import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// ── Credentials ─────────────────────────────────────────────────────────────
// Expo SDK 49+ destekler: .env dosyasındaki EXPO_PUBLIC_* prefix'li değişkenler
// otomatik olarak process.env'e eklenir.
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  'https://edqhvdctheiyyniqdcap.supabase.co';

const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkcWh2ZGN0aGVpeXluaXFkY2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MzM1NjQsImV4cCI6MjA5MTMwOTU2NH0.GA_qefsDE7-bZHoi71i_f8abF1gPjrzQTM5YsUjpvO0';

// ── Güvenli depolama ─────────────────────────────────────────────────────────
// SecureStore → cihaz TPM/Keychain kullanır (şifreli)
// SecureStore tek bir value için 2048 karakter sınırı var; büyük değerler
// (JWT vs.) AsyncStorage fallback ile saklanır.
const SecureStoreWithFallback = {
  async getItem(key: string): Promise<string | null> {
    try {
      const secure = await SecureStore.getItemAsync(key);
      if (secure !== null) return secure;
    } catch {}
    return AsyncStorage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (value.length <= 2048) {
        await SecureStore.setItemAsync(key, value);
        return;
      }
    } catch {}
    // Büyük değerler için AsyncStorage
    await AsyncStorage.setItem(key, value);
  },
  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {}
    await AsyncStorage.removeItem(key);
  },
};

// ── Supabase client ──────────────────────────────────────────────────────────
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: SecureStoreWithFallback,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
