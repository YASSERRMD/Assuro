<div align="center">

<img src="docs/assets/banner.png" alt="Assuro" width="100%" />

<br/><br/>

[![License](https://img.shields.io/badge/License-Apache_2.0-C5A55A?style=flat-square&labelColor=1B2A4A)](LICENSE)
[![Go](https://img.shields.io/badge/Go-1.25-C5A55A?style=flat-square&labelColor=1B2A4A)](https://go.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-C5A55A?style=flat-square&labelColor=1B2A4A)](https://postgresql.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-C5A55A?style=flat-square&labelColor=1B2A4A)](https://nextjs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-C5A55A?style=flat-square&labelColor=1B2A4A)](CONTRIBUTING.md)

**Self-hostable AI governance, compliance, and risk management platform.**

[Quick Start](#quick-start) · [Features](#features) · [Architecture](#architecture) · [API](#api) · [Deployment](#deployment) · [Contributing](#contributing)

</div>

---

## Overview

Assuro is an open-source platform for organisations that operate AI systems under regulatory frameworks. It provides a structured inventory, automated risk scoring, cross-framework compliance mapping, and a full audit trail — all in a single self-hosted deployment.

**Frameworks supported out of the box:** EU AI Act · NIST AI RMF · ISO/IEC 42001

---

## Features

### Governance & Compliance

| Module | Description |
|---|---|
| AI System Registry | Register models, pipelines, and agents with risk tier classification |
| Risk Engine | Automated scoring with historical trend tracking per asset |
| Compliance Register | SoA with control mapping across EU AI Act, NIST AI RMF, ISO 42001 |
| Assessment Workflows | Structured assessments with evidence collection and sign-off |
| Continuous Monitoring | Configurable thresholds, drift detection, and alert rules |
| Incident & CAPA | Incident lifecycle management with corrective action tracking |
| Report Generation | PDF/JSON compliance reports with tamper-evident SHA-256 hashes |

### Extended Modules

| Module | Description |
|---|---|
| Agent Registry & Runtime | Register autonomous agents, guardrail policies, anomaly detection, kill-switch |
| Shadow AI Discovery | Cloud connector scans (AWS Bedrock, Azure AI, GCP Vertex, GitHub, HuggingFace) |
| Vendor Risk | Third-party AI vendor inventory with risk tier assessment |
| Policy Management | Draft → review → approve workflow with attestation tracking |
| Model Cards | Versioned structured model documentation |
| Model Testing | Test suites (functional / bias / robustness / security) with scored runs |
| Approval Gates | Multi-stakeholder approval workflows with configurable thresholds |
| Task Management | Priority-sorted remediation tasks with comments |
| Analytics Dashboard | Risk distribution, compliance score, incident trends |
| Audit Log | Filterable event stream with date range filters and CSV export |
| RBAC | Custom org roles with 30+ fine-grained permission scopes |
| Notifications & Webhooks | In-app notifications, email preferences, webhook delivery logs |
| Data Export / Import | Full org JSON export, CSV export, bulk asset and vendor import |

---

## Architecture

<div align="center">
<img src="docs/assets/architecture.png" alt="Assuro Architecture" width="100%" />
</div>

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 · React · TypeScript · Tailwind CSS · shadcn/ui |
| Backend | Go 1.25 · chi v5 · pgx/v5 · sqlc · goose · zap |
| Database | PostgreSQL 16 — 28 migrations, JSONB, UUID primary keys |
| Auth | JWT access + refresh tokens · argon2id password hashing |
| Deployment | Docker Compose · Caddy reverse proxy |

---

## Quick Start

**Prerequisites:** Docker, Docker Compose

```bash
git clone https://github.com/YASSERRMD/Assuro.git
cd Assuro

make docker-up      # start PostgreSQL
make migrate-up     # run migrations
make run            # start API on :8080

cd web && npm install && npm run dev   # start frontend on :3000
```

### Environment variables

```env
DATABASE_URL=postgres://assuro:assuro@localhost:5432/assuro?sslmode=disable
JWT_SECRET=change-me-in-production
PORT=8080
LOG_LEVEL=info
```

---

## API

All endpoints live under `/v1/` and require a `Bearer` JWT except `/v1/healthz`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/v1/healthz` | Health check |
| `POST` | `/v1/auth/register` | Register org and owner account |
| `POST` | `/v1/auth/login` | Obtain access and refresh tokens |
| `GET` | `/v1/ai-systems` | List AI systems |
| `GET` | `/v1/assets` | List assets |
| `GET` | `/v1/analytics/dashboard` | Cross-domain metrics snapshot |
| `GET` | `/v1/audit-log` | Filterable audit event stream |
| `GET` | `/v1/audit-log/export` | Download audit log as CSV |
| `GET` | `/v1/export` | Full org data export (JSON) |
| `POST` | `/v1/import/assets` | Bulk asset import |
| `GET` | `/v1/roles` | List custom RBAC roles |
| `POST` | `/v1/webhooks` | Register webhook endpoint |

---

## Deployment

See [`docs/deployment.md`](docs/deployment.md) for production setup including TLS via Caddy, PostgreSQL connection pooling, backup strategy, and health checks.

```bash
cp .env.example .env
docker compose -f docker-compose.prod.yml up -d
docker compose exec api ./migrate up
```

---

## Project Structure

```
Assuro/
├── cmd/server/          # Entrypoint
├── internal/
│   ├── api/             # HTTP handlers
│   ├── service/         # Domain services
│   ├── store/           # DB layer and sqlc queries
│   ├── auth/            # JWT and RBAC middleware
│   ├── connectors/      # Cloud AI connectors
│   ├── notify/          # Notifications and webhook dispatcher
│   └── risk/            # Risk scoring engine
├── migrations/          # 28 goose SQL migrations
└── web/                 # Next.js 15 frontend
```

---

## Contributing

```bash
go test ./internal/...   # run all tests
golangci-lint run        # lint
cd web && npm run type-check
```

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

---

<div align="center">

<sub>Mohamed Yasser | Solutions Architect</sub>

</div>
