from pgvector.sqlalchemy import Vector
from sqlalchemy import CheckConstraint, Column, DateTime, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from app.db import Base

EMBEDDING_DIM = 384  # all-MiniLM-L6-v2 output dimension


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True)
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    description_embedding = Column(Vector(EMBEDDING_DIM))
    category = Column(String, nullable=False)
    category_confidence = Column(Float)
    category_reasoning = Column(Text)
    urgency = Column(String, nullable=False)
    status = Column(String, nullable=False, default="Open")
    raised_by = Column(Text, nullable=False)
    assigned_agent = Column(Text)
    resolution_notes = Column(Text)
    status_history = Column(JSONB, nullable=False, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint("category IN ('IT', 'HR', 'Finance', 'Admin')", name="category_check"),
        CheckConstraint("urgency IN ('Low', 'Medium', 'High')", name="urgency_check"),
        CheckConstraint("status IN ('Open', 'In Progress', 'Resolved', 'Closed')", name="status_check"),
    )
