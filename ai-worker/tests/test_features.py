from datetime import UTC, datetime

import pytest

from features import FEATURE_NAMES, build_features


def utc(day: int, hour: int, minute: int) -> datetime:
    return datetime(2026, 11, day, hour, minute, tzinfo=UTC)


def features_by_name(**overrides) -> dict[str, float]:
    arguments = {
        "current_delay_s": 120,
        "scheduled_time": utc(13, 8, 30),
        "observed_at": utc(13, 8, 4),
        "precip_mm": 0.4,
        "temp_c": 6.5,
    } | overrides
    return dict(zip(FEATURE_NAMES, build_features(**arguments), strict=True))


def test_returns_one_number_per_feature_name():
    assert len(build_features(0, utc(13, 8, 30), utc(13, 8, 0), 0.0, 5.0)) == len(FEATURE_NAMES)


def test_delay_and_weather_are_passed_through():
    features = features_by_name()

    assert features["current_delay_s"] == 120
    assert features["precip_mm"] == 0.4
    assert features["temp_c"] == 6.5


def test_minutes_to_departure_is_scheduled_time_minus_observation_time():
    features = features_by_name(scheduled_time=utc(13, 8, 30), observed_at=utc(13, 8, 4))

    assert features["minutes_to_departure"] == 26


def test_hour_is_local_time_in_gdansk():
    # In November Gdańsk is one hour ahead of UTC.
    features = features_by_name(scheduled_time=utc(13, 8, 30))

    assert features["hour"] == 9


def test_weekday_is_local_and_monday_is_zero():
    # 13 November 2026 is a Friday (4). 23:30 UTC is already Saturday (5) in Gdańsk.
    assert features_by_name(scheduled_time=utc(13, 8, 30))["weekday"] == 4
    assert features_by_name(scheduled_time=utc(13, 23, 30))["weekday"] == 5


def test_time_without_a_time_zone_is_rejected():
    with pytest.raises(ValueError):
        build_features(0, datetime(2026, 11, 13, 8, 30), utc(13, 8, 0), 0.0, 5.0)
