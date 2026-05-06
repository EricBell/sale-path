Sale Path — Yard Sale Route Optimizer (Android)                          
                                     
 Context

 A personal Android app for planning yard sale driving routes on Saturday mornings.
 The core insight: shortest distance is not the best route — high-priority sales should be
 hit early while energy is high, even if they're slightly out of the way. The app scores
 stops by priority + early-morning value − driving cost, not pure TSP.

 Session-only: no persistence between runs. Always-online: geocoding and map tiles
 via network. Input: paste a block of addresses (one per line).

 ---
 Stack

 Identical to yardsale-recorder plus the additions below:

 ┌────────────┬─────────────────────────────────────────────────────────────────┐
 │   Layer    │                           Technology                            │
 ├────────────┼─────────────────────────────────────────────────────────────────┤
 │ Framework  │ React Native 0.81.5 + Expo ~54 (managed workflow)               │
 ├────────────┼─────────────────────────────────────────────────────────────────┤
 │ Language   │ TypeScript 5.9                                                  │
 ├────────────┼─────────────────────────────────────────────────────────────────┤
 │ Maps       │ react-native-maps ~1.x (Google Maps provider on Android)        │
 ├────────────┼─────────────────────────────────────────────────────────────────┤
 │ Geocoding  │ Google Maps Geocoding REST API (direct fetch, no extra package) │
 ├────────────┼─────────────────────────────────────────────────────────────────┤
 │ Navigation │ @react-navigation/native + @react-navigation/native-stack       │
 ├────────────┼─────────────────────────────────────────────────────────────────┤
 │ State      │ Local React state (no global store)                             │
 ├────────────┼─────────────────────────────────────────────────────────────────┤
 │ Build      │ EAS Build / Expo Go for development                             │
 ├────────────┼─────────────────────────────────────────────────────────────────┤
 │ Testing    │ Jest 30 + jest-expo + React Native Testing Library              │
 └────────────┴─────────────────────────────────────────────────────────────────┘

 API key: stored in .env as GOOGLE_MAPS_API_KEY, injected into app.json
 via expo-constants / app.config.js. Key is never committed to git.
 Used for both Maps SDK for Android and Geocoding API (one key covers both).

 ---
 Directory Structure

 sale-path/
 ├── App.tsx                    # Root — NavigationContainer + SafeAreaView
 ├── index.ts                   # Expo entry
 ├── app.config.js              # Dynamic Expo config (reads .env for API key)
 ├── app.json                   # Static Expo config (package ID, etc.)
 ├── eas.json                   # EAS build profiles
 ├── .env                       # GOOGLE_MAPS_API_KEY (gitignored)
 ├── assets/
 └── src/
     ├── types/index.ts          # Core interfaces (see Data Model below)
     ├── screens/
     │   ├── InputScreen.tsx     # Paste addresses + set priority/notes + home address
     │   ├── MapScreen.tsx       # Map with color-coded cluster pins + route polyline
     │   └── RouteScreen.tsx     # Ordered stop list with Skip / Navigate buttons
     ├── hooks/
     │   ├── useGeocoding.ts     # Geocode all addresses, manage loading/error state
     │   └── useRoute.ts         # Build and maintain the scored route; expose skip()
     └── services/
         ├── geocoding.ts        # fetch() → Google Geocoding API → {lat, lng}
         ├── clustering.ts       # Distance-threshold clustering (union-find, ~0.5mi radius)
         ├── routing.ts          # Greedy priority-weighted nearest-neighbor algorithm
         └── externalNav.ts      # Deep-link to Google Maps / Apple Maps per stop

 ---
 Data Model (src/types/index.ts)

 export interface YardSale {
   id: string;              // uuid or index
   rawAddress: string;      // original pasted text
   notes: string;           // "tools", "furniture", etc.
   priority: 1 | 2 | 3 | 4 | 5;
   lat: number | null;      // null until geocoded
   lng: number | null;
   clusterId: number | null;
   visited: boolean;
   skipped: boolean;
 }

 export interface Cluster {
   id: number;
   centroid: { lat: number; lng: number };
   color: string;           // one of 6 distinct colors
   sales: YardSale[];
 }

 export interface HomeLocation {
   address: string;
   lat: number;
   lng: number;
 }

 export interface AppRoute {
   orderedStops: YardSale[];   // re-computed after every skip
   home: HomeLocation;
 }

 ---
 Screens

 InputScreen

 - TextInput (multiline) — user pastes addresses, one per line
 - Per-address row (after paste is parsed): address text, 1–5 star priority, notes field
 - Home address field at top (geocoded separately)
 - "Build Route" button → geocodes all addresses → navigates to MapScreen

 MapScreen

 - MapView (react-native-maps, Google Maps provider)
 - Pins colored by cluster ID (6-color palette)
 - Home pin (distinct color/icon)
 - Polyline overlay showing route order
 - Floating "View Route List" button → navigates to RouteScreen
 - Back button → InputScreen (discard route)

 RouteScreen

 - Numbered list of stops in route order
 - Per-stop: address, notes, priority badge, cluster color dot
 - "Navigate" button → externalNav.ts opens Google Maps turn-by-turn to that address
 - "Skip" button → marks stop skipped, calls useRoute.skip(id), list re-orders
 - "Done" / back → returns to MapScreen

 ---
 Core Algorithms

 Clustering (services/clustering.ts)

 Union-find with ~0.5-mile (800m) Haversine distance threshold:
 1. Compute pairwise distances between all geocoded sales
 2. Merge any two sales within threshold into the same cluster
 3. Assign sequential cluster IDs; compute centroid per cluster

 Routing (services/routing.ts)

 Greedy nearest-neighbor with priority bias:
 score(candidate, currentPos, stepIndex) =
     (priority × 3)                    // 1–5 → 3–15 pts
   + (5 - stepIndex × 0.5)            // freshness bonus, decays each step
   - (haversine(currentPos, candidate) × distanceWeight)
 1. Start at home location
 2. Score all unvisited, unskipped sales from current position
 3. Visit highest score next; update currentPos
 4. Repeat until all sales processed
 5. skip(id) marks sale, re-runs from current position in remaining list

 External Navigation (services/externalNav.ts)

 // Android: geo intent → Google Maps
 `geo:${lat},${lng}?q=${encodeURIComponent(address)}`
 // iOS fallback: Apple Maps
 `maps://?daddr=${encodeURIComponent(address)}`
 // Universal fallback: google.com/maps

 ---
 Key Implementation Notes

 - app.config.js replaces static app.json for the androidGoogleMapsApiKey injection
 - react-native-maps must be in app.json plugins array for Expo managed workflow
 - Geocoding is done in parallel (Promise.all) with a small delay between batches
 to stay within Google's rate limits (50 QPS free tier is plenty for ~20 addresses)
 - No route persistence — all state lives in React state passed via navigation params
 - useRoute holds the live AppRoute; skip() produces a new ordered array via
 re-running the greedy algorithm from the current stop index

 ---
 Navigation Flow

 InputScreen
   → [Build Route] → MapScreen  (params: sales[], clusters[], route)
       → [View List] → RouteScreen  (params: route, callbacks: onSkip, onDone)
           → [Navigate] → external Maps app
           → [Skip] → re-orders list in place
           → [Done] → back to MapScreen

 ---
 New Packages to Install

 npx expo install react-native-maps
 npx expo install @react-navigation/native @react-navigation/native-stack
 npx expo install react-native-screens react-native-safe-area-context
 npx expo install expo-constants

 ---
 Verification

 1. Run npx expo start → open in Expo Go on Android device
 2. Paste 5–8 real addresses in one city → "Build Route" → pins appear on map
 3. Clusters visible (nearby addresses share a color)
 4. Route polyline draws between pins in order
 5. Route list shows correct order; priority-5 sales near start
 6. "Skip" on stop 2 → list re-orders, stop 2 disappears
 7. "Navigate" on any stop → Google Maps opens with correct destination
 8. Run npm test — all unit tests pass

 ---
 Out of Scope (v1)

 - Offline geocoding
 - Saved routes / history
 - Real drive-time estimation (straight-line distance used as proxy)
 - Time/energy limit cutoff (noted in PRD but deferred)
 - "Morning priority route" vs "shortest route" toggle
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌