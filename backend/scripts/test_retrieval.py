"""Standalone retrieval check: embeds a draft ticket description and prints the top 3
most similar resolved tickets via pgvector cosine distance. No API, no UI.

Usage:
    python -m scripts.test_retrieval "my laptop won't connect to the VPN"
    python -m scripts.test_retrieval   # uses a built-in sample query
"""
import sys

from sqlalchemy import select

from app.db import SessionLocal
from app.embeddings import embed
from app.models import Ticket

DEFAULT_QUERY = "my laptop won't connect to VPN from home"


def search(query: str, k: int = 3):
    query_embedding = embed(query)
    session = SessionLocal()
    try:
        distance = Ticket.description_embedding.cosine_distance(query_embedding)
        stmt = (
            select(Ticket, distance.label("distance"))
            .where(Ticket.status == "Resolved")
            .order_by(distance)
            .limit(k)
        )
        results = session.execute(stmt).all()
        print(f"\nQuery: {query!r}")
        print("-" * 70)
        for ticket, distance in results:
            similarity = 1 - distance
            print(f"[{similarity:.3f}] {ticket.title}  ({ticket.category})")
            print(f"        Resolution: {ticket.resolution_notes[:100]}...")
        print()
    finally:
        session.close()


if __name__ == "__main__":
    queries = sys.argv[1:] or [
        DEFAULT_QUERY,
        "I need to claim back money I spent on travel for a field visit",
        "how do I apply for leave when having a baby",
    ]
    for q in queries:
        search(q)
