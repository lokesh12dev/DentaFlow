# DentaFlow Clinic information architecture

Status: locked for staff application v1.

## Global navigation

The same five destinations establish muscle memory for every staff role:

1. **Today** — role-specific work that needs attention now
2. **Patients** — patient search, recent records and permitted patient actions
3. **Calendar** — appointments, clinicians, chairs and availability
4. **Inbox** — calls, messages, booking requests and staff follow-up
5. **More** — permitted secondary operations

Phone uses a floating bottom control layer. Tablet and web adapt to a sidebar or split view; they do not stretch the phone tab bar.

## Role-aware Today

| Role | First sections | Secondary sections |
|---|---|---|
| Receptionist | Next arrival; live clinic flow; calls and booking requests | Intake gaps; payments due; team hand-offs |
| Dentist | Next patient; medical warnings; assigned schedule | Draft notes; clinical follow-ups; laboratory due |
| Assistant | Next chair; room preparation; consent/media gaps | Laboratory hand-offs; stock alerts; tasks |
| Billing | Collections; overdue accounts; payments in progress | Receipts/refunds; unbilled visits; billing tasks |
| Admin/owner | Clinic pulse; exceptions; branch flow | Team capacity; reports; integrations; governance |

## Destination structure

```text
Today
├── Immediate event
├── Live flow
├── Attention queue
└── Role-specific work

Patients
├── Search
├── Recent patients
├── Filters
├── Patient list
└── Patient record
    ├── Summary
    ├── Timeline
    ├── Clinical
    └── Finance

Calendar
├── Day / week / clinician / chair
├── Date strip
├── Resource filter
├── Timeline
└── Appointment detail

Inbox
├── All / calls / WhatsApp / email / internal
├── Priority work
├── Conversation list
└── Conversation detail

More
├── Clinic operations
│   ├── Waiting room
│   ├── Tasks
│   ├── Recall
│   └── Treatment pipeline
├── Finance
│   ├── Billing
│   ├── Payments
│   └── Reports
├── Clinical support
│   ├── Laboratory
│   ├── Inventory
│   └── Templates
└── Administration
    ├── Team
    ├── Branches
    ├── Automations
    ├── Integrations
    ├── Audit log
    └── Settings
```

Unavailable More items are omitted. Direct links remain guarded. Removing an item must not change the order of the remaining groups.

## Contextual actions

- Today: role default from the role matrix; no global action when no dominant task exists.
- Patients: Add patient.
- Calendar: New appointment; always visible.
- Inbox: Compose.
- Patient record: Call, Message, Book and Add clinical entry, filtered by permission.

Only one floating primary action appears per screen. Secondary actions belong in a toolbar, overflow menu or focused sheet.

## State and adaptive layout

- Preserve selected tab, search, filter, date, branch and selected record when moving between destinations.
- Phone: one column, 16–20 pt page inset, sheets for filters and quick work.
- Tablet: list/detail for Patients and Inbox; resource/schedule split for Calendar.
- Web: keyboard-accessible sidebar, command search and persistent detail pane where useful.
- Content scrolls behind the navigation/control layer and reserves safe-area plus control height.
