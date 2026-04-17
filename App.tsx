import React, { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from './src/store/authStore';
import { usePTStore } from './src/store/ptStore';
import { useMessageStore } from './src/store/messageStore';
import AppNavigator from './src/navigation/AppNavigator';
import { ToastProvider } from './src/components/common/Toast';
import { supabase } from './src/lib/supabase';

export default function App() {
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const loadPTs = usePTStore((s) => s.loadPTs);
  const loadConversations = useMessageStore((s) => s.loadConversations);

  useEffect(() => {
    // Uygulama ilk açıldığında session restore
    const init = async () => {
      const hasSession = await restoreSession();
      if (hasSession) {
        loadPTs();
        await loadConversations();
      }
    };
    init();

    // AppState: arka plandan öne gelince token otomatik yenile
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ToastProvider>
          <AppNavigator />
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
