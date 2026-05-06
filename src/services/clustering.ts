import { YardSale, Cluster } from '../types';

const CLUSTER_RADIUS_KM = 0.8; // ~0.5 miles

export const CLUSTER_COLORS = [
  '#E74C3C',
  '#3498DB',
  '#2ECC71',
  '#F39C12',
  '#9B59B6',
  '#1ABC9C',
];

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

function makeUnionFind(n: number) {
  const parent = Array.from({ length: n }, (_, i) => i);
  function find(x: number): number {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  }
  function union(x: number, y: number) {
    parent[find(x)] = find(y);
  }
  return { find, union };
}

export function clusterSales(sales: YardSale[]): Cluster[] {
  const geocoded = sales.filter((s) => s.lat !== null && s.lng !== null);
  const n = geocoded.length;
  if (n === 0) return [];

  const uf = makeUnionFind(n);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dist = haversineKm(geocoded[i].lat!, geocoded[i].lng!, geocoded[j].lat!, geocoded[j].lng!);
      if (dist <= CLUSTER_RADIUS_KM) uf.union(i, j);
    }
  }

  const rootToId = new Map<number, number>();
  let nextId = 0;
  geocoded.forEach((_, i) => {
    const root = uf.find(i);
    if (!rootToId.has(root)) rootToId.set(root, nextId++);
  });

  const groups = new Map<number, YardSale[]>();
  geocoded.forEach((sale, i) => {
    const clusterId = rootToId.get(uf.find(i))!;
    sale.clusterId = clusterId;
    if (!groups.has(clusterId)) groups.set(clusterId, []);
    groups.get(clusterId)!.push(sale);
  });

  const clusters: Cluster[] = [];
  groups.forEach((members, id) => {
    const avgLat = members.reduce((s, m) => s + m.lat!, 0) / members.length;
    const avgLng = members.reduce((s, m) => s + m.lng!, 0) / members.length;
    clusters.push({
      id,
      centroid: { lat: avgLat, lng: avgLng },
      color: CLUSTER_COLORS[id % CLUSTER_COLORS.length],
      sales: members,
    });
  });

  return clusters;
}
