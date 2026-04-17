import React, { useState } from 'react';
import {
  View, TextInput, TouchableOpacity, Text, StyleSheet,
  Platform, ActivityIndicator, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useColors } from '../../constants/colors';
import { Typography, Spacing, BorderRadius } from '../../constants/typography';

interface ChatInputProps {
  onSend: (message: string) => void;
  onSendImage?: (imageUrl: string) => Promise<void>;
  disabled?: boolean;
}

export default function ChatInput({ onSend, onSendImage, disabled = false }: ChatInputProps) {
  const C = useColors();
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  const handlePickImage = async () => {
    if (!onSendImage) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Fotoğraf seçmek için galeri izni gerekiyor.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.7,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      await onSendImage(result.assets[0].uri);
    } catch {
      Alert.alert('Hata', 'Fotoğraf gönderilemedi.');
    } finally {
      setUploading(false);
    }
  };

  const canSend = !!text.trim() && !disabled && !uploading;

  return (
    <View style={[
      styles.container,
      { backgroundColor: C.card, borderTopColor: C.border },
      disabled && { backgroundColor: C.surface },
    ]}>
      {/* Fotoğraf butonu */}
      {onSendImage && !disabled && (
        <TouchableOpacity
          style={[styles.imageBtn, { backgroundColor: C.surface, borderColor: C.border }]}
          onPress={handlePickImage}
          disabled={uploading}
        >
          {uploading
            ? <ActivityIndicator size="small" color={C.accent} />
            : <Text style={{ fontSize: 20 }}>📷</Text>
          }
        </TouchableOpacity>
      )}

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: C.inputBackground ?? C.surface,
            color: C.textPrimary,
            borderColor: C.border,
          },
          disabled && { backgroundColor: C.border, color: C.textSecondary },
        ]}
        value={text}
        onChangeText={setText}
        placeholder={disabled ? 'Bu koçluk ilişkisi sona erdi' : 'Mesaj yaz...'}
        placeholderTextColor={C.textSecondary}
        multiline
        maxLength={500}
        editable={!disabled && !uploading}
        returnKeyType="default"
        textAlignVertical="top"
        numberOfLines={1}
      />
      <TouchableOpacity
        style={[
          styles.sendButton,
          { backgroundColor: C.accent },
          !canSend && { backgroundColor: C.border },
        ]}
        onPress={handleSend}
        disabled={!canSend}
      >
        <Text style={styles.sendIcon}>➤</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    gap: Spacing.sm,
    ...Platform.select({
      ios: { paddingBottom: Spacing.sm },
    }),
  },
  imageBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 2,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: BorderRadius.badge,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    ...Typography.body,
    borderWidth: 1,
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
