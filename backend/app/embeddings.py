from sentence_transformers import SentenceTransformer

# Loaded once at import time so FastAPI startup (Day 2) and these scripts
# both pay the model-load cost exactly once, never per-request.
_model = SentenceTransformer("all-MiniLM-L6-v2")


def embed(text: str) -> list[float]:
    return _model.encode(text, normalize_embeddings=True).tolist()
