"""HTTP API of the prediction worker."""

from fastapi import FastAPI

app = FastAPI(title="DelayOracle worker")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
