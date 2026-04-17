import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Dimensions, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import Icon, { IconName } from './Icon';
import { Colors } from '../../constants/colors';
import { Typography, BorderRadius, Shadow } from '../../constants/typography';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

const { width } = Dimensions.get('window');

const typeConfig: Record<ToastType, { bg: string; icon: IconName }> = {
  success: { bg: Colors.success, icon: 'check' },
  error: { bg: Colors.error, icon: 'close' },
  warning: { bg: Colors.warning, icon: 'notification' },
  info: { bg: Colors.primary, icon: 'flash' },
};

export default function Toast({
  message,
  type = 'info',
  visible,
  onHide,
  duration = 3000,
}: ToastProps) {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSequence(
        withTiming(0, { duration: 250 }),
        withDelay(duration, withTiming(-100, { duration: 250 })),
      );
      opacity.value = withSequence(
        withTiming(1, { duration: 250 }),
        withDelay(duration, withTiming(0, { duration: 250 }, () => runOnJS(onHide)())),
      );
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  const config = typeConfig[type];

  return (
    <Animated.View style={[styles.toast, { backgroundColor: config.bg }, animatedStyle]}>
      <Icon name={config.icon} size={18} color={Colors.white} />
      <Text style={styles.message} numberOfLines={2}>{message}</Text>
    </Animated.View>
  );
}

// Toast manager hook
interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

let showToastRef: ((message: string, type?: ToastType) => void) | null = null;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = React.useState<ToastState>({
    message: '',
    type: 'info',
    visible: false,
  });

  useEffect(() => {
    showToastRef = (message: string, type: ToastType = 'info') => {
      setToast({ message, type, visible: true });
    };
    return () => {
      showToastRef = null;
    };
  }, []);

  return (
    <>
      {children}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </>
  );
}

export function showToast(message: string, type: ToastType = 'info') {
  if (showToastRef) {
    showToastRef(message, type);
  }
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: BorderRadius.card,
    gap: 10,
    ...Shadow.medium,
  },
  message: {
    ...Typography.bodySmall,
    color: Colors.white,
    flex: 1,
    fontWeight: '500',
  },
});
