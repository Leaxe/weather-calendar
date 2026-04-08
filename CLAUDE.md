# Weather Calendar

**These docs are a work in progress. When you encounter something missing or confusing in a doc, fix it immediately — don't wait until the end of the task.**

A webapp that visualizes weather on a weekly Google Calendar-style view. Calendar events overlay weather information so you can see at a glance what conditions to expect during upcoming events.

## Quick Start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
npm run lint     # eslint + prettier check
npm run format   # auto-format with prettier
```

**Always run `npm run format` before finishing work.** The project uses Prettier for consistent formatting. Lint will fail on unformatted code.

## Architecture

### Stack
- **React 19 + TypeScript** — strict mode, no `any`
- **Vite 5** — dev server and bundler
- **Tailwind CSS v3** + **shadcn/ui** — UI primitives and chrome styling
- **CSS Modules** — calendar layout and weather rendering
- **chroma-js** — perceptually uniform color science (LAB space)
- **Canvas API** — runtime-generated weather overlay textures
- **react-day-picker** — week selection calendar
- **ical.js** — ICS calendar file parsing

### How It Works

The calendar is a vertical scrollable grid (like Google Calendar week view). Each day column has two visual layers:

1. **Temperature gradient** — a CSS `linear-gradient` where each color stop is derived from that hour's temperature, mapped through a perceptually uniform bezier scale in LAB color space. All stops are normalized to equal LAB lightness (L=62) so weather overlays have consistent contrast. Night hours are darkened.

2. **Weather condition overlays** — full-day canvas textures rendered once per overlay type (cloud, rain, snow, fog). Density varies smoothly across the 24-hour height based on continuous intensity curves interpolated from hourly data using smoothstep. These sit on top of the gradient as absolutely positioned divs. The entire weather layer (gradient + overlays + night) fades in together via CSS animation.

### Key Design Decisions

- **Continuous weather model**: Weather data uses numeric channels (cloudCover 0-100, precipitation mm, snowfall cm, visibility m) instead of discrete condition strings. This allows smooth visual transitions between hours.
- **Overlay priority**: Snow > Rain > Clouds (mutually exclusive), Fog can layer with anything. Precipitation bleeds 15% into neighboring dry hours for natural transitions.
- **Equal luminance**: Temperature hues are normalized to LAB L=62 so overlays look equally visible regardless of the underlying temperature color.
- **Glassmorphism**: All interactive surfaces (popovers, tooltips, event cards, headers) use a consistent glass theme via `--glass-bg`/`--glass-border` CSS variables. Applied at the shadcn primitive level so consumers inherit it.
- **Styling split**: CSS modules for calendar-specific visual components (DayColumn, WeekHeader, EventCard, etc.) that need complex gradients, animations, and canvas overlays. Tailwind for UI chrome (buttons, popovers, inputs). Glass theme centralized via CSS custom properties consumed by both.
- **Live weather via Open-Meteo**: Free API, no key required. User selects a city via geocoding search; forecast is fetched and mapped to `DayData`/`HourlyData` types. Uses forecast API for future dates (+16 days) and archive API for past dates, with automatic splitting for mixed ranges.
- **Date navigation**: Week picker with arrow buttons and a calendar popover for week selection. Weeks beyond the 16-day forecast limit are disabled. Today's date is highlighted with a blue circle (Google Calendar style).
- **Calendar import**: Users can import .ics files or paste a calendar URL. ICS is parsed once on import; filtering to the visible week is a cheap array filter so week navigation stays fast. URL imports require a CORS proxy — in dev this is handled by `icsProxyPlugin` in `vite.config.ts`; in production by the `ics-proxy/` Cloudflare Worker.
- **Zoom**: Ctrl/Cmd+scroll or pinch-to-zoom adjusts hour height (30-150px), anchored to cursor position.

## Project Structure

See [src/ARCHITECTURE.md](src/ARCHITECTURE.md) for detailed module documentation.

```
src/
├── types.ts              # Shared domain types (HourlyData, DayData, CalendarEvent, GeoLocation, etc.)
├── App.tsx               # Root component — layout, state, data wiring
├── main.tsx              # Entry point
├── index.css             # Tailwind directives, CSS variables (theme, glass, z-index scale)
├── services/             # API layer (Open-Meteo weather + geocoding)
├── hooks/                # React hooks (useWeather, useCalendarEvents, usePersistedLocation, useIsMobile)
├── contexts/             # React contexts (ZoomContext for pinch/scroll zoom)
├── data/                 # Demo/mock data
├── utils/                # Core logic (color science, gradients, canvas textures, ICS parsing, time/date math)
├── components/           # UI components (calendar grid, day columns, events, tooltips, pickers)
│   └── ui/               # shadcn/ui primitives (button, popover, calendar, command, input, tooltip, alert, badge)
└── lib/                  # Utility helpers (cn() for class merging)
```
