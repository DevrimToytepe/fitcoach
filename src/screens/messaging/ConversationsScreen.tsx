import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, SafeAreaView, StatusBar,
  ListRenderItemInfo,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMessageStore } from '../../store/messageStore';
import { useColors } from '../../constants/colors';
import ConversationCard from '../../components/messaging/ConversationCard';
import { ConversationSkeleton } from '../../components/common/SkeletonLoader';
import { Conversation } from '../../types';
import { Typography, Spacing } from '../../constants/typography';

export default function ConversationsScreen() {
  const navigation = useNavigation();
  const C = useColors();
  const { conversations, loadConversations } = useMessageStore();
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    setIsLoading(true);
    loadConversations().finally(() => setIsLoading(false));
  }, []);

  const renderItem = ({ item }: ListRenderItemInfo<Conversation>) => (
    <ConversationCard
      conversation={item}
      onPress={() =>
        (navigation as any).navigate('Chat', {
          conversationId: item.id,
          otherUserId: item.ptId,
          otherUserName: item.ptName,
        })
      }
    />
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.background }}>
      <StatusBar barStyle="light-content" backgroundColor={C.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.card, borderBottomColor: C.border }]}>
        <Text style={[styles.title, { color: C.textPrimary }]}>Mesajlar</Text>
      </View>

      {isLoading ? (
        <View>
          {[1, 2, 3].map((i) => <ConversationSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          getItemLayout={(_, index) => ({ length: 74, offset: 74 * index, index })}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={[styles.emptyTitle, { color: C.textPrimary }]}>Henüz mesajın yok</Text>
              <Text style={[styles.emptyText, { color: C.textSecondary }]}>
                Bir PT ile koçluk başlattığında mesajlaşabilirsin
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.base,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: { ...Typography.h2 },
  empty: {
    alignItems: 'center',
    paddingTop: 100,
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { ...Typography.h3 },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 24,
  },
});
