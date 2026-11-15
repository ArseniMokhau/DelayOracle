"""Downloads hourly weather for the days covered by the collected departures.

Usage:
  python weather.py                    # reads data/sample/delays.db, writes data/sample/weather.csv

Run it once after collecting. Training then reads the CSV and needs no network.
Needs only the Python standard library. Times are UTC. Weather data: Open-Meteo.
"""
import argparse
import csv
import json
import sqlite3
import urllib.parse
import urllib.request

API_URL = "https://api.open-meteo.com/v1/forecast"
# Gdańsk city centre; one location is used for every stop.
LATITUDE = 54.352
LONGITUDE = 18.6466


def collected_dates(db_path: str) -> tuple[str, str]:
    """First and last UTC date (YYYY-MM-DD) that has a departure."""
    con = sqlite3.connect(db_path)
    try:
        first, last = con.execute(
            "SELECT MIN(date(theoretical)), MAX(date(theoretical)) FROM departures"
        ).fetchone()
    finally:
        con.close()
    if first is None:
        raise SystemExit(f"No departures in {db_path}; run collector.py first.")
    return first, last


def download_hourly(start_date: str, end_date: str) -> list[tuple[str, float, float]]:
    """Rows of (hour in UTC, temperature in °C, precipitation in mm)."""
    query = urllib.parse.urlencode({
        "latitude": LATITUDE,
        "longitude": LONGITUDE,
        "hourly": "temperature_2m,precipitation",
        "start_date": start_date,
        "end_date": end_date,
        "timezone": "UTC",
    })
    request = urllib.request.Request(
        f"{API_URL}?{query}", headers={"User-Agent": "delayoracle-weather"}
    )
    with urllib.request.urlopen(request, timeout=15) as response:
        hourly = json.load(response)["hourly"]
    times = [f"{time}:00Z" for time in hourly["time"]]
    return list(zip(times, hourly["temperature_2m"], hourly["precipitation"], strict=True))


def write_csv(path: str, rows: list[tuple[str, float, float]]) -> None:
    with open(path, "w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["time_utc", "temp_c", "precip_mm"])
        writer.writerows(rows)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", default="data/sample/delays.db")
    parser.add_argument("--out", default="data/sample/weather.csv")
    args = parser.parse_args()

    start_date, end_date = collected_dates(args.db)
    rows = download_hourly(start_date, end_date)
    write_csv(args.out, rows)
    print(f"Wrote {len(rows)} hours ({start_date} to {end_date}) to {args.out}")


if __name__ == "__main__":
    main()
