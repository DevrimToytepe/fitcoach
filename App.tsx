import React, { useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { AppState, AppStateStatus, View, Text, ScrollView, Platform, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from './src/store/authStore';
import { usePTStore } from './src/store/ptStore';
import { useMessageStore } from './src/store/messageStore';
import AppNavigator from './src/navigation/AppNavigator';
import { ToastProvider } from './src/components/common/Toast';
import { supabase } from './src/lib/supabase';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('App crash:', error, info); }
  render() {
    if (this.state.error) {
      return (
        <ScrollView style={{ flex: 1, padding: 20, backgroundColor: '#1a1a2e' }}>
          <Text style={{ color: 'red', fontSize: 18, marginTop: 60 }}>Hata:</Text>
          <Text style={{ color: 'white', marginTop: 10 }}>{String(this.state.error)}</Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

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

  const rootStyle = Platform.OS === 'web'
    ? { flex: 1, height: '100%' as any, width: '100%' as any }
    : { flex: 1 };

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={rootStyle}>
        <SafeAreaProvider style={rootStyle}>
          <ToastProvider>
            <AppNavigator />
          </ToastProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
