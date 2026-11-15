"""Turns one departure into the numbers the model sees.

Training and serving both call build_features, so the model is always asked
about a departure in exactly the form it was trained on.
"""
from datetime import datetime
from zoneinfo import ZoneInfo

# The order here is the order of the numbers that build_features returns.
FEATURE_NAMES = [
    "current_delay_s",
    "minutes_to_departure",
    "hour",
    "weekday",
    "precip_mm",
    "temp_c",
]

# People travel by local time, so the hour and weekday are taken in Gdańsk's time zone.
LOCAL_ZONE = ZoneInfo("Europe/Warsaw")


def build_features(
    current_delay_s: float,
    scheduled_time: datetime,
    observed_at: datetime,
    precip_mm: float,
    temp_c: float,
) -> list[float]:
    """One row of features for a departure seen at `observed_at`.

    Both times must carry a time zone (for example UTC).
    """
    if scheduled_time.tzinfo is None or observed_at.tzinfo is None:
        raise ValueError("scheduled_time and observed_at must have a time zone")

    minutes_to_departure = (scheduled_time - observed_at).total_seconds() / 60
    local_time = scheduled_time.astimezone(LOCAL_ZONE)
    return [
        float(current_delay_s),
        minutes_to_departure,
        float(local_time.hour),
        float(local_time.weekday()),  # Monday is 0
        float(precip_mm),
        float(temp_c),
    ]
