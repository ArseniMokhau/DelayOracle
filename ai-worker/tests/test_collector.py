import collector

STOP_ID = 1016


def realtime_row(delay_s: int, estimated: str) -> dict:
    """Synthetic ZTM row, only for these tests."""
    return {
        "status": "REALTIME",
        "trip": 30353510,
        "theoreticalTime": "2026-11-14T17:21:00Z",
        "routeId": 154,
        "headsign": "Jana z Kolna",
        "delayInSeconds": delay_s,
        "estimatedTime": estimated,
    }


def poll(con, monkeypatch, seen_at: str, rows: list[dict]) -> None:
    """Runs one poll in which ZTM answers `rows` and the clock shows `seen_at`."""
    monkeypatch.setattr(collector, "fetch_departures", lambda stop_id: rows)
    monkeypatch.setattr(collector, "utc_now", lambda: seen_at)
    collector.poll_once(con, [STOP_ID], pause=0)


def test_every_sighting_of_a_departure_is_kept(tmp_path, monkeypatch):
    con = collector.connect(str(tmp_path / "test.db"))

    poll(con, monkeypatch, "2026-11-14T16:55:00Z", [realtime_row(60, "2026-11-14T17:22:00Z")])
    poll(con, monkeypatch, "2026-11-14T17:10:00Z", [realtime_row(150, "2026-11-14T17:23:30Z")])
    poll(con, monkeypatch, "2026-11-14T17:20:00Z", [realtime_row(205, "2026-11-14T17:24:25Z")])

    sightings = con.execute(
        "SELECT stop_id, trip, theoretical, seen_at, delay_s, estimated "
        "FROM sightings ORDER BY seen_at"
    ).fetchall()
    assert sightings == [
        (STOP_ID, 30353510, "2026-11-14T17:21:00Z",
         "2026-11-14T16:55:00Z", 60, "2026-11-14T17:22:00Z"),
        (STOP_ID, 30353510, "2026-11-14T17:21:00Z",
         "2026-11-14T17:10:00Z", 150, "2026-11-14T17:23:30Z"),
        (STOP_ID, 30353510, "2026-11-14T17:21:00Z",
         "2026-11-14T17:20:00Z", 205, "2026-11-14T17:24:25Z"),
    ]


def test_departure_summary_still_has_first_and_last_sighting(tmp_path, monkeypatch):
    con = collector.connect(str(tmp_path / "test.db"))

    poll(con, monkeypatch, "2026-11-14T16:55:00Z", [realtime_row(60, "2026-11-14T17:22:00Z")])
    poll(con, monkeypatch, "2026-11-14T17:20:00Z", [realtime_row(205, "2026-11-14T17:24:25Z")])

    summary = con.execute(
        "SELECT first_seen_at, first_delay_s, last_seen_at, last_delay_s, sightings "
        "FROM departures"
    ).fetchall()
    assert summary == [("2026-11-14T16:55:00Z", 60, "2026-11-14T17:20:00Z", 205, 2)]


def test_scheduled_rows_are_not_stored(tmp_path, monkeypatch):
    con = collector.connect(str(tmp_path / "test.db"))
    scheduled = realtime_row(0, "2026-11-14T17:21:00Z") | {"status": "SCHEDULED"}

    poll(con, monkeypatch, "2026-11-14T16:55:00Z", [scheduled])

    assert con.execute("SELECT COUNT(*) FROM sightings").fetchone()[0] == 0
    assert con.execute("SELECT COUNT(*) FROM departures").fetchone()[0] == 0
