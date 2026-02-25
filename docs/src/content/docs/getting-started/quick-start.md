---
title: Quick Start
description: Get the Gemba Management System running locally in minutes.
---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) v20.10+
- [Docker Compose](https://docs.docker.com/compose/install/) v2.0+
- [Node.js](https://nodejs.org/) v20+ (for local development)

## Option 1: Docker Compose (Recommended)

The fastest way to run the full stack locally:

```bash
# Clone the repository
git clone https://github.com/jakobgabriel/gemba-management-app.git
cd gemba-management-app

# Start all services
docker compose up -d

# View the application
open http://localhost:8080
```

This starts:
- **Frontend** on port `8080`
- **Backend API** on port `3000`
- **PostgreSQL** on port `5432`
- **Redis** on port `6379`

## Option 2: Local Development

For active development with hot-reload:

```bash
# Clone the repository
git clone https://github.com/jakobgabriel/gemba-management-app.git
cd gemba-management-app

# Install dependencies
npm install

# Start development server
npm run dev
```

## Option 3: Prototype Only

To view the click-dummy prototype (no backend required):

```bash
# Simply open the HTML file in a browser
open gemba-management.html
```

This runs the self-contained prototype with all UI features but no persistent backend.

## Verify Installation

Once running, navigate to `http://localhost:8080` and:

1. Select a role (Team Member, Area Leader, Plant Manager, or Admin)
2. Log in with the default credentials
3. Explore the dashboard

## Building the Documentation

To build and serve this documentation site locally:

```bash
cd docs
npm install
npm run dev
```

The docs will be available at `http://localhost:4321`.

## Next Steps

- [Architecture Overview](/architecture/overview/) — Understand how the system is built
- [Configuration](/guides/configuration/) — Customize the application settings
- [Kubernetes Deployment](/deployment/kubernetes/) — Deploy to a cluster
