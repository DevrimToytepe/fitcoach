import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  SafeAreaView, StatusBar, TouchableOpacity, ListRenderItemInfo,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AthleteStackParamList } from '../../navigation/AthleteNavigator';
import { usePTStore } from '../../store/ptStore';
import PTCard from '../../components/pt/PTCard';
import FilterBar from '../../components/athlete/FilterBar';
import { PTCardSkeleton } from '../../components/common/SkeletonLoader';
import { useColors } from '../../constants/colors';
import { Typography, Spacing } from '../../constants/typography';
import { PT } from '../../types';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

type NavProp = NativeStackNavigationProp<AthleteStackParamList, 'AthleteTabs'>;

export default function ExploreScreen() {
  const navigation = useNavigation<NavProp>();
  const C = useColors();
  const { filteredPTs, isLoading, searchQuery, filters, searchPTs, applyFilters, loadPTs } = usePTStore();
  const inputRef = useRef<TextInput>(null);
  const emptyOpacity = useSharedValue(0);

  useEffect(() => {
    loadPTs();
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  useEffect(() => {
    emptyOpacity.value = withTiming(filteredPTs.length === 0 && !isLoading ? 1 : 0, { duration: 300 });
  }, [filteredPTs.length, isLoading]);

  const emptyStyle = useAnimatedStyle(() => ({ opacity: emptyOpacity.value }));

  const renderItem = ({ item }: ListRenderItemInfo<PT>) => (
    <PTCard pt={item} onPress={() => navigation.navigate('PTProfile', { ptId: item.id })} />
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.background} />

      {/* Search header */}
      <View style={[styles.searchHeader, { backgroundColor: C.card, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={[styles.backText, { color: C.textPrimary }]}>←</Text>
        </TouchableOpacity>
        <View style={[styles.searchBox, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: C.textPrimary }]}
            placeholder="PT adı veya uzmanlık ara..."
            placeholderTextColor={C.textSecondary}
            value={searchQuery}
            onChangeText={searchPTs}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => searchPTs('')}>
              <Text style={[styles.clearIcon, { color: C.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FilterBar filters={filters} onFilterChange={applyFilters} />

      {/* Result count */}
      <View style={[styles.resultRow, { backgroundColor: C.background }]}>
        <Text style={[styles.resultText, { color: C.textSecondary }]}>
          {isLoading ? 'Yükleniyor...' : `${filteredPTs.length} koç bulundu`}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.skeletonList}>
          {[1, 2, 3, 4].map((i) => <PTCardSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={filteredPTs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, index) => ({ length: 120, offset: 120 * index, index })}
          ListEmptyComponent={
            <Animated.View style={[styles.empty, emptyStyle]}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={[styles.emptyTitle, { color: C.textPrimary }]}>Sonuç bulunamadı</Text>
              <Text style={[styles.emptyText, { color: C.textSecondary }]}>
                Farklı bir arama terimi veya filtre deneyin
              </Text>
            </Animated.View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap: 10,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 22 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: Spacing.base,
    height: 44,
    gap: 8,
    borderWidth: 1,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    ...Typography.body,
    height: '100%',
    fontSize: 15,
  },
  clearIcon: {
    fontSize: 14,
    padding: 4,
  },
  resultRow: {
    paddingHorizontal: Spacing.base,
    paddingVertical: 8,
  },
  resultText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  skeletonList: {
    padding: Spacing.base,
    gap: 12,
  },
  list: {
    padding: Spacing.base,
    paddingBottom: 40,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { ...Typography.h3 },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
