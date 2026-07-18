# MosquitoVision Mobile App — Implementation Plan

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | React Native + Expo (SDK 52) | Cross-platform iOS + Android; familiar React patterns from web frontend |
| Language | TypeScript | Same as frontend, shared types |
| Navigation | Expo Router (file-based) | Same mental model as Next.js App Router |
| API calls | axios | Already used in frontend `lib/api.ts` |
| Local storage | AsyncStorage | Drop-in equivalent of localStorage for history |
| Image picker | expo-image-picker | Camera capture + gallery access in one package |
| Styling | StyleSheet + custom dark theme | Native performance; no Tailwind on RN |
| Backend | Same Railway URL (`mosquitovision-backend-production.up.railway.app`) | No backend changes needed |

---

## Project Structure

```
mobile/
├── app/
│   ├── _layout.tsx          # Root layout, dark status bar
│   ├── index.tsx            # Home screen (upload + results)
│   └── history.tsx          # History screen
├── components/
│   ├── ImagePicker.tsx      # Camera + gallery button
│   ├── DetectionResults.tsx # Annotated image + alert cards
│   ├── AlertCard.tsx        # Single species alert (risk badge, diseases)
│   ├── HistoryList.tsx      # Scrollable history entries
│   └── AnalyticsSummary.tsx # Total scans, species breakdown
├── lib/
│   ├── api.ts               # analyzeImage() — same logic as web
│   └── history.ts           # AsyncStorage read/write helpers
├── types/
│   └── index.ts             # Alert, AnalysisResult, HistoryEntry (identical to web)
├── constants/
│   └── theme.ts             # Colors, spacing, font sizes
├── app.json                 # Expo config (name, icons, splash)
└── package.json
```

---

## Screens

### 1. Home Screen (`app/index.tsx`)
- **Top bar**: app name + history icon (navigates to History screen)
- **Image picker area**: two buttons — "Open Camera" and "Choose from Gallery"
- **Preview**: selected image shown before submitting
- **Analyze button**: calls `POST /api/analyze`, shows spinner
- **Results section** (below image): annotated image + alert cards (species, risk, diseases, intervention)
- **Empty state**: placeholder when no analysis run yet
- **Error toast**: dismissible banner on API failure

### 2. History Screen (`app/history.tsx`)
- FlatList of past scans (thumbnail, filename, timestamp, species detected)
- Tap entry → navigates back to Home with that result restored
- Swipe-to-delete individual entries
- "Clear All" button in header

---

## Features vs Web Parity

| Feature | Web | Mobile |
|---|---|---|
| Upload from file system | Yes | Yes (gallery) |
| Camera capture | No | **Yes — mobile exclusive** |
| YOLO analysis | Yes | Yes |
| Annotated result image | Yes | Yes |
| Alert cards (species/risk) | Yes | Yes |
| History (local storage) | Yes (localStorage) | Yes (AsyncStorage) |
| Analytics dashboard | Yes | Simplified summary only |
| Dark theme | Yes | Yes |

---

## Implementation Phases

### Phase 1 — Scaffold & Navigation (Day 1)
- `npx create-expo-app mobile --template expo-template-blank-typescript`
- Set up Expo Router, dark theme constants, tab/stack navigation
- Implement `lib/api.ts` and `types/index.ts` (copy + adapt from web)

### Phase 2 — Core Flow (Day 2)
- `ImagePicker.tsx`: camera + gallery, returns `File`-equivalent URI
- Home screen: picker → preview → analyze button → loading spinner → results
- `DetectionResults.tsx` + `AlertCard.tsx`: annotated image (base64 → `<Image>`), risk badges
- Wire up Railway API, test end-to-end

### Phase 3 — History & Storage (Day 3)
- `lib/history.ts`: AsyncStorage CRUD for `HistoryEntry[]`
- History screen: FlatList, swipe-delete, restore
- `AnalyticsSummary.tsx`: scan count, species breakdown bar

### Phase 4 — Polish (Day 4)
- App icon + splash screen
- Haptic feedback on analyze/error
- Loading skeleton for result image
- Handle edge cases: no camera permission, network offline, oversized image

---

## Key Implementation Notes

- **Image to FormData on mobile**: React Native's `FormData` accepts `{ uri, name, type }` objects instead of `File`. The `api.ts` will need a small mobile-specific adapter.
- **Base64 image display**: the backend returns `data:image/png;base64,...` — use directly as `<Image source={{ uri: base64String }} />` in RN.
- **Camera permissions**: must request at runtime via `expo-image-picker`'s `requestCameraPermissionsAsync()`.
- **No cv2 changes needed**: the backend is unchanged; all inference and annotation happens server-side.
- **AsyncStorage vs localStorage**: same key/value API shape, just async — the `HistoryEntry` type is reused identically.

---

## Dependencies

```json
{
  "expo": "~52.0.0",
  "expo-router": "~4.0.0",
  "expo-image-picker": "~16.0.0",
  "expo-haptics": "~14.0.0",
  "axios": "^1.7.0",
  "@react-native-async-storage/async-storage": "^2.0.0",
  "react-native-safe-area-context": "^4.0.0",
  "react-native-screens": "^4.0.0"
}
```

---

## Out of Scope (this version)

- Offline/on-device YOLO inference (would require TFLite/CoreML export of `best.pt`)
- Push notifications
- User accounts / cloud sync
- App Store / Play Store submission (Expo Go for testing)
