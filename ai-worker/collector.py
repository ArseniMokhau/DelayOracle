"""DelayOracle data collector: one row per departure, updated on every sighting.

Usage:
  python collector.py                  # collect (first run scans stops and selects 120)
  python collector.py --reselect       # add ~120 more stops (run once on a weekday morning)
  python collector.py --report         # show how much usable training data exists
  python collector.py --stops 150 --interval 120 --pause 0.15

Needs only the Python standard library. Stop with Ctrl+C; it resumes safely.
All timestamps are stored in UTC. Data: ZTM Gdańsk open data (CC BY), attribute in the README.
"""
import argparse
import json
import random
import sqlite3
import time
import urllib.request
from datetime import UTC, datetime

STOPS_URL = (
    "https://ckan.multimediagdansk.pl/dataset/c24aa637-3619-4dc2-a171-a23eec8f2172"
    "/resource/d3e96eb6-25ad-4d6c-8651-b1eb39155945/download/stopsingdansk.json"
)
DEPARTURES_URL = "https://ckan2.multimediagdansk.pl/departures?stopId={}"

SCHEMA = """
CREATE TABLE IF NOT EXISTS departures (
    stop_id INTEGER NOT NULL, trip INTEGER NOT NULL, theoretical TEXT NOT NULL,
    route_id TEXT, headsign TEXT,
    first_seen_at TEXT NOT NULL, first_delay_s INTEGER,
    last_seen_at TEXT NOT NULL, last_delay_s INTEGER, last_estimated TEXT,
    sightings INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (stop_id, trip, theoretical)
);
CREATE TABLE IF NOT EXISTS stops (
    stop_id INTEGER PRIMARY KEY, name TEXT, selected INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS poll_log (
    polled_at TEXT, stops_ok INTEGER, stops_failed INTEGER, rows_seen INTEGER
);
"""

UPSERT = """
INSERT INTO departures (stop_id, trip, theoretical, route_id, headsign,
                        first_seen_at, first_delay_s, last_seen_at, last_delay_s, last_estimated)
VALUES (?,?,?,?,?,?,?,?,?,?)
ON CONFLICT(stop_id, trip, theoretical) DO UPDATE SET
    last_seen_at = excluded.last_seen_at,
    last_delay_s = excluded.last_delay_s,
    last_estimated = excluded.last_estimated,
    sightings = sightings + 1
"""


def utc_now() -> str:
    return datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")


def get_json(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": "delayoracle-collector"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.load(resp)


def find_list(obj, key: str):
    if isinstance(obj, dict):
        if isinstance(obj.get(key), list):
            return obj[key]
        for value in obj.values():
            found = find_list(value, key)
            if found is not None:
                return found
    return None


def fetch_departures(stop_id: int):
    return find_list(get_json(DEPARTURES_URL.format(stop_id)), "departures") or []


def connect(path: str) -> sqlite3.Connection:
    con = sqlite3.connect(path)
    con.execute("PRAGMA journal_mode=WAL")
    con.executescript(SCHEMA)
    return con


def select_stops(con, count: int, pause: float):
    """Scan all stops once; add a random sample of the ones that currently have departures."""
    stops = [s for s in (find_list(get_json(STOPS_URL), "stops") or []) if s.get("stopId")]
    already = {r[0] for r in con.execute("SELECT stop_id FROM stops WHERE selected = 1")}
    print(f"Scanning {len(stops)} stops, this takes several minutes ...")
    active = []
    for s in stops:
        if s["stopId"] in already:
            continue
        try:
            if fetch_departures(s["stopId"]):
                active.append(s)
        except Exception:  # noqa: BLE001 - a failing stop is just skipped
            pass
        time.sleep(pause)
    random.Random(42).shuffle(active)
    for s in active[:count]:
        con.execute(
            "INSERT INTO stops (stop_id, name, selected) VALUES (?,?,1) "
            "ON CONFLICT(stop_id) DO UPDATE SET selected = 1",
            (s["stopId"], s.get("stopName")),
        )
    con.commit()
    print(f"Added {min(count, len(active))} stops ({len(active)} active candidates found).")


def poll_once(con, stop_ids, pause: float):
    ok = failed = seen = 0
    for stop_id in stop_ids:
        try:
            rows = fetch_departures(stop_id)
        except Exception:  # noqa: BLE001
            failed += 1
            time.sleep(pause)
            continue
        ok += 1
        now = utc_now()
        for r in rows:
            # Only REALTIME rows carry a real delay; SCHEDULED rows are just the timetable.
            is_realtime = r.get("status") == "REALTIME"
            if not is_realtime or r.get("trip") is None or not r.get("theoreticalTime"):
                continue
            seen += 1
            con.execute(UPSERT, (
                stop_id, r["trip"], r["theoreticalTime"], str(r.get("routeId")), r.get("headsign"),
                now, r.get("delayInSeconds"), now, r.get("delayInSeconds"), r.get("estimatedTime"),
            ))
        time.sleep(pause)
    con.execute("INSERT INTO poll_log VALUES (?,?,?,?)", (utc_now(), ok, failed, seen))
    con.commit()
    return ok, failed, seen


def report(con):
    one = lambda sql: con.execute(sql).fetchone()[0]  # noqa: E731
    total = one("SELECT COUNT(*) FROM departures")
    # "Good label": last sighting was within 5 min of the estimated departure,
    # so last_delay_s is close to the true delay.
    good_sql = ("FROM departures WHERE last_estimated IS NOT NULL AND last_delay_s IS NOT NULL "
                "AND ABS(julianday(last_estimated) - julianday(last_seen_at)) * 1440 <= 5")
    good = one(f"SELECT COUNT(*) {good_sql}")
    print(f"stops polled:        {one('SELECT COUNT(*) FROM stops WHERE selected = 1')}")
    print(f"polls run:           {one('SELECT COUNT(*) FROM poll_log')}")
    poll_range = con.execute("SELECT MIN(polled_at), MAX(polled_at) FROM poll_log").fetchone()
    print(f"first / last poll:   {poll_range}")
    print(f"departures stored:   {total}")
    print(f"with good label:     {good}  <- this is the usable training set size")
    days = one("SELECT COUNT(DISTINCT date(theoretical, 'localtime')) FROM departures")
    print(f"distinct days:       {days}")

    hours = dict(con.execute(
        "SELECT CAST(strftime('%H', theoretical, 'localtime') AS INTEGER), COUNT(*) "
        f"{good_sql} GROUP BY 1"))
    print("good labels by local hour:", " ".join(f"{h:02d}:{hours.get(h, 0)}" for h in range(24)))
    wk = dict(con.execute(
        f"SELECT strftime('%w', theoretical, 'localtime'), COUNT(*) {good_sql} GROUP BY 1"))
    print("good labels by weekday (0=Sun):", " ".join(f"{d}:{wk.get(str(d), 0)}" for d in range(7)))

    gaps = con.execute(
        "SELECT polled_at, LAG(polled_at) OVER (ORDER BY polled_at) FROM poll_log").fetchall()
    long_gaps = 0
    for cur, prev in gaps:
        if prev and (datetime.fromisoformat(cur.replace("Z", "+00:00"))
                     - datetime.fromisoformat(prev.replace("Z", "+00:00"))).total_seconds() > 600:
            long_gaps += 1
    print(f"gaps longer than 10 min: {long_gaps} (laptop asleep or offline)")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", default="delays.db")
    parser.add_argument("--stops", type=int, default=120)
    parser.add_argument("--interval", type=int, default=120, help="seconds between poll cycles")
    parser.add_argument("--pause", type=float, default=0.15, help="seconds between requests")
    parser.add_argument("--reselect", action="store_true", help="add more stops, then exit")
    parser.add_argument("--report", action="store_true")
    args = parser.parse_args()

    con = connect(args.db)
    if args.report:
        return report(con)
    if args.reselect or not con.execute("SELECT 1 FROM stops WHERE selected = 1").fetchone():
        select_stops(con, args.stops, args.pause)
        if args.reselect:
            return None

    stop_ids = [r[0] for r in con.execute("SELECT stop_id FROM stops WHERE selected = 1")]
    print(f"Collecting from {len(stop_ids)} stops every {args.interval}s. Ctrl+C to stop.")
    try:
        while True:
            started = time.time()
            ok, failed, seen = poll_once(con, stop_ids, args.pause)
            stamp = f"{datetime.now():%Y-%m-%d %H:%M:%S}"
            print(f"{stamp}  ok={ok} failed={failed} realtime_rows={seen}")
            time.sleep(max(0, args.interval - (time.time() - started)))
    except KeyboardInterrupt:
        print("\nStopped. Run with --report to see what you have.")
    return None


if __name__ == "__main__":
    main()
