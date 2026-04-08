# Weather Calendar

A webapp that visualizes weather on a weekly Google Calendar-style view. Calendar events overlay weather information so you can see at a glance what conditions to expect during upcoming events.

## Features

- **Weather-overlaid calendar** — temperature gradients, cloud/rain/snow/fog overlays rendered as canvas textures on a scrollable week grid
- **Live weather** — powered by Open-Meteo (free, no API key required). Supports forecast (+16 days) and historical data
- **Calendar import** — drag-and-drop .ics files or paste a calendar URL
- **Responsive** — full week view on desktop, single-day swipeable view on mobile
- **Hover tooltips** (desktop) — hourly weather detail follows cursor; event hover shows range summary
- **Tap/click banner** (desktop + mobile) — sticky bottom bar with weather detail and day of week
- **Ghost events** — click-drag (desktop) or long-press + drag (mobile) to select a time range and see aggregated weather
- **Zoom** — Ctrl/Cmd+scroll or pinch-to-zoom adjusts hour height
- **City search** — geocoding-powered location picker

## Quick Start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
npm run lint     # eslint + prettier check
npm run format   # auto-format with prettier
```

## Tech Stack

- React 19 + TypeScript (strict)
- Vite 5
- Tailwind CSS v3 + shadcn/ui
- CSS Modules for calendar visuals
- chroma-js for perceptually uniform color science
- Canvas API for weather overlay textures
