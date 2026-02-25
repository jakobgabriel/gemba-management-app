---
title: Level 1 - Team View
description: Team member workstation view with production entry and issue creation.
---

The Level 1 page is the primary workspace for **team members** on the shopfloor. It focuses on two tasks: logging hourly production data and creating issues.

## Workstation Selection

On first visit, users select their workstation from a grid of available machines.

```
┌─────────────────────────────────────────────────────────┐
│  Level 1 › Team View                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Select Your Workstation                                │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ M-101        │  │ M-102        │  │ M-201        │  │
│  │ Press Line 1 │  │ Press Line 2 │  │ CNC Mill A   │  │
│  │ Area: North  │  │ Area: North  │  │ Area: South  │  │
│  │ Team: Alpha  │  │ Team: Alpha  │  │ Team: Beta   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │ M-202        │  │ M-301        │                     │
│  │ CNC Mill B   │  │ Assembly 1   │                     │
│  │ Area: South  │  │ Area: East   │                     │
│  │ Team: Beta   │  │ Team: Gamma  │                     │
│  └──────────────┘  └──────────────┘                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Workstation Overview & Production Summary

After selecting a workstation, the page shows the machine details and today's production summary.

```
┌─────────────────────────────────────────────────────────┐
│  Level 1 › Team View                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─ Workstation ────────────────────────────────────┐   │
│  │  M-101 — Press Line 1                            │   │
│  │  Area: North  │  Part: PN-4401  [Change Station] │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ Production Summary ─────────────────────────────┐   │
│  │                                                  │   │
│  │  Entries Today    Target    Actual    Variance    │   │
│  │  ┌────┐          ┌────┐    ┌────┐    ┌─────┐    │   │
│  │  │  8 │          │ 800│    │ 756│    │ -44 │    │   │
│  │  └────┘          └────┘    └────┘    └─────┘    │   │
│  │                                                  │   │
│  │  Efficiency       OEE                            │   │
│  │  ┌───────┐       ┌───────┐                       │   │
│  │  │ 94.5% │       │ 87.2% │                       │   │
│  │  └───────┘       └───────┘                       │   │
│  │                                                  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Color coding:**
- Efficiency >= 100%: green
- Efficiency >= 80%: yellow
- Efficiency < 80%: red
- Positive variance: green, negative: red

## Hourly Production Entry

Team members log production data for each hour of their shift.

```
┌─ Hourly Production ─────────────────────────────────────┐
│                                                         │
│  Hour  ┌──┐  Target ┌────┐  Actual ┌────┐  Notes       │
│        │08│         │ 100│         │  95│  ┌─────────┐ │
│        └──┘         └────┘         └────┘  │         │ │
│                                            └─────────┘ │
│                                   [Add Entry]          │
│                                                         │
│  ┌──────┬────────┬────────┬──────────┬────────┬───────┐ │
│  │ Hour │ Target │ Actual │ Variance │ Eff. % │ Notes │ │
│  ├──────┼────────┼────────┼──────────┼────────┼───────┤ │
│  │06:00 │    100 │     98 │       -2 │  98.0% │       │ │
│  │07:00 │    100 │    102 │       +2 │ 102.0% │       │ │
│  │08:00 │    100 │     95 │       -5 │  95.0% │ Jam   │ │
│  │09:00 │    100 │    100 │        0 │ 100.0% │       │ │
│  │10:00 │    100 │     88 │      -12 │  88.0% │ Maint │ │
│  │11:00 │    100 │    103 │       +3 │ 103.0% │       │ │
│  │12:00 │    100 │     72 │      -28 │  72.0% │ Break │ │
│  │13:00 │    100 │     98 │       -2 │  98.0% │       │ │
│  └──────┴────────┴────────┴──────────┴────────┴───────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Click any row to edit the entry in a modal dialog.

## My Open Issues

Below the production data, team members see their open issues and can create new ones.

```
┌─ My Open Issues ─────────────────────── [Add New Issue] ┐
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ #1042 — Hydraulic leak on press arm             │    │
│  │ [HIGH]  Category: Mechanical  Area: North       │    │
│  │ 2026-02-24                                      │    │
│  │ Oil dripping from the left cylinder seal         │    │
│  │                                                  │    │
│  │ ┌─ AI Suggestion ─────────────────────────────┐ │    │
│  │ │ Suggested Level: L2  Confidence: 87%        │ │    │
│  │ │ Reason: Hydraulic issues require area        │ │    │
│  │ │ leader assessment for maintenance schedule.  │ │    │
│  │ └────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ #1038 — Missing safety guard on conveyor        │    │
│  │ [MEDIUM]  Category: Safety  Area: North         │    │
│  │ 2026-02-23                                      │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Create Issue Modal

```
┌─ Create Issue ──────────────────────────────── [X] ─────┐
│                                                         │
│  Issue Title *                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Conveyor belt misalignment                        │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Category *            Priority                         │
│  ┌──────────────┐      ┌──────────────┐                 │
│  │ Mechanical ▾ │      │ MEDIUM     ▾ │                 │
│  └──────────────┘      └──────────────┘                 │
│                                                         │
│  Area                  Subcategory                      │
│  ┌──────────────┐      ┌──────────────┐                 │
│  │ North        │      │              │                 │
│  └──────────────┘      └──────────────┘                 │
│                                                         │
│  Description                                            │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Belt drifting to the left side causing jams...    │  │
│  │                                                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Contact Person                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ J. Smith                                          │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│                              [Cancel]  [Create Issue]   │
└─────────────────────────────────────────────────────────┘
```
