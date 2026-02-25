---
title: Configuration
description: Configure the Gemba Management System for your environment.
---

## Environment Variables

All application configuration is managed via environment variables, following the [12-factor app](https://12factor.net/config) methodology.

### Backend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `REDIS_URL` | Yes | — | Redis connection string |
| `JWT_SECRET` | Yes | — | Secret key for JWT signing (min 32 chars) |
| `JWT_EXPIRES_IN` | No | `15m` | Access token expiry |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token expiry |
| `PORT` | No | `3000` | API server port |
| `NODE_ENV` | No | `production` | Runtime environment |
| `LOG_LEVEL` | No | `info` | Logging level (`debug`, `info`, `warn`, `error`) |
| `CORS_ORIGIN` | No | `*` | Allowed CORS origins (comma-separated) |
| `RATE_LIMIT_WINDOW` | No | `900000` | Rate limit window in ms (15 min) |
| `RATE_LIMIT_MAX` | No | `100` | Max requests per window |
| `AUTH_RATE_LIMIT_MAX` | No | `5` | Max auth attempts per window |

### Frontend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | Yes | — | Backend API base URL |
| `VITE_WS_URL` | No | — | WebSocket server URL |
| `VITE_DEFAULT_LOCALE` | No | `en` | Default UI language |

## Helm Values

Override defaults in your `values.yaml` or pass `--set` flags:

```yaml
# Custom values example
image:
  tag: "v1.2.0"

ingress:
  hosts:
    - host: gemba.mycompany.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: gemba-tls
      hosts:
        - gemba.mycompany.com

config:
  defaultLocale: "de"
  logLevel: "debug"

resources:
  requests:
    cpu: 200m
    memory: 256Mi
  limits:
    cpu: "1"
    memory: 512Mi
```

## Secrets Management

Sensitive values should never be committed to Git in plain text. Use one of:

### Kubernetes Secrets

```bash
kubectl create secret generic gemba-secrets \
  --namespace gemba \
  --from-literal=DATABASE_URL='postgresql://user:pass@host:5432/gemba' \
  --from-literal=JWT_SECRET='your-secret-key-here' \
  --from-literal=REDIS_URL='redis://cache:6379'
```

### Sealed Secrets (Recommended for GitOps)

```bash
# Install kubeseal CLI
# Create a sealed secret
kubeseal --format yaml < secret.yaml > sealed-secret.yaml

# Commit the sealed secret (safe to store in Git)
git add sealed-secret.yaml
git commit -m "Add sealed database credentials"
```

## Multi-Plant Configuration

The system supports multi-tenant deployments. Each plant is configured in the database:

```sql
INSERT INTO gemba_config.plants (name, code, timezone, locale)
VALUES
  ('Munich Plant', 'MUC', 'Europe/Berlin', 'de'),
  ('Detroit Plant', 'DTW', 'America/Detroit', 'en'),
  ('Shanghai Plant', 'SHA', 'Asia/Shanghai', 'zh');
```
