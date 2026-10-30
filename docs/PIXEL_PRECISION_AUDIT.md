# DentaFlow 2 — Pixel Precision Audit

**Last updated:** 2026-10-30
**Source:** Design tokens (`design-system/`), component library (`src/ui/components/`), route inspection (65 routes)

---

## Measurement system

### Base grid: 4-point spacing

| Token | Value | Use |
| --- | --- | --- |
| `spacing[1]` | 4px | Tight gaps (icon-to-text, badge padding) |
| `spacing[2]` | 8px | Small gaps (form field groups, chip gaps) |
| `spacing[3]` | 12px | Medium gaps (surface internal padding, section gaps) |
| `spacing[4]` | 16px | Standard padding (page horizontal, card padding) |
| `spacing[5]` | 20px | Section gaps (major section separation) |
| `spacing[6]` | 24px | Large spacing (page bottom inset, major sections) |

### Component dimensions

| Element | Height | Width | Border radius |
| --- | --- | --- | --- |
| Button | 44px | Flexible | 12px (radii.md) |
| Icon button | 44px | 44px | 22px (circular) |
| Input field | 44px | Flexible | 12px |
| Chip | 32px | Flexible | 16px (pill) |
| Badge | 26px | Flexible | 13px (pill) |
| Card/Surface | Flexible | Flexible | 16px |
| Modal | Flexible | 90% width | 20px |
| Touch target | 44px min | 44px min | — |

### Touch targets

All interactive elements have minimum 44×44px touch targets per WCAG 2.2 AA.

---

## Alignment standards

### Verified alignments
- Shared left edges: Page content aligned at `spacing[4]` (16px) from screen edge
- Shared right edges: Content right-aligned at `spacing[4]` (16px) from screen edge
- Page titles: Consistent `title2` variant, left-aligned at page start
- Buttons: Aligned at bottom of forms, full-width on mobile
- Form labels: Left-aligned, `label` variant (13px, weight 500)
- Table columns: Left-aligned text, right-aligned numbers (tabular variant)
- Icon baselines: Centered vertically in buttons and inputs
- Text vertical alignment: Centered in buttons, top-aligned in cards

### Avoided
- Unnecessary absolute positioning
- Overlapping elements
- Sticky elements covering content

---

## Visual hierarchy

Every page has:
- **Primary heading:** `title2` variant (18px, weight 600)
- **Section grouping:** `Surface` cards with `SectionHeader` (`title3` + subtitle)
- **Primary action:** Filled button (`tone="clinical"` or `tone="primary"`)
- **Supporting information:** `caption` variant (12px, tone="secondary")
- **Logical content order:** Identity → Summary → Timeline → Clinical → Finance
- **Status information:** Badge with tone mapping (success/warning/danger/clinical)
- **Visual emphasis:** Primary actions use filled tone; secondary actions use ghost/outline

---

## Route-by-route verification status

| Route group | Routes | Status | Issues |
| --- | --- | --- | --- |
| `(auth)` | 4 | Verified | None |
| `(tabs)` | 5 tabs + 30 screens | Verified | None |
| `(modules)` | 16 modules | Verified | None |
| Task routes | 10 | Verified | None |
| **Total** | **65** | **Verified** | **None** |

All 65 routes verified for:
- No overlapping elements
- No text clipping
- No horizontal overflow
- Correct touch targets (44px min)
- Consistent spacing (4-point grid)
- Correct alignment (shared left/right edges)

---

## Remaining issues

None identified. All routes verified against the design system tokens.
