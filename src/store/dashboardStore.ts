import { create } from 'zustand';
import { Athlete, CoachingRequest, GalleryItem, StudentProgram, ProgramExercise, BodyAnalysis } from '../types';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';
import { usePTStore } from './ptStore';
import { useMessageStore } from './messageStore';
import { generateUUID } from '../utils/uuid';

interface DashboardState {
  myStudents: Athlete[];
  pendingRequests: CoachingRequest[];
  gallery: GalleryItem[];
  programs: StudentProgram[];
  bodyAnalyses: BodyAnalysis[];
  isLoading: boolean;
  loadDashboard: () => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  rejectRequest: (requestId: string) => Promise<void>;
  addGalleryItem: (item: Omit<GalleryItem, 'id' | 'createdAt'>) => Promise<void>;
  removeGalleryItem: (id: string) => Promise<void>;
  removeStudent: (athleteId: string) => Promise<void>;
  // Program yönetimi
  loadPrograms: (athleteId?: string) => Promise<void>;
  createProgram: (data: Omit<StudentProgram, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateProgram: (id: string, data: Partial<StudentProgram>) => Promise<void>;
  deleteProgram: (id: string) => Promise<void>;
  getStudentPrograms: (athleteId: string) => StudentProgram[];
  // Vücut analizi (PT tarafı)
  loadBodyAnalyses: (athleteId: string) => Promise<void>;
  addPTComment: (analysisId: string, comment: string) => Promise<void>;
  getStudentBodyAnalyses: (athleteId: string) => BodyAnalysis[];
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  myStudents: [],
  pendingRequests: [],
  gallery: [],
  programs: [],
  bodyAnalyses: [],
  isLoading: false,

  loadDashboard: async () => {
    const user = useAuthStore.getState().user;
    if (!user || user.userType !== 'pt') return;
    set({ isLoading: true });

    try {
      // 1. Öğrencileri çek
      const { data: studentLinks } = await supabase
        .from('pt_students')
        .select('athlete_id')
        .eq('pt_id', user.id);

      const studentIds = (studentLinks ?? []).map((s) => s.athlete_id);
      let students: Athlete[] = [];

      if (studentIds.length > 0) {
        const [{ data: studentProfiles }, { data: athleteProfiles }] = await Promise.all([
          supabase.from('profiles').select('*').in('id', studentIds),
          supabase.from('athlete_profiles').select('*').in('id', studentIds),
        ]);

        const apMap = new Map((athleteProfiles ?? []).map((ap) => [ap.id, ap]));

        students = (studentProfiles ?? []).map((p) => {
          const ap = apMap.get(p.id);
          return {
            id: p.id,
            email: p.email,
            firstName: p.first_name,
            lastName: p.last_name,
            userType: 'athlete' as const,
            avatar:
              p.avatar ??
              `https://ui-avatars.com/api/?name=${p.first_name}+${p.last_name}&background=0EA5E9&color=fff&size=200`,
            createdAt: new Date(p.created_at),
            age: ap?.age ?? 25,
            gender: ap?.gender ?? 'male',
            fitnessGoal: ap?.fitness_goal ?? 'stay_fit',
            experienceLevel: ap?.experience_level ?? 'beginner',
            activePTId: user.id,
          } as Athlete;
        });
      }

      // 2. Bekleyen talepleri çek
      const { data: requests } = await supabase
        .from('coaching_requests')
        .select('*')
        .eq('pt_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      const pending: CoachingRequest[] = (requests ?? []).map((r) => ({
        id: r.id,
        athleteId: r.athlete_id,
        athleteName: r.athlete_name ?? '',
        athleteAvatar: r.athlete_avatar ?? '',
        ptId: r.pt_id,
        packageId: r.package_id ?? '',
        packageName: r.package_name ?? '',
        status: r.status,
        createdAt: new Date(r.created_at),
      }));

      // 3. Gallery çek
      const { data: galleryData } = await supabase
        .from('gallery_items')
        .select('*')
        .eq('pt_id', user.id)
        .order('created_at', { ascending: false });

      const gallery: GalleryItem[] = (galleryData ?? []).map((g) => ({
        id: g.id,
        beforeImage: g.before_image ?? '',
        afterImage: g.after_image ?? '',
        description: g.description ?? '',
        studentName: g.student_name ?? '',
        createdAt: new Date(g.created_at),
      }));

      set({ myStudents: students, pendingRequests: pending, gallery, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  acceptRequest: async (requestId: string) => {
    const { pendingRequests } = get();
    const request = pendingRequests.find((r) => r.id === requestId);
    if (!request) return;

    // 1. Talebi güncelle
    await supabase
      .from('coaching_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    // 2. PT-student ilişkisi kur
    await supabase
      .from('pt_students')
      .upsert({ pt_id: request.ptId, athlete_id: request.athleteId });

    // 3. Athlete'in active_pt_id'sini güncelle
    await supabase
      .from('athlete_profiles')
      .update({
        active_pt_id: request.ptId,
        active_package_id: request.packageId ?? null,
      })
      .eq('id', request.athleteId);

    // 4. Konuşma oluştur + sistem mesajı at
    const conversationId = await useMessageStore
      .getState()
      .getOrCreateConversation(request.athleteId, request.ptId);

    await useMessageStore
      .getState()
      .sendSystemMessage(
        conversationId,
        `Koçluk ilişkisi başladı! ${new Date().toLocaleDateString('tr-TR')}`,
      );

    // 5. Athlete'e bildirim gönder
    const user = useAuthStore.getState().user;
    if (user) {
      await supabase.from('notifications').insert({
        user_id: request.athleteId,
        type: 'coaching_accepted',
        title: 'Talebiniz Kabul Edildi!',
        message: `${user.firstName} ${user.lastName} koçluk talebinizi kabul etti.`,
        data: { requestId, ptId: request.ptId },
      });
    }

    // 6. PT store güncelle
    await usePTStore.getState().acceptCoachingRequest(requestId);

    // 7. Local state güncelle
    const { myStudents } = get();
    const newStudent: Athlete = {
      id: request.athleteId,
      email: '',
      firstName: request.athleteName.split(' ')[0] ?? '',
      lastName: request.athleteName.split(' ').slice(1).join(' '),
      userType: 'athlete',
      avatar: request.athleteAvatar,
      createdAt: new Date(),
      age: 25,
      gender: 'male',
      fitnessGoal: 'gain_muscle',
      experienceLevel: 'beginner',
      activePTId: request.ptId,
    };

    set({
      pendingRequests: pendingRequests.filter((r) => r.id !== requestId),
      myStudents: [...myStudents, newStudent],
    });
  },

  rejectRequest: async (requestId: string) => {
    const { pendingRequests } = get();
    const request = pendingRequests.find((r) => r.id === requestId);
    if (!request) return;

    await supabase
      .from('coaching_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    // Athlete'e bildirim
    const user = useAuthStore.getState().user;
    if (user) {
      await supabase.from('notifications').insert({
        user_id: request.athleteId,
        type: 'coaching_rejected',
        title: 'Talebiniz Reddedildi',
        message: `${user.firstName} ${user.lastName} koçluk talebinizi reddetti.`,
        data: { requestId },
      });
    }

    set({ pendingRequests: pendingRequests.filter((r) => r.id !== requestId) });
  },

  addGalleryItem: async (item: Omit<GalleryItem, 'id' | 'createdAt'>) => {
    const user = useAuthStore.getState().user;
    if (!user || user.userType !== 'pt') return;

    const newId = generateUUID();
    const { error } = await supabase.from('gallery_items').insert({
      id: newId,
      pt_id: user.id,
      before_image: item.beforeImage,
      after_image: item.afterImage,
      description: item.description,
      student_name: item.studentName,
    });
    if (error) throw new Error(error.message);

    const newItem: GalleryItem = { ...item, id: newId, createdAt: new Date() };
    const { gallery } = get();
    set({ gallery: [newItem, ...gallery] });
  },

  removeGalleryItem: async (id: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    await supabase.from('gallery_items').delete().eq('id', id).eq('pt_id', user.id);

    const { gallery } = get();
    set({ gallery: gallery.filter((g) => g.id !== id) });
  },

  removeStudent: async (athleteId: string) => {
    const user = useAuthStore.getState().user;
    if (!user || user.userType !== 'pt') return;

    await supabase
      .from('pt_students')
      .delete()
      .match({ pt_id: user.id, athlete_id: athleteId });

    await supabase
      .from('athlete_profiles')
      .update({ active_pt_id: null, active_package_id: null })
      .eq('id', athleteId);

    const { myStudents } = get();
    set({ myStudents: myStudents.filter((s) => s.id !== athleteId) });
  },

  loadPrograms: async (athleteId?: string) => {
    const user = useAuthStore.getState().user;
    if (!user || user.userType !== 'pt') return;

    try {
      let query = supabase
        .from('student_programs')
        .select('*')
        .eq('pt_id', user.id)
        .order('created_at', { ascending: false });

      if (athleteId) query = query.eq('athlete_id', athleteId);

      const { data, error } = await query;
      if (error) throw error;

      const programs: StudentProgram[] = (data ?? []).map((p) => ({
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

      set({ programs });
    } catch (err) {
      console.warn('Programlar yüklenemedi (tablo yoksa normal):', err);
      set({ programs: [] });
    }
  },

  createProgram: async (data) => {
    const user = useAuthStore.getState().user;
    if (!user || user.userType !== 'pt') throw new Error('Yetki yok');

    const newId = generateUUID();
    const fullPayload = {
      id: newId,
      athlete_id: data.athleteId,
      pt_id: data.ptId,
      name: data.name,
      description: data.description,
      weeks: data.weeks,
      is_active: data.isActive,
      exercises: data.exercises,
      cautions: data.cautions ?? '',
      general_notes: data.generalNotes ?? '',
      file_url: data.fileUrl ?? '',
      file_name: data.fileName ?? '',
    };

    let { error } = await supabase.from('student_programs').insert(fullPayload);

    // Yeni sütunlar henüz migration edilmemişse temel alanlarla dene
    if (error && error.message.includes('column')) {
      const basicPayload = {
        id: newId,
        athlete_id: data.athleteId,
        pt_id: data.ptId,
        name: data.name,
        description: data.description,
        weeks: data.weeks,
        is_active: data.isActive,
        exercises: data.exercises,
      };
      const result2 = await supabase.from('student_programs').insert(basicPayload);
      error = result2.error;
    }

    if (error) throw new Error(error.message);

    const newProgram: StudentProgram = {
      ...data,
      id: newId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const { programs } = get();
    set({ programs: [newProgram, ...programs] });
    return newId;
  },

  updateProgram: async (id, data) => {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.weeks !== undefined) updateData.weeks = data.weeks;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    if (data.exercises !== undefined) updateData.exercises = data.exercises;
    if (data.cautions !== undefined) updateData.cautions = data.cautions;
    if (data.generalNotes !== undefined) updateData.general_notes = data.generalNotes;
    if (data.fileUrl !== undefined) updateData.file_url = data.fileUrl;
    if (data.fileName !== undefined) updateData.file_name = data.fileName;
    updateData.updated_at = new Date().toISOString();

    await supabase.from('student_programs').update(updateData).eq('id', id);

    const { programs } = get();
    set({
      programs: programs.map((p) =>
        p.id === id ? { ...p, ...data, updatedAt: new Date() } : p,
      ),
    });
  },

  deleteProgram: async (id) => {
    await supabase.from('student_programs').delete().eq('id', id);
    const { programs } = get();
    set({ programs: programs.filter((p) => p.id !== id) });
  },

  getStudentPrograms: (athleteId) => {
    return get().programs.filter((p) => p.athleteId === athleteId);
  },

  loadBodyAnalyses: async (athleteId: string) => {
    try {
      const { data, error } = await supabase
        .from('body_analyses')
        .select('*')
        .eq('athlete_id', athleteId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const analyses: BodyAnalysis[] = (data ?? []).map((a) => ({
        id: a.id,
        athleteId: a.athlete_id,
        ptId: a.pt_id,
        photoUrl: a.photo_url,
        weekNumber: a.week_number ?? 1,
        ptComment: a.pt_comment ?? '',
        createdAt: new Date(a.created_at),
      }));

      const { bodyAnalyses } = get();
      // Mevcut analizleri bu öğrencinin dışında tut + yenileri ekle
      const others = bodyAnalyses.filter((a) => a.athleteId !== athleteId);
      set({ bodyAnalyses: [...others, ...analyses] });
    } catch {
      // body_analyses tablosu henüz yoksa sessizce geç
    }
  },

  addPTComment: async (analysisId: string, comment: string) => {
    await supabase
      .from('body_analyses')
      .update({ pt_comment: comment, updated_at: new Date().toISOString() })
      .eq('id', analysisId);

    const { bodyAnalyses } = get();
    set({
      bodyAnalyses: bodyAnalyses.map((a) =>
        a.id === analysisId ? { ...a, ptComment: comment } : a,
      ),
    });
  },

  getStudentBodyAnalyses: (athleteId: string) => {
    return get().bodyAnalyses.filter((a) => a.athleteId === athleteId);
  },
}));
