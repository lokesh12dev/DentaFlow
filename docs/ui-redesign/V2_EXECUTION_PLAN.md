# DentaFlow UI architecture and redesign plan

Updated: 2026-08-04

## Implementation checkpoint

- Complete: staff sign-in, password-recovery trigger and clinic creation.
- Complete: five-destination mobile navigation with Schedule replacing Calendar.
- Complete: root actions moved into top toolbars; the bottom Liquid Glass layer now contains navigation only.
- Complete: compact root-header language for Today, Patients, Schedule, Inbox and More.
- Verified: 360×800, 390×844 and 430×932 core-route layouts without horizontal overflow or browser console errors.
- Next: adaptive tablet/sidebar behavior, sheet geometry, role-aware Today ordering and secondary module consolidation.

## Product audience

DentaFlow is an internal clinic operating system. Its primary users are dentists, dental assistants, reception and front-desk teams, billing staff, practice managers, and clinic owners. Patients do not enter this workspace; they use the separate patient portal.

The interface must therefore be role-aware without becoming a collection of separate apps. Everyone shares the same patient and clinic record, while permissions and the order of information change by role.

## Navigation architecture

```text
Sign in
  └─ Clinic or branch selection when required
      └─ Staff workspace
          ├─ Today       Role-aware priorities and live clinic flow
          ├─ Schedule    Appointments, clinicians, chairs and booking
          ├─ Patients    Search, records, history and clinical work
          ├─ Inbox       Patient conversations and communication tasks
          └─ More        Billing, labs, recalls, inventory and administration
```

Rules:

- Tabs are stable top-level destinations, never actions.
- The mobile tab bar contains 5 or fewer labeled destinations.
- Primary actions belong in a contextual toolbar button or floating action.
- Detail screens push from their source list; short focused tasks use sheets.
- Administrative destinations live under More and are permission-gated.
- Tablet and wide layouts may adapt the same destinations into a sidebar.
- Each tab preserves its own navigation state.

## Visual direction

The design thesis is **calm clinical precision**: the interface should quiet a busy clinic and make the next safe action obvious.

### Palette

- Paper — `#FBF9F6`: warm application background.
- Surface — `#FFFFFF`: focused content wells only.
- Ink — `#14161A`: primary copy, never pure black.
- Enamel teal — `#1F6E66`: the single primary accent.
- Hairline — `#E1DCD1`: grouping and separation.
- Coral — `#C64A2E`: reserved for urgent clinical or financial states.

### Typography

- Geist is the product UI reference face.
- The native iOS build uses the platform system face where it improves Dynamic Type and platform fidelity.
- Instrument Serif is reserved for one calm display moment, never routine headings.
- Geist Mono or tabular system numerals are used for time, currency, tooth codes and operational counts.
- Screen titles use short nouns: Today, Schedule, Patients, Inbox.
- Subtitles explain the current task, not the product category.

### Spacing and placement

- All dimensions derive from a 4-point grid.
- Mobile page inset: 24 points for authentication, 16 points for operational lists.
- Major vertical section gap: 32 points.
- Related control gap: 12–16 points.
- Touch targets: minimum 44×44 points.
- Inputs: 52 points high with 6–10 point radius.
- Cards are used only when enclosure communicates ownership or interaction.
- Lists use dividers and negative space instead of repeated floating cards.
- Scroll content receives measured clearance for floating navigation and actions.

## Liquid Glass boundary

Liquid Glass is a functional layer, not a decoration system.

- Use regular glass for floating tab bars, compact toolbars, sheet controls and transient action clusters on iOS.
- Keep the content layer on solid paper or standard material.
- Never stack glass on glass.
- Never use clear glass over low-contrast clinical content.
- Preserve legibility under Reduce Transparency, Increase Contrast and Dark Mode.
- Android and web receive a restrained translucent fallback with the same geometry, not a fake glossy effect.

## Signature element

The reusable DentaFlow signature is an **enamel clinical rail**: a fine teal time/status line that connects a patient, the current clinical state and the next action. It replaces decorative progress bars and repeated colored cards.

## Execution sequence

1. Authentication: rebuild sign-in, recovery and clinic-entry hierarchy.
2. Shell: rebuild top toolbars, bottom navigation, safe-area geometry and sheets.
3. Today and Schedule: establish the operational information hierarchy.
4. Patients and Inbox: simplify records and communication flow.
5. More modules: consolidate and permission-gate administrative work.
6. System states: empty, loading, error, offline and destructive confirmations.
7. QA: 360–430 point phones, Dynamic Type, dark mode, reduced transparency, tablet, wide web and route interaction checks.

## Acceptance criteria

- A user can identify the current place and primary action within 2 seconds.
- No tab, toolbar, FAB, toast or sheet obscures meaningful content.
- Every screen has one dominant heading and at most one primary accent action.
- No dead controls, duplicated records, decorative pills or giant KPI grids remain.
- Role-inappropriate modules are hidden by permission, not merely disabled.
- All interactive controls have labels, 44-point targets, visible focus and deterministic states.
