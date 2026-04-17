import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar,
  TouchableOpacity, Image, KeyboardAvoidingView, Platform, Alert,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import { useColors } from '../../constants/colors';
import { uploadAvatar, uploadProfilePhoto } from '../../utils/upload';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Icon from '../../components/common/Icon';
import { showToast } from '../../components/common/Toast';
import { Typography, Spacing, BorderRadius } from '../../constants/typography';
import { PT, Specialization, CoachingPackage } from '../../types';
import { getSpecializationLabel, formatPrice } from '../../utils/helpers';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - Spacing.base * 2 - 8 * 3) / 4;

const ALL_SPECS: Specialization[] = [
  'weight_loss', 'muscle_gain', 'functional', 'yoga', 'pilates', 'nutrition', 'rehabilitation',
];

const PACKAGE_COLORS: Record<string, { border: string; label: string }> = {
  starter:      { border: '#3B82F6', label: '#3B82F6' },
  intermediate: { border: '#10B981', label: '#10B981' },
  professional: { border: '#F97316', label: '#F97316' },
};

const schema = z.object({
  firstName:      z.string().min(2, 'En az 2 karakter'),
  lastName:       z.string().min(2, 'En az 2 karakter'),
  bio:            z.string().min(10, 'En az 10 karakter').max(600),
  background:     z.string().max(800).optional().or(z.literal('')),
  philosophy:     z.string().max(400).optional().or(z.literal('')),
  instagram:      z.string().max(50).optional().or(z.literal('')),
  youtube:        z.string().max(100).optional().or(z.literal('')),
  certificates:   z.string().min(3, 'En az 3 karakter'),
  experienceYears: z.number().min(0).max(50),
  specializations: z
    .array(z.enum(['weight_loss', 'muscle_gain', 'functional', 'yoga', 'pilates', 'nutrition', 'rehabilitation']))
    .min(1, 'En az bir uzmanlık seç'),
});
type FormData = z.infer<typeof schema>;

const SECTIONS = ['Temel Bilgiler', 'Biyografi', 'Fotoğraflar', 'Paketler'] as const;
type Section = typeof SECTIONS[number];

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const C = useColors();
  const { user, updateSupabaseProfile, updateUser } = useAuthStore();
  const pt = user as PT;

  const [activeSection, setActiveSection] = useState<Section>('Temel Bilgiler');
  const [avatar, setAvatar] = useState<string | undefined>(pt?.avatar);
  const [profilePhotos, setProfilePhotos] = useState<string[]>(pt?.profilePhotos ?? []);
  const [isSaving, setIsSaving] = useState(false);
  const [packages, setPackages] = useState<CoachingPackage[]>(pt?.packages ?? []);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName:       pt?.firstName ?? '',
      lastName:        pt?.lastName ?? '',
      bio:             pt?.bio ?? '',
      background:      pt?.background ?? '',
      philosophy:      pt?.philosophy ?? '',
      instagram:       pt?.instagram ?? '',
      youtube:         pt?.youtube ?? '',
      certificates:    pt?.certificates ?? '',
      experienceYears: pt?.experienceYears ?? 0,
      specializations: pt?.specializations ?? [],
    },
  });

  const bioValue = watch('bio');
  const bgValue  = watch('background');
  const phValue  = watch('philosophy');

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadingPhotoIndex, setUploadingPhotoIndex] = useState<number | null>(null);

  const pickAvatar = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (res.canceled || !pt) return;

    const localUri = res.assets[0].uri;
    setAvatar(localUri); // önce local göster
    setIsUploadingAvatar(true);
    try {
      const uploaded = await uploadAvatar(pt.id, localUri);
      if (!uploaded) {
        showToast('Avatar yüklenemedi', 'error');
        return;
      }
      const { supabase } = await import('../../lib/supabase');
      const { error } = await supabase.from('profiles').update({ avatar: uploaded }).eq('id', pt.id);
      if (error) {
        showToast('Avatar kaydedilemedi: ' + error.message, 'error');
        return;
      }
      setAvatar(uploaded);
      updateUser({ avatar: uploaded } as any);
      showToast('Profil fotoğrafı güncellendi ✓', 'success');
    } catch (e: any) {
      showToast('Hata: ' + (e?.message ?? 'bilinmiyor'), 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const pickProfilePhoto = async (index: number) => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (res.canceled || !pt) return;

    const localUri = res.assets[0].uri;
    // Önce local URI'yi göster
    const preview = [...profilePhotos];
    while (preview.length <= index) preview.push('');
    preview[index] = localUri;
    setProfilePhotos([...preview]);

    setUploadingPhotoIndex(index);
    try {
      const uploaded = await uploadProfilePhoto(pt.id, localUri, index);
      if (!uploaded) {
        showToast(`Fotoğraf ${index + 1} yüklenemedi`, 'error');
        return;
      }
      // Yüklenen URL ile güncelle
      const updated = [...preview];
      updated[index] = uploaded;
      setProfilePhotos([...updated]);

      // Hemen DB'ye kaydet
      const finalPhotos = updated.filter(Boolean);
      const { error } = await (await import('../../lib/supabase')).supabase
        .from('pt_profiles')
        .update({ profile_photos: finalPhotos })
        .eq('id', pt.id);
      if (error) {
        showToast('Fotoğraf kaydedilemedi: ' + error.message, 'error');
        return;
      }
      updateUser({ profilePhotos: finalPhotos } as any);
      showToast(`Fotoğraf ${index + 1} kaydedildi ✓`, 'success');
    } catch (e: any) {
      showToast('Hata: ' + (e?.message ?? 'bilinmiyor'), 'error');
    } finally {
      setUploadingPhotoIndex(null);
    }
  };

  const removeProfilePhoto = (index: number) => {
    const updated = [...profilePhotos];
    updated.splice(index, 1);
    setProfilePhotos(updated);
  };

  const updatePackagePrice    = (pkgId: string, price: number) =>
    setPackages((prev) => prev.map((p) => p.id === pkgId ? { ...p, price } : p));
  const updatePackageFeatures = (pkgId: string, featuresStr: string) => {
    const features = featuresStr.split(',').map((f) => f.trim()).filter(Boolean);
    setPackages((prev) => prev.map((p) => p.id === pkgId ? { ...p, features } : p));
  };

  // Fotoğraflar tabı için bağımsız kaydetme (form validasyonu gerektirmez)
  const savePhotos = async () => {
    if (!pt) return;
    setIsSaving(true);
    try {
      const finalPhotos: string[] = [];
      for (let i = 0; i < profilePhotos.length; i++) {
        const uri = profilePhotos[i];
        if (!uri) continue;
        if (uri.startsWith('file://') || uri.startsWith('ph://')) {
          showToast(`Fotoğraf ${i + 1} yükleniyor...`, 'info');
          const uploaded = await uploadProfilePhoto(pt.id, uri, i);
          if (uploaded) {
            finalPhotos.push(uploaded);
          } else {
            showToast(`Fotoğraf ${i + 1} yüklenemedi`, 'error');
          }
        } else if (uri.startsWith('http')) {
          finalPhotos.push(uri);
        }
      }

      await updateSupabaseProfile({ profilePhotos: finalPhotos } as Partial<PT>);
      setProfilePhotos(finalPhotos);
      showToast('Fotoğraflar kaydedildi! ✓', 'success');
    } catch (err) {
      showToast('Kaydetme başarısız', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!pt) return;
    setIsSaving(true);
    try {
      // Avatar yükle
      let finalAvatar = avatar;
      if (avatar && avatar !== pt.avatar && (avatar.startsWith('file://') || avatar.startsWith('ph://'))) {
        const uploaded = await uploadAvatar(pt.id, avatar);
        if (uploaded) finalAvatar = uploaded;
      }

      // Profil fotoğraflarını yükle
      const finalPhotos: string[] = [];
      for (let i = 0; i < profilePhotos.length; i++) {
        const uri = profilePhotos[i];
        if (!uri) continue;
        if (uri.startsWith('file://') || uri.startsWith('ph://')) {
          const uploaded = await uploadProfilePhoto(pt.id, uri, i);
          if (uploaded) finalPhotos.push(uploaded);
        } else if (uri.startsWith('http')) {
          finalPhotos.push(uri);
        }
      }

      // Paketleri güncelle
      const { supabase } = await import('../../lib/supabase');
      for (const pkg of packages) {
        await supabase
          .from('pt_packages')
          .update({ price: pkg.price, features: pkg.features })
          .eq('id', pkg.id);
      }

      await updateSupabaseProfile({
        ...data,
        avatar: finalAvatar,
        profilePhotos: finalPhotos,
        packages,
      } as Partial<PT>);

      showToast('Profil güncellendi!', 'success');
      navigation.goBack();
    } catch (err) {
      showToast('Güncelleme başarısız', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const S = makeStyles(C);

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.background} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

        {/* Header */}
        <View style={S.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}>
            <Icon name="arrow_left" size={22} color={C.textPrimary} />
          </TouchableOpacity>
          <Text style={S.headerTitle}>Profili Düzenle</Text>
          <TouchableOpacity onPress={handleSubmit(onSubmit)} style={S.saveBtn} disabled={isSaving}>
            <Text style={S.saveBtnText}>{isSaving ? '...' : 'Kaydet'}</Text>
          </TouchableOpacity>
        </View>

        {/* Sekme seçici */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.tabBar} contentContainerStyle={S.tabBarContent}>
          {SECTIONS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[S.tab, activeSection === s && S.tabActive]}
              onPress={() => setActiveSection(s)}
            >
              <Text style={[S.tabText, activeSection === s && S.tabTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView contentContainerStyle={S.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── Temel Bilgiler ─────────────────────────────── */}
          {activeSection === 'Temel Bilgiler' && (
            <View style={S.section}>
              {/* Avatar */}
              <TouchableOpacity style={S.avatarSection} onPress={pickAvatar} disabled={isUploadingAvatar}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={S.avatarImg} resizeMode="cover" />
                ) : (
                  <View style={[S.avatarPlaceholder, { backgroundColor: C.surface }]}>
                    <Icon name="camera" size={32} color={C.textSecondary} />
                  </View>
                )}
                <View style={S.avatarOverlay}>
                  <Text style={S.avatarOverlayText}>{isUploadingAvatar ? 'Yükleniyor...' : 'Değiştir'}</Text>
                </View>
              </TouchableOpacity>
              <Text style={[S.avatarHint, { color: C.textSecondary }]}>Profil fotoğrafına dokun</Text>

              <View style={S.row}>
                <Controller control={control} name="firstName" render={({ field }) => (
                  <Input label="Ad" value={field.value} onChangeText={field.onChange} error={errors.firstName?.message} containerStyle={{ flex: 1 }} />
                )} />
                <Controller control={control} name="lastName" render={({ field }) => (
                  <Input label="Soyad" value={field.value} onChangeText={field.onChange} error={errors.lastName?.message} containerStyle={{ flex: 1 }} />
                )} />
              </View>

              <Controller control={control} name="experienceYears" render={({ field }) => (
                <Input label="Deneyim Yılı" keyboardType="number-pad"
                  value={field.value?.toString()} onChangeText={(v) => field.onChange(parseInt(v) || 0)}
                  error={errors.experienceYears?.message} />
              )} />

              <Controller control={control} name="certificates" render={({ field }) => (
                <Input label="Sertifikalar & Başarılar" multiline numberOfLines={3}
                  textAlignVertical="top" value={field.value} onChangeText={field.onChange}
                  error={errors.certificates?.message} style={{ height: 80, paddingTop: 10 }} />
              )} />

              {/* Uzmanlıklar */}
              <Controller control={control} name="specializations" render={({ field }) => (
                <View style={S.specSection}>
                  <Text style={[S.fieldLabel, { color: C.textSecondary }]}>Uzmanlık Alanları</Text>
                  <View style={S.chips}>
                    {ALL_SPECS.map((spec) => {
                      const sel = field.value.includes(spec);
                      return (
                        <TouchableOpacity
                          key={spec}
                          style={[S.chip, { borderColor: sel ? C.accent : C.border, backgroundColor: sel ? C.accent : C.surface }]}
                          onPress={() => {
                            if (sel) field.onChange(field.value.filter((s: Specialization) => s !== spec));
                            else field.onChange([...field.value, spec]);
                          }}
                        >
                          <Text style={[S.chipTxt, { color: sel ? '#fff' : C.textSecondary }]}>
                            {getSpecializationLabel(spec)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {errors.specializations && <Text style={S.error}>{errors.specializations.message}</Text>}
                </View>
              )} />

              {/* Sosyal Medya */}
              <View style={S.socialSection}>
                <Text style={[S.fieldLabel, { color: C.textSecondary }]}>Sosyal Medya</Text>
                <Controller control={control} name="instagram" render={({ field }) => (
                  <Input label="Instagram Kullanıcı Adı" placeholder="kullanici_adi"
                    value={field.value} onChangeText={field.onChange} />
                )} />
                <Controller control={control} name="youtube" render={({ field }) => (
                  <Input label="YouTube Kanalı" placeholder="Kanal adı veya URL"
                    value={field.value} onChangeText={field.onChange} />
                )} />
              </View>
            </View>
          )}

          {/* ── Biyografi ──────────────────────────────────── */}
          {activeSection === 'Biyografi' && (
            <View style={S.section}>
              <SectionInfo
                title="Kısa Biyografi"
                desc="PT kartında görünür. Seni özetleyen bir tanıtım yaz."
                C={C}
              />
              <Controller control={control} name="bio" render={({ field }) => (
                <View>
                  <View style={S.charCountRow}>
                    <Text style={[S.fieldLabel, { color: C.textSecondary }]}>Biyografi *</Text>
                    <Text style={[S.charCount, { color: C.textSecondary }]}>{bioValue?.length ?? 0}/600</Text>
                  </View>
                  <Input placeholder="Kendini tanıt..." multiline numberOfLines={4} maxLength={600}
                    textAlignVertical="top" value={field.value} onChangeText={field.onChange}
                    error={errors.bio?.message} style={{ height: 120, paddingTop: 12 }} />
                </View>
              )} />

              <View style={[S.divider, { backgroundColor: C.border }]} />

              <SectionInfo
                title="Özgeçmiş & Geçmiş"
                desc="Eğitim, kariyer geçmişin ve profesyonel deneyimin."
                C={C}
              />
              <Controller control={control} name="background" render={({ field }) => (
                <View>
                  <View style={S.charCountRow}>
                    <Text style={[S.fieldLabel, { color: C.textSecondary }]}>Özgeçmiş</Text>
                    <Text style={[S.charCount, { color: C.textSecondary }]}>{bgValue?.length ?? 0}/800</Text>
                  </View>
                  <Input placeholder="Eğitim, kariyer, deneyim..." multiline numberOfLines={5}
                    maxLength={800} textAlignVertical="top" value={field.value}
                    onChangeText={field.onChange} style={{ height: 140, paddingTop: 12 }} />
                </View>
              )} />

              <View style={[S.divider, { backgroundColor: C.border }]} />

              <SectionInfo
                title="Antrenman Felsefem"
                desc="Sporcularına nasıl yaklaşıyorsun? Metodolojin nedir?"
                C={C}
              />
              <Controller control={control} name="philosophy" render={({ field }) => (
                <View>
                  <View style={S.charCountRow}>
                    <Text style={[S.fieldLabel, { color: C.textSecondary }]}>Felsefe & Yaklaşım</Text>
                    <Text style={[S.charCount, { color: C.textSecondary }]}>{phValue?.length ?? 0}/400</Text>
                  </View>
                  <Input placeholder="Antrenman metodun, sporcuya yaklaşımın..." multiline
                    numberOfLines={4} maxLength={400} textAlignVertical="top"
                    value={field.value} onChangeText={field.onChange}
                    style={{ height: 110, paddingTop: 12 }} />
                </View>
              )} />
            </View>
          )}

          {/* ── Fotoğraflar ────────────────────────────────── */}
          {activeSection === 'Fotoğraflar' && (
            <View style={S.section}>
              <SectionInfo
                title="Kişisel Fotoğraflarım"
                desc="Profilinde gösterilecek 8 adede kadar kişisel fotoğraf ekle. Antrenman, lifestyle veya tanıtım fotoğrafları olabilir."
                C={C}
              />
              <View style={S.photosGrid}>
                {Array.from({ length: 8 }).map((_, i) => {
                  const uri = profilePhotos[i];
                  const isUploading = uploadingPhotoIndex === i;
                  return (
                    <View key={i} style={{ position: 'relative' }}>
                      <TouchableOpacity onPress={() => !isUploading && pickProfilePhoto(i)} disabled={isUploading}>
                        {uri ? (
                          <Image
                            source={{ uri }}
                            style={[S.photoThumb, { width: PHOTO_SIZE, height: PHOTO_SIZE }]}
                          />
                        ) : (
                          <View style={[S.photoEmpty, { width: PHOTO_SIZE, height: PHOTO_SIZE, backgroundColor: C.surface, borderColor: C.border }]}>
                            <Icon name="plus" size={22} color={C.textSecondary} />
                            <Text style={[S.photoEmptyText, { color: C.textSecondary }]}>{i + 1}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                      {isUploading && (
                        <View style={[S.photoUploadingOverlay, { width: PHOTO_SIZE, height: PHOTO_SIZE }]}>
                          <Text style={{ color: '#fff', fontSize: 10 }}>Yükleniyor</Text>
                        </View>
                      )}
                      {uri && !isUploading && (
                        <TouchableOpacity
                          style={S.photoRemoveBtn}
                          onPress={() => removeProfilePhoto(i)}
                        >
                          <Icon name="close" size={12} color="#fff" />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
              <Text style={[S.photoHint, { color: C.textSecondary }]}>
                {profilePhotos.filter(Boolean).length}/8 fotoğraf yüklendi
              </Text>
            </View>
          )}

          {/* ── Paketler ───────────────────────────────────── */}
          {activeSection === 'Paketler' && (
            <View style={S.section}>
              {packages.length === 0 ? (
                <View style={S.emptyPackages}>
                  <Icon name="package" size={36} color={C.textSecondary} />
                  <Text style={[S.emptyPackagesText, { color: C.textSecondary }]}>
                    Henüz paket eklenmemiş
                  </Text>
                </View>
              ) : (
                packages.map((pkg) => {
                  const pc = PACKAGE_COLORS[pkg.level] ?? PACKAGE_COLORS.starter;
                  const isEditing = editingPackageId === pkg.id;
                  return (
                    <View key={pkg.id} style={[S.packageCard, { backgroundColor: C.surface, borderColor: C.border, borderLeftColor: pc.border }]}>
                      <TouchableOpacity
                        style={S.packageHeader}
                        onPress={() => setEditingPackageId(isEditing ? null : pkg.id)}
                      >
                        <View style={S.packageTitleRow}>
                          <View style={[S.dot, { backgroundColor: pc.label }]} />
                          <Text style={[S.packageName, { color: pc.label }]}>{pkg.name}</Text>
                          <Text style={[S.packageDuration, { color: C.textSecondary }]}>
                            {pkg.durationWeeks} hf · {pkg.sessionsPerWeek}x/hf
                          </Text>
                        </View>
                        <View style={S.packageRight}>
                          <Text style={[S.packagePrice, { color: pc.label }]}>{formatPrice(pkg.price)}</Text>
                          <Icon name={isEditing ? 'close' : 'edit'} size={16} color={C.textSecondary} />
                        </View>
                      </TouchableOpacity>

                      {isEditing && (
                        <View style={[S.packageEdit, { borderTopColor: C.border }]}>
                          <Input label="Fiyat (₺)" keyboardType="number-pad"
                            value={pkg.price.toString()}
                            onChangeText={(v) => updatePackagePrice(pkg.id, parseInt(v) || 0)} />
                          <Input label="Özellikler (virgülle ayır)" multiline numberOfLines={3}
                            textAlignVertical="top" value={pkg.features.join(', ')}
                            onChangeText={(v) => updatePackageFeatures(pkg.id, v)}
                            style={{ height: 80, paddingTop: 8 }} />
                        </View>
                      )}
                    </View>
                  );
                })
              )}

              <Button title="Kaydet" onPress={handleSubmit(onSubmit)} isLoading={isSaving} style={{ marginTop: 16 }} />
            </View>
          )}

          {/* Sekmeye göre Kaydet */}
          {activeSection === 'Fotoğraflar' ? (
            <Button title="Fotoğrafları Kaydet" onPress={savePhotos} isLoading={isSaving} style={{ marginHorizontal: Spacing.base, marginTop: 8 }} />
          ) : (activeSection === 'Temel Bilgiler' || activeSection === 'Biyografi') ? (
            <Button title="Kaydet" onPress={handleSubmit(onSubmit)} isLoading={isSaving} style={{ marginHorizontal: Spacing.base, marginTop: 8 }} />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SectionInfo({ title, desc, C }: { title: string; desc: string; C: any }) {
  return (
    <View style={{ gap: 4, marginBottom: 4 }}>
      <Text style={{ ...Typography.label, color: C.textPrimary }}>{title}</Text>
      <Text style={{ ...Typography.caption, color: C.textSecondary, lineHeight: 18 }}>{desc}</Text>
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
    backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { ...Typography.h3, color: C.textPrimary },
    saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: C.accent },
    saveBtnText: { ...Typography.label, color: '#fff', fontWeight: '700' },
    tabBar: { backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border, flexGrow: 0 },
    tabBarContent: { paddingHorizontal: Spacing.base, gap: 0 },
    tab: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabActive: { borderBottomColor: C.accent },
    tabText: { ...Typography.bodySmall, color: C.textSecondary, fontWeight: '600' },
    tabTextActive: { color: C.accent },
    scroll: { paddingBottom: 60 },
    section: { padding: Spacing.base, gap: 16 },
    row: { flexDirection: 'row', gap: 10 },
    avatarSection: { width: 100, height: 100, borderRadius: 50, overflow: 'hidden', alignSelf: 'center' },
    avatarImg: { width: '100%', height: '100%' },
    avatarPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    avatarOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', padding: 4, alignItems: 'center' },
    avatarOverlayText: { fontSize: 10, color: '#fff', fontWeight: '600' },
    avatarHint: { textAlign: 'center', ...Typography.caption },
    specSection: { gap: 10 },
    fieldLabel: { ...Typography.caption, fontWeight: '700' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
    chipTxt: { ...Typography.caption, fontWeight: '600' },
    error: { ...Typography.caption, color: C.error },
    socialSection: { gap: 8 },
    divider: { height: 1 },
    charCountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    charCount: { ...Typography.caption },
    photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
    photoThumb: { borderRadius: 10, backgroundColor: '#333' },
    photoEmpty: { borderRadius: 10, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 2 },
    photoEmptyText: { fontSize: 10, fontWeight: '600' },
    photoRemoveBtn: {
      position: 'absolute', top: 4, right: 4,
      backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: 3,
    },
    photoUploadingOverlay: {
      position: 'absolute', top: 0, left: 0,
      backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
    },
    photoHint: { ...Typography.caption, textAlign: 'center' },
    emptyPackages: { alignItems: 'center', paddingVertical: 32, gap: 8 },
    emptyPackagesText: { ...Typography.body },
    packageCard: {
      borderRadius: 14, borderWidth: 1, borderLeftWidth: 4, overflow: 'hidden',
    },
    packageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base },
    packageTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    packageName: { ...Typography.label, fontWeight: '700' },
    packageDuration: { ...Typography.caption },
    packageRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    packagePrice: { ...Typography.label, fontWeight: '800' },
    packageEdit: { padding: Spacing.base, paddingTop: 0, gap: 8, borderTopWidth: 1 },
  });
}
