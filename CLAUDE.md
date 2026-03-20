# Piggino — Claude Code Project Guide

## Project Summary

Piggino is a full-stack personal finance tracker.
- **Backend:** ASP.NET 8 · C# · EF Core · SQLite · JWT
- **Frontend:** React 19 · TypeScript · Vite · Tailwind CSS · Axios
- **Infra:** Docker · Docker Compose · Caddy · GitHub Actions

---

## Architecture

```
backend/
  Controllers/     → HTTP only, no business logic
  Services/        → All business logic lives here
  Repositories/    → All data access via EF Core
  Domain/          → Models, Entities, Enums
  DTOs/            → Request/Response objects for the API

frontend/
  src/
    components/    → Reusable UI components (one concern each)
    pages/         → Page-level components
    hooks/         → Custom React hooks (API calls go here)
    services/      → Axios API service layer
    types/         → TypeScript interfaces and types
```

---

## Code Rules

- **Language:** All code, names, and comments in English
- **No any in TypeScript** — always type explicitly
- **No business logic in Controllers or Components**
- **No raw EF queries in Services** — always go through Repositories
- **No inline styles** — Tailwind classes only
- **Guard clauses over nested ifs** — fail fast, return early
- **No magic strings/numbers** — use constants or enums

---

## Commit Convention

```
<type>(<scope>): <description>
```

| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code improvement, no behavior change |
| `chore` | Config, tooling, dependencies |
| `docs` | Documentation only |
| `test` | Adding or fixing tests |
| `style` | Formatting, no logic change |
| `perf` | Performance improvement |

**Examples:**
```
feat(auth): add refresh token support
fix(dashboard): correct balance calculation for installments
refactor(transactions): extract pagination logic to base repository
chore(ci): add docker layer caching to GitHub Actions
```

---

## Branching

- `main` → production, merge from develop only
- `develop` → integration, all features merge here
- `feature/<name>` → new work
- `fix/<name>` → bug fixes

---

## Agent

Use the **piggino-mentor** agent for all development tasks.
It follows Clean Code, Clean Architecture, SOLID, and Design Patterns,
and explains every change to help you learn.
