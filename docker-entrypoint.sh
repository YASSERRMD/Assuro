#!/bin/sh
set -e

echo "Running database migrations..."
goose -dir /migrations up

echo "Starting Assuro..."
exec /usr/local/bin/assuro
