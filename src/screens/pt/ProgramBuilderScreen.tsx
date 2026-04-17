import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar,
  TouchableOpacity, TextInput, Modal, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { PTStackParamList } from '../../navigation/PTNavigator';
import { useAuthStore } from '../../store/authStore';
import { useDashboardStore } from '../../store/dashboardStore';
import { useColors } from '../../constants/colors';
import { Typography, Spacing, BorderRadius } from '../../constants/typography';
import { PT, ProgramExercise } from '../../types';
import Icon from '../../components/common/Icon';
import { showToast } from '../../components/common/Toast';
import { generateUUID } from '../../utils/uuid';

type RouteProps = RouteProp<PTStackParamList, 'ProgramBuilder'>;

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const DAYS_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const WEEK_OPTIONS = ['4', '8', '12', '16'];

export default function ProgramBuilderScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { student } = route.params;
  const C = useColors();
  const user = useAuthStore((s) => s.user) as PT | null;
  const { createProgram, getStudentPrograms } = useDashboardStore();

  // Program bilgileri
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [weeks, setWeeks] = useState('8');
  const [cautions, setCautions] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');

  // Egzersizler
  const [exercises, setExercises] = useState<ProgramExercise[]>([]);
  const [activeDay, setActiveDay] = useState(1);

  // Egzersiz ekleme modal
  const [showExModal, setShowExModal] = useState(false);
  const [exName, setExName] = useState('');
  const [exSets, setExSets] = useState('3');
  const [exReps, setExReps] = useState('10-12');
  const [exWeight, setExWeight] = useState('');
  const [exRest, setExRest] = useState('60 sn');
  const [exNotes, setExNotes] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  const dayExercises = exercises.filter((e) => e.day === activeDay);

  const handleAddExercise = () => {
    if (!exName.trim()) return;
    const newEx: ProgramExercise = {
      id: generateUUID(),
      name: exName.trim(),
      sets: parseInt(exSets) || 3,
      reps: exReps.trim() || '10',
      weight: exWeight.trim() || undefined,
      rest: exRest.trim() || undefined,
      notes: exNotes.trim() || undefined,
      day: activeDay,
    };
    setExercises([...exercises, newEx]);
    setExName(''); setExSets('3'); setExReps('10-12');
    setExWeight(''); setExRest('60 sn'); setExNotes('');
    setShowExModal(false);
    showToast('Egzersiz eklendi', 'success');
  };

  const handleDeleteExercise = (id: string) => {
    setExercises(exercises.filter((e) => e.id !== id));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Uyarı', 'Program adı zorunludur.');
      return;
    }
    if (!user) return;

    setIsSaving(true);
    try {
      await createProgram({
        athleteId: student.id,
        ptId: user.id,
        name: name.trim(),
        description: description.trim(),
        weeks: parseInt(weeks) || 8,
        isActive: true,
        exercises,
        cautions: cautions.trim(),
        generalNotes: generalNotes.trim(),
      });
      showToast('Program kaydedildi!', 'success');
      navigation.goBack();
    } catch {
      showToast('Program kaydedilemedi', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const S = makeStyles(C);

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.background} />

      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.headerBtn}>
          <Icon name="arrow_left" size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <View style={S.headerCenter}>
          <Text style={S.headerTitle}>Program Oluştur</Text>
          <Text style={S.headerSub}>{student.firstName} {student.lastName}</Text>
        </View>
        <TouchableOpacity
          style={[S.saveBtn, isSaving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={S.saveBtnText}>{isSaving ? 'Kaydediliyor...' : 'Kaydet'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={S.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Program Bilgileri ── */}
          <SectionHeader title="Program Bilgileri" icon="📋" />
          <View style={S.card}>
            <FieldLabel label="Program Adı *" C={C} />
            <TextInput
              style={S.input}
              placeholder="Örn: 12 Haftalık Kas Kazanım Programı"
              placeholderTextColor={C.textSecondary}
              value={name}
              onChangeText={setName}
            />

            <FieldLabel label="Açıklama" C={C} />
            <TextInput
              style={[S.input, S.textarea]}
              placeholder="Programın genel açıklaması..."
              placeholderTextColor={C.textSecondary}
              multiline
              value={description}
              onChangeText={setDescription}
            />

            <FieldLabel label="Program Süresi" C={C} />
            <View style={S.weekRow}>
              {WEEK_OPTIONS.map((w) => (
                <TouchableOpacity
                  key={w}
                  style={[S.weekChip, weeks === w && { backgroundColor: C.accent, borderColor: C.accent }]}
                  onPress={() => setWeeks(w)}
                >
                  <Text style={[S.weekChipText, weeks === w && { color: '#fff' }]}>{w} hafta</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Dikkat Edilmesi Gerekenler ── */}
          <SectionHeader title="Dikkat Edilmesi Gerekenler" icon="⚠️" />
          <View style={S.card}>
            <TextInput
              style={[S.input, S.textareaLg]}
              placeholder={
                'Örn:\n• Diz ağrısı geçmişi var, squat derinliğini sınırla\n• Omuz egzersizlerinde ağırlığı kademeli artır\n• Antrenman öncesi 10 dk ısınma zorunlu'
              }
              placeholderTextColor={C.textSecondary}
              multiline
              value={cautions}
              onChangeText={setCautions}
              textAlignVertical="top"
            />
          </View>

          {/* ── Genel Notlar ── */}
          <SectionHeader title="Genel Notlar & Beslenme" icon="📝" />
          <View style={S.card}>
            <TextInput
              style={[S.input, S.textareaLg]}
              placeholder={
                'Örn:\n• Günlük protein hedefi: 160g\n• Antrenman sonrası 30 dk içinde protein al\n• Haftada 1 dinlenme günü zorunlu'
              }
              placeholderTextColor={C.textSecondary}
              multiline
              value={generalNotes}
              onChangeText={setGeneralNotes}
              textAlignVertical="top"
            />
          </View>

          {/* ── Egzersiz Planı ── */}
          <SectionHeader title="Haftalık Egzersiz Planı" icon="💪" />

          {/* Gün seçici */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={S.dayTabScroll}
          >
            {DAYS_SHORT.map((d, i) => {
              const dayNum = i + 1;
              const count = exercises.filter((e) => e.day === dayNum).length;
              const isActive = activeDay === dayNum;
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    S.dayTab,
                    { borderColor: isActive ? C.accent : C.border },
                    isActive && { backgroundColor: C.accent },
                  ]}
                  onPress={() => setActiveDay(dayNum)}
                >
                  <Text style={[S.dayTabText, isActive && { color: '#fff' }]}>{d}</Text>
                  {count > 0 && (
                    <View style={[S.dayBadge, { backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : C.accent }]}>
                      <Text style={S.dayBadgeText}>{count}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Seçili gün başlığı */}
          <View style={S.activeDayHeader}>
            <Text style={[S.activeDayTitle, { color: C.textPrimary }]}>
              {DAYS[activeDay - 1]}
            </Text>
            <Text style={[S.activeDayCount, { color: C.textSecondary }]}>
              {dayExercises.length} egzersiz
            </Text>
          </View>

          {/* Egzersiz listesi */}
          {dayExercises.length === 0 ? (
            <View style={S.emptyDay}>
              <Text style={{ fontSize: 32 }}>🏋️</Text>
              <Text style={[S.emptyDayText, { color: C.textSecondary }]}>
                Bu gün için egzersiz eklenmemiş
              </Text>
            </View>
          ) : (
            <View style={S.exerciseList}>
              {dayExercises.map((ex, idx) => (
                <View key={ex.id} style={[S.exerciseCard, { backgroundColor: C.card, borderColor: C.border }]}>
                  <View style={S.exNumBadge}>
                    <Text style={S.exNumText}>{idx + 1}</Text>
                  </View>
                  <View style={S.exInfo}>
                    <Text style={[S.exName, { color: C.textPrimary }]}>{ex.name}</Text>
                    <View style={S.exMetaRow}>
                      <MetaChip label={`${ex.sets} set`} C={C} />
                      <MetaChip label={`${ex.reps} tekrar`} C={C} />
                      {ex.weight && <MetaChip label={ex.weight} C={C} />}
                      {ex.rest && <MetaChip label={ex.rest} C={C} />}
                    </View>
                    {ex.notes && (
                      <Text style={[S.exNotes, { color: C.textSecondary }]}>💬 {ex.notes}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={S.deleteExBtn}
                    onPress={() => handleDeleteExercise(ex.id)}
                  >
                    <Icon name="close" size={16} color={C.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Egzersiz ekle butonu */}
          <TouchableOpacity
            style={[S.addExBtn, { borderColor: C.accent }]}
            onPress={() => setShowExModal(true)}
          >
            <Icon name="plus" size={18} color={C.accent} />
            <Text style={[S.addExBtnText, { color: C.accent }]}>
              {DAYS[activeDay - 1]} için Egzersiz Ekle
            </Text>
          </TouchableOpacity>

          {/* Özet */}
          {exercises.length > 0 && (
            <View style={[S.summaryCard, { backgroundColor: C.surface, borderColor: C.border }]}>
              <Text style={[S.summaryTitle, { color: C.textPrimary }]}>Program Özeti</Text>
              {DAYS_SHORT.map((d, i) => {
                const count = exercises.filter((e) => e.day === i + 1).length;
                if (count === 0) return null;
                return (
                  <View key={i} style={S.summaryRow}>
                    <Text style={[S.summaryDay, { color: C.textSecondary }]}>{DAYS[i]}</Text>
                    <Text style={[S.summaryCount, { color: C.accent }]}>{count} egzersiz</Text>
                  </View>
                );
              })}
              <View style={[S.summaryDivider, { backgroundColor: C.border }]} />
              <Text style={[S.summaryTotal, { color: C.textPrimary }]}>
                Toplam: {exercises.length} egzersiz · {weeks} hafta
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Egzersiz Ekleme Modal */}
      <Modal visible={showExModal} transparent animationType="slide">
        <View style={S.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={{ justifyContent: 'flex-end' }}>
              <View style={[S.modal, { backgroundColor: C.card }]}>
                <View style={S.modalHeader}>
                  <Text style={[S.modalTitle, { color: C.textPrimary }]}>
                    Egzersiz Ekle — {DAYS[activeDay - 1]}
                  </Text>
                  <TouchableOpacity onPress={() => setShowExModal(false)}>
                    <Icon name="close" size={22} color={C.textSecondary} />
                  </TouchableOpacity>
                </View>

                <FieldLabel label="Egzersiz Adı *" C={C} />
                <TextInput
                  style={[S.input, { color: C.textPrimary, borderColor: C.border, backgroundColor: C.surface }]}
                  placeholder="Örn: Bench Press, Squat, Deadlift..."
                  placeholderTextColor={C.textSecondary}
                  value={exName}
                  onChangeText={setExName}
                  autoFocus
                />

                <View style={S.row2}>
                  <View style={{ flex: 1 }}>
                    <FieldLabel label="Set Sayısı" C={C} />
                    <TextInput
                      style={[S.input, { color: C.textPrimary, borderColor: C.border, backgroundColor: C.surface }]}
                      keyboardType="number-pad"
                      placeholder="3"
                      placeholderTextColor={C.textSecondary}
                      value={exSets}
                      onChangeText={setExSets}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <FieldLabel label="Tekrar" C={C} />
                    <TextInput
                      style={[S.input, { color: C.textPrimary, borderColor: C.border, backgroundColor: C.surface }]}
                      placeholder="10-12"
                      placeholderTextColor={C.textSecondary}
                      value={exReps}
                      onChangeText={setExReps}
                    />
                  </View>
                </View>

                <View style={S.row2}>
                  <View style={{ flex: 1 }}>
                    <FieldLabel label="Ağırlık (opsiyonel)" C={C} />
                    <TextInput
                      style={[S.input, { color: C.textPrimary, borderColor: C.border, backgroundColor: C.surface }]}
                      placeholder="60 kg"
                      placeholderTextColor={C.textSecondary}
                      value={exWeight}
                      onChangeText={setExWeight}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <FieldLabel label="Dinlenme" C={C} />
                    <TextInput
                      style={[S.input, { color: C.textPrimary, borderColor: C.border, backgroundColor: C.surface }]}
                      placeholder="60 sn"
                      placeholderTextColor={C.textSecondary}
                      value={exRest}
                      onChangeText={setExRest}
                    />
                  </View>
                </View>

                <FieldLabel label="Teknik Not (opsiyonel)" C={C} />
                <TextInput
                  style={[S.input, { color: C.textPrimary, borderColor: C.border, backgroundColor: C.surface, height: 60, textAlignVertical: 'top', paddingTop: 10 }]}
                  placeholder="Duruş, nefes tekniği, dikkat edilecekler..."
                  placeholderTextColor={C.textSecondary}
                  multiline
                  value={exNotes}
                  onChangeText={setExNotes}
                />

                <TouchableOpacity
                  style={[S.addExConfirmBtn, { backgroundColor: C.accent }, !exName.trim() && { opacity: 0.5 }]}
                  onPress={handleAddExercise}
                  disabled={!exName.trim()}
                >
                  <Icon name="plus" size={18} color="#fff" />
                  <Text style={S.addExConfirmText}>Egzersizi Ekle</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <View style={secStyles.row}>
      <Text style={secStyles.icon}>{icon}</Text>
      <Text style={secStyles.title}>{title}</Text>
    </View>
  );
}
const secStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, marginBottom: 8, paddingHorizontal: 2 },
  icon: { fontSize: 18 },
  title: { fontSize: 15, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 },
});

function FieldLabel({ label, C }: { label: string; C: any }) {
  return <Text style={{ ...Typography.caption, color: C.textSecondary, fontWeight: '600', marginBottom: 4, marginTop: 8 }}>{label}</Text>;
}

function MetaChip({ label, C }: { label: string; C: any }) {
  return (
    <View style={{ backgroundColor: C.surface, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 }}>
      <Text style={{ ...Typography.caption, color: C.textSecondary, fontSize: 11 }}>{label}</Text>
    </View>
  );
}

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
    headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { ...Typography.label, color: C.textPrimary, fontWeight: '700' },
    headerSub: { ...Typography.caption, color: C.textSecondary },
    saveBtn: {
      backgroundColor: C.accent,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    saveBtnText: { ...Typography.caption, color: '#fff', fontWeight: '700' },
    scroll: { padding: Spacing.base, paddingBottom: 60 },
    card: {
      backgroundColor: C.card,
      borderRadius: BorderRadius.card,
      borderWidth: 1,
      borderColor: C.border,
      padding: Spacing.base,
    },
    input: {
      borderRadius: 10,
      padding: 12,
      ...Typography.body,
      color: C.textPrimary,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.inputBackground ?? C.surface,
    },
    textarea: { height: 80, textAlignVertical: 'top', paddingTop: 10 },
    textareaLg: { height: 110, textAlignVertical: 'top', paddingTop: 10 },
    weekRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 },
    weekChip: {
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 10,
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
    },
    weekChipText: { ...Typography.bodySmall, color: C.textSecondary, fontWeight: '600' },
    dayTabScroll: { paddingVertical: 8, gap: 8 },
    dayTab: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 12,
      borderWidth: 1.5,
      backgroundColor: C.card,
    },
    dayTabText: { ...Typography.bodySmall, fontWeight: '700', color: C.textSecondary },
    dayBadge: {
      width: 18,
      height: 18,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
    activeDayHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
      marginBottom: 4,
    },
    activeDayTitle: { ...Typography.label, fontWeight: '700' },
    activeDayCount: { ...Typography.caption },
    emptyDay: { alignItems: 'center', paddingVertical: 24, gap: 8 },
    emptyDayText: { ...Typography.bodySmall, textAlign: 'center' },
    exerciseList: { gap: 8 },
    exerciseCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      borderRadius: 12,
      borderWidth: 1,
      padding: 12,
      gap: 10,
    },
    exNumBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: C.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    exNumText: { fontSize: 12, fontWeight: '700', color: '#fff' },
    exInfo: { flex: 1, gap: 5 },
    exName: { ...Typography.label, fontWeight: '700' },
    exMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
    exNotes: { ...Typography.caption, fontStyle: 'italic' },
    deleteExBtn: { padding: 4, marginTop: 2 },
    addExBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderRadius: 12,
      padding: 14,
      marginTop: 10,
    },
    addExBtnText: { ...Typography.label, fontWeight: '700' },
    summaryCard: {
      borderRadius: BorderRadius.card,
      borderWidth: 1,
      padding: Spacing.base,
      marginTop: 20,
      gap: 6,
    },
    summaryTitle: { ...Typography.label, fontWeight: '700', marginBottom: 4 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
    summaryDay: { ...Typography.bodySmall },
    summaryCount: { ...Typography.bodySmall, fontWeight: '600' },
    summaryDivider: { height: 1, marginVertical: 6 },
    summaryTotal: { ...Typography.label, fontWeight: '700' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modal: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: Spacing.base,
      paddingBottom: 40,
      gap: 4,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    modalTitle: { ...Typography.h3 },
    row2: { flexDirection: 'row', gap: 10 },
    addExConfirmBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 14,
      padding: 15,
      marginTop: 12,
    },
    addExConfirmText: { ...Typography.label, color: '#fff', fontWeight: '700' },
  });
}
