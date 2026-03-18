import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useCountryStore } from '@/stores/country-store';
import type { ApiResponse } from '@/lib/types';

interface DetectedCountry {
  countryCode: string | null;
  country: {
    code: string;
    name: string;
    nameAm: string;
    nameAr: string;
  } | null;
  source: 'header' | 'subdomain' | 'default' | 'none';
}

/**
 * Detects the user's country from subdomain or Cloudflare headers.
 * Also checks for country code in the URL subdomain (ae.habeshahub.com).
 * Results are cached in the country store (localStorage-backed).
 */
export function useCountryDetection() {
  const { countryCode, source, initialized, setCountry, setInitialized } =
    useCountryStore();

  // Check subdomain first (client-side, synchronous)
  const subdomainCountry = getCountryFromSubdomain();

  const { data } = useQuery({
    queryKey: ['country-detect'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<DetectedCountry>>(
        '/locations/detect',
      );
      return response.data.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    enabled: !initialized && !subdomainCountry,
    retry: 1,
  });

  useEffect(() => {
    if (initialized) return;

    // Priority 1: subdomain
    if (subdomainCountry) {
      setCountry(subdomainCountry, 'subdomain');
      return;
    }

    // Priority 2: API response
    if (data?.countryCode) {
      setCountry(data.countryCode, data.source === 'header' ? 'header' : 'default');
      return;
    }
  }, [subdomainCountry, data, initialized, setCountry, setInitialized]);

  return { countryCode, source, initialized };
}

const COUNTRY_SUBDOMAINS = new Set([
  'ae', 'sa', 'kw', 'qa', 'bh', 'om',
]);

function getCountryFromSubdomain(): string | null {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    const sub = parts[0].toLowerCase();
    if (COUNTRY_SUBDOMAINS.has(sub)) {
      return sub.toUpperCase();
    }
  }
  return null;
}
