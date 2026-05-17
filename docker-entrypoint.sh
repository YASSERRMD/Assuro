#!/bin/sh
set -e

echo "Running database migrations..."
goose -dir /migrations postgres "$ASSURO_DATABASE_URL" up

echo "Starting Assuro..."
exec /usr/local/bin/assuro
