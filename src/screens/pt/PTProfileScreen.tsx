import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar,
  Switch, TouchableOpacity, Alert, Modal, Image, Dimensions, FlatList,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { PTStackParamList } from '../../navigation/PTNavigator';
import { useAuthStore, fetchUserProfile } from '../../store/authStore';
import { useDashboardStore } from '../../store/dashboardStore';
import { useThemeStore } from '../../store/themeStore';
import { useColors } from '../../constants/colors';
import { Typography, Spacing, BorderRadius } from '../../constants/typography';
import { PT } from '../../types';
import { formatDate, formatPrice, getSpecializationLabel } from '../../utils/helpers';
import Avatar from '../../components/common/Avatar';
import GalleryGrid from '../../components/pt/GalleryGrid';
import Icon from '../../components/common/Icon';
import Badge from '../../components/common/Badge';
import { showToast } from '../../components/common/Toast';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - Spacing.base * 2 - 8 * 3) / 4;

const FAQ = [
  { q: 'Talepleri nasıl yönetirim?', a: 'Dashboard ekranındaki "Bekleyen Talepler" bölümünden kabul veya reddet butonlarıyla yönetebilirsiniz.' },
  { q: 'Galeri nasıl güncellenir?', a: 'Profil → Galeri Yönetimi\'nden yeni öğeler ekleyip mevcutları silebilirsiniz.' },
  { q: 'Profil fotoğraflarımı nasıl eklerim?', a: 'Profili Düzenle ekranından kişisel fotoğraf galerin için 8 adede kadar fotoğraf yükleyebilirsin.' },
  { q: 'Öğrenci limitini değiştirebilir miyim?', a: 'Mevcut versiyonda maksimum öğrenci sayısı 10 ile sabitlenmiştir.' },
];

type NavProp = NativeStackNavigationProp<PTStackParamList, 'PTTabs'>;

export default function PTProfileScreen() {
  const navigation = useNavigation<NavProp>();
  const C = useColors();
  const { isDark, toggleTheme } = useThemeStore();
  const { user, logout, updateUser } = useAuthStore();
  const { gallery } = useDashboardStore();
  const pt = user as PT | null;
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [expandBio, setExpandBio] = useState(false);
  const lastFetchRef = React.useRef<number>(0);

  // Ekran odaklandığında profili yenile — ama 30 saniyede bir maksimum
  useFocusEffect(
    useCallback(() => {
      if (!pt?.id) return;
      const now = Date.now();
      if (now - lastFetchRef.current < 30_000) return;
      lastFetchRef.current = now;
      fetchUserProfile(pt.id).then((fresh) => {
        if (fresh) updateUser(fresh as any);
      });
    }, [pt?.id])
  );

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Hesabınızdan çıkış yapmak istediğinizden emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: () => logout() },
    ]);
  };

  if (!pt) return null;

  const profilePhotos = pt.profilePhotos ?? [];
  const bioShort = pt.bio?.length > 150;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.background }}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Hero Header ─────────────────────────────────────────── */}
        <View style={styles.hero}>
          <Image
            source={{ uri: pt.avatar || `https://ui-avatars.com/api/?name=${pt.firstName}+${pt.lastName}&background=E94560&color=fff&size=400`, cache: 'force-cache' } as any}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
            fadeDuration={0}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.15)', 'rgba(10,10,20,0.98)']}
            style={styles.heroGradient}
            locations={[0.2, 1]}
          >
            <View style={styles.heroContent}>
              <Text style={styles.heroName}>{pt.firstName} {pt.lastName}</Text>
              <Text style={styles.heroTitle}>Kişisel Antrenör · {pt.experienceYears} Yıl</Text>
              <View style={styles.heroRating}>
                <Text style={styles.heroStar}>⭐</Text>
                <Text style={styles.heroRatingVal}>{pt.rating.toFixed(1)}</Text>
                <Text style={styles.heroRatingCount}>({pt.reviewCount} değerlendirme)</Text>
              </View>
              <View style={styles.heroSpecs}>
                {pt.specializations.slice(0, 4).map((s) => (
                  <View key={s} style={styles.specChip}>
                    <Text style={styles.specChipText}>{getSpecializationLabel(s)}</Text>
                  </View>
                ))}
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ── Hızlı Aksiyonlar ────────────────────────────────────── */}
        <View style={[styles.actionsBar, { backgroundColor: C.card, borderBottomColor: C.border }]}>
          <ActionButton icon="edit" label="Düzenle" onPress={() => navigation.navigate('EditProfile')} C={C} />
          <ActionButton icon="gallery" label="Galeri" onPress={() => navigation.navigate('GalleryManager')} C={C} />
          <ActionButton icon="users" label="Öğrenciler" onPress={() => navigation.navigate('Students')} C={C} />
          <ActionButton icon="notification" label="Bildirimler" onPress={() => navigation.navigate('Notifications')} C={C} />
        </View>

        <View style={{ padding: Spacing.base, gap: Spacing.xl }}>

          {/* ── Kişisel Fotoğraf Galerisi ───────────────────────── */}
          {profilePhotos.length > 0 && (
            <Section title="Fotoğraflarım" icon="gallery" C={C}>
              <View style={styles.photosGrid}>
                {profilePhotos.filter(Boolean).slice(0, 8).map((uri, i) => (
                  <TouchableOpacity key={i} onPress={() => setSelectedPhoto(uri)}>
                    <Image
                      source={{ uri, cache: 'force-cache' } as any}
                      style={[styles.photoThumb, { width: PHOTO_SIZE, height: PHOTO_SIZE }]}
                      fadeDuration={0}
                    />
                  </TouchableOpacity>
                ))}
                {/* Boş slotlar */}
                {Array.from({ length: Math.max(0, 8 - profilePhotos.filter(Boolean).length) }).map((_, i) => (
                  <TouchableOpacity
                    key={`empty-${i}`}
                    style={[styles.photoEmpty, { width: PHOTO_SIZE, height: PHOTO_SIZE, backgroundColor: C.surface, borderColor: C.border }]}
                    onPress={() => navigation.navigate('EditProfile')}
                  >
                    <Icon name="plus" size={18} color={C.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            </Section>
          )}

          {profilePhotos.length === 0 && (
            <TouchableOpacity
              style={[styles.addPhotosCard, { backgroundColor: C.card, borderColor: C.border }]}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Icon name="gallery" size={28} color={C.accent} />
              <View>
                <Text style={[styles.addPhotosTitle, { color: C.textPrimary }]}>Fotoğraf Ekle</Text>
                <Text style={[styles.addPhotosSub, { color: C.textSecondary }]}>Profil galerini 8 fotoğrafla doldur</Text>
              </View>
              <Icon name="arrow_right" size={18} color={C.textSecondary} />
            </TouchableOpacity>
          )}

          {/* ── Hakkımda ────────────────────────────────────────── */}
          {!!pt.bio && (
            <Section title="Hakkımda" icon="user" C={C}>
              <Text style={[styles.bioText, { color: C.textSecondary }]} numberOfLines={expandBio ? undefined : 4}>
                {pt.bio}
              </Text>
              {bioShort && (
                <TouchableOpacity onPress={() => setExpandBio(!expandBio)}>
                  <Text style={[styles.readMore, { color: C.accent }]}>
                    {expandBio ? 'Daha az göster' : 'Devamını oku'}
                  </Text>
                </TouchableOpacity>
              )}
            </Section>
          )}

          {/* ── Özgeçmiş ────────────────────────────────────────── */}
          {!!pt.background && (
            <Section title="Özgeçmiş" icon="trophy" C={C}>
              <Text style={[styles.bioText, { color: C.textSecondary }]}>{pt.background}</Text>
            </Section>
          )}

          {/* ── Antrenman Felsefem ───────────────────────────────── */}
          {!!pt.philosophy && (
            <Section title="Antrenman Felsefem" icon="star" C={C}>
              <View style={[styles.philosophyBox, { backgroundColor: C.accent + '12', borderLeftColor: C.accent }]}>
                <Text style={[styles.bioText, { color: C.textSecondary, fontStyle: 'italic' }]}>
                  "{pt.philosophy}"
                </Text>
              </View>
            </Section>
          )}

          {/* ── Sertifikalar ────────────────────────────────────── */}
          {!!pt.certificates && (
            <Section title="Sertifikalar & Başarılar" icon="trophy" C={C}>
              <View style={[styles.certBox, { backgroundColor: C.surface, borderColor: C.border }]}>
                <Text style={[styles.certText, { color: C.textSecondary }]}>{pt.certificates}</Text>
              </View>
            </Section>
          )}

          {/* ── Sosyal Medya ────────────────────────────────────── */}
          {(!!pt.instagram || !!pt.youtube) && (
            <Section title="Sosyal Medya" icon="profile" C={C}>
              <View style={styles.socialRow}>
                {!!pt.instagram && (
                  <View style={[styles.socialChip, { backgroundColor: '#E1306C18', borderColor: '#E1306C40' }]}>
                    <Text style={{ fontSize: 14 }}>📸</Text>
                    <Text style={[styles.socialText, { color: '#E1306C' }]}>@{pt.instagram}</Text>
                  </View>
                )}
                {!!pt.youtube && (
                  <View style={[styles.socialChip, { backgroundColor: '#FF000018', borderColor: '#FF000040' }]}>
                    <Text style={{ fontSize: 14 }}>▶️</Text>
                    <Text style={[styles.socialText, { color: '#FF0000' }]}>{pt.youtube}</Text>
                  </View>
                )}
              </View>
            </Section>
          )}

          {/* ── Koçluk Paketleri ────────────────────────────────── */}
          {pt.packages && pt.packages.length > 0 && (
            <Section title="Koçluk Paketleri" icon="package" C={C}>
              {pt.packages.map((pkg) => (
                <View key={pkg.id} style={[styles.pkgCard, { backgroundColor: C.surface, borderColor: C.border }]}>
                  {pkg.isPopular && (
                    <View style={[styles.popularBadge, { backgroundColor: C.accent }]}>
                      <Text style={styles.popularBadgeText}>Popüler</Text>
                    </View>
                  )}
                  <View style={styles.pkgRow}>
                    <View>
                      <Text style={[styles.pkgName, { color: C.textPrimary }]}>{pkg.name}</Text>
                      <Text style={[styles.pkgMeta, { color: C.textSecondary }]}>
                        {pkg.durationWeeks} hf · Haftada {pkg.sessionsPerWeek} seans
                      </Text>
                    </View>
                    <Text style={[styles.pkgPrice, { color: C.accent }]}>{formatPrice(pkg.price)}</Text>
                  </View>
                </View>
              ))}
            </Section>
          )}

          {/* ── Başarı Galerisi ──────────────────────────────────── */}
          {gallery.length > 0 && (
            <Section title={`Başarı Galerisi (${gallery.length})`} icon="gallery" C={C}>
              <GalleryGrid items={gallery} />
            </Section>
          )}

          {/* ── Değerlendirmeler ─────────────────────────────────── */}
          {pt.reviews.length > 0 && (
            <Section title={`Değerlendirmeler (${pt.reviewCount})`} icon="star" C={C}>
              {pt.reviews.slice(0, 5).map((r) => (
                <View key={r.id} style={[styles.reviewCard, { backgroundColor: C.surface, borderColor: C.border }]}>
                  <View style={styles.reviewHeader}>
                    <Avatar uri={r.athleteAvatar} name={r.athleteName} size="sm" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.reviewName, { color: C.textPrimary }]}>{r.athleteName}</Text>
                      <Text style={[styles.reviewDate, { color: C.textSecondary }]}>{formatDate(r.createdAt)}</Text>
                    </View>
                    <View style={styles.stars}>
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Text key={i} style={{ fontSize: 12 }}>⭐</Text>
                      ))}
                    </View>
                  </View>
                  <Text style={[styles.reviewComment, { color: C.textSecondary }]}>{r.comment}</Text>
                </View>
              ))}
            </Section>
          )}

          {/* ── Ayarlar ─────────────────────────────────────────── */}
          <Section title="Ayarlar" icon="settings" C={C}>
            <View style={[styles.settingsCard, { backgroundColor: C.surface, borderColor: C.border }]}>
              <SettingRow
                icon="notification"
                label="Bildirimler"
                right={<Switch value={notifEnabled} onValueChange={setNotifEnabled} trackColor={{ false: C.border, true: C.accent }} thumbColor="#fff" />}
                C={C}
              />
              <View style={[styles.divider, { backgroundColor: C.border }]} />
              <SettingRow
                icon="dark_mode"
                label="Karanlık Mod"
                right={<Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: C.border, true: '#6366F1' }} thumbColor="#fff" />}
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
          </Section>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Icon name="close" size={18} color={C.error} />
            <Text style={[styles.logoutText, { color: C.error }]}>Çıkış Yap</Text>
          </TouchableOpacity>

          <Text style={[styles.version, { color: C.textSecondary }]}>FitCoach v1.0.0</Text>
        </View>
      </ScrollView>

      {/* ── Fotoğraf Lightbox ───────────────────────────────────── */}
      <Modal visible={!!selectedPhoto} transparent animationType="fade">
        <TouchableOpacity
          style={styles.lightboxOverlay}
          activeOpacity={1}
          onPress={() => setSelectedPhoto(null)}
        >
          {selectedPhoto && (
            <Image source={{ uri: selectedPhoto }} style={styles.lightboxImage} resizeMode="contain" />
          )}
        </TouchableOpacity>
      </Modal>

      {/* ── SSS Modal ───────────────────────────────────────────── */}
      <Modal visible={showHelp} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.helpModal, { backgroundColor: C.card }]}>
            <View style={styles.helpHeader}>
              <Text style={[styles.helpTitle, { color: C.textPrimary }]}>Sık Sorulan Sorular</Text>
              <TouchableOpacity onPress={() => setShowHelp(false)}>
                <Icon name="close" size={20} color={C.textSecondary} />
              </TouchableOpacity>
            </View>
            {FAQ.map((item, i) => (
              <View key={i} style={[styles.faqItem, { borderBottomColor: C.border }]}>
                <Text style={[styles.faqQ, { color: C.textPrimary }]}>{item.q}</Text>
                <Text style={[styles.faqA, { color: C.textSecondary }]}>{item.a}</Text>
              </View>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Section({ title, icon, C, children }: { title: string; icon: string; C: any; children: React.ReactNode }) {
  return (
    <View style={{ gap: 12 }}>
      <View style={sectionStyles.titleRow}>
        <Icon name={icon as any} size={18} color={C.accent} />
        <Text style={[sectionStyles.title, { color: C.textPrimary }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}
const sectionStyles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { ...Typography.h3 },
});

function ActionButton({ icon, label, onPress, C }: { icon: string; label: string; onPress: () => void; C: any }) {
  return (
    <TouchableOpacity style={[abStyles.btn, { backgroundColor: C.surface }]} onPress={onPress}>
      <Icon name={icon as any} size={20} color={C.accent} />
      <Text style={[abStyles.label, { color: C.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
}
const abStyles = StyleSheet.create({
  btn: { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 4, borderRadius: 12 },
  label: { fontSize: 10, fontWeight: '600' },
});

function SettingRow({ icon, label, right, onPress, C }: { icon: string; label: string; right: React.ReactNode; onPress?: () => void; C: any }) {
  const content = (
    <View style={srStyles.row}>
      <Icon name={icon as any} size={18} color={C.textSecondary} />
      <Text style={[srStyles.label, { color: C.textPrimary }]}>{label}</Text>
      <View style={{ marginLeft: 'auto' }}>{right}</View>
    </View>
  );
  if (onPress) return <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity>;
  return content;
}
const srStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  label: { ...Typography.body },
});

const styles = StyleSheet.create({
  hero: { height: 360, overflow: 'hidden' },
  heroGradient: { flex: 1, justifyContent: 'flex-end' },
  heroContent: { padding: Spacing.base, gap: 8, paddingBottom: 24 },
  heroName: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  heroTitle: { ...Typography.bodySmall, color: 'rgba(255,255,255,0.75)' },
  heroRating: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroStar: { fontSize: 14 },
  heroRatingVal: { ...Typography.label, color: '#fff', fontWeight: '700' },
  heroRatingCount: { ...Typography.caption, color: 'rgba(255,255,255,0.65)' },
  heroSpecs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  specChip: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  specChipText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  actionsBar: {
    flexDirection: 'row',
    padding: 10,
    gap: 8,
    borderBottomWidth: 1,
  },
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  photoThumb: { borderRadius: 10, backgroundColor: '#333' },
  photoEmpty: {
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotosCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: Spacing.base,
    gap: 12,
  },
  addPhotosTitle: { ...Typography.label },
  addPhotosSub: { ...Typography.caption },
  bioText: { ...Typography.body, lineHeight: 26 },
  readMore: { ...Typography.bodySmall, fontWeight: '700', marginTop: 4 },
  philosophyBox: { borderLeftWidth: 3, paddingLeft: 14, paddingVertical: 8 },
  certBox: { borderRadius: 12, padding: Spacing.base, borderWidth: 1 },
  certText: { ...Typography.bodySmall, lineHeight: 22 },
  socialRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  socialChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  socialText: { ...Typography.bodySmall, fontWeight: '700' },
  pkgCard: { borderRadius: 12, borderWidth: 1, padding: Spacing.base, overflow: 'hidden' },
  popularBadge: { position: 'absolute', top: 0, right: 0, paddingHorizontal: 10, paddingVertical: 3, borderBottomLeftRadius: 10 },
  popularBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  pkgRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  pkgName: { ...Typography.label, fontWeight: '700' },
  pkgMeta: { ...Typography.caption, marginTop: 2 },
  pkgPrice: { ...Typography.h3, fontWeight: '800' },
  reviewCard: { borderRadius: 12, borderWidth: 1, padding: Spacing.base, gap: 10 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewName: { ...Typography.label },
  reviewDate: { ...Typography.caption },
  stars: { flexDirection: 'row', gap: 1 },
  reviewComment: { ...Typography.bodySmall, fontStyle: 'italic', lineHeight: 20 },
  settingsCard: { borderRadius: BorderRadius.card, borderWidth: 1, paddingHorizontal: Spacing.base },
  divider: { height: 1, marginLeft: 30 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#EF444430',
    backgroundColor: '#EF444410',
  },
  logoutText: { ...Typography.label, fontWeight: '700' },
  version: { ...Typography.caption, textAlign: 'center' },
  lightboxOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center' },
  lightboxImage: { width: '100%', height: '80%' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  helpModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.base, paddingBottom: 48, gap: 4 },
  helpHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  helpTitle: { ...Typography.h3 },
  faqItem: { paddingVertical: 12, gap: 4, borderBottomWidth: 1 },
  faqQ: { ...Typography.label },
  faqA: { ...Typography.bodySmall, lineHeight: 20 },
});
