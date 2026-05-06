import { Linking, Platform } from 'react-native';
import { YardSale } from '../types';

export async function navigateTo(sale: YardSale): Promise<void> {
  const { lat, lng, rawAddress } = sale;
  const encoded = encodeURIComponent(rawAddress);

  if (Platform.OS === 'android') {
    const geoUrl = `geo:${lat},${lng}?q=${encoded}`;
    if (await Linking.canOpenURL(geoUrl)) {
      await Linking.openURL(geoUrl);
      return;
    }
  }

  if (Platform.OS === 'ios') {
    const appleUrl = `maps://?daddr=${encoded}`;
    if (await Linking.canOpenURL(appleUrl)) {
      await Linking.openURL(appleUrl);
      return;
    }
  }

  await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encoded}`);
}
