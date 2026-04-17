import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => Promise<void>;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: true, // Varsayılan karanlık mod

  toggleTheme: async () => {
    const newVal = !get().isDark;
    set({ isDark: newVal });
    try {
      await AsyncStorage.setItem('fitcoach_dark_mode', JSON.stringify(newVal));
    } catch {}
  },

  loadTheme: async () => {
    try {
      const stored = await AsyncStorage.getItem('fitcoach_dark_mode');
      if (stored !== null) {
        set({ isDark: JSON.parse(stored) });
      }
    } catch {}
  },
}));
