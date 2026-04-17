import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AthleteStackParamList } from '../../navigation/AthleteNavigator';
import { useAuthStore } from '../../store/authStore';
import { usePTStore } from '../../store/ptStore';
import { useColors } from '../../constants/colors';
import { Typography, Spacing } from '../../constants/typography';
import { getMotivationQuote, getGoalLabel } from '../../utils/helpers';
import { Athlete } from '../../types';
import PTCard from '../../components/pt/PTCard';
import { SkeletonItem } from '../../components/common/SkeletonLoader';
import Avatar from '../../components/common/Avatar';

type NavProp = NativeStackNavigationProp<AthleteStackParamList, 'AthleteTabs'>;

export default function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const C = useColors();
  const user = useAuthStore((s) => s.user) as Athlete | null;
  const { pts, isLoading, getFeaturedPTs, getRecommendedPTs, loadPTs } = usePTStore();

  useEffect(() => {
    if (pts.length === 0) loadPTs();
  }, []);

  const today = new Date().getDay();
  const quote = getMotivationQuote(today);
  const featured = getFeaturedPTs();
  const recommended = user ? getRecommendedPTs(user.fitnessGoal) : pts.slice(0, 5);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.background }}>
      <StatusBar barStyle="light-content" backgroundColor={C.background} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greeting, { color: C.textPrimary }]}>
              Merhaba, {user?.firstName ?? 'Sporcu'}! 👋
            </Text>
            <Text style={[styles.quote, { color: C.textSecondary }]}>{quote}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.notifBtn, { backgroundColor: C.surface }]}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Text style={styles.notifIcon}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('AthleteTabs', { screen: 'ProfileTab' } as never)}>
              <Avatar uri={user?.avatar} name={`${user?.firstName} ${user?.lastName}`} size="sm" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Arama çubuğu */}
        <TouchableOpacity
          style={[styles.searchBar, { backgroundColor: C.surface, borderColor: C.border }]}
          onPress={() => navigation.navigate('AthleteTabs', { screen: 'ExploreTab' } as never)}
          activeOpacity={0.75}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={[styles.searchPlaceholder, { color: C.textSecondary }]}>
            PT ara (isim veya uzmanlık)...
          </Text>
        </TouchableOpacity>

        {/* Öne Çıkan Koçlar */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>⭐ Öne Çıkan Koçlar</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AthleteTabs', { screen: 'ExploreTab' } as never)}>
              <Text style={[styles.seeAll, { color: C.accent }]}>Tümü →</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={[styles.hSkeleton, { backgroundColor: C.card }]}>
                  <SkeletonItem width={56} height={56} borderRadius={28} />
                  <SkeletonItem width="80%" height={12} style={{ marginTop: 8 }} />
                  <SkeletonItem width="60%" height={12} style={{ marginTop: 4 }} />
                </View>
              ))}
            </ScrollView>
          ) : (
            <FlatList
              data={featured}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <PTCard
                  pt={item}
                  horizontal
                  onPress={() => navigation.navigate('PTProfile', { ptId: item.id })}
                />
              )}
            />
          )}
        </View>

        {/* Sana Özel */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>
              🎯 Sana Özel {user ? `(${getGoalLabel(user.fitnessGoal)})` : ''}
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.skeletonList}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={[styles.cardSkeleton, { backgroundColor: C.card }]}>
                  <SkeletonItem width={52} height={52} borderRadius={26} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <SkeletonItem width="60%" height={14} />
                    <SkeletonItem width="80%" height={12} />
                    <SkeletonItem width="40%" height={12} />
                  </View>
                </View>
              ))}
            </View>
          ) : recommended.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={[styles.emptyText, { color: C.textSecondary }]}>Uygun koç bulunamadı</Text>
            </View>
          ) : (
            recommended.map((pt) => (
              <PTCard
                key={pt.id}
                pt={pt}
                onPress={() => navigation.navigate('PTProfile', { ptId: pt.id })}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Spacing.base, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.base },
  greeting: { ...Typography.h2 },
  quote: { ...Typography.caption, marginTop: 4, maxWidth: 250, lineHeight: 18 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notifBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  notifIcon: { fontSize: 20 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 28,
    paddingHorizontal: Spacing.base, height: 48, gap: 10,
    borderWidth: 1, marginBottom: Spacing.xl,
  },
  searchIcon: { fontSize: 16 },
  searchPlaceholder: { ...Typography.body, flex: 1 },
  section: { marginBottom: Spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { ...Typography.h3 },
  seeAll: { ...Typography.bodySmall, fontWeight: '600' },
  hList: { paddingRight: Spacing.base, gap: 8 },
  hSkeleton: { width: 130, alignItems: 'center', padding: 12, borderRadius: 16, gap: 6 },
  skeletonList: { gap: 12 },
  cardSkeleton: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 16, alignItems: 'center' },
  empty: { alignItems: 'center', padding: Spacing.xl, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyText: { ...Typography.bodySmall },
});
