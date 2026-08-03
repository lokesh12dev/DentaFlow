---
name: dentaflow-design
description: DentaFlow — premium dental-practice OS design system. Warm off-white foundation, Enamel Teal accent, Geist + Instrument Serif type, Lucide icons. Includes tokens, preview cards, and web + mobile UI kits.
user-invocable: true
---

# DentaFlow Design System — quick map

## Files
- `colors_and_type.css` — all tokens (colors, type, spacing, radius, shadow, motion) + semantic type classes. Import from project root as `<link rel="stylesheet" href="colors_and_type.css">`.
- `README.md` — brand context, voice/tone guide, and full visual foundations.
- `fonts/` — Geist (variable), Geist Mono (variable), Instrument Serif (regular + italic).
- `assets/` — logo variants (SVG).
- `preview/` — Design System tab cards (colors, type, spacing, components, brand).
- `ui_kits/web/` — clinical workspace UI kit (schedule, patient chart, dental chart).
- `ui_kits/mobile/` — clinician mobile companion.

## Brand-specific design rules

**Voice**: Second-person active. Sentence case buttons. **No emoji in product UI.** Confident, terse in clinical surfaces; warm and first-name in patient-facing surfaces. Never "Please" or exclamation points except for real errors. Middle-dot (·) separators, en-dash (–) ranges, digits always for numbers.

**Palette**: Warm off-white `--paper-50 (#FBF9F6)` app bg. Never pure white/black. **One accent per view** — Enamel Teal `--teal-500 (#1F6E66)` for primary action. Semantic colors (mint / amber / coral / slate) are all muted, never neon.

**Type**: Geist for UI (14px body). Instrument Serif *only* for display moments (marketing hero, occasional in-product "Good morning" moments). Geist Mono for all numerics, tooth codes, procedure IDs, currency — use `font-variant-numeric: tabular-nums`.

**Layout**: Dense clinical UI uses 4pt grid with 2pt half-steps. Cards `--r-3` (10px), modals `--r-4` (14px), inputs `--r-2` (6px). Shadows are warm-tinted (ink-based rgba), 5 levels.

**Motion**: `cubic-bezier(0.2, 0, 0.1, 1)`, no bounce, 180ms default. Buttons **never scale** on hover — background overlay only. Focus is a soft teal halo, never a hard outline.

**Iconography**: Lucide only (1.5px stroke, 20px default). No emoji, no unicode dingbats, no ad-hoc SVG. Load from CDN: `<script src="https://unpkg.com/lucide@latest"></script>`.

**Anti-patterns** (never do these — they are *not* DentaFlow):
- Bluish-purple gradients
- Left-border-accent cards
- Emoji in product surfaces
- Pure `#000` or `#FFF` text
- Scale-on-hover buttons
- Full-bleed photography inside the product
- Icon rotation as loading indicator
- Rounded-corner "friendly" tooth cartoons
