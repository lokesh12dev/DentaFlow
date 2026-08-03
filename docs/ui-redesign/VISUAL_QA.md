# DentaFlow visual QA log

## Baseline — Today, 390×844

Capture: `artifacts/ui-redesign/baseline-today-390x844.png`

- Hierarchy: greeting and clinic status were clear, but the 2×2 metric grid consumed most of the first viewport.
- Spacing: repeated card padding produced a tall, low-density screen.
- Typography: readable, although metric values dominated operational actions.
- Colour: OS dark mode appeared by default; semantic warning/danger blocks were too visually heavy.
- Icons: visible on Today, but direct icon rendering remained inconsistent across routes.
- Shell: floating navigation visibly covered lower content in the viewport.
- Final row: not reachable without substantial scrolling and manual padding assumptions.
- States: the demo success state rendered; error/loading/empty states require integrated route checks.

## Final QA matrix

Rendered against the Expo web development build in demo mode. Every phone route was checked for hierarchy, spacing, typography, semantic colour, icon visibility, FAB/nav position, final-row clearance, horizontal overflow and console errors.

| Route | 390×844 | 430×932 | Tablet | Wide web | Runtime console | Result |
| --- | --- | --- | --- | --- | --- | --- |
| Today | Pass | Pass | Pass, 768×1024 | Pass, 1280×900 | 0 errors | Pass |
| Patients | Pass | Pass | Shared centered canvas | Pass, 1280×900 | 0 errors | Pass |
| Calendar | Pass | Pass | Pass, 1024×768 | Shared centered canvas | 0 errors | Pass |
| Inbox | Pass | Pass | Shared centered canvas | Shared centered canvas | 0 errors | Pass |
| More | Pass | Pass | — | — | 0 errors | Pass |
| Waiting room | Pass; mutation toast verified | Pass | — | — | 0 errors | Pass |
| Billing | Pass | Pass | — | — | 0 errors | Pass |
| Recall | Pass | Pass | — | — | 0 errors | Pass |
| Laboratory | Pass | Pass | — | — | 0 errors | Pass |
| Automations | Pass | Pass | — | — | 0 errors | Pass |

Additional responsive sampling at 360×800, 375×812 and 412×915 found no horizontal overflow on Today, Patients or Calendar. The wide layouts use a centered 768-point clinical canvas instead of stretching dense operational content across the screen.

## Interaction checks

- Exactly five root tab roles are rendered: Today, Patients, Calendar, Inbox and More.
- Calendar mode switching activates Week and renders the week schedule.
- The single Calendar `Book appointment` action opens `/appointment/new` without a console error.
- The single Patients `Add patient` action opens `/patient/new` without a console error.
- Waiting-room mutations render a safely placed success toast without covering shell navigation.
- Appearance supports persisted Light, Dark and System modes; the release default is Light.

## Captures

All captures are stored in `artifacts/ui-redesign/`:

- `final-{route}-390x844.png` and `final-{route}-430x932.png` for the ten major routes.
- `final-today-tablet-768x1024.png` and `final-calendar-tablet-1024x768.png`.
- `final-today-web-1280x900.png` and `final-patients-web-1280x900.png`.
- `final-settings-dark-390x844.png` for the persisted dark appearance.
- `final-toast-safe-placement-390x844.png` for mutation feedback clearance.

The browser produced non-fatal development warnings for the unsupported Expo notifications listener on web, Animated native-driver fallback and deprecated `pointerEvents`; no route emitted a console error.
