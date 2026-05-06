export default ({ config }) => ({
  ...config,
  extra: {
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? '',
    eas: config.extra?.eas,
  },
});
