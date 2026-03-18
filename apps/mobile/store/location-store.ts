import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_KEY = 'hh_selected_location';

export interface LocationState {
  country: string | null;
  countryName: string | null;
  city: string | null;
  cityName: string | null;
  isLoaded: boolean;

  setLocation: (country: string, countryName: string, city?: string, cityName?: string) => void;
  clearLocation: () => void;
  initialize: () => Promise<void>;
}

export const useLocationStore = create<LocationState>((set) => ({
  country: null,
  countryName: null,
  city: null,
  cityName: null,
  isLoaded: false,

  setLocation: (country, countryName, city, cityName) => {
    const state = { country, countryName, city: city ?? null, cityName: cityName ?? null };
    set({ ...state });
    AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(state));
  },

  clearLocation: () => {
    set({ country: null, countryName: null, city: null, cityName: null });
    AsyncStorage.removeItem(LOCATION_KEY);
  },

  initialize: async () => {
    try {
      const stored = await AsyncStorage.getItem(LOCATION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set({ ...parsed, isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },
}));
