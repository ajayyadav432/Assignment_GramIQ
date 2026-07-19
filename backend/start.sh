#!/bin/bash
set -e

export PYTHONPATH=/app

echo "==> Waiting for PostgreSQL to be ready..."

if [ -n "$DATABASE_URL" ]; then
    # Strip trailing carriage returns and spaces to prevent DNS resolution errors
    CLEAN_DB_URL=$(echo "$DATABASE_URL" | tr -d '\r' | tr -d ' ')
    # Strip +asyncpg prefix and any sslmode query parameters for raw asyncpg check
    DB_CONN_URL=$(echo "$CLEAN_DB_URL" | sed 's/postgresql+asyncpg/postgresql/' | sed 's/[?&]sslmode=[^&]*//g')
else
    DB_CONN_URL="postgresql://postgres:postgres@db:5432/krishiclinic"
fi

for i in $(seq 1 30); do
    if python -c "
import sys, asyncio, asyncpg
async def check():
    try:
        conn = await asyncpg.connect('$DB_CONN_URL')
        await conn.close()
        sys.exit(0)
    except Exception:
        sys.exit(1)
asyncio.run(check())
" 2>/dev/null; then
        echo "==> PostgreSQL is ready!"
        break
    fi
    echo "    Waiting for PostgreSQL... ($i/30)"
    sleep 1
done

echo "==> Running Alembic migrations..."
alembic upgrade head

echo "==> Seeding database..."
python -m app.db.seed || echo "    Seeding skipped or already done."

echo "==> Starting Uvicorn server..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
