import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabase';

// React Native'de atob güvenilir değil — kendi decode fonksiyonumuz
function decode(base64: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  const str = base64.replace(/[^A-Za-z0-9+/]/g, '');
  while (i < str.length) {
    const a = chars.indexOf(str[i++]);
    const b = chars.indexOf(str[i++]);
    const c = chars.indexOf(str[i++]);
    const d = chars.indexOf(str[i++]);
    result += String.fromCharCode((a << 2) | (b >> 4));
    if (c !== 64 && c !== -1) result += String.fromCharCode(((b & 15) << 4) | (c >> 2));
    if (d !== 64 && d !== -1) result += String.fromCharCode(((c & 3) << 6) | d);
  }
  return result;
}

/**
 * Verilen URI'yi Supabase Storage'a yükler ve public URL döner.
 * expo-file-system kullanarak iOS file:// URI'lerini güvenilir şekilde okur.
 */
export async function uploadImage(
  uri: string,
  bucket: 'avatars' | 'gallery' | 'pt-photos',
  path: string,
): Promise<string | null> {
  try {
    const ext = uri.split('.').pop()?.split('?')[0]?.toLowerCase() ?? 'jpg';
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      heic: 'image/jpeg', // HEIC'i JPEG olarak yükle
      heif: 'image/jpeg',
    };
    const contentType = mimeMap[ext] ?? 'image/jpeg';

    // expo-file-system ile base64 oku — iOS file:// için en güvenilir yöntem
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64' as any,
    });

    if (!base64) throw new Error('Dosya okunamadı');

    // Supabase JS client base64 string'i decode edebilir
    // decode: base64 → binary string → Uint8Array
    const byteCharacters = decode(base64);
    const bytes = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      bytes[i] = byteCharacters.charCodeAt(i);
    }

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, bytes, { contentType, upsert: true });

    if (uploadError) {
      console.error('Upload error:', uploadError.message);
      return null;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  } catch (err: any) {
    console.error('uploadImage failed:', err?.message ?? err);
    return null;
  }
}

/** Kullanıcı avatar'ı yükle – avatars/{userId}/avatar.{ext} */
export async function uploadAvatar(userId: string, uri: string): Promise<string | null> {
  const ext = uri.split('.').pop()?.split('?')[0]?.toLowerCase() ?? 'jpg';
  const path = `${userId}/avatar.${ext}`;
  return uploadImage(uri, 'avatars', path);
}

/** PT kişisel profil fotoğrafı yükle – avatars/{ptId}/photos/photo_{index}.jpg */
export async function uploadProfilePhoto(
  ptId: string,
  uri: string,
  index: number,
): Promise<string | null> {
  // Her zaman .jpg olarak yükle — expo-image-picker JPEG döner
  const path = `${ptId}/photos/photo_${index}_${Date.now()}.jpg`;
  return uploadImage(uri, 'avatars', path);
}

/** Chat fotoğrafı yükle – avatars/{userId}/chat/{conversationId}/{ts}.jpg */
export async function uploadChatImage(
  conversationId: string,
  userId: string,
  uri: string,
): Promise<string | null> {
  const path = `${userId}/chat/${conversationId}/${Date.now()}.jpg`;
  return uploadImage(uri, 'avatars', path);
}

/** Program dosyası (görsel) yükle – avatars/{ptId}/programs/{ts}.jpg */
export async function uploadProgramFile(
  ptId: string,
  uri: string,
): Promise<string | null> {
  const path = `${ptId}/programs/${Date.now()}.jpg`;
  return uploadImage(uri, 'avatars', path);
}

/** Vücut analiz fotoğrafı yükle – avatars/{athleteId}/body/{ts}.jpg */
export async function uploadBodyPhoto(
  athleteId: string,
  uri: string,
): Promise<string | null> {
  const path = `${athleteId}/body/${Date.now()}.jpg`;
  return uploadImage(uri, 'avatars', path);
}

/** Galeri dönüşüm fotoğrafı yükle – gallery/{ptId}/{timestamp}_{type}.jpg */
export async function uploadGalleryImage(
  ptId: string,
  uri: string,
  type: 'before' | 'after',
): Promise<string | null> {
  const path = `${ptId}/${Date.now()}_${type}.jpg`;
  return uploadImage(uri, 'gallery', path);
}
