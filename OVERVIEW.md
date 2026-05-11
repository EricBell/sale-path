# Sale Path — Overview

> A personal Android app that turns a pasted list of yard-sale addresses into a priority-weighted, geographically clustered driving route for Saturday morning runs.

## Purpose

Sale Path solves a specific problem: the shortest-distance route isn't the best yard-sale route. High-priority sales should be hit early while energy is high, even if they're slightly out of the way. The scoring algorithm explicitly biases toward high-priority stops at the start of the route, decaying as the morning progresses.

The app is session-only (no persistence between launches) and always-online (depends on network for geocoding and map tiles). Input is a plain-text paste of addresses, one per line.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React Native 0.81.6 + Expo ~54 (managed workflow) |
| Language | TypeScript 5.9 |
| Maps | react-native-maps ~1.27 (Google Maps provider on Android) |
| Geocoding | Nominatim (OpenStreetMap) — no API key required |
| Navigation | @react-navigation/native + native-stack |
| State | Local React state + navigation params (no global store) |
| Build | EAS Build / Expo Go for development |
| Tests | Jest 29.7 + jest-expo ~54 + React Native Testing Library |
| CI | GitHub Actions — Claude Code review on PRs + @claude mentions on issues/PRs |

## Directory Structure

```
sale-path/
├── .github/
│   └── workflows/
│       ├── claude.yml            # Claude Code bot — responds to @claude in issues/PRs
│       └── claude-code-review.yml # Automated Claude review on every PR
├── App.tsx                   # Root: NavigationContainer + 3-screen stack
├── index.ts                  # Expo entry point
├── app.config.js             # Dynamic Expo config — injects GOOGLE_MAPS_API_KEY
├── app.json                  # Static Expo config (package ID, plugins)
├── eas.json                  # EAS build profiles
├── .env.example              # GOOGLE_MAPS_API_KEY placeholder
└── src/
    ├── types/index.ts        # Core interfaces: YardSale, Cluster, HomeLocation, AppRoute
    ├── screens/
    │   ├── InputScreen.tsx   # Address paste + priority/notes editor + "Build Route"
    │   ├── MapScreen.tsx     # Cluster-colored pins + route polyline
    │   └── RouteScreen.tsx   # Ordered stop list with Skip / Navigate actions
    ├── hooks/
    │   ├── useGeocoding.ts   # Sequential geocoding with progress state
    │   └── useRoute.ts       # Holds live AppRoute; exposes skip()
    └── services/
        ├── geocoding.ts      # fetch → Nominatim → {lat, lng}
        ├── clustering.ts     # Union-find at 0.8 km threshold
        ├── routing.ts        # Greedy priority-weighted nearest-neighbor
        └── externalNav.ts    # Deep-link to device Maps app per stop
```

## Architecture

### Navigation flow

Three screens wired by `@react-navigation/native-stack`:

```
InputScreen
  → [Build Route] → MapScreen  (params: sales[], clusters[], home)
      → [View Route List] → RouteScreen  (params: sales[], home)
```

All state travels as navigation params — there is no global store. `useRoute` is instantiated independently in both MapScreen and RouteScreen; each holds its own `AppRoute` copy. Skipping a stop on RouteScreen does not update MapScreen's polyline.

### Data flow

1. User pastes addresses in InputScreen → `YardSale[]` built client-side (no coords yet)
2. "Build Route" triggers `useGeocoding.geocodeAll()` — sequential Nominatim requests, 1.1 s apart (rate limit compliance)
3. After geocoding, `clusterSales()` runs once → assigns `clusterId` on each `YardSale` in-place, returns `Cluster[]`
4. Navigate to MapScreen with geocoded sales + clusters
5. `useRoute` calls `buildRoute()` → greedy algorithm produces `AppRoute`
6. RouteScreen calls `skip(id)` → re-runs `buildRoute()` on updated sales array

### Core algorithms

**Clustering** (`src/services/clustering.ts`): Union-find over pairwise Haversine distances. Any two sales within 0.8 km (≈0.5 miles) are merged. Centroids are averaged lat/lng. Assigns one of 6 hex colors cycling by cluster ID.

**Routing** (`src/services/routing.ts`): Greedy nearest-best-neighbor. At each step, scores every remaining unskipped, geocoded sale:

```
score = (priority × 3) + (5 − stepIndex × 0.5) − (haversine_km × 5)
```

Priority (1–5) contributes 3–15 pts; a freshness bonus of 5 decays by 0.5 per step; distance costs 5 pts/km. The algorithm starts at home and greedily picks the highest scorer. No API calls — pure math.

**External navigation** (`src/services/externalNav.ts`): Android opens `geo:{lat},{lng}?q={address}`, iOS opens `maps://?daddr={address}`, universal fallback is `https://www.google.com/maps/search/?api=1&query={address}`.

## Integrations

| Service | Purpose | Where |
|---------|---------|-------|
| Nominatim (OpenStreetMap) | Free geocoding — address → lat/lng | `src/services/geocoding.ts` |
| Google Maps (Android) | Map tiles and pin rendering via react-native-maps | `app.json` plugin config, requires `GOOGLE_MAPS_API_KEY` |
| Device Maps app | Turn-by-turn navigation per stop | `src/services/externalNav.ts` |

## Database & Data Layer

Frontend-only — no database or persistent storage. All state is held in React component state and passed via navigation params. Nothing survives an app restart.

## Connectivity & Configuration

| Variable | Purpose |
|----------|---------|
| `GOOGLE_MAPS_API_KEY` | Android Maps SDK (map tile rendering). Set in `.env`, injected via `app.config.js` into Expo constants. Not used for geocoding — Nominatim needs no key. |

## Key Entry Points

| File | Why read it first |
|------|------------------|
| `src/types/index.ts` | Defines every data shape in the app |
| `App.tsx` | Navigation stack + param types (`RootStackParamList`) |
| `src/services/routing.ts` | The core scoring algorithm — everything else supports this |
| `src/hooks/useGeocoding.ts` | Orchestrates the geocoding pipeline; owns the loading/error UX |

## Notes & Gotchas

- **Geocoding is sequential, not parallel.** `useGeocoding.ts` sleeps 1.1 s between requests to respect Nominatim's 1 req/sec policy. For 20 addresses this takes ~22 seconds.
- **`clusterSales()` mutates its input.** It writes `clusterId` directly onto each `YardSale` object passed in. This is intentional — the same objects flow to MapScreen and RouteScreen.
- **PRD vs. implementation divergence.** `prd.md` specifies Google Maps Geocoding API; the actual code uses Nominatim. `GOOGLE_MAPS_API_KEY` is only used for the map tile renderer (react-native-maps), not for geocoding.
- **`useRoute` is not shared.** MapScreen and RouteScreen each instantiate `useRoute` independently. The map polyline will not update when stops are skipped on the route list screen.
- **`visited` field is unused.** `YardSale.visited` is defined in the type but never set to `true` anywhere in the current implementation.
- **Out of scope for v1:** offline geocoding, saved routes/history, real drive-time estimation, time/energy cutoff, route-style toggle (priority vs. shortest).
