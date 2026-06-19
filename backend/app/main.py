import datetime as dt

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import claude_client
from app.db import SessionLocal
from app.embeddings import embed  # noqa: F401  (loads the model at startup, not on first request)
from app.models import Ticket
from app.schemas import (
    CategorizeRequest,
    CategorizeResponse,
    SimilarTicketRequest,
    SimilarTicketResult,
    StatusUpdate,
    TicketCreate,
    TicketOut,
    TicketPatch,
)

VALID_STATUSES = ["Open", "In Progress", "Resolved", "Closed"]
TERMINAL_STATUSES = {"Resolved", "Closed"}

app = FastAPI(title="The/Nudge Ticketing API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _get_ticket_or_404(db: Session, ticket_id: int) -> Ticket:
    ticket = db.get(Ticket, ticket_id)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@app.post("/tickets/categorize", response_model=CategorizeResponse)
def categorize(body: CategorizeRequest):
    result = claude_client.categorize_ticket(body.title, body.description)
    return result


@app.post("/tickets/similar", response_model=list[SimilarTicketResult])
def find_similar(body: SimilarTicketRequest, db: Session = Depends(get_db)):
    query_embedding = embed(f"{body.title} {body.description}")
    distance = Ticket.description_embedding.cosine_distance(query_embedding)
    stmt = (
        select(Ticket, distance.label("distance"))
        .where(Ticket.status == "Resolved")
        .order_by(distance)
        .limit(3)
    )
    results = db.execute(stmt).all()
    return [
        SimilarTicketResult(
            id=ticket.id,
            title=ticket.title,
            category=ticket.category,
            resolution_notes=ticket.resolution_notes,
            similarity=1 - distance,
        )
        for ticket, distance in results
    ]


@app.post("/tickets", response_model=TicketOut)
def create_ticket(body: TicketCreate, db: Session = Depends(get_db)):
    now = dt.datetime.now(dt.timezone.utc)
    ticket = Ticket(
        title=body.title,
        description=body.description,
        description_embedding=embed(f"{body.title} {body.description}"),
        category=body.category,
        category_confidence=body.category_confidence,
        category_reasoning=body.category_reasoning,
        urgency=body.urgency,
        status="Open",
        raised_by=body.raised_by,
        status_history=[{"status": "Open", "timestamp": now.isoformat()}],
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


@app.get("/tickets", response_model=list[TicketOut])
def list_tickets(
    status: str | None = None,
    category: str | None = None,
    db: Session = Depends(get_db),
):
    stmt = select(Ticket).order_by(Ticket.created_at.desc())
    if status:
        stmt = stmt.where(Ticket.status == status)
    if category:
        stmt = stmt.where(Ticket.category == category)
    return db.execute(stmt).scalars().all()


@app.get("/tickets/{ticket_id}", response_model=TicketOut)
def get_ticket(ticket_id: int, db: Session = Depends(get_db)):
    return _get_ticket_or_404(db, ticket_id)


@app.patch("/tickets/{ticket_id}/status", response_model=TicketOut)
def update_status(ticket_id: int, body: StatusUpdate, db: Session = Depends(get_db)):
    if body.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"status must be one of {VALID_STATUSES}")

    ticket = _get_ticket_or_404(db, ticket_id)

    resolution_notes = body.resolution_notes if body.resolution_notes is not None else ticket.resolution_notes
    if body.status in TERMINAL_STATUSES and not resolution_notes:
        raise HTTPException(
            status_code=400,
            detail="resolution_notes is required when moving a ticket to Resolved or Closed",
        )

    ticket.status = body.status
    if body.resolution_notes is not None:
        ticket.resolution_notes = body.resolution_notes
    ticket.status_history = [
        *ticket.status_history,
        {"status": body.status, "timestamp": dt.datetime.now(dt.timezone.utc).isoformat()},
    ]
    db.commit()
    db.refresh(ticket)
    return ticket


@app.patch("/tickets/{ticket_id}", response_model=TicketOut)
def patch_ticket(ticket_id: int, body: TicketPatch, db: Session = Depends(get_db)):
    ticket = _get_ticket_or_404(db, ticket_id)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(ticket, field, value)
    db.commit()
    db.refresh(ticket)
    return ticket
