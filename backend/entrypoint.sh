#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "Running database migrations..."
# Run any pending migrations up to the latest revision
python -m alembic upgrade head

echo "Database is up to date. Starting Uvicorn API server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000