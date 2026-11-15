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
    } | overrides
    return dict(zip(FEATURE_NAMES, build_features(**arguments), strict=True))


def test_features_are_delay_minutes_and_hour():
    assert FEATURE_NAMES == ["current_delay_s", "minutes_to_departure", "hour"]


def test_returns_one_number_per_feature_name():
    assert len(build_features(0, utc(13, 8, 30), utc(13, 8, 0))) == len(FEATURE_NAMES)


def test_current_delay_is_passed_through():
    assert features_by_name(current_delay_s=120)["current_delay_s"] == 120


def test_minutes_to_departure_is_scheduled_time_minus_observation_time():
    features = features_by_name(scheduled_time=utc(13, 8, 30), observed_at=utc(13, 8, 4))

    assert features["minutes_to_departure"] == 26


def test_hour_is_local_time_in_gdansk():
    # In November Gdańsk is one hour ahead of UTC.
    assert features_by_name(scheduled_time=utc(13, 8, 30))["hour"] == 9
    assert features_by_name(scheduled_time=utc(13, 23, 30))["hour"] == 0


def test_time_without_a_time_zone_is_rejected():
    with pytest.raises(ValueError):
        build_features(0, datetime(2026, 11, 13, 8, 30), utc(13, 8, 0))
