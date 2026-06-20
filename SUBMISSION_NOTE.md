# The/Nudge Ticketing Tool — Submission Note

> The AI layer was designed to prevent tickets from being created, not just to process them faster.

## Overview

This is an internal IT/HR/Finance/Admin support ticketing tool with a full lifecycle (Open → In Progress → Resolved/Closed) and one deep, well-executed AI feature: before an employee submits a ticket, they see the top 3 previously resolved tickets that look similar to their problem. If one of those already answers their question, the ticket never gets created. Everything else in the build — CRUD, the agent board, analytics — exists to support that one feature, not to compete with it for attention.

## Architecture

- **Backend:** FastAPI + SQLAlchemy, deployed on Render.
- **Database:** Supabase Postgres with the `pgvector` extension. `Ticket.description_embedding` is a 384-dim vector column.
- **Frontend:** Next.js + TypeScript + Tailwind, deployed on Vercel.
- **Auth/notifications:** none — a plain name/email field substitutes for auth, an in-app Activity Log (`status_history`) substitutes for email/SMS.

Three endpoints carry the product logic:
- `POST /tickets/similar` — embeds the draft title+description server-side and runs a pgvector cosine-distance query against `Ticket`s where `status = 'Resolved'`, returning the top 3.
- `POST /tickets/categorize` — a single structured Claude call returning `{category, confidence, reasoning}`.
- `PATCH /tickets/{id}/status` — appends to `status_history` and **hard-blocks** any transition into `Resolved`/`Closed` without non-empty `resolution_notes`, since those notes are the retrievable "answer" text that makes the similarity search useful in the first place.

## AI/tools used

- **Embeddings:** `sentence-transformers/all-MiniLM-L6-v2`, run server-side in FastAPI via `fastembed` (ONNX runtime), loaded once at process startup. Output is already L2-normalized, so cosine similarity is a direct dot product.
- **Categorization:** Claude (`claude-sonnet-4-6`), called once per ticket with a single structured tool-use call (`categorize_ticket` tool, forced via `tool_choice`) to get a typed `{category, confidence, reasoning}` back — no free-text parsing.

## Why server-side embeddings, not Transformers.js

The spec considered running the embedding model client-side via Transformers.js instead. We chose server-side for two reasons: it avoids a multi-hundred-KB-to-MB model download and WASM warm-up happening live in front of an evaluator during the demo, and it keeps the embedding space in one place — the same model, loaded once, produces every vector that ever goes into or queries `pgvector`, so there's no risk of a client-side and server-side encoder drifting apart. The cost is one model load at backend startup, paid once, not per request.

## Why one deep feature instead of three shallow ones

The spec explicitly keeps auto-drafted agent responses and a real routing-rules engine out of scope. That wasn't a time-saving shortcut so much as a bet: an employee who never has to file a ticket because they found their answer in 5 seconds saves more total effort — theirs and the agent's — than any feature that makes an already-filed ticket move faster. So instead of three half-built AI touches, the project put its entire AI budget into making the pre-submission retrieval genuinely good: a standalone, no-UI verification script (`scripts/test_retrieval.py`) was built and run *before* any frontend code, specifically so retrieval quality could be checked in isolation. It was re-run after a later infrastructure change (swapping the embedding backend for deploy-memory reasons, below) to confirm the three sample queries still surfaced the correct top-1 match — e.g. "my laptop won't connect to VPN from home" still matches the seeded VPN ticket at the top.

## Option A vs. B vs. C

- **Option A (built):** prevent ticket creation via deep pre-submission retrieval.
- **Option B:** process tickets faster after creation — auto-routing, auto-drafted responses.
- **Option C:** spread AI thin across many small touches (smart tagging, sentiment, SLA prediction, etc.).

B and C both assume the ticket gets filed. A is the only option that removes work from the system entirely rather than shaving time off work that still has to happen. Given a fixed AI budget, A was judged the highest-leverage choice for an organization fielding repetitive IT/HR/Finance/Admin requests.

## What was descoped, and why

- **Real authentication** — out of scope by spec; a name/email field is sufficient for an internal tool with no security requirement being tested.
- **Real email/SMS notifications** — substituted with an in-app Activity Log (timestamped `status_history`); in production this would be the actual notification channel, noted in code comments at the relevant call sites.
- **Auto-drafted agent responses** — deliberately cut so effort went into retrieval depth instead (see above).
- **A routing-rules engine** — flat category → department mapping only; a rules engine adds configuration surface with no clear payoff at this scale.
- **The "tickets deflected by AI" analytics stretch metric** — not built. The analytics dashboard covers the required metrics (category/status breakdown, average resolution time, top recurring category) but the deflection-tracking stretch goal was cut for time. This is a known gap, not an oversight to gloss over.

## A note on deploy

Render's free tier (512MB RAM) could not run `sentence-transformers` with its default torch backend — it OOM'd at model-load time even with a CPU-only torch wheel. The fix was switching the embedding runtime to `fastembed` (ONNX, no torch), which loads the same `all-MiniLM-L6-v2` checkpoint in well under the memory ceiling with no change to the rest of the embedding interface. Retrieval quality was re-verified against the same sample queries after the swap before redeploying.
