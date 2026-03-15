import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import { Toaster } from '@/components/ui/sonner';
import { applyBrandHue } from '@/lib/branding';
import { initializeApiAuth } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import './i18n';
import App from './App';
import './index.css';

// Apply brand hue on startup
applyBrandHue();

// Initialize API auth integration
initializeApiAuth(() => useAuthStore.getState());

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" richColors closeButton />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
