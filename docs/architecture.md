# Architecture

Assuro is a modular monolith built in Go with a Next.js frontend.

## Backend Structure

```
cmd/assuro/          - application entrypoint
internal/config/     - configuration loading and validation
internal/api/        - HTTP handlers, server setup, middleware
internal/service/    - business logic layer
internal/store/      - database access layer with sqlc
internal/domain/     - business domain models
internal/risk/       - registry-driven risk engine
internal/auth/       - authentication (argon2id, JWT)
internal/storage/    - blob storage interface
internal/report/     - compliance report builder
migrations/          - database migrations (goose)
```

## Shared Core Design

The platform uses a shared core that is domain-agnostic. The AI Governance module (Module A) is the first module. A future EHS / Workplace Safety module (Module B) will reuse the same core tables without schema changes.

Key shared abstractions:
- `assets` - generic inventory (AI systems, workplace sites, etc.)
- `incidents` - domain-agnostic incident tracking with CAPA
- `framework_requirements` - cross-framework control mapping
- `audit_log` - append-only audit trail

## Data Flow

```
cmd/assuro -> config -> logger -> server (chi) -> handlers -> services -> store (pgx) -> PostgreSQL
```

## Frontend

Next.js 15 App Router with TypeScript, Tailwind CSS, and the Assuro design system (navy/gold palette).
