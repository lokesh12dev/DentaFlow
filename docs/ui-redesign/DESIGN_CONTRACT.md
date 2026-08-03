# DentaFlow clinical interface contract

## Direction

DentaFlow uses a bright, precise clinical-paper interface for staff working under time pressure. Porcelain surfaces, navy ink and restrained dental aqua form the visual hierarchy. The single signature element is the **clinical rail**: a thin chronological line with semantic markers used only for schedules, patient timelines, treatment progress and laboratory handoffs.

## Colour

| Role | Light | Meaning |
| --- | --- | --- |
| Canvas | `#F5F7F8` | Clinical paper |
| Surface | `#FFFFFF` | Porcelain working surface |
| Ink / primary | `#15202A` / `#18384A` | Text and trusted action |
| Clinical | `#167C78` | Active clinical context |
| Border | `#DEE4E8` | Quiet separation |
| Focus | `#287E9A` | Keyboard focus |
| Success | `#237A52` | Completed only |
| Warning | `#9A6412` | Pending attention only |
| Danger | `#B74444` | Medical risk, destructive action or failure |
| Information | `#356C96` | Neutral informational state |

Dark mode uses layered charcoal (`#11171C`, `#192127`, `#212B32`) rather than pure black. Glass is restricted to navigation, sheets, command overlays and floating controls. Gradients are forbidden.

## Typography

The interface uses the platform professional sans-serif with system fallback. The controlled scale is display 30/36/700, page title 26/32/700, section title 18/24/600, row title 16/22/600, body 15/21/400, body strong 15/21/600, secondary 13/18/500, caption 12/16/500 and button 14/18/600. Time, money, counts, patient numbers and durations use tabular numerals.

## Spacing and radius

- Spacing follows a 4 px token ladder on an 8 px composition foundation: 4, 8, 12, 16, 20, 24, 28, 32, 40, 48 and 64.
- Radius roles: compact 8, chip 10, input 12, grouped list 14, card 16, sheet 22, floating navigation 24 and circular/pill only where semantics require it.
- Normal lists prefer dividers and surface contrast over shadows or repeated borders.

## Icons

- Lucide is the sole icon family.
- `AppIcon` owns size, stroke width and theme/semantic colour.
- Icons never inherit browser colour and never use emoji substitutes.
- Minimum icon-button target is 44×44 with a visible web focus ring.

## Shell geometry

- App canvas maximum width: 768 px, centred on wide viewports.
- Horizontal inset: 16 px.
- Bottom navigation: 64 px high, 12 px above the safe-area bottom, 24 px radius.
- Contextual FAB: 52 px high, 12 px above the navigation envelope, aligned to the app canvas right edge.
- Scroll content inset is computed centrally from safe area + navigation + FAB + 20 px breathing room.
- Toasts share the app canvas, are at most 560 px wide and sit above navigation and any active FAB.

## Responsive behavior

- Phones use one primary column.
- Tablet and web centre the working canvas; controls stay attached to the canvas rather than the browser edge.
- Filter collections scroll horizontally when they cannot fit.
- No fixed-width mobile card may stretch across a desktop viewport.
- Primary actions and navigation survive safe-area and text-scaling changes.

## Forbidden patterns

No gradients, emoji icons, decorative tooth art, generic AI glow, giant KPI grids, identical card wrappers, arbitrary radii, excessive pill metadata, decorative progress bars, duplicated records, large two-column phone grids or local copies of bottom navigation/FAB controls.
