# Weather Calendar

**This file and `src/ARCHITECTURE.md` are living documents that must stay in sync with the codebase. Any change to the project that affects architecture, module responsibilities, design decisions, or project structure should include corresponding updates to these docs.**

A proof-of-concept webapp that visualizes weather on a weekly Google Calendar-style view. Calendar events overlay weather information so you can see at a glance what conditions to expect during upcoming events.

## Quick Start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
npm run lint     # eslint + prettier check
npm run format   # auto-format with prettier
```

## Architecture

### Stack
- **React 19 + TypeScript** — strict mode, no `any`
- **Vite 5** — dev server and bundler
- **Tailwind CSS v3** + **shadcn/ui** — styling and UI primitives
- **chroma-js** — perceptually uniform color science (LAB space)
- **Canvas API** — runtime-generated weather overlay textures

### How It Works

The calendar is a vertical scrollable grid (like Google Calendar week view). Each day column has two visual layers:

1. **Temperature gradient** — a CSS `linear-gradient` where each color stop is derived from that hour's temperature, mapped through a perceptually uniform bezier scale in LAB color space. All stops are normalized to equal LAB lightness (L=62) so weather overlays have consistent contrast. Night hours are darkened.

2. **Weather condition overlays** — full-day canvas textures rendered once per overlay type (cloud, rain, snow, fog). Density varies smoothly across the 24-hour height based on continuous intensity curves interpolated from hourly data. These sit on top of the gradient as absolutely positioned divs.

### Key Design Decisions

- **Continuous weather model**: Weather data uses numeric channels (cloudCover 0-100, precipitation mm, snowfall cm, visibility m) instead of discrete condition strings. This allows smooth visual transitions between hours.
- **Overlay priority**: Snow > Rain > Clouds (mutually exclusive), Fog can layer with anything.
- **Equal luminance**: Temperature hues are normalized to LAB L=62 so overlays look equally visible regardless of the underlying temperature color.
- **Live weather via Open-Meteo**: Free API, no key required. User selects a city via geocoding search; forecast is fetched and mapped to `DayData`/`HourlyData` types. Uses forecast API for future dates (+16 days) and archive API for past dates, with automatic splitting for mixed ranges.
- **Date navigation**: Week view can be shifted forward/backward with arrow buttons. "Today" button jumps to current week. Live now indicator updates every 60 seconds. Today's date is highlighted in the header (Google Calendar style blue circle).

## Project Structure

See [src/ARCHITECTURE.md](src/ARCHITECTURE.md) for detailed module documentation.

```
src/
├── types.ts              # Shared domain types (HourlyData, DayData, CalendarEvent, GeoLocation, etc.)
├── App.tsx               # Root component — layout, state, data wiring
├── main.tsx              # Entry point
├── services/             # API layer (Open-Meteo weather + geocoding)
├── hooks/                # React hooks (useWeather, usePersistedLocation)
├── data/                 # Static data (mock events)
├── utils/                # Core logic (color science, gradients, canvas textures, time math)
├── components/           # UI components (calendar grid, day columns, events, tooltips, location picker)
│   └── ui/               # shadcn/ui primitives (button, toggle, tooltip)
├── styles/               # Custom CSS (global.css)
└── lib/                  # Utility helpers (cn() for tailwind class merging)
```
