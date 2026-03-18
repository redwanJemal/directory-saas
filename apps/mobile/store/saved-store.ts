import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVED_KEY = 'hh_saved_businesses';

export interface SavedBusiness {
  id: string;
  businessName: string;
  category: string;
  location: string;
  rating: number;
  reviewCount: number;
  startingPrice: number | null;
  coverImage: string | null;
  isVerified: boolean;
  savedAt: string;
}

interface SavedState {
  businesses: SavedBusiness[];
  isLoaded: boolean;

  initialize: () => Promise<void>;
  save: (business: Omit<SavedBusiness, 'savedAt'>) => void;
  remove: (id: string) => void;
  isSaved: (id: string) => boolean;
  toggle: (business: Omit<SavedBusiness, 'savedAt'>) => void;
}

export const useSavedStore = create<SavedState>((set, get) => ({
  businesses: [],
  isLoaded: false,

  initialize: async () => {
    try {
      const stored = await AsyncStorage.getItem(SAVED_KEY);
      if (stored) {
        set({ businesses: JSON.parse(stored), isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },

  save: (business) => {
    const existing = get().businesses;
    if (existing.some((b) => b.id === business.id)) return;
    const updated = [{ ...business, savedAt: new Date().toISOString() }, ...existing];
    set({ businesses: updated });
    AsyncStorage.setItem(SAVED_KEY, JSON.stringify(updated));
  },

  remove: (id) => {
    const updated = get().businesses.filter((b) => b.id !== id);
    set({ businesses: updated });
    AsyncStorage.setItem(SAVED_KEY, JSON.stringify(updated));
  },

  isSaved: (id) => {
    return get().businesses.some((b) => b.id === id);
  },

  toggle: (business) => {
    if (get().isSaved(business.id)) {
      get().remove(business.id);
    } else {
      get().save(business);
    }
  },
}));
