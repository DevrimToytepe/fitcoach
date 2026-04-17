import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { Message } from '../../types';
import { useColors } from '../../constants/colors';
import { Typography, Spacing, BorderRadius } from '../../constants/typography';
import { formatTime } from '../../utils/helpers';

const SCREEN_W = Dimensions.get('window').width;

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const C = useColors();
  const [lightboxVisible, setLightboxVisible] = useState(false);

  if (message.type === 'system') {
    return (
      <View style={styles.systemContainer}>
        <Text style={[styles.systemText, { color: C.textSecondary, backgroundColor: C.surface }]}>
          {message.content}
        </Text>
      </View>
    );
  }

  if (message.type === 'image' && message.imageUrl) {
    return (
      <View style={[styles.container, isOwn ? styles.containerOwn : styles.containerOther]}>
        <TouchableOpacity onPress={() => setLightboxVisible(true)} activeOpacity={0.9}>
          <View style={[
            styles.imageBubble,
            isOwn
              ? { borderBottomRightRadius: 4, borderColor: C.accent }
              : { borderBottomLeftRadius: 4, borderColor: C.border },
          ]}>
            <Image
              source={{ uri: message.imageUrl }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          </View>
        </TouchableOpacity>
        <Text style={[styles.time, { color: C.textSecondary }, isOwn ? styles.timeOwn : styles.timeOther]}>
          {formatTime(message.timestamp)}
        </Text>

        {/* Lightbox */}
        <Modal visible={lightboxVisible} transparent animationType="fade">
          <TouchableOpacity
            style={styles.lightboxOverlay}
            activeOpacity={1}
            onPress={() => setLightboxVisible(false)}
          >
            <Image
              source={{ uri: message.imageUrl }}
              style={styles.lightboxImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </Modal>
      </View>
    );
  }

  return (
    <View style={[styles.container, isOwn ? styles.containerOwn : styles.containerOther]}>
      <View style={[
        styles.bubble,
        isOwn
          ? [styles.bubbleOwn, { backgroundColor: C.accent }]
          : [styles.bubbleOther, { backgroundColor: C.surface }],
      ]}>
        <Text style={[styles.text, { color: isOwn ? '#fff' : C.textPrimary }]}>
          {message.content}
        </Text>
      </View>
      <Text style={[styles.time, { color: C.textSecondary }, isOwn ? styles.timeOwn : styles.timeOther]}>
        {formatTime(message.timestamp)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: '75%',
    marginVertical: 2,
    gap: 2,
  },
  containerOwn: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
    marginRight: Spacing.base,
  },
  containerOther: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
    marginLeft: Spacing.base,
  },
  bubble: {
    borderRadius: BorderRadius.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '100%',
  },
  bubbleOwn: { borderBottomRightRadius: 4 },
  bubbleOther: { borderBottomLeftRadius: 4 },
  text: {
    ...Typography.body,
    fontSize: 15,
    lineHeight: 22,
  },
  imageBubble: {
    borderRadius: BorderRadius.card,
    borderWidth: 2,
    overflow: 'hidden',
  },
  messageImage: {
    width: SCREEN_W * 0.55,
    height: SCREEN_W * 0.55,
  },
  time: {
    ...Typography.caption,
    fontSize: 10,
  },
  timeOwn: { marginRight: 4 },
  timeOther: { marginLeft: 4 },
  systemContainer: {
    alignItems: 'center',
    marginVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  systemText: {
    ...Typography.caption,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  lightboxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxImage: {
    width: SCREEN_W,
    height: SCREEN_W * 1.2,
  },
});
