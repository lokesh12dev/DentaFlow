# DentaFlow UI redesign baseline audit

Baseline captured on 2026-08-03 using the Expo web development build in demo mode. The first rendered capture is `artifacts/ui-redesign/baseline-today-390x844.png`.

| Route | Viewport | Runtime defects | Overlap / responsive risk | Visual and interaction problems | Repair status |
| --- | --- | --- | --- | --- | --- |
| Today | 390×844 | No console exception in the captured baseline | Bottom navigation obscured lower list content | Dark mode followed OS despite the requested light default; oversized 2×2 metrics; too many bordered containers and competing quick actions | Repaired and visually verified |
| Patients | Phone, tablet, web | No route exception observed | Manual list inset and local FAB behavior were inconsistent | Recent patients duplicated in the main list; large rows and excessive status pills | Repaired and visually verified |
| Calendar | Phone, tablet, web | No route exception observed | Booking action depended on content/header placement | Date controls and resource filters lived inside large cards; schedule lacked a clear chronological rail | Repaired and visually verified |
| Inbox | Phone, tablet, web | No route exception observed | Local action competed with scroll content | Saturated request/callback banners and a card-heavy filter/channel layout delayed the conversation list | Repaired and visually verified |
| More | Phone | Raw same-line JSX whitespace could render as a text child; icon colours were inconsistent | Large two-column grid increased scrolling | Oversized tiles, low information density and invisible-icon risk | Repaired and visually verified |
| Waiting room | Phone | Same raw-text-node regression class affected View composition | Final queue content could sit behind shell controls | Oversized counters and warning surfaces; weak queue priority | Repaired and visually verified |
| Billing | Phone | Same raw-text-node regression class affected View composition | Payment action was not persistently prominent | Oversized money cards and weak currency alignment | Repaired and visually verified |
| Recall | Phone | Same raw-text-node regression class affected View composition | Short lists produced dead space | Large filter/card treatment; next actions were not immediate | Repaired and visually verified |
| Laboratory | Phone | Same raw-text-node regression class affected View composition | Long cards increased risk of hidden final rows | Repeated metrics and competing badges obscured handoffs | Repaired and visually verified |
| Automations | Phone | Same raw-text-node regression class affected View composition | Create action appeared after long content | Too many equal-weight pills and unclear trigger-to-action reading | Repaired and visually verified |

## Cross-route baseline findings

- Root navigation already contained exactly five destinations, but bottom spacing was not governed by one shell geometry contract.
- The application followed the device colour scheme, so dark mode could become the default unexpectedly.
- Several screens created their own primary actions instead of relying on a root contextual action.
- Normal grouped content was enclosed in too many rounded, bordered surfaces.
- Icons were frequently rendered directly, allowing invalid or missing colours to regress.
- No executable guard prevented raw JSX text under non-text React Native components.

All baseline defects above are covered by the shared shell/design-system repair, the two executable source guards, and the final rendered QA matrix in `VISUAL_QA.md`.
