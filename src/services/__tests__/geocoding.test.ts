jest.mock('expo-constants', () => ({
  default: {
    expoConfig: { extra: { googleMapsApiKey: 'test-key' } },
  },
}));

import { geocodeAddress } from '../geocoding';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function okResponse(lat: number, lng: number) {
  return {
    ok: true,
    json: async () => ({
      status: 'OK',
      results: [{ geometry: { location: { lat, lng } } }],
    }),
  };
}

describe('geocodeAddress', () => {
  beforeEach(() => mockFetch.mockReset());

  it('returns lat/lng for a valid address', async () => {
    mockFetch.mockResolvedValueOnce(okResponse(37.77, -122.42));
    const result = await geocodeAddress('123 Main St');
    expect(result).toEqual({ lat: 37.77, lng: -122.42 });
  });

  it('encodes the address in the request URL', async () => {
    mockFetch.mockResolvedValueOnce(okResponse(0, 0));
    await geocodeAddress('123 Main St, City');
    const url: string = mockFetch.mock.calls[0][0];
    expect(url).toContain('123%20Main%20St');
  });

  it('throws when the HTTP response is not ok', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 429 });
    await expect(geocodeAddress('x')).rejects.toThrow('429');
  });

  it('throws when geocoding status is not OK', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ZERO_RESULTS', results: [] }),
    });
    await expect(geocodeAddress('nowhere')).rejects.toThrow('ZERO_RESULTS');
  });
});
