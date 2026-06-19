"""Applies backend/migrations/001_init.sql against DATABASE_URL. Re-runnable (uses IF NOT EXISTS)."""
import pathlib

from app.db import engine

MIGRATIONS_DIR = pathlib.Path(__file__).resolve().parent.parent / "migrations"

if __name__ == "__main__":
    sql_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    with engine.begin() as conn:
        for path in sql_files:
            print(f"Applying {path.name}...")
            conn.exec_driver_sql(path.read_text())
    print("Done.")
