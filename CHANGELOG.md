# Changelog

## v0.1.0 - 2026-05-17

Initial release of Assuro, the AI Safety and Governance Assessment Platform.

### Backend
- Go 1.23 modular monolith with chi router
- PostgreSQL 16 with goose migrations and sqlc
- JWT authentication with argon2id password hashing
- Generic asset registry (shared core)
- AI System module on top of asset registry
- Registry-driven risk engine with EU AI Act rules
- Cross-framework register (EU AI Act, NIST AI RMF, ISO 42001)
- Assessment workflow with control status propagation
- Evidence store with SHA-256 content hashing
- Continuous monitoring signals and incident/CAPA tracking
- Rate limiting and security headers middleware
- Admin audit log endpoint

### Frontend
- Next.js 15 App Router with TypeScript and Tailwind CSS
- Assuro design system (navy/gold palette)
- Auth pages (login, signup)
- AI Systems registry and risk screens
- Assessment workflow UI with autosave
- Evidence library
- Dashboard with coverage gauges
- Cross-framework register screen
- Incidents board and report preview

### Infrastructure
- Docker Compose for local development
- Production compose with Caddy TLS reverse proxy
- GitHub Actions CI (build, lint, test)
