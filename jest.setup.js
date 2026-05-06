// Pre-resolve expo's winter runtime lazy getters before tests run.
// These lazy getters (structuredClone, URL, URLSearchParams, __ExpoImportMetaRegistry)
// fire _execModule which throws when isInsideTestCode=false — resolving them here
// turns them into plain values before any test module is loaded.
void global.__ExpoImportMetaRegistry;
void global.structuredClone;
void global.URL;
void global.URLSearchParams;
void global.TextDecoder;
void global.TextDecoderStream;
void global.TextEncoderStream;
