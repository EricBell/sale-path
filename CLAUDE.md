# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start dev server (opens Expo DevTools)
npm start

# Run on Android / iOS
npm run android
npm run ios

# Run all tests
npm test

# Run a single test file
npx jest src/services/__tests__/routing.test.ts

# Run tests with coverage
npm run test:coverage
```

## Architecture

**Sale Path** is an Expo/React Native yard-sale route optimizer. The user pastes a list of addresses, assigns per-sale priorities and notes, and the app geocodes them, clusters nearby sales, and builds an optimized driving route.

### Navigation flow

`App.tsx` defines a three-screen native stack:

1. **InputScreen** — address paste, per-sale priority (1–5 stars) and notes, triggers geocoding → navigate to Map
2. **MapScreen** — `react-native-maps` view with color-coded cluster markers, dashed polyline route, FAB to Route list
3. **RouteScreen** — ordered `FlatList` of stops with Navigate (opens device maps app) and Skip actions

### Data flow

`InputScreen` calls `useGeocoding` → geocodes serially via Nominatim (1.1 s delay per request to respect rate limit) → passes geocoded `YardSale[]` + `HomeLocation` to MapScreen via nav params.

`clusterSales` (union-find, 0.8 km radius) runs once after geocoding and is passed to MapScreen. `buildRoute` runs inside `useRoute` (called by both MapScreen and RouteScreen), re-runs whenever a sale is skipped.

### Core algorithms (`src/services/`)

- **`clustering.ts`** — union-find clustering at 0.8 km radius; assigns `clusterId` on each `YardSale` in-place and returns `Cluster[]` with centroids and colors.
- **`routing.ts`** — greedy nearest-best-neighbor: at each step picks the sale maximizing `priority * 3 + (5 - stepIndex * 0.5) - dist_km * 5`. No API calls.
- **`geocoding.ts`** — thin wrapper around Nominatim (`nominatim.openstreetmap.org`); no API key required.
- **`externalNav.ts`** — opens `geo:` URI on Android, `maps://` on iOS, falls back to Google Maps web URL.

### Key types (`src/types/index.ts`)

`YardSale` is the central entity (id, rawAddress, notes, priority 1–5, lat/lng nullable, clusterId, visited, skipped). `AppRoute` is `{ orderedStops: YardSale[], home: HomeLocation }`.

### Tests

Tests live in `src/services/__tests__/` and cover all four services. They run in Jest with the `jest-expo` preset. `jest.setup.js` pre-resolves Expo lazy globals that throw inside tests.

### Environment

`GOOGLE_MAPS_API_KEY` in `.env` is read by `app.config.js` and exposed via `expo-constants`. The key is not used yet — geocoding currently runs through Nominatim without a key.
