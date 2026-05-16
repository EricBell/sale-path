# Sale Path — Overview

> A personal Android app that turns a pasted list of yard-sale addresses into a priority-weighted, geographically clustered driving route for Saturday morning runs.

## Purpose

Sale Path solves a specific problem: the shortest-distance route isn't the best yard-sale route. High-priority sales should be hit early while energy is high, even if they're slightly out of the way. The scoring algorithm explicitly biases toward high-priority stops at the start of the route, decaying as the morning progresses.

The app is always-online (depends on network for geocoding and map tiles). Input is a plain-text paste of addresses, one per line. Completed routes can be saved and reloaded across sessions.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React Native 0.81.6 + Expo ~54 (managed workflow) |
| Language | TypeScript 5.9 |
| Maps | react-native-maps ~1.27 (Google Maps provider on Android) |
| Geocoding | Nominatim (OpenStreetMap) — no API key required |
| Navigation | @react-navigation/native + native-stack |
| State | Local React state + navigation params (no global store) |
| Persistence | @react-native-async-storage/async-storage — cluster radius + home address |
| Sharing | expo-sharing ~14.0 — exports remaining-stop address list as a `.txt` file |
| Build | EAS Build / Expo Go for development |
| Tests | Jest 29.7 + jest-expo ~54 + React Native Testing Library |
| Persistence (maps) | @react-native-async-storage/async-storage — full `SavedMap` objects |
| CI | GitHub Actions — Claude Code review on PRs + @claude mentions on issues/PRs |

## Directory Structure

```
sale-path/
├── .github/
│   └── workflows/
│       ├── claude.yml            # Claude Code bot — responds to @claude in issues/PRs
│       └── claude-code-review.yml # Automated Claude review on every PR
├── App.tsx                   # Root: NavigationContainer + 5-screen stack
├── index.ts                  # Expo entry point
├── app.config.js             # Dynamic Expo config — injects GOOGLE_MAPS_API_KEY
├── app.json                  # Static Expo config (package ID, icon, plugins)
├── eas.json                  # EAS build profiles (development, preview, production)
├── assets/
│   └── icon.png              # App icon — 1024×1024 PNG
├── .env.example              # GOOGLE_MAPS_API_KEY placeholder
└── src/
    ├── types/index.ts        # Core interfaces: YardSale, Cluster, HomeLocation, AppRoute, SavedMap
    ├── screens/
    │   ├── InputScreen.tsx       # Address paste + priority/notes editor + "Build Route"
    │   ├── ValidationScreen.tsx  # Pre-geocoding review: flags issues, allows inline edits/removals
    │   ├── MapScreen.tsx         # Cluster-colored pins + route polyline; tap pin for overlay (Navigate, Mark Visited)
    │   ├── RouteScreen.tsx       # Ordered stop list with Skip / Navigate actions
    │   ├── HelpScreen.tsx        # Explains clustering, colors, and route scoring
    │   ├── SettingsScreen.tsx    # Cluster radius input (miles); persisted via AsyncStorage
    │   └── SavedMapsScreen.tsx   # List saved routes; load, rename, delete
    ├── hooks/
    │   ├── useGeocoding.ts   # Sequential geocoding with progress state
    │   └── useRoute.ts       # Holds live AppRoute; exposes skip()
    └── services/
        ├── geocoding.ts      # fetch → Nominatim → {lat, lng}
        ├── clustering.ts     # Union-find; radius configurable via parameter
        ├── routing.ts        # Greedy priority-weighted nearest-neighbor
        ├── externalNav.ts    # Deep-link to device Maps app per stop
        ├── settings.ts       # AsyncStorage load/save for cluster radius + home address
        ├── validation.ts     # Address normalization + issue detection (duplicates, no-number, junk, has-note)
        └── savedMaps.ts      # AsyncStorage CRUD for SavedMap objects
```

## Architecture

### Navigation flow

Seven screens wired by `@react-navigation/native-stack`:

```
InputScreen  ──[⚙]──→ SettingsScreen
             ──[?]───→ HelpScreen
             ──[💾]──→ SavedMapsScreen  → [Load] → MapScreen (existing saved route)
             ──[Build Route]──→ ValidationScreen  (params: entries[], sales[], homeAddress, clusterRadiusMiles)
                                    ──[Proceed]──→ MapScreen  (params: sales[], clusters[], home, clusterRadiusMiles, savedMapId?)
                                                       → [View Route List] → RouteScreen  (params: sales[], home)
                                                                                 → [Rebuild Map] → MapScreen (new instance, remaining stops only)
```

All runtime state travels as navigation params — there is no global store. `useRoute` is instantiated independently in both MapScreen and RouteScreen; each holds its own `AppRoute` copy. Skipping a stop on RouteScreen does not update the originating MapScreen's polyline.

RouteScreen's navigation bar has three header buttons (visible when stops remain): **Save** (exports remaining addresses as a timestamped `.txt` via `expo-sharing`), **Rebuild Map** (re-clusters remaining stops and pushes a fresh MapScreen), and **← Map** (go back). The old bottom "Done — Back to Map" button has been removed.

InputScreen uses `useFocusEffect` (not `useEffect`) to reload settings and home address each time it comes into focus, so changes made in SettingsScreen are picked up immediately.

### Data flow

1. User pastes addresses in InputScreen → `YardSale[]` built client-side (no coords yet)
2. "Build Route" calls `validateAddresses()` → normalizes addresses and flags issues (duplicates, missing house numbers, junk lines, parenthetical notes)
3. Navigate to ValidationScreen — user can edit addresses inline or mark them removed; issues shown as colored badges
4. "Proceed" triggers `useGeocoding.geocodeAll()` on kept addresses — sequential Nominatim requests, 1.1 s apart (rate limit compliance)
5. After geocoding, `clusterSales()` runs once → assigns `clusterId` on each `YardSale` in-place, returns `Cluster[]`
6. Navigate to MapScreen with geocoded sales + clusters
7. `useRoute` calls `buildRoute()` → greedy algorithm produces `AppRoute`
8. RouteScreen calls `skip(id)` → re-runs `buildRoute()` on updated sales array
9. (Optional) "Rebuild Map" → filters to non-skipped stops, re-clusters, pushes a new MapScreen with only remaining stops
10. (Optional) MapScreen "Save" → `saveMap()` persists the full `SavedMap` to AsyncStorage; LoadedMaps screen can load it back

### Core algorithms

**Clustering** (`src/services/clustering.ts`): Union-find over pairwise Haversine distances. The radius defaults to 0.8 km (≈0.5 miles) but is now a parameter — InputScreen converts the user's saved miles value to km and passes it in. Centroids are averaged lat/lng. Assigns one of 6 hex colors cycling by cluster ID.

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

Three AsyncStorage keys persist data across restarts:

| Key | Value | Managed by |
|-----|-------|-----------|
| `@sale-path/settings` | JSON — `{ clusterRadiusMiles: number }` | `src/services/settings.ts` |
| `@sale-path/homeAddress` | Plain string — starting address | `src/services/settings.ts` |
| `@sale-path/savedMaps` | JSON array of `SavedMap` objects | `src/services/savedMaps.ts` |

`SavedMap` stores: `id`, `name`, `createdAt`, `updatedAt`, `sales[]`, `clusters[]`, `home`, `clusterRadiusMiles`. Full routes now survive app restarts and can be reloaded from SavedMapsScreen.

Transient state (active geocoding, live route order, skip state) is still held in React component state and does not persist.

## Connectivity & Configuration

| Variable | Purpose |
|----------|---------|
| `GOOGLE_MAPS_API_KEY` | Android Maps SDK (map tile rendering). Set in `.env`, injected via `app.config.js` into Expo constants. Not used for geocoding — Nominatim needs no key. |

`expo-file-system` is in `package.json` but **do not use it for persistence** — `FileSystem.documentDirectory` returns null in the current environment. Use `@react-native-async-storage/async-storage` instead (already in use for settings).

## Key Entry Points

| File | Why read it first |
|------|------------------|
| `src/types/index.ts` | Defines every data shape in the app |
| `App.tsx` | Navigation stack + param types (`RootStackParamList`) |
| `src/services/routing.ts` | The core scoring algorithm — everything else supports this |
| `src/hooks/useGeocoding.ts` | Orchestrates the geocoding pipeline; owns the loading/error UX |

## Notes & Gotchas

- **Validation runs before geocoding.** `validateAddresses()` in `src/services/validation.ts` normalizes and flags addresses (5 issue types). The `has-note` issue flags addresses containing parentheticals like `(cash only)` — these need to be stripped before geocoding or Nominatim will fail to match them. ValidationScreen lets users edit addresses inline or remove them before geocoding starts.
- **Geocoding is sequential, not parallel.** `useGeocoding.ts` sleeps 1.1 s between requests to respect Nominatim's 1 req/sec policy. For 20 addresses this takes ~22 seconds.
- **`clusterSales()` mutates its input.** It writes `clusterId` directly onto each `YardSale` object passed in. This is intentional — the same objects flow to MapScreen and RouteScreen.
- **PRD vs. implementation divergence.** `prd.md` specifies Google Maps Geocoding API; the actual code uses Nominatim. `GOOGLE_MAPS_API_KEY` is only used for the map tile renderer (react-native-maps), not for geocoding.
- **`useRoute` is not shared.** MapScreen and RouteScreen each instantiate `useRoute` independently. The map polyline will not update when stops are skipped on the route list screen.
- **Visited state lives in MapScreen only.** Tapping a pin opens a bottom overlay with Navigate and Mark Visited / Mark Unvisited buttons. Visited stops render as a gray circle with a white ✓ (custom marker view); unvisited stops use the default teardrop pin in their cluster color. `visitedIds` is a `Set<string>` in MapScreen state, merged into `sales[]` at save time so it persists in `SavedMap`. Custom marker views use `tracksViewChanges={false}` for performance. Do not use `Callout` for interactive content on Android — nested touchables inside `Callout` silently break rendering.
- **Version display.** HelpScreen reads `version` directly from `package.json` and shows it as "Sale Path v{version}" at the top of the screen.
- **`expo-file-system` quirk.** `FileSystem.documentDirectory` returns null in this environment (cause unknown). RouteScreen's Save feature uses `expo-file-system/legacy` (not the main entrypoint) and falls back to `cacheDirectory ?? documentDirectory`. For persistent key-value storage use `@react-native-async-storage/async-storage` instead.
- **Out of scope for v1:** offline geocoding, saved routes/history, real drive-time estimation, time/energy cutoff, route-style toggle (priority vs. shortest).
