import { useCountryDetection } from '@/hooks/use-country-detection';

/**
 * Invisible component that triggers country detection on mount.
 * Place it at the top level of the app to ensure detection runs early.
 */
export function CountryDetectionProvider() {
  useCountryDetection();
  return null;
}
