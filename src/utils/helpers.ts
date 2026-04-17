import { format, formatDistanceToNow, differenceInMinutes } from 'date-fns';
import { tr } from 'date-fns/locale';
import { FitnessGoal, ExperienceLevel, Specialization } from '../types';
import { Colors } from '../constants/colors';

export function formatDate(date: Date): string {
  return format(date, 'dd MMM yyyy', { locale: tr });
}

export function formatTime(date: Date): string {
  return format(date, 'HH:mm', { locale: tr });
}

export function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true, locale: tr });
}

export function formatMessageTime(date: Date): string {
  const now = new Date();
  const diffMins = differenceInMinutes(now, date);
  if (diffMins < 1) return 'Az önce';
  if (diffMins < 60) return `${diffMins} dk önce`;
  if (diffMins < 1440) return format(date, 'HH:mm');
  return format(date, 'dd MMM', { locale: tr });
}

export function shouldShowTimestamp(prev: Date | null, current: Date): boolean {
  if (!prev) return true;
  return differenceInMinutes(current, prev) > 30;
}

export function getCapacityColor(students: number, max: number): string {
  const ratio = students / max;
  if (ratio >= 1) return Colors.capacityFull;
  if (ratio >= 0.7) return Colors.capacityLow;
  return Colors.capacityAvailable;
}

export function getCapacityText(students: number, max: number): string {
  if (students >= max) return 'Kontenjan Dolu';
  if (students / max >= 0.7) return 'Az Kaldı';
  return 'Müsait';
}

export function getGoalLabel(goal: FitnessGoal): string {
  const labels: Record<FitnessGoal, string> = {
    lose_weight: 'Kilo Vermek',
    gain_muscle: 'Kas Geliştirmek',
    stay_fit: 'Fit Kalmak',
    healthy_life: 'Sağlıklı Yaşam',
  };
  return labels[goal];
}

export function getExperienceLabel(level: ExperienceLevel): string {
  const labels: Record<ExperienceLevel, string> = {
    beginner: 'Başlangıç',
    intermediate: 'Orta Seviye',
    advanced: 'İleri Seviye',
  };
  return labels[level];
}

export function getSpecializationLabel(spec: Specialization): string {
  const labels: Record<Specialization, string> = {
    weight_loss: 'Kilo Verme',
    muscle_gain: 'Kas Geliştirme',
    functional: 'Fonksiyonel',
    yoga: 'Yoga',
    pilates: 'Pilates',
    nutrition: 'Beslenme',
    rehabilitation: 'Rehabilitasyon',
  };
  return labels[spec];
}

export function formatPrice(price: number): string {
  return `₺${price.toLocaleString('tr-TR')}`;
}

export function getGoalIconName(goal: FitnessGoal): string {
  const icons: Record<FitnessGoal, string> = {
    lose_weight: 'fire',
    gain_muscle: 'dumbbell',
    stay_fit: 'flash',
    healthy_life: 'leaf',
  };
  return icons[goal];
}

/** @deprecated use getGoalIconName */
export function getGoalEmoji(goal: FitnessGoal): string {
  return '';
}

export function generateConversationId(athleteId: string, ptId: string): string {
  return `${athleteId}_${ptId}`;
}

export function getMotivationQuote(day: number): string {
  const quotes = [
    'Bugün başladığın yolculuk, yarınki seni şekillendirir.',
    'Her tekrar, hedefine bir adım daha yaklaştırıyor.',
    'Güçlü bir vücut, güçlü bir zihinle başlar.',
    'Vazgeçme! Değişim zaman alır, ama gerçekleşir.',
    'Dünkünden daha iyi olmak tek hedefin olsun.',
  ];
  return quotes[day % quotes.length];
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function renderStarCount(rating: number): number {
  return Math.round(rating);
}

export function isAvailable(students: number, max: number): boolean {
  return students < max;
}
