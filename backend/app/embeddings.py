from fastembed import TextEmbedding

# Loaded once at import time so FastAPI startup (Day 2) and these scripts
# both pay the model-load cost exactly once, never per-request. ONNX runtime
# instead of torch keeps this within Render free tier's 512MB RAM limit.
_model = TextEmbedding("sentence-transformers/all-MiniLM-L6-v2")


def embed(text: str) -> list[float]:
    return next(_model.embed([text])).tolist()
