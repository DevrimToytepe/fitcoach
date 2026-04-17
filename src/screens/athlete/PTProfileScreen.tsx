import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar,
  Modal, TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AthleteStackParamList } from '../../navigation/AthleteNavigator';
import { useAuthStore } from '../../store/authStore';
import { usePTStore } from '../../store/ptStore';
import { useMessageStore } from '../../store/messageStore';
import PTProfileHeader from '../../components/pt/PTProfileHeader';
import GalleryGrid from '../../components/pt/GalleryGrid';
import BookingCard from '../../components/athlete/BookingCard';
import Avatar from '../../components/common/Avatar';
import Icon from '../../components/common/Icon';
import { showToast } from '../../components/common/Toast';
import { useColors } from '../../constants/colors';
import { Typography, Spacing, BorderRadius } from '../../constants/typography';
import { Athlete, PT, CoachingPackage } from '../../types';
import { formatDate, formatPrice } from '../../utils/helpers';
import { generateConversationId } from '../../utils/helpers';

type NavProp = NativeStackNavigationProp<AthleteStackParamList, 'PTProfile'>;
type RoutePropType = RouteProp<AthleteStackParamList, 'PTProfile'>;

const PACKAGE_COLORS = {
  starter: { bg: '#F0F9FF', border: '#BAE6FD', badge: '#0EA5E9', text: '#0C4A6E' },
  intermediate: { bg: '#F0FDF4', border: '#86EFAC', badge: '#22C55E', text: '#14532D' },
  professional: { bg: '#FFF7ED', border: '#FED7AA', badge: '#F97316', text: '#7C2D12' },
};

export default function PTProfileScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { ptId } = route.params;

  const C = useColors();
  const user = useAuthStore((s) => s.user) as Athlete | null;
  const { pts, sendCoachingRequest } = usePTStore();
  const { getOrCreateConversation } = useMessageStore();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<CoachingPackage | null>(null);

  const pt = pts.find((p) => p.id === ptId);

  if (!pt) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: C.textSecondary }]}>PT bulunamadı</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: C.accent }}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isCurrentPT = user?.activePTId === pt.id;
  const hasActivePT = !!user?.activePTId && !isCurrentPT;

  const handleBook = async () => {
    if (!selectedPackage) {
      showToast('Lütfen bir paket seçin', 'warning');
      return;
    }
    if (hasActivePT) {
      showToast('Önce mevcut koçluğunuzu bitirin', 'warning');
      return;
    }
    setIsRequesting(true);
    try {
      await sendCoachingRequest(pt.id, selectedPackage.id);
      setShowSuccessModal(true);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Talep gönderilemedi', 'error');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleMessage = async () => {
    if (!user) return;
    const conversationId = await getOrCreateConversation(user.id, pt.id);
    navigation.navigate('Chat', {
      conversationId,
      otherUserId: pt.id,
      otherUserName: `${pt.firstName} ${pt.lastName}`,
    });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <PTProfileHeader pt={pt} onBack={() => navigation.goBack()} />

        <View style={styles.content}>
          {/* Bio */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Icon name="user" size={18} color={C.accent} />
              <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Hakkımda</Text>
            </View>
            <Text style={[styles.bioText, { color: C.textSecondary }]}>{pt.bio}</Text>
          </View>

          {/* Certificates */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Icon name="trophy" size={18} color={C.accent} />
              <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Sertifikalar</Text>
            </View>
            <Text style={[styles.certText, { color: C.textSecondary, backgroundColor: C.surface }]}>
              {pt.certificates}
            </Text>
          </View>

          {/* Packages */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Icon name="package" size={18} color={C.accent} />
              <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Koçluk Paketleri</Text>
            </View>
            {pt.packages.map((pkg) => {
              const colors = PACKAGE_COLORS[pkg.level];
              const isSelected = selectedPackage?.id === pkg.id;
              return (
                <TouchableOpacity
                  key={pkg.id}
                  style={[
                    styles.packageCard,
                    { backgroundColor: colors.bg, borderColor: isSelected ? colors.badge : colors.border },
                    isSelected && styles.packageCardSelected,
                  ]}
                  onPress={() => setSelectedPackage(isSelected ? null : pkg)}
                  activeOpacity={0.85}
                  disabled={isCurrentPT}
                >
                  <View style={styles.packageHeader}>
                    <View style={styles.packageTitleRow}>
                      <View style={[styles.packageBadge, { backgroundColor: colors.badge }]}>
                        <Text style={styles.packageBadgeText}>{pkg.name}</Text>
                      </View>
                      {pkg.isPopular && (
                        <View style={styles.popularBadge}>
                          <Icon name="fire" size={10} color="#fff" />
                          <Text style={styles.popularBadgeText}>Popüler</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.packagePrice, { color: colors.badge }]}>
                      {formatPrice(pkg.price)}
                    </Text>
                  </View>

                  <View style={styles.packageMeta}>
                    <View style={styles.metaItem}>
                      <Icon name="calendar" size={13} color={C.textSecondary} />
                      <Text style={[styles.metaText, { color: C.textSecondary }]}>{pkg.durationWeeks} hafta</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Icon name="flash" size={13} color={C.textSecondary} />
                      <Text style={[styles.metaText, { color: C.textSecondary }]}>Haftada {pkg.sessionsPerWeek} seans</Text>
                    </View>
                  </View>

                  <View style={styles.featuresList}>
                    {pkg.features.map((feat, idx) => (
                      <View key={idx} style={styles.featureRow}>
                        <Icon name="check" size={13} color={colors.badge} />
                        <Text style={[styles.featureText, { color: colors.text }]}>{feat}</Text>
                      </View>
                    ))}
                  </View>

                  {isSelected && (
                    <View style={[styles.selectedIndicator, { backgroundColor: colors.badge }]}>
                      <Icon name="check" size={14} color="#fff" />
                      <Text style={styles.selectedIndicatorText}>Seçildi</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Booking card */}
          <BookingCard
            pt={pt}
            selectedPackage={isCurrentPT ? null : selectedPackage}
            hasActivePT={hasActivePT}
            isCurrentPT={isCurrentPT}
            onBook={handleBook}
            onMessage={isCurrentPT ? handleMessage : undefined}
          />

          {/* Gallery */}
          {pt.gallery.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Icon name="gallery" size={18} color={C.accent} />
                <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Başarı Galerisi</Text>
              </View>
              <GalleryGrid items={pt.gallery} />
            </View>
          )}

          {/* Reviews */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Icon name="star" size={18} color="#F59E0B" />
              <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Değerlendirmeler ({pt.reviewCount})</Text>
            </View>
            {pt.reviews.map((review) => (
              <View key={review.id} style={[styles.reviewCard, { backgroundColor: C.card, borderColor: C.border }]}>
                <View style={styles.reviewHeader}>
                  <Avatar uri={review.athleteAvatar} name={review.athleteName} size="sm" />
                  <View style={styles.reviewInfo}>
                    <Text style={[styles.reviewName, { color: C.textPrimary }]}>{review.athleteName}</Text>
                    <Text style={[styles.reviewDate, { color: C.textSecondary }]}>{formatDate(review.createdAt)}</Text>
                  </View>
                  <View style={styles.reviewRating}>
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Icon key={i} name="star" size={12} color="#F59E0B" />
                    ))}
                  </View>
                </View>
                <Text style={[styles.reviewComment, { color: C.textSecondary }]}>{review.comment}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Success modal */}
      <Modal visible={showSuccessModal} transparent animationType="slide">
        <View style={[styles.overlay, { backgroundColor: C.overlay }]}>
          <View style={[styles.modal, { backgroundColor: C.card }]}>
            <View style={styles.modalIconWrap}>
              <Icon name="check" size={36} color="#fff" />
            </View>
            <Text style={[styles.modalTitle, { color: C.textPrimary }]}>Talep Gönderildi!</Text>
            <Text style={[styles.modalText, { color: C.textSecondary }]}>
              <Text style={{ fontWeight: '700' }}>{pt.firstName} {pt.lastName}</Text>
              {' '}talebinizi inceleyecek ve kısa sürede size dönecek.
            </Text>
            {selectedPackage && (
              <View style={[styles.modalPackageInfo, { backgroundColor: C.surface }]}>
                <Icon name="package" size={14} color={C.accent} />
                <Text style={[styles.modalPackageText, { color: C.accent }]}>
                  {selectedPackage.name} Paketi — {formatPrice(selectedPackage.price)}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: C.accent }]}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.modalBtnText}>Tamam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { ...Typography.h3 },
  content: { padding: Spacing.base, gap: Spacing.xl },
  section: { gap: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { ...Typography.h3 },
  bioText: { ...Typography.body, lineHeight: 26 },
  certText: {
    ...Typography.bodySmall,
    padding: Spacing.base,
    borderRadius: 12,
    lineHeight: 22,
  },
  packageCard: {
    borderRadius: 14,
    padding: Spacing.base,
    borderWidth: 2,
    gap: 12,
  },
  packageCardSelected: { borderWidth: 2.5 },
  packageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  packageTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  packageBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  packageBadgeText: { ...Typography.caption, fontWeight: '700', color: '#fff' },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  popularBadgeText: { ...Typography.caption, fontWeight: '700', color: '#fff', fontSize: 10 },
  packagePrice: { ...Typography.h2, fontSize: 20, fontWeight: '800' },
  packageMeta: { flexDirection: 'row', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { ...Typography.caption, fontWeight: '600' },
  featuresList: { gap: 6 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { ...Typography.bodySmall, flex: 1, lineHeight: 20 },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  selectedIndicatorText: { ...Typography.label, color: '#fff' },
  reviewCard: {
    borderRadius: BorderRadius.card,
    padding: Spacing.base,
    gap: 10,
    borderWidth: 1,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewInfo: { flex: 1 },
  reviewName: { ...Typography.label },
  reviewDate: { ...Typography.caption },
  reviewRating: { flexDirection: 'row', gap: 1 },
  reviewComment: { ...Typography.bodySmall, lineHeight: 22, fontStyle: 'italic' },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    paddingBottom: 48,
  },
  modalIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: { ...Typography.h2 },
  modalText: { ...Typography.body, textAlign: 'center', lineHeight: 24 },
  modalPackageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modalPackageText: { ...Typography.bodySmall, fontWeight: '600' },
  modalBtn: {
    marginTop: 8,
    borderRadius: 28,
    paddingHorizontal: 48,
    paddingVertical: 14,
  },
  modalBtnText: { ...Typography.button, color: '#fff' },
});
