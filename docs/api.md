# API Reference

## Authentication

- `POST /v1/auth/signup` - Create organization and owner account
- `POST /v1/auth/login` - Login and receive JWT tokens
- `POST /v1/auth/refresh` - Refresh access token

## Assets

- `POST /v1/assets` - Create an asset
- `GET /v1/assets` - List assets (filtered, paginated)
- `GET /v1/assets/{id}` - Get asset by ID
- `PATCH /v1/assets/{id}` - Update asset
- `DELETE /v1/assets/{id}` - Archive asset

## AI Systems

- `POST /v1/ai-systems` - Register an AI system
- `GET /v1/ai-systems` - List AI systems
- `GET /v1/ai-systems/{id}` - Get AI system details
- `POST /v1/ai-systems/import` - Bulk import

## Risk

- `POST /v1/assets/{id}/risk:compute` - Compute risk classification
- `GET /v1/assets/{id}/risk` - Get latest risk assessment
- `GET /v1/assets/{id}/risk/history` - Get risk history

## Frameworks

- `GET /v1/frameworks` - List frameworks
- `GET /v1/controls` - List controls
- `POST /v1/assets/{id}/controls/status` - Set control status
- `GET /v1/assets/{id}/coverage` - Get framework coverage
- `GET /v1/assets/{id}/soa` - Get statement of applicability

## Assessments

- `POST /v1/assessments` - Create assessment
- `GET /v1/assessments` - List assessments
- `POST /v1/assessments/{id}/responses` - Save response
- `POST /v1/assessments/{id}/submit` - Submit assessment

## Evidence

- `POST /v1/evidence` - Upload evidence
- `GET /v1/evidence` - List evidence

## Monitoring

- `POST /v1/monitoring/signals` - Record signal
- `GET /v1/assets/{id}/signals` - List signals

## Incidents

- `POST /v1/incidents` - Create incident
- `GET /v1/incidents` - List incidents

## Reports

- `GET /v1/assets/{id}/report` - Generate compliance report

## Audit

- `GET /v1/audit-log` - List audit log entries (admin/owner only)
