export type UserType = 'athlete' | 'pt';
export type FitnessGoal = 'lose_weight' | 'gain_muscle' | 'stay_fit' | 'healthy_life';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type PackageLevel = 'starter' | 'intermediate' | 'professional';
export type Specialization =
  | 'weight_loss'
  | 'muscle_gain'
  | 'functional'
  | 'yoga'
  | 'pilates'
  | 'nutrition'
  | 'rehabilitation';

export interface CoachingPackage {
  id: string;
  level: PackageLevel;
  name: string;
  price: number;
  durationWeeks: number;
  sessionsPerWeek: number;
  features: string[];
  isPopular?: boolean;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  avatar?: string;
  createdAt: Date;
}

export interface Athlete extends User {
  userType: 'athlete';
  age: number;
  gender: 'male' | 'female' | 'other';
  fitnessGoal: FitnessGoal;
  experienceLevel: ExperienceLevel;
  activePTId?: string;
  activePackageId?: string;
  notes?: string;
}

export interface PT extends User {
  userType: 'pt';
  bio: string;
  background: string;       // Özgeçmiş / profesyonel geçmiş
  philosophy: string;       // Antrenman felsefesi
  instagram?: string;       // Instagram kullanıcı adı
  youtube?: string;         // YouTube kanalı
  specializations: Specialization[];
  certificates: string;
  experienceYears: number;
  packages: CoachingPackage[];
  rating: number;
  reviewCount: number;
  students: string[];
  maxStudents: number;
  gallery: GalleryItem[];
  reviews: Review[];
  isAvailable: boolean;
  profilePhotos: string[];  // PT'nin kendi 8 fotoğrafı
}

export interface GalleryItem {
  id: string;
  beforeImage: string;
  afterImage: string;
  description: string;
  studentName: string;
  createdAt: Date;
}

export interface Review {
  id: string;
  athleteId: string;
  athleteName: string;
  athleteAvatar: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: UserType | 'system';
  content: string;
  imageUrl?: string;
  timestamp: Date;
  isRead: boolean;
  type: 'text' | 'system' | 'image';
}

export interface Conversation {
  id: string;
  athleteId: string;
  ptId: string;
  athleteName: string;
  ptName: string;
  athleteAvatar: string;
  ptAvatar: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isActive: boolean;
}

export interface CoachingRequest {
  id: string;
  athleteId: string;
  athleteName: string;
  athleteAvatar: string;
  ptId: string;
  packageId: string;
  packageName: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

export interface FilterState {
  specialization: Specialization | null;
  minPrice: number;
  maxPrice: number;
  onlyAvailable: boolean;
  sortBy: 'rating' | 'price_asc' | 'price_desc' | 'availability';
}

// ── Program sistemi ────────────────────────────────────────────────────────
export interface ProgramExercise {
  id: string;
  name: string;
  sets: number;
  reps: string;       // Örn: "8-12" veya "15"
  weight?: string;    // Örn: "60kg" veya "vücut ağırlığı"
  rest?: string;      // Örn: "90 sn"
  notes?: string;
  day: number;        // 1=Pazartesi, 2=Salı, ... 7=Pazar
}

export interface StudentProgram {
  id: string;
  athleteId: string;
  ptId: string;
  name: string;
  description: string;
  weeks: number;
  isActive: boolean;
  exercises: ProgramExercise[];
  cautions?: string;      // Dikkat edilmesi gerekenler
  generalNotes?: string;  // Genel notlar
  fileUrl?: string;       // Yüklenen dosya URL'i
  fileName?: string;      // Yüklenen dosya adı
  createdAt: Date;
  updatedAt: Date;
}

export interface BodyAnalysis {
  id: string;
  athleteId: string;
  ptId: string;
  photoUrl: string;
  weekNumber: number;
  ptComment: string;
  createdAt: Date;
}

// ── Form tipleri ───────────────────────────────────────────────────────────
export interface AthleteRegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  fitnessGoal: FitnessGoal;
  experienceLevel: ExperienceLevel;
  notes?: string;
}

export interface PTRegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  specializations: Specialization[];
  experienceYears: number;
  certificates: string;
  packages: CoachingPackage[];
  bio: string;
  avatar?: string;
}

export interface Notification {
  id: string;
  type: 'coaching_accepted' | 'coaching_rejected' | 'new_message' | 'coaching_request';
  title: string;
  body: string;
  isRead: boolean;
  createdAt: Date;
  targetScreen?: string;
  targetId?: string;
}
