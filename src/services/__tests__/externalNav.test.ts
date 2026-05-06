import { YardSale } from '../../types';

jest.mock('react-native', () => ({
  Linking: {
    canOpenURL: jest.fn(),
    openURL: jest.fn(),
  },
  Platform: { OS: 'android' },
}));

import { Linking } from 'react-native';
import { navigateTo } from '../externalNav';

const sale: YardSale = {
  id: '1',
  rawAddress: '123 Main St, Springfield',
  notes: '',
  priority: 3,
  lat: 37.77,
  lng: -122.42,
  clusterId: null,
  visited: false,
  skipped: false,
};

const canOpen = Linking.canOpenURL as jest.Mock;
const openURL = Linking.openURL as jest.Mock;

describe('navigateTo', () => {
  beforeEach(() => {
    canOpen.mockReset();
    openURL.mockReset();
    openURL.mockResolvedValue(undefined);
  });

  it('opens a geo: URL on Android when available', async () => {
    canOpen.mockResolvedValueOnce(true);
    await navigateTo(sale);
    expect(openURL).toHaveBeenCalledWith(expect.stringMatching(/^geo:37\.77,-122\.42/));
  });

  it('falls back to google.com/maps when geo: URL is unavailable', async () => {
    canOpen.mockResolvedValueOnce(false);
    await navigateTo(sale);
    expect(openURL).toHaveBeenCalledWith(expect.stringContaining('google.com/maps'));
  });

  it('encodes the address in the fallback URL', async () => {
    canOpen.mockResolvedValueOnce(false);
    await navigateTo(sale);
    const url: string = openURL.mock.calls[0][0];
    expect(url).toContain('123%20Main%20St');
  });
});
