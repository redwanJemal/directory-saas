import { create } from 'zustand';

interface TenantState {
  tenantId: string | null;
  tenantSlug: string | null;
  tenantName: string | null;
}

interface TenantActions {
  setTenant: (tenant: { id: string; slug: string; name: string }) => void;
  clearTenant: () => void;
}

const STORAGE_KEY = 'saas_provider_tenant';

function loadFromStorage(): Partial<TenantState> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as Partial<TenantState>;
  } catch {
    // ignore
  }
  return {};
}

export const useTenantStore = create<TenantState & TenantActions>((set) => ({
  tenantId: null,
  tenantSlug: null,
  tenantName: null,
  ...loadFromStorage(),

  setTenant: (tenant) => {
    const state = { tenantId: tenant.id, tenantSlug: tenant.slug, tenantName: tenant.name };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    set(state);
  },

  clearTenant: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ tenantId: null, tenantSlug: null, tenantName: null });
  },
}));
