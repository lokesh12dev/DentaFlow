# DentaFlow Web UI Kit — Clinical Workspace

A click-through recreation of the primary DentaFlow surface: the desktop/tablet workspace where clinicians live all day.

## Screens included
1. **Schedule** (default) — Today's chair-by-chair timeline with confirmed / in-chair / unconfirmed states.
2. **Patient chart** — Full patient view: vitals bar, dental chart, treatment plan, notes/media/billing tabs.
3. **Dental chart focus** — Interactive FDI tooth chart with per-tooth status.
4. **Treatment plan** — Phased line items with pricing and insurance estimates.
5. **Command palette** — ⌘K quick action across the whole app.

## Components (in this folder)
- `TopBar.jsx` — Global search + clinic switcher + user
- `SideRail.jsx` — Primary navigation
- `RightPanel.jsx` — Contextual patient panel (slide-in)
- `ScheduleView.jsx` — Chair-by-chair timeline grid
- `ChartView.jsx` — Patient chart shell
- `DentalChart.jsx` — FDI tooth grid with status
- `TreatmentPlan.jsx` — Phased line items
- `CommandPalette.jsx` — ⌘K search
- `primitives.jsx` — Button, Badge, Tag, Avatar, Icon (Lucide inline), etc.

## Notes
Icons are inlined Lucide SVG paths (no CDN required in the artifact). All state is in a single `App` component using `useState`.

Cross-references: uses tokens from `../../colors_and_type.css`.
