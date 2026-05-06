const BASE_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'SalePathApp/1.0';

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
  const url = `${BASE_URL}?q=${encodeURIComponent(address)}&format=json&limit=1`;
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!response.ok) {
    throw new Error(`Geocoding request failed with status ${response.status}`);
  }
  const data = await response.json();
  if (!data[0]) {
    throw new Error(`No result for "${address}"`);
  }
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}
