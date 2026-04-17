import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, SafeAreaView, StatusBar,
  TouchableOpacity, KeyboardAvoidingView, Platform, ListRenderItemInfo,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AthleteStackParamList } from '../../navigation/AthleteNavigator';
import { useAuthStore } from '../../store/authStore';
import { useMessageStore } from '../../store/messageStore';
import { usePTStore } from '../../store/ptStore';
import MessageBubble from '../../components/messaging/MessageBubble';
import ChatInput from '../../components/messaging/ChatInput';
import { uploadChatImage } from '../../utils/upload';
import Avatar from '../../components/common/Avatar';
import { showToast } from '../../components/common/Toast';
import { useColors } from '../../constants/colors';
import { Typography, Spacing } from '../../constants/typography';
import { Message } from '../../types';
import { formatTime, shouldShowTimestamp } from '../../utils/helpers';

type RoutePropType = RouteProp<AthleteStackParamList, 'Chat'>;

export default function ChatScreen() {
  const navigation = useNavigation();
  const route = useRoute<RoutePropType>();
  const { conversationId, otherUserId, otherUserName } = route.params;

  const C = useColors();
  const user = useAuthStore((s) => s.user);
  const {
    messages,
    conversations,
    loadMessages,
    sendMessage,
    sendImageMessage,
    markAsRead,
    subscribeToConversation,
    unsubscribeFromConversation,
  } = useMessageStore();
  const pts = usePTStore((s) => s.pts);
  const flatListRef = useRef<FlatList>(null);
  const [isLoading, setIsLoading] = useState(true);

  const conversation = conversations.find((c) => c.id === conversationId);
  const isActive = conversation?.isActive ?? true;
  const conversationMessages = messages[conversationId] ?? [];

  const pt = pts.find((p) => p.id === otherUserId);
  const otherAvatar = pt?.avatar ?? '';

  useEffect(() => {
    loadMessages(conversationId).finally(() => setIsLoading(false));
    markAsRead(conversationId);
    subscribeToConversation(conversationId);
    return () => unsubscribeFromConversation(conversationId);
  }, [conversationId]);

  useEffect(() => {
    if (conversationMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [conversationMessages.length]);

  const handleSend = async (content: string) => {
    if (!isActive) {
      showToast('Bu koçluk ilişkisi sona erdi', 'warning');
      return;
    }
    try {
      await sendMessage(conversationId, content);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch {
      showToast('Mesaj gönderilemedi', 'error');
    }
  };

  const renderItem = ({ item, index }: ListRenderItemInfo<Message>) => {
    const isOwn = item.senderId === user?.id;
    const prevMsg = index > 0 ? conversationMessages[index - 1] : null;
    const showTs = shouldShowTimestamp(
      prevMsg ? prevMsg.timestamp : null,
      item.timestamp,
    );

    return (
      <View>
        {showTs && (
          <View style={styles.timestamp}>
            <Text style={[styles.timestampText, { color: C.textSecondary, backgroundColor: C.surface }]}>
              {formatTime(item.timestamp)}
            </Text>
          </View>
        )}
        <MessageBubble message={item} isOwn={isOwn} />
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.card, borderBottomColor: C.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: C.textPrimary }]}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerUser}
          onPress={() => {
            if (pt) {
              (navigation as any).navigate('PTProfile', { ptId: pt.id });
            }
          }}
        >
          <Avatar uri={otherAvatar} name={otherUserName} size="sm" />
          <View>
            <Text style={[styles.headerName, { color: C.textPrimary }]}>{otherUserName}</Text>
            <Text style={[styles.headerStatus, !isActive && { color: C.error }]}>
              {isActive ? '🟢 Aktif koçluk' : '🔴 Koçluk sona erdi'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Inactive banner */}
      {!isActive && (
        <View style={styles.inactiveBanner}>
          <Text style={[styles.inactiveBannerText, { color: C.error }]}>
            ⚠️ Bu koçluk ilişkisi sona erdi. Geçmiş mesajları okuyabilirsiniz.
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <FlatList
          ref={flatListRef}
          data={conversationMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyMessages}>
                <Text style={[styles.emptyText, { color: C.textSecondary }]}>
                  Henüz mesaj yok. İlk mesajı gönder!
                </Text>
              </View>
            ) : null
          }
        />

        <ChatInput
          onSend={handleSend}
          onSendImage={async (uri: string) => {
            if (!isActive) { showToast('Bu koçluk ilişkisi sona erdi', 'warning'); return; }
            const url = await uploadChatImage(conversationId, user?.id ?? 'unknown', uri);
            if (!url) { showToast('Fotoğraf yüklenemedi', 'error'); return; }
            await sendImageMessage(conversationId, url);
            setTimeout(() => { flatListRef.current?.scrollToEnd({ animated: true }); }, 100);
          }}
          disabled={!isActive}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
    gap: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 22 },
  headerUser: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerName: { ...Typography.label },
  headerStatus: {
    ...Typography.caption,
    color: '#22C55E',
  },
  inactiveBanner: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    padding: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(239,68,68,0.2)',
  },
  inactiveBannerText: {
    ...Typography.caption,
    textAlign: 'center',
  },
  kav: { flex: 1 },
  messageList: {
    paddingVertical: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  timestamp: {
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  timestampText: {
    ...Typography.caption,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  emptyMessages: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: { ...Typography.bodySmall },
});
