# Deployment Guide

## Self-Host with Docker Compose

### Prerequisites
- Docker and Docker Compose
- A domain name (for TLS)

### Quick Start

```bash
cp .env.example .env
# Edit .env with your values, especially ASSURO_JWT_SECRET

docker compose -f docker-compose.prod.yml up -d
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| ASSURO_HTTP_PORT | HTTP port | 8080 |
| ASSURO_DATABASE_URL | PostgreSQL connection string | (auto from compose) |
| ASSURO_JWT_SECRET | Secret for JWT signing | (required) |
| ASSURO_ENVIRONMENT | dev or prod | prod |
| ASSURO_LOG_LEVEL | Log level | info |
| ASSURO_DOMAIN | Domain for TLS | localhost |

### Database Backup

```bash
docker exec assuro-postgres pg_dump -U assuro assuro > backup.sql
```

### Database Restore

```bash
cat backup.sql | docker exec -i assuro-postgres psql -U assuro assuro
```
