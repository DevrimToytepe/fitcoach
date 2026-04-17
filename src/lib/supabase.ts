import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  'https://edqhvdctheiyyniqdcap.supabase.co';

const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkcWh2ZGN0aGVpeXluaXFkY2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MzM1NjQsImV4cCI6MjA5MTMwOTU2NH0.GA_qefsDE7-bZHoi71i_f8abF1gPjrzQTM5YsUjpvO0';

// Web'de SecureStore çalışmaz; sadece native'de import ediyoruz
const buildStorage = () => {
  if (Platform.OS === 'web') {
    return AsyncStorage;
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const SecureStore = require('expo-secure-store');
  return {
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
      await AsyncStorage.setItem(key, value);
    },
    async removeItem(key: string): Promise<void> {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch {}
      await AsyncStorage.removeItem(key);
    },
  };
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: buildStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
