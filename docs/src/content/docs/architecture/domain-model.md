---
title: Domain Model
description: Core domain entities and their relationships in the Gemba Management System.
---

## Entity Relationship Overview

The domain model is split across two database schemas:

- **`gemba_config`** — Configuration entities (plants, areas, teams, users)
- **`gemba`** — Operational entities (issues, production data, safety entries, walks)

## Configuration Schema (`gemba_config`)

### Plants, Areas, and Teams

```
Plant (1) ──── (N) Area (1) ──── (N) Team
                     │
                     └──── (N) Workstation
```

| Entity | Key Attributes |
|--------|---------------|
| **Plant** | `id`, `name`, `code`, `timezone`, `locale` |
| **Area** | `id`, `plant_id`, `name`, `code` |
| **Team** | `id`, `area_id`, `name` |
| **Workstation** | `id`, `area_id`, `name`, `code`, `target_per_hour` |

### Users and Roles

```
User (N) ──── (N) Role
  │
  └──── assigned to ──── Team / Area / Plant
```

| Entity | Key Attributes |
|--------|---------------|
| **User** | `id`, `email`, `name`, `role`, `language`, `plant_id` |
| **Role** | `TEAM_MEMBER_L1`, `AREA_LEADER_L2`, `PLANT_MANAGER_L3`, `ADMIN` |

## Operational Schema (`gemba`)

### Issues

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `title` | string | Issue summary |
| `description` | text | Detailed description |
| `category` | string | Safety / Quality / Delivery / Cost / People |
| `priority` | enum | Low / Medium / High / Critical |
| `status` | enum | Open / In Progress / Escalated / Resolved / Closed |
| `created_by` | UUID | Reference to user |
| `area_id` | UUID | Reference to area |
| `escalation_level` | int | 1, 2, or 3 |

### Production Entries

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `workstation_id` | UUID | Reference to workstation |
| `shift_date` | date | Production date |
| `hour` | int | Hour slot (0-23) |
| `target` | int | Target output |
| `actual` | int | Actual output |
| `operator_id` | UUID | Reference to operator |

### Safety Entries

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `area_id` | UUID | Reference to area |
| `entry_date` | date | Safety record date |
| `shift` | enum | Morning / Afternoon / Night |
| `status` | enum | Safe / Unsafe / Incident |
| `notes` | text | Optional details |

### Gemba Walks

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `area_id` | UUID | Reference to area |
| `walker_id` | UUID | Reference to user (leader/manager) |
| `walk_date` | timestamp | When the walk occurred |
| `safety_score` | int | 1-5 rating |
| `quality_score` | int | 1-5 rating |
| `delivery_score` | int | 1-5 rating |
| `cost_score` | int | 1-5 rating |
| `people_score` | int | 1-5 rating |
| `findings` | jsonb | Array of findings with descriptions |
