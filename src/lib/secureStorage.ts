/**
 * expo-secure-store adapter for Supabase auth sessions.
 * iOS SecureStore has a 2048-byte limit per key, so we chunk large values.
 */
import * as SecureStore from 'expo-secure-store';

const CHUNK_SIZE = 1800;

function chunkString(str: string): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < str.length; i += CHUNK_SIZE) {
    chunks.push(str.slice(i, i + CHUNK_SIZE));
  }
  return chunks;
}

const SecureStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const chunkCount = await SecureStore.getItemAsync(`${key}_chunks`);
      if (!chunkCount) {
        // Single value (short key)
        return SecureStore.getItemAsync(key);
      }
      const count = parseInt(chunkCount, 10);
      const parts: string[] = [];
      for (let i = 0; i < count; i++) {
        const chunk = await SecureStore.getItemAsync(`${key}_${i}`);
        if (chunk !== null) parts.push(chunk);
      }
      return parts.join('');
    } catch {
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (value.length <= CHUNK_SIZE) {
        // Short value → store directly
        await SecureStore.setItemAsync(key, value);
        // Clear any old chunks
        const oldChunks = await SecureStore.getItemAsync(`${key}_chunks`);
        if (oldChunks) {
          const count = parseInt(oldChunks, 10);
          for (let i = 0; i < count; i++) {
            await SecureStore.deleteItemAsync(`${key}_${i}`).catch(() => {});
          }
          await SecureStore.deleteItemAsync(`${key}_chunks`);
        }
        return;
      }

      // Long value → chunk it
      const chunks = chunkString(value);
      for (let i = 0; i < chunks.length; i++) {
        await SecureStore.setItemAsync(`${key}_${i}`, chunks[i]);
      }
      await SecureStore.setItemAsync(`${key}_chunks`, String(chunks.length));
      // Remove single-value key if it exists
      await SecureStore.deleteItemAsync(key).catch(() => {});
    } catch (e) {
      console.warn('SecureStorage.setItem failed:', e);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      const chunkCount = await SecureStore.getItemAsync(`${key}_chunks`);
      if (chunkCount) {
        const count = parseInt(chunkCount, 10);
        for (let i = 0; i < count; i++) {
          await SecureStore.deleteItemAsync(`${key}_${i}`).catch(() => {});
        }
        await SecureStore.deleteItemAsync(`${key}_chunks`).catch(() => {});
      }
      await SecureStore.deleteItemAsync(key).catch(() => {});
    } catch (e) {
      console.warn('SecureStorage.removeItem failed:', e);
    }
  },
};

export default SecureStorageAdapter;
