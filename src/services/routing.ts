import { YardSale, HomeLocation, AppRoute } from '../types';

const DISTANCE_WEIGHT = 5;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function scoreCandidate(
  sale: YardSale,
  fromLat: number,
  fromLng: number,
  stepIndex: number,
): number {
  const dist = haversineKm(fromLat, fromLng, sale.lat!, sale.lng!);
  return sale.priority * 3 + (5 - stepIndex * 0.5) - dist * DISTANCE_WEIGHT;
}

export function buildRoute(sales: YardSale[], home: HomeLocation): AppRoute {
  const remaining = sales.filter((s) => s.lat !== null && s.lng !== null && !s.skipped);
  const ordered: YardSale[] = [];
  let curLat = home.lat;
  let curLng = home.lng;

  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestScore = -Infinity;
    remaining.forEach((sale, i) => {
      const s = scoreCandidate(sale, curLat, curLng, ordered.length);
      if (s > bestScore) {
        bestScore = s;
        bestIdx = i;
      }
    });
    const next = remaining.splice(bestIdx, 1)[0];
    ordered.push(next);
    curLat = next.lat!;
    curLng = next.lng!;
  }

  return { orderedStops: ordered, home };
}
