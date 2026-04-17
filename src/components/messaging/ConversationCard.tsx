import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Conversation } from '../../types';
import Avatar from '../common/Avatar';
import { useColors } from '../../constants/colors';
import { Typography, Spacing } from '../../constants/typography';
import { formatMessageTime, truncateText } from '../../utils/helpers';
import { useAuthStore } from '../../store/authStore';

interface ConversationCardProps {
  conversation: Conversation;
  onPress: () => void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function ConversationCard({ conversation, onPress }: ConversationCardProps) {
  const C = useColors();
  const user = useAuthStore((s) => s.user);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isAthlete = user?.userType === 'athlete';
  const otherName = isAthlete ? conversation.ptName : conversation.athleteName;
  const otherAvatar = isAthlete ? conversation.ptAvatar : conversation.athleteAvatar;

  return (
    <AnimatedTouchable
      style={[
        styles.container,
        animatedStyle,
        { backgroundColor: C.card, borderBottomColor: C.border },
      ]}
      onPress={onPress}
      onPressIn={() => { scale.value = withTiming(0.98, { duration: 100 }); }}
      onPressOut={() => { scale.value = withTiming(1, { duration: 100 }); }}
      activeOpacity={0.95}
    >
      <Avatar uri={otherAvatar} name={otherName} size="md" />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: C.textPrimary }]} numberOfLines={1}>
            {otherName}
          </Text>
          <Text style={[styles.time, { color: C.textSecondary }]}>
            {formatMessageTime(conversation.lastMessageTime)}
          </Text>
        </View>
        <View style={styles.messageRow}>
          <Text
            style={[
              styles.lastMessage,
              { color: C.textSecondary },
              !conversation.isActive && { color: C.error, fontSize: 12 },
            ]}
            numberOfLines={1}
          >
            {!conversation.isActive ? '🔴 Koçluk sona erdi' : truncateText(conversation.lastMessage, 40)}
          </Text>
          {conversation.unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: C.accent }]}>
              <Text style={styles.badgeText}>{conversation.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  info: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { ...Typography.label, flex: 1, marginRight: 8 },
  time: { ...Typography.caption },
  messageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastMessage: { ...Typography.bodySmall, flex: 1, marginRight: 8 },
  badge: {
    minWidth: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  badgeText: { ...Typography.caption, color: '#fff', fontWeight: '700', fontSize: 11 },
});
