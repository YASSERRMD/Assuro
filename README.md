<div align="center">

![Assuro Banner](docs/assets/banner.png)

<br/>

[![Go](https://img.shields.io/badge/Go-1.25-00ADD8?style=flat-square&logo=go&logoColor=white)](https://go.dev)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![License](https://img.shields.io/badge/License-Apache_2.0-3b82f6?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-10b981?style=flat-square)](CONTRIBUTING.md)

**Open-source AI governance, compliance, and risk management platform.**  
Built for teams operating AI systems under EU AI Act, NIST AI RMF, and ISO/IEC 42001.

[Quick Start](#quick-start) · [Features](#features) · [Architecture](#architecture) · [API](#api-reference) · [Self-Host](#self-hosting) · [Contributing](#contributing)

</div>

---

## What is Assuro?

Assuro is a **self-hostable AI governance platform** that gives security and compliance teams a single place to register, assess, and continuously monitor AI systems across your organisation. It automates the evidence trail needed for regulatory frameworks and surfaces risk before it becomes a liability.

- **Register** every AI system, agent, and vendor in a structured inventory
- **Assess** against EU AI Act, NIST AI RMF, ISO/IEC 42001, and custom frameworks
- **Monitor** risk scores, incidents, and shadow AI continuously
- **Govern** with approval gates, policy workflows, and a full audit log
- **Export** compliance reports with tamper-evident SHA-256 hashes

---

## Features

### Core Governance
| Feature | Description |
|---|---|
| **AI System Registry** | Register models, pipelines, and agents with risk classification (minimal / limited / high / unacceptable) |
| **Risk Engine** | Automated risk scoring with tier assignment and historical trend tracking |
| **Cross-Framework Compliance** | EU AI Act · NIST AI RMF · ISO/IEC 42001 — SoA with control mapping |
| **Assessment Workflows** | Structured assessments with evidence collection, version history, and sign-off |
| **Continuous Monitoring** | Configurable thresholds, drift detection, and alert rules |
| **Incident & CAPA** | Incident lifecycle management with corrective action tracking |

### Extended Modules
| Module | Description |
|---|---|
| **Agent Registry & Runtime** | Register autonomous agents, manage permissions, guardrail policies, kill-switch |
| **Shadow AI Discovery** | Cloud connector scans (AWS Bedrock, Azure AI, GCP Vertex, GitHub, HuggingFace) + inbox reconciliation |
| **Vendor Risk** | Third-party AI vendor inventory with assessment scoring and risk tier |
| **Policy Management** | Draft → review → approve workflow with attestation tracking |
| **Model Cards** | Structured model documentation with versioned JSON sections |
| **Model Testing** | Test suites (functional / bias / robustness / security) with scored runs |
| **Approval Gates** | Multi-stakeholder approval workflows with configurable thresholds |
| **Task Management** | Priority-sorted remediation and review tasks with comments |
| **Analytics Dashboard** | Cross-domain metrics: risk distribution, compliance score, incident trends |
| **Audit Log** | Structured event stream with filtering, date range, and CSV export |
| **RBAC** | Custom org roles with 30+ fine-grained permission scopes |
| **Notifications & Webhooks** | In-app notifications, email preferences, webhook delivery with retry logs |
| **Data Export / Import** | Full org JSON export, CSV asset export, bulk import for assets and vendors |

---

## Architecture

![Architecture Diagram](docs/assets/architecture.png)

```
┌──────────────────────────────────────────────────────────┐
│                  Next.js 15 Frontend                     │
│         App Router · TypeScript · Tailwind CSS           │
└──────────────────┬───────────────────────────────────────┘
                   │  REST / JSON
┌──────────────────▼───────────────────────────────────────┐
│                  Go API Server (chi)                      │
│   31 handler files · 35+ services · JWT middleware       │
│   Rate limiting · RBAC · Audit log middleware            │
├────────────────────────────────┬─────────────────────────┤
│   Cloud Connectors             │   Background Jobs        │
│   AWS Bedrock · Azure AI       │   Email · Webhooks       │
│   GCP Vertex · GitHub · HF     │   Risk recompute         │
└────────────────────────────────┴──────────┬──────────────┘
                                            │  pgx/v5
┌───────────────────────────────────────────▼──────────────┐
│                  PostgreSQL 16                           │
│   28 migrations · JSONB · UUID · Audit stream           │
└──────────────────────────────────────────────────────────┘
```

**Stack at a glance:**

| Layer | Technology |
|---|---|
| Backend | Go 1.25 · chi v5 · pgx/v5 · sqlc · goose · zap |
| Frontend | Next.js 15 · React · TypeScript · Tailwind CSS · shadcn/ui |
| Database | PostgreSQL 16 |
| Auth | JWT (access + refresh) · argon2id password hashing |
| Observability | Structured JSON logging · OpenTelemetry-ready |
| Deploy | Docker Compose · Caddy reverse proxy |

---

## Quick Start

**Prerequisites:** Docker, Docker Compose

```bash
# 1. Clone
git clone https://github.com/YASSERRMD/Assuro.git
cd Assuro

# 2. Start PostgreSQL
make docker-up

# 3. Run migrations
make migrate-up

# 4. Start the API (port 8080)
make run

# 5. Start the frontend (port 3000)
cd web && npm install && npm run dev
```

The API is available at `http://localhost:8080` and the UI at `http://localhost:3000`.

### Environment Variables

```bash
# Required
DATABASE_URL=postgres://assuro:assuro@localhost:5432/assuro?sslmode=disable
JWT_SECRET=change-me-in-production

# Optional
PORT=8080
LOG_LEVEL=info
OPENAI_API_KEY=sk-...          # AI Assist feature
AWS_REGION=us-east-1           # Bedrock connector
AZURE_AI_ENDPOINT=https://...  # Azure AI connector
```

---

## API Reference

All endpoints are under `/v1/` and require a Bearer JWT token except `/v1/healthz`.

### Key Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/v1/healthz` | Health check |
| `POST` | `/v1/auth/register` | Register org + owner account |
| `POST` | `/v1/auth/login` | Obtain access + refresh tokens |
| `GET` | `/v1/ai-systems` | List AI systems |
| `GET` | `/v1/assets` | List assets |
| `GET` | `/v1/risks` | List risk assessments |
| `GET` | `/v1/analytics/dashboard` | Cross-domain analytics snapshot |
| `GET` | `/v1/audit-log` | Filterable audit event stream |
| `GET` | `/v1/audit-log/export` | Download audit log as CSV |
| `GET` | `/v1/export` | Full org data export (JSON) |
| `POST` | `/v1/import/assets` | Bulk asset import |
| `GET` | `/v1/roles` | List custom RBAC roles |
| `POST` | `/v1/webhooks` | Register webhook endpoint |

---

## Self-Hosting

### Docker Compose (recommended)

```bash
cp .env.example .env        # fill in secrets
docker compose up -d
docker compose exec api ./migrate up
```

### Production

See [`docs/deployment.md`](docs/deployment.md) for:
- TLS with Caddy
- PostgreSQL connection pooling
- Backup strategy
- Health checks and monitoring

---

## Project Structure

```
Assuro/
├── cmd/server/          # Main entrypoint
├── internal/
│   ├── api/             # HTTP handlers (31 files)
│   ├── service/         # Business logic (35+ services)
│   ├── store/           # DB connection + sqlc generated queries
│   ├── auth/            # JWT middleware and RBAC
│   ├── connectors/      # Cloud AI connectors
│   ├── notify/          # Notifications and webhook dispatcher
│   ├── jobs/            # Background job queue
│   ├── risk/            # Risk scoring engine
│   └── report/          # PDF/JSON report builder
├── migrations/          # 28 goose SQL migrations
├── web/                 # Next.js 15 frontend
│   ├── app/             # App Router pages
│   └── components/      # Reusable UI components
└── docs/                # Deployment and architecture docs
```

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a PR.

```bash
# Run all tests
go test ./internal/...

# Lint
golangci-lint run

# Frontend type-check
cd web && npm run type-check
```

---

## License

Apache 2.0 — see [LICENSE](LICENSE).

---

<div align="center">
<sub>Built for teams that take AI governance seriously.</sub>
</div>
