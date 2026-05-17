# Assuro

AI Safety and Governance Assessment Platform.

Assuro is a modular monolith for assessing and governing AI systems. The lead module is AI Governance (Module A), covering risk classification, cross-framework compliance (EU AI Act, NIST AI RMF, ISO/IEC 42001), assessment workflows, evidence tracking, and continuous monitoring. The shared core is designed to host a future EHS / Workplace Safety module (Module B) without schema rewrites.

## Tech Stack

- Backend: Go 1.23, chi router, pgx, sqlc, goose, zap
- Frontend: Next.js 15, React, TypeScript, Tailwind CSS
- Database: PostgreSQL 16
- Auth: JWT access/refresh tokens, argon2id

## Quick Start

```bash
# Start PostgreSQL
make docker-up

# Run migrations
make migrate-up

# Build and run
make run
```

The API will be available at http://localhost:8080.

## License

Apache-2.0
