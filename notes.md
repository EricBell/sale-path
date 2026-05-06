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

  