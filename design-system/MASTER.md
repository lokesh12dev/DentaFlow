# DentaFlow master design system

This directory is the production source of truth. `src/ui/tokens.ts` re-exports these modules so application code cannot silently develop a second token system.

## Direction

**Calm precision:** a warm paper content layer with an Enamel Teal control layer. Dentistry is already visually and emotionally busy; DentaFlow reduces scanning cost through exact alignment, sparse copy and stable navigation.

The signature is a thin clinical rail connecting time, chair and patient state on operational lists. It is functional—not a decorative colored edge—and does not appear on unrelated content.

## Foundations

- Color: paper `#FBF9F6`, ink `#14161A`, Enamel Teal `#1F6E66`, deep teal `#124540`, amber `#9A6412`, coral `#B74444`. Dark mode uses `#11171C` canvas and separately tuned surfaces.
- Type: native system face for UI readability; tabular numerals for time, tooth codes, IDs and currency. Display styling is rare and never used for routine operational greetings.
- Spacing: 4 optical, 8 tight, 12 compact, 16 control, 24 section, 32 major section, 40 page separation.
- Radius: 6 input/button, 10 bounded content, 14 modal, 20 sheet, 24 floating control, pill only for status/avatar/control capsules.
- Motion: 120/180/260/400 ms. No bounce or scale-on-press decoration. Respect reduced-motion settings.
- Icons: Lucide only, consistent optical box, no emoji.

## Layer model

1. **Content layer:** solid semantic surfaces, direct rows, separators and whitespace. Patient rows, forms, clinical notes and billing records are never glass.
2. **Control layer:** bottom navigation, contextual action, search, sheets and temporary toolbars may use native material/blur.
3. **Safety layer:** alerts, validation and permission feedback are opaque, legible and semantic; they never depend on color alone.

## Composition rules

- One obvious task per screen and at most one floating primary action.
- Titles, controls and rows share the same left edge.
- Phone page inset is 16–20; major sections are 24–32 apart; controls are at least 44 high.
- Prefer content directly on the page. A card must express a bounded object or raised interaction, not merely “this is a section.”
- Copy is direct and stable: Today, Calendar, Inbox, Collections. Supporting text appears only when it prevents confusion.
- Currency owns a stable right column; time and numeric data use tabular numerals.

## Liquid material

Use native material where supported, BlurView as a restrained iOS fallback, toned translucency on Android and backdrop blur with solid fallback on web. Never attempt identical optics across platforms. Content reserves safe-area plus floating-control height.

## Page contracts

See `pages/` for durable screen-level hierarchy. Role and product rules live in `docs/product/` and take precedence over styling.
