import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar,
  TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PTStackParamList } from '../../navigation/PTNavigator';
import { useAuthStore } from '../../store/authStore';
import { useDashboardStore } from '../../store/dashboardStore';
import { useMessageStore } from '../../store/messageStore';
import { useColors } from '../../constants/colors';
import { Typography, Spacing, BorderRadius, Shadow } from '../../constants/typography';
import { Athlete, PT } from '../../types';
import { getGoalLabel, getExperienceLabel } from '../../utils/helpers';
import Avatar from '../../components/common/Avatar';
import Icon from '../../components/common/Icon';
import Loading from '../../components/common/Loading';
import { showToast } from '../../components/common/Toast';

type NavProp = NativeStackNavigationProp<PTStackParamList, 'PTTabs'>;

const GOAL_COLORS: Record<string, string> = {
  lose_weight: '#3B82F6',
  gain_muscle: '#E94560',
  stay_fit: '#10B981',
  healthy_life: '#F59E0B',
};

export default function StudentsScreen() {
  const navigation = useNavigation<NavProp>();
  const C = useColors();
  const user = useAuthStore((s) => s.user) as PT | null;
  const { myStudents, isLoading, loadDashboard, removeStudent, loadPrograms, getStudentPrograms } =
    useDashboardStore();
  const { getOrCreateConversation } = useMessageStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadDashboard();
    loadPrograms();
  }, []);

  const filtered = myStudents.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  });

  const handleMessage = async (student: Athlete) => {
    if (!user) return;
    const convId = await getOrCreateConversation(student.id, user.id);
    navigation.navigate('Chat', {
      conversationId: convId,
      otherUserId: student.id,
      otherUserName: `${student.firstName} ${student.lastName}`,
    });
  };

  const handleRemove = (student: Athlete) => {
    Alert.alert(
      'Öğrenciyi Çıkar',
      `${student.firstName} ${student.lastName} adlı öğrenciyi listenden çıkarmak istediğinden emin misin?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkar',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeStudent(student.id);
              showToast('Öğrenci çıkarıldı', 'info');
            } catch {
              showToast('Bir hata oluştu', 'error');
            }
          },
        },
      ],
    );
  };

  if (isLoading) return <Loading fullScreen text="Öğrenciler yükleniyor..." />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.background }}>
      <StatusBar barStyle="light-content" backgroundColor={C.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.card, borderBottomColor: C.border }]}>
        <Text style={[styles.headerTitle, { color: C.textPrimary }]}>Öğrencilerim</Text>
        <View style={[styles.countBadge, { backgroundColor: C.accent }]}>
          <Text style={styles.countText}>{myStudents.length}</Text>
        </View>
      </View>

      {/* Arama */}
      <View style={[styles.searchWrapper, { backgroundColor: C.background }]}>
        <View style={[styles.searchBar, { backgroundColor: C.inputBackground, borderColor: C.border }]}>
          <Icon name="search" size={18} color={C.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: C.textPrimary }]}
            placeholder="Öğrenci ara..."
            placeholderTextColor={C.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Icon name="close" size={16} color={C.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Özet */}
      <View style={[styles.summaryRow, { backgroundColor: C.background }]}>
        <View style={[styles.summaryCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[styles.summaryValue, { color: C.accent }]}>{myStudents.length}</Text>
          <Text style={[styles.summaryLabel, { color: C.textSecondary }]}>Aktif Öğrenci</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[styles.summaryValue, { color: '#3B82F6' }]}>
            {user?.maxStudents ?? 10}
          </Text>
          <Text style={[styles.summaryLabel, { color: C.textSecondary }]}>Kapasite</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[styles.summaryValue, { color: C.success }]}>
            {myStudents.filter((s) => s.experienceLevel === 'beginner').length}
          </Text>
          <Text style={[styles.summaryLabel, { color: C.textSecondary }]}>Başlangıç</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[styles.summaryValue, { color: C.warning }]}>
            {myStudents.filter((s) => s.experienceLevel === 'advanced').length}
          </Text>
          <Text style={[styles.summaryLabel, { color: C.textSecondary }]}>İleri</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: C.card }]}>
              <Icon name="users" size={40} color={C.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: C.textPrimary }]}>
              {search ? 'Öğrenci bulunamadı' : 'Henüz öğrencin yok'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: C.textSecondary }]}>
              {search ? 'Farklı bir arama dene' : 'Dashboard\'dan gelen talepleri kabul et'}
            </Text>
          </View>
        ) : (
          filtered.map((student) => {
            const programCount = getStudentPrograms(student.id).length;
            const goalColor = GOAL_COLORS[student.fitnessGoal] ?? C.accent;
            return (
              <TouchableOpacity
                key={student.id}
                style={[styles.studentCard, { backgroundColor: C.card, borderColor: C.border }]}
                onPress={() => navigation.navigate('StudentDetail', { student })}
                activeOpacity={0.8}
              >
                <View style={styles.cardTop}>
                  <Avatar
                    uri={student.avatar}
                    name={`${student.firstName} ${student.lastName}`}
                    size="md"
                  />
                  <View style={styles.studentInfo}>
                    <Text style={[styles.studentName, { color: C.textPrimary }]}>
                      {student.firstName} {student.lastName}
                    </Text>
                    <Text style={[styles.studentEmail, { color: C.textSecondary }]}>
                      {student.email}
                    </Text>
                    <View style={styles.tagRow}>
                      <View style={[styles.tag, { backgroundColor: goalColor + '22', borderColor: goalColor }]}>
                        <Text style={[styles.tagText, { color: goalColor }]}>
                          {getGoalLabel(student.fitnessGoal)}
                        </Text>
                      </View>
                      <View style={[styles.tag, { backgroundColor: C.surface, borderColor: C.border }]}>
                        <Text style={[styles.tagText, { color: C.textSecondary }]}>
                          {getExperienceLabel(student.experienceLevel)}
                        </Text>
                      </View>
                      {student.age > 0 && (
                        <View style={[styles.tag, { backgroundColor: C.surface, borderColor: C.border }]}>
                          <Text style={[styles.tagText, { color: C.textSecondary }]}>
                            {student.age} yaş
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Icon name="arrow_right" size={18} color={C.textSecondary} />
                </View>

                <View style={[styles.cardDivider, { backgroundColor: C.border }]} />

                <View style={styles.cardBottom}>
                  <View style={styles.programBadge}>
                    <Icon name="package" size={14} color={C.accent} />
                    <Text style={[styles.programCount, { color: C.textSecondary }]}>
                      {programCount} program
                    </Text>
                  </View>
                  <View style={styles.actionBtns}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: C.accent + '18' }]}
                      onPress={() => handleMessage(student)}
                    >
                      <Icon name="message" size={16} color={C.accent} />
                      <Text style={[styles.actionBtnText, { color: C.accent }]}>Mesaj</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: C.error + '18' }]}
                      onPress={() => handleRemove(student)}
                    >
                      <Icon name="close" size={16} color={C.error} />
                      <Text style={[styles.actionBtnText, { color: C.error }]}>Çıkar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 10,
  },
  headerTitle: { ...Typography.h2, flex: 1 },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: { ...Typography.caption, color: '#fff', fontWeight: '700' },
  searchWrapper: { paddingHorizontal: Spacing.base, paddingVertical: 10 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: { flex: 1, ...Typography.body, paddingVertical: 0 },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    gap: 8,
    paddingBottom: 10,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    gap: 2,
  },
  summaryValue: { ...Typography.h3, fontWeight: '800' },
  summaryLabel: { ...Typography.caption, textAlign: 'center', fontSize: 10 },
  list: { padding: Spacing.base, gap: 12, paddingBottom: 40 },
  studentCard: {
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    gap: 12,
  },
  studentInfo: { flex: 1, gap: 4 },
  studentName: { ...Typography.label, fontWeight: '700' },
  studentEmail: { ...Typography.caption },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagText: { fontSize: 10, fontWeight: '600' },
  cardDivider: { height: 1 },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: 10,
  },
  programBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  programCount: { ...Typography.caption, fontWeight: '600' },
  actionBtns: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 5,
  },
  actionBtnText: { ...Typography.caption, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { ...Typography.h3 },
  emptySubtitle: { ...Typography.bodySmall, textAlign: 'center', maxWidth: 260 },
});
