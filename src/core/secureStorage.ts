import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const PREFIX = 'dentaflow.';
const CHUNK_SIZE = 1800;
const options: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
const webMemoryStorage = new Map<string, string>();
const fullKey = (key: string) => `${PREFIX}${key}`;
const manifestKey = (key: string) => `${fullKey(key)}.chunks`;
const chunkKey = (key: string, index: number) => `${fullKey(key)}.${index}`;

async function getSecureValue(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return webMemoryStorage.get(key) ?? null;
  return SecureStore.getItemAsync(key);
}

async function setSecureValue(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    webMemoryStorage.set(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value, options);
}

async function deleteSecureValue(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    webMemoryStorage.delete(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

async function existingChunkCount(key: string): Promise<number> {
  const value = await getSecureValue(manifestKey(key));
  const count = Number(value ?? 0);
  return Number.isSafeInteger(count) && count > 0 ? count : 0;
}

export const secureStorage = {
  async get(key: string): Promise<string | null> {
    try {
      const count = await existingChunkCount(key);
      if (!count) return await getSecureValue(fullKey(key));
      const chunks = await Promise.all(Array.from({ length: count }, (_, index) => getSecureValue(chunkKey(key, index))));
      if (chunks.some((chunk) => chunk == null)) return null;
      return chunks.join('');
    } catch { return null; }
  },
  async set(key: string, value: string): Promise<void> {
    const previousChunks = await existingChunkCount(key);
    if (value.length <= CHUNK_SIZE) {
      await setSecureValue(fullKey(key), value);
      await deleteSecureValue(manifestKey(key));
      await Promise.all(Array.from({ length: previousChunks }, (_, index) => deleteSecureValue(chunkKey(key, index))));
      return;
    }
    const chunks = Array.from({ length: Math.ceil(value.length / CHUNK_SIZE) }, (_, index) => value.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE));
    await Promise.all(chunks.map((chunk, index) => setSecureValue(chunkKey(key, index), chunk)));
    await setSecureValue(manifestKey(key), String(chunks.length));
    await deleteSecureValue(fullKey(key));
    if (previousChunks > chunks.length) await Promise.all(Array.from({ length: previousChunks - chunks.length }, (_, offset) => deleteSecureValue(chunkKey(key, chunks.length + offset))));
  },
  async remove(key: string): Promise<void> {
    const count = await existingChunkCount(key);
    await Promise.all([
      deleteSecureValue(fullKey(key)),
      deleteSecureValue(manifestKey(key)),
      ...Array.from({ length: count }, (_, index) => deleteSecureValue(chunkKey(key, index)))
    ]);
  }
};

export const supabaseAuthStorage = {
  getItem: (key: string) => secureStorage.get(`auth.${key}`),
  setItem: (key: string, value: string) => secureStorage.set(`auth.${key}`, value),
  removeItem: (key: string) => secureStorage.remove(`auth.${key}`)
};
