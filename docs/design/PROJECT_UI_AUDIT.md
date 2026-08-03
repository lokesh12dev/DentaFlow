# `project-ui` audit

Completed against the imported design reference. Generated preview source maps were inventoried but not treated as source components.

| Area | Reference found | DentaFlow mapping | Decision |
|---|---|---|---|
| Buttons | `web/primitives.jsx`, preview | Primary, secondary, quiet, destructive | 44 pt minimum touch; no scale motion |
| Inputs/search | `Input`, command palette | Form field and global search | 52 pt form input; search is a control layer |
| Navigation | mobile tab bar, web side rail/top bar | Five staff destinations | Calendar replaces the kit’s center voice action |
| Segmented controls | schedule header | Calendar view and Inbox channel scopes | Compact, stateful, never decorative |
| List rows | mobile appointments, plan rows | Appointments, patients, Inbox, More | Direct surface plus separators; avoid nested cards |
| Cards | patient summary, chart panels | Reserved for bounded summaries | Not the default section container |
| Sheets/dialogs | patient sheet, command palette | Filters, quick actions, contextual work | Glass/material only in the floating control layer |
| Typography | Geist, Instrument Serif, Geist Mono | UI, rare display, numerics | Native system UI in current RN build; mono behavior through tabular numerals |
| Color | paper/ink, Enamel Teal, muted semantic colors | Light/dark semantic themes | One primary accent; state never relies on color alone |
| Radius | 3/6/10/14/20/pill | Tag/input/card/modal/sheet/control | Content stays precise; large radius is for floating controls |
| Spacing | 4 pt base | 4/8/12/16/24/32/40 | 16–20 page inset, 24–32 section gap |
| Motion | 120/180/260/400 ms, no bounce | Press, control, sheet, page | Motion communicates state; reduced motion required |
| Icons | Lucide, 1.5 px | Existing Lucide RN wrapper | No emoji or mixed icon sets |
| Loading/empty | pattern described, not complete primitives | Existing loading/error/empty components | Every route needs directional empty and retry states |

## Kept

Warm paper surfaces, Enamel Teal, restrained semantic colors, fixed numeric alignment, Lucide icons, direct appointment rows, command search and adaptive side navigation.

## Changed

- The imported mobile kit has four content tabs plus a central voice action. Production uses five fixed destinations: Today, Patients, Calendar, Inbox and More.
- The imported kit’s serif greeting is not used for operational headers. Direct role-aware titles have better scanning value.
- The imported kit uses more cards and blur than the product brief permits. Production reserves glass for controls and uses spacing/separators for content hierarchy.
- The imported CSS permits pure white surfaces; production themes use semantic surface tokens so dark mode is designed independently.

## Missing from the reference and required in production

Accessible disabled/error field states, directional empty states, destructive confirmations, reduced motion, keyboard focus on web, route guards, permission feedback, offline/sync states and screen-reader labels.
