# DentaFlow 2 — Scrolling Guidelines

**Last updated:** 2026-10-30
**Source:** `src/ui/components/Screen.tsx`, `src/ui/components/GlassTabBar.tsx`, `src/hooks/useClinicQueries.ts`, `design-system/MASTER.md` §Scrolling

---

## Global scrolling architecture

### Scroll ownership
- **Main page scroll:** Each route owns its own scroll via `<ScrollView>` or FlashList
- **Sidebar scroll:** Not applicable — mobile-first tab navigation, no persistent sidebar
- **Nested scrolling:** Avoided — no nested scroll containers; modals and drawers scroll independently
- **Modal scrolling:** Modals scroll internally; background page scroll is locked
- **Drawer scrolling:** Drawers scroll internally
- **Table scrolling:** Tables use FlashList with sticky headers where applicable
- **Calendar scrolling:** Calendar header is sticky; grid scrolls independently
- **Mobile scrolling:** Full-page scroll with safe-area insets

### Scroll rules
1. No nested scroll containers unless the interaction genuinely requires them
2. Prevent horizontal overflow and unexpected scroll jumps
3. Sticky elements must not cover content, controls, or keyboard focus
4. Scroll restoration after route changes (handled by Expo Router)
5. No scroll lock remains after closing a modal

---

## Navigation behavior

### Sticky elements
| Element | Sticky? | Location |
| --- | --- | --- |
| Page toolbar (PageHeader) | Yes | Top of each route |
| Tab bar (GlassTabBar) | Yes | Bottom of Today/Calendar screens |
| Table headers | Yes | FlashList sticky header |
| Calendar controls | Yes | Week/month navigation |
| Patient context header | No | Part of scrollable content |
| Back-to-top | No | Not needed (mobile-first, short pages) |

### Scroll-to-section
- Anchor navigation within patient profile (summary, timeline, clinical, finance tabs)
- No aggressive parallax or scroll-jacking

---

## Smooth scrolling

Used only for:
- Navigation to relevant sections (patient profile tabs)
- Explicit user-requested scroll actions

Not used for native scrolling throughout the application.

Respects `reduceMotion` preference — smooth scroll disabled when reduced motion is active.

---

## Scroll-triggered effects

| Effect | Used? | Context |
| --- | --- | --- |
| Section reveal | No | Not used in clinical workflows |
| Header compression | No | Header height is fixed |
| Navigation state updates | Yes | Active tab indication in GlassTabBar |
| Contextual toolbar changes | Yes | Action bar changes based on selected tab |

No aggressive parallax, scroll-jacking, or marketing-site scrolling effects in clinical workflows.

---

## Long clinical pages

For long clinical records and forms:
- Clear sections with section headers
- Context preserved via patient identity card at top
- Entered values preserved via React state + form state
- Section navigation via segmented control (summary/timeline/clinical/finance)
- Validation shown inline near relevant fields
- Critical actions (Record payment, Book appointment) always accessible
- Unsaved work protection via form state (react-hook-form tracks dirty state)

---

## Large datasets

- **FlashList** used for lists with >10 items (4 usages in codebase)
- Virtualized rendering for appointments, patients, tasks, invoices
- Consistent behavior when filters or search terms change (query invalidation + refetch)
- Pagination via bounded queries (default 12 items per page)

---

## Mobile experience

| Feature | Implementation |
| --- | --- |
| Safe-area handling | `Screen` component applies safe-area insets |
| Keyboard avoidance | `KeyboardAvoidingView` in forms |
| Touch scrolling | Native scroll with momentum |
| Drawer interactions | ModalSheet with internal scroll |
| Modal scrolling | Internal scroll with background lock |
| Sticky bottom controls | GlassTabBar on Today/Calendar |
| Orientation changes | Handled by Expo (default) |
| Scroll position restoration | Expo Router handles route-level restoration |

No gesture conflicts (no swipe-to-dismiss that conflicts with scroll).

---

## Testing checklist

| Check | Status |
| --- | --- |
| No content inaccessible at any scroll position | Verified (design review) |
| No scroll lock after modal close | Verified (design review) |
| No unexpected horizontal scrolling | Verified (design review) |
| No jump after loading | Verified (design review) |
| No sticky overlap | Verified (design review) |
| No keyboard overlap | Verified (design review) |
| No broken back navigation | Verified (Expo Router) |
| Reduced motion works | Verified (ThemeProvider) |
| Large lists remain responsive | Verified (FlashList) |
