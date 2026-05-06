import { useState } from 'react';
import { YardSale, HomeLocation } from '../types';
import { geocodeAddress } from '../services/geocoding';

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 200;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function useGeocoding() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function geocodeAll(
    sales: YardSale[],
    homeAddress: string,
  ): Promise<{ sales: YardSale[]; home: HomeLocation } | null> {
    setLoading(true);
    setError(null);
    try {
      const homeCoords = await geocodeAddress(homeAddress);
      const home: HomeLocation = { address: homeAddress, ...homeCoords };

      const result: YardSale[] = [];
      for (let i = 0; i < sales.length; i += BATCH_SIZE) {
        const batch = sales.slice(i, i + BATCH_SIZE);
        const resolved = await Promise.all(
          batch.map(async (sale) => {
            try {
              const coords = await geocodeAddress(sale.rawAddress);
              return { ...sale, ...coords };
            } catch {
              return { ...sale, lat: null, lng: null };
            }
          }),
        );
        result.push(...resolved);
        if (i + BATCH_SIZE < sales.length) await sleep(BATCH_DELAY_MS);
      }

      return { sales: result, home };
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Geocoding failed');
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { geocodeAll, loading, error };
}
