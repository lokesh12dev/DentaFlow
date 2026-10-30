# DentaFlow 2 — Motion Design System

**Last updated:** 2026-10-30
**Source:** `design-system/motion.ts`, `design-system/MASTER.md` §Motion

---

## Motion philosophy

Motion supports the user's work — never decorates. Every animation has a clear purpose: feedback, orientation, or state transition. The application must remain visually excellent with all non-essential animation disabled (reduced-motion preference respected).

---

## Motion tokens

| Token | Duration | Easing | Use case |
| --- | --- | --- | --- |
| `fast` | 150ms | `ease-out` | Button hover, icon toggle, badge state change |
| `normal` | 250ms | `ease-out` | Card press, surface elevation, tab switch |
| `slow` | 350ms | `ease-in-out` | Modal open/close, drawer open/close, page transition |
| `spring` | — | `bounce` | Checkbox toggle, success feedback, floating action press |
| `layout` | 300ms | `ease-out` | List reorder, grid expansion, section collapse |

---

## Implemented animations

### Micro-interactions
| Element | Animation | Trigger | Purpose |
| --- | --- | --- | --- |
| Button | Scale 0.98 → 1.0 | Press | Tactile feedback |
| Icon button | Opacity 0.6 → 1.0 | Press | Tactile feedback |
| Checkbox | Spring bounce | Toggle | Confirmation of state change |
| Switch | Translate + color | Toggle | Clear on/off state |
| Dropdown | Fade + translate | Open/close | Reveal options |
| Toast | Slide up + fade | Appear/dismiss | Non-blocking feedback |
| Dialog | Scale + fade | Open/close | Modal focus |
| Drawer | Slide from edge | Open/close | Side panel reveal |
| Tab | Fade + translate | Switch | Context change |
| Form validation | Pulse error color | Invalid input | Error attention |
| Successful saving | Checkmark spring | Save complete | Confirmation |
| Loading | Spin skeleton | Async operation | Progress indication |

### Page transitions
| Transition | Duration | Easing | Purpose |
| --- | --- | --- | --- |
| Route change | 300ms | ease-out | Contextual navigation |
| Modal open | 250ms | ease-out | Focus shift |
| Modal close | 200ms | ease-in | Dismissal |
| Drawer open | 300ms | ease-out | Side panel reveal |
| Drawer close | 250ms | ease-in | Dismissal |
| Patient profile section | 250ms | ease-out | Section navigation |

### Loading & skeleton
| Element | Animation | Purpose |
| --- | --- | --- |
| Skeleton | Pulse shimmer | Predictable content structure |
| Progress indicator | Spin | Real ongoing operation |
| Inline activity | Spin dots | Inline operation |
| Retry | Pulse | Error recovery option |

---

## Not implemented (by design)

- **Scroll-triggered reveals:** Not used in clinical workflows (distraction-free)
- **Parallax effects:** Not used (performance + accessibility)
- **Scroll-jacking:** Never used
- **Animation on every visible component:** Not used (performance)
- **Animated clinical/financial values:** Never animated (readability + accuracy)
- **Fake progress indicators:** Never used (honesty)

---

## Accessibility

- **Reduced motion:** All animations respect `reduceMotion` from `ThemeProvider`; static alternatives provided
- **Focus visibility:** Focus rings maintained during transitions
- **Screen reader:** State changes announced via accessibility labels
- **Interrupt handling:** Animations cancel on component unmount; rapid repeated interactions don't queue

---

## Dependencies

- `react-native-reanimated` 4.5.1 — layout transitions, shared element transitions
- `react-native-gesture-handler` — touch handling for animated components

No additional animation packages added in this session.
