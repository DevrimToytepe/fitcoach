import React, { useState, forwardRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import { Typography, ComponentSize, BorderRadius, Spacing } from '../../constants/typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    onRightIconPress,
    containerStyle,
    isPassword = false,
    style,
    multiline,
    ...props
  },
  ref,
) {
  const [showPassword, setShowPassword] = useState(false);
  const focusAnim = useSharedValue(0);

  // Multiline için explicit pixel yüksekliği (style prop'tan al, yoksa varsayılan)
  const multilineHeight: number = multiline
    ? (typeof (style as any)?.height === 'number' ? (style as any).height : 88)
    : ComponentSize.inputHeight;

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focusAnim.value,
      [0, 1],
      [error ? Colors.error : Colors.border, error ? Colors.error : Colors.accent],
    ),
  }));

  const handleFocus = () => {
    focusAnim.value = withTiming(1, { duration: 200 });
    props.onFocus?.({} as React.FocusEvent<HTMLInputElement>);
  };

  const handleBlur = () => {
    focusAnim.value = withTiming(0, { duration: 200 });
    props.onBlur?.({} as React.FocusEvent<HTMLInputElement>);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Animated.View
        style={[
          styles.inputContainer,
          { height: multilineHeight },
          multiline ? styles.inputContainerMultiline : null,
          animatedBorderStyle,
          error ? styles.errorBorder : null,
        ]}
      >
        {leftIcon && (
          <View style={[styles.leftIcon, multiline && { paddingTop: Spacing.sm }]}>
            {leftIcon}
          </View>
        )}
        <TextInput
          ref={ref}
          multiline={multiline}
          scrollEnabled={multiline}
          style={[
            styles.input,
            { height: multilineHeight },
            leftIcon ? styles.inputWithLeft : null,
            (rightIcon || isPassword) ? styles.inputWithRight : null,
            multiline ? styles.inputMultiline : null,
            // height dışındaki style prop'larını uygula
            style ? { ...style, height: undefined } : null,
          ]}
          placeholderTextColor={Colors.textSecondary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize={isPassword ? 'none' : props.autoCapitalize}
          {...props}
        />
        {isPassword ? (
          <TouchableOpacity
            style={[styles.rightIcon, multiline && { paddingTop: Spacing.sm }]}
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🙈'}</Text>
          </TouchableOpacity>
        ) : rightIcon ? (
          <TouchableOpacity
            style={[styles.rightIcon, multiline && { paddingTop: Spacing.sm }]}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {rightIcon}
          </TouchableOpacity>
        ) : null}
      </Animated.View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
});

export default Input;

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.base,
  },
  label: {
    ...Typography.label,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.input,
    backgroundColor: Colors.inputBackground,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  inputContainerMultiline: {
    alignItems: 'flex-start',
  },
  errorBorder: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.base,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  inputMultiline: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    textAlignVertical: 'top',
  },
  inputWithLeft: {
    paddingLeft: 8,
  },
  inputWithRight: {
    paddingRight: 8,
  },
  leftIcon: {
    paddingLeft: Spacing.base,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIcon: {
    paddingRight: Spacing.base,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: ComponentSize.minTouchTarget,
  },
  eyeIcon: {
    fontSize: 18,
  },
  error: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  hint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});
