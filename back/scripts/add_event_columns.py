"""Run safe ALTER TABLE statements to add new columns used by the app.

Usage:
    cd back
    python scripts/add_event_columns.py

This script reads `DATABASE_URL` from the environment. If you have a `.env` file
in `back/`, the script will load it using python-dotenv.
"""
import os
import sys
from sqlalchemy import text
from sqlalchemy.engine import URL
from sqlalchemy import create_engine

# Load .env if present
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

DATABASE_URL = os.environ.get("DATABASE_URL")
# Default to the same DB the app uses in development (docker-compose mapping).
if not DATABASE_URL:
    DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5434/postgres"
    print("DATABASE_URL not set — defaulting to:", DATABASE_URL)

# Use SQL statements that are safe to run repeatedly.
DDL = [
    "ALTER TABLE short_urls ADD COLUMN IF NOT EXISTS event_type VARCHAR;",
    "ALTER TABLE short_urls ADD COLUMN IF NOT EXISTS message_link VARCHAR;",
]

def main():
    print("Connecting to:", DATABASE_URL)
    # If DATABASE_URL uses an async driver (e.g. postgresql+asyncpg://),
    # convert it to a sync driver string for the simple migration script.
    sync_url = DATABASE_URL
    if "+asyncpg" in DATABASE_URL:
        sync_url = DATABASE_URL.replace("+asyncpg", "")
        print("Detected async driver in DATABASE_URL; using sync URL:", sync_url)

    engine = create_engine(sync_url)
    with engine.begin() as conn:
        for stmt in DDL:
            print("Executing:", stmt.strip())
            try:
                conn.execute(text(stmt))
            except Exception as e:
                print("Error executing statement:", e)
                raise

        # Verify columns exist now
        verify_q = """
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'short_urls'
          AND column_name IN ('event_type', 'message_link')
        ORDER BY column_name;
        """
        result = conn.execute(text(verify_q))
        rows = result.fetchall()
        if rows:
            print("Verified columns:")
            for r in rows:
                print(f" - {r.column_name}: {r.data_type}")
        else:
            print("Warning: columns not found after ALTER. Check DATABASE_URL and permissions.")
    print("Done. Columns ensured (or attempt completed).")

if __name__ == '__main__':
    main()
