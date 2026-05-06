# Yardsale Recorder — Overview

> A mobile app for quickly cataloging items (yard sales, estate sales, inventory) by capturing a photo and an immediate voice description in one seamless workflow.

## Purpose

Yardsale Recorder solves the "two-app problem" — instead of switching between camera and voice recorder, users tap one button to capture a photo and the app auto-starts audio recording immediately. A second tap stops the recording. The photo and audio are saved as a linked pair (identified by Unix timestamp). All data is local; there is no backend. Target platform is Android (Samsung Galaxy S23 primary), iOS future.

Current version: **0.2.0** — MVP complete, all 5 development phases done.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.81.5 + Expo ~54 (managed workflow) |
| Language | TypeScript 5.9 |
| Camera | expo-camera ~17 |
| Audio recording/playback | expo-av ~16 |
| File system | expo-file-system ~19 (legacy API) |
| Metadata storage | @react-native-async-storage/async-storage 2.2 |
| Sharing / export | expo-sharing ~14 + jszip ^3.10 |
| Haptics | expo-haptics ~15 |
| Build system | EAS Build (eas.json), Expo Go for development |
| Testing | Jest 30 + jest-expo + React Native Testing Library |

## Directory Structure

```
yardsale-recorder/
├── App.tsx                  # Root — mounts CameraScreen inside SafeAreaView
├── index.ts                 # Expo entry point
├── app.json                 # Expo config (permissions, package ID, EAS project)
├── eas.json                 # EAS build profiles (dev / preview / production)
├── assets/                  # App icon, splash, favicon
├── features/
│   └── share.feature        # Gherkin BDD scenarios for sharing flow
└── src/
    ├── types/index.ts        # Core interfaces: PhotoAudioPair, Manifest, AppState enum
    ├── hooks/
    │   ├── useCameraState.ts # State machine hook (primary app FSM)
    │   └── useManifest.ts    # Loads pairs from manifest, exposes delete/refresh
    ├── screens/
    │   ├── CameraScreen.tsx  # Main capture UI, orchestrates the full workflow
    │   ├── GalleryScreen.tsx # 2-column grid, multi-select, share/delete, audio modal
    │   └── AboutScreen.tsx   # Version info screen
    └── services/
        ├── fileStorage.ts       # Directory init, photo/audio save/delete/list
        ├── manifest.ts          # manifest.json read/write/add/delete (CRUD for pairs)
        ├── photoCapture.ts      # Wraps CameraView.takePictureAsync
        ├── audioRecording.ts    # expo-av Audio.Recording wrapper (M4A/AAC 128kbps)
        ├── audioPlayback.ts     # expo-av Sound wrapper with status callback
        ├── audioPermissions.ts  # Microphone permission request
        ├── cameraPermissions.ts # Camera permission request
        ├── haptics.ts           # expo-haptics wrapper (light/medium/success/warning/error)
        ├── sharingService.ts    # Builds zip archive via jszip, invokes expo-sharing
        └── volumeButtonListener.ts  # Stub — volume-button integration (deferred, not wired)
```

## Architecture

### State Machine

The app's core is a finite state machine in `useCameraState.ts`. All state is local React state; there is no global store.

```
CAMERA_READY
  → [tap CAPTURE PHOTO] → PHOTO_TAKEN
  → [auto, audio starts] → RECORDING_AUDIO
  → [tap STOP RECORDING] → SAVING
  → [save complete] → CAMERA_READY

Any state → ERROR → [tap Try Again] → CAMERA_READY
```

`CameraScreen` consumes the hook and orchestrates the side-effects: photo capture, audio start/stop, file persistence, manifest update. Transitions are guarded — e.g. `onPhotoTaken()` only advances from `CAMERA_READY`.

### Data Model

Each capture creates a **PhotoAudioPair** identified by Unix timestamp (ms):

```typescript
{
  id: "1698765432123",           // used as filename stem
  photoPath: "file://.../yardsale-data/photos/1698765432123.jpg",
  audioPath:  "file://.../yardsale-data/audio/1698765432123.m4a",
  createdAt: "2024-10-31T14:30:32.123Z"
}
```

All pairs are serialized to `<documentDirectory>/yardsale-data/manifest.json` (format version `"1.0"`). The manifest is read on every operation (no in-memory cache in the service layer); `useManifest` holds the React state copy.

### Screen Navigation

There is no navigation library. `CameraScreen` owns a `showGallery` / `showAbout` boolean and conditionally renders the appropriate screen component in its place. Navigation is entirely via prop callbacks (`onClose`).

### Share Flow

`GalleryScreen` → multi-select → tap Share → `sharingService.buildZip()` reads each file as base64, builds an in-memory JSZip, writes `yardsale-export.zip` to `cacheDirectory`, calls `expo-sharing` → native share sheet. After the sheet closes, user is prompted to keep or delete; the temp zip is cleaned up.

## Key Entry Points

1. **`App.tsx`** — root, sets up full-black SafeAreaView
2. **`src/screens/CameraScreen.tsx`** — all capture logic, state machine consumption, screen routing
3. **`src/hooks/useCameraState.ts`** — the FSM; start here to understand state transitions
4. **`src/types/index.ts`** — canonical data shapes and `AppState` enum
5. **`src/services/manifest.ts`** — persistence layer for all pairs

## Testing

- **Framework**: jest-expo (Node environment)
- **Coverage collected**: `src/**/*.{ts,tsx}`
- Test files live in `__tests__/` directories co-located with source folders
- One test is skipped: `volumeButtonListener.test.ts.skip` (volume button deferred)
- All services, hooks, and key screen behaviors have unit tests

Run tests:
```bash
npm test                 # single run
npm run test:watch       # watch mode
npm run test:coverage    # with coverage report
```

## Notes & Gotchas

- **`expo-file-system/legacy` import**: The codebase uses the legacy API path (`import * as FileSystem from 'expo-file-system/legacy'`) because `documentDirectory` and `EncodingType` are accessed via `(FileSystem as any)` casts. This is intentional — the modern API changed these exports.
- **No navigation library**: All screen switching is conditional rendering in `CameraScreen`. Adding a third screen requires threading a new boolean through `CameraScreen`.
- **Volume button listener exists but is disabled**: `src/services/volumeButtonListener.ts` is a stub; the commented-out `useEffect` in `CameraScreen` shows where it would wire in. It was deferred for Expo Go compatibility.
- **Photo quality**: JPEG quality 0.7–0.8, targeting ≤1MB. Configured at the `photoCapture` service level.
- **Audio format**: M4A/AAC, 128kbps, 44100 Hz stereo, on both Android and iOS.
- **EAS project ID**: `b26af5fd-804f-40b3-9f96-b64e3abf5aec` (in `app.json`).
- **Android package**: `com.yardsalerecorder.app`.
- **Manifest version**: Both `package.json` and `app.json` must stay in sync — current: `0.2.0`.
