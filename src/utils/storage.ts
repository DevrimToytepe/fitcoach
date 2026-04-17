import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message, Conversation, Notification } from '../types';

const KEYS = {
  USER: 'fitcoach_user',
  AUTH_TOKEN: 'fitcoach_auth_token',
  ONBOARDING_DONE: 'fitcoach_onboarding_done',
  REMEMBER_ME: 'fitcoach_remember_me',
  CONVERSATIONS: 'fitcoach_conversations',
  NOTIFICATIONS: 'fitcoach_notifications',
  ATHLETE_NOTES: (athleteId: string) => `fitcoach_notes_${athleteId}`,
  MESSAGES: (conversationId: string) => `messages_${conversationId}`,
  COACHING_REQUESTS: 'fitcoach_coaching_requests',
};

export const StorageKeys = KEYS;

// User
export async function saveUser(user: object): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
}

export async function getUser(): Promise<object | null> {
  const data = await AsyncStorage.getItem(KEYS.USER);
  return data ? JSON.parse(data) : null;
}

export async function removeUser(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.USER);
}

// Auth token
export async function saveAuthToken(token: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.AUTH_TOKEN, token);
}

export async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.AUTH_TOKEN);
}

export async function removeAuthToken(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.AUTH_TOKEN);
}

// Onboarding
export async function setOnboardingDone(): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDING_DONE, 'true');
}

export async function isOnboardingDone(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.ONBOARDING_DONE);
  return val === 'true';
}

// Remember me
export async function saveRememberMe(email: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.REMEMBER_ME, email);
}

export async function getRememberMe(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.REMEMBER_ME);
}

export async function clearRememberMe(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.REMEMBER_ME);
}

// Messages
export async function saveMessages(conversationId: string, messages: Message[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.MESSAGES(conversationId), JSON.stringify(messages));
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const data = await AsyncStorage.getItem(KEYS.MESSAGES(conversationId));
  if (!data) return [];
  const parsed = JSON.parse(data) as Array<Message & { timestamp: string }>;
  return parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }));
}

// Conversations
export async function saveConversations(conversations: Conversation[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.CONVERSATIONS, JSON.stringify(conversations));
}

export async function getConversations(): Promise<Conversation[]> {
  const data = await AsyncStorage.getItem(KEYS.CONVERSATIONS);
  if (!data) return [];
  const parsed = JSON.parse(data) as Array<Conversation & { lastMessageTime: string }>;
  return parsed.map((c) => ({ ...c, lastMessageTime: new Date(c.lastMessageTime) }));
}

// Athlete notes
export async function saveAthleteNotes(athleteId: string, notes: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.ATHLETE_NOTES(athleteId), notes);
}

export async function getAthleteNotes(athleteId: string): Promise<string> {
  const data = await AsyncStorage.getItem(KEYS.ATHLETE_NOTES(athleteId));
  return data ?? '';
}

// Notifications
export async function saveNotifications(notifications: Notification[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifications));
}

export async function getNotifications(): Promise<Notification[]> {
  const data = await AsyncStorage.getItem(KEYS.NOTIFICATIONS);
  if (!data) return [];
  const parsed = JSON.parse(data) as Array<Notification & { createdAt: string }>;
  return parsed.map((n) => ({ ...n, createdAt: new Date(n.createdAt) }));
}

// Coaching requests
export async function saveCoachingRequests(requests: object[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.COACHING_REQUESTS, JSON.stringify(requests));
}

export async function getCoachingRequests(): Promise<object[]> {
  const data = await AsyncStorage.getItem(KEYS.COACHING_REQUESTS);
  return data ? JSON.parse(data) : [];
}

// Clear all
export async function clearAll(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const fitcoachKeys = keys.filter((k) => k.startsWith('fitcoach') || k.startsWith('messages_'));
  await AsyncStorage.multiRemove(fitcoachKeys);
}
