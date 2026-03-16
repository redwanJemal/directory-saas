import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  PersistedClient,
  Persister,
} from '@tanstack/react-query-persist-client';

const CACHE_KEY = 'REACT_QUERY_CACHE';

export const asyncStoragePersister: Persister = {
  persistClient: async (client: PersistedClient) => {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(client));
  },
  restoreClient: async () => {
    const cache = await AsyncStorage.getItem(CACHE_KEY);
    return cache ? JSON.parse(cache) : undefined;
  },
  removeClient: async () => {
    await AsyncStorage.removeItem(CACHE_KEY);
  },
};
