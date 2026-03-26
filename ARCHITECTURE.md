# Piggino — Architecture Documentation

> Complete technical reference for the Piggino personal finance tracker.
> A developer who has never seen this codebase should be able to understand the full system from this document alone.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Infrastructure & Deployment](#3-infrastructure--deployment)
4. [Backend Architecture](#4-backend-architecture)
5. [Domain Modules](#5-domain-modules)
6. [Database Schema](#6-database-schema)
7. [API Reference](#7-api-reference)
8. [Authentication & Security](#8-authentication--security)
9. [Frontend Architecture](#9-frontend-architecture)
10. [Telegram Bot](#10-telegram-bot)
11. [Data Flows (End-to-End)](#11-data-flows-end-to-end)
12. [Enums & Constants](#12-enums--constants)
13. [Environment Variables](#13-environment-variables)
14. [Local Development](#14-local-development)

---

## 1. System Overview

Piggino is a **multi-user personal finance tracker** with the following capabilities:

| Capability | Description |
|---|---|
| Transactions | Income/expense with installments, fixed bills, recurrence groups |
| Categories | User-defined, color-coded, with 50/30/20 bucket tagging |
| Financial Sources | Bank accounts, wallets, credit cards |
| Invoices | Credit card invoice management and bulk payment |
| Goals | Savings goals with contribution tracking and progress |
| Debt Planning | Avalanche and Snowball payoff strategy visualizer |
| Tithe Module | Optional 10% tithe — auto-generates tithe transactions monthly |
| 50/30/20 Budget | Budget analysis split by Needs / Wants / Savings |
| Health Score | Composite 0–100 financial health score with grades |
| Wealth Projection | CDI vs Poupança simulator, auto-fetches SELIC from BACEN |
| Telegram Bot | Natural language transaction entry via Gemini AI |
| Contextual Tips | AI-generated financial tips based on user behavior |

**Tech stack at a glance:**

```
Backend   → ASP.NET 9 · C# · EF Core · PostgreSQL · JWT
Frontend  → React 19 · TypeScript · Vite · Tailwind CSS · PWA
Bot       → Node.js · TypeScript · grammy · Gemini 1.5 Flash
Infra     → Docker Compose · Caddy · GitHub Actions · .NET Aspire (dev only)
```

---

## 2. High-Level Architecture

```
                        Internet
                           │
                    ┌──────▼──────┐
                    │    Caddy    │  :80 / :443  (TLS auto via Let's Encrypt)
                    │ Reverse Proxy│
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │                         │
        /api/*│                         │  /*
   ┌──────────▼──────────┐   ┌──────────▼──────────┐
   │   piggino-api        │   │  piggino-frontend    │
   │  ASP.NET 9 · :8080  │   │  Nginx · :80         │
   │  REST API + JWT      │   │  React SPA           │
   └──────────┬──────────┘   └─────────────────────┘
              │
   ┌──────────▼──────────┐
   │   piggino-postgres   │
   │   PostgreSQL 16      │
   └─────────────────────┘

   ┌─────────────────────┐        ┌─────────────────────┐
   │   piggino-bot        │──────▶│   Telegram Servers  │
   │  Node.js · grammy    │        └─────────────────────┘
   │  Gemini 1.5 Flash    │
   └──────────┬──────────┘
              │  X-Bot-Secret header
              ▼
        piggino-api  (Bot endpoints)
```

All five containers run on the `piggino-net` Docker bridge network. Only Caddy exposes ports to the outside world.

---

## 3. Infrastructure & Deployment

### 3.1 Container Topology

```
docker-compose.yml
│
├── piggino-postgres   (postgres:16-alpine)
│     volumes: pgdata → /var/lib/postgresql/data
│     healthcheck: pg_isready
│
├── piggino-api        (custom image)
│     depends_on: piggino-postgres [healthy]
│     env: ConnectionStrings__DefaultConnection, Jwt__*, BotSettings__Secret
│     healthcheck: curl /api/health
│     volumes: dataprotection → /root/.aspnet/DataProtection-Keys
│
├── piggino-frontend   (custom image — nginx)
│     depends_on: piggino-api
│
├── piggino-bot        (custom image — node)
│     depends_on: piggino-api [healthy]
│     env: TELEGRAM_BOT_TOKEN, GEMINI_API_KEY, BOT_SECRET, API_URL
│
└── caddy              (caddy:2-alpine)
      ports: 80, 443
      volumes: caddy_data, caddy_config, ./caddy/Caddyfile
```

### 3.2 Reverse Proxy (Caddyfile)

```
piggino.duckdns.org {
    reverse_proxy /api/* piggino-api:8080
    reverse_proxy piggino-frontend:80
}
```

Caddy handles automatic HTTPS — no manual certificate management needed.

### 3.3 CI/CD Pipeline (GitHub Actions)

File: `.github/workflows/deploy.yml`

```
Push to main
     │
     ├─── Job 1: build-backend
     │         dotnet restore + dotnet build (validation only)
     │
     ├─── Job 2: build-bot
     │         npm install + npm run build (validation only)
     │
     ├─── Job 3: build-and-push  (needs: build-backend, build-bot)
     │         docker build + push → Docker Hub
     │         Images: piggino-api:latest, piggino-frontend:latest
     │
     └─── Job 4: deploy  (needs: build-and-push)
               SSH into Digital Ocean droplet
               git pull
               inject env secrets via shell export
               docker compose up -d --build
               Poll https://piggino.duckdns.org/api/health
               (12 attempts × 10s = 2 minutes max)
```

**Required GitHub Secrets:**

| Secret | Used by |
|---|---|
| `DOCKERHUB_USERNAME` / `DOCKERHUB_TOKEN` | Image push |
| `SSH_HOST` / `SSH_USER` / `SSH_PRIVATE_KEY` | Deploy |
| `POSTGRES_PASSWORD` | Database |
| `JWT_KEY` | Backend auth |
| `TELEGRAM_BOT_TOKEN` | Bot |
| `GEMINI_API_KEY` | Bot AI |
| `BOT_SECRET` | API ↔ Bot auth |

### 3.4 Backend Dockerfile (multi-stage)

```
Stage 1: mcr.microsoft.com/dotnet/sdk:9.0
  → dotnet restore
  → dotnet publish -c Release

Stage 2: mcr.microsoft.com/dotnet/aspnet:9.0
  → apt-get install curl  (needed for Docker healthcheck)
  → COPY from stage 1
  → ENTRYPOINT dotnet Piggino.Api.dll
```

### 3.5 Frontend Dockerfile (multi-stage)

```
Stage 1: node:20-alpine
  → npm ci
  → npm run build  (Vite → dist/)

Stage 2: nginx:alpine
  → COPY dist/ → /usr/share/nginx/html
  → COPY nginx.conf
```

### 3.6 Local Development (.NET Aspire)

Used **only in development**. Never deployed.

```csharp
// Piggino.AppHost/AppHost.cs
var postgres = builder.AddPostgres("postgres")
    .WithDataVolume()
    .AddDatabase("piggino-db");

var api = builder.AddProject<Piggino_Api>("piggino-api")
    .WithReference(postgres);

builder.AddNpmApp("frontend", "../frontend")
    .WithReference(api);
```

Aspire provides the Aspire Dashboard for local observability (logs, traces, metrics).

---

## 4. Backend Architecture

### 4.1 Folder Structure

```
backend/
├── Piggino.sln
├── Piggino.Api/
│   ├── Controllers/          → HTTP only — no business logic
│   ├── Data/
│   │   └── PigginoDbContext.cs
│   ├── Domain/               → Feature modules (see §5)
│   │   ├── Bot/
│   │   ├── CardInstallments/
│   │   ├── Categories/
│   │   ├── FinancialSources/
│   │   ├── Goals/
│   │   ├── Tithe/
│   │   ├── Transactions/
│   │   └── Users/
│   ├── Enum/                 → All enumerations
│   ├── Helpers/              → PasswordHelper, PasswordComplexityAttribute
│   ├── Infrastructure/
│   │   ├── BackgroundServices/   → TitheMonthlyBackgroundService
│   │   ├── Localization/         → MessageProvider, Messages.resx (en/es/pt-BR)
│   │   └── Repositories/         → EF Core implementations
│   ├── Migrations/
│   ├── Resources/
│   ├── Settings/             → JwtSettings, BotSettings (bound from config)
│   ├── appsettings.json
│   └── Program.cs
├── Piggino.AppHost/          → .NET Aspire (dev only)
├── Piggino.ServiceDefaults/  → Aspire service defaults
└── Piggino.Api.Tests/
    ├── IntegrationTests/
    └── UnitTests/
```

### 4.2 Layered Architecture

```
HTTP Request
     │
     ▼
┌─────────────┐
│ Controller  │  Validates HTTP, extracts UserId from JWT claim,
│             │  calls Service, returns HTTP result
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Service   │  All business logic lives here.
│             │  Calls Repository for data access.
│             │  Throws exceptions for invalid states.
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Repository  │  All EF Core queries live here.
│             │  Services never touch DbContext directly.
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  PostgreSQL │
└─────────────┘
```

### 4.3 Dependency Injection (Program.cs)

```
Services registered:
  ITokenService       → TokenService
  IUserService        → UserService
  IUserRepository     → UserRepository
  ICategoryService    → CategoryService
  ICategoryRepository → CategoryRepository
  IFinancialSourceService → FinancialSourceService
  IFinancialSourceRepository → FinancialSourceRepository
  ITransactionService → TransactionService
  ITransactionRepository → TransactionRepository
  IGoalService        → GoalService
  IGoalRepository     → GoalRepository
  ITitheService       → TitheService
  ITitheRepository    → TitheRepository
  IBotService         → BotService
  IBotRepository      → BotRepository

Background Services:
  TitheMonthlyBackgroundService  (IHostedService)

Config bound:
  JwtSettings   ← "Jwt" section
  BotSettings   ← "BotSettings" section

Auth:
  JWT Bearer with Issuer + Audience validation
  CORS: allows all origins (configured for SPA)
```

### 4.4 Background Service

`TitheMonthlyBackgroundService` runs continuously in the background. On startup and at every midnight of the 1st of each month, it calls `TitheService.GenerateMonthlyTitheForAllEnabledUsersAsync()`, which creates tithe expense transactions (10%) for all users with `IsTitheModuleEnabled = true` and at least one titheable income category with income that month.

---

## 5. Domain Modules

Each module follows the same internal structure:

```
Domain/<Module>/
├── Dtos/         → Request/Response objects
├── Entities/     → EF Core entity class
├── Interfaces/   → IService, IRepository
└── Services/     → Business logic implementation
```

Repositories live in `Infrastructure/Repositories/` to keep EF Core out of the Domain layer.

### 5.1 Users Module

**Entity: User**

| Field | Type | Notes |
|---|---|---|
| Id | Guid | PK, auto-generated |
| Name | string (max 100) | |
| Email | string (max 150) | Unique index |
| PasswordHash | byte[] | HMACSHA512 digest |
| PasswordSalt | byte[] | HMACSHA512 key |
| CreatedAt | DateTime | UTC |
| RefreshToken | string? | Server-side refresh token |
| RefreshTokenExpiry | DateTime? | 7-day expiry |
| PasswordResetToken | string? | Single-use, 1-hour expiry |
| PasswordResetTokenExpiry | DateTime? | |
| Is503020Enabled | bool | Feature flag for 50/30/20 module |
| IsTitheModuleEnabled | bool | Feature flag for tithe module |
| TitheCategoryId | int? | FK → Category (target for tithe expenses) |
| TitheFinancialSourceId | int? | FK → FinancialSource (source for tithe) |
| TelegramLinkToken | string? | 15-minute linking token |
| TelegramLinkTokenExpiry | DateTime? | |

**Service responsibilities:**
- User registration with password hashing (HMACSHA512)
- Login: validates hash, calls `IssueTokenPairAsync`
- Password: change, forgot (generates reset token), reset (validates token, rehashes)
- Settings: toggle 50/30/20, configure tithe category/source
- Refresh tokens: generate, validate, clear on logout/password change

### 5.2 Transactions Module

The most complex module. A single `Transaction` entity models multiple real-world behaviors via flags:

```
Transaction
├── IsFixed = true     → Recurring monthly fixed bill (rent, subscriptions)
│     └── DayOfMonth  → The day it falls due each month
│     └── FixedTransactionPayments → Per-month paid/unpaid tracking
│
├── IsInstallment = true → Credit card installment purchase
│     └── InstallmentCount  → Total number of installments
│     └── CardInstallments  → One row per installment with due date and paid status
│
├── IsRecurring = true → Part of a recurrence group
│     └── Description + TransactionType + IsFixed = group key
│
└── Regular transaction → Standard one-time income/expense
```

**Virtual row projection:** When listing transactions, the service "projects" fixed and installment transactions into virtual rows per month — the database stores one row, but the API returns many virtual rows for the UI to display correctly.

**Recurrence scopes** (for update/delete on recurring groups):

| Scope | Effect |
|---|---|
| `OnlyThis` | Affects only the selected transaction |
| `ThisAndFuture` | Affects this + all future occurrences |
| `ThisAndPast` | Affects this + all past occurrences |
| `All` | Affects the entire recurrence group |

**Tithe integration:** Every time a titheable income transaction is created, updated, or deleted, `TitheService.RecalculateTitheForCategoryAsync` is called to keep tithe transactions in sync.

**Goal integration:** When a transaction is created with a `GoalId`, the service calls `GoalService.ApplyGoalContributionAsync` to increment `Goal.CurrentAmount`.

### 5.3 Categories Module

Simple CRUD scoped to `UserId`. Key fields:

| Field | Purpose |
|---|---|
| Color | Hex color (e.g. `#ef4444`) — used in charts |
| BudgetBucket | `None / Needs / Wants / Savings` — 50/30/20 grouping |
| IsTitheable | If true, income in this category generates a 10% tithe expense |
| Type | `Income` or `Expense` |

Delete is blocked if any transaction references the category.

### 5.4 Financial Sources Module

Represents where money comes from or goes to.

| Type | Fields |
|---|---|
| `Card` | Name, ClosingDay, DueDay — used for invoice management |
| `Account` | Name only |
| `Cash` | Name only |

Delete is blocked if any transaction references the source.

### 5.5 Goals Module

Savings goals with progress tracking.

| Field | Notes |
|---|---|
| TargetAmount | Goal target |
| CurrentAmount | Running total (incremented via contributions) |
| IsCompleted | Auto-set when CurrentAmount >= TargetAmount |
| Type | EmergencyFund / Savings / Investment / Debt / Travel / Custom |
| ProgressPercentage | Computed: (CurrentAmount / TargetAmount) × 100 |
| MonthsToGoal | Computed from recent contribution average |

Transactions can be linked to a Goal via `GoalId`. When created, `CurrentAmount` is incremented by the transaction amount.

### 5.6 Tithe Module

Optional module — disabled by default per user.

**Flow:**
```
User enables tithe → sets TitheCategoryId + TitheFinancialSourceId
     │
     ▼
Every income transaction in a "titheable" category
     │
     ▼
TitheService.RecalculateTitheForCategoryAsync
     │  (called automatically on every income mutation)
     ├── If no tithe transaction exists → CREATE one (10% of category income)
     ├── If tithe transaction exists → UPDATE amount
     └── If income deleted and total = 0 → DELETE tithe transaction

+ Background service runs on 1st of each month
     → GenerateMonthlyTitheForAllEnabledUsersAsync
     → Creates tithe transactions for all enabled users who don't have one yet
```

**Status endpoint** returns per-category preview: total income, 10% tithe amount, whether tithe transaction already exists.

### 5.7 Bot Module

See [§10 Telegram Bot](#10-telegram-bot) for the full flow.

The backend side manages:
- Link token generation (64-char random, 15-min expiry)
- Token-based Telegram account linking
- Multi-account support (one user → many `UserTelegramConnection` rows)
- Proxy endpoints for the bot (protected by `X-Bot-Secret` header, not JWT)

---

## 6. Database Schema

### 6.1 Entity Relationship Diagram

```
Users ──────────────────────────────────────────────────────────┐
  │                                                              │
  │ 1:N                                                          │
  ├──── Categories ◄───────── Transactions ──────────────────► Goals
  │         (FK restrict)            │         (FK set-null)
  ├──── FinancialSources ◄───────────┘
  │         (FK restrict)            │
  │                                  ├──── CardInstallments
  │                                  │       (per-installment rows)
  │                                  └──── FixedTransactionPayments
  │                                          (per-month paid tracking)
  │
  └──── TelegramConnections (1:N — multi-account support)
```

### 6.2 Tables

**Users**
```sql
Id                          UUID         PRIMARY KEY
Name                        VARCHAR(100) NOT NULL
Email                       VARCHAR(150) NOT NULL UNIQUE
PasswordHash                BYTEA        NOT NULL
PasswordSalt                BYTEA        NOT NULL
CreatedAt                   TIMESTAMPTZ  NOT NULL
RefreshToken                TEXT
RefreshTokenExpiry          TIMESTAMPTZ
PasswordResetToken          TEXT
PasswordResetTokenExpiry    TIMESTAMPTZ
Is503020Enabled             BOOLEAN      NOT NULL DEFAULT false
IsTitheModuleEnabled        BOOLEAN      NOT NULL DEFAULT false
TitheCategoryId             INTEGER      REFERENCES Categories(Id)
TitheFinancialSourceId      INTEGER      REFERENCES FinancialSources(Id)
TelegramLinkToken           TEXT
TelegramLinkTokenExpiry     TIMESTAMPTZ
```

**Categories**
```sql
Id             SERIAL PRIMARY KEY
Name           VARCHAR(100) NOT NULL
Type           VARCHAR      NOT NULL  -- 'Income' | 'Expense'
UserId         UUID         NOT NULL REFERENCES Users(Id)
Color          VARCHAR(7)   NOT NULL DEFAULT '#6b7280'
BudgetBucket   VARCHAR      NOT NULL  -- 'None' | 'Needs' | 'Wants' | 'Savings'
IsTitheable    BOOLEAN      NOT NULL DEFAULT false
```

**FinancialSources**
```sql
Id           SERIAL PRIMARY KEY
Name         VARCHAR(100) NOT NULL
Type         VARCHAR      NOT NULL  -- 'Card' | 'Account' | 'Cash'
ClosingDay   INTEGER               -- Card only
DueDay       INTEGER               -- Card only
UserId       UUID         NOT NULL REFERENCES Users(Id)
```

**Transactions**
```sql
Id                     SERIAL PRIMARY KEY
Description            VARCHAR(150) NOT NULL
TotalAmount            NUMERIC      NOT NULL
TransactionType        VARCHAR      NOT NULL  -- 'Income' | 'Expense'
PurchaseDate           TIMESTAMPTZ  NOT NULL
IsInstallment          BOOLEAN      NOT NULL DEFAULT false
InstallmentCount       INTEGER
IsPaid                 BOOLEAN      NOT NULL DEFAULT false
IsFixed                BOOLEAN      NOT NULL DEFAULT false
DayOfMonth             INTEGER               -- Fixed bills only
IsRecurring            BOOLEAN      NOT NULL DEFAULT false
CategoryId             INTEGER      NOT NULL REFERENCES Categories(Id)  ON DELETE RESTRICT
FinancialSourceId      INTEGER      NOT NULL REFERENCES FinancialSources(Id) ON DELETE RESTRICT
UserId                 UUID         NOT NULL REFERENCES Users(Id)
GoalId                 INTEGER               REFERENCES Goals(Id) ON DELETE SET NULL
```

**CardInstallments**
```sql
Id                  SERIAL PRIMARY KEY
InstallmentNumber   INTEGER      NOT NULL
Amount              NUMERIC      NOT NULL
IsPaid              BOOLEAN      NOT NULL DEFAULT false
TransactionId       INTEGER      NOT NULL REFERENCES Transactions(Id) ON DELETE CASCADE
DueDate             TIMESTAMPTZ  NOT NULL
```

**FixedTransactionPayments**
```sql
Id              SERIAL PRIMARY KEY
TransactionId   INTEGER      NOT NULL REFERENCES Transactions(Id) ON DELETE CASCADE
Year            INTEGER      NOT NULL
Month           INTEGER      NOT NULL
IsPaid          BOOLEAN      NOT NULL DEFAULT false
PaidAt          TIMESTAMPTZ
UNIQUE (TransactionId, Year, Month)
```

**Goals**
```sql
Id             SERIAL PRIMARY KEY
Name           VARCHAR      NOT NULL
Description    TEXT
TargetAmount   NUMERIC      NOT NULL
CurrentAmount  NUMERIC      NOT NULL DEFAULT 0
TargetDate     TIMESTAMPTZ
Color          VARCHAR(7)   NOT NULL DEFAULT '#22c55e'
Type           VARCHAR      NOT NULL  -- GoalType enum
IsCompleted    BOOLEAN      NOT NULL DEFAULT false
CreatedAt      TIMESTAMPTZ  NOT NULL
UserId         UUID         NOT NULL REFERENCES Users(Id)
```

**TelegramConnections**
```sql
Id            SERIAL PRIMARY KEY
UserId        UUID         NOT NULL REFERENCES Users(Id) ON DELETE CASCADE
ChatId        VARCHAR      NOT NULL UNIQUE
ConnectedAt   TIMESTAMPTZ  NOT NULL
```

> All enum columns are stored as strings (EF Core `HasConversion<string>()`).

---

## 7. API Reference

> All authenticated endpoints require `Authorization: Bearer <accessToken>` header.
> Bot endpoints use `X-Bot-Secret: <secret>` instead of JWT.

### 7.1 Auth — `/api/Auth`

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/Auth/login` | — | Login → returns access + refresh tokens |
| POST | `/api/Auth/refresh` | — | Exchange refresh token for new token pair |
| POST | `/api/Auth/logout` | JWT | Clear server-side refresh token |
| POST | `/api/Auth/change-password` | JWT | Change password + invalidate refresh token |
| POST | `/api/Auth/forgot-password` | — | Generate password reset token (returned in body) |
| POST | `/api/Auth/reset-password` | — | Reset password using reset token |

### 7.2 Users — `/api/User`

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/User` | JWT | List all users |
| GET | `/api/User/{id}` | JWT | Get user by GUID |
| POST | `/api/User` | — | Register new user |
| PUT | `/api/User/{id}` | JWT | Update name/email |
| PUT | `/api/User/{id}/password` | JWT | Update password |
| DELETE | `/api/User/{id}` | JWT | Delete user |

### 7.3 User Settings — `/api/user-settings`

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/user-settings` | JWT | Get settings for authenticated user |
| PUT | `/api/user-settings` | JWT | Update settings (50/30/20, tithe config) |

### 7.4 Categories — `/api/Categories`

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/Categories` | JWT | List all categories for user |
| GET | `/api/Categories/{id}` | JWT | Get single category |
| POST | `/api/Categories` | JWT | Create category |
| PUT | `/api/Categories/{id}` | JWT | Update category |
| DELETE | `/api/Categories/{id}` | JWT | Delete (blocked if in use) |

### 7.5 Financial Sources — `/api/FinancialSources`

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/FinancialSources` | JWT | List all financial sources for user |
| GET | `/api/FinancialSources/{id}` | JWT | Get single source |
| POST | `/api/FinancialSources` | JWT | Create source |
| PUT | `/api/FinancialSources/{id}` | JWT | Update source |
| DELETE | `/api/FinancialSources/{id}` | JWT | Delete (blocked if in use) |

### 7.6 Transactions — `/api/Transactions`

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/Transactions` | JWT | List all transactions (projected) |
| GET | `/api/Transactions/{id}` | JWT | Get single transaction |
| POST | `/api/Transactions` | JWT | Create transaction (+ installments, + goal contribution) |
| PUT | `/api/Transactions/{id}` | JWT | Update with optional recurrence scope |
| DELETE | `/api/Transactions/{id}?scope=` | JWT | Delete with recurrence scope |
| DELETE | `/api/Transactions/{id}/installments/{number}?scope=` | JWT | Delete installment by scope |
| PUT | `/api/Transactions/{id}/installments/{number}` | JWT | Update installment by scope |
| PATCH | `/api/Transactions/installments/{id}/toggle-paid` | JWT | Toggle installment paid status |
| PATCH | `/api/Transactions/{id}/toggle-paid` | JWT | Toggle transaction paid status |
| GET | `/api/Transactions/invoices?financialSourceId=&month=` | JWT | Get credit card invoice |
| POST | `/api/Transactions/invoices/pay?financialSourceId=&month=` | JWT | Pay entire invoice |
| GET | `/api/Transactions/fixed-bills?month=` | JWT | Get monthly fixed bills overview |
| POST | `/api/Transactions/fixed-bills/{id}/pay?month=` | JWT | Mark fixed bill as paid |
| DELETE | `/api/Transactions/fixed-bills/{id}/pay?month=` | JWT | Unmark fixed bill as paid |
| POST | `/api/Transactions/{id}/settle` | JWT | Mark all installments as paid |
| GET | `/api/Transactions/summary?months=` | JWT | Dashboard summary (charts data) |
| GET | `/api/Transactions/simulation` | JWT | Installment simulation overview |
| GET | `/api/Transactions/budget-analysis?month=` | JWT | 50/30/20 analysis for a month |
| GET | `/api/Transactions/debt-summary` | JWT | Debt summary with Avalanche/Snowball |
| GET | `/api/Transactions/health-score` | JWT | Financial health score (0–100) |
| GET | `/api/Transactions/tips` | JWT | Contextual financial tips |

### 7.7 Goals — `/api/Goals`

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/Goals` | JWT | List all goals |
| GET | `/api/Goals/{id}` | JWT | Get single goal |
| POST | `/api/Goals` | JWT | Create goal |
| PUT | `/api/Goals/{id}` | JWT | Update goal |
| DELETE | `/api/Goals/{id}` | JWT | Delete goal |
| POST | `/api/Goals/{id}/contribute` | JWT | Add monetary contribution |

### 7.8 Tithe — `/api/tithe`

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/tithe/status` | JWT | Current month tithe status + previews |
| PATCH | `/api/tithe/toggle` | JWT | Enable/disable tithe module |
| POST | `/api/tithe/generate` | JWT | Manually generate tithe for current month |

### 7.9 Bot (internal) — `/api/Bot`

> User-facing bot management (JWT auth):

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/Bot/link-token` | JWT | Generate 15-min link token |
| POST | `/api/Bot/disconnect` | JWT | Disconnect all Telegram accounts |
| GET | `/api/Bot/connections` | JWT | List all Telegram connections |
| DELETE | `/api/Bot/connections/{id}` | JWT | Disconnect specific account |

> Bot service endpoints (X-Bot-Secret auth):

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/Bot/connect` | Secret | Link chatId to user via token |
| GET | `/api/Bot/context/{chatId}` | Secret | Get user's categories + sources |
| POST | `/api/Bot/transaction` | Secret | Create transaction from bot |
| GET | `/api/Bot/summary/{chatId}` | Secret | Monthly summary for chat |

---

## 8. Authentication & Security

### 8.1 Password Hashing

```
Registration:
  HMACSHA512 key  → stored as PasswordSalt
  HMACSHA512(password + salt) → stored as PasswordHash

Login verification:
  new HMACSHA512(user.PasswordSalt).ComputeHash(password)
  Compare result with user.PasswordHash (constant-time)
```

### 8.2 JWT Token Flow

```
Login success
     │
     ▼
TokenService.IssueTokenPairAsync(user)
     │
     ├── Access Token
     │     Algorithm: HMACSHA256
     │     Expiry: 15 minutes
     │     Claims: sub (userId), email, NameIdentifier (userId), name
     │     Signed with: JwtSettings.Key
     │
     └── Refresh Token
           64 cryptographic random bytes → Base64
           Stored in Users.RefreshToken
           Expiry: 7 days (stored in Users.RefreshTokenExpiry)
```

### 8.3 Client-Side Token Management

```
localStorage
  piggino_token          → JWT access token
  piggino_refresh_token  → Refresh token

Axios request interceptor:
  Every request → Authorization: Bearer {accessToken}

Axios response interceptor:
  On 401 →
    isRefreshing flag prevents concurrent refresh storms
    All 401 requests queued in pendingRequests[]
    POST /api/Auth/refresh with stored refresh token
    ├── Success → new token pair stored, all queued requests retried
    └── Failure → localStorage cleared
                  window.dispatchEvent('piggino:auth-expired')
                  useAuth sets isAuthenticated = false
```

### 8.4 Bot Authentication

Bot endpoints are NOT protected by JWT. They use a shared secret:

```
Bot service → HTTP header: X-Bot-Secret: <BOT_SECRET>
API controller → validates header against BotSettings.Secret
```

This keeps the bot as a service-to-service call without needing user tokens.

### 8.5 Password Reset

```
POST /api/Auth/forgot-password { email }
  → Generates 64-byte random token → Base64
  → Stored in Users.PasswordResetToken (1-hour expiry)
  → Token RETURNED IN RESPONSE BODY (no email delivery implemented)

POST /api/Auth/reset-password { token, newPassword, confirmNewPassword }
  → Validates token not expired, rehashes password, clears token
```

> Note: Production use should add email delivery for the reset token.

---

## 9. Frontend Architecture

### 9.1 Folder Structure

```
frontend/src/
├── App.tsx               → Root component, routing, auth gate
├── main.tsx              → React entry point
├── index.css             → Tailwind base
│
├── components/
│   ├── features/         → Feature-specific components
│   │   ├── auth/         → LoginForm, RegisterForm, ChangePasswordModal
│   │   ├── categories/   → CategoryForm, CategoryModal
│   │   ├── dashboard/    → TitheModuleCard
│   │   ├── financial-sources/ → FinancialSourceForm, FinancialSourceModal
│   │   ├── goals/        → GoalModal
│   │   ├── settings/     → TelegramConnectCard, UserSettingsModal
│   │   └── transactions/ → InlineCreateForm, InstallmentBreakdown,
│   │                        RecurrenceScopeModal, TransactionForm,
│   │                        TransactionModal
│   ├── layout/
│   │   └── MainLayout.tsx  → Sidebar nav + page wrapper
│   └── ui/               → Reusable primitives
│       ├── CategoryBadge.tsx
│       ├── ConfirmModal.tsx
│       ├── EmptyState.tsx
│       ├── LoadingSpinner.tsx
│       ├── MonthNavigator.tsx
│       └── SummaryCard.tsx
│
├── hooks/                → All API calls + state management live here
├── pages/                → Page-level components (thin wrappers)
├── services/
│   └── api.ts            → Single Axios instance + all HTTP functions
├── types/
│   └── index.ts          → All TypeScript interfaces
└── utils/
    ├── errors.ts
    └── formatters.ts
```

### 9.2 Routing

Routing is handled in `App.tsx` using state-based conditional rendering (not React Router):

```
isAuthenticated = false → <LoginPage /> or <OnboardingPage />
isAuthenticated = true  → <MainLayout> with active page state

Pages:
  'dashboard'           → DashboardPage
  'transactions'        → TransactionsPage
  'categories'          → CategoriesPage
  'financial-sources'   → FinancialSourcesPage
  'invoice'             → InvoicePage
  'fixed-bills'         → FixedBillsPage
  'goals'               → GoalsPage
  'wealth-projection'   → WealthProjectionPage
  'debt-planning'       → DebtPlanningPage
```

### 9.3 Pages

| Page | Route Key | What it does |
|---|---|---|
| `LoginPage` | (unauthenticated) | Login + register. After first registration → onboarding. |
| `OnboardingPage` | (post-register) | 3-step wizard: create category → create source → first transaction. |
| `DashboardPage` | `dashboard` | Monthly charts (income/expense bar, expense pie, balance line), 50/30/20 analysis, health score, tips, goals, tithe module card. |
| `TransactionsPage` | `transactions` | Full transaction list, filters, inline create, edit/delete with recurrence scope modal. |
| `CategoriesPage` | `categories` | CRUD for categories with color picker and bucket assignment. |
| `FinancialSourcesPage` | `financial-sources` | CRUD for financial sources. |
| `InvoicePage` | `invoice` | Credit card invoice viewer. Select card + month. Toggle paid per item. Pay all. |
| `FixedBillsPage` | `fixed-bills` | Monthly fixed bills. Optimistic toggle paid/unpaid. Month navigator. |
| `GoalsPage` | `goals` | Goals list with progress bars. Contribute modal. Delete. |
| `WealthProjectionPage` | `wealth-projection` | Client-side CDI vs Poupança simulator. Fetches SELIC from BACEN. Recharts graph. |
| `DebtPlanningPage` | `debt-planning` | Installment debts sorted by Avalanche or Snowball strategy. Settle button. |

### 9.4 Hooks

All API interaction and state management lives in hooks. Pages are thin.

| Hook | API Calls | State managed |
|---|---|---|
| `useAuth` | login, register, logout | `isAuthenticated`, `userId`, token storage |
| `useDashboard(months)` | `GET /Transactions/summary` | Summary data, loading, error |
| `useBudgetAnalysis(month)` | `GET /Transactions/budget-analysis` | Analysis data |
| `useGoals` | Full Goals CRUD + contribute | Goals list, mutation functions |
| `useDebtSummary` | `GET /Transactions/debt-summary` | Debt data |
| `useFixedBills(month)` | Fixed bills GET + toggle | Bills list with optimistic UI |
| `useInvoice(sourceId, month)` | Invoice GET + toggle + pay | Invoice data |
| `useHealthScore` | `GET /Transactions/health-score` | Score data |
| `useContextualTips` | `GET /Transactions/tips` | Tips array |
| `useTitheModule` | Tithe status + toggle + generate | Tithe state |
| `useTelegramConnect` | Link token + connections CRUD | Connection state, countdown timer |
| `useUserSettings` | `GET /user-settings` | User settings, refresh callback |

### 9.5 API Service Layer

Single file: `frontend/src/services/api.ts`

```
apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
})

Request interceptor:
  → Attach Authorization: Bearer {localStorage.piggino_token}

Response interceptor:
  → On 401:
      isRefreshing = true
      POST /Auth/refresh
      ├── Success: store new tokens, replay all queued requests
      └── Failure: clear localStorage, dispatch 'piggino:auth-expired'
```

Functions grouped by domain:
- **Auth**: `login`, `register`, `logout`, `refresh`, `changePassword`, `forgotPassword`, `resetPassword`
- **Transactions**: full CRUD + all specialized analytics endpoints
- **Categories**: CRUD
- **FinancialSources**: CRUD
- **UserSettings**: `getUserSettings`, `updateUserSettings`
- **Goals**: CRUD + `contribute`
- **Analytics**: `getHealthScore`, `getTips`, `getBudgetAnalysis`, `getDebtSummary`, `getSimulation`
- **Tithe**: `getTitheStatus`, `toggleTithe`, `generateTithe`
- **Bot/Telegram**: `generateLinkToken`, `disconnectAll`, `disconnectSpecific`, `getConnections`

### 9.6 TypeScript Types

All interfaces defined in `frontend/src/types/index.ts`. Key types:

```typescript
// Enums as union types
type CategoryType = 'Income' | 'Expense'
type FinancialSourceType = 'Card' | 'Account' | 'Cash'
type RecurrenceScope = 'OnlyThis' | 'ThisAndFuture' | 'ThisAndPast' | 'All'
type BudgetBucket = 'None' | 'Needs' | 'Wants' | 'Savings'
type GoalType = 'EmergencyFund' | 'Savings' | 'Investment' | 'Debt' | 'Travel' | 'Custom'

interface Transaction {
  id: number
  description: string
  totalAmount: number
  transactionType: 'Income' | 'Expense'
  purchaseDate: string
  isInstallment: boolean
  installmentCount?: number
  isPaid: boolean
  isFixed: boolean
  dayOfMonth?: number
  isRecurring: boolean
  categoryId: number
  categoryName: string
  categoryColor: string
  budgetBucket: BudgetBucket
  financialSourceId: number
  financialSourceName: string
  financialSourceType: FinancialSourceType
  goalId?: number
  goalName?: string
  currentInstallmentNumber?: number
  cardInstallments: CardInstallment[]
}

interface DashboardSummary {
  monthlySummaries: MonthlySummary[]
  expensesByCategory: CategoryExpense[]
  topExpenses: TopExpense[]
  currentMonthIncome: number
  currentMonthExpenses: number
  currentMonthBalance: number
  previousMonthIncome: number
  previousMonthExpenses: number
  previousMonthBalance: number
  incomeChangePercent: number
  expenseChangePercent: number
  pendingFixedBills: number
  pendingInvoiceAmount: number
}

interface HealthScore {
  score: number           // 0–100
  grade: string           // 'A' | 'B' | 'C' | 'D' | 'F'
  gradeLabel: string
  components: HealthScoreComponent[]
  strengths: string[]
  warnings: string[]
}

interface BudgetAnalysis {
  month: string
  monthlyIncome: number
  needsTarget: number;    needsActual: number;    needsCategories: BucketCategoryBreakdown[]
  wantsTarget: number;    wantsActual: number;    wantsCategories: BucketCategoryBreakdown[]
  savingsTarget: number;  savingsActual: number;  savingsCategories: BucketCategoryBreakdown[]
  insights: string[]
  unclassifiedActual: number
}

interface DebtSummary {
  debts: DebtItem[]
  totalDebt: number
  totalMonthlyPayment: number
  estimatedMonthsToFreedom: number
}

interface DebtItem {
  transactionId: number
  description: string
  totalRemaining: number
  monthlyPayment: number
  remainingInstallments: number
  nextDueDate: string
  priorityAvalanche: number
  prioritySnowball: number
}
```

### 9.7 PWA Configuration

The frontend is a Progressive Web App with:
- App icons for Android, iOS, and Windows (in `public/`)
- Vite PWA plugin configuration in `vite.config.js`
- Service worker for offline caching
- Installable on mobile home screens

---

## 10. Telegram Bot

The bot is a **separate Node.js service** using the `grammy` library and Google Gemini 1.5 Flash for natural language understanding.

### 10.1 Architecture

```
Telegram Servers
      │  webhook / long-polling
      ▼
piggino-bot (Node.js)
      │
      ├── /start handler       → welcome message
      ├── /conectar handler    → account linking
      ├── /resumo handler      → monthly summary
      └── message handler      → natural language transaction
                │
                ├── GET /api/Bot/context/{chatId}    (get user's categories/sources)
                ├── Gemini 1.5 Flash                 (parse transaction from text)
                └── POST /api/Bot/transaction        (create transaction in Piggino)
```

### 10.2 Account Linking Flow

```
1. User opens Piggino web app
2. Settings → Telegram → "Gerar código"
3. Frontend calls POST /api/Bot/link-token (JWT)
4. Backend generates 64-char random token, stores in Users with 15-min expiry
5. Frontend shows token + countdown timer
6. User copies "/conectar <token>" → sends to @PigginoBot on Telegram
7. Bot receives /conectar command
8. Bot calls POST /api/Bot/connect { chatId, token } (X-Bot-Secret)
9. Backend validates token not expired → creates UserTelegramConnection row
10. Bot replies "Conta conectada com sucesso!"
11. Token is cleared from Users entity
```

### 10.3 Natural Language Transaction Flow

```
User sends: "gastei 50 no mercado"
      │
      ▼
1. Bot receives message
      │
      ▼
2. GET /api/Bot/context/{chatId}
   Returns: { categories: [...], financialSources: [...] }
      │
      ▼
3. Gemini prompt (gemini.ts):
   System: "You are a financial assistant. Extract transaction data."
   Context: user's category list + financial source list + today's date
   User message: "gastei 50 no mercado"
      │
      ▼
4. Gemini returns JSON:
   {
     description: "Mercado",
     totalAmount: 50.00,
     transactionType: "Expense",
     categoryId: 3,
     financialSourceId: 1,
     purchaseDate: "2026-03-26"
   }
      │
      ▼
5. Validation:
   - categoryId must exist in user's category list
   - financialSourceId must exist in user's source list
   - amount must be positive
      │
      ▼
6. POST /api/Bot/transaction (X-Bot-Secret) → creates transaction
      │
      ▼
7. Bot replies: "✅ Transação registrada: Mercado - R$ 50,00"
```

### 10.4 Summary Flow

```
User sends: /resumo
      │
      ▼
GET /api/Bot/summary/{chatId} (X-Bot-Secret)
      │
      ▼
Returns BotSummaryDto:
  { monthlyIncome, monthlyExpenses, balance, topCategories[] }
      │
      ▼
Bot formats and replies with current month summary
```

---

## 11. Data Flows (End-to-End)

### 11.1 Create a Transaction

```
User fills TransactionForm in browser
      │
      ▼
POST /api/Transactions  { description, totalAmount, transactionType,
                          purchaseDate, isInstallment, installmentCount,
                          categoryId, financialSourceId, goalId?, ... }
      │ JWT validated, userId extracted from claims
      ▼
TransactionService.CreateTransactionAsync
      │
      ├── If isInstallment = true:
      │     Generate N CardInstallment rows with computed due dates
      │     (based on FinancialSource.ClosingDay / DueDay)
      │
      ├── If goalId provided:
      │     GoalService.ApplyGoalContributionAsync(goalId, amount)
      │     → Goal.CurrentAmount += amount
      │     → If CurrentAmount >= TargetAmount: IsCompleted = true
      │
      └── If TransactionType = Income AND Category.IsTitheable:
            TitheService.RecalculateTitheForCategoryAsync(categoryId, userId)
            → Computes total income for that category this month
            → If tithe transaction exists: update amount (10%)
            → If not: create new tithe expense transaction
      │
      ▼
TransactionRepository.AddAsync + SaveChangesAsync
      │
      ▼
201 Created → TransactionReadDto
```

### 11.2 Dashboard Load

```
DashboardPage mounts
      │
      ├── useDashboard(6)      → GET /Transactions/summary?months=6
      ├── useBudgetAnalysis    → GET /Transactions/budget-analysis?month=YYYY-MM
      ├── useHealthScore       → GET /Transactions/health-score
      ├── useContextualTips    → GET /Transactions/tips
      ├── useGoals             → GET /Goals
      └── useTitheModule       → GET /tithe/status
      │
      ▼
TransactionService.GetDashboardSummaryAsync:
  - Last N months income/expense totals (for bar chart)
  - Current month expenses by category (for pie chart)
  - Top 5 expenses (for highlights)
  - Month-over-month percentage changes
  - Pending fixed bills count
  - Pending invoice amount (sum of unpaid card installments due this month)
      │
      ▼
All data rendered via Recharts components
```

### 11.3 Silent Token Refresh

```
Axios sends request with expired access token
      │
      ▼
API returns 401 Unauthorized
      │
      ▼
Axios response interceptor fires
      │
      ├── isRefreshing = false → set to true
      │     POST /api/Auth/refresh { refreshToken }
      │     ├── Success → store new piggino_token + piggino_refresh_token
      │     │             resolve all queued requests with new token
      │     │             retry original request
      │     └── Failure → clear localStorage
      │                   dispatch 'piggino:auth-expired'
      │                   useAuth → isAuthenticated = false
      │                   redirect to login
      │
      └── isRefreshing = true → push to pendingRequests queue
            (waits for the ongoing refresh to complete)
```

### 11.4 Monthly Tithe Generation (Background)

```
1st of month at 00:00 UTC
      │
      ▼
TitheMonthlyBackgroundService fires
      │
      ▼
TitheService.GenerateMonthlyTitheForAllEnabledUsersAsync
      │
      ▼
For each User where IsTitheModuleEnabled = true:
  For each titheable Category with income this month:
    If tithe transaction doesn't exist yet for this category+month:
      Create Expense transaction:
        Amount = 10% of category income
        Category = User.TitheCategoryId (or first expense category)
        FinancialSource = User.TitheFinancialSourceId (or first source)
        Description = "Tithe - {CategoryName}"
```

---

## 12. Enums & Constants

### TransactionType
| Value | Meaning |
|---|---|
| `Income` | Money coming in |
| `Expense` | Money going out |

### CategoryType
| Value | Meaning |
|---|---|
| `Income` | Category for income transactions |
| `Expense` | Category for expense transactions |

### FinancialSourceType
| Value | Meaning |
|---|---|
| `Card` | Credit card (has ClosingDay + DueDay, enables invoice management) |
| `Account` | Bank account |
| `Cash` | Cash / wallet |

### GoalType
| Value | Meaning |
|---|---|
| `EmergencyFund` | Emergency reserve |
| `Savings` | Generic savings |
| `Investment` | Investment goal |
| `Debt` | Debt payoff goal |
| `Travel` | Travel fund |
| `Custom` | Custom goal |

### BudgetBucket
| Value | 50/30/20 target |
|---|---|
| `None` | Not classified |
| `Needs` | 50% — essentials (rent, food, utilities) |
| `Wants` | 30% — discretionary (entertainment, dining out) |
| `Savings` | 20% — savings and investments |

### RecurrenceScope
| Value | Effect on update/delete |
|---|---|
| `OnlyThis` | Affects only the selected transaction |
| `ThisAndFuture` | Affects this and all future occurrences |
| `ThisAndPast` | Affects this and all past occurrences |
| `All` | Affects the entire recurrence group |

---

## 13. Environment Variables

### Backend (`appsettings.json` / env)

| Variable | Description |
|---|---|
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection string |
| `Jwt__Key` | HMACSHA256 signing key (min 32 chars recommended) |
| `Jwt__Issuer` | JWT issuer (e.g. `https://piggino.duckdns.org`) |
| `Jwt__Audience` | JWT audience (e.g. `https://piggino.duckdns.org`) |
| `BotSettings__Secret` | Shared secret for API ↔ Bot communication |

### Frontend (`.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL for API calls (e.g. `/api` or `https://piggino.duckdns.org/api`) |

### Bot (`.env`)

| Variable | Description |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Telegram BotFather token |
| `GEMINI_API_KEY` | Google Gemini API key |
| `BOT_SECRET` | Must match `BotSettings__Secret` in backend |
| `API_URL` | Backend base URL (e.g. `http://piggino-api:8080`) |

---

## 14. Local Development

### Prerequisites
- [.NET 9 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org)
- Podman Desktop (or Docker Desktop)
- .NET Aspire workload: `dotnet workload install aspire`

### Start with .NET Aspire (recommended)

```bash
# 1. Start Aspire orchestrator (starts Postgres + API + Frontend)
cd backend/Piggino.AppHost
dotnet run

# Aspire Dashboard: https://localhost:15000
# API: https://localhost:<assigned-port>
# Frontend: https://localhost:<assigned-port>
```

### Start with Docker Compose (production-like)

```bash
# 1. Copy and fill environment variables
cp .env.example .env

# 2. Start all services
podman compose up -d

# 3. Check logs
podman compose logs -f piggino-api
```

### Database Migrations

```bash
# Never write migration files manually!
cd backend/Piggino.Api
dotnet ef migrations add <MigrationName>
dotnet ef database update
```

### Run Tests

```bash
cd backend
dotnet test
```

### Frontend Development Server

```bash
cd frontend
npm install
npm run dev
```

### Bot Development

```bash
cd bot
npm install
npm run dev
```
