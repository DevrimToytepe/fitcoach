import { create } from 'zustand';
import { Athlete, PT, AthleteRegisterForm, PTRegisterForm } from '../types';
import { supabase } from '../lib/supabase';
import { generateUUID } from '../utils/uuid';
import { uploadAvatar } from '../utils/upload';

interface AuthState {
  user: Athlete | PT | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  registerAthlete: (data: AthleteRegisterForm) => Promise<void>;
  registerPT: (data: PTRegisterForm) => Promise<void>;
  updateUser: (data: Partial<Athlete | PT>) => void;
  restoreSession: () => Promise<boolean>;
  updateSupabaseProfile: (data: Partial<Athlete | PT>) => Promise<void>;
}

// ── DB satırlarını TypeScript tipine dönüştür ──────────────────────────────
export async function fetchUserProfile(userId: string): Promise<Athlete | PT | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !profile) return null;

  if (profile.user_type === 'athlete') {
    const { data: ap } = await supabase
      .from('athlete_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    return {
      id: profile.id,
      email: profile.email,
      firstName: profile.first_name,
      lastName: profile.last_name,
      userType: 'athlete',
      avatar:
        profile.avatar ??
        `https://ui-avatars.com/api/?name=${profile.first_name}+${profile.last_name}&background=0EA5E9&color=fff&size=200`,
      createdAt: new Date(profile.created_at),
      age: ap?.age ?? 25,
      gender: ap?.gender ?? 'male',
      fitnessGoal: ap?.fitness_goal ?? 'stay_fit',
      experienceLevel: ap?.experience_level ?? 'beginner',
      activePTId: ap?.active_pt_id ?? undefined,
      activePackageId: ap?.active_package_id ?? undefined,
      notes: ap?.notes ?? '',
    } as Athlete;
  }

  // PT
  const [
    { data: ptData },
    { data: packages },
    { data: students },
    { data: reviews },
    { data: gallery },
  ] = await Promise.all([
    supabase.from('pt_profiles').select('*').eq('id', userId).single(),
    supabase
      .from('pt_packages')
      .select('*')
      .eq('pt_id', userId)
      .order('price', { ascending: true }),
    supabase.from('pt_students').select('athlete_id').eq('pt_id', userId),
    supabase
      .from('reviews')
      .select('*')
      .eq('pt_id', userId)
      .order('created_at', { ascending: false }),
    supabase.from('gallery_items').select('*').eq('pt_id', userId),
  ]);

  return {
    id: profile.id,
    email: profile.email,
    firstName: profile.first_name,
    lastName: profile.last_name,
    userType: 'pt',
    avatar:
      profile.avatar ??
      `https://ui-avatars.com/api/?name=${profile.first_name}+${profile.last_name}&background=0EA5E9&color=fff&size=200`,
    createdAt: new Date(profile.created_at),
    bio: ptData?.bio ?? '',
    background: ptData?.background ?? '',
    philosophy: ptData?.philosophy ?? '',
    instagram: ptData?.instagram ?? '',
    youtube: ptData?.youtube ?? '',
    profilePhotos: ptData?.profile_photos ?? [],
    specializations: ptData?.specializations ?? [],
    certificates: ptData?.certificates ?? '',
    experienceYears: ptData?.experience_years ?? 0,
    packages: (packages ?? []).map((p) => ({
      id: p.id,
      level: p.level,
      name: p.name,
      price: Number(p.price),
      durationWeeks: p.duration_weeks,
      sessionsPerWeek: p.sessions_per_week,
      features: p.features ?? [],
      isPopular: p.is_popular ?? false,
    })),
    rating: Number(ptData?.rating ?? 0),
    reviewCount: ptData?.review_count ?? 0,
    students: (students ?? []).map((s) => s.athlete_id),
    maxStudents: ptData?.max_students ?? 10,
    gallery: (gallery ?? []).map((g) => ({
      id: g.id,
      beforeImage: g.before_image ?? '',
      afterImage: g.after_image ?? '',
      description: g.description ?? '',
      studentName: g.student_name ?? '',
      createdAt: new Date(g.created_at),
    })),
    reviews: (reviews ?? []).map((r) => ({
      id: r.id,
      athleteId: r.athlete_id,
      athleteName: r.athlete_name ?? '',
      athleteAvatar: r.athlete_avatar ?? '',
      rating: r.rating,
      comment: r.comment ?? '',
      createdAt: new Date(r.created_at),
    })),
    isAvailable: ptData?.is_available ?? true,
  } as PT;
}

// ── Store ──────────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error('E-posta veya şifre hatalı.');

      const profile = await fetchUserProfile(data.user.id);
      if (!profile) throw new Error('Profil bulunamadı.');

      set({ user: profile, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false, isLoading: false });

    // Diğer store'ları temizle (circular import'tan kaçınmak için lazy import)
    const { usePTStore } = await import('./ptStore');
    const { useMessageStore } = await import('./messageStore');
    const { useDashboardStore } = await import('./dashboardStore');

    usePTStore.setState({
      pts: [],
      filteredPTs: [],
      selectedPT: null,
      pendingRequests: [],
    });
    useMessageStore.setState({
      conversations: [],
      messages: {},
      activeConversationId: null,
      totalUnread: 0,
    });
    useDashboardStore.setState({
      myStudents: [],
      pendingRequests: [],
      gallery: [],
    });
  },

  registerAthlete: async (data: AthleteRegisterForm) => {
    set({ isLoading: true });
    try {
      // 1. Auth kullanıcısı oluştur
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });
      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          throw new Error('Bu e-posta adresi zaten kayıtlı.');
        }
        throw new Error(signUpError.message);
      }
      const userId = authData.user!.id;

      // 2. SECURITY DEFINER RPC ile profil oluştur
      // (email onayı olmadan da çalışır, RLS'i atlar)
      const { error: rpcError } = await supabase.rpc('register_athlete', {
        p_user_id: userId,
        p_email: data.email,
        p_first_name: data.firstName,
        p_last_name: data.lastName,
        p_age: data.age,
        p_gender: data.gender,
        p_fitness_goal: data.fitnessGoal,
        p_experience_level: data.experienceLevel,
        p_notes: data.notes ?? '',
      });
      if (rpcError) throw new Error('Profil oluşturulamadı: ' + rpcError.message);

      // 3. Session al (email onayı kapalıysa anında, açıksa signIn gerekir)
      let finalUserId = userId;
      if (!authData.session) {
        // Email onayı açık: şifreyle giriş dene
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (signInError) {
          // Email onayı bekleniyor
          set({ isLoading: false });
          throw new Error('E-postanıza gelen bağlantıya tıklayın, ardından giriş yapın.');
        }
        finalUserId = signInData.user.id;
      }

      // 4. Profili fetch et ve state'e yaz
      const profile = await fetchUserProfile(finalUserId);
      if (!profile) throw new Error('Profil yüklenemedi.');

      set({ user: profile, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  registerPT: async (data: PTRegisterForm) => {
    set({ isLoading: true });
    try {
      // 1. Auth kullanıcısı oluştur
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });
      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          throw new Error('Bu e-posta adresi zaten kayıtlı.');
        }
        throw new Error(signUpError.message);
      }
      const userId = authData.user!.id;

      // 2. RPC ile PT profili oluştur
      const { error: rpcError } = await supabase.rpc('register_pt', {
        p_user_id: userId,
        p_email: data.email,
        p_first_name: data.firstName,
        p_last_name: data.lastName,
        p_bio: data.bio,
        p_specializations: data.specializations,
        p_certificates: data.certificates,
        p_experience_years: data.experienceYears ?? 0,
      });
      if (rpcError) throw new Error('Profil oluşturulamadı: ' + rpcError.message);

      // 3. Paketleri RPC ile ekle
      if (data.packages && data.packages.length > 0) {
        for (const pkg of data.packages) {
          const { error: pkgError } = await supabase.rpc('register_pt_package', {
            p_id: generateUUID(),
            p_pt_id: userId,
            p_level: pkg.level,
            p_name: pkg.name,
            p_price: pkg.price,
            p_duration_weeks: pkg.durationWeeks,
            p_sessions_per_week: pkg.sessionsPerWeek,
            p_features: pkg.features,
            p_is_popular: pkg.isPopular ?? false,
          });
          if (pkgError) console.warn('Paket eklenemedi:', pkgError.message);
        }
      }

      // 4. Session al
      let finalUserId = userId;
      if (!authData.session) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (signInError) {
          set({ isLoading: false });
          throw new Error('E-postanıza gelen bağlantıya tıklayın, ardından giriş yapın.');
        }
        finalUserId = signInData.user.id;
      }

      // 5. Avatar varsa session aldıktan sonra Storage'a yükle (RLS için oturum şart)
      if (data.avatar && data.avatar.startsWith('file://')) {
        try {
          const avatarUrl = await uploadAvatar(finalUserId, data.avatar);
          if (avatarUrl) {
            await supabase.from('profiles').update({ avatar: avatarUrl }).eq('id', finalUserId);
          }
        } catch {
          // Avatar yükleme başarısız olsa da kayıt tamamlanır
        }
      }

      const profile = await fetchUserProfile(finalUserId);
      if (!profile) throw new Error('Profil yüklenemedi.');

      set({ user: profile, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  updateUser: (data: Partial<Athlete | PT>) => {
    const { user } = get();
    if (!user) return;
    set({ user: { ...user, ...data } as Athlete | PT });
  },

  updateSupabaseProfile: async (data: Partial<Athlete | PT>) => {
    const { user } = get();
    if (!user) return;

    const profileUpdate: Record<string, unknown> = {};
    if (data.firstName) profileUpdate.first_name = data.firstName;
    if (data.lastName) profileUpdate.last_name = data.lastName;
    if (data.avatar !== undefined) profileUpdate.avatar = data.avatar;
    if (Object.keys(profileUpdate).length > 0) {
      await supabase.from('profiles').update(profileUpdate).eq('id', user.id);
    }

    if (user.userType === 'pt') {
      const ptUpdate: Record<string, unknown> = {};
      const ptData = data as Partial<PT>;
      if (ptData.bio !== undefined) ptUpdate.bio = ptData.bio;
      if (ptData.background !== undefined) ptUpdate.background = ptData.background;
      if (ptData.philosophy !== undefined) ptUpdate.philosophy = ptData.philosophy;
      if (ptData.instagram !== undefined) ptUpdate.instagram = ptData.instagram;
      if (ptData.youtube !== undefined) ptUpdate.youtube = ptData.youtube;
      if (ptData.profilePhotos !== undefined) ptUpdate.profile_photos = ptData.profilePhotos;
      if (ptData.specializations) ptUpdate.specializations = ptData.specializations;
      if (ptData.certificates !== undefined) ptUpdate.certificates = ptData.certificates;
      if (ptData.experienceYears !== undefined) ptUpdate.experience_years = ptData.experienceYears;
      if (ptData.isAvailable !== undefined) ptUpdate.is_available = ptData.isAvailable;
      if (ptData.maxStudents !== undefined) ptUpdate.max_students = ptData.maxStudents;
      if (Object.keys(ptUpdate).length > 0) {
        await supabase.from('pt_profiles').update(ptUpdate).eq('id', user.id);
      }
    } else {
      const apUpdate: Record<string, unknown> = {};
      const apData = data as Partial<Athlete>;
      if (apData.age !== undefined) apUpdate.age = apData.age;
      if (apData.gender !== undefined) apUpdate.gender = apData.gender;
      if (apData.fitnessGoal !== undefined) apUpdate.fitness_goal = apData.fitnessGoal;
      if (apData.experienceLevel !== undefined) apUpdate.experience_level = apData.experienceLevel;
      if (apData.notes !== undefined) apUpdate.notes = apData.notes;
      if (apData.activePTId !== undefined) apUpdate.active_pt_id = apData.activePTId ?? null;
      if (apData.activePackageId !== undefined)
        apUpdate.active_package_id = apData.activePackageId ?? null;
      if (Object.keys(apUpdate).length > 0) {
        await supabase.from('athlete_profiles').update(apUpdate).eq('id', user.id);
      }
    }

    get().updateUser(data);
  },

  restoreSession: async (): Promise<boolean> => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return false;

      const profile = await fetchUserProfile(session.user.id);
      if (!profile) return false;

      set({ user: profile, isAuthenticated: true });
      return true;
    } catch {
      return false;
    }
  },
}));
