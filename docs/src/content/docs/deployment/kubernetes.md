---
title: Kubernetes Deployment
description: Deploy the Gemba Management System to Kubernetes using Helm.
---

## Prerequisites

- Kubernetes cluster v1.28+
- [Helm](https://helm.sh/docs/intro/install/) v3.14+
- [kubectl](https://kubernetes.io/docs/tasks/tools/) configured for your cluster
- Container registry with pushed images

## Helm Chart

The application ships with a Helm chart at `helm/gemba-management/`.

### Install

```bash
# Add the namespace
kubectl create namespace gemba

# Install with default values
helm install gemba-management helm/gemba-management/ \
  --namespace gemba

# Install with custom values
helm install gemba-management helm/gemba-management/ \
  --namespace gemba \
  --values my-values.yaml
```

### Upgrade

```bash
helm upgrade gemba-management helm/gemba-management/ \
  --namespace gemba \
  --values my-values.yaml
```

### Uninstall

```bash
helm uninstall gemba-management --namespace gemba
```

## Key Configuration Values

```yaml
# helm/gemba-management/values.yaml

replicaCount: 2

image:
  repository: ghcr.io/jakobgabriel/gemba-management-app
  tag: latest
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 8080

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: gemba.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: gemba-tls
      hosts:
        - gemba.example.com

resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 256Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80

postgresql:
  enabled: true
  auth:
    database: gemba
    username: gemba
    existingSecret: gemba-db-credentials

redis:
  enabled: true
```

## Kubernetes Resources

The Helm chart creates the following resources:

| Resource | Name | Description |
|----------|------|-------------|
| Namespace | `gemba` | Isolated namespace for all resources |
| Deployment | `gemba-frontend` | Frontend SPA served via nginx |
| Deployment | `gemba-backend` | Backend API server |
| Service | `gemba-frontend` | ClusterIP service for frontend |
| Service | `gemba-backend` | ClusterIP service for backend |
| Ingress | `gemba-ingress` | External access with TLS |
| ConfigMap | `gemba-config` | Non-sensitive configuration |
| Secret | `gemba-secrets` | Database credentials, JWT secret |
| HPA | `gemba-backend` | Auto-scaling for backend pods |
| PVC | `gemba-postgresql` | Persistent storage for PostgreSQL |
| PVC | `gemba-redis` | Persistent storage for Redis |

## Monitoring

The Helm chart includes optional Prometheus ServiceMonitor:

```yaml
# Enable in values.yaml
metrics:
  enabled: true
  serviceMonitor:
    enabled: true
    interval: 30s
```

## Next Steps

- [ArgoCD Deployment](/deployment/argocd/) — Automate deployments with GitOps
- [Configuration Guide](/guides/configuration/) — Customize application settings
