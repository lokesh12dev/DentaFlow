# DentaFlow 2 — Visual Asset Guidelines

**Last updated:** 2026-10-30
**Source:** Asset inspection, `src/ui/icons/`, `design-system/MASTER.md` §Assets

---

## Asset inventory

### Icons
- **Library:** lucide-react-native (single source)
- **Style:** Outline, 2px stroke, consistent weights
- **Sizes:** 16px (small), 18px (medium), 19px (header), 20px (chip), 22px (card), 64px (avatar placeholder)
- **Active states:** Filled variants for active navigation, outline for inactive
- **Accessibility:** All icon-only controls have `accessibilityLabel`

### Logos
- **DentaFlow wordmark:** Text-based (no image file) — rendered as `AppText` with `title2` variant
- **No image-based logo:** Avoids scaling and branding inconsistency

### Images
- **Clinical media:** Stored as references (URLs), not binary files — original source preserved
- **Patient photos:** Not stored (privacy by design — no identifiable patient images)
- **Illustrations:** None used (operational screens prioritize interface elements over decoration)
- **Backgrounds:** None used (clean surfaces only)
- **Screenshots:** None used (no fabricated clinical data or testimonials)

### Fonts
- **System fonts:** San Francisco (iOS), Roboto (Android), System UI (Web)
- **No custom font files:** Zero font loading, no FOUT/FOIT

---

## Art direction

### Operational screens
- Prioritize useful product information over decorative stock imagery
- No illustrations, photographs, or decorative containers
- Surfaces, borders, and typography create visual structure

### Empty states
- Simple icon + text (no illustrations)
- Clear call-to-action button
- Example: "No patients" → "Add your first patient"

### Onboarding
- Not yet implemented (no onboarding screens in current scope)

---

## Asset provenance and licensing

| Asset type | Source | License | Attribution |
| --- | --- | --- | --- |
| Icons | Lucide | ISC (MIT-compatible) | Not required (ISC) |
| Fonts | System | Platform | Not required |
| Images | None | N/A | N/A |

---

## Technical standards

| Standard | Implementation |
| --- | --- |
| Aspect ratios | 1:1 for avatars, 4:3 for clinical media tiles |
| Resolution | Native display resolution (no downscaling) |
| Formats | SVG for icons (via Lucide), PNG/JPG for clinical media references |
| Optimization | SVG icons are code-based (zero bytes) |
| Lazy loading | Clinical media loads on demand |
| Alt text | All icon-only controls have `accessibilityLabel` |
| Reserved dimensions | Fixed heights for buttons (44px), inputs (44px), cards |
| Layout shift prevention | Reserved dimensions for all media placeholders |

---

## Do not use

- Competitor screenshots
- Unlicensed artwork
- Stock photography on operational screens
- Multiple icon styles
- Decorative containers around every element
- Patient identifiable images without authorization
- Fabricated clinical data, testimonials, or customer logos
