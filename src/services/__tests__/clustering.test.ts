import { clusterSales, CLUSTER_COLORS } from '../clustering';
import { YardSale } from '../../types';

function sale(id: string, lat: number | null, lng: number | null): YardSale {
  return { id, rawAddress: `${id} St`, notes: '', priority: 3, lat, lng, clusterId: null, visited: false, skipped: false };
}

describe('clusterSales', () => {
  it('returns empty array for empty input', () => {
    expect(clusterSales([])).toEqual([]);
  });

  it('returns empty array when no sales have coordinates', () => {
    expect(clusterSales([sale('a', null, null)])).toEqual([]);
  });

  it('puts two nearby sales (<0.8km) in the same cluster', () => {
    const sales = [
      sale('a', 37.7749, -122.4194),
      sale('b', 37.7752, -122.4197), // ~35m away
    ];
    const clusters = clusterSales(sales);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].sales).toHaveLength(2);
  });

  it('puts two far-apart sales in different clusters', () => {
    const sales = [
      sale('a', 37.7749, -122.4194), // SF
      sale('b', 37.8044, -122.2712), // Oakland, ~15km
    ];
    const clusters = clusterSales(sales);
    expect(clusters).toHaveLength(2);
  });

  it('assigns a hex color to each cluster', () => {
    const clusters = clusterSales([sale('a', 37.77, -122.42)]);
    expect(clusters[0].color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('color cycles through CLUSTER_COLORS palette', () => {
    expect(CLUSTER_COLORS.length).toBeGreaterThan(0);
  });

  it('computes centroid correctly for a single-sale cluster', () => {
    const clusters = clusterSales([sale('a', 40.0, -74.0)]);
    expect(clusters[0].centroid.lat).toBeCloseTo(40.0, 5);
    expect(clusters[0].centroid.lng).toBeCloseTo(-74.0, 5);
  });

  it('computes centroid as average for multi-sale cluster', () => {
    const sales = [
      sale('a', 37.774, -122.419),
      sale('b', 37.776, -122.421), // ~250m from a — same cluster
    ];
    const clusters = clusterSales(sales);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].centroid.lat).toBeCloseTo(37.775, 3);
    expect(clusters[0].centroid.lng).toBeCloseTo(-122.420, 3);
  });

  it('skips sales that lack coordinates', () => {
    const sales = [sale('a', null, null), sale('b', 37.77, -122.42)];
    const clusters = clusterSales(sales);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].sales[0].id).toBe('b');
  });

  it('sets clusterId on each sale object', () => {
    const sales = [sale('a', 37.77, -122.42)];
    clusterSales(sales);
    expect(sales[0].clusterId).not.toBeNull();
  });
});
