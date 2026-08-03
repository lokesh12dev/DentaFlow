# DentaFlow Design System

**DentaFlow** is a premium dental-practice operating system for the whole clinic — receptionists, dentists, dental assistants, billing teams, and clinic owners — across mobile, tablet, and web.

It manages the complete patient journey in one connected workspace: intake, appointments, waiting-room flow, clinical records, dental charts, photographs, X-rays, voice notes, consent, prescriptions, treatment plans, communication, billing, receipts, recalls, laboratory cases, inventory, staff tasks, and automations.

---

## Sources & provenance

No brand assets, codebase, Figma files, or reference screenshots were provided with the design system brief. This system was authored **from scratch** based on the product description above, with intentional design decisions declared in the sections below.

If you have existing DentaFlow assets — logos, brand guides, in-progress product screens, a Figma library, an established color palette — please attach them so this system can be re-anchored to the real brand. Everything here is a strong first draft designed to be steered.

---

## The vibe — what DentaFlow feels like

> **"Calm precision. A tool that quiets a busy clinic instead of adding to the noise."**

Dentistry is technical, tactile, and time-sensitive. Days are 15-minute-block Tetris; charts are dense with codes; patients are anxious; the operatory itself is already sterile and cold-lit. DentaFlow's job is to be the **calm frame** around that intensity — legible at a glance, dense where density earns its keep, and warm where warmth doesn't get in the way of the work.

Three anchors:

1. **Clinical precision** — tabular numerics, FDI tooth notation, unambiguous status, tight vertical rhythm. If a clinician has to squint or second-guess a value, we've failed.
2. **Hospitality warmth** — warm-off-white paper background (not cold hospital white), a signature *Enamel Teal* that reads as medical without feeling generic-corporate, and Instrument Serif on rare display moments to give the marketing surface a hand-set, cared-for feel.
3. **Restraint** — one accent color does most of the work. Gradients are used only for very-subtle tonal depth in headers and hero surfaces, never as decoration. Iconography is one family (Lucide, 1.5px stroke). No emoji in the product.

---

## Content fundamentals

### Voice
- **Second person, active.** *"You have 3 unconfirmed appointments,"* not *"There are 3 unconfirmed appointments."*
- **Clinician-literate, patient-kind.** In staff surfaces we say *"MOD composite, #14"*. In patient-facing surfaces we say *"a small filling on your upper-left back tooth."* Never dumb down the clinical language when clinicians are the audience; never leak clinical jargon to patients.
- **Confident, never chirpy.** *"Recall sent."* not *"Woohoo, recall sent! 🎉"* — no exclamation points except in true errors.
- **Direct, not corporate.** *"This appointment overlaps Dr. Nia's block. Move it?"* not *"A scheduling conflict has been detected."*

### Casing
- **Sentence case** everywhere except product/brand nouns. Buttons: *"Add treatment plan"*, not *"Add Treatment Plan"*.
- **ALL-CAPS** only in eyebrow labels (mono, tracked) and status badges.
- **Brand: `DentaFlow`** — one word, camelcase capital F. Never "Denta Flow" or "dentaflow".

### Tone by surface
| Surface | Tone | Example |
|---|---|---|
| Clinical workspace | Direct, terse, code-literate | *"Charted. 2 surfaces, MO."* |
| Patient-facing (SMS, portal) | Warm, plain, first-name | *"Hi Amelia — your cleaning is tomorrow at 10am. See you then."* |
| Billing / receipts | Formal, exact, numeric | *"Balance due: $184.00 · Insurance filed 12 Aug"* |
| Marketing site | Confident, spare, editorial serif accents | *"Every tooth. Every visit. One record."* |
| Empty states | Encouraging, one clear next action | *"No lab cases open. Send one from any treatment plan."* |
| Errors | Blame the system, not the user | *"We couldn't reach the imaging server. Retry, or open the tray manually."* |

### Emoji, punctuation
- **No emoji in product UI.** Icons only.
- **En-dash (–)** for ranges: *"10:00 – 10:30"*, *"$120 – $180"*.
- **Middle dot (·)** to separate related meta: *"Dr. Nia · Op 3 · 30 min"*.
- **No Oxford comma waffling** — use it consistently.
- **Numbers**: never spell out ages, tooth #s, dollar amounts. Always digits with `tabular-nums`.

---

## Visual foundations

### Palette
| Role | Token | Value | Use |
|---|---|---|---|
| App bg | `--paper-50` | `#FBF9F6` | Full app background (warm off-white bone) |
| Surface | `--bg-surface` | `#FFFFFF` | Cards, modals, primary content wells |
| Raised | `--paper-100` | `#F5F2EC` | Sidebars, table headers, tinted panels |
| Sunken | `--paper-200` | `#EDE8DF` | Hover states, zebra rows |
| Hair | `--paper-300` | `#E1DCD1` | Table borders, chart gridlines |
| Ink | `--ink-900` | `#14161A` | Primary text (never `#000`) |
| Body | `--ink-700` | `#363A42` | Body text |
| Meta | `--ink-500` | `#8A8F9C` | Secondary / meta |
| **Enamel Teal (primary)** | `--teal-500` | `#1F6E66` | Buttons, links, focus, brand |
| Teal deep | `--teal-700` | `#124540` | Header washes, marketing hero |
| Mint success | `--mint-500` | `#2F8F51` | Completed treatments, paid |
| Amber warning | `--amber-500` | `#C88A1E` | Planned tx, insurance pending |
| Coral urgent | `--coral-500` | `#C64A2E` | Overdue balance, caries, alerts |
| Slate info | `--slate-500` | `#4A6685` | Existing restorations, informational |

**Rules:**
- Never pure black (`#000`) or pure white for text on paper.
- **One accent** in a view — teal for the primary action, everything else earned.
- Semantic colors are **muted** — never neon. Success is mint (not lime), warning is amber (not marigold), danger is coral (not fire-engine).
- Dental-chart status colors are their own scale (`--clin-*`) so they can be tuned without disrupting the general semantic scale.

### Typography
- **Sans (UI):** [Geist](https://fonts.google.com/specimen/Geist) — variable, weight 100–900. Clean, technical, generous x-height, good tabular numerics.
- **Serif (display accents):** [Instrument Serif](https://fonts.google.com/specimen/Instrument+Serif) — used only for marketing display headlines and *sparingly* in-product for section titles that want a hand-set moment (e.g. "Good morning, Dr. Nia").
- **Mono (numerics, IDs, tooth codes):** [Geist Mono](https://fonts.google.com/specimen/Geist+Mono) — for tooth numbers, procedure codes, IDs, appointment counts, currency.

Type ramp: `11 / 12 / 13 / 14 / 15 / 16 / 18 / 20 / 24 / 30 / 38 / 56 / 80`. UI body default is **14px**; dense tables 13px; marketing body 16px.

### Spacing
Base is a **4pt grid** (`--sp-1` = 4px) with a 2pt half-step (`--sp-05`) for very-tight numeric alignment (e.g. between tooth number pairs). Densities:
- **Dense** (clinical workspace tables, chart rows): `--sp-2` / `--sp-3` internal padding
- **Comfortable** (form fields, cards): `--sp-4` / `--sp-6`
- **Roomy** (marketing, empty states): `--sp-10` / `--sp-16`

### Backgrounds
- Product surfaces: solid `--paper-50` app bg. **No full-bleed photography inside the product.** Photos live in dedicated media containers (patient photos, X-ray viewer) with clear frames.
- Marketing: full-bleed **soft-gradient washes** allowed sparingly in hero (teal-100 → paper-50, ~5% chroma range). No stock photography of teeth. Real clinic photography (or placeholder patches with mono labels) only.
- **No repeating patterns, no textures, no grain.** Clinics are physical enough.

### Borders
- **Hair** (`1px var(--border-hair)`) for tables and chart grids.
- **Default** (`1px var(--border-1)`) for cards and inputs.
- **Focus** (`0 0 0 3px rgba(31,110,102,0.22)` on top of a `1px var(--border-focus)`) — a soft teal halo. Never a hard 2px outline.
- **No colored left-border-accent cards.** Ever. Status is communicated by an icon + label, not a stripe.

### Radii
`3 / 6 / 10 / 14 / 20 / pill`. Cards use 10, modals 14, inputs 6, tags 3, badge pills use full pill. Nothing gets more than 20px — DentaFlow is precise, not squishy.

### Shadows
Warm-tinted (ink-based rgba), never gray-blue. Five levels: `hair / 1 / 2 / 3 / 4`. Cards default to `--shadow-1`, floating popovers to `--shadow-3`, modals `--shadow-4`. There is an **inset** shadow for inputs and chip counters. Focus uses a colored halo, not a shadow.

### Motion
- **Standard easing:** `cubic-bezier(0.2, 0, 0.1, 1)` — quick out, gentle settle. No bounce. Ever.
- **Durations:** 120ms (hover), 180ms (buttons/small), 260ms (panels/overlays), 400ms (page).
- **What animates:** opacity, position, blur, colored halos. **Never scale on hover.** Buttons don't grow.
- Loading: a subtle 1.5s tea-cup skeleton pulse, not a spinner (spinners feel medical-emergency).

### Hover / press
- **Hover:** `background: var(--bg-hover)` — 4% ink overlay. Sometimes `color: var(--fg-1)` shift for stronger emphasis. Cursor changes to pointer only on truly clickable elements.
- **Press:** `background: var(--bg-active)` (7% ink overlay). **No transform scale.** Immediate, no delay.
- **Focus (keyboard):** teal halo. Preserved across all interactive elements — this is a clinical tool, keyboard nav must be first-class.

### Layout
- **Desktop clinical workspace:** fixed 56px top bar, fixed 240px left rail, scrolling content, contextual right panel that slides in (400px, `--shadow-3`).
- **Tablet chairside:** collapsed rail (56px, icon-only), no top bar unless required. Bottom-mounted primary action.
- **Mobile:** single-column, bottom tab bar (5 items), sheet-based deep navigation. `--sp-4` horizontal padding.

### Transparency / blur
- Sparingly. Only in: floating command palette (backdrop blur 24px on `rgba(20,22,26,0.42)`), and on scrim behind modals. Sidebars are solid. Never blur inside content.

### Imagery
- Patient photographs and X-rays displayed **at their true tones** — no filters, no warm/cool grade. Clinical data must be truthful. Wrap in a `--r-3` frame with a hair border.
- Any marketing imagery: warm, natural light, no stock-photo teeth. Real clinics.

---

## Iconography

**Family:** [Lucide](https://lucide.dev/) — one system, 1.5px stroke, 20px default (24px in touch surfaces, 16px in dense tables). Loaded from CDN in preview and UI kits (see `ui_kits/*/index.html`).

**Why Lucide:** open-source, huge coverage (medical + general), consistent stroke, matches our precision-not-cute posture. Alternatives considered: Heroicons (too rounded), Phosphor (too playful), Material (too Google).

**Substitution flag:** No custom DentaFlow icon set was provided. Lucide is a **substitute**. If DentaFlow has an existing icon library — bespoke tooth glyphs, custom X-ray icons, brand-specific illustrations — please share so it can be swapped in.

**Never:**
- Emoji as icons.
- Unicode dingbats (✂ ✎ ⚙) as icons.
- Multiple icon families in the same view.
- Hand-drawn SVG one-offs. If Lucide doesn't have it, ask — don't improvise.

**Tooth-numbering as icons:** The dental chart uses tooth positions themselves as interactive icons — this is a domain-specific system, not a generic icon family. It's rendered as SVG in the `ui_kits/web/DentalChart.jsx` component.

---

## Repo index

**Root**
- `README.md` — this file
- `SKILL.md` — machine-readable descriptor (used when this system is attached to another project)
- `colors_and_type.css` — all CSS custom-property tokens (colors, type, spacing, radius, shadow, motion) + semantic type classes
- `thumbnail.png` — cover image (rendered from primary UI kit)

**Fonts** (`fonts/`)
- `Geist-Regular.woff2` (variable, 100–900)
- `GeistMono-Regular.woff2` (variable)
- `InstrumentSerif-Regular.woff2`, `InstrumentSerif-Italic.woff2`

**Assets** (`assets/`)
- `logo.svg` — DentaFlow wordmark + tooth mark
- `logo-mark.svg` — tooth mark only (favicon size)
- `logo-lockup-dark.svg` — for use on dark backgrounds

**Preview cards** (`preview/`) — cards rendered in the Design System tab
- Colors, type, spacing, radius/shadow, components, brand

**UI kits** (`ui_kits/`)
- `ui_kits/web/` — the clinical workspace (schedule, patient chart, dental chart, treatment plan)
- `ui_kits/mobile/` — clinician mobile companion (today's schedule, patient quick-view, voice notes)

Each kit contains: `README.md`, `index.html` (interactive click-through), and per-component `.jsx` files.

---

## For anyone reading this after import

If you're loading DentaFlow's design system into another Genspark Designer project, the SKILL.md at root wires it up automatically. To use tokens: link `colors_and_type.css` from the design system's root. To use icons: load Lucide from CDN and follow the usage pattern in `ui_kits/web/index.html`. Match the tone in the **Content fundamentals** section — that's what makes something feel like DentaFlow, more than any pixel.
