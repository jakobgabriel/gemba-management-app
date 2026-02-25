---
title: Technology Stack
description: Technologies and tools used in the Gemba Management System.
---

## Application Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript | Single-page application |
| **Build Tool** | Vite 5 | Fast dev server and production builds |
| **UI Components** | Custom + CSS Modules | Responsive shopfloor-optimized UI |
| **Backend** | Node.js 20 + Express/Fastify | REST API + WebSocket server |
| **Database** | PostgreSQL 16 | Primary data store |
| **Cache** | Redis 7 | Session cache, real-time pub/sub |
| **Auth** | JWT + Refresh Tokens | Stateless authentication |
| **i18n** | i18next | 15-language internationalization |
| **Real-time** | Socket.IO | Live updates for production data and escalations |

## Infrastructure Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Container Runtime** | Docker | Application containerization |
| **Orchestration** | Kubernetes | Container orchestration and scaling |
| **Package Manager** | Helm 3 | Kubernetes manifest templating |
| **GitOps** | ArgoCD | Continuous delivery from Git |
| **Ingress** | NGINX Ingress Controller | TLS termination, routing |
| **Secrets** | Sealed Secrets | Encrypted secrets in Git |
| **CI/CD** | GitHub Actions | Build, test, and push images |

## Observability Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Metrics** | Prometheus | Metrics collection and alerting |
| **Dashboards** | Grafana | Visualization and monitoring |
| **Tracing** | OpenTelemetry | Distributed tracing |
| **Logging** | JSON structured logs | Machine-parseable log output |

## Development Tools

| Tool | Purpose |
|------|---------|
| **ESLint** | TypeScript/JavaScript linting |
| **Prettier** | Code formatting |
| **Vitest** | Unit and integration testing |
| **Playwright** | End-to-end testing |
| **Starlight** | Documentation site (this site) |
