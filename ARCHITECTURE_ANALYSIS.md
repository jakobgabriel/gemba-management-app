# GEMBA Management System - Architecture Analysis & Cloud-Native Production Plan

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Functional Decomposition](#2-functional-decomposition)
3. [Target Cloud-Native Architecture](#3-target-cloud-native-architecture)
4. [API Design](#4-api-design)
5. [Database Design](#5-database-design)
6. [Containerization & Deployment Strategy](#6-containerization--deployment-strategy)
7. [Implementation Plan](#7-implementation-plan)

---

## 1. Current State Analysis

### 1.1 What Exists Today

The repository contains a **single-file click dummy** (`gemba-management.html`, 5,507 lines) implementing a Gemba (shopfloor) management system. It is a fully self-contained HTML/CSS/JS prototype with:

- **No backend** - all logic runs client-side in a monolithic `app` JavaScript object
- **No database** - data lives in-memory with partial `localStorage` persistence (language preference, admin config only)
- **No authentication** - role selection is unguarded (no password validation)
- **No API layer** - no HTTP calls, no REST/GraphQL endpoints
- **No build system** - no bundler, no package manager, no dependencies
- **No tests** - zero test coverage

### 1.2 What Works Well in the Prototype

The prototype is a strong functional specification. It defines:

| Aspect | Quality | Notes |
|--------|---------|-------|
| Domain model | Strong | Issues, production data, safety cross, Gemba walks are well-defined |
| User roles & access control | Strong | 4 clear levels with permission matrix |
| Workflow definitions | Strong | Issue lifecycle (create → escalate → resolve), 5-step Gemba walk |
| i18n | Extensive | 15 languages with full translation keys |
| UI/UX flows | Complete | Every screen, modal, and navigation path is implemented |
| Data models | Detailed | All entity shapes are defined with realistic sample data |

### 1.3 What Cannot Survive Into Production

| Gap | Risk | Required Change |
|-----|------|-----------------|
| In-memory data storage | Total data loss on refresh | Persistent database |
| No authentication | Zero security | Auth service with JWT/OIDC |
| No API layer | No multi-user, no mobile apps | REST API backend |
| Single HTML file | Unmaintainable at scale | Component-based frontend |
| No input validation | Injection vectors, corrupt data | Server-side validation |
| No audit trail | Compliance failure in manufacturing | Event sourcing / audit log |
| Client-side "AI" | Keyword matching only, not real AI | Backend NLP/LLM integration |
| No offline support | Shopfloor has spotty connectivity | Service worker + sync queue |
| localStorage only config | Config not shared across clients | Config database |

---

## 2. Functional Decomposition

### 2.1 Bounded Contexts (Domain-Driven Design)

From the prototype, 7 bounded contexts emerge:

```
┌─────────────────────────────────────────────────────────────────┐
│                    GEMBA Management System                       │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│   Identity   │  Production  │    Issue     │    Safety          │
│   & Access   │  Tracking    │  Management  │    Management      │
│              │              │              │                    │
│ - Users      │ - Hourly     │ - Create     │ - Safety Cross     │
│ - Roles      │   entries    │ - Escalate   │ - Shift entries    │
│ - Sessions   │ - Targets    │ - Resolve    │ - Incident log     │
│ - Permissions│ - Actuals    │ - AI assist  │ - Days w/o         │
│              │ - Efficiency │ - History    │   accident         │
├──────────────┼──────────────┼──────────────┼────────────────────┤
│  Gemba Walk  │ Configuration│  Analytics   │   Notification     │
│              │  (Admin)     │  & Reporting │   & Escalation     │
│ - 5-step     │ - Machines   │ - Dashboards │ - Real-time push   │
│   process    │ - Areas      │ - AI reports │ - Shift handover   │
│ - Findings   │ - Teams      │ - KPIs       │ - Escalation       │
│ - Walk       │ - Categories │ - Trends     │   routing          │
│   history    │ - Operators  │              │                    │
│              │ - Shifts     │              │                    │
└──────────────┴──────────────┴──────────────┴────────────────────┘
```

### 2.2 Core Feature Inventory

#### F1: Authentication & Authorization
- Login with username/password (currently mocked)
- 4 role levels: Team Member, Area Leader, Plant Manager, Admin
- Role-based view access control matrix
- Session management

#### F2: Production Tracking
- Hourly production entry per workstation (target vs actual)
- Part number tracking with multiple entries per hour
- Efficiency calculation (actual/target %)
- Shift-based data segmentation (Early/Late/Night)
- Workstation selection and assignment

#### F3: Issue Management (Core)
- Full lifecycle: CREATE → OPEN → ESCALATED → RESOLVED
- 6 categories: Mechanical, Electrical, Quality, Material, Safety, Other
- 3 priority levels: LOW, MEDIUM, HIGH
- Multi-level escalation (L1 → L2 → L3)
- Impact tracking on resolution (downtime prevented, defects reduced, cost savings)
- Source tracking (production floor vs Gemba walk)
- AI-powered escalation suggestions

#### F4: Gemba Walk
- 5-step structured process: Initiation → Observation → Documentation → Issues → Report
- Participant tracking, area targeting, focus objectives
- Observation checklist
- Issue generation from walk findings
- Walk history with duration and metrics

#### F5: Safety Cross
- Daily shift safety status (safe / near-miss / incident / not-reported)
- Per-shift, per-team, per-area tracking
- Days-without-accident counter
- Incident history and notes

#### F6: Analytics & AI Assistant
- Issue dashboard with status summaries
- Category breakdown, escalation analysis, resolution time analytics
- Natural language query with relevance scoring
- AI report generation
- Query history

#### F7: Configuration Management (Admin)
- CRUD for: workstations, categories, areas, teams, operators
- Shift configuration
- Priority configuration

#### F8: Internationalization
- 15 languages with complete translation maps
- Language-specific speech recognition codes
- Persistent language preference

#### F9: Voice Input
- Web Speech API integration
- Multi-language voice recognition
- Hands-free dictation for all form fields

#### F10: Shift Handover
- Handover notes per shift per date
- Previous shift notes display
- Structured handover workflow

---

## 3. Target Cloud-Native Architecture

### 3.1 Architecture Pattern: Modular Monolith → Microservices

For a manufacturing app that must be reliable, maintainable, and deployable to edge/cloud, the recommended approach is:

**Phase 1**: Modular monolith (single deployable, internal module boundaries)
**Phase 2**: Extract services as scaling demands require

This avoids premature microservice complexity while maintaining clean boundaries for future extraction.

### 3.2 High-Level Architecture

```
                                    ┌──────────────────┐
                                    │   CDN / Ingress   │
                                    │   (Traefik/NGINX) │
                                    └────────┬─────────┘
                                             │
                        ┌────────────────────┼────────────────────┐
                        │                    │                    │
                  ┌─────▼─────┐       ┌──────▼──────┐     ┌──────▼──────┐
                  │  Frontend  │       │  API Gateway │     │  WebSocket  │
                  │  (SPA)     │       │  /api/v1/*   │     │  Server     │
                  │  React/    │       │              │     │  (live data │
                  │  Next.js   │       │  Rate limit  │     │   & push)   │
                  │            │       │  Auth check  │     │             │
                  └────────────┘       │  Request log │     └──────┬──────┘
                                       └──────┬──────┘            │
                                              │                   │
                  ┌───────────────────────────┼───────────────────┘
                  │                           │
         ┌────────▼────────────────────────────▼──────────────────┐
         │                  Backend (Go / Node.js)                │
         │                                                        │
         │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
         │  │ Auth     │ │ Issue    │ │Production│ │ Safety   │  │
         │  │ Module   │ │ Module   │ │ Module   │ │ Module   │  │
         │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
         │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
         │  │ Gemba    │ │ Config   │ │Analytics │ │ Notif.   │  │
         │  │ Walk Mod.│ │ Module   │ │ Module   │ │ Module   │  │
         │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
         └──────────┬──────────────────────┬──────────────────────┘
                    │                      │
         ┌──────────▼──────┐    ┌──────────▼──────┐
         │  PostgreSQL     │    │  Redis           │
         │  (Primary DB)   │    │  (Cache/Sessions │
         │                 │    │   /Pub-Sub)      │
         └─────────────────┘    └─────────────────┘
```

### 3.3 Technology Choices

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | React + TypeScript + Vite | Component-based, strong typing, fast builds, large ecosystem |
| **Backend** | Node.js (Express/Fastify) or Go | JS: fastest to port from prototype. Go: better performance for manufacturing edge. Decision depends on team. |
| **API** | REST (OpenAPI 3.1) | Simple, well-understood, tooling-rich. GraphQL unnecessary for this domain. |
| **Real-time** | WebSocket (Socket.IO or native WS) | Live production data, escalation push notifications |
| **Database (prod data)** | PostgreSQL 16 | Relational data fits the domain. Issues, production entries, safety records have clear relationships. |
| **Database (config)** | PostgreSQL (same instance, separate schema) | Config data is relational (machines → areas → teams). No need for separate DB engine. |
| **Cache / Sessions** | Redis 7 | Session store, API response cache, pub/sub for WebSocket fan-out |
| **Search / AI** | PostgreSQL full-text search + optional LLM API | FTS covers 90% of query needs. LLM API (OpenAI/Anthropic) for AI reports. |
| **Auth** | JWT + Refresh tokens (or OIDC via Keycloak) | Stateless auth for horizontal scaling. Keycloak if SSO/LDAP integration needed. |
| **i18n** | i18next (frontend) + accept-language header | Industry standard, lazy-loading of translation bundles |
| **Voice** | Web Speech API (browser) | No backend needed, already works in prototype |
| **Container Runtime** | Docker (OCI images) | Industry standard for Linux containers |
| **Orchestration** | Kubernetes (K8s) or Docker Compose | K8s for multi-plant. Compose for single-site edge. |
| **CI/CD** | GitHub Actions | Integrated with repo, free for open-source |
| **Observability** | OpenTelemetry + Prometheus + Grafana | Cloud-native standard, vendor-neutral |

### 3.4 Container Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                         │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ gemba-      │  │ gemba-       │  │ gemba-             │  │
│  │ frontend    │  │ backend      │  │ ws-server          │  │
│  │             │  │              │  │                    │  │
│  │ nginx +     │  │ node/go +    │  │ WebSocket          │  │
│  │ static SPA  │  │ REST API     │  │ server             │  │
│  │             │  │              │  │                    │  │
│  │ Port: 80    │  │ Port: 3000   │  │ Port: 3001         │  │
│  │ Replicas: 2 │  │ Replicas: 3  │  │ Replicas: 2        │  │
│  └─────────────┘  └──────────────┘  └────────────────────┘  │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ postgresql  │  │ redis        │  │ traefik /          │  │
│  │             │  │              │  │ ingress-nginx      │  │
│  │ StatefulSet │  │ StatefulSet  │  │                    │  │
│  │ + PVC       │  │              │  │ Ingress            │  │
│  │ Port: 5432  │  │ Port: 6379   │  │ Controller         │  │
│  │ Replicas: 1 │  │ Replicas: 1  │  │ Port: 80/443       │  │
│  └─────────────┘  └──────────────┘  └────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. API Design

### 4.1 API Overview

Base URL: `/api/v1`

All endpoints require `Authorization: Bearer <JWT>` except `/api/v1/auth/login`.

### 4.2 Endpoint Inventory

#### Authentication

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/auth/login` | Authenticate user | No |
| POST | `/auth/refresh` | Refresh JWT | Refresh token |
| POST | `/auth/logout` | Invalidate session | Yes |
| GET | `/auth/me` | Current user profile | Yes |

#### Users & Roles (Admin)

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/users` | List users | Admin |
| POST | `/users` | Create user | Admin |
| PUT | `/users/:id` | Update user | Admin |
| DELETE | `/users/:id` | Delete user | Admin |
| GET | `/roles` | List roles | Admin |

#### Issues

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/issues` | List issues (filtered) | L1+ |
| GET | `/issues/:id` | Get issue detail | L1+ |
| POST | `/issues` | Create issue | L1+ |
| PUT | `/issues/:id` | Update issue | L1+ |
| POST | `/issues/:id/escalate` | Escalate issue | L1+ |
| POST | `/issues/:id/resolve` | Resolve issue | L2+ |
| GET | `/issues/:id/history` | Issue audit trail | L2+ |
| GET | `/issues/stats` | Issue statistics | L2+ |

**Query parameters for `GET /issues`:**
- `status` (OPEN, ESCALATED, RESOLVED)
- `level` (1, 2, 3)
- `category` (Mechanical, Electrical, ...)
- `priority` (LOW, MEDIUM, HIGH)
- `area` (string)
- `shift` (Early, Late, Night)
- `from_date`, `to_date`
- `search` (full-text search)
- `page`, `per_page`
- `sort_by`, `sort_order`

#### Production Data

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/production/entries` | List production entries | L1+ |
| POST | `/production/entries` | Create hourly entry | L1+ |
| PUT | `/production/entries/:id` | Update entry | L1+ |
| GET | `/production/summary` | Shift/daily summary | L2+ |
| GET | `/production/machines/:id/data` | Machine-specific data | L1+ |

**Query parameters for `GET /production/entries`:**
- `machine_id`
- `shift`
- `date`
- `from_date`, `to_date`

#### Safety Cross

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/safety/entries` | List safety entries | L1+ |
| POST | `/safety/entries` | Create safety entry | L1+ |
| PUT | `/safety/entries/:id` | Update entry | L1+ |
| GET | `/safety/stats` | Safety statistics | L2+ |
| GET | `/safety/days-without-accident` | Accident-free days | L1+ |

#### Gemba Walk

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/gemba-walks` | List walks | L2+ |
| GET | `/gemba-walks/:id` | Get walk detail | L2+ |
| POST | `/gemba-walks` | Start new walk | L2+ |
| PUT | `/gemba-walks/:id` | Update walk (step progression) | L2+ |
| POST | `/gemba-walks/:id/complete` | Complete walk | L2+ |
| POST | `/gemba-walks/:id/findings` | Add finding | L2+ |
| POST | `/gemba-walks/:id/issues` | Create issue from walk | L2+ |

#### Configuration (Admin)

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/config/workstations` | List workstations | L1+ |
| POST | `/config/workstations` | Create workstation | Admin |
| PUT | `/config/workstations/:id` | Update workstation | Admin |
| DELETE | `/config/workstations/:id` | Delete workstation | Admin |
| GET | `/config/categories` | List categories | L1+ |
| POST | `/config/categories` | Create category | Admin |
| DELETE | `/config/categories/:id` | Delete category | Admin |
| GET | `/config/areas` | List areas | L1+ |
| POST | `/config/areas` | Create area | Admin |
| DELETE | `/config/areas/:id` | Delete area | Admin |
| GET | `/config/teams` | List teams | L1+ |
| POST | `/config/teams` | Create team | Admin |
| DELETE | `/config/teams/:id` | Delete team | Admin |
| GET | `/config/operators` | List operators | L1+ |
| POST | `/config/operators` | Create operator | Admin |
| DELETE | `/config/operators/:id` | Delete operator | Admin |
| GET | `/config/shifts` | List shifts | L1+ |

#### Analytics & AI

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/analytics/dashboard` | Dashboard aggregations | L2+ |
| GET | `/analytics/issues/breakdown` | Category/priority breakdown | L2+ |
| GET | `/analytics/issues/resolution-times` | Resolution time stats | L3 |
| GET | `/analytics/production/efficiency` | Production efficiency trends | L2+ |
| POST | `/ai/query` | Natural language query | L2+ |
| POST | `/ai/report` | Generate AI report | L3 |
| POST | `/ai/escalation-suggestion` | Get escalation recommendation | L1+ |

#### Shift Handover

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/handover/notes` | Get handover notes | L1+ |
| POST | `/handover/notes` | Create handover note | L1+ |
| GET | `/handover/notes/current` | Current shift notes | L1+ |

### 4.3 WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `issue:created` | Server → Client | New issue created |
| `issue:escalated` | Server → Client | Issue escalated |
| `issue:resolved` | Server → Client | Issue resolved |
| `production:update` | Server → Client | Live production data |
| `safety:update` | Server → Client | Safety status change |
| `notification:push` | Server → Client | General notification |

### 4.4 API Response Format

```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 142,
    "total_pages": 8
  },
  "errors": null
}
```

Error format:
```json
{
  "data": null,
  "meta": null,
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "field": "priority",
      "message": "Priority must be one of: LOW, MEDIUM, HIGH"
    }
  ]
}
```

---

## 5. Database Design

### 5.1 Schema Overview

Two schemas in PostgreSQL:

- `gemba` - Production/operational data
- `gemba_config` - Configuration/reference data

### 5.2 Configuration Schema (`gemba_config`)

```sql
-- Plants / Sites (multi-tenant support)
CREATE TABLE gemba_config.plants (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    code        VARCHAR(50) UNIQUE NOT NULL,
    timezone    VARCHAR(50) NOT NULL DEFAULT 'UTC',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Production Areas
CREATE TABLE gemba_config.areas (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id    UUID NOT NULL REFERENCES gemba_config.plants(id),
    name        VARCHAR(255) NOT NULL,
    code        VARCHAR(50),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(plant_id, name)
);

-- Teams
CREATE TABLE gemba_config.teams (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id    UUID NOT NULL REFERENCES gemba_config.plants(id),
    name        VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(plant_id, name)
);

-- Workstations / Machines
CREATE TABLE gemba_config.workstations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id        UUID NOT NULL REFERENCES gemba_config.plants(id),
    machine_code    VARCHAR(50) NOT NULL,       -- e.g., "M-401"
    name            VARCHAR(255) NOT NULL,       -- e.g., "Assembly Line 2 - Station 3"
    area_id         UUID NOT NULL REFERENCES gemba_config.areas(id),
    team_id         UUID REFERENCES gemba_config.teams(id),
    default_part    VARCHAR(100),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(plant_id, machine_code)
);

-- Issue Categories
CREATE TABLE gemba_config.issue_categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id    UUID NOT NULL REFERENCES gemba_config.plants(id),
    name        VARCHAR(100) NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(plant_id, name)
);

-- Shift Definitions
CREATE TABLE gemba_config.shift_definitions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id    UUID NOT NULL REFERENCES gemba_config.plants(id),
    name        VARCHAR(50) NOT NULL,           -- "Early", "Late", "Night"
    start_time  TIME NOT NULL,                  -- 06:00
    end_time    TIME NOT NULL,                  -- 14:00
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(plant_id, name)
);

-- Roles
CREATE TABLE gemba_config.roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(50) UNIQUE NOT NULL,    -- "team_member", "area_leader", "plant_manager", "admin"
    level       INTEGER NOT NULL,               -- 1, 2, 3, 99
    description VARCHAR(255)
);

-- Users
CREATE TABLE gemba_config.users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id        UUID NOT NULL REFERENCES gemba_config.plants(id),
    username        VARCHAR(100) UNIQUE NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    display_name    VARCHAR(255) NOT NULL,
    role_id         UUID NOT NULL REFERENCES gemba_config.roles(id),
    team_id         UUID REFERENCES gemba_config.teams(id),
    preferred_lang  VARCHAR(5) NOT NULL DEFAULT 'en',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Operators (can be separate from users - shopfloor workers may not have accounts)
CREATE TABLE gemba_config.operators (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id    UUID NOT NULL REFERENCES gemba_config.plants(id),
    name        VARCHAR(255) NOT NULL,
    team_id     UUID REFERENCES gemba_config.teams(id),
    user_id     UUID REFERENCES gemba_config.users(id),  -- nullable: not all operators have system accounts
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(plant_id, name)
);
```

### 5.3 Production Data Schema (`gemba`)

```sql
-- Issues
CREATE TABLE gemba.issues (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id            UUID NOT NULL REFERENCES gemba_config.plants(id),
    issue_number        SERIAL,                     -- human-readable sequential ID
    level               INTEGER NOT NULL DEFAULT 1, -- 1, 2, 3
    title               VARCHAR(500) NOT NULL,
    area_id             UUID REFERENCES gemba_config.areas(id),
    area_text           VARCHAR(255),               -- free-text for flexibility
    category_id         UUID REFERENCES gemba_config.issue_categories(id),
    subcategory         VARCHAR(100),
    priority            VARCHAR(10) NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    status              VARCHAR(20) NOT NULL DEFAULT 'OPEN'
                        CHECK (status IN ('OPEN', 'ESCALATED', 'RESOLVED')),
    description         TEXT,
    contact_person      VARCHAR(255),
    source              VARCHAR(20) NOT NULL DEFAULT 'production'
                        CHECK (source IN ('production', 'gemba')),
    shift_id            UUID REFERENCES gemba_config.shift_definitions(id),
    reported_time       TIME,
    workstation_id      UUID REFERENCES gemba_config.workstations(id),
    gemba_walk_id       UUID,                       -- FK added after gemba_walks table
    created_by          UUID NOT NULL REFERENCES gemba_config.users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Issue Escalations (audit trail)
CREATE TABLE gemba.issue_escalations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id        UUID NOT NULL REFERENCES gemba.issues(id),
    from_level      INTEGER NOT NULL,
    to_level        INTEGER NOT NULL,
    reason          TEXT,
    actions_taken   TEXT,
    support_needed  TEXT,
    escalated_by    UUID NOT NULL REFERENCES gemba_config.users(id),
    escalated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Issue Resolutions
CREATE TABLE gemba.issue_resolutions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id            UUID NOT NULL REFERENCES gemba.issues(id) UNIQUE,
    resolution          TEXT NOT NULL,
    resolved_by         UUID NOT NULL REFERENCES gemba_config.users(id),
    resolved_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    downtime_prevented  INTEGER DEFAULT 0,          -- minutes
    defects_reduced     INTEGER DEFAULT 0,          -- count
    cost_savings        DECIMAL(12,2) DEFAULT 0     -- currency
);

-- AI Escalation Suggestions
CREATE TABLE gemba.ai_suggestions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id        UUID NOT NULL REFERENCES gemba.issues(id),
    suggested_level INTEGER NOT NULL,
    reason          TEXT NOT NULL,
    confidence      INTEGER NOT NULL CHECK (confidence BETWEEN 0 AND 100),
    accepted        BOOLEAN,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Production Entries (hourly tracking)
CREATE TABLE gemba.production_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id        UUID NOT NULL REFERENCES gemba_config.plants(id),
    workstation_id  UUID NOT NULL REFERENCES gemba_config.workstations(id),
    shift_id        UUID NOT NULL REFERENCES gemba_config.shift_definitions(id),
    entry_date      DATE NOT NULL,
    hour            INTEGER NOT NULL CHECK (hour BETWEEN 0 AND 23),
    target          INTEGER NOT NULL DEFAULT 0,
    actual          INTEGER NOT NULL DEFAULT 0,
    part_number     VARCHAR(100),
    notes           TEXT,
    created_by      UUID NOT NULL REFERENCES gemba_config.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(workstation_id, entry_date, hour)
);

-- Safety Cross Entries
CREATE TABLE gemba.safety_entries (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id    UUID NOT NULL REFERENCES gemba_config.plants(id),
    entry_date  DATE NOT NULL,
    shift_id    UUID NOT NULL REFERENCES gemba_config.shift_definitions(id),
    status      VARCHAR(20) NOT NULL
                CHECK (status IN ('safe', 'near-miss', 'incident', 'not-reported')),
    team_id     UUID REFERENCES gemba_config.teams(id),
    area_id     UUID REFERENCES gemba_config.areas(id),
    notes       TEXT,
    created_by  UUID NOT NULL REFERENCES gemba_config.users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(plant_id, entry_date, shift_id, team_id)
);

-- Gemba Walks
CREATE TABLE gemba.gemba_walks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id        UUID NOT NULL REFERENCES gemba_config.plants(id),
    leader_id       UUID NOT NULL REFERENCES gemba_config.users(id),
    target_areas    TEXT,
    focus           TEXT,
    participants    TEXT,
    team_feedback   TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'in_progress'
                    CHECK (status IN ('in_progress', 'completed', 'cancelled')),
    current_step    INTEGER NOT NULL DEFAULT 1 CHECK (current_step BETWEEN 1 AND 5),
    started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ,
    duration_min    INTEGER                     -- computed on completion
);

-- Add FK from issues to gemba_walks
ALTER TABLE gemba.issues
    ADD CONSTRAINT fk_issues_gemba_walk
    FOREIGN KEY (gemba_walk_id) REFERENCES gemba.gemba_walks(id);

-- Gemba Walk Findings
CREATE TABLE gemba.gemba_walk_findings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    walk_id         UUID NOT NULL REFERENCES gemba.gemba_walks(id),
    observation     TEXT NOT NULL,
    area_id         UUID REFERENCES gemba_config.areas(id),
    finding_type    VARCHAR(50),                -- "positive", "concern", "action_needed"
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Shift Handover Notes
CREATE TABLE gemba.shift_handover_notes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id    UUID NOT NULL REFERENCES gemba_config.plants(id),
    shift_id    UUID NOT NULL REFERENCES gemba_config.shift_definitions(id),
    note_date   DATE NOT NULL,
    content     TEXT NOT NULL,
    created_by  UUID NOT NULL REFERENCES gemba_config.users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit Log (append-only)
CREATE TABLE gemba.audit_log (
    id          BIGSERIAL PRIMARY KEY,
    plant_id    UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,           -- "issue", "production_entry", etc.
    entity_id   UUID NOT NULL,
    action      VARCHAR(20) NOT NULL,           -- "create", "update", "delete"
    old_data    JSONB,
    new_data    JSONB,
    user_id     UUID NOT NULL,
    ip_address  INET,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_issues_plant_status ON gemba.issues(plant_id, status);
CREATE INDEX idx_issues_plant_category ON gemba.issues(plant_id, category_id);
CREATE INDEX idx_issues_created_at ON gemba.issues(created_at);
CREATE INDEX idx_issues_level ON gemba.issues(level);
CREATE INDEX idx_production_entries_ws_date ON gemba.production_entries(workstation_id, entry_date);
CREATE INDEX idx_safety_entries_plant_date ON gemba.safety_entries(plant_id, entry_date);
CREATE INDEX idx_gemba_walks_plant ON gemba.gemba_walks(plant_id, started_at);
CREATE INDEX idx_audit_log_entity ON gemba.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON gemba.audit_log(created_at);

-- Full-text search index on issues
ALTER TABLE gemba.issues ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(subcategory, '')), 'C')
    ) STORED;

CREATE INDEX idx_issues_search ON gemba.issues USING GIN(search_vector);
```

### 5.4 Database Separation Summary

| Schema | Purpose | Data Type | Backup Strategy |
|--------|---------|-----------|-----------------|
| `gemba_config` | Configuration & reference data | Plants, areas, teams, workstations, users, roles, categories, shifts, operators | Daily full backup |
| `gemba` | Operational/production data | Issues, production entries, safety entries, Gemba walks, handover notes, audit log | Continuous WAL archiving + daily full |

---

## 6. Containerization & Deployment Strategy

### 6.1 Container Images

#### Frontend Container (`gemba-frontend`)

```dockerfile
# Multi-stage build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q --spider http://localhost/health || exit 1
```

#### Backend Container (`gemba-backend`)

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false
COPY . .
RUN npm run build
RUN npm prune --production

FROM node:22-alpine
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -q --spider http://localhost:3000/health || exit 1
CMD ["node", "dist/server.js"]
```

#### Database Container (`gemba-db`)

```dockerfile
FROM postgres:16-alpine
COPY init-scripts/ /docker-entrypoint-initdb.d/
EXPOSE 5432
```

### 6.2 Docker Compose (Development / Single-Site)

```yaml
version: "3.9"

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://gemba:${DB_PASSWORD}@db:5432/gemba
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRY: 15m
      REFRESH_TOKEN_EXPIRY: 7d
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 5s
      retries: 3

  db:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./db/init:/docker-entrypoint-initdb.d
    environment:
      POSTGRES_DB: gemba
      POSTGRES_USER: gemba
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U gemba"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data
    ports:
      - "6379:6379"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
  redisdata:
```

### 6.3 Kubernetes Manifests (Multi-Site / Cloud)

The following Kubernetes resources would be needed:

```
k8s/
├── namespace.yaml
├── secrets/
│   ├── db-credentials.yaml          (SealedSecret)
│   └── jwt-secret.yaml              (SealedSecret)
├── configmaps/
│   ├── backend-config.yaml
│   └── nginx-config.yaml
├── database/
│   ├── postgres-statefulset.yaml
│   ├── postgres-service.yaml
│   └── postgres-pvc.yaml
├── cache/
│   ├── redis-statefulset.yaml
│   └── redis-service.yaml
├── backend/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── hpa.yaml                     (Horizontal Pod Autoscaler)
├── frontend/
│   ├── deployment.yaml
│   └── service.yaml
├── ingress/
│   └── ingress.yaml                 (TLS termination)
└── monitoring/
    ├── servicemonitor.yaml           (Prometheus)
    └── grafana-dashboard.yaml
```

### 6.4 Cloud-Native Requirements Checklist

| Requirement | Implementation |
|-------------|---------------|
| **12-Factor App** | Config via env vars, stateless processes, port binding, disposability |
| **Health checks** | `/health` (liveness) and `/ready` (readiness) endpoints on all services |
| **Graceful shutdown** | SIGTERM handling with connection draining |
| **Horizontal scaling** | Stateless backend, sticky sessions only for WebSocket |
| **Secret management** | Kubernetes Secrets / HashiCorp Vault, never in images |
| **Log aggregation** | Structured JSON logging to stdout, collected by Fluentd/Loki |
| **Metrics** | Prometheus metrics endpoint `/metrics` on backend |
| **Tracing** | OpenTelemetry spans for API requests and DB queries |
| **TLS everywhere** | Ingress TLS termination, internal mTLS via service mesh (optional) |
| **Image security** | Non-root users, minimal base images (alpine), vulnerability scanning |
| **DB migrations** | Versioned migrations (node-pg-migrate / golang-migrate) run as init containers |
| **Backup/Restore** | Automated PG backups via CronJob + S3-compatible storage |
| **Rate limiting** | API gateway level (Traefik middleware or Express rate-limit) |

---

## 7. Implementation Plan

### Phase 1: Foundation (Project Scaffolding & Core Infrastructure)

**Objective**: Set up the project structure, build system, database, and authentication.

```
gemba-management-app/
├── gemba-management.html             # Original click dummy (preserved)
├── docker-compose.yaml
├── .env.example
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── nginx.conf
│   ├── public/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   ├── api/                      # API client (fetch wrapper)
│   │   ├── components/               # Shared UI components
│   │   ├── features/                 # Feature modules
│   │   │   ├── auth/
│   │   │   ├── issues/
│   │   │   ├── production/
│   │   │   ├── safety/
│   │   │   ├── gemba-walk/
│   │   │   ├── analytics/
│   │   │   ├── config/
│   │   │   └── handover/
│   │   ├── hooks/
│   │   ├── i18n/                     # Translation files
│   │   ├── stores/                   # State management
│   │   └── types/
│   └── tests/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── server.ts
│   │   ├── config.ts                 # Env var parsing
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── rbac.ts               # Role-based access
│   │   │   ├── validation.ts
│   │   │   ├── error-handler.ts
│   │   │   └── audit-log.ts
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── auth.routes.ts
│   │   │   ├── issues/
│   │   │   │   ├── issues.controller.ts
│   │   │   │   ├── issues.service.ts
│   │   │   │   ├── issues.routes.ts
│   │   │   │   └── issues.validation.ts
│   │   │   ├── production/
│   │   │   ├── safety/
│   │   │   ├── gemba-walk/
│   │   │   ├── analytics/
│   │   │   ├── config/
│   │   │   └── handover/
│   │   ├── db/
│   │   │   ├── connection.ts
│   │   │   └── migrations/
│   │   ├── ws/                       # WebSocket server
│   │   └── utils/
│   └── tests/
└── db/
    └── init/
        ├── 01-schemas.sql
        ├── 02-config-tables.sql
        ├── 03-data-tables.sql
        ├── 04-indexes.sql
        └── 05-seed-data.sql
```

**Deliverables:**
- Monorepo scaffolding with frontend + backend + db
- Docker Compose for local development
- PostgreSQL schema creation scripts
- User authentication (JWT + refresh tokens)
- Role-based middleware
- API health/readiness endpoints
- CI pipeline (lint, test, build, container image)

### Phase 2: Core Business Logic

**Objective**: Implement the primary feature modules.

**Deliverables:**
- Issue management CRUD + escalation + resolution
- Production data entry and retrieval
- Safety cross entries and statistics
- Configuration admin panel
- Frontend pages for all core views (L1, L2, L3)
- Input validation on all API endpoints
- Audit logging middleware

### Phase 3: Advanced Features

**Objective**: Implement Gemba walks, analytics, i18n, voice, and real-time.

**Deliverables:**
- Gemba walk 5-step process with state machine
- Analytics dashboard with aggregation queries
- AI assistant (full-text search + optional LLM integration)
- i18n with all 15 languages ported from prototype
- Voice input (browser-side, no backend needed)
- WebSocket server for real-time updates
- Shift handover notes

### Phase 4: Production Hardening

**Objective**: Make the system production-ready and deployable.

**Deliverables:**
- Kubernetes manifests (or Helm chart)
- Automated database migrations
- Structured JSON logging with correlation IDs
- Prometheus metrics + Grafana dashboards
- Rate limiting and request throttling
- Input sanitization audit (XSS, SQL injection prevention)
- Load testing with realistic manufacturing data volumes
- Backup and restore procedures
- Documentation (API docs via OpenAPI, runbooks)
- Offline/PWA support (service worker + sync queue)

### Phase 5: Multi-Site & Scale

**Objective**: Support multiple plants and enterprise features.

**Deliverables:**
- Multi-tenant data isolation (plant_id on all tables)
- OIDC/SSO integration (Keycloak or Azure AD)
- Cross-plant analytics
- Data retention policies
- Export capabilities (CSV, PDF reports)
- Mobile app wrapper (Capacitor/PWA)

---

## Appendix A: Data Flow Diagrams

### Issue Lifecycle

```
  Team Member              Area Leader             Plant Manager
  (Level 1)                (Level 2)               (Level 3)
      │                        │                       │
      │  CREATE issue           │                       │
      ├──────────────┐          │                       │
      │              ▼          │                       │
      │         ┌─────────┐    │                       │
      │         │  OPEN   │    │                       │
      │         │  (L1)   │    │                       │
      │         └────┬────┘    │                       │
      │              │         │                       │
      │   ESCALATE   │         │                       │
      ├──────────────┼────────►│                       │
      │              │         │                       │
      │         ┌────▼────┐    │                       │
      │         │ESCALATED│    │                       │
      │         │  (L2)   │    │                       │
      │         └────┬────┘    │                       │
      │              │         │  ESCALATE              │
      │              │         ├──────────────────────►│
      │              │         │                       │
      │         ┌────▼────┐    │                       │
      │         │ESCALATED│    │                       │
      │         │  (L3)   │    │                       │
      │         └────┬────┘    │                       │
      │              │         │                       │
      │              │    RESOLVE (any authorized level)│
      │              │         │                       │
      │         ┌────▼────┐    │                       │
      │         │RESOLVED │    │                       │
      │         │+ Impact │    │                       │
      │         └─────────┘    │                       │
```

### Production Data Flow

```
  Shopfloor           Backend API          PostgreSQL         Dashboard
      │                    │                   │                  │
      │ POST /production   │                   │                  │
      │ /entries           │                   │                  │
      ├───────────────────►│                   │                  │
      │                    │  INSERT INTO       │                  │
      │                    │  production_entries│                  │
      │                    ├──────────────────►│                  │
      │                    │                   │                  │
      │                    │  WebSocket:        │                  │
      │                    │  production:update │                  │
      │                    ├──────────────────────────────────────►│
      │                    │                   │                  │
      │                    │  GET /production  │                  │
      │                    │  /summary         │                  │
      │◄───────────────────┤◄─────────────────┤                  │
      │                    │  SELECT + AGG     │                  │
```

## Appendix B: Environment Variables

```bash
# Backend
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://gemba:password@db:5432/gemba
REDIS_URL=redis://redis:6379
JWT_SECRET=<random-256-bit-key>
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
LOG_LEVEL=info
CORS_ORIGIN=https://gemba.example.com

# Optional: LLM API for AI features
LLM_API_KEY=<api-key>
LLM_API_URL=https://api.anthropic.com/v1

# Frontend (build-time)
VITE_API_URL=/api/v1
VITE_WS_URL=wss://gemba.example.com/ws
```

## Appendix C: Security Considerations

| Threat | Mitigation |
|--------|------------|
| SQL Injection | Parameterized queries only (via ORM/query builder) |
| XSS | React auto-escaping + CSP headers |
| CSRF | SameSite cookies + CSRF tokens for state-changing ops |
| Brute force | Rate limiting on auth endpoints (5 attempts / 15 min) |
| Session hijacking | Secure, HttpOnly, SameSite cookies for refresh tokens |
| Data at rest | PostgreSQL TDE or volume encryption |
| Data in transit | TLS 1.3 everywhere |
| Privilege escalation | Server-side role checks on every request |
| Audit trail tampering | Append-only audit_log table, no UPDATE/DELETE permissions |
