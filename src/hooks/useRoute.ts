import { useState, useCallback } from 'react';
import { YardSale, HomeLocation, AppRoute } from '../types';
import { buildRoute } from '../services/routing';

export function useRoute(initialSales: YardSale[], home: HomeLocation) {
  const [sales, setSales] = useState<YardSale[]>(initialSales);
  const [route, setRoute] = useState<AppRoute>(() => buildRoute(initialSales, home));

  const skip = useCallback(
    (id: string) => {
      setSales((prev) => {
        const updated = prev.map((s) => (s.id === id ? { ...s, skipped: true } : s));
        setRoute(buildRoute(updated, home));
        return updated;
      });
    },
    [home],
  );

  return { route, skip };
}
