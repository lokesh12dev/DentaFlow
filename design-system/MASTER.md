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

## Token governance (Phase 3 audit, 2026-10-30)

The following rules are now **enforced and swept** across `src/` (verified by grep sweep on this date; keep them true in review):

1. **Every color literal lives in the design system.** `palette` (light + shared surfaces), `darkDerivatives` (dark-theme accent/soft remapping, consumed only by `src/ui/ThemeProvider.tsx`), and `printPalette` (exploded-HTML documents: receipts, prescriptions, Android notification channel navy) are the only allowed literal locations. `src/ui/ThemeProvider.tsx` is a pure mapping for both themes. Application code resolves color exclusively through `useTheme()`.
2. **Tabular numerals on data that aligns or updates:** metric values (`MetricStrip`, `MetricTile` via the `number` variant), calendar day numbers, appointment times in rows, money columns on Reports/Billing/Patient ledger/treatment plans, booking and visit summary rows, branch pricing, timeline/media timestamps, progress-percentage, and Button/Chip labels so pay/refund amounts cannot jitter while typing. Implement via the `tabular` prop of `AppText` or an explicit `fontVariant: ['tabular-nums']`.
3. **Touch targets ≥ 44px (visual or hitSlop-equivalent):** tabs, chips (`sizes.touch`), segmented controls, FAB, buttons, icon buttons, toast dismiss, list rows, tooth cells (34px visual + hitSlop to 44 without overlapping neighbors), sheet action pills, header section actions.
4. **Modal surfaces are real dialogs on web:** `ModalSheet` and `CommandPalette` render `role="dialog"` + `aria-modal`, and `src/ui/modalFocus.ts` moves focus into the dialog on open, wraps Tab inside it, and closes on Escape. Native platforms keep system-modal behavior (hook is a web no-op); the backdrop is `aria-hidden`.
5. **Motion discipline:** control transitions stay sub-200ms; the only longer durations are ambient (skeleton shimmer 1400ms loop), which honors the reduced-motion setting.
6. **Typing:** zero `any` across `src/ui` (including GlassTabBar props, which import the bottom-tabs types bundled inside the current expo-router). The one remaining boundary `any` is the Supabase row cast in `src/repositories/supabaseRepository.ts:274`, owned by Track A3 of `IMPLEMENTATION_ROADMAP.md`.

Known, deliberate exceptions: none. Printed documents still use the legacy document palette (`printPalette`) — visually distinct from the on-screen warm palette by choice, noted inside `design-system/print.ts`.

