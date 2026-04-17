import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar,
  Switch, TouchableOpacity, Modal, Alert, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useColors } from '../../constants/colors';
import { uploadAvatar } from '../../utils/upload';
import { Typography, Spacing, BorderRadius } from '../../constants/typography';
import { Athlete } from '../../types';
import { getGoalLabel, getExperienceLabel, formatDate } from '../../utils/helpers';
import Icon from '../../components/common/Icon';
import { showToast } from '../../components/common/Toast';

const FAQ = [
  { q: 'PT ile nasıl iletişime geçerim?', a: 'Koçluk talebiniz kabul edildikten sonra Mesajlar sekmesinden PT\'nizle iletişime geçebilirsiniz.' },
  { q: 'Koçluğu nasıl iptal ederim?', a: 'Koçum ekranından "Koçluğu Bırak" butonuna tıklayarak koçluk ilişkinizi sonlandırabilirsiniz.' },
  { q: 'Aynı anda birden fazla PT alabilir miyim?', a: 'Hayır, aynı anda yalnızca bir aktif PT\'niz olabilir.' },
  { q: 'Ödeme nasıl yapılır?', a: 'Ödemeler doğrudan PT ile anlaşarak gerçekleştirilir. Uygulama aracılık yapmamaktadır.' },
];

const GOAL_COLORS: Record<string, string> = {
  lose_weight: '#3B82F6',
  gain_muscle: '#E94560',
  stay_fit:    '#10B981',
  healthy_life:'#F59E0B',
};

export default function AthleteProfileScreen() {
  const { user, logout, updateUser, updateSupabaseProfile } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const C = useColors();
  const athlete = user as Athlete | null;
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Hesabınızdan çıkış yapmak istediğinizden emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: async () => { await logout(); } },
    ]);
  };

  const handlePickAvatar = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (res.canceled || !athlete) return;

    setIsUploadingAvatar(true);
    try {
      const uri = res.assets[0].uri;
      const url = await uploadAvatar(athlete.id, uri);
      if (url) {
        await updateSupabaseProfile({ avatar: url });
        updateUser({ avatar: url });
        showToast('Profil fotoğrafı güncellendi!', 'success');
      } else {
        showToast('Yükleme başarısız', 'error');
      }
    } catch {
      showToast('Bir hata oluştu', 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const goalColor = GOAL_COLORS[athlete?.fitnessGoal ?? ''] ?? C.accent;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.background }}>
      <StatusBar barStyle="light-content" backgroundColor={C.background} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Profil kartı */}
        <View style={[styles.profileCard, { backgroundColor: C.card, borderColor: C.border }]}>
          {/* Avatar */}
          <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickAvatar} disabled={isUploadingAvatar}>
            {athlete?.avatar ? (
              <Image source={{ uri: athlete.avatar }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: C.accent }]}>
                <Text style={styles.avatarInitials}>
                  {athlete?.firstName?.[0]}{athlete?.lastName?.[0]}
                </Text>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Icon name="camera" size={13} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={[styles.name, { color: C.textPrimary }]}>
            {athlete?.firstName} {athlete?.lastName}
          </Text>
          <Text style={[styles.email, { color: C.textSecondary }]}>{athlete?.email}</Text>

          {/* Bilgi etiketleri */}
          <View style={styles.badges}>
            {athlete?.fitnessGoal && (
              <View style={[styles.badge, { backgroundColor: goalColor + '18', borderColor: goalColor + '40' }]}>
                <Text style={[styles.badgeText, { color: goalColor }]}>
                  🎯 {getGoalLabel(athlete.fitnessGoal)}
                </Text>
              </View>
            )}
            {athlete?.experienceLevel && (
              <View style={[styles.badge, { backgroundColor: C.surface, borderColor: C.border }]}>
                <Text style={[styles.badgeText, { color: C.textSecondary }]}>
                  📊 {getExperienceLabel(athlete.experienceLevel)}
                </Text>
              </View>
            )}
            {(athlete?.age ?? 0) > 0 && (
              <View style={[styles.badge, { backgroundColor: C.surface, borderColor: C.border }]}>
                <Text style={[styles.badgeText, { color: C.textSecondary }]}>🎂 {athlete?.age} yaş</Text>
              </View>
            )}
          </View>

          <Text style={[styles.since, { color: C.textSecondary }]}>
            Üyelik: {athlete?.createdAt ? formatDate(athlete.createdAt) : '-'}
          </Text>

          {isUploadingAvatar && (
            <Text style={[styles.uploading, { color: C.accent }]}>Yükleniyor...</Text>
          )}
        </View>

        {/* Ayarlar */}
        <View style={[styles.settingsCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[styles.settingsTitle, { color: C.textPrimary }]}>Ayarlar</Text>

          <SettingRow
            icon="notification"
            label="Bildirimler"
            right={
              <Switch
                value={notifEnabled}
                onValueChange={setNotifEnabled}
                trackColor={{ false: C.border, true: C.accent }}
                thumbColor="#fff"
              />
            }
            C={C}
          />
          <View style={[styles.divider, { backgroundColor: C.border }]} />
          <SettingRow
            icon="dark_mode"
            label="Karanlık Mod"
            right={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: C.border, true: '#6366F1' }}
                thumbColor="#fff"
              />
            }
            C={C}
          />
          <View style={[styles.divider, { backgroundColor: C.border }]} />
          <SettingRow
            icon="help"
            label="Yardım & SSS"
            right={<Icon name="arrow_right" size={18} color={C.textSecondary} />}
            onPress={() => setShowHelp(true)}
            C={C}
          />
        </View>

        {/* Çıkış */}
        <TouchableOpacity style={[styles.logoutBtn, { borderColor: C.error + '40', backgroundColor: C.error + '10' }]} onPress={handleLogout}>
          <Icon name="close" size={18} color={C.error} />
          <Text style={[styles.logoutText, { color: C.error }]}>Çıkış Yap</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: C.textSecondary }]}>FitCoach v1.0.0</Text>
      </ScrollView>

      {/* SSS Modal */}
      <Modal visible={showHelp} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: C.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.textPrimary }]}>Sık Sorulan Sorular</Text>
              <TouchableOpacity onPress={() => setShowHelp(false)}>
                <Icon name="close" size={20} color={C.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {FAQ.map((item, i) => (
                <View key={i} style={[styles.faqItem, { borderBottomColor: C.border }]}>
                  <Text style={[styles.faqQ, { color: C.textPrimary }]}>{item.q}</Text>
                  <Text style={[styles.faqA, { color: C.textSecondary }]}>{item.a}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SettingRow({ icon, label, right, onPress, C }: {
  icon: string; label: string; right: React.ReactNode; onPress?: () => void; C: any;
}) {
  const inner = (
    <View style={styles.settingRow}>
      <Icon name={icon as any} size={18} color={C.textSecondary} />
      <Text style={[styles.settingLabel, { color: C.textPrimary }]}>{label}</Text>
      <View style={{ marginLeft: 'auto' }}>{right}</View>
    </View>
  );
  if (onPress) return <TouchableOpacity onPress={onPress}>{inner}</TouchableOpacity>;
  return inner;
}

const styles = StyleSheet.create({
  scroll: { padding: Spacing.base, paddingBottom: 48, gap: Spacing.xl },
  profileCard: {
    borderRadius: BorderRadius.card,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
  },
  avatarWrapper: { position: 'relative', marginBottom: 4 },
  avatarImg: { width: 90, height: 90, borderRadius: 45 },
  avatarFallback: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 32, fontWeight: '800', color: '#fff' },
  avatarEditBadge: {
    position: 'absolute', bottom: 2, right: 2,
    backgroundColor: '#E94560', borderRadius: 10,
    padding: 4, borderWidth: 2, borderColor: 'transparent',
  },
  name:     { ...Typography.h2 },
  email:    { ...Typography.bodySmall },
  badges:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 4 },
  badge:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1 },
  badgeText:{ ...Typography.caption, fontWeight: '600' },
  since:    { ...Typography.caption },
  uploading:{ ...Typography.caption, fontWeight: '600' },
  settingsCard: { borderRadius: BorderRadius.card, padding: Spacing.base, gap: 0, borderWidth: 1 },
  settingsTitle:{ ...Typography.h3, marginBottom: 8 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  settingLabel: { ...Typography.body },
  divider: { height: 1, marginLeft: 30 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 16, borderRadius: BorderRadius.card, borderWidth: 1,
  },
  logoutText: { ...Typography.label, fontWeight: '700' },
  version: { ...Typography.caption, textAlign: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.base, maxHeight: '75%', paddingBottom: 48 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.base },
  modalTitle: { ...Typography.h3 },
  faqItem: { paddingVertical: Spacing.sm, gap: 4, borderBottomWidth: 1 },
  faqQ: { ...Typography.label },
  faqA: { ...Typography.bodySmall, lineHeight: 22 },
});
