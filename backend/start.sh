#!/bin/bash
set -e

export PYTHONPATH=/app

echo "==> Waiting for PostgreSQL to be ready..."

# Simple wait loop using Python's asyncpg
for i in $(seq 1 30); do
    if python -c "
import sys
try:
    import asyncio, asyncpg
    async def check():
        conn = await asyncpg.connect(
            user='postgres', password='postgres',
            host='db', port=5432, database='krishiclinic'
        )
        await conn.close()
    asyncio.run(check())
    sys.exit(0)
except Exception:
    sys.exit(1)
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
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
