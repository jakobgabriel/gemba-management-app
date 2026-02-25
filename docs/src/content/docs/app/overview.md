---
title: App Overview
description: A visual tour of the Gemba Management application screens and features.
---

The Gemba Management System is organized into four main areas accessible from the sidebar navigation. Each area targets a specific user role and workflow.

## Navigation Structure

```
┌─────────────────────────────────────────────────────────┐
│  GEMBA                                                  │
│  Shopfloor Management                                   │
│                                                         │
│  ┌───────────────┐                                      │
│  │ 👤 John Doe   │                                      │
│  │ Area Leader   │                                      │
│  └───────────────┘                                      │
│                                                         │
│  MANAGEMENT LEVELS                                      │
│  ├── Level 1 - Team                                     │
│  ├── Level 2 - Area                                     │
│  └── Level 3 - Plant                                    │
│                                                         │
│  ISSUE MANAGEMENT                                       │
│  ├── Escalations                                        │
│  ├── Resolution                                         │
│  ├── Dashboard                                          │
│  └── Issue History                                      │
│                                                         │
│  MANAGEMENT TOOLS                                       │
│  ├── Safety Cross                                       │
│  ├── Gemba Walk                                         │
│  └── Shift Handover                                     │
│                                                         │
│  ANALYTICS                                              │
│  └── Analytics                                          │
│                                                         │
│  ADMIN (admin only)                                     │
│  └── Configuration                                      │
│                                                         │
│  [Language: EN ▾]     [Logout]                          │
└─────────────────────────────────────────────────────────┘
```

## User Roles & Access

| Role | Level | Accessible Pages |
|------|-------|-----------------|
| **Team Member** | L1 | Level 1, Escalations, Safety Cross, Handover |
| **Area Leader** | L2 | All L1 pages + Level 2, Dashboard, History, Resolution, Gemba Walk, Analytics |
| **Plant Manager** | L3 | All L2 pages + Level 3 |
| **Admin** | — | All pages + Admin Configuration |

## Application Sections

The app documentation is organized into the following pages:

- **[Login](/gemba-management-app/app/login/)** — Authentication and demo access
- **[Level 1 - Team](/gemba-management-app/app/level1/)** — Production entry, issue creation, workstation view
- **[Level 2 - Area](/gemba-management-app/app/level2/)** — Area overview, escalation, resolution
- **[Level 3 - Plant](/gemba-management-app/app/level3/)** — Plant-wide visibility and management
- **[Issue Management](/gemba-management-app/app/issues/)** — Escalations, resolution, dashboard, history
- **[Safety Cross](/gemba-management-app/app/safety/)** — Daily safety tracking calendar
- **[Gemba Walk](/gemba-management-app/app/gemba-walk/)** — Structured 5-step observation process
- **[Shift Handover](/gemba-management-app/app/handover/)** — Shift-to-shift communication
- **[Analytics](/gemba-management-app/app/analytics/)** — Dashboards, AI queries, reports
- **[Admin Configuration](/gemba-management-app/app/admin/)** — System setup and user management
