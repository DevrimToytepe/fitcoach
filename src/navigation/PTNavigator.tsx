import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMessageStore } from '../store/messageStore';
import { useColors } from '../constants/colors';
import Icon, { IconName } from '../components/common/Icon';
import { Athlete } from '../types';

import DashboardScreen from '../screens/pt/DashboardScreen';
import StudentsScreen from '../screens/pt/StudentsScreen';
import StudentDetailScreen from '../screens/pt/StudentDetailScreen';
import EditProfileScreen from '../screens/pt/EditProfileScreen';
import GalleryManagerScreen from '../screens/pt/GalleryManagerScreen';
import PTProfileScreen from '../screens/pt/PTProfileScreen';
import ConversationsScreen from '../screens/messaging/ConversationsScreen';
import ChatScreen from '../screens/messaging/ChatScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import ProgramBuilderScreen from '../screens/pt/ProgramBuilderScreen';

export type PTTabParamList = {
  DashboardTab: undefined;
  StudentsTab: undefined;
  MessagesTab: undefined;
  ProfileTab: undefined;
};

export type PTStackParamList = {
  PTTabs: undefined;
  EditProfile: undefined;
  GalleryManager: undefined;
  PTProfileView: undefined;
  Students: undefined;
  StudentDetail: { student: Athlete };
  ProgramBuilder: { student: Athlete };
  Chat: { conversationId: string; otherUserId: string; otherUserName: string };
  Notifications: undefined;
};

const Tab = createBottomTabNavigator<PTTabParamList>();
const Stack = createNativeStackNavigator<PTStackParamList>();

const TAB_ICONS: Record<string, IconName> = {
  DashboardTab: 'dashboard',
  StudentsTab: 'users',
  MessagesTab: 'message',
  ProfileTab: 'profile',
};

const TAB_LABELS: Record<string, string> = {
  DashboardTab: 'Dashboard',
  StudentsTab: 'Öğrenciler',
  MessagesTab: 'Mesajlar',
  ProfileTab: 'Profil',
};

function PTTabs() {
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
        tabBarIcon: ({ focused, color }) => (
          <Icon name={TAB_ICONS[route.name] ?? 'dashboard'} size={24} color={color} />
        ),
      })}
    >
      <Tab.Screen name="DashboardTab" component={DashboardScreen} options={{ title: TAB_LABELS.DashboardTab }} />
      <Tab.Screen name="StudentsTab" component={StudentsScreen} options={{ title: TAB_LABELS.StudentsTab }} />
      <Tab.Screen
        name="MessagesTab"
        component={ConversationsScreen}
        options={{
          title: TAB_LABELS.MessagesTab,
          tabBarBadge: totalUnread > 0 ? totalUnread : undefined,
          tabBarBadgeStyle: {
            backgroundColor: C.accent,
            fontSize: 10,
            minWidth: 16,
            height: 16,
          },
        }}
      />
      <Tab.Screen name="ProfileTab" component={PTProfileScreen} options={{ title: TAB_LABELS.ProfileTab }} />
    </Tab.Navigator>
  );
}

export default function PTNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PTTabs" component={PTTabs} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="GalleryManager" component={GalleryManagerScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="PTProfileView" component={PTProfileScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Students" component={StudentsScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="StudentDetail" component={StudentDetailScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="ProgramBuilder" component={ProgramBuilderScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ animation: 'slide_from_right' }} />
    </Stack.Navigator>
  );
}
