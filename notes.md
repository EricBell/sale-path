Notes from first session

Let me compare this against the PRD's stack and flag anything worth adjusting.                                                                                                                      
                                                                                                                                                                                                                    
  The PRD already says "Identical to yardsale-recorder plus the additions below" — so here's a precise diff of where they align and where sale-path diverges:
                                                                                                                                                                                                                    
  Fully aligned (carry forward as-is):                                                                                                                                                                              
  - React Native 0.81.5 + Expo ~54, TypeScript 5.9, EAS Build/Expo Go                                                                                                                                               
  - Jest 30 + jest-expo + React Native Testing Library                                                                                                                                                              
  - Local React state (no global store)                                                                                                                                                                             
  - src/types/, src/hooks/, src/screens/, src/services/ directory layout                                                                                                                                            
                                                                                                                                                                                                                    
  One meaningful divergence to flag:                                                                                                                                                                                
                                                                                                                                                                                                                    
  The PRD specifies @react-navigation/native + native-stack, but yardsale-recorder uses no navigation library at all — just a conditional-render boolean in CameraScreen. That approach works fine for 2 screens,   
  but sale-path has 3 screens with non-trivial params flowing between them (sales[], clusters[], route → MapScreen, then route + callbacks → RouteScreen). Using react-navigation is the right call here — the
  yardsale pattern would require threading a lot of state and callbacks through CameraScreen's equivalent, which gets messy fast.                                                                                   
                                                                          
  One gotcha from yardsale-recorder to avoid carrying forward:                                                                                                                                                      
  The expo-file-system/legacy import with (FileSystem as any) casts is a known rough edge in that codebase. Sale-path has no file storage needs, so it won't inherit this — but worth knowing it exists if you ever
  merge packages.                                                                                                                                                                                                   
                                                                          
  Verdict: The PRD's stack is well-grounded in the yardsale-recorder baseline. I'd keep it exactly as written. React-navigation is the correct upgrade for 3-screen flow with param passing.                        
                                                                          
  I'll update my memory with these findings.                   

  
  --------

   Here's the plan:

  Step 1 — Get the APK URL from your last build
  eas build:list --platform android --limit 1
  Copy the download URL from the output, then download it:
  curl -L "<url>" -o sale-path-preview.apk
  
  Step 2 — Start an emulator

  In Android Studio: open the Device Manager (the phone icon in the toolbar), pick an AVD, and click the
  play button. Or from the terminal:
  # list available AVDs
  emulator -list-avds
  
  # start one
  emulator -avd <avd-name>
  (The emulator binary is at ~/Android/Sdk/emulator/emulator if it's not on your PATH.)

  Step 3 — Install the APK
  adb install sale-path-preview.apk
  If adb isn't on your PATH, it's at ~/Android/Sdk/platform-tools/adb.

  Step 4 — Launch it
  adb shell monkey -p com.ericbell.salepath 1
  (or just tap the icon in the emulator once it's installed)

  ---
  To find your package name if the above monkey command fails:
  adb shell pm list packages | grep sale

  Would you like me to run eas build:list now to grab the download URL?

✻ Worked for 19s

※ recap: The user wants to run their already-built EAS preview APK on an Android emulator without 
  rebuilding. Next action: run `eas build:list --platform android --limit 1` to get the APK download URL. 
  (disable recaps in /config)

❯ I have the apk now. Android Studio is installed. Step 2 doesn't make sense. when I start studio, a      
  launcher starts, not the full studio. thoughts?                                                         
  
● From the Android Studio welcome/launcher screen, look for a "More Actions" button (or a ⋮ / dropdown
  arrow next to it) — one of the options is Virtual Device Manager. That opens the AVD list without
  needing a project open.

  From there: pick an AVD → click the play ▶ button to start the emulator.

  ---
  Alternatively, skip Studio entirely and launch from the terminal. Let me check if the emulator binary is
   where it's expected:

  Listed 1 directory (ctrl+o to expand)

❯ I have the virtual device manager open. It didn't open an AVD list. the choice is "create virtual       
  device..."                                                                                              

● You need to create an AVD first. Click "Create virtual device..." and follow the wizard:

  1. Choose a device — pick something like "Pixel 6" (a common, well-supported profile)
  2. Select a system image — pick an API level that's already downloaded (has no download icon next to
  it), or download one. API 33 or 34 (Android 13/14) works well.
  3. Finish — accept the defaults on the last screen

  Once created, the AVD will appear in the list with a play ▶ button. Click that to boot the emulator,
  then come back and run:

  adb install /path/to/sale-path-preview.apk

✻ Baked for 12s

※ recap: Installing the Sale Path preview APK on a new Android emulator. You're creating an AVD in Virtual
   Device Manager — pick a device profile like Pixel 6, choose a downloaded system image, and finish the 
  wizard. (disable recaps in /config)

❯ in the virt dev screen the only api/android is compatible with android 17 and my phone is android 16. I 
   suspect I have to download something to make android 16 available = thoughts?                          
  
● Yes, you need to download an Android 16 system image. In the virtual device wizard on the "Select a 
  system image" step:

  1. Click the "x86 Images" or "Other Images" tab (not just "Recommended")
  2. Find API level 36 (that's Android 16) — it'll have a download arrow next to it
  3. Click the download arrow, wait for it to finish
  4. Select it and continue through the wizard

  That said — it probably doesn't matter. Your app is a standard React Native app with no
  API-level-specific features. Running it on the Android 17 emulator that's already available should work
  fine. The emulator Android version doesn't need to match your phone.

  I'd suggest just using what's already downloaded (Android 17) to save time.

✻ Brewed for 6s

──────────────────────────────────────────────────────────────────────────────────────────────────────────
❯ ok used android 17, emulator is running, now what
──────────────────────────────────────────────────────────────────────────────────────────────────────────
  sale-path  Sonnet 4.6 (1M context)  27k tokens
