"""The delay network, and saving and loading it. Used by train.py and app.py."""
from pathlib import Path

import torch
from torch import nn


class DelayModel(nn.Module):
    """Predicts how many seconds the delay will change between now and the departure."""

    def __init__(self, feature_count: int, hidden_size: int):
        super().__init__()
        self.layers = nn.Sequential(
            nn.Linear(feature_count, hidden_size),
            nn.ReLU(),
            nn.Linear(hidden_size, hidden_size),
            nn.ReLU(),
            nn.Linear(hidden_size, 1),
        )

    def forward(self, features: torch.Tensor) -> torch.Tensor:
        return self.layers(features).squeeze(-1)


def save_model(path: str, model: DelayModel, mean: torch.Tensor, std: torch.Tensor) -> None:
    """Saves the weights together with the scaling they were trained with."""
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    torch.save(
        {
            "state_dict": model.state_dict(),
            "mean": mean,
            "std": std,
            "feature_count": model.layers[0].in_features,
            "hidden_size": model.layers[0].out_features,
        },
        path,
    )


def load_model(path: str) -> tuple[DelayModel, torch.Tensor, torch.Tensor]:
    """Returns the model in prediction mode, and the mean and std to scale features with."""
    saved = torch.load(path, weights_only=True)
    model = DelayModel(saved["feature_count"], saved["hidden_size"])
    model.load_state_dict(saved["state_dict"])
    model.eval()
    return model, saved["mean"], saved["std"]


def predict_delay_changes(
    model: DelayModel, mean: torch.Tensor, std: torch.Tensor, feature_rows: list[list[float]]
) -> list[float]:
    """Predicted change of the delay, in seconds, for each row of features."""
    if not feature_rows:
        return []
    features = torch.tensor(feature_rows, dtype=torch.float32)
    with torch.inference_mode():
        return model((features - mean) / std).tolist()