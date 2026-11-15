# Design mocks

Static HTML mocks made before the frontend was built, to choose the look. Open a file in a browser; each one is self-contained and resizes down to phone width. They load two fonts from Google Fonts, so they need a network connection to look as intended.

The data in them is sample data, not real departures. The model numbers (113.0 s against 159.2 s, 22,488 training departures) are the real ones from `ai-worker/models/model_card.json`.

## Chosen direction: colour tiles

| File | Screen |
|---|---|
| [commutes.html](commutes.html) | My commutes: the "leave in" answer, other commutes, departures, model card |
| [departures.html](departures.html) | Departures tab: stop search, live departures, model card |
| [commute-form.html](commute-form.html) | Create or edit a commute, with one field in its error state |
| [states.html](states.html) | Loading, empty, error, delete confirmation, and a commute card with the model offline |

## Directions that were not chosen

| File | Direction |
|---|---|
| [direction-a-departure-board.html](direction-a-departure-board.html) | Dark station departure board with amber split-flap digits |
| [direction-b-transit-poster.html](direction-b-transit-poster.html) | Transit poster: cobalt and acid yellow, thick outlines |

The mocks are a reference for the look, not a specification. Where the application differs (for example the share link, or the dark colour scheme), the application is right.
