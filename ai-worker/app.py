"""HTTP API of the prediction worker."""
import json

from fastapi import FastAPI
from pydantic import AwareDatetime, BaseModel

from features import build_features
from model import load_model, predict_delay_changes

MODEL_PATH = "models/model.pt"
MODEL_CARD_PATH = "models/model_card.json"

app = FastAPI(title="DelayOracle worker")
# Loaded once when the worker starts; every request reuses it.
model, mean, std = load_model(MODEL_PATH)


# The request and response bodies. FastAPI validates incoming JSON against these classes
# and answers 422 when a field is missing or a time has no time zone.
class DepartureInput(BaseModel):
    scheduled_time: AwareDatetime
    current_delay_s: int


class PredictRequest(BaseModel):
    observed_at: AwareDatetime
    departures: list[DepartureInput]


class PredictResponse(BaseModel):
    predicted_delays_s: list[int]



@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/model")
def model_card() -> dict:
    """How the model was trained and how it scored; written by train.py."""
    with open(MODEL_CARD_PATH, encoding="utf-8") as file:
        return json.load(file)


@app.post("/predict")
def predict(request: PredictRequest) -> PredictResponse:
    """Predicted final delay in seconds for each departure, in the order of the request."""
    # 1. one row of features per departure
    feature_rows = [
        build_features(departure.current_delay_s, departure.scheduled_time, request.observed_at)
        for departure in request.departures
    ]
    # 2. the predicted change for each row
    changes = predict_delay_changes(model, mean, std, feature_rows)
    # 3. current delay plus change, rounded to whole seconds
    predicted = [
        round(departure.current_delay_s + change)
        for departure, change in zip(request.departures, changes, strict=True)
    ]
    return PredictResponse(predicted_delays_s=predicted)
