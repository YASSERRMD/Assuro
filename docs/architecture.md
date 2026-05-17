# Architecture

Assuro is a modular monolith built in Go with a Next.js frontend.

## Backend Structure

- `cmd/assuro/` - application entrypoint
- `internal/config/` - configuration loading and validation
- `internal/api/` - HTTP handlers and server setup
- `internal/store/` - database access layer
- `internal/domain/` - business domain models
- `migrations/` - database migrations (goose)

## Shared Core Design

The platform uses a shared core that is domain-agnostic. The AI Governance module
(Module A) is the first module built on this core. A future EHS / Workplace Safety
module (Module B) will reuse the same core tables and interfaces without schema changes.

Key shared abstractions:
- `assets` - generic inventory table (AI systems, workplace sites, etc.)
- `incidents` - domain-agnostic incident tracking
- `framework_requirements` - cross-framework control mapping
- `audit_log` - append-only audit trail

## Data Flow

```
cmd/assuro -> config -> logger -> server (chi) -> handlers -> services -> store (pgx) -> PostgreSQL
```
