# DentaFlow 2 — Typography System

**Last updated:** 2026-10-30
**Source:** `design-system/typography.ts`, `design-system/MASTER.md` §Typography, `docs/ui-redesign/DESIGN_CONTRACT.md`

---

## Font selection

**Primary font:** Native system font (platform-specific)
- iOS: San Francisco
- Android: Roboto
- Web: System UI stack

**Rationale:**
- Readability: System fonts are optimized for each platform's rendering engine
- Character shapes: Familiar to users on each platform
- Numeral clarity: Tabular figures available in system fonts
- Weight availability: Full range (400, 500, 600, 700) on all platforms
- Language coverage: Broad Unicode support including Tamil for patient copy
- Licensing: No licensing cost or attribution required
- Rendering: Native anti-aliasing, no font loading delays
- Loading performance: Zero — system fonts are pre-installed
- Clinical note readability: Proven in healthcare applications
- Table readability: Tabular numerals supported for financial values

**Secondary font:** None. A single font family is used throughout to avoid visual inconsistency.

**Reference face:** Geist was evaluated as a design reference but not bundled — the design uses system fonts to match platform conventions and avoid font-loading flash.

---

## Typography tokens

| Token | Family | Size | Weight | Line height | Letter spacing | Use case |
| --- | --- | --- | --- | --- | --- | --- |
| `display` | System | 32px | 600 | 1.2 | -0.02em | Page headings on marketing screens |
| `title1` | System | 24px | 600 | 1.3 | -0.02em | Section headings |
| `title2` | System | 18px | 600 | 1.4 | -0.01em | Card headings, modal titles |
| `title3` | System | 16px | 600 | 1.4 | 0 | List item titles, subsection headings |
| `body` | System | 15px | 400 | 1.6 | 0 | Body paragraphs, clinical notes |
| `bodyStrong` | System | 15px | 600 | 1.6 | 0 | Emphasized body text |
| `label` | System | 13px | 500 | 1.4 | 0.01em | Form labels, section labels |
| `caption` | System | 12px | 400 | 1.4 | 0.02em | Secondary text, metadata, timestamps |
| `tiny` | System | 11px | 400 | 1.4 | 0.02em | Minimal secondary text, chip labels |
| `number` | System (tabular) | 15px | 500 | 1.4 | 0 | Financial values, aligned numerical data |

---

## Responsive behavior

- No breakpoint-based font size changes — sizes are fixed across all device widths
- Line heights scale proportionally with font size
- Letter spacing is fixed (not responsive)

---

## Tabular numerals

Used for:
- Money (INR amounts in invoices, payments, balances)
- Dates and times (appointment times, timestamps)
- Quantities (inventory counts, procedure quantities)
- Aligned numerical data in tables

Implemented via `variant="tabular"` on `AppText` which applies `font-variant-numeric: tabular-nums`.

---

## Clinical readability

- Minimum body text: 15px (never below 12px for clinical content)
- No decorative fonts in clinical or operational content
- Medical alerts use `title3` weight 600 for scanability
- Consent documents use `body` for readability
- Financial values use `number` variant for alignment

---

## Accessibility

- Supports platform text scaling (iOS Dynamic Type, Android font scaling)
- Contrast ratios meet WCAG 2.2 AA for all text tokens
- Meaning not conveyed through font weight or color alone
- Line height ≥ 1.4 for body text (improves readability for dyslexic users)

---

## Font loading

Zero font loading — system fonts are pre-installed on all platforms. No `@font-face` declarations, no Google Fonts, no custom font files. Eliminates flash of unstyled text (FOUT) and flash of invisible text (FOIT).
