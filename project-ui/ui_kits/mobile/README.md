# DentaFlow Mobile UI Kit — Clinician Companion

The mobile companion app: today's schedule at a glance, patient quick-view, voice notes between chairs, and a bottom-tab primary nav. Designed for iPhone 14-class devices (390×844 logical).

## Screens included
1. **Today** — Bottom-tabbed home. Time-sorted list of today's appointments with in-chair state.
2. **Patient quick-view** — Slide-up sheet: vitals, last note, quick voice-note capture.
3. **Voice note** — Fullscreen record UI with live transcription placeholder.

## Components
- `PhoneFrame.jsx` — Static iOS-ish device frame
- `MobileApp.jsx` — Root app + state
- `MobileTabBar.jsx` — 5-item bottom tab bar
- `MobileTodayView.jsx` — Today screen
- `MobilePatientSheet.jsx` — Slide-up patient details
- `MobileVoiceNote.jsx` — Voice-note fullscreen
- `mobilePrimitives.jsx` — Icon (shared paths), Avatar, Badge, Button

Uses tokens from `../../colors_and_type.css`. Icons are inline Lucide SVG paths.
