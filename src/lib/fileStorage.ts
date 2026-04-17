/**
 * Supabase Storage upload helpers.
 * Desteklenen bucket'lar: 'avatars' ve 'gallery'
 */
import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';

export type StorageBucket = 'avatars' | 'gallery';

/**
 * Yerel URI'dan Supabase Storage'a resim yükle.
 * @returns Yüklenen dosyanın public URL'i
 */
export async function uploadImage(
  bucket: StorageBucket,
  userId: string,
  localUri: string,
  filename?: string,
): Promise<string> {
  // Dosyayı base64 olarak oku
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Base64 → Uint8Array
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Dosya uzantısını belirle
  const ext = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const contentType =
    ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  // Storage path: userId/filename
  const name = filename ?? `${Date.now()}.${ext}`;
  const path = `${userId}/${name}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, bytes, {
      contentType,
      upsert: true,
    });

  if (error) throw new Error(`Upload başarısız: ${error.message}`);

  // Public URL al
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return publicUrl;
}

/**
 * Avatar yükle ve profili güncelle.
 * @returns Public URL
 */
export async function uploadAvatar(userId: string, localUri: string): Promise<string> {
  return uploadImage('avatars', userId, localUri, 'avatar.jpg');
}

/**
 * Gallery resmi yükle.
 * @returns Public URL
 */
export async function uploadGalleryImage(userId: string, localUri: string): Promise<string> {
  return uploadImage('gallery', userId, localUri);
}

/**
 * Supabase Storage'dan dosya sil.
 */
export async function deleteStorageFile(bucket: StorageBucket, path: string): Promise<void> {
  await supabase.storage.from(bucket).remove([path]);
}
