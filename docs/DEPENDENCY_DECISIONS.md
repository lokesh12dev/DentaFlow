# DentaFlow 2 — Dependency Decisions

**Last updated:** 2026-10-30
**Source:** Derived from `package.json`, `IMPLEMENTATION_ROADMAP.md`, and code inspection.

---

## Installed dependencies (production)

| Package | Version | Purpose | Why needed | Alternative considered |
| --- | --- | --- | --- | --- |
| expo | ~57.0.0 | Core framework | Managed workflow, SDK compatibility | Bare React Native (rejected — adds complexity) |
| react-native | 0.86.2 | Mobile runtime | Expo SDK 57 pairing | None (required by Expo) |
| react | 19.2.3 | UI framework | Expo SDK 57 pairing | None (required by React Native) |
| expo-router | ~5.0.0 | File-based routing | Tab + module navigation | React Navigation (rejected — Expo Router is Expo-native) |
| @tanstack/react-query | ^5.85.0 | Server state | Caching, polling, invalidation | SWR (rejected — TanStack Query has better Expo integration) |
| zustand | ^5.0.0 | Client state | UI state, demo mode toggle | Redux (rejected — overkill for this app size) |
| react-hook-form | ^7.0.0 | Form management | Validation, error handling | Formik (rejected — react-hook-form has better performance) |
| zod | ^4.0.0 | Schema validation | Form validation, type safety | Joi (rejected — zod has better TypeScript integration) |
| @shopify/flash-list | ^5.0.0 | Virtualized lists | Large list performance | FlatList (rejected — FlashList has better scroll performance) |
| lucide-react-native | ^0.4.0 | Icons | Consistent iconography | React Native Vector Icons (rejected — Lucide has cleaner design) |
| expo-sqlite | ~57.0.0 | Local storage | Offline queue, demo mode | AsyncStorage (rejected — SQLite needed for structured data) |
| react-native-reanimated | ^4.5.0 | Animations | Layout transitions, micro-interactions | None needed (CSS transitions insufficient for native) |
| react-native-gesture-handler | ^2.0.0 | Gestures | Touch handling, navigation gestures | None (required by Reanimated + navigation) |

---

## Dependency evaluation criteria

For each new dependency, the following are evaluated:
1. **Compatibility:** Expo SDK 57, React Native 0.86.2, React 19.2.3
2. **Maintenance:** Active releases, issue response, community health
3. **Documentation:** API docs, migration guides, examples
4. **Security:** No known vulnerabilities, minimal native code
5. **License:** MIT or compatible
6. **Bundle size:** Minimal impact on app size
7. **Runtime impact:** No excessive re-renders, memory, or battery drain
8. **Platform support:** iOS, Android, Web (Expo)
9. **Existing alternatives:** Whether current stack already solves the problem
10. **Long-term maintenance:** Team familiarity, hiring pool

---

## Dependencies NOT added (rejected)

| Package | Reason rejected | Current alternative |
| --- | --- | --- |
| React Native Vector Icons | Larger bundle, less consistent design than Lucide | lucide-react-native |
| Formik | More boilerplate, heavier than react-hook-form | react-hook-form + zod |
| Redux/Zustand alternatives | Already using Zustand for client state | zustand |
| SWR | TanStack Query already handles server state | @tanstack/react-query |
| React Navigation | Expo Router provides file-based routing with less config | expo-router |
| Additional animation libraries | Reanimated 4.5.1 covers all animation needs | react-native-reanimated |
| Date-fns/date-fns-tz | Native `Date` + `dateTime`/`relativeTime` formatters sufficient | Core format helpers |
| Chart.js/recharts | No charting implemented yet; Canvas/Kit not Expo-compatible | None needed yet |
| Additional font packages | Native system font used (not Geist) | Platform.systemFont |

---

## SDK version drift

22 SDK-57 packages are behind expected patch versions. `expo-sqlite` check fails (`~57.0.1` vs `~57.0.4`). App builds fine today. Addressed in E3 via `npx expo install --check --fix`.

---

## No new dependencies added in this session

All changes in this session use existing dependencies only. No new packages were installed.
