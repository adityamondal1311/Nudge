# The/Nudge AI Product Engineer Take-Home — Project Spec

Take-home assignment for "Intern, AI Product Engineer" role at The/Nudge Institute (poverty-alleviation action institute working with governments on rural development/skilling/economic inclusion). Deadline: Monday June 22, 2026, 10:00 AM IST. Evaluators care about product thinking, AI integration as a means to an end, UI/UX decisions, and shipping speed — NOT raw ML/research sophistication.

## What we're building
An internal IT/HR/Finance/Admin support ticketing tool with a full lifecycle and one deep, well-executed AI feature: retrieval of similar previously-resolved tickets shown to the employee BEFORE they submit, so the tool can prevent a ticket from being created at all, not just process it faster after the fact. That sentence is the product thesis — every decision should serve it.

## Tech stack (decided — do not re-litigate or suggest alternatives)
- **Backend:** FastAPI + SQLAlchemy
- **Database:** Supabase Postgres with the pgvector extension enabled
- **Embeddings:** `sentence-transformers`, model `all-MiniLM-L6-v2`, run SERVER-SIDE in FastAPI, loaded once at app startup (not per-request, not client-side — avoids model-download/cold-start lag during the demo)
- **Categorization AI:** Anthropic Claude API, single structured JSON call per ticket returning `{category, confidence, reasoning}`
- **Frontend:** Next.js + TypeScript + Tailwind
- **Hosting:** Vercel (frontend) + Render (backend) — both free tier
- **Auth:** none — a plain name/email text field is sufficient
- **Notifications:** none — an in-app "Activity Log" panel with timestamps substitutes for email/SMS

## Data model
```
Ticket
- id
- title
- description
- description_embedding (vector, pgvector column)
- category (IT / HR / Finance / Admin)
- category_confidence (float)
- category_reasoning (text, one-line)
- urgency (Low / Medium / High)
- status (Open / In Progress / Resolved / Closed)
- raised_by (text — name/email, no auth)
- assigned_agent (text — hardcoded dropdown list is fine)
- created_at, updated_at
- status_history (JSON list of {status, timestamp})
- resolution_notes (text, REQUIRED when status is set to Resolved — this is the
  retrievable "answer" text used for future similarity search; enforce this
  as a hard validation, not a UI suggestion)
```

## Core flows, in priority order
1. **Seed data + retrieval verification (build FIRST, before any UI):** 15-20 realistic resolved tickets spanning all four categories, with plausible descriptions and resolution_notes. Generate and store embeddings at seed time. Standalone script (no UI) that embeds a sample new ticket description, runs pgvector similarity search, prints top 3 matches with scores. Must be visually verified working before touching the frontend.

2. **Backend CRUD + AI endpoints:**
   - Standard ticket CRUD
   - `POST /tickets/similar` — embeds draft title+description server-side, returns top 3 similar resolved tickets via pgvector cosine similarity
   - `POST /tickets/categorize` — calls Claude API, returns `{category, confidence, reasoning}`
   - Status update endpoint that appends to `status_history` and enforces `resolution_notes` non-empty when status → Resolved

3. **Employee ticket-raising flow (frontend):** title + description → "Find Similar Resolved Issues" button → top 3 similar resolved tickets with resolutions, copy "We found 3 previously resolved tickets that may solve your issue." Employee can stop here or proceed. On submit, Claude-suggested category shown as EDITABLE field with one-line reasoning visible (e.g. "Suggested: IT — mentions VPN and laptop access"), never a locked auto-classification.

4. **Agent view:** 4-column kanban (Open / In Progress / Resolved / Closed), filterable by department. Moving to Resolved requires resolution_notes — block transition without it.

5. **Employee ticket detail view:** ticket + "Activity Log" panel with status changes and timestamps. Note in code comments that this would be email/Slack/WhatsApp in production.

6. **Analytics dashboard:** ticket count by category, ticket count by status, average resolution time, top recurring issue categories (% breakdown). Stretch: track "viewed similar-ticket suggestions but did NOT submit" as a "tickets potentially deflected by AI" metric — don't let it block anything else.

## Explicitly OUT of scope
- Real authentication/login system
- Real email/SMS/push notifications
- A complex routing rules engine — flat category → department mapping only
- Auto-drafted agent response suggestions — deliberately skipped in favor of doing retrieval deeply and well

## Working agreement
- Explore → Plan → Code, per day. Confirm core functionality works end-to-end (even ugly) before any visual polish on that day.
- Day-by-day sequencing:
  - Day 1: Supabase + pgvector setup, data model, seed script, standalone retrieval verification script
  - Day 2: Backend CRUD + Claude categorization endpoint + similarity endpoint
  - Day 3: Frontend — ticket creation form with similar-tickets card, agent board, analytics dashboard
  - Day 4: Polish, deploy (Vercel + Render), draft two-page note and screen-recording script
- Once at UI polish, iterate from pasted screenshots with specific feedback, not described changes.
- Flag explicitly (with reasoning) if a design decision above should change — default to spec as written rather than silently deviating.
- Supabase connection string for deploy: use the **Session pooler** (port 6543), not the direct connection (port 5432) — avoids hitting Supabase connection limits from Render's free tier.
