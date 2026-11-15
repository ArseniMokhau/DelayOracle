"""Trains the delay model on the collected departures and compares it with the baseline.

Usage:
  python train.py

Reads data/sample/delays.db.
Writes models/model.pt and models/model_card.json.
"""
import json
import sqlite3
from datetime import UTC, datetime

import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

from features import FEATURE_NAMES, build_features
from model import DelayModel, save_model

DB_PATH = "data/sample/delays.db"

MODEL_PATH = "models/model.pt"
MODEL_CARD_PATH = "models/model_card.json"
# Below this many minutes before departure the errors are reported separately.
CLOSE_MINUTES = 10

SEED = 42
TRAIN_SHARE = 0.8
HIDDEN_SIZE = 32
EPOCHS = 30
BATCH_SIZE = 256
LEARNING_RATE = 0.001

# A departure is usable when it was seen more than once and its last sighting was
# within 5 minutes of the estimated departure, so last_delay_s is close to the final delay.
USABLE_ROWS_SQL = """
SELECT theoretical, first_seen_at, first_delay_s, last_delay_s
FROM departures
WHERE first_delay_s IS NOT NULL AND last_delay_s IS NOT NULL AND last_estimated IS NOT NULL
  AND first_seen_at < last_seen_at
  AND ABS(julianday(last_estimated) - julianday(last_seen_at)) * 1440 <= 5
ORDER BY first_seen_at
"""


def parse_utc(text: str) -> datetime:
    return datetime.fromisoformat(text).astimezone(UTC)


def load_dataset(db_path: str):
    """Returns features, current delays and final delays as tensors, oldest sighting first."""
    con = sqlite3.connect(db_path)
    try:
        rows = con.execute(USABLE_ROWS_SQL).fetchall()
    finally:
        con.close()

    features, current_delays, final_delays, seen_at = [], [], [], []
    for theoretical, first_seen_at, first_delay_s, last_delay_s in rows:
        features.append(build_features(
            first_delay_s, parse_utc(theoretical), parse_utc(first_seen_at)
        ))
        current_delays.append(float(first_delay_s))
        final_delays.append(float(last_delay_s))
        seen_at.append(first_seen_at)

    return (
        torch.tensor(features, dtype=torch.float32),
        torch.tensor(current_delays, dtype=torch.float32),
        torch.tensor(final_delays, dtype=torch.float32),
        seen_at,
    )


def train_model(model, features, delay_changes) -> None:
    loader = DataLoader(TensorDataset(features, delay_changes), batch_size=BATCH_SIZE, shuffle=True)
    optimizer = torch.optim.Adam(model.parameters(), lr=LEARNING_RATE)
    loss_function = nn.L1Loss()

    for epoch in range(1, EPOCHS + 1):
        model.train()
        total_loss = 0.0
        for batch_features, batch_changes in loader:
            optimizer.zero_grad()
            loss = loss_function(model(batch_features), batch_changes)
            loss.backward()
            optimizer.step()
            total_loss += loss.item() * len(batch_features)
        if epoch % 5 == 0:
            print(f"epoch {epoch:2d}  training MAE {total_loss / len(features):6.1f} s")


def mean_absolute_error(predicted: torch.Tensor, actual: torch.Tensor) -> float:
    return (predicted - actual).abs().mean().item()


def write_model_card(path: str, card: dict) -> None:
    with open(path, "w", encoding="utf-8") as file:
        json.dump(card, file, indent=2)


def main() -> None:
    torch.manual_seed(SEED)

    features, current_delays, final_delays, seen_at = load_dataset(DB_PATH)

    # Split by time: the model is tested on departures seen after everything it trained on.
    split = int(len(features) * TRAIN_SHARE)
    train, test = slice(0, split), slice(split, None)

    # Scale every feature to mean 0 and spread 1, using the training rows only.
    mean = features[train].mean(dim=0)
    std = features[train].std(dim=0).clamp_min(1e-6)
    scaled = (features - mean) / std

    model = DelayModel(len(FEATURE_NAMES), HIDDEN_SIZE)
    train_model(model, scaled[train], final_delays[train] - current_delays[train])

    model.eval()
    with torch.inference_mode():
        predicted = current_delays[test] + model(scaled[test])
    model_mae = mean_absolute_error(predicted, final_delays[test])
    baseline_mae = mean_absolute_error(current_delays[test], final_delays[test])

    print(f"training rows: {split}   test rows: {len(features) - split}")
    print(f"test window:   {seen_at[split]} to {seen_at[-1]}")
    print(f"model MAE:    {model_mae:6.1f} s")
    print(f"baseline MAE: {baseline_mae:6.1f} s  (final delay equals current delay)")

    # The same comparison for departures that are close, where the current delay is already good.
    minutes_to_departure = features[test][:, FEATURE_NAMES.index("minutes_to_departure")]
    close = minutes_to_departure < CLOSE_MINUTES
    close_model_mae = mean_absolute_error(predicted[close], final_delays[test][close])
    close_baseline_mae = mean_absolute_error(current_delays[test][close], final_delays[test][close])
    print(f"under {CLOSE_MINUTES} minutes to departure ({int(close.sum())} rows): "
          f"model {close_model_mae:.1f} s, baseline {close_baseline_mae:.1f} s")

    save_model(MODEL_PATH, model, mean, std)
    write_model_card(MODEL_CARD_PATH, {
        "model": f"PyTorch network, two hidden layers of {HIDDEN_SIZE}",
        "features": FEATURE_NAMES,
        "target": "change of the delay between the sighting and the departure, in seconds",
        "baseline": "final delay equals current delay",
        "train_window_utc": {"from": seen_at[0], "to": seen_at[split - 1]},
        "test_window_utc": {"from": seen_at[split], "to": seen_at[-1]},
        "rows": {"train": split, "test": len(features) - split},
        "mae_seconds": {"model": round(model_mae, 1), "baseline": round(baseline_mae, 1)},
        "mae_seconds_close_to_departure": {
            "under_minutes": CLOSE_MINUTES,
            "rows": int(close.sum()),
            "model": round(close_model_mae, 1),
            "baseline": round(close_baseline_mae, 1),
        },
        "seed": SEED,
        "epochs": EPOCHS,
        "versions": {"torch": torch.__version__},
        "trained_at_utc": datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
    })
    print(f"saved {MODEL_PATH} and {MODEL_CARD_PATH}")



if __name__ == "__main__":
    main()