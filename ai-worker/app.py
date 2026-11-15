"""HTTP API of the prediction worker."""
import json

from fastapi import FastAPI
from pydantic import AwareDatetime, BaseModel

from features import build_features
from model import load_model, predict_delay_changes

MODEL_PATH = "models/model.pt"
MODEL_CARD_PATH = "models/model_card.json"

app = FastAPI(title="DelayOracle worker")
model, mean, std = load_model(MODEL_PATH)


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
    with open(MODEL_CARD_PATH, encoding="utf-8") as file:
        return json.load(file)


@app.post("/predict")
def predict(request: PredictRequest) -> PredictResponse:
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
