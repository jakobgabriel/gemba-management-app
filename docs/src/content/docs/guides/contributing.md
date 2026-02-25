---
title: Contributing
description: How to contribute to the Gemba Management System.
---

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Create a feature branch from `main`
4. Make your changes
5. Submit a pull request

## Development Setup

```bash
# Clone the repository
git clone https://github.com/<your-username>/gemba-management-app.git
cd gemba-management-app

# Install dependencies
npm install

# Start development servers
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Branch Naming

Use descriptive branch names:

- `feature/issue-attachments` — New features
- `fix/production-data-validation` — Bug fixes
- `docs/argocd-setup-guide` — Documentation changes
- `refactor/auth-middleware` — Code refactoring

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add image attachment support for issues
fix: correct production target calculation for night shift
docs: add ArgoCD deployment guide
refactor: extract auth middleware into separate module
test: add integration tests for safety cross API
```

## Pull Request Process

1. Ensure all tests pass
2. Update documentation if needed
3. Add a description of the changes and why they are needed
4. Request review from a maintainer
5. Address review feedback

## Code Style

- TypeScript strict mode enabled
- ESLint + Prettier for formatting
- Meaningful variable and function names
- Keep functions focused and small

## Documentation

This documentation site is built with [Starlight](https://starlight.astro.build/). To update docs:

```bash
cd docs
npm run dev    # Preview at localhost:4321
npm run build  # Build for production
```

Documentation source files are in `docs/src/content/docs/`.
