import Constants from 'expo-constants';

const API_KEY = (Constants.expoConfig?.extra?.googleMapsApiKey as string) ?? '';
const BASE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
  const url = `${BASE_URL}?address=${encodeURIComponent(address)}&key=${API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Geocoding request failed with status ${response.status}`);
  }
  const data = await response.json();
  if (data.status !== 'OK' || !data.results[0]) {
    throw new Error(`Geocoding failed for "${address}": ${data.status}`);
  }
  const { lat, lng } = data.results[0].geometry.location;
  return { lat, lng };
}
