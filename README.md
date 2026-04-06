<div align="center">
  <img width="81" height="59" alt="image" src="https://github.com/user-attachments/assets/db6e3457-68c6-4506-8295-61f29ce35d34" />
  <h1>Piggino</h1>
  <p><strong>Your smart, intuitive, and personal financial assistant.</strong></p>
  <p>A full-stack web application designed to simplify the management of expenses, income, credit cards, and financial goals.</p>
</div>

---

## About The Project

Piggino was born from the need for a financial tracking tool that combines a simple user experience with powerful features. More than just a spreadsheet, Piggino is a complete web application built on a modern, scalable, and production-ready architecture.

<img width="1365" height="694" alt="image" src="https://github.com/user-attachments/assets/c84cb398-f8ee-46cc-b215-e4399e4c18e7" />

### Core Features

- **Secure Authentication:** User registration and login using JWT (JSON Web Tokens).
- **Intuitive Dashboard:** A clear overview of financial health including balances, monthly income, and expenses.
- **Transaction Management:** Full CRUD for income and expense tracking, with support for installments, fixed bills, and recurrence. Transactions can optionally be linked to savings goals.
- **Custom Categories:** User-defined categories to organize transactions, with an optional titheable flag.
- **Financial Sources:** Register multiple sources such as bank accounts, wallets, and credit cards.
- **Invoice Management:** Credit card invoice tracking and management.
- **Savings Goals:** Define financial goals and track contributions automatically when a linked transaction is saved.
- **Debt Planning:** Avalanche and Snowball payoff strategies to plan debt elimination.
- **Tithe Module:** Optional 10% tithe calculation with configurable category and financial source.
- **Telegram Bot:** Multi-account Telegram integration for natural language transaction entry.
- **Wealth Projection:** CDI vs. Poupanca simulator with IR/IOF breakdown, automatically fetching the current CDI rate from the BACEN API.
- **50/30/20 Budget Analysis:** Budget breakdown by needs, wants, and savings buckets.

<img width="1085" height="594" alt="image" src="https://github.com/user-attachments/assets/ffd96684-e9b2-4723-a158-15135a6105cd" />

---

## Architecture & Tech Stack

Piggino follows Clean Architecture with a clear separation of concerns and Domain-Driven Design (DDD) principles.

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

[INSERT: Architecture diagram showing the flow from frontend to backend to database, with Caddy as reverse proxy and GitHub Actions CI/CD]

### Technology Stack

| Category | Technology |
| :--- | :--- |
| **Backend** | ASP.NET 9, C#, Entity Framework Core, PostgreSQL |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Axios, PWA (vite-plugin-pwa) |
| **Infra & DevOps** | .NET Aspire, Docker, Caddy, Digital Ocean, GitHub Actions |
| **Authentication** | JWT (JSON Web Tokens) |

### Key Architectural Decisions

- **Backend API (ASP.NET 9):** RESTful API following DDD with Controllers, Services, and Repositories. Controllers handle HTTP concerns only; all business logic lives in Services.
- **Frontend SPA (React 19):** Single-Page Application with TypeScript strict mode. API calls are isolated inside custom hooks or service modules — never directly in components. Installable as a PWA.
- **Database (PostgreSQL):** Managed via Entity Framework Core with code-first migrations. Migrations are always generated via `dotnet ef migrations add`, never written manually.
- **Reverse Proxy (Caddy):** Routes all traffic to the appropriate service and automates SSL/TLS certificate provisioning.
- **CI/CD (GitHub Actions):** Every merge to `main` triggers a pipeline that builds Docker images, pushes them to Docker Hub, and deploys to production with zero downtime.

---

## Modules

| Module | Description |
|--------|-------------|
| Transactions | Income/expense with installments, fixed bills, recurrence, and optional Goal link |
| Categories | User-defined categories with titheable flag |
| Financial Sources | Bank accounts, wallets, credit cards |
| Invoice | Credit card invoice management |
| Goals | Savings goals with automatic contribution tracking |
| Debt Planning | Avalanche and Snowball payoff strategies |
| Tithe | Optional 10% tithe module with configurable category and financial source |
| Telegram Bot | Multi-account Telegram integration for natural language transaction entry |
| Wealth Projection | CDI vs Poupanca simulator with IR/IOF breakdown, auto-fetches rate from BACEN |
| 50/30/20 | Budget analysis by needs, wants, and savings buckets |

---

## Branching Strategy

This project follows a GitFlow-like branching model:

- `main`: Stable, production-ready code. Only accepts merges from `develop`. Every merge triggers the deployment pipeline.
- `develop`: Integration branch where all features are merged before release.
- `feature/<name>`: Short-lived branches created from `develop` to build new features in isolation.
- `fix/<name>`: Bug fix branches.

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.

---

## Author

**Gabriel Borges**

- [GitHub](https://github.com/bielborgesc)
- [LinkedIn](https://www.linkedin.com/in/bielborgesc/)
