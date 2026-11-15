from fastapi.testclient import TestClient

from app import app

client = TestClient(app)

# These tests use the trained model in models/model.pt. They check how the endpoint behaves,
# not exact predictions, so they keep passing after the model is retrained.


def predict_request(*departures: dict) -> dict:
    return {
        "observed_at": "2026-11-14T17:00:00Z",
        "departures": list(departures),
    }


def departure(scheduled_time: str = "2026-11-14T17:25:00Z", current_delay_s: int = 120) -> dict:
    return {"scheduled_time": scheduled_time, "current_delay_s": current_delay_s}


def predict(*departures: dict) -> list[int]:
    response = client.post("/predict", json=predict_request(*departures))
    assert response.status_code == 200
    return response.json()["predicted_delays_s"]


def test_health_returns_ok() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_predict_returns_one_whole_number_per_departure() -> None:
    predictions = predict(departure(), departure(current_delay_s=300), departure(current_delay_s=0))

    assert len(predictions) == 3
    assert all(type(prediction) is int for prediction in predictions)


def test_predict_keeps_the_order_of_the_departures() -> None:
    late = departure(current_delay_s=900)
    early = departure(scheduled_time="2026-11-14T17:10:00Z", current_delay_s=-60)

    assert predict(late, early) == [predict(late)[0], predict(early)[0]]


def test_prediction_stays_near_the_current_delay() -> None:
    # A wrong scaling or a wrong feature order gives predictions that are far off.
    [prediction] = predict(departure(current_delay_s=120))

    assert abs(prediction - 120) < 600


def test_prediction_does_not_depend_on_the_weekday() -> None:
    # 14 November 2026 is a Saturday and 16 November is a Monday; the model only knows the hour.
    saturday = predict_request(departure())
    monday = {
        "observed_at": "2026-11-16T17:00:00Z",
        "departures": [departure(scheduled_time="2026-11-16T17:25:00Z")],
    }

    saturday_response = client.post("/predict", json=saturday)
    monday_response = client.post("/predict", json=monday)

    assert saturday_response.json() == monday_response.json()


def test_predict_without_departures_returns_an_empty_list() -> None:
    assert predict() == []


def test_predict_rejects_a_missing_field() -> None:
    request = predict_request(departure())
    del request["observed_at"]

    response = client.post("/predict", json=request)

    assert response.status_code == 422


def test_predict_rejects_a_time_without_a_time_zone() -> None:
    response = client.post(
        "/predict", json=predict_request(departure(scheduled_time="2026-11-14T17:25:00"))
    )

    assert response.status_code == 422


def test_model_returns_the_model_card() -> None:
    response = client.get("/model")

    assert response.status_code == 200
    card = response.json()
    assert set(card["mae_seconds"]) == {"model", "baseline"}
    assert card["features"][0] == "current_delay_s"
