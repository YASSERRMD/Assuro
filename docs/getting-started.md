# Getting Started

## Clone and Configure

```bash
git clone https://github.com/YASSERRMD/Assuro.git
cd Assuro
cp .env.example .env
```

## Run Locally

```bash
# Start PostgreSQL
make docker-up

# Run migrations
make migrate-up

# Build and run
make run
```

The API will be available at http://localhost:8080.

## Demo Credentials

After running `make demo-seed`, use the demo organization to explore the platform.

## Frontend

```bash
cd web
npm install
npm run dev
```

The frontend will be available at http://localhost:3000.
