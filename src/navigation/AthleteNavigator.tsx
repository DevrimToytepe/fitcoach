import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMessageStore } from '../store/messageStore';
import { useColors } from '../constants/colors';
import Icon, { IconName } from '../components/common/Icon';

import HomeScreen from '../screens/athlete/HomeScreen';
import ExploreScreen from '../screens/athlete/ExploreScreen';
import PTProfileScreen from '../screens/athlete/PTProfileScreen';
import MyCoachScreen from '../screens/athlete/MyCoachScreen';
import AthleteProfileScreen from '../screens/athlete/AthleteProfileScreen';
import ConversationsScreen from '../screens/messaging/ConversationsScreen';
import ChatScreen from '../screens/messaging/ChatScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';

export type AthleteTabParamList = {
  HomeTab: undefined;
  ExploreTab: undefined;
  MyCoachTab: undefined;
  MessagesTab: undefined;
  ProfileTab: undefined;
};

export type AthleteStackParamList = {
  AthleteTabs: undefined;
  PTProfile: { ptId: string };
  Chat: { conversationId: string; otherUserId: string; otherUserName: string };
  Notifications: undefined;
};

const Tab = createBottomTabNavigator<AthleteTabParamList>();
const Stack = createNativeStackNavigator<AthleteStackParamList>();

const TAB_ICONS: Record<string, IconName> = {
  HomeTab:    'home',
  ExploreTab: 'search',
  MyCoachTab: 'coach',
  MessagesTab:'message',
  ProfileTab: 'profile',
};

const TAB_LABELS: Record<string, string> = {
  HomeTab:    'Ana Sayfa',
  ExploreTab: 'Keşfet',
  MyCoachTab: 'Koçum',
  MessagesTab:'Mesajlar',
  ProfileTab: 'Profil',
};

function AthleteTabs() {
  const totalUnread = useMessageStore((s) => s.totalUnread);
  const C = useColors();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.tabBar,
          borderTopColor: C.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarActiveTintColor: C.tabBarActive,
        tabBarInactiveTintColor: C.tabBarInactive,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ color }) => (
          <Icon name={TAB_ICONS[route.name] ?? 'home'} size={24} color={color} />
        ),
      })}
    >
      <Tab.Screen name="HomeTab"    component={HomeScreen}           options={{ title: TAB_LABELS.HomeTab }} />
      <Tab.Screen name="ExploreTab" component={ExploreScreen}        options={{ title: TAB_LABELS.ExploreTab }} />
      <Tab.Screen name="MyCoachTab" component={MyCoachScreen}        options={{ title: TAB_LABELS.MyCoachTab }} />
      <Tab.Screen
        name="MessagesTab"
        component={ConversationsScreen}
        options={{
          title: TAB_LABELS.MessagesTab,
          tabBarBadge: totalUnread > 0 ? totalUnread : undefined,
          tabBarBadgeStyle: { backgroundColor: C.accent, fontSize: 10, minWidth: 16, height: 16 },
        }}
      />
      <Tab.Screen name="ProfileTab" component={AthleteProfileScreen} options={{ title: TAB_LABELS.ProfileTab }} />
    </Tab.Navigator>
  );
}

export default function AthleteNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AthleteTabs" component={AthleteTabs} />
      <Stack.Screen name="PTProfile"    component={PTProfileScreen}   options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Chat"         component={ChatScreen}        options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Notifications"component={NotificationsScreen}options={{ animation: 'slide_from_right' }} />
    </Stack.Navigator>
  );
}
