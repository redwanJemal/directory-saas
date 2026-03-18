import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CountryState {
  countryCode: string | null;
  source: 'header' | 'subdomain' | 'default' | 'user' | 'none';
  initialized: boolean;
  setCountry: (code: string, source: CountryState['source']) => void;
  clear: () => void;
  setInitialized: () => void;
}

export const useCountryStore = create<CountryState>()(
  persist(
    (set) => ({
      countryCode: null,
      source: 'none',
      initialized: false,
      setCountry: (code, source) =>
        set({ countryCode: code, source, initialized: true }),
      clear: () =>
        set({ countryCode: null, source: 'none', initialized: false }),
      setInitialized: () => set({ initialized: true }),
    }),
    {
      name: 'saas_web_country',
      partialize: (state) => ({
        countryCode: state.countryCode,
        source: state.source,
      }),
    },
  ),
);
