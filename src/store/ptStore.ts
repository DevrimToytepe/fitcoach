import { create } from 'zustand';
import { PT, FilterState, FitnessGoal, Specialization, CoachingRequest, Athlete } from '../types';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';
import { generateUUID } from '../utils/uuid';

interface PTState {
  pts: PT[];
  filteredPTs: PT[];
  selectedPT: PT | null;
  filters: FilterState;
  searchQuery: string;
  isLoading: boolean;
  pendingRequests: CoachingRequest[];
  loadPTs: () => Promise<void>;
  searchPTs: (query: string) => void;
  applyFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  selectPT: (ptId: string) => void;
  sendCoachingRequest: (ptId: string, packageId: string) => Promise<void>;
  cancelCoaching: (ptId: string) => Promise<void>;
  getFeaturedPTs: () => PT[];
  getRecommendedPTs: (goal: FitnessGoal) => PT[];
  acceptCoachingRequest: (requestId: string) => Promise<void>;
  rejectCoachingRequest: (requestId: string) => Promise<void>;
  loadPendingRequests: () => Promise<void>;
}

const defaultFilters: FilterState = {
  specialization: null,
  minPrice: 0,
  maxPrice: 99999,
  onlyAvailable: false,
  sortBy: 'rating',
};

function getMinPrice(pt: PT): number {
  if (!pt.packages || pt.packages.length === 0) return 0;
  return Math.min(...pt.packages.map((p) => p.price));
}

function applyFiltersAndSearch(pts: PT[], query: string, filters: FilterState): PT[] {
  let result = [...pts];

  if (query.trim()) {
    const q = query.toLowerCase().trim();
    result = result.filter(
      (pt) =>
        `${pt.firstName} ${pt.lastName}`.toLowerCase().includes(q) ||
        pt.specializations.some((s) => s.toLowerCase().includes(q)) ||
        pt.bio.toLowerCase().includes(q),
    );
  }

  if (filters.specialization) {
    result = result.filter((pt) =>
      pt.specializations.includes(filters.specialization as Specialization),
    );
  }

  if (filters.minPrice > 0) {
    result = result.filter((pt) => getMinPrice(pt) >= filters.minPrice);
  }

  if (filters.maxPrice < 99999) {
    result = result.filter((pt) => getMinPrice(pt) <= filters.maxPrice);
  }

  if (filters.onlyAvailable) {
    result = result.filter((pt) => pt.students.length < pt.maxStudents);
  }

  switch (filters.sortBy) {
    case 'rating':
      result.sort((a, b) => b.rating - a.rating);
      break;
    case 'price_asc':
      result.sort((a, b) => getMinPrice(a) - getMinPrice(b));
      break;
    case 'price_desc':
      result.sort((a, b) => getMinPrice(b) - getMinPrice(a));
      break;
    case 'availability':
      result.sort((a, b) => {
        const aAvail = a.students.length < a.maxStudents ? 1 : 0;
        const bAvail = b.students.length < b.maxStudents ? 1 : 0;
        return bAvail - aAvail;
      });
      break;
  }

  return result;
}

// ── Supabase PT loader ─────────────────────────────────────────────────────
async function loadAllPTsFromDB(): Promise<PT[]> {
  // 1. Tüm PT profillerini çek
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_type', 'pt');

  if (error || !profiles || profiles.length === 0) return [];

  const ptIds = profiles.map((p) => p.id);

  // 2. İlgili tüm verileri paralel çek
  const [
    { data: ptProfiles },
    { data: packages },
    { data: students },
    { data: reviews },
    { data: gallery },
  ] = await Promise.all([
    supabase.from('pt_profiles').select('*').in('id', ptIds),
    supabase.from('pt_packages').select('*').in('pt_id', ptIds).order('price', { ascending: true }),
    supabase.from('pt_students').select('pt_id, athlete_id').in('pt_id', ptIds),
    supabase.from('reviews').select('*').in('pt_id', ptIds).order('created_at', { ascending: false }),
    supabase.from('gallery_items').select('*').in('pt_id', ptIds),
  ]);

  // 3. ID bazında gruplama
  const ptProfileMap = new Map((ptProfiles ?? []).map((p) => [p.id, p]));
  const packagesMap = new Map<string, typeof packages>(ptIds.map((id) => [id, []]));
  (packages ?? []).forEach((p) => packagesMap.get(p.pt_id)?.push(p));
  const studentsMap = new Map<string, string[]>(ptIds.map((id) => [id, []]));
  (students ?? []).forEach((s) => studentsMap.get(s.pt_id)?.push(s.athlete_id));
  const reviewsMap = new Map<string, typeof reviews>(ptIds.map((id) => [id, []]));
  (reviews ?? []).forEach((r) => reviewsMap.get(r.pt_id)?.push(r));
  const galleryMap = new Map<string, typeof gallery>(ptIds.map((id) => [id, []]));
  (gallery ?? []).forEach((g) => galleryMap.get(g.pt_id)?.push(g));

  // 4. PT objelerini oluştur
  return profiles
    .map((profile) => {
      const ptData = ptProfileMap.get(profile.id);
      if (!ptData) return null;

      const ptPackages = packagesMap.get(profile.id) ?? [];
      const ptStudents = studentsMap.get(profile.id) ?? [];
      const ptReviews = reviewsMap.get(profile.id) ?? [];
      const ptGallery = galleryMap.get(profile.id) ?? [];

      return {
        id: profile.id,
        email: profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        userType: 'pt' as const,
        avatar:
          profile.avatar ??
          `https://ui-avatars.com/api/?name=${profile.first_name}+${profile.last_name}&background=0EA5E9&color=fff&size=200`,
        createdAt: new Date(profile.created_at),
        bio: ptData.bio ?? '',
        specializations: ptData.specializations ?? [],
        certificates: ptData.certificates ?? '',
        experienceYears: ptData.experience_years ?? 0,
        packages: ptPackages.map((p) => ({
          id: p.id,
          level: p.level,
          name: p.name,
          price: Number(p.price),
          durationWeeks: p.duration_weeks,
          sessionsPerWeek: p.sessions_per_week,
          features: p.features ?? [],
          isPopular: p.is_popular ?? false,
        })),
        rating: Number(ptData.rating ?? 0),
        reviewCount: ptData.review_count ?? 0,
        students: ptStudents,
        maxStudents: ptData.max_students ?? 10,
        gallery: ptGallery.map((g) => ({
          id: g.id,
          beforeImage: g.before_image ?? '',
          afterImage: g.after_image ?? '',
          description: g.description ?? '',
          studentName: g.student_name ?? '',
          createdAt: new Date(g.created_at),
        })),
        reviews: ptReviews.map((r) => ({
          id: r.id,
          athleteId: r.athlete_id,
          athleteName: r.athlete_name ?? '',
          athleteAvatar: r.athlete_avatar ?? '',
          rating: r.rating,
          comment: r.comment ?? '',
          createdAt: new Date(r.created_at),
        })),
        isAvailable: ptData.is_available ?? true,
      } as PT;
    })
    .filter(Boolean) as PT[];
}

// ── Store ──────────────────────────────────────────────────────────────────
export const usePTStore = create<PTState>((set, get) => ({
  pts: [],
  filteredPTs: [],
  selectedPT: null,
  filters: defaultFilters,
  searchQuery: '',
  isLoading: false,
  pendingRequests: [],

  loadPTs: async () => {
    set({ isLoading: true });
    try {
      const pts = await loadAllPTsFromDB();
      const { searchQuery, filters } = get();
      const filteredPTs = applyFiltersAndSearch(pts, searchQuery, filters);
      set({ pts, filteredPTs, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  searchPTs: (query: string) => {
    const { pts, filters } = get();
    set({
      searchQuery: query,
      filteredPTs: applyFiltersAndSearch(pts, query, filters),
    });
  },

  applyFilters: (newFilters: Partial<FilterState>) => {
    const { pts, searchQuery, filters } = get();
    const merged = { ...filters, ...newFilters };
    set({
      filters: merged,
      filteredPTs: applyFiltersAndSearch(pts, searchQuery, merged),
    });
  },

  resetFilters: () => {
    const { pts, searchQuery } = get();
    set({
      filters: defaultFilters,
      filteredPTs: applyFiltersAndSearch(pts, searchQuery, defaultFilters),
    });
  },

  selectPT: (ptId: string) => {
    const { pts } = get();
    const pt = pts.find((p) => p.id === ptId) ?? null;
    set({ selectedPT: pt });
  },

  sendCoachingRequest: async (ptId: string, packageId: string) => {
    const user = useAuthStore.getState().user;
    if (!user || user.userType !== 'athlete') return;

    const athlete = user as Athlete;
    const { pts } = get();
    const pt = pts.find((p) => p.id === ptId);
    const selectedPackage = pt?.packages.find((p) => p.id === packageId);
    if (!selectedPackage) throw new Error('Paket bulunamadı.');

    const requestId = generateUUID();

    const { error } = await supabase.from('coaching_requests').insert({
      id: requestId,
      athlete_id: athlete.id,
      pt_id: ptId,
      package_id: packageId,
      package_name: selectedPackage.name,
      status: 'pending',
      athlete_name: `${athlete.firstName} ${athlete.lastName}`,
      athlete_avatar: athlete.avatar ?? '',
    });
    if (error) throw new Error(error.message);

    // PT'ye bildirim gönder
    await supabase.from('notifications').insert({
      user_id: ptId,
      type: 'coaching_request',
      title: 'Yeni Koçluk Talebi',
      message: `${athlete.firstName} ${athlete.lastName} ${selectedPackage.name} paketi için koçluk talep etti.`,
      data: { requestId, athleteId: athlete.id },
    });
  },

  cancelCoaching: async (ptId: string) => {
    const user = useAuthStore.getState().user;
    if (!user || user.userType !== 'athlete') return;

    await supabase.from('pt_students').delete().match({ pt_id: ptId, athlete_id: user.id });

    await useAuthStore
      .getState()
      .updateSupabaseProfile({ activePTId: undefined, activePackageId: undefined });

    // Güncelle local state
    const { pts, searchQuery, filters } = get();
    const updatedPTs = pts.map((pt) => {
      if (pt.id === ptId) {
        return { ...pt, students: pt.students.filter((id) => id !== user.id) };
      }
      return pt;
    });
    set({ pts: updatedPTs, filteredPTs: applyFiltersAndSearch(updatedPTs, searchQuery, filters) });
  },

  acceptCoachingRequest: async (requestId: string) => {
    const { error: updateError } = await supabase
      .from('coaching_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);
    if (updateError) return;

    // Fetch request details to update pt_students
    const { data: req } = await supabase
      .from('coaching_requests')
      .select('athlete_id, pt_id, package_id')
      .eq('id', requestId)
      .single();

    if (req) {
      await supabase
        .from('pt_students')
        .upsert({ pt_id: req.pt_id, athlete_id: req.athlete_id });

      // Athlete'in active_pt_id'sini güncelle
      await supabase
        .from('athlete_profiles')
        .update({ active_pt_id: req.pt_id, active_package_id: req.package_id })
        .eq('id', req.athlete_id);

      // Local PT state güncelle
      const { pts, searchQuery, filters } = get();
      const updatedPTs = pts.map((pt) => {
        if (pt.id === req.pt_id && !pt.students.includes(req.athlete_id)) {
          return { ...pt, students: [...pt.students, req.athlete_id] };
        }
        return pt;
      });
      set({ pts: updatedPTs, filteredPTs: applyFiltersAndSearch(updatedPTs, searchQuery, filters) });
    }
  },

  rejectCoachingRequest: async (requestId: string) => {
    await supabase
      .from('coaching_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);
  },

  loadPendingRequests: async () => {
    const user = useAuthStore.getState().user;
    if (!user || user.userType !== 'pt') return;

    const { data, error } = await supabase
      .from('coaching_requests')
      .select('*')
      .eq('pt_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) return;

    const pending: CoachingRequest[] = (data ?? []).map((r) => ({
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

    set({ pendingRequests: pending });
  },

  getFeaturedPTs: () => {
    const { pts } = get();
    return [...pts].sort((a, b) => b.rating - a.rating).slice(0, 4);
  },

  getRecommendedPTs: (goal: FitnessGoal) => {
    const { pts } = get();
    const goalSpecMap: Record<FitnessGoal, Specialization[]> = {
      lose_weight: ['weight_loss', 'nutrition'],
      gain_muscle: ['muscle_gain', 'functional'],
      stay_fit: ['functional', 'yoga', 'pilates'],
      healthy_life: ['nutrition', 'yoga', 'rehabilitation'],
    };
    const specs = goalSpecMap[goal];
    return pts
      .filter((pt) => pt.specializations.some((s) => specs.includes(s)))
      .sort((a, b) => b.rating - a.rating);
  },
}));
