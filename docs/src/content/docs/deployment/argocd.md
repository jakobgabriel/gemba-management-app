---
title: ArgoCD Deployment
description: Set up GitOps continuous delivery for the Gemba Management System with ArgoCD.
---

## Overview

The Gemba Management System uses [ArgoCD](https://argo-cd.readthedocs.io/) for GitOps-based continuous delivery. All application and infrastructure configuration lives in Git, and ArgoCD ensures the cluster state matches the desired state in the repository.

### How It Works

```
Developer pushes code
        │
        ▼
GitHub Actions CI ──► Build & push container image
        │
        ▼
Update image tag in Helm values
        │
        ▼
ArgoCD detects change ──► Syncs to Kubernetes cluster
```

## Prerequisites

- ArgoCD installed on your Kubernetes cluster ([installation guide](https://argo-cd.readthedocs.io/en/stable/getting_started/))
- Access to the ArgoCD UI or CLI
- Helm chart in `helm/gemba-management/`

## ArgoCD Application Manifest

The ArgoCD Application resource is defined in `argocd/application.yaml`:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: gemba-management
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: default
  source:
    repoURL: https://github.com/jakobgabriel/gemba-management-app.git
    targetRevision: main
    path: helm/gemba-management
    helm:
      valueFiles:
        - values.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: gemba
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
      - ServerSideApply=true
```

## Installation

### Step 1: Install ArgoCD (if not already installed)

```bash
kubectl create namespace argocd
kubectl apply -n argocd \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

### Step 2: Apply the Application manifest

```bash
kubectl apply -f argocd/application.yaml
```

### Step 3: Verify

```bash
# Using ArgoCD CLI
argocd app get gemba-management

# Or check via kubectl
kubectl get applications -n argocd
```

## Sync Policies

The application is configured with:

| Policy | Value | Description |
|--------|-------|-------------|
| **Automated sync** | `true` | Auto-deploy when Git changes |
| **Prune** | `true` | Remove resources deleted from Git |
| **Self-heal** | `true` | Revert manual cluster changes |
| **Create namespace** | `true` | Auto-create target namespace |
| **Server-side apply** | `true` | Handle large CRDs properly |

## Multi-Environment Setup

For staging and production environments, create separate Application resources:

```yaml
# argocd/application-staging.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: gemba-management-staging
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/jakobgabriel/gemba-management-app.git
    targetRevision: develop
    path: helm/gemba-management
    helm:
      valueFiles:
        - values.yaml
        - values-staging.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: gemba-staging
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

## Image Update Automation

To automatically update the image tag when new images are pushed, use the [ArgoCD Image Updater](https://argocd-image-updater.readthedocs.io/):

```yaml
# Add annotation to the Application
metadata:
  annotations:
    argocd-image-updater.argoproj.io/image-list: >-
      app=ghcr.io/jakobgabriel/gemba-management-app
    argocd-image-updater.argoproj.io/app.update-strategy: semver
    argocd-image-updater.argoproj.io/app.helm.image-name: image.repository
    argocd-image-updater.argoproj.io/app.helm.image-tag: image.tag
```

## Troubleshooting

### Application stuck in "Progressing"

```bash
# Check pod status
kubectl get pods -n gemba

# Check events
kubectl get events -n gemba --sort-by='.lastTimestamp'

# Check ArgoCD logs
kubectl logs -n argocd deployment/argocd-application-controller
```

### Sync failed

```bash
# View sync details
argocd app sync gemba-management --dry-run

# Force sync
argocd app sync gemba-management --force
```

## Next Steps

- [Configuration Guide](/guides/configuration/) — Customize settings per environment
- [Contributing](/guides/contributing/) — How to contribute to the project
