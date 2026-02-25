---
title: Level 2 - Area View
description: Area leader view with issue management, escalation, and workstation overview.
---

The Level 2 page provides **area leaders** with a consolidated view of their area's issues, production data, and workstations.

## Area Overview

```
┌─────────────────────────────────────────────────────────┐
│  Level 2 › Area View                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─ Overview ───────────────────────────────────────┐   │
│  │                                                  │   │
│  │  Total Issues    Open    Escalated    Resolved   │   │
│  │  ┌────┐         ┌────┐  ┌────┐       ┌────┐     │   │
│  │  │ 24 │         │  8 │  │  3 │       │ 13 │     │   │
│  │  └────┘         └────┘  └────┘       └────┘     │   │
│  │                                                  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ Production Summary ─────────────────────────────┐   │
│  │                                                  │   │
│  │  Total Target    Total Actual    Efficiency       │   │
│  │  ┌──────┐        ┌──────┐        ┌───────┐       │   │
│  │  │ 2400 │        │ 2256 │        │ 94.0% │       │   │
│  │  └──────┘        └──────┘        └───────┘       │   │
│  │                                                  │   │
│  │  Total Downtime                                  │   │
│  │  ┌──────────┐                                    │   │
│  │  │  45 min  │                                    │   │
│  │  └──────────┘                                    │   │
│  │                                                  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Area Issues

Issues at Level 2 can be escalated to Level 3 or resolved directly.

```
┌─ Area Issues (Level 2) ─────────────────────────────────┐
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ #1042 — Hydraulic leak on press arm             │    │
│  │ [OPEN] [HIGH]  L2  Mechanical  Area: North      │    │
│  │ 2026-02-24                                      │    │
│  │ Oil dripping from the left cylinder seal         │    │
│  │                                                  │    │
│  │              [Escalate to L3]  [Resolve]         │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ #1039 — Quality deviation on batch B-2244       │    │
│  │ [ESCALATED] [MEDIUM]  L2  Quality  Area: South  │    │
│  │ 2026-02-23                                      │    │
│  │ Dimensional check failed on 3 consecutive parts  │    │
│  │                                                  │    │
│  │              [Escalate to L3]  [Resolve]         │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Escalation Modal

When escalating an issue, the area leader provides context for the next level.

```
┌─ Escalate Issue ────────────────────────────── [X] ─────┐
│                                                         │
│  Escalation Reason *                                    │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Requires maintenance team expertise beyond area   │  │
│  │ capability. Hydraulic specialist needed.           │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Actions Already Taken                                  │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Isolated the press, cleaned spillage, placed      │  │
│  │ containment tray.                                 │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Support Needed                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Hydraulic specialist and replacement seal kit     │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│                           [Cancel]  [Escalate to L3]    │
└─────────────────────────────────────────────────────────┘
```

## Resolution Modal

```
┌─ Resolve Issue ─────────────────────────────── [X] ─────┐
│                                                         │
│  Root Cause *                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Worn cylinder seal due to age (5+ years)          │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Corrective Actions *                                   │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Replaced seal kit, tested at operating pressure   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Preventive Measures                                    │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Added seal inspection to quarterly PM checklist   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│                                [Cancel]  [Resolve]      │
└─────────────────────────────────────────────────────────┘
```

## Workstation Overview

A table at the bottom lists all workstations in the area.

```
┌─ Workstation Overview ──────────────────────────────────┐
│                                                         │
│  ┌────────────┬──────────────┬────────┬───────┬───────┐ │
│  │ Machine ID │ Name         │ Area   │ Team  │Status │ │
│  ├────────────┼──────────────┼────────┼───────┼───────┤ │
│  │ M-101      │ Press Line 1 │ North  │ Alpha │Active │ │
│  │ M-102      │ Press Line 2 │ North  │ Alpha │Active │ │
│  │ M-201      │ CNC Mill A   │ South  │ Beta  │Active │ │
│  │ M-202      │ CNC Mill B   │ South  │ Beta  │Active │ │
│  │ M-301      │ Assembly 1   │ East   │ Gamma │Active │ │
│  └────────────┴──────────────┴────────┴───────┴───────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```
