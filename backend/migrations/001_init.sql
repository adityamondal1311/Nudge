-- Run in Supabase SQL editor, or via backend/scripts/run_migration.py

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS tickets (
    id              SERIAL PRIMARY KEY,
    title           TEXT NOT NULL,
    description     TEXT NOT NULL,
    description_embedding vector(384),
    category        TEXT NOT NULL CHECK (category IN ('IT', 'HR', 'Finance', 'Admin')),
    category_confidence FLOAT,
    category_reasoning  TEXT,
    urgency         TEXT NOT NULL CHECK (urgency IN ('Low', 'Medium', 'High')),
    status          TEXT NOT NULL CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')) DEFAULT 'Open',
    raised_by       TEXT NOT NULL,
    assigned_agent  TEXT,
    resolution_notes TEXT,
    status_history  JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT resolution_notes_required_when_resolved
        CHECK (status NOT IN ('Resolved', 'Closed') OR (resolution_notes IS NOT NULL AND resolution_notes <> ''))
);

-- Cosine-distance index for similarity search over resolved tickets.
CREATE INDEX IF NOT EXISTS tickets_embedding_idx
    ON tickets USING hnsw (description_embedding vector_cosine_ops);
