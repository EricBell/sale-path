export interface YardSale {
  id: string;
  rawAddress: string;
  notes: string;
  priority: 1 | 2 | 3 | 4 | 5;
  lat: number | null;
  lng: number | null;
  clusterId: number | null;
  visited: boolean;
  skipped: boolean;
}

export interface Cluster {
  id: number;
  centroid: { lat: number; lng: number };
  color: string;
  sales: YardSale[];
}

export interface HomeLocation {
  address: string;
  lat: number;
  lng: number;
}

export interface AppRoute {
  orderedStops: YardSale[];
  home: HomeLocation;
}

export interface SavedMap {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  sales: YardSale[];
  clusters: Cluster[];
  home: HomeLocation;
  clusterRadiusMiles: number;
}
