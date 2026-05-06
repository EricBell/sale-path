import { buildRoute } from '../routing';
import { YardSale, HomeLocation } from '../../types';

const HOME: HomeLocation = { address: 'Home', lat: 37.770, lng: -122.420 };

function sale(
  id: string,
  lat: number,
  lng: number,
  priority: YardSale['priority'] = 3,
  skipped = false,
): YardSale {
  return { id, rawAddress: `${id} St`, notes: '', priority, lat, lng, clusterId: null, visited: false, skipped };
}

describe('buildRoute', () => {
  it('returns empty orderedStops for empty input', () => {
    const route = buildRoute([], HOME);
    expect(route.orderedStops).toHaveLength(0);
    expect(route.home).toBe(HOME);
  });

  it('includes all eligible (geocoded, not skipped) sales', () => {
    const sales = [sale('a', 37.78, -122.43), sale('b', 37.76, -122.41)];
    const route = buildRoute(sales, HOME);
    expect(route.orderedStops).toHaveLength(2);
  });

  it('excludes skipped sales', () => {
    const sales = [sale('a', 37.78, -122.43), sale('b', 37.76, -122.41, 3, true)];
    const route = buildRoute(sales, HOME);
    expect(route.orderedStops).toHaveLength(1);
    expect(route.orderedStops[0].id).toBe('a');
  });

  it('excludes sales with null coordinates', () => {
    const s = sale('a', 0, 0);
    s.lat = null;
    s.lng = null;
    const route = buildRoute([s, sale('b', 37.77, -122.42)], HOME);
    expect(route.orderedStops).toHaveLength(1);
    expect(route.orderedStops[0].id).toBe('b');
  });

  it('favors a high-priority sale nearby over a low-priority one at equal distance', () => {
    // Both ~0.5km from home, different priority
    const low = sale('low', 37.774, -122.425, 1);
    const high = sale('high', 37.766, -122.415, 5);
    const route = buildRoute([low, high], HOME);
    expect(route.orderedStops[0].id).toBe('high');
  });

  it('visits high-priority sale first even when slightly farther', () => {
    // close = ~0.01km from home, priority 1
    // far   = ~0.5km from home, priority 5
    const close = sale('close', 37.7701, -122.4201, 1);
    const far = sale('far', 37.774, -122.425, 5);
    const route = buildRoute([close, far], HOME);
    // score(far, step=0)  ≈ 15 + 5 - 0.6*5 = 17
    // score(close, step=0) ≈  3 + 5 - 0.01*5 = 7.95
    expect(route.orderedStops[0].id).toBe('far');
  });

  it('handles a single sale', () => {
    const route = buildRoute([sale('only', 37.77, -122.42)], HOME);
    expect(route.orderedStops).toHaveLength(1);
  });
});
