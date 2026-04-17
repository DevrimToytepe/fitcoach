import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, TouchableOpacity,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PTStackParamList } from '../../navigation/PTNavigator';
import { useAuthStore } from '../../store/authStore';
import { useDashboardStore } from '../../store/dashboardStore';
import { useMessageStore } from '../../store/messageStore';
import { useColors } from '../../constants/colors';
import { Typography, Spacing, BorderRadius } from '../../constants/typography';
import { PT } from '../../types';
import { formatPrice } from '../../utils/helpers';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import Icon from '../../components/common/Icon';
import { showToast } from '../../components/common/Toast';
import Loading from '../../components/common/Loading';

type NavProp = NativeStackNavigationProp<PTStackParamList, 'PTTabs'>;

export default function DashboardScreen() {
  const navigation = useNavigation<NavProp>();
  const C = useColors();
  const user = useAuthStore((s) => s.user) as PT | null;
  const { myStudents, pendingRequests, gallery, isLoading, loadDashboard, acceptRequest, rejectRequest } =
    useDashboardStore();
  const { getOrCreateConversation, loadConversations } = useMessageStore();

  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  useEffect(() => {
    loadDashboard();
    loadConversations();
    // Okunmamış bildirim sayısını çek
    if (user?.id) {
      supabase.from('notifications').select('id', { count: 'exact', head: true })
        .eq('user_id', user.id).eq('is_read', false)
        .then(({ count }) => setUnreadNotifCount(count ?? 0));
    }
  }, []);

  const acceptingRef = useRef<Set<string>>(new Set());

  const handleAccept = async (requestId: string) => {
    if (acceptingRef.current.has(requestId)) return; // çift tıklamayı önle
    acceptingRef.current.add(requestId);
    try {
      await acceptRequest(requestId);
      showToast('Talep kabul edildi! Konuşma başlatıldı.', 'success');
      await loadConversations();
    } catch {
      showToast('Bir hata oluştu', 'error');
    } finally {
      acceptingRef.current.delete(requestId);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await rejectRequest(requestId);
      showToast('Talep reddedildi', 'info');
    } catch {
      showToast('Bir hata oluştu', 'error');
    }
  };

  if (isLoading) return <Loading fullScreen text="Dashboard yükleniyor..." />;

  const studentCount = myStudents.length;
  const maxStudents = user?.maxStudents ?? 10;
  const capacityPct = (studentCount / maxStudents) * 100;
  const capacityColor =
    capacityPct >= 100 ? C.error : capacityPct >= 70 ? C.warning : C.success;
  const minPackagePrice =
    user?.packages && user.packages.length > 0
      ? Math.min(...user.packages.map((p) => p.price))
      : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.background }}>
      <StatusBar barStyle="light-content" backgroundColor={C.background} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Profil özeti */}
        <View style={[styles.profileCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={styles.profileRow}>
            <Avatar uri={user?.avatar} name={`${user?.firstName} ${user?.lastName}`} size="lg" />
            <View style={styles.profileText}>
              <Text style={[styles.name, { color: C.textPrimary }]}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={[styles.subtitle, { color: C.textSecondary }]}>Kişisel Antrenör</Text>
              {minPackagePrice != null && (
                <Text style={[styles.rate, { color: C.accent }]}>
                  {formatPrice(minPackagePrice)}'den başlayan
                </Text>
              )}
            </View>
          </View>
          <Button
            title="Profili Düzenle"
            onPress={() => navigation.navigate('EditProfile')}
            variant="outline"
            size="sm"
          />
        </View>

        {/* İstatistik kartları */}
        <View style={styles.statsGrid}>
          <StatCard icon="users" value={`${studentCount}/${maxStudents}`} label="Aktif Öğrenci" accent C={C} />
          <StatCard icon="star" value={user?.rating?.toFixed(1) ?? '—'} label="Ortalama Puan" iconColor={C.warning} C={C} />
          <StatCard icon="notification" value={String(pendingRequests.length)} label="Bekleyen Talep" C={C} badge={unreadNotifCount} />
          <StatCard icon="gallery" value={String(gallery.length)} label="Galeri Öğesi" C={C} />
        </View>

        {/* Kontenjan çubuğu */}
        <View style={[styles.capacityCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={styles.capacityHeader}>
            <Text style={[styles.capacityLabel, { color: C.textPrimary }]}>Kontenjan Doluluk</Text>
            <Text style={[styles.capacityCount, { color: capacityColor }]}>
              {studentCount}/{maxStudents}
            </Text>
          </View>
          <View style={[styles.progressBg, { backgroundColor: C.border }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(capacityPct, 100)}%`, backgroundColor: capacityColor },
              ]}
            />
          </View>
        </View>

        {/* Hızlı aksiyonlar */}
        <View style={styles.quickRow}>
          <QuickBtn icon="users" label="Öğrencilerim" onPress={() => navigation.navigate('Students')} C={C} />
          <QuickBtn icon="gallery" label="Galeri" onPress={() => navigation.navigate('GalleryManager')} C={C} />
          <QuickBtn icon="notification" label="Bildirimler" onPress={() => navigation.navigate('Notifications')} C={C} />
        </View>

        {/* Bekleyen talepler */}
        {pendingRequests.length > 0 && (
          <View style={styles.section}>
            <SectionHeader icon="notification" title={`Bekleyen Talepler (${pendingRequests.length})`} C={C} />
            {pendingRequests.map((req) => (
              <View key={req.id} style={[styles.requestCard, { backgroundColor: C.card, borderColor: C.border }]}>
                <View style={styles.requestTop}>
                  <Avatar uri={req.athleteAvatar} name={req.athleteName} size="md" />
                  <View style={styles.requestInfo}>
                    <Text style={[styles.requestName, { color: C.textPrimary }]}>{req.athleteName}</Text>
                    {req.packageName && (
                      <View style={styles.requestPkgRow}>
                        <Icon name="package" size={12} color={C.accent} />
                        <Text style={[styles.requestPkg, { color: C.accent }]}>{req.packageName} Paketi</Text>
                      </View>
                    )}
                    <Text style={[styles.requestDate, { color: C.textSecondary }]}>
                      {new Date(req.createdAt).toLocaleDateString('tr-TR')}
                    </Text>
                  </View>
                </View>
                <View style={styles.requestBtns}>
                  <Button title="Kabul Et" onPress={() => handleAccept(req.id)} variant="primary" size="sm" style={{ flex: 1 }} />
                  <Button title="Reddet"   onPress={() => handleReject(req.id)}  variant="danger"  size="sm" style={{ flex: 1 }} />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Son öğrenciler */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <SectionHeader icon="users" title="Son Öğrenciler" C={C} />
            {myStudents.length > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate('Students')}>
                <Text style={[styles.seeAll, { color: C.accent }]}>Tümü →</Text>
              </TouchableOpacity>
            )}
          </View>
          {myStudents.length === 0 ? (
            <View style={[styles.emptyStudents, { backgroundColor: C.card, borderColor: C.border }]}>
              <Icon name="users" size={32} color={C.textSecondary} />
              <Text style={[styles.emptyStudentsText, { color: C.textSecondary }]}>
                Henüz aktif öğrencin yok
              </Text>
            </View>
          ) : (
            myStudents.slice(0, 3).map((s, i) => (
              <TouchableOpacity
                key={s.id ? `${s.id}-${i}` : i}
                style={[styles.studentRow, { backgroundColor: C.card, borderColor: C.border }]}
                onPress={() => navigation.navigate('StudentDetail', { student: s })}
              >
                <Avatar uri={s.avatar} name={`${s.firstName} ${s.lastName}`} size="sm" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.studentName, { color: C.textPrimary }]}>
                    {s.firstName} {s.lastName}
                  </Text>
                  <Text style={[styles.studentEmail, { color: C.textSecondary }]}>{s.email}</Text>
                </View>
                <Icon name="arrow_right" size={16} color={C.textSecondary} />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, value, label, accent, iconColor, badge, C }: {
  icon: string; value: string; label: string; accent?: boolean; iconColor?: string; badge?: number; C: any;
}) {
  return (
    <View style={[
      scStyles.card,
      { backgroundColor: accent ? C.accent : C.card, borderColor: C.border },
    ]}>
      <View style={{ position: 'relative' }}>
        <Icon name={icon as any} size={22} color={iconColor ?? (accent ? '#fff' : C.accent)} />
        {badge != null && badge > 0 && (
          <View style={scStyles.badge}>
            <Text style={scStyles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[scStyles.value, { color: accent ? '#fff' : C.textPrimary }]}>{value}</Text>
      <Text style={[scStyles.label, { color: accent ? 'rgba(255,255,255,0.8)' : C.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}
const scStyles = StyleSheet.create({
  card: { width: '47%', borderRadius: BorderRadius.card, padding: Spacing.base, alignItems: 'center', gap: 4, borderWidth: 1 },
  value: { ...Typography.h2 },
  label: { ...Typography.caption, textAlign: 'center' },
  badge: {
    position: 'absolute', top: -6, right: -8,
    backgroundColor: '#EF4444', borderRadius: 8,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  badgeText: { fontSize: 9, color: '#fff', fontWeight: '700' },
});

function QuickBtn({ icon, label, onPress, C }: { icon: string; label: string; onPress: () => void; C: any }) {
  return (
    <TouchableOpacity style={[qbStyles.btn, { backgroundColor: C.card, borderColor: C.border }]} onPress={onPress}>
      <Icon name={icon as any} size={22} color={C.accent} />
      <Text style={[qbStyles.label, { color: C.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
}
const qbStyles = StyleSheet.create({
  btn: { flex: 1, borderRadius: BorderRadius.card, padding: 12, alignItems: 'center', gap: 5, borderWidth: 1 },
  label: { ...Typography.caption, fontWeight: '600', textAlign: 'center' },
});

function SectionHeader({ icon, title, C }: { icon: string; title: string; C: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
      <Icon name={icon as any} size={18} color={C.accent} />
      <Text style={[shStyles.title, { color: C.textPrimary }]}>{title}</Text>
    </View>
  );
}
const shStyles = StyleSheet.create({ title: { ...Typography.h3 } });

const styles = StyleSheet.create({
  scroll: { padding: Spacing.base, paddingBottom: 48, gap: Spacing.xl },
  profileCard: { borderRadius: BorderRadius.card, padding: Spacing.base, gap: Spacing.sm, borderWidth: 1 },
  profileRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  profileText: { flex: 1, gap: 3 },
  name:     { ...Typography.h3 },
  subtitle: { ...Typography.bodySmall },
  rate:     { ...Typography.bodySmall, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  capacityCard: { borderRadius: BorderRadius.card, padding: Spacing.base, gap: 10, borderWidth: 1 },
  capacityHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  capacityLabel: { ...Typography.label },
  capacityCount: { ...Typography.label, fontWeight: '700' },
  progressBg:   { height: 10, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  quickRow: { flexDirection: 'row', gap: Spacing.sm },
  section: { gap: Spacing.sm },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  seeAll: { ...Typography.bodySmall, fontWeight: '700' },
  requestCard: { borderRadius: BorderRadius.card, padding: Spacing.base, gap: 12, borderWidth: 1 },
  requestTop:  { flexDirection: 'row', gap: 12, alignItems: 'center' },
  requestInfo: { flex: 1, gap: 2 },
  requestName: { ...Typography.label, fontWeight: '700' },
  requestPkgRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  requestPkg:  { ...Typography.caption, fontWeight: '600' },
  requestDate: { ...Typography.caption },
  requestBtns: { flexDirection: 'row', gap: 10 },
  emptyStudents: { borderRadius: BorderRadius.card, padding: 24, alignItems: 'center', gap: 8, borderWidth: 1, borderStyle: 'dashed' },
  emptyStudentsText: { ...Typography.bodySmall },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, padding: 12, borderWidth: 1 },
  studentName: { ...Typography.label },
  studentEmail: { ...Typography.caption },
});
