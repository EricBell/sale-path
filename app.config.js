export default ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY ?? '',
      },
    },
  },
  plugins: [
    [
      'react-native-maps',
      {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? '',
      },
    ],
  ],
  extra: {
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? '',
    eas: config.extra?.eas,
  },
});
