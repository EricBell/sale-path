# Sale Path

Yard sale route planner — paste a list of addresses, set priorities, and get an optimized driving route.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g expo-cli`
- [EAS CLI](https://docs.expo.dev/eas/) (production builds only): `npm install -g eas-cli`
- Expo Go app on your phone ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))

### Windows 11 + WSL extra setup

Expo's Metro bundler needs to be reachable from your phone. Inside WSL the default LAN IP is a virtual adapter that your phone can't reach, so you must tell Expo to use your Windows host IP.

1. Find your Windows host IP (run in WSL):
   ```bash
   cat /etc/resolv.conf | grep nameserver | awk '{print $2}'
   ```
2. Export it before starting the server (add to `~/.bashrc` to persist):
   ```bash
   export REACT_NATIVE_PACKAGER_HOSTNAME=<windows-host-ip>
   ```
3. Make sure Windows Firewall allows inbound TCP on port 8081 (Metro) from your LAN.

## Install dependencies

```bash
npm install
```

## Dev preview (Expo Go)

Run Metro and scan the QR code with Expo Go — phone and computer must be on the same Wi-Fi.

```bash
npm start          # opens Expo DevTools + QR code
```

Target a specific platform:

```bash
npm run android    # Android emulator / device
npm run ios        # iOS simulator (macOS only)
```

WSL users: after exporting `REACT_NATIVE_PACKAGER_HOSTNAME` (see above), `npm start` works the same way.

## Production builds (EAS)

Builds run in Expo's cloud — no local Android/iOS SDK needed. Requires an [Expo account](https://expo.dev/signup) and `eas login`.

```bash
eas login

# Android .apk / .aab
eas build --platform android --profile production

# iOS .ipa  (requires Apple Developer account)
eas build --platform ios --profile production

# Both platforms at once
eas build --platform all --profile production
```

The `preview` profile (`distribution: internal`) builds a directly-installable `.apk` (Android) or ad-hoc `.ipa` (iOS) for internal testing without going through the stores:

```bash
eas build --platform android --profile preview
```

Finished builds are listed at [expo.dev](https://expo.dev) and downloadable as a QR code or direct link.

## Tests

```bash
npm test                          # all tests
npx jest src/services/__tests__/routing.test.ts   # single file
npm run test:coverage             # with coverage report
```
