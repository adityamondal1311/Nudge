"""Adds a handful of Open/In Progress tickets so the agent board shows tickets in motion
across columns, without touching the existing Resolved seed set used for similarity retrieval.
Re-runnable safely: skips insertion if these tickets already exist (matched by title)."""
import datetime as dt

from app.db import SessionLocal
from app.embeddings import embed
from app.models import Ticket

EXTRA_TICKETS = [
    dict(
        title="New laptop request for incoming data analyst",
        description="We're onboarding a data analyst next week and need a laptop with at least 16GB RAM allocated and imaged before their start date.",
        category="IT", urgency="Medium", assigned_agent="Rahul Mehta", status="Open",
    ),
    dict(
        title="Shared printer on 1st floor jammed repeatedly",
        description="The printer near the reception keeps jamming mid-print for the last two days, tried clearing paper trays but it keeps happening.",
        category="IT", urgency="Low", assigned_agent="Rahul Mehta", status="In Progress",
    ),
    dict(
        title="Mismatch in travel advance settlement amount",
        description="The advance I received for last month's district visit doesn't match what I'm being asked to settle, the numbers are off by a few thousand rupees.",
        category="Finance", urgency="Medium", assigned_agent="Priya Nair", status="Open",
    ),
    dict(
        title="Query on tax declaration deadline for this financial year",
        description="I haven't submitted my investment declarations yet and want to confirm the deadline before the next payroll cycle.",
        category="Finance", urgency="Low", assigned_agent="Priya Nair", status="In Progress",
    ),
    dict(
        title="Onboarding documents pending for new field coordinator",
        description="A new field coordinator joined this week but their offer letter and ID proof copies haven't been uploaded to the HR system yet.",
        category="HR", urgency="Medium", assigned_agent="Sana Iqbal", status="Open",
    ),
    dict(
        title="Cabin booking system not reflecting today's reservations",
        description="The meeting room booking tool shows our 3pm slot as free even though we booked it yesterday, worried about a double booking.",
        category="Admin", urgency="Medium", assigned_agent="Karan Bose", status="In Progress",
    ),
]


def main():
    session = SessionLocal()
    try:
        existing_titles = {
            t for (t,) in session.query(Ticket.title).filter(
                Ticket.title.in_([t["title"] for t in EXTRA_TICKETS])
            )
        }

        now = dt.datetime.now(dt.timezone.utc)
        inserted = 0
        for i, t in enumerate(EXTRA_TICKETS):
            if t["title"] in existing_titles:
                continue

            created_at = now - dt.timedelta(hours=(len(EXTRA_TICKETS) - i) * 6)
            status_history = [{"status": "Open", "timestamp": created_at.isoformat()}]
            updated_at = created_at
            if t["status"] == "In Progress":
                in_progress_at = created_at + dt.timedelta(hours=2)
                status_history.append({"status": "In Progress", "timestamp": in_progress_at.isoformat()})
                updated_at = in_progress_at

            ticket = Ticket(
                title=t["title"],
                description=t["description"],
                description_embedding=embed(t["description"]),
                category=t["category"],
                category_confidence=0.9,
                category_reasoning=f"Seed data labeled as {t['category']}.",
                urgency=t["urgency"],
                status=t["status"],
                raised_by="seed-data@thenudge.org",
                assigned_agent=t["assigned_agent"],
                resolution_notes=None,
                status_history=status_history,
                created_at=created_at,
                updated_at=updated_at,
            )
            session.add(ticket)
            inserted += 1

        session.commit()
        print(f"Inserted {inserted} new Open/In Progress tickets ({len(EXTRA_TICKETS) - inserted} already present).")
    finally:
        session.close()


if __name__ == "__main__":
    main()
