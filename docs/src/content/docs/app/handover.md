---
title: Shift Handover
description: Shift-to-shift communication with handover notes and history.
---

The Shift Handover page enables structured communication between shifts. Outgoing shift operators leave notes for the incoming team about ongoing issues, machine status, and important updates.

## Handover Page

```
┌─────────────────────────────────────────────────────────┐
│  Management Tools › Shift Handover                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─ Previous Shift Notes ───────────────────────────┐   │
│  │                                                  │   │
│  │  ┌──────────────────────────────────────────┐    │   │
│  │  │ Morning Shift — 2026-02-25               │    │   │
│  │  │                                          │    │   │
│  │  │ Press Line 1 running normally after seal │    │   │
│  │  │ replacement. CNC Mill B has intermittent │    │   │
│  │  │ alarm on spindle — maintenance aware.    │    │   │
│  │  │ Quality hold on batch B-2250, waiting    │    │   │
│  │  │ for lab results.                         │    │   │
│  │  │                                          │    │   │
│  │  │ Created by: J. Smith  14:02              │    │   │
│  │  │                        [Edit] [Delete]   │    │   │
│  │  └──────────────────────────────────────────┘    │   │
│  │                                                  │   │
│  │  ┌──────────────────────────────────────────┐    │   │
│  │  │ Night Shift — 2026-02-25                 │    │   │
│  │  │                                          │    │   │
│  │  │ All lines running. No issues. Material   │    │   │
│  │  │ delivery for PN-4401 expected at 07:00.  │    │   │
│  │  │                                          │    │   │
│  │  │ Created by: M. Garcia  06:05             │    │   │
│  │  │                                [Delete]  │    │   │
│  │  └──────────────────────────────────────────┘    │   │
│  │                                                  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Edit** is visible only to the note creator. **Delete** is visible to users with role level >= 2.

## Create Handover Note

```
┌─ Create Handover Note ──────────────────────────────────┐
│                                                         │
│  Shift *                                                │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Afternoon (14:00 - 22:00)                       ▾│  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Notes *                                                │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Assembly line 1 completed order #5521. Started    │  │
│  │ changeover for PN-6602, expected ready by 23:00.  │  │
│  │                                                   │  │
│  │ Issue #1042 resolved — hydraulic seal replaced.   │  │
│  │ M-101 back in production.                         │  │
│  │                                                   │  │
│  │ Safety: All clear. PPE compliance 100%.           │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│                           [Save Handover Notes]         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Handover History

A table at the bottom shows all past handover notes.

```
┌─ Handover History ──────────────────────────────────────┐
│                                                         │
│  ┌────────────┬───────────┬─────────────────┬──────┬──┐ │
│  │ Date       │ Shift     │ Notes           │ By   │  │ │
│  ├────────────┼───────────┼─────────────────┼──────┼──┤ │
│  │ 2026-02-25 │ Morning   │ Press Line 1... │Smith │Ed│ │
│  │ 2026-02-25 │ Night     │ All lines ru... │Garcia│Ed│ │
│  │ 2026-02-24 │ Afternoon │ Assembly com... │Doe   │Ed│ │
│  │ 2026-02-24 │ Morning   │ CNC Mill B a... │Smith │Ed│ │
│  │ 2026-02-24 │ Night     │ Maintenance ... │Lee   │Ed│ │
│  └────────────┴───────────┴─────────────────┴──────┴──┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Notes in the table are truncated. Click **Edit** to view and modify the full content.
