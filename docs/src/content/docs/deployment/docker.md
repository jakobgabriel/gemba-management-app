---
title: Docker Deployment
description: Build and run the Gemba Management System with Docker.
---

## Dockerfile

The application uses a multi-stage Docker build for minimal image size:

```dockerfile
# Located at: Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

## Docker Compose

For local development, use Docker Compose to run all services:

```yaml
# Located at: docker-compose.yml
services:
  frontend:
    build: .
    ports:
      - "8080:8080"
    depends_on:
      - backend

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://gemba:gemba@db:5432/gemba
      REDIS_URL: redis://cache:6379
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: gemba
      POSTGRES_USER: gemba
      POSTGRES_PASSWORD: gemba
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U gemba"]
      interval: 5s
      timeout: 3s
      retries: 5

  cache:
    image: redis:7-alpine
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

## Building Images

```bash
# Build the frontend image
docker build -t gemba-management:latest .

# Build with a specific tag
docker build -t gemba-management:v1.0.0 .

# Run standalone
docker run -p 8080:8080 gemba-management:latest
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | PostgreSQL connection string |
| `REDIS_URL` | — | Redis connection string |
| `JWT_SECRET` | — | Secret for JWT token signing |
| `PORT` | `3000` | Backend API port |
| `NODE_ENV` | `production` | Runtime environment |
| `LOG_LEVEL` | `info` | Logging verbosity |
| `CORS_ORIGIN` | `*` | Allowed CORS origins |

## Health Checks

The backend exposes health check endpoints:

- `GET /healthz` — Liveness probe (is the process running?)
- `GET /readyz` — Readiness probe (are dependencies connected?)

## Next Steps

- [Kubernetes Deployment](/deployment/kubernetes/) — Deploy to a K8s cluster
- [ArgoCD](/deployment/argocd/) — Set up GitOps continuous delivery
