import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar,
  TouchableOpacity, TextInput, Alert, Image, Modal, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AthleteStackParamList } from '../../navigation/AthleteNavigator';
import { useAuthStore, fetchUserProfile } from '../../store/authStore';
import { usePTStore } from '../../store/ptStore';
import { useMessageStore } from '../../store/messageStore';
import { supabase } from '../../lib/supabase';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Icon from '../../components/common/Icon';
import { showToast } from '../../components/common/Toast';
import { useColors } from '../../constants/colors';
import { Typography, Spacing, BorderRadius, Shadow } from '../../constants/typography';
import { Athlete, StudentProgram, BodyAnalysis } from '../../types';
import { formatPrice, getSpecializationLabel } from '../../utils/helpers';
import { uploadBodyPhoto } from '../../utils/upload';
import { generateUUID } from '../../utils/uuid';

type NavProp = NativeStackNavigationProp<AthleteStackParamList, 'AthleteTabs'>;

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const DAYS_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

function generateConversationId(a: string, b: string) {
  return [a, b].sort().join('_');
}

export default function MyCoachScreen() {
  const navigation = useNavigation<NavProp>();
  const C = useColors();
  const { user, updateUser } = useAuthStore();
  const athlete = user as Athlete | null;
  const { pts, loadPTs } = usePTStore();
  const { getOrCreateConversation, deactivateConversation, loadConversations } = useMessageStore();

  const [activeTab, setActiveTab] = useState<'coach' | 'programs' | 'analysis' | 'notes'>('coach');
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [programs, setPrograms] = useState<StudentProgram[]>([]);
  const [bodyAnalyses, setBodyAnalyses] = useState<BodyAnalysis[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activePTId, setActivePTId] = useState<string | undefined>(athlete?.activePTId);

  // Puanlama modal
  const [showRating, setShowRating] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [endedPTId, setEndedPTId] = useState<string | null>(null);

  const activePT = activePTId ? pts.find((p) => p.id === activePTId) : null;

  // Ekranda focus olunca profili ve verileri yenile
  useFocusEffect(
    useCallback(() => {
      if (!athlete?.id) return;

      fetchUserProfile(athlete.id).then((fresh) => {
        if (!fresh) return;
        updateUser(fresh as any);
        const ptId = (fresh as Athlete).activePTId;
        setActivePTId(ptId);
        const notesVal = (fresh as Athlete).notes ?? '';
        setNotes(notesVal);

        if (ptId) {
          // Programları yükle
          supabase
            .from('student_programs')
            .select('*')
            .eq('athlete_id', athlete.id)
            .eq('pt_id', ptId)
            .order('created_at', { ascending: false })
            .then(({ data }) => {
              if (data) setPrograms(mapPrograms(data));
            });

          // Vücut analizlerini yükle
          supabase
            .from('body_analyses')
            .select('*')
            .eq('athlete_id', athlete.id)
            .order('created_at', { ascending: false })
            .then(({ data }) => {
              if (data) setBodyAnalyses(mapAnalyses(data));
            });
        }
      });

      if (pts.length === 0) loadPTs();
    }, [athlete?.id]),
  );

  const handleSaveNotes = async () => {
    if (!athlete) return;
    setIsSavingNotes(true);
    await supabase.from('athlete_profiles').update({ notes }).eq('id', athlete.id);
    setIsSavingNotes(false);
    showToast('Notlar kaydedildi', 'success');
  };

  const handleMessage = async () => {
    if (!athlete || !activePT) return;
    const convId = await getOrCreateConversation(athlete.id, activePT.id);
    navigation.navigate('Chat', {
      conversationId: convId,
      otherUserId: activePT.id,
      otherUserName: `${activePT.firstName} ${activePT.lastName}`,
    });
  };

  const handleCancel = () => {
    Alert.alert(
      'Koçluğu Bırak',
      `${activePT?.firstName} ${activePT?.lastName} ile koçluk ilişkinizi bitirmek istiyor musunuz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Evet, Bırak',
          style: 'destructive',
          onPress: async () => {
            if (!athlete || !activePT) return;
            setIsCanceling(true);
            try {
              const convId = generateConversationId(athlete.id, activePT.id);
              // DB güncelle
              await supabase.from('athlete_profiles')
                .update({ active_pt_id: null, active_package_id: null })
                .eq('id', athlete.id);
              await supabase.from('pt_students')
                .delete()
                .match({ pt_id: activePT.id, athlete_id: athlete.id });
              await deactivateConversation(convId);
              await loadConversations();

              const ptIdForRating = activePT.id;
              setEndedPTId(ptIdForRating);
              setActivePTId(undefined);
              updateUser({ activePTId: undefined } as any);
              setPrograms([]);
              setBodyAnalyses([]);
              showToast('Koçluk ilişkisi sona erdi', 'info');
              setShowRating(true); // Puan ver modal
            } catch {
              showToast('Bir hata oluştu', 'error');
            } finally {
              setIsCanceling(false);
            }
          },
        },
      ],
    );
  };

  const handleSubmitRating = async () => {
    if (!athlete || !endedPTId || ratingValue === 0) return;
    setIsSubmittingRating(true);
    try {
      await supabase.from('reviews').insert({
        id: generateUUID(),
        pt_id: endedPTId,
        athlete_id: athlete.id,
        athlete_name: `${athlete.firstName} ${athlete.lastName}`,
        athlete_avatar: athlete.avatar ?? '',
        rating: ratingValue,
        comment: ratingComment.trim(),
      });

      // PT ortalama puanı güncelle
      const { data: allReviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('pt_id', endedPTId);
      if (allReviews && allReviews.length > 0) {
        const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
        await supabase.from('pt_profiles').update({
          rating: Math.round(avg * 10) / 10,
          review_count: allReviews.length,
        }).eq('id', endedPTId);
      }

      showToast('Puanınız kaydedildi!', 'success');
    } catch {
      showToast('Puan kaydedilemedi', 'error');
    } finally {
      setIsSubmittingRating(false);
      setShowRating(false);
      setRatingValue(0);
      setRatingComment('');
      setEndedPTId(null);
    }
  };

  const handleUploadBodyPhoto = async () => {
    if (!athlete || !activePTId) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Galeri izni gerekiyor.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (result.canceled || !result.assets[0]) return;

    setIsUploading(true);
    try {
      const url = await uploadBodyPhoto(athlete.id, result.assets[0].uri);
      if (!url) throw new Error('Yükleme başarısız');

      const weekNum = bodyAnalyses.length + 1;
      const { data } = await supabase.from('body_analyses').insert({
        id: generateUUID(),
        athlete_id: athlete.id,
        pt_id: activePTId,
        photo_url: url,
        week_number: weekNum,
        pt_comment: '',
      }).select().single();

      if (data) {
        setBodyAnalyses([
          {
            id: data.id,
            athleteId: data.athlete_id,
            ptId: data.pt_id,
            photoUrl: data.photo_url,
            weekNumber: data.week_number,
            ptComment: data.pt_comment ?? '',
            createdAt: new Date(data.created_at),
          },
          ...bodyAnalyses,
        ]);
      }
      showToast('Fotoğraf yüklendi!', 'success');
    } catch {
      showToast('Yükleme başarısız', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // ── Koç yokken ──
  if (!activePT) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
        <StatusBar barStyle="light-content" backgroundColor={C.background} />
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconWrap, { backgroundColor: C.surface }]}>
            <Icon name="dumbbell" size={48} color={C.accent} />
          </View>
          <Text style={[styles.emptyTitle, { color: C.textPrimary }]}>Henüz bir koçun yok</Text>
          <Text style={[styles.emptyText, { color: C.textSecondary }]}>
            Hedeflerine ulaşmak için sana özel bir personal trainer bul
          </Text>
          <Button
            title="Koç Bul"
            onPress={() => navigation.navigate('AthleteTabs', { screen: 'ExploreTab' } as never)}
            style={styles.ctaBtn}
          />
        </View>

        {/* Puanlama modal (koçluk bittikten sonra) */}
        <RatingModal
          visible={showRating}
          rating={ratingValue}
          comment={ratingComment}
          isLoading={isSubmittingRating}
          onRate={setRatingValue}
          onCommentChange={setRatingComment}
          onSubmit={handleSubmitRating}
          onSkip={() => { setShowRating(false); setRatingValue(0); setRatingComment(''); }}
          C={C}
        />
      </SafeAreaView>
    );
  }

  const minPackagePrice = activePT.packages?.length > 0
    ? Math.min(...activePT.packages.map((p) => p.price))
    : null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.background} />

      {/* Sekme bar */}
      <View style={[styles.tabBar, { backgroundColor: C.card, borderBottomColor: C.border }]}>
        {([
          { key: 'coach', label: 'Koçum' },
          { key: 'programs', label: `Programım (${programs.length})` },
          { key: 'analysis', label: `Analiz (${bodyAnalyses.length})` },
          { key: 'notes', label: 'Notlar' },
        ] as const).map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabItem, activeTab === t.key && { borderBottomColor: C.accent, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text style={[styles.tabLabel, { color: activeTab === t.key ? C.accent : C.textSecondary }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── KOÇUM TAB ── */}
        {activeTab === 'coach' && (
          <>
            <View style={[styles.ptCard, { backgroundColor: C.card }]}>
              <View style={styles.ptCardHeader}>
                <Avatar uri={activePT.avatar} name={`${activePT.firstName} ${activePT.lastName}`} size="lg" />
                <View style={styles.ptInfo}>
                  <Text style={[styles.ptName, { color: C.textPrimary }]}>
                    {activePT.firstName} {activePT.lastName}
                  </Text>
                  <View style={styles.ratingRow}>
                    <Icon name="star" size={14} color="#F59E0B" />
                    <Text style={[styles.rating, { color: C.textPrimary }]}>{activePT.rating.toFixed(1)}</Text>
                    <Text style={[styles.reviewCount, { color: C.textSecondary }]}>({activePT.reviewCount})</Text>
                  </View>
                  {minPackagePrice != null && (
                    <Text style={[styles.price, { color: C.accent }]}>{formatPrice(minPackagePrice)}'den başlayan</Text>
                  )}
                </View>
              </View>
              <View style={styles.specs}>
                {activePT.specializations.map((spec) => (
                  <Badge key={spec} label={getSpecializationLabel(spec)} variant="neutral" size="sm" />
                ))}
              </View>
              <View style={styles.actions}>
                <Button title="Mesaj Gönder" onPress={handleMessage} variant="primary" style={styles.actionBtn} />
                <Button title="Profili Gör" onPress={() => navigation.navigate('PTProfile', { ptId: activePT.id })} variant="outline" style={styles.actionBtn} />
              </View>
            </View>
            <Button
              title="Koçluğu Bırak"
              onPress={handleCancel}
              variant="danger"
              isLoading={isCanceling}
            />
          </>
        )}

        {/* ── PROGRAMLARIM TAB ── */}
        {activeTab === 'programs' && (
          programs.length === 0 ? (
            <View style={styles.emptyTab}>
              <Text style={{ fontSize: 36 }}>📋</Text>
              <Text style={[styles.emptyTabTitle, { color: C.textPrimary }]}>Program Bekleniyor</Text>
              <Text style={[styles.emptyTabSub, { color: C.textSecondary }]}>
                Koçun sana henüz program atamamış
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {programs.map((program) => (
                <View key={program.id} style={[styles.programCard, { backgroundColor: C.card, borderColor: C.border }]}>
                  <View style={styles.programHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: program.isActive ? C.success : C.textSecondary }} />
                      <Text style={[styles.programName, { color: C.textPrimary }]}>{program.name}</Text>
                    </View>
                    <Text style={[styles.programMeta, { color: C.textSecondary }]}>{program.weeks} hafta</Text>
                  </View>
                  {program.description ? (
                    <Text style={[styles.programDesc, { color: C.textSecondary }]}>{program.description}</Text>
                  ) : null}

                  {/* Yüklenen dosya */}
                  {program.fileUrl ? (
                    <Image source={{ uri: program.fileUrl, cache: 'force-cache' } as any} style={{ width: '100%', height: 200, borderRadius: 10, marginTop: 8 }} resizeMode="contain" fadeDuration={0} />
                  ) : null}

                  {/* Dikkat edilmesi gerekenler */}
                  {program.cautions ? (
                    <View style={[styles.infoBox, { backgroundColor: '#FFF3CD', borderColor: '#F59E0B' }]}>
                      <Text style={styles.infoBoxLabel}>⚠️ Dikkat Edilmesi Gerekenler</Text>
                      <Text style={styles.infoBoxText}>{program.cautions}</Text>
                    </View>
                  ) : null}

                  {/* Notlar */}
                  {program.generalNotes ? (
                    <View style={[styles.infoBox, { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' }]}>
                      <Text style={styles.infoBoxLabel}>📝 Notlar</Text>
                      <Text style={styles.infoBoxText}>{program.generalNotes}</Text>
                    </View>
                  ) : null}

                  {/* Egzersizler */}
                  {program.exercises.length > 0 && (
                    <View style={{ marginTop: 8, gap: 8 }}>
                      {DAYS_SHORT.map((day, idx) => {
                        const dayExs = program.exercises.filter((e) => e.day === idx + 1);
                        if (dayExs.length === 0) return null;
                        return (
                          <View key={idx}>
                            <Text style={{ ...Typography.caption, color: C.accent, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 }}>
                              {DAYS[idx].toUpperCase()}
                            </Text>
                            {dayExs.map((ex) => (
                              <View key={ex.id} style={[styles.exRow, { backgroundColor: C.surface }]}>
                                <Text style={[styles.exName, { color: C.textPrimary }]}>{ex.name}</Text>
                                <Text style={[styles.exMeta, { color: C.textSecondary }]}>
                                  {ex.sets} set × {ex.reps}
                                  {ex.weight ? ` · ${ex.weight}` : ''}
                                  {ex.rest ? ` · ${ex.rest}` : ''}
                                </Text>
                                {ex.notes ? <Text style={[styles.exNote, { color: C.textSecondary }]}>💬 {ex.notes}</Text> : null}
                              </View>
                            ))}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )
        )}

        {/* ── ANALİZ TAB ── */}
        {activeTab === 'analysis' && (
          <View style={{ gap: 12 }}>
            <TouchableOpacity
              style={[styles.uploadBtn, { borderColor: C.accent }]}
              onPress={handleUploadBodyPhoto}
              disabled={isUploading}
            >
              {isUploading
                ? <ActivityIndicator color={C.accent} />
                : <Text style={{ fontSize: 24 }}>📸</Text>
              }
              <Text style={[styles.uploadBtnText, { color: C.accent }]}>
                {isUploading ? 'Yükleniyor...' : 'Haftalık Vücut Fotoğrafı Yükle'}
              </Text>
              <Text style={[styles.uploadBtnSub, { color: C.textSecondary }]}>
                Koçun yorumlarını görecek
              </Text>
            </TouchableOpacity>

            {bodyAnalyses.length === 0 ? (
              <View style={styles.emptyTab}>
                <Text style={[styles.emptyTabSub, { color: C.textSecondary }]}>
                  Henüz vücut analizi yok. İlk fotoğrafını yükle!
                </Text>
              </View>
            ) : (
              bodyAnalyses.map((analysis) => (
                <View key={analysis.id} style={[styles.analysisCard, { backgroundColor: C.card, borderColor: C.border }]}>
                  <Image
                    source={{ uri: analysis.photoUrl, cache: 'force-cache' } as any}
                    style={{ width: '100%', height: 260, borderRadius: 12 }}
                    resizeMode="cover"
                    fadeDuration={0}
                  />
                  <View style={{ padding: Spacing.base, gap: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ ...Typography.label, color: C.textPrimary, fontWeight: '700' }}>
                        Hafta {analysis.weekNumber}
                      </Text>
                      <Text style={{ ...Typography.caption, color: C.textSecondary }}>
                        {new Date(analysis.createdAt).toLocaleDateString('tr-TR')}
                      </Text>
                    </View>
                    {analysis.ptComment ? (
                      <View style={[styles.infoBox, { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' }]}>
                        <Text style={styles.infoBoxLabel}>💬 Koç Yorumu</Text>
                        <Text style={styles.infoBoxText}>{analysis.ptComment}</Text>
                      </View>
                    ) : (
                      <Text style={{ ...Typography.caption, color: C.textSecondary, fontStyle: 'italic' }}>
                        Koçun henüz yorum yapmadı
                      </Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ── NOTLAR TAB ── */}
        {activeTab === 'notes' && (
          <View style={[styles.notesSection, { backgroundColor: C.card }]}>
            <View style={styles.notesSectionHeader}>
              <View style={styles.notesTitleRow}>
                <Icon name="edit" size={16} color={C.accent} />
                <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Kişisel Notlarım</Text>
              </View>
              <TouchableOpacity onPress={handleSaveNotes} disabled={isSavingNotes}>
                <Text style={[styles.saveLink, { color: C.accent }]}>{isSavingNotes ? 'Kaydediliyor...' : 'Kaydet'}</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.notesInput, { backgroundColor: C.surface, color: C.textPrimary, borderColor: C.border }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Antrenman notlarınızı, hedeflerinizi veya sorularınızı buraya yazın..."
              placeholderTextColor={C.textSecondary}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
          </View>
        )}
      </ScrollView>

      {/* Puanlama Modal */}
      <RatingModal
        visible={showRating}
        rating={ratingValue}
        comment={ratingComment}
        isLoading={isSubmittingRating}
        onRate={setRatingValue}
        onCommentChange={setRatingComment}
        onSubmit={handleSubmitRating}
        onSkip={() => { setShowRating(false); setRatingValue(0); setRatingComment(''); }}
        C={C}
      />
    </SafeAreaView>
  );
}

// ── Program mapper ──────────────────────────────────────────────────────────
function mapPrograms(data: any[]): StudentProgram[] {
  return data.map((p) => ({
    id: p.id,
    athleteId: p.athlete_id,
    ptId: p.pt_id,
    name: p.name,
    description: p.description ?? '',
    weeks: p.weeks ?? 4,
    isActive: p.is_active ?? true,
    exercises: p.exercises ?? [],
    cautions: p.cautions ?? '',
    generalNotes: p.general_notes ?? '',
    fileUrl: p.file_url ?? '',
    fileName: p.file_name ?? '',
    createdAt: new Date(p.created_at),
    updatedAt: new Date(p.updated_at ?? p.created_at),
  }));
}

function mapAnalyses(data: any[]): BodyAnalysis[] {
  return data.map((a) => ({
    id: a.id,
    athleteId: a.athlete_id,
    ptId: a.pt_id,
    photoUrl: a.photo_url,
    weekNumber: a.week_number ?? 1,
    ptComment: a.pt_comment ?? '',
    createdAt: new Date(a.created_at),
  }));
}

// ── Puanlama Modal ──────────────────────────────────────────────────────────
function RatingModal({ visible, rating, comment, isLoading, onRate, onCommentChange, onSubmit, onSkip, C }: any) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 16 }}>
          <Text style={{ ...Typography.h2, color: C.textPrimary, textAlign: 'center' }}>Koçunu Puanla</Text>
          <Text style={{ ...Typography.body, color: C.textSecondary, textAlign: 'center' }}>
            Koçluk deneyimini 10 üzerinden puanla
          </Text>

          {/* Puan butonları */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <TouchableOpacity
                key={n}
                onPress={() => onRate(n)}
                style={{
                  width: 46, height: 46, borderRadius: 23,
                  backgroundColor: rating >= n ? C.accent : C.surface,
                  borderWidth: 1.5,
                  borderColor: rating >= n ? C.accent : C.border,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text style={{ fontWeight: '700', color: rating >= n ? '#fff' : C.textSecondary }}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={{ backgroundColor: C.surface, borderRadius: 12, padding: 12, color: C.textPrimary, borderWidth: 1, borderColor: C.border, minHeight: 80, textAlignVertical: 'top' }}
            placeholder="Yorum (opsiyonel)..."
            placeholderTextColor={C.textSecondary}
            multiline
            value={comment}
            onChangeText={onCommentChange}
          />

          <Button
            title={isLoading ? 'Kaydediliyor...' : `${rating}/10 Puan Ver`}
            onPress={onSubmit}
            disabled={rating === 0 || isLoading}
          />
          <TouchableOpacity onPress={onSkip} style={{ alignItems: 'center' }}>
            <Text style={{ ...Typography.bodySmall, color: C.textSecondary }}>Şimdi Değil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabLabel: { fontSize: 11, fontWeight: '700' },
  scroll: { padding: Spacing.base, paddingBottom: 48, gap: Spacing.base },
  ptCard: {
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    ...Shadow.medium,
    gap: 14,
  },
  ptCardHeader: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  ptInfo: { flex: 1, gap: 4 },
  ptName: { ...Typography.h3 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { ...Typography.bodySmall, fontWeight: '700' },
  reviewCount: { ...Typography.caption },
  price: { ...Typography.bodySmall, fontWeight: '700' },
  specs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1 },
  emptyTab: { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyTabTitle: { ...Typography.h3 },
  emptyTabSub: { ...Typography.bodySmall, textAlign: 'center', maxWidth: 260 },
  programCard: {
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    padding: Spacing.base,
    gap: 8,
  },
  programHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  programName: { ...Typography.label, fontWeight: '700' },
  programMeta: { ...Typography.caption },
  programDesc: { ...Typography.bodySmall },
  infoBox: {
    borderRadius: 8,
    borderLeftWidth: 3,
    padding: 10,
  },
  infoBoxLabel: { fontSize: 11, fontWeight: '700', marginBottom: 3, color: '#555' },
  infoBoxText: { fontSize: 12, color: '#444', lineHeight: 18 },
  exRow: { borderRadius: 8, padding: 10, marginBottom: 4, gap: 2 },
  exName: { ...Typography.label },
  exMeta: { ...Typography.caption },
  exNote: { ...Typography.caption, fontStyle: 'italic' },
  analysisCard: {
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  uploadBtn: {
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 20,
    gap: 6,
  },
  uploadBtnText: { ...Typography.label, fontWeight: '700' },
  uploadBtnSub: { ...Typography.caption },
  notesSection: {
    borderRadius: BorderRadius.card,
    padding: Spacing.base,
    ...Shadow.small,
    gap: 10,
  },
  notesSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notesTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { ...Typography.h3 },
  saveLink: { ...Typography.bodySmall, fontWeight: '700' },
  notesInput: {
    minHeight: 160,
    borderRadius: 12,
    padding: Spacing.base,
    ...Typography.body,
    borderWidth: 1,
    lineHeight: 24,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: 16,
  },
  emptyIconWrap: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { ...Typography.h2, textAlign: 'center' },
  emptyText: { ...Typography.body, textAlign: 'center', lineHeight: 24 },
  ctaBtn: { marginTop: Spacing.md, paddingHorizontal: 40 },
});
