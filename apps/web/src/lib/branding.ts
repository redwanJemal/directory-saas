export interface BrandConfig {
  name: string;
  shortName: string;
  hue: number;
  description: string;
}

// Default brand — override per deployment via environment variables
export const brand: BrandConfig = {
  name: import.meta.env.VITE_BRAND_NAME || 'Directory SaaS',
  shortName: import.meta.env.VITE_BRAND_SHORT_NAME || 'DS',
  hue: Number(import.meta.env.VITE_BRAND_HUE) || 230,
  description: import.meta.env.VITE_BRAND_DESCRIPTION || 'Directory & Marketplace Platform',
};

/**
 * Apply brand hue to the document root CSS variable.
 * Call once on app startup in main.tsx.
 */
export function applyBrandHue(hue?: number) {
  const root = document.documentElement;
  root.style.setProperty('--brand-hue', String(hue ?? brand.hue));
}
