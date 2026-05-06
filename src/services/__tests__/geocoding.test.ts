import { geocodeAddress } from '../geocoding';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function nominatimResponse(lat: number, lon: number) {
  return {
    ok: true,
    json: async () => [{ lat: String(lat), lon: String(lon) }],
  };
}

describe('geocodeAddress', () => {
  beforeEach(() => mockFetch.mockReset());

  it('returns lat/lng for a valid address', async () => {
    mockFetch.mockResolvedValueOnce(nominatimResponse(37.77, -122.42));
    const result = await geocodeAddress('123 Main St');
    expect(result).toEqual({ lat: 37.77, lng: -122.42 });
  });

  it('encodes the address in the request URL', async () => {
    mockFetch.mockResolvedValueOnce(nominatimResponse(0, 0));
    await geocodeAddress('123 Main St, City');
    const url: string = mockFetch.mock.calls[0][0];
    expect(url).toContain('123%20Main%20St');
  });

  it('includes the User-Agent header', async () => {
    mockFetch.mockResolvedValueOnce(nominatimResponse(0, 0));
    await geocodeAddress('x');
    const opts = mockFetch.mock.calls[0][1];
    expect(opts.headers['User-Agent']).toMatch(/SalePathApp/);
  });

  it('throws when the HTTP response is not ok', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 429 });
    await expect(geocodeAddress('x')).rejects.toThrow('429');
  });

  it('throws when no results are returned', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
    await expect(geocodeAddress('nowhere')).rejects.toThrow('No result');
  });
});
