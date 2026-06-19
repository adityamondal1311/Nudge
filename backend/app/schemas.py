import datetime as dt

from pydantic import BaseModel, Field


class TicketCreate(BaseModel):
    title: str
    description: str
    urgency: str
    raised_by: str
    category: str
    category_confidence: float
    category_reasoning: str


class StatusUpdate(BaseModel):
    status: str
    resolution_notes: str | None = None


class TicketPatch(BaseModel):
    assigned_agent: str | None = None
    urgency: str | None = None
    resolution_notes: str | None = None


class StatusHistoryEntry(BaseModel):
    status: str
    timestamp: str


class TicketOut(BaseModel):
    id: int
    title: str
    description: str
    category: str
    category_confidence: float | None
    category_reasoning: str | None
    urgency: str
    status: str
    raised_by: str
    assigned_agent: str | None
    resolution_notes: str | None
    status_history: list[StatusHistoryEntry]
    created_at: dt.datetime
    updated_at: dt.datetime

    class Config:
        from_attributes = True


class SimilarTicketRequest(BaseModel):
    title: str
    description: str


class SimilarTicketResult(BaseModel):
    id: int
    title: str
    category: str
    resolution_notes: str
    similarity: float = Field(..., ge=-1, le=1)


class CategorizeRequest(BaseModel):
    title: str
    description: str


class CategorizeResponse(BaseModel):
    category: str
    confidence: float
    reasoning: str
