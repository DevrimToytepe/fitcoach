import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar,
  TouchableOpacity, Image, TextInput, Alert, Modal,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useDashboardStore } from '../../store/dashboardStore';
import { uploadGalleryImage } from '../../utils/upload';
import { useAuthStore } from '../../store/authStore';
import { useColors } from '../../constants/colors';
import GalleryGrid from '../../components/pt/GalleryGrid';
import Icon from '../../components/common/Icon';
import { showToast } from '../../components/common/Toast';
import { Typography, Spacing, BorderRadius } from '../../constants/typography';

export default function GalleryManagerScreen() {
  const navigation = useNavigation();
  const C = useColors();
  const { gallery, addGalleryItem, removeGalleryItem, loadDashboard } = useDashboardStore();
  const user = useAuthStore((s) => s.user);

  const [showAddModal, setShowAddModal] = useState(false);
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [studentName, setStudentName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  // Ekrana ilk girildiğinde galeriyi yükle
  useEffect(() => {
    if (gallery.length === 0) loadDashboard();
  }, []);

  const pickImage = async (type: 'before' | 'after') => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!res.canceled) {
      if (type === 'before') setBeforeImage(res.assets[0].uri);
      else setAfterImage(res.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!beforeImage || !afterImage) {
      showToast('Önce ve sonra fotoğraflarını seçin', 'warning');
      return;
    }
    if (!studentName.trim()) {
      showToast('Öğrenci adı girin', 'warning');
      return;
    }
    if (!user) return;

    setIsSaving(true);
    try {
      // Önce fotoğrafı yükle
      setUploadProgress('Önce fotoğrafı yükleniyor...');
      const uploadedBefore = await uploadGalleryImage(user.id, beforeImage, 'before');
      if (!uploadedBefore) throw new Error('Önce fotoğrafı yüklenemedi. Supabase "gallery" bucket\'ının public ve mevcut olduğundan emin olun.');

      setUploadProgress('Sonra fotoğrafı yükleniyor...');
      const uploadedAfter = await uploadGalleryImage(user.id, afterImage, 'after');
      if (!uploadedAfter) throw new Error('Sonra fotoğrafı yüklenemedi.');

      setUploadProgress('Kaydediliyor...');
      await addGalleryItem({
        beforeImage: uploadedBefore,
        afterImage: uploadedAfter,
        studentName: studentName.trim(),
        description: description.trim() || 'Dönüşüm programı',
      });

      resetModal();
      showToast('Galeri öğesi eklendi! ✓', 'success');
    } catch (err: any) {
      console.error('Gallery upload error:', err?.message);
      showToast(err?.message ?? 'Yükleme başarısız. Bağlantıyı kontrol edin.', 'error');
    } finally {
      setIsSaving(false);
      setUploadProgress('');
    }
  };

  const resetModal = () => {
    setShowAddModal(false);
    setBeforeImage(null);
    setAfterImage(null);
    setStudentName('');
    setDescription('');
  };

  const handleDelete = (id: string) => {
    Alert.alert('Sil', 'Bu galeri öğesini silmek istiyor musunuz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive',
        onPress: async () => {
          await removeGalleryItem(id);
          showToast('Galeri öğesi silindi', 'info');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.background }}>
      <StatusBar barStyle="light-content" backgroundColor={C.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.card, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow_left" size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: C.textPrimary }]}>Galeri Yönetimi</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: C.accent }]}
          onPress={() => setShowAddModal(true)}
        >
          <Icon name="plus" size={16} color="#fff" />
          <Text style={styles.addBtnText}>Ekle</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {gallery.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIconBox, { backgroundColor: C.card }]}>
              <Icon name="gallery" size={40} color={C.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: C.textPrimary }]}>Galerin boş</Text>
            <Text style={[styles.emptyText, { color: C.textSecondary }]}>
              Öğrencilerinin dönüşüm fotoğraflarını ekleyerek başarı hikayelerini paylaş
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: C.accent }]}
              onPress={() => setShowAddModal(true)}
            >
              <Icon name="plus" size={16} color="#fff" />
              <Text style={styles.emptyBtnText}>İlk Öğeyi Ekle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <GalleryGrid items={gallery} onDelete={handleDelete} showDelete />
        )}
      </ScrollView>

      {/* Ekle Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={resetModal}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={[styles.modal, { backgroundColor: C.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: C.textPrimary }]}>Dönüşüm Ekle</Text>
                <TouchableOpacity onPress={resetModal}>
                  <Icon name="close" size={22} color={C.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Fotoğraf seçiciler */}
              <View style={styles.imageRow}>
                <ImagePickerBox
                  label="Önce"
                  uri={beforeImage}
                  onPress={() => pickImage('before')}
                  C={C}
                />
                <View style={styles.arrowBox}>
                  <Text style={[styles.arrowText, { color: C.textSecondary }]}>→</Text>
                </View>
                <ImagePickerBox
                  label="Sonra"
                  uri={afterImage}
                  onPress={() => pickImage('after')}
                  C={C}
                />
              </View>

              <TextInput
                style={[styles.input, { backgroundColor: C.inputBackground, color: C.textPrimary, borderColor: C.border }]}
                placeholder="Öğrenci adı *"
                placeholderTextColor={C.textSecondary}
                value={studentName}
                onChangeText={setStudentName}
              />
              <TextInput
                style={[styles.input, styles.descInput, { backgroundColor: C.inputBackground, color: C.textPrimary, borderColor: C.border }]}
                placeholder="Açıklama (opsiyonel)"
                placeholderTextColor={C.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={2}
              />

              {/* Yükleme durumu */}
              {isSaving && uploadProgress ? (
                <View style={styles.progressRow}>
                  <ActivityIndicator size="small" color={C.accent} />
                  <Text style={[styles.progressText, { color: C.textSecondary }]}>{uploadProgress}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: isSaving ? C.border : C.accent }]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="check" size={18} color="#fff" />
                    <Text style={styles.saveBtnText}>Kaydet</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ImagePickerBox({ label, uri, onPress, C }: {
  label: string; uri: string | null; onPress: () => void; C: any;
}) {
  return (
    <TouchableOpacity
      style={[styles.pickerBox, { borderColor: uri ? C.accent : C.border, backgroundColor: C.surface }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {uri ? (
        <>
          <Image source={{ uri }} style={styles.pickedImage} resizeMode="cover" />
          <View style={styles.pickerLabelOverlay}>
            <Text style={styles.pickerLabel}>{label}</Text>
          </View>
        </>
      ) : (
        <View style={styles.pickerEmpty}>
          <Icon name="camera" size={28} color={C.textSecondary} />
          <Text style={[styles.pickerEmptyLabel, { color: C.textSecondary }]}>{label}</Text>
          <Text style={[styles.pickerEmptyHint, { color: C.textSecondary }]}>Dokun</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingVertical: 12,
    borderBottomWidth: 1, gap: 12,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { ...Typography.h3, flex: 1 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  addBtnText: { ...Typography.label, color: '#fff', fontWeight: '700' },
  scroll: { padding: Spacing.base, paddingBottom: 40, flexGrow: 1 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 14 },
  emptyIconBox: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { ...Typography.h3 },
  emptyText: { ...Typography.body, textAlign: 'center', maxWidth: 280, lineHeight: 24 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20,
  },
  emptyBtnText: { ...Typography.label, color: '#fff', fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modal: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.base, paddingBottom: 40, gap: 12,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { ...Typography.h3 },
  imageRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pickerBox: {
    flex: 1, aspectRatio: 1, borderRadius: 14, overflow: 'hidden',
    borderWidth: 2, borderStyle: 'dashed',
  },
  pickedImage: { width: '100%', height: '100%' },
  pickerLabelOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', padding: 4, alignItems: 'center',
  },
  pickerLabel: { fontSize: 10, color: '#fff', fontWeight: '700' },
  pickerEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, padding: 8 },
  pickerEmptyLabel: { ...Typography.label, fontWeight: '700' },
  pickerEmptyHint: { ...Typography.caption },
  arrowBox: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  arrowText: { fontSize: 22 },
  input: {
    borderRadius: 12, padding: 12,
    ...Typography.body, borderWidth: 1,
  },
  descInput: { minHeight: 70, textAlignVertical: 'top' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressText: { ...Typography.bodySmall },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 14, borderRadius: 14, gap: 8,
  },
  saveBtnText: { ...Typography.label, color: '#fff', fontWeight: '700' },
});
