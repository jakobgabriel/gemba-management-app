---
title: Architecture Overview
description: High-level architecture of the Gemba Management System.
---

## Design Principles

The Gemba Management System follows these architectural principles:

- **Cloud-native** — Containerized, orchestrated, observable
- **12-factor app** — Configuration via environment, stateless processes, disposable containers
- **Modular monolith** — Single deployable unit with clear bounded contexts, ready for future decomposition
- **GitOps** — Infrastructure and application state managed via Git with ArgoCD

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Ingress (NGINX)                   │
│                  TLS Termination                     │
└────────────┬────────────────────┬───────────────────┘
             │                    │
     ┌───────▼───────┐   ┌───────▼───────┐
     │   Frontend    │   │   Backend     │
     │  React + Vite │   │  Node.js API  │
     │  (nginx)      │   │  + WebSocket  │
     └───────────────┘   └───┬───────┬───┘
                             │       │
                     ┌───────▼──┐ ┌──▼───────┐
                     │PostgreSQL│ │  Redis    │
                     │  16      │ │  7        │
                     └──────────┘ └──────────┘
```

## Bounded Contexts

The system is organized into seven bounded contexts:

| Context | Responsibility |
|---------|---------------|
| **Identity & Access** | Authentication, authorization, RBAC, user management |
| **Production Tracking** | Hourly production data entry, workstation management |
| **Issue Management** | Issue lifecycle, escalation workflow (L1→L2→L3) |
| **Safety Management** | Safety cross entries, accident tracking, shift safety |
| **Gemba Walk** | Structured observations, SQDCP scoring, findings |
| **Configuration** | Plants, areas, teams, workstations, categories, shifts |
| **Analytics** | Dashboards, trend analysis, AI-assisted queries |

## Data Flow

### Issue Lifecycle

```
Team Member (L1)          Area Leader (L2)         Plant Manager (L3)
     │                          │                         │
     ├── Create Issue ──────────┤                         │
     │                          ├── Escalate to L3 ───────┤
     │                          │                         ├── Resolve
     │                          ├── Resolve               │
     ├── Resolve                │                         │
```

### Production Data Flow

```
Operator → Hourly Entry → Workstation Record → Area Summary → Plant Dashboard
```

## Deployment Model

The application is deployed as a set of Kubernetes resources managed by ArgoCD:

- **Helm chart** in `helm/gemba-management/` defines all resources
- **ArgoCD Application** in `argocd/` points to the Helm chart
- Changes merged to `main` trigger automatic sync

See [ArgoCD Deployment](/deployment/argocd/) for details.
