import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar,
  TouchableOpacity, TextInput, Modal, Alert, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PTStackParamList } from '../../navigation/PTNavigator';
import { useAuthStore } from '../../store/authStore';
import { useDashboardStore } from '../../store/dashboardStore';
import { useColors } from '../../constants/colors';
import { Typography, Spacing, BorderRadius } from '../../constants/typography';
import { Athlete, PT, StudentProgram, ProgramExercise, BodyAnalysis } from '../../types';
import { getGoalLabel, getExperienceLabel, formatDate } from '../../utils/helpers';
import Avatar from '../../components/common/Avatar';
import Icon from '../../components/common/Icon';
import Button from '../../components/common/Button';
import { showToast } from '../../components/common/Toast';
import { generateUUID } from '../../utils/uuid';
import { uploadProgramFile } from '../../utils/upload';

type NavProp = NativeStackNavigationProp<PTStackParamList, 'StudentDetail'>;
type RouteProps = RouteProp<PTStackParamList, 'StudentDetail'>;

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export default function StudentDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { student } = route.params;
  const C = useColors();
  const user = useAuthStore((s) => s.user) as PT | null;
  const { loadPrograms, getStudentPrograms, createProgram, updateProgram, deleteProgram,
    loadBodyAnalyses, getStudentBodyAnalyses, addPTComment } = useDashboardStore();

  const [programs, setPrograms] = useState<StudentProgram[]>([]);
  const [bodyAnalyses, setBodyAnalyses] = useState<BodyAnalysis[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<StudentProgram | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'programs' | 'analiz'>('info');
  const [commentText, setCommentText] = useState('');
  const [commentingId, setCommentingId] = useState<string | null>(null);

  // Yeni program formu
  const [newProgramName, setNewProgramName] = useState('');
  const [newProgramDesc, setNewProgramDesc] = useState('');
  const [newProgramWeeks, setNewProgramWeeks] = useState('4');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Yeni egzersiz formu
  const [exName, setExName] = useState('');
  const [exSets, setExSets] = useState('3');
  const [exReps, setExReps] = useState('10-12');
  const [exWeight, setExWeight] = useState('');
  const [exRest, setExRest] = useState('90 sn');
  const [exNotes, setExNotes] = useState('');
  const [exDay, setExDay] = useState(1);

  useEffect(() => {
    loadProgramsForStudent();
  }, []);

  const loadProgramsForStudent = async () => {
    await loadPrograms(student.id);
    setPrograms(getStudentPrograms(student.id));
    await loadBodyAnalyses(student.id);
    setBodyAnalyses(getStudentBodyAnalyses(student.id));
  };

  useEffect(() => {
    setPrograms(getStudentPrograms(student.id));
    setBodyAnalyses(getStudentBodyAnalyses(student.id));
  }, [useDashboardStore.getState().programs, useDashboardStore.getState().bodyAnalyses]);

  const handleCreateProgram = async () => {
    if (!newProgramName.trim() || !user) return;
    setIsSaving(true);
    try {
      await createProgram({
        athleteId: student.id,
        ptId: user.id,
        name: newProgramName.trim(),
        description: newProgramDesc.trim(),
        weeks: parseInt(newProgramWeeks) || 4,
        isActive: true,
        exercises: [],
      });
      setPrograms(getStudentPrograms(student.id));
      setShowCreateModal(false);
      setNewProgramName('');
      setNewProgramDesc('');
      setNewProgramWeeks('4');
      showToast('Program oluşturuldu!', 'success');
    } catch {
      showToast('Program oluşturulamadı', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadProgram = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Dosya seçmek için galeri izni gerekiyor.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets[0] || !user) return;

    setIsUploadingFile(true);
    try {
      const url = await uploadProgramFile(user.id, result.assets[0].uri);
      if (!url) throw new Error('Upload başarısız');

      const fileName = `Program_${student.firstName}_${Date.now()}.jpg`;
      await createProgram({
        athleteId: student.id,
        ptId: user.id,
        name: fileName.replace('.jpg', ''),
        description: 'Yüklenen program dosyası',
        weeks: 4,
        isActive: true,
        exercises: [],
        fileUrl: url,
        fileName,
      });
      setPrograms(getStudentPrograms(student.id));
      showToast('Program dosyası yüklendi!', 'success');
    } catch {
      showToast('Dosya yüklenemedi', 'error');
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleAddExercise = async () => {
    if (!exName.trim() || !selectedProgram) return;
    const newEx: ProgramExercise = {
      id: generateUUID(),
      name: exName.trim(),
      sets: parseInt(exSets) || 3,
      reps: exReps.trim(),
      weight: exWeight.trim() || undefined,
      rest: exRest.trim() || undefined,
      notes: exNotes.trim() || undefined,
      day: exDay,
    };
    const updated = [...selectedProgram.exercises, newEx];
    await updateProgram(selectedProgram.id, { exercises: updated });
    const fresh = getStudentPrograms(student.id);
    setPrograms(fresh);
    setSelectedProgram(fresh.find((p) => p.id === selectedProgram.id) ?? null);
    setShowExerciseModal(false);
    setExName(''); setExSets('3'); setExReps('10-12'); setExWeight('');
    setExRest('90 sn'); setExNotes(''); setExDay(1);
    showToast('Egzersiz eklendi!', 'success');
  };

  const handleDeleteExercise = async (program: StudentProgram, exId: string) => {
    const updated = program.exercises.filter((e) => e.id !== exId);
    await updateProgram(program.id, { exercises: updated });
    const fresh = getStudentPrograms(student.id);
    setPrograms(fresh);
    setSelectedProgram(fresh.find((p) => p.id === program.id) ?? null);
  };

  const handleDeleteProgram = (program: StudentProgram) => {
    Alert.alert('Programı Sil', `"${program.name}" programını silmek istediğinden emin misin?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await deleteProgram(program.id);
          setPrograms(getStudentPrograms(student.id));
          if (selectedProgram?.id === program.id) setSelectedProgram(null);
          showToast('Program silindi', 'info');
        },
      },
    ]);
  };

  const S = makeStyles(C);

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.background} />

      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}>
          <Icon name="arrow_left" size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>{student.firstName} {student.lastName}</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Profil kartı */}
      <View style={S.profileCard}>
        <Avatar uri={student.avatar} name={`${student.firstName} ${student.lastName}`} size="lg" />
        <View style={S.profileInfo}>
          <Text style={S.profileName}>{student.firstName} {student.lastName}</Text>
          <Text style={S.profileEmail}>{student.email}</Text>
          <View style={S.tagRow}>
            <View style={[S.goalTag, { backgroundColor: '#E9456018' }]}>
              <Text style={[S.tagText, { color: C.accent }]}>{getGoalLabel(student.fitnessGoal)}</Text>
            </View>
            <View style={S.levelTag}>
              <Text style={S.levelText}>{getExperienceLabel(student.experienceLevel)}</Text>
            </View>
            {student.age > 0 && (
              <View style={S.levelTag}>
                <Text style={S.levelText}>{student.age} yaş</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Sekmeler */}
      <View style={S.tabs}>
        {(['info', 'programs', 'analiz'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[S.tab, activeTab === tab && S.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[S.tabText, activeTab === tab && S.tabTextActive]}>
              {tab === 'info' ? 'Bilgiler' : tab === 'programs' ? `Programlar (${programs.length})` : `Analiz (${bodyAnalyses.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>
        {activeTab === 'info' ? (
          <View style={S.infoSection}>
            <InfoRow icon="user" label="Ad Soyad" value={`${student.firstName} ${student.lastName}`} C={C} />
            <InfoRow icon="notification" label="E-posta" value={student.email} C={C} />
            {student.age > 0 && <InfoRow icon="star" label="Yaş" value={`${student.age}`} C={C} />}
            <InfoRow icon="trophy" label="Hedef" value={getGoalLabel(student.fitnessGoal)} C={C} />
            <InfoRow icon="settings" label="Seviye" value={getExperienceLabel(student.experienceLevel)} C={C} />
            <InfoRow icon="profile" label="Üyelik" value={formatDate(student.createdAt)} C={C} />
            {student.notes && (
              <View style={S.notesBox}>
                <Text style={S.notesLabel}>Notlar</Text>
                <Text style={S.notesText}>{student.notes}</Text>
              </View>
            )}
          </View>
        ) : activeTab === 'analiz' ? (
          /* ── Vücut Analizi Sekmesi ── */
          <View style={{ gap: 12 }}>
            {bodyAnalyses.length === 0 ? (
              <View style={S.emptyPrograms}>
                <Text style={{ fontSize: 36 }}>📸</Text>
                <Text style={S.emptyProgramsTitle}>Henüz analiz yok</Text>
                <Text style={S.emptyProgramsSub}>Sporcu haftalık vücut fotoğrafı yükleyince burada görünür</Text>
              </View>
            ) : (
              bodyAnalyses.map((analysis) => (
                <View key={analysis.id} style={[S.programCard]}>
                  <Image
                    source={{ uri: analysis.photoUrl, cache: 'force-cache' } as any}
                    style={{ width: '100%', height: 220, borderRadius: 12 }}
                    resizeMode="cover"
                    fadeDuration={0}
                  />
                  <View style={{ padding: Spacing.base, gap: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={[S.programName, { color: C.textPrimary }]}>
                        Hafta {analysis.weekNumber}
                      </Text>
                      <Text style={[S.programMetaText, { color: C.textSecondary }]}>
                        {new Date(analysis.createdAt).toLocaleDateString('tr-TR')}
                      </Text>
                    </View>

                    {analysis.ptComment ? (
                      <View style={[S.programInfoBox, { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' }]}>
                        <Text style={S.programInfoLabel}>💬 Koç Yorumu</Text>
                        <Text style={S.programInfoText}>{analysis.ptComment}</Text>
                      </View>
                    ) : null}

                    {commentingId === analysis.id ? (
                      <View style={{ gap: 8 }}>
                        <TextInput
                          style={[S.modalInput, { height: 80, textAlignVertical: 'top', paddingTop: 8, color: C.textPrimary, borderColor: C.border, backgroundColor: C.surface }]}
                          placeholder="Yorumunuzu yazın..."
                          placeholderTextColor={C.textSecondary}
                          multiline
                          value={commentText}
                          onChangeText={setCommentText}
                        />
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <Button
                            title="Kaydet"
                            onPress={async () => {
                              if (!commentText.trim()) return;
                              await addPTComment(analysis.id, commentText.trim());
                              setBodyAnalyses(getStudentBodyAnalyses(student.id));
                              setCommentingId(null);
                              setCommentText('');
                              showToast('Yorum kaydedildi', 'success');
                            }}
                            style={{ flex: 1 }}
                          />
                          <Button title="İptal" onPress={() => { setCommentingId(null); setCommentText(''); }} variant="outline" style={{ flex: 1 }} />
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[S.programBtn, S.programBtnOutline, { borderColor: C.accent, paddingVertical: 10 }]}
                        onPress={() => { setCommentingId(analysis.id); setCommentText(analysis.ptComment); }}
                      >
                        <Text style={[S.programBtnText, { color: C.accent }]}>
                          {analysis.ptComment ? '✏️ Yorumu Düzenle' : '💬 Yorum Yap'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={S.programsSection}>
            {/* İki buton yan yana */}
            <View style={S.programBtnRow}>
              <TouchableOpacity
                style={[S.programBtn, S.programBtnOutline, { borderColor: C.accent }]}
                onPress={handleUploadProgram}
                disabled={isUploadingFile}
              >
                <Text style={{ fontSize: 18 }}>📎</Text>
                <Text style={[S.programBtnText, { color: C.accent }]}>
                  {isUploadingFile ? 'Yükleniyor...' : 'Program Ekle'}
                </Text>
                <Text style={[S.programBtnSub, { color: C.textSecondary }]}>Fotoğraf / Görsel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[S.programBtn, { backgroundColor: C.accent }]}
                onPress={() => (navigation as any).navigate('ProgramBuilder', { student })}
              >
                <Text style={{ fontSize: 18 }}>🏋️</Text>
                <Text style={[S.programBtnText, { color: '#fff' }]}>Program Oluştur</Text>
                <Text style={[S.programBtnSub, { color: 'rgba(255,255,255,0.7)' }]}>Haftalık çetele</Text>
              </TouchableOpacity>
            </View>

            {programs.length === 0 ? (
              <View style={S.emptyPrograms}>
                <Icon name="package" size={36} color={C.textSecondary} />
                <Text style={S.emptyProgramsTitle}>Henüz program yok</Text>
                <Text style={S.emptyProgramsSub}>Bu öğrenci için antrenman programı oluştur</Text>
              </View>
            ) : (
              programs.map((program) => (
                <View key={program.id} style={S.programCard}>
                  <View style={S.programHeader}>
                    <View style={S.programTitleRow}>
                      <View style={[S.dot, { backgroundColor: program.isActive ? C.success : C.textSecondary }]} />
                      <Text style={S.programName}>{program.name}</Text>
                    </View>
                    <View style={S.programActions}>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedProgram(program);
                          setShowExerciseModal(true);
                        }}
                        style={S.programIconBtn}
                      >
                        <Icon name="plus" size={16} color={C.accent} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteProgram(program)}
                        style={S.programIconBtn}
                      >
                        <Icon name="close" size={16} color={C.error} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={S.programMeta}>
                    <Text style={S.programMetaText}>{program.weeks} hafta</Text>
                    <Text style={S.programMetaDot}>·</Text>
                    <Text style={S.programMetaText}>{program.exercises.length} egzersiz</Text>
                    {program.description ? (
                      <>
                        <Text style={S.programMetaDot}>·</Text>
                        <Text style={[S.programMetaText, { flex: 1 }]} numberOfLines={1}>{program.description}</Text>
                      </>
                    ) : null}
                  </View>

                  {/* Egzersizler günlere göre */}
                  {/* Yüklenen dosya görseli */}
                  {!!program.fileUrl && (
                    <View style={{ paddingHorizontal: Spacing.base, paddingBottom: 10 }}>
                      <Image
                        source={{ uri: program.fileUrl }}
                        style={{ width: '100%', height: 160, borderRadius: 10 }}
                        resizeMode="contain"
                      />
                    </View>
                  )}

                  {program.cautions ? (
                    <View style={[S.programInfoBox, { backgroundColor: '#FFF3CD', borderColor: '#F59E0B' }]}>
                      <Text style={S.programInfoLabel}>⚠️ Dikkat Edilmesi Gerekenler</Text>
                      <Text style={S.programInfoText}>{program.cautions}</Text>
                    </View>
                  ) : null}

                  {program.generalNotes ? (
                    <View style={[S.programInfoBox, { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' }]}>
                      <Text style={S.programInfoLabel}>📝 Notlar</Text>
                      <Text style={S.programInfoText}>{program.generalNotes}</Text>
                    </View>
                  ) : null}

                  {program.exercises.length > 0 && (
                    <View style={S.exerciseList}>
                      {DAYS.map((day, idx) => {
                        const dayExs = program.exercises.filter((e) => e.day === idx + 1);
                        if (dayExs.length === 0) return null;
                        return (
                          <View key={idx} style={S.dayGroup}>
                            <Text style={S.dayLabel}>{day}</Text>
                            {dayExs.map((ex) => (
                              <View key={ex.id} style={S.exerciseRow}>
                                <View style={S.exerciseInfo}>
                                  <Text style={S.exerciseName}>{ex.name}</Text>
                                  <Text style={S.exerciseMeta}>
                                    {ex.sets} set × {ex.reps}
                                    {ex.weight ? ` · ${ex.weight}` : ''}
                                    {ex.rest ? ` · ${ex.rest}` : ''}
                                  </Text>
                                  {ex.notes ? <Text style={S.exerciseNotes}>{ex.notes}</Text> : null}
                                </View>
                                <TouchableOpacity
                                  onPress={() => handleDeleteExercise(program, ex.id)}
                                  style={S.deleteExBtn}
                                >
                                  <Icon name="close" size={14} color={C.error} />
                                </TouchableOpacity>
                              </View>
                            ))}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Program oluşturma modal */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={S.overlay}>
          <View style={S.modal}>
            <View style={S.modalHeader}>
              <Text style={S.modalTitle}>Yeni Program</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Icon name="close" size={22} color={C.textSecondary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={S.modalInput}
              placeholder="Program adı *"
              placeholderTextColor={C.textSecondary}
              value={newProgramName}
              onChangeText={setNewProgramName}
            />
            <TextInput
              style={[S.modalInput, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
              placeholder="Açıklama (opsiyonel)"
              placeholderTextColor={C.textSecondary}
              multiline
              value={newProgramDesc}
              onChangeText={setNewProgramDesc}
            />
            <View style={S.weeksRow}>
              <Text style={S.weeksLabel}>Süre (hafta):</Text>
              {['4', '8', '12', '16'].map((w) => (
                <TouchableOpacity
                  key={w}
                  style={[S.weekBtn, newProgramWeeks === w && S.weekBtnActive]}
                  onPress={() => setNewProgramWeeks(w)}
                >
                  <Text style={[S.weekBtnText, newProgramWeeks === w && { color: '#fff' }]}>{w}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button title="Oluştur" onPress={handleCreateProgram} isLoading={isSaving} />
          </View>
        </View>
      </Modal>

      {/* Egzersiz ekleme modal */}
      <Modal visible={showExerciseModal} transparent animationType="slide">
        <View style={S.overlay}>
          <ScrollView contentContainerStyle={S.modalScroll}>
            <View style={S.modal}>
              <View style={S.modalHeader}>
                <Text style={S.modalTitle}>Egzersiz Ekle</Text>
                <TouchableOpacity onPress={() => setShowExerciseModal(false)}>
                  <Icon name="close" size={22} color={C.textSecondary} />
                </TouchableOpacity>
              </View>
              <Text style={S.fieldLabel}>Egzersiz Adı *</Text>
              <TextInput style={S.modalInput} placeholder="Örn: Bench Press" placeholderTextColor={C.textSecondary} value={exName} onChangeText={setExName} />

              <View style={S.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={S.fieldLabel}>Set</Text>
                  <TextInput style={S.modalInput} keyboardType="number-pad" placeholder="3" placeholderTextColor={C.textSecondary} value={exSets} onChangeText={setExSets} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={S.fieldLabel}>Tekrar</Text>
                  <TextInput style={S.modalInput} placeholder="10-12" placeholderTextColor={C.textSecondary} value={exReps} onChangeText={setExReps} />
                </View>
              </View>

              <View style={S.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={S.fieldLabel}>Ağırlık</Text>
                  <TextInput style={S.modalInput} placeholder="60 kg" placeholderTextColor={C.textSecondary} value={exWeight} onChangeText={setExWeight} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={S.fieldLabel}>Dinlenme</Text>
                  <TextInput style={S.modalInput} placeholder="90 sn" placeholderTextColor={C.textSecondary} value={exRest} onChangeText={setExRest} />
                </View>
              </View>

              <Text style={S.fieldLabel}>Gün</Text>
              <View style={S.daySelector}>
                {DAYS.map((d, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[S.dayBtn, exDay === i + 1 && S.dayBtnActive]}
                    onPress={() => setExDay(i + 1)}
                  >
                    <Text style={[S.dayBtnText, exDay === i + 1 && { color: '#fff' }]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={S.fieldLabel}>Not (opsiyonel)</Text>
              <TextInput style={S.modalInput} placeholder="Teknik notlar..." placeholderTextColor={C.textSecondary} value={exNotes} onChangeText={setExNotes} />

              <Button title="Egzersizi Ekle" onPress={handleAddExercise} style={{ marginTop: 8 }} />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value, C }: { icon: string; label: string; value: string; C: any }) {
  return (
    <View style={[infoStyles.row, { borderBottomColor: C.border }]}>
      <Icon name={icon as any} size={16} color={C.accent} />
      <Text style={[infoStyles.label, { color: C.textSecondary }]}>{label}</Text>
      <Text style={[infoStyles.value, { color: C.textPrimary }]}>{value}</Text>
    </View>
  );
}
const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1 },
  label: { ...Typography.bodySmall, width: 80 },
  value: { ...Typography.body, flex: 1, fontWeight: '500' },
});

function makeStyles(C: any) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.base,
      paddingVertical: 12,
      backgroundColor: C.card,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { ...Typography.h3, color: C.textPrimary },
    profileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      padding: Spacing.base,
      backgroundColor: C.card,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    profileInfo: { flex: 1, gap: 5 },
    profileName: { ...Typography.h3, color: C.textPrimary },
    profileEmail: { ...Typography.caption, color: C.textSecondary },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
    goalTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    levelTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: C.surface },
    tagText: { fontSize: 11, fontWeight: '600' },
    levelText: { fontSize: 11, color: C.textSecondary, fontWeight: '600' },
    tabs: {
      flexDirection: 'row',
      backgroundColor: C.card,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabActive: { borderBottomColor: C.accent },
    tabText: { ...Typography.bodySmall, color: C.textSecondary, fontWeight: '600' },
    tabTextActive: { color: C.accent },
    scroll: { padding: Spacing.base, paddingBottom: 40 },
    infoSection: { gap: 0 },
    notesBox: {
      marginTop: Spacing.base,
      padding: Spacing.base,
      backgroundColor: C.surface,
      borderRadius: BorderRadius.card,
      gap: 6,
    },
    notesLabel: { ...Typography.label, color: C.textSecondary },
    notesText: { ...Typography.body, color: C.textPrimary, lineHeight: 24 },
    programsSection: { gap: 12 },
    programBtnRow: { flexDirection: 'row', gap: 10 },
    programBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 8,
      gap: 4,
    },
    programBtnOutline: {
      borderWidth: 1.5,
      backgroundColor: 'transparent',
    },
    programBtnText: { ...Typography.label, fontWeight: '700', textAlign: 'center' },
    programBtnSub: { ...Typography.caption, textAlign: 'center' },
    programInfoBox: {
      marginHorizontal: Spacing.base,
      marginBottom: 8,
      padding: 10,
      borderRadius: 8,
      borderLeftWidth: 3,
    },
    programInfoLabel: { fontSize: 11, fontWeight: '700', marginBottom: 3, color: '#555' },
    programInfoText: { fontSize: 12, color: '#444', lineHeight: 18 },
    emptyPrograms: { alignItems: 'center', paddingTop: 40, gap: 10 },
    emptyProgramsTitle: { ...Typography.h3, color: C.textPrimary },
    emptyProgramsSub: { ...Typography.bodySmall, color: C.textSecondary, textAlign: 'center' },
    programCard: {
      backgroundColor: C.card,
      borderRadius: BorderRadius.card,
      borderWidth: 1,
      borderColor: C.border,
      overflow: 'hidden',
    },
    programHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.base,
    },
    programTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    programName: { ...Typography.label, color: C.textPrimary, fontWeight: '700' },
    programActions: { flexDirection: 'row', gap: 4 },
    programIconBtn: { padding: 6, borderRadius: 8, backgroundColor: C.surface },
    programMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: Spacing.base,
      paddingBottom: 10,
    },
    programMetaText: { ...Typography.caption, color: C.textSecondary },
    programMetaDot: { color: C.border },
    exerciseList: {
      borderTopWidth: 1,
      borderTopColor: C.border,
      padding: Spacing.base,
      gap: 12,
    },
    dayGroup: { gap: 6 },
    dayLabel: {
      ...Typography.caption,
      color: C.accent,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    exerciseRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: C.surface,
      borderRadius: 10,
      padding: 10,
      gap: 8,
    },
    exerciseInfo: { flex: 1, gap: 2 },
    exerciseName: { ...Typography.label, color: C.textPrimary },
    exerciseMeta: { ...Typography.caption, color: C.textSecondary },
    exerciseNotes: { ...Typography.caption, color: C.textSecondary, fontStyle: 'italic' },
    deleteExBtn: { padding: 4 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalScroll: { justifyContent: 'flex-end', flex: 1 },
    modal: {
      backgroundColor: C.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: Spacing.base,
      paddingBottom: 40,
      gap: 10,
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    modalTitle: { ...Typography.h3, color: C.textPrimary },
    modalInput: {
      backgroundColor: C.inputBackground,
      borderRadius: 12,
      padding: 12,
      ...Typography.body,
      color: C.textPrimary,
      borderWidth: 1,
      borderColor: C.border,
    },
    weeksRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    weeksLabel: { ...Typography.bodySmall, color: C.textSecondary },
    weekBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
    },
    weekBtnActive: { backgroundColor: C.accent, borderColor: C.accent },
    weekBtnText: { ...Typography.bodySmall, color: C.textSecondary, fontWeight: '600' },
    fieldLabel: { ...Typography.caption, color: C.textSecondary, marginBottom: 2, fontWeight: '600' },
    row2: { flexDirection: 'row', gap: 10 },
    daySelector: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    dayBtn: {
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 10,
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
    },
    dayBtnActive: { backgroundColor: C.accent, borderColor: C.accent },
    dayBtnText: { ...Typography.caption, color: C.textSecondary, fontWeight: '600' },
  });
}
