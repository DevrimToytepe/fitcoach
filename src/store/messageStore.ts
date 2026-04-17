import { create } from 'zustand';
import { Message, Conversation } from '../types';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';
import { RealtimeChannel } from '@supabase/supabase-js';

interface MessageState {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  activeConversationId: string | null;
  totalUnread: number;
  // Realtime subscription handles
  _channels: Record<string, RealtimeChannel>;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  sendImageMessage: (conversationId: string, imageUrl: string) => Promise<void>;
  sendSystemMessage: (conversationId: string, content: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  getOrCreateConversation: (athleteId: string, ptId: string) => Promise<string>;
  deactivateConversation: (conversationId: string) => Promise<void>;
  getTotalUnread: () => number;
  setActiveConversation: (conversationId: string | null) => void;
  subscribeToConversation: (conversationId: string) => void;
  unsubscribeFromConversation: (conversationId: string) => void;
}

function dbMsgToModel(row: Record<string, unknown>): Message {
  return {
    id: row.id as string,
    conversationId: row.conversation_id as string,
    senderId: row.sender_id as string,
    senderType: row.sender_type as 'athlete' | 'pt' | 'system',
    content: row.content as string,
    imageUrl: (row.image_url as string) || undefined,
    timestamp: new Date(row.created_at as string),
    isRead: row.is_read as boolean,
    type: (row.type ?? 'text') as 'text' | 'system' | 'image',
  };
}

function dbConvToModel(
  row: Record<string, unknown>,
  userType: 'athlete' | 'pt',
): Conversation {
  return {
    id: row.id as string,
    athleteId: row.athlete_id as string,
    ptId: row.pt_id as string,
    athleteName: (row.athlete_name ?? '') as string,
    ptName: (row.pt_name ?? '') as string,
    athleteAvatar: (row.athlete_avatar ?? '') as string,
    ptAvatar: (row.pt_avatar ?? '') as string,
    lastMessage: (row.last_message ?? '') as string,
    lastMessageTime: new Date(row.last_message_time as string),
    unreadCount:
      userType === 'athlete'
        ? ((row.unread_athlete ?? 0) as number)
        : ((row.unread_pt ?? 0) as number),
    isActive: (row.is_active ?? true) as boolean,
  };
}

export const useMessageStore = create<MessageState>((set, get) => ({
  conversations: [],
  messages: {},
  activeConversationId: null,
  totalUnread: 0,
  _channels: {},

  loadConversations: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const field = user.userType === 'athlete' ? 'athlete_id' : 'pt_id';
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq(field, user.id)
      .order('last_message_time', { ascending: false });

    if (error || !data) return;

    const convs = data.map((row) => dbConvToModel(row, user.userType));
    const total = convs.reduce((acc, c) => acc + c.unreadCount, 0);
    set({ conversations: convs, totalUnread: total });
  },

  loadMessages: async (conversationId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error || !data) return;

    const msgs = data.map(dbMsgToModel);
    const { messages } = get();
    set({ messages: { ...messages, [conversationId]: msgs } });
  },

  sendMessage: async (conversationId: string, content: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const { data: inserted, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        sender_type: user.userType,
        content,
        type: 'text',
        is_read: false,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Gönderilen mesajı local state'e ekle (realtime kendi mesajını atladığı için)
    if (inserted) {
      const newMsg = dbMsgToModel(inserted as Record<string, unknown>);
      const { messages } = get();
      const existing = messages[conversationId] ?? [];
      if (!existing.find((m) => m.id === newMsg.id)) {
        set({ messages: { ...messages, [conversationId]: [...existing, newMsg] } });
      }
    }

    // Conversation son mesajını güncelle — mevcut unread sayısını oku, +1 ekle
    const unreadField = user.userType === 'athlete' ? 'unread_pt' : 'unread_athlete';
    const { data: convRow } = await supabase
      .from('conversations')
      .select(unreadField)
      .eq('id', conversationId)
      .single();

    const currentUnread = (convRow as Record<string, number> | null)?.[unreadField] ?? 0;

    await supabase
      .from('conversations')
      .update({
        last_message: content,
        last_message_time: new Date().toISOString(),
        [unreadField]: currentUnread + 1,
      })
      .eq('id', conversationId);

    // Optimistic update
    const { conversations } = get();
    const updatedConvs = conversations.map((c) => {
      if (c.id === conversationId) {
        return { ...c, lastMessage: content, lastMessageTime: new Date() };
      }
      return c;
    });
    set({ conversations: updatedConvs });
  },

  sendImageMessage: async (conversationId: string, imageUrl: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const { data: inserted, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        sender_type: user.userType,
        content: 'Fotoğraf',
        image_url: imageUrl,
        type: 'image',
        is_read: false,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    if (inserted) {
      const newMsg = dbMsgToModel(inserted as Record<string, unknown>);
      const { messages } = get();
      const existing = messages[conversationId] ?? [];
      if (!existing.find((m) => m.id === newMsg.id)) {
        set({ messages: { ...messages, [conversationId]: [...existing, newMsg] } });
      }
    }

    const unreadField = user.userType === 'athlete' ? 'unread_pt' : 'unread_athlete';
    const { data: convRow } = await supabase
      .from('conversations')
      .select(unreadField)
      .eq('id', conversationId)
      .single();

    const currentUnread = (convRow as Record<string, number> | null)?.[unreadField] ?? 0;

    await supabase
      .from('conversations')
      .update({
        last_message: '📷 Fotoğraf',
        last_message_time: new Date().toISOString(),
        [unreadField]: currentUnread + 1,
      })
      .eq('id', conversationId);

    const { conversations } = get();
    const updatedConvs = conversations.map((c) => {
      if (c.id === conversationId) {
        return { ...c, lastMessage: '📷 Fotoğraf', lastMessageTime: new Date() };
      }
      return c;
    });
    set({ conversations: updatedConvs });
  },

  sendSystemMessage: async (conversationId: string, content: string) => {
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: 'system',
      sender_type: 'system',
      content,
      type: 'system',
      is_read: true,
    });

    const { conversations } = get();
    const updatedConvs = conversations.map((c) => {
      if (c.id === conversationId) {
        return { ...c, lastMessage: content, lastMessageTime: new Date() };
      }
      return c;
    });
    set({ conversations: updatedConvs });
  },

  markAsRead: async (conversationId: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const unreadField = user.userType === 'athlete' ? 'unread_athlete' : 'unread_pt';
    await supabase
      .from('conversations')
      .update({ [unreadField]: 0 })
      .eq('id', conversationId);

    const { conversations } = get();
    const updated = conversations.map((c) => {
      if (c.id === conversationId) return { ...c, unreadCount: 0 };
      return c;
    });
    const total = updated.reduce((acc, c) => acc + c.unreadCount, 0);
    set({ conversations: updated, totalUnread: total });
  },

  getOrCreateConversation: async (athleteId: string, ptId: string): Promise<string> => {
    const conversationId = `${athleteId}_${ptId}`;
    const { conversations } = get();

    if (conversations.find((c) => c.id === conversationId)) return conversationId;

    // DB'de var mı kontrol et
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (existing) {
      const user = useAuthStore.getState().user;
      const conv = dbConvToModel(existing, user?.userType ?? 'athlete');
      set({ conversations: [...conversations, conv] });
      return conversationId;
    }

    // Yoksa oluştur – profil bilgilerini çek
    const [{ data: athleteProfile }, { data: ptProfile }] = await Promise.all([
      supabase.from('profiles').select('first_name, last_name, avatar').eq('id', athleteId).single(),
      supabase.from('profiles').select('first_name, last_name, avatar').eq('id', ptId).single(),
    ]);

    const newConv = {
      id: conversationId,
      athlete_id: athleteId,
      pt_id: ptId,
      athlete_name: athleteProfile
        ? `${athleteProfile.first_name} ${athleteProfile.last_name}`
        : 'Sporcu',
      pt_name: ptProfile ? `${ptProfile.first_name} ${ptProfile.last_name}` : 'PT',
      athlete_avatar: athleteProfile?.avatar ?? '',
      pt_avatar: ptProfile?.avatar ?? '',
      last_message: '',
      last_message_time: new Date().toISOString(),
      unread_athlete: 0,
      unread_pt: 0,
      is_active: true,
    };

    await supabase.from('conversations').insert(newConv);

    const user = useAuthStore.getState().user;
    const conv = dbConvToModel(newConv, user?.userType ?? 'athlete');
    set({ conversations: [...conversations, conv] });

    return conversationId;
  },

  deactivateConversation: async (conversationId: string) => {
    await supabase
      .from('conversations')
      .update({ is_active: false })
      .eq('id', conversationId);

    const { conversations } = get();
    const updated = conversations.map((c) => {
      if (c.id === conversationId) return { ...c, isActive: false };
      return c;
    });
    set({ conversations: updated });
  },

  getTotalUnread: () => {
    const { conversations } = get();
    return conversations.reduce((acc, c) => acc + c.unreadCount, 0);
  },

  setActiveConversation: (conversationId: string | null) => {
    set({ activeConversationId: conversationId });
  },

  // ── Realtime ──────────────────────────────────────────────────────────────
  subscribeToConversation: (conversationId: string) => {
    const { _channels } = get();
    if (_channels[conversationId]) return; // zaten subscribe

    const channel = supabase
      .channel(`messages_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const user = useAuthStore.getState().user;
          if (!user) return;

          const newMsg = dbMsgToModel(payload.new as Record<string, unknown>);
          // Kendi gönderdiğimiz mesajı tekrar ekleme
          if (newMsg.senderId === user.id) return;

          const { messages } = get();
          const existing = messages[conversationId] ?? [];
          // Duplicate kontrolü
          if (existing.find((m) => m.id === newMsg.id)) return;
          set({ messages: { ...messages, [conversationId]: [...existing, newMsg] } });

          // Conversation unread güncelle
          const { conversations } = get();
          const updatedConvs = conversations.map((c) => {
            if (c.id === conversationId) {
              return {
                ...c,
                lastMessage: newMsg.content,
                lastMessageTime: newMsg.timestamp,
                unreadCount: c.unreadCount + 1,
              };
            }
            return c;
          });
          const total = updatedConvs.reduce((acc, c) => acc + c.unreadCount, 0);
          set({ conversations: updatedConvs, totalUnread: total });
        },
      )
      .subscribe();

    set({ _channels: { ..._channels, [conversationId]: channel } });
  },

  unsubscribeFromConversation: (conversationId: string) => {
    const { _channels } = get();
    const channel = _channels[conversationId];
    if (channel) {
      supabase.removeChannel(channel);
      const updated = { ..._channels };
      delete updated[conversationId];
      set({ _channels: updated });
    }
  },
}));
