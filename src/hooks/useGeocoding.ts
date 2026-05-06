import { useState } from 'react';
import { YardSale, HomeLocation } from '../types';
import { geocodeAddress } from '../services/geocoding';

// Nominatim enforces 1 req/sec — geocode sequentially with a gap.
const REQUEST_DELAY_MS = 1100;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function useGeocoding() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function geocodeAll(
    sales: YardSale[],
    homeAddress: string,
  ): Promise<{ sales: YardSale[]; home: HomeLocation } | null> {
    setLoading(true);
    setProgress('Geocoding home…');
    setError(null);
    try {
      const homeCoords = await geocodeAddress(homeAddress);
      const home: HomeLocation = { address: homeAddress, ...homeCoords };

      const result: YardSale[] = [];
      for (let i = 0; i < sales.length; i++) {
        setProgress(`Geocoding ${i + 1} / ${sales.length}…`);
        await sleep(REQUEST_DELAY_MS);
        try {
          const coords = await geocodeAddress(sales[i].rawAddress);
          result.push({ ...sales[i], ...coords });
        } catch {
          result.push({ ...sales[i], lat: null, lng: null });
        }
      }

      return { sales: result, home };
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Geocoding failed');
      return null;
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

  return { geocodeAll, loading, progress, error };
}
