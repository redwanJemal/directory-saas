export interface BrandConfig {
  name: string;
  shortName: string;
  hue: number;
  description: string;
}

// Default brand — override per deployment via environment variables
export const brand: BrandConfig = {
  name: import.meta.env.VITE_BRAND_NAME || 'Habesha Hub Business',
  shortName: import.meta.env.VITE_BRAND_SHORT_NAME || 'HH',
  hue: Number(import.meta.env.VITE_BRAND_HUE) || 145,
  description: import.meta.env.VITE_BRAND_DESCRIPTION || 'Manage your Habesha Hub listing',
};

/**
 * Apply brand hue to the document root CSS variable.
 * Call once on app startup in main.tsx.
 */
export function applyBrandHue(hue?: number) {
  const root = document.documentElement;
  root.style.setProperty('--brand-hue', String(hue ?? brand.hue));
}
