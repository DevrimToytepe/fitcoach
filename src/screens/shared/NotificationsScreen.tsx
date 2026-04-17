import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, SafeAreaView, StatusBar,
  TouchableOpacity, ListRenderItemInfo,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon, { IconName } from '../../components/common/Icon';
import { useColors } from '../../constants/colors';
import { Typography, Spacing, BorderRadius } from '../../constants/typography';
import { Notification } from '../../types';
import { formatRelativeTime } from '../../utils/helpers';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

const NOTIF_ICON_MAP: Record<Notification['type'], { icon: IconName; color: string }> = {
  coaching_accepted: { icon: 'check', color: '#22C55E' },
  coaching_rejected: { icon: 'close', color: '#EF4444' },
  new_message: { icon: 'message', color: '#E94560' },
  coaching_request: { icon: 'notification', color: '#F97316' },
};

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const C = useColors();
  const user = useAuthStore((s) => s.user);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    const notifs: Notification[] = (data ?? []).map((n) => ({
      id: n.id,
      type: n.type as Notification['type'],
      title: n.title ?? '',
      body: n.message ?? '',
      isRead: n.is_read ?? false,
      createdAt: new Date(n.created_at),
    }));
    setNotifications(notifs);
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleNotifPress = (notif: Notification) => {
    markRead(notif.id);
    navigation.goBack();
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const renderItem = ({ item }: ListRenderItemInfo<Notification>) => {
    const iconConfig = NOTIF_ICON_MAP[item.type];
    return (
      <TouchableOpacity
        style={[
          styles.notifItem,
          { backgroundColor: C.card, borderBottomColor: C.border },
          !item.isRead && { backgroundColor: 'rgba(233,69,96,0.08)' },
        ]}
        onPress={() => handleNotifPress(item)}
      >
        <View style={[styles.notifIconContainer, { backgroundColor: `${iconConfig.color}22` }]}>
          <Icon name={iconConfig.icon} size={20} color={iconConfig.color} />
        </View>
        <View style={styles.notifContent}>
          <Text style={[styles.notifTitle, { color: item.isRead ? C.textSecondary : C.textPrimary }, !item.isRead && styles.notifTitleUnread]}>
            {item.title}
          </Text>
          <Text style={[styles.notifBody, { color: C.textSecondary }]} numberOfLines={2}>{item.body}</Text>
          <Text style={[styles.notifTime, { color: C.textSecondary }]}>{formatRelativeTime(item.createdAt)}</Text>
        </View>
        {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: C.accent }]} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.background} />
      <View style={[styles.header, { backgroundColor: C.card, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Icon name="arrow_left" size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <View style={styles.titleRow}>
          <Icon name="notification" size={20} color={C.textPrimary} />
          <Text style={[styles.title, { color: C.textPrimary }]}>
            Bildirimler {unreadCount > 0 ? `(${unreadCount})` : ''}
          </Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={[styles.markAll, { color: C.accent }]}>Tümünü Oku</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        getItemLayout={(_, index) => ({ length: 84, offset: 84 * index, index })}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="notification" size={48} color={C.border} />
            <Text style={[styles.emptyText, { color: C.textSecondary }]}>Bildirim yok</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1,
    gap: 10,
  },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  title: { ...Typography.h3 },
  markAll: { ...Typography.caption, fontWeight: '700' },
  list: { paddingBottom: 40 },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.base,
    borderBottomWidth: 1,
    gap: 12,
  },
  notifIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notifContent: { flex: 1, gap: 3 },
  notifTitle: { ...Typography.label },
  notifTitleUnread: { fontWeight: '700' },
  notifBody: { ...Typography.bodySmall, lineHeight: 20 },
  notifTime: { ...Typography.caption, marginTop: 2 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    flexShrink: 0,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: { ...Typography.body },
});
