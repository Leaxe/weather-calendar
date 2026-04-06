# Architecture — Module Reference

## Domain Types (`types.ts`)

All shared interfaces:
- `HourlyData` — one hour's weather: temp, cloudCover, precipitation, snowfall, visibility, windSpeed, humidity, weatherCode
- `DayData` — a day: date, dayName, sunrise/sunset times, 24 HourlyData entries
- `CalendarEvent` — an event: id, title, date, start/end hour, optional location/description, isAllDay
- `GeoLocation` — a city: name, lat/lon, country, optional admin1 (state/province)
- `OverlayType` — `'cloud' | 'rain' | 'snow' | 'fog' | 'freezing_rain'`
- `WeatherOverlay` — a type + 24-element intensity array

## API Layer (`services/weatherApi.ts`)

Two functions for the Open-Meteo API (free, no key required):
- `searchCities(query, signal?)` — geocoding search, returns `GeoLocation[]`
- `fetchWeekForecast(lat, lon, startDate, signal?)` — 7-day hourly forecast starting from a given date. Auto-splits between forecast API (future/today) and archive API (past). Handles field renames (`temperature_2m→temp`, `cloud_cover→cloudCover`, etc.) and parses sunrise/sunset ISO strings into fractional hours.

## Hooks (`hooks/`)

- **`useWeather.ts`** — `useWeather(location, weekStartDate)` → `{ data, hasWeather, isLoading, error, refresh }`. Fetches weather with AbortController cleanup and 60-second cache. `refresh()` clears cache and re-fetches. Auto-refreshes hourly. Returns placeholder data when no location set.
- **`useCalendarEvents.ts`** — manages ICS calendar data in localStorage. ICS text is parsed once (via `parseICS`); filtering to the current week is a cheap array filter. URL-based calendars re-fetched on week change.
- **`usePersistedLocation.ts`** — reads/writes `GeoLocation` to localStorage. Returns `[location, setLocation]`.
- **`useIsMobile.ts`** — returns `true` when viewport < 768px.

## Contexts (`contexts/`)

- **`ZoomContext.tsx`** — provides `hourHeight` (30-150px), `setHourHeight`, `totalHeight`, `pixelToHour`. Used by WeekGrid for Ctrl/Cmd+scroll and pinch-to-zoom.

## Utils (`utils/`)

### Color & Gradient Engine
- **`colorScale.ts`** — temp→color via chroma.js bezier interpolation in LAB space. 8 hue stops normalized to equal lightness (L=62). Night darkening via `chroma.darken(1.8).desaturate(0.6)`.
- **`gradientBuilder.ts`** — `buildDayGradient()` generates CSS linear-gradient from hourly data with sub-hour interpolation and LAB-blended midpoints. `buildWeatherOverlays()` converts weather channels into per-type intensity arrays; precipitation bleeds 15% into neighboring dry hours. `getDarkness()` computes twilight with cosine transitions.

### Canvas Textures
- **`noiseTextures.ts`** — renders full-day canvas textures using seeded PRNG (mulberry32). Cloud/fog: elliptical blobs, multiple passes, blur. Rain: gradient trails (transparent→opaque via `createLinearGradient`) with splash dots, quadratic density boost for heavy rain. Snow: 3 tiers — large 6-armed crystals with glow, medium crosses, small dots. Freezing rain: thicker/different angle. Intensity via smoothstep interpolation with half-hour offset. Density scales with zoom and column width. Cached by type+seed+zoom+width+intensities.

### Other
- **`icsParser.ts`** — parses ICS via `ical.js`, expands recurring events (≤500 occurrences), splits multi-day events. Optional date range bounds.
- **`eventLayout.ts`** — overlap column layout for timed events (like Google Calendar).
- **`dateUtils.ts`** — `todayStr()`, `addDays()`, `getSunday()`, `toLocalDateStr()`. All YYYY-MM-DD strings.
- **`timeUtils.ts`** — hour formatting helpers (`formatHour`, `formatGutterHour`, `formatTimeRange`).
- **`weatherConditions.ts`** — maps numeric weather channels to condition labels/icons for tooltip.

## Components

### Layout
- **`App.tsx`** — root. Desktop header: logo + title + DateRangePicker + CalendarImport + LocationPicker. Mobile: compact two-row header. Also renders error alert, WeekGrid, loading toast. Wrapped in ZoomProvider.
- **`WeekGrid.tsx`** — scroll container with sticky WeekHeader + TimeGutter + 7 DayColumns. Auto-scrolls to 7 AM. Handles zoom gestures.
- **`WeekHeader.tsx`** — sticky, glassmorphic. Day names, date numbers (blue circle for today), temp ranges.
- **`TimeGutter.tsx`** — sticky left column with hour labels.

### Day Column (`DayColumn.tsx`)
The core visual component. Renders in z-order:
1. Placeholder background (solid color at default temp)
2. Weather gradient + overlays + night darkening + sun markers (fade in together via CSS `@keyframes`, 1.5s)
3. Hour gridlines
4. Event card backgrounds (glassmorphic, z:3)
5. Night overlay (z:6), sun markers (z:7), now indicator (z:8)
6. Event card labels (z:9)

Column width tracked via ResizeObserver for texture generation.

### Supporting
- **`EventCard.tsx`** — `EventCardBackground` (glassmorphic card, z:3) + `EventCardLabel` (text, z:9)
- **`WeatherTooltip.tsx`** — desktop: floating glassmorphic card. Mobile: bottom sheet. Both use `--glass-bg`/`--glass-border`.
- **`SunMarker.tsx`** — glowing line + time label at sunrise/sunset
- **`NowIndicator.tsx`** — red dot + line at current time, updates every 60s
- **`Logo.tsx`** — SVG logo

### Pickers
- **`DateRangePicker.tsx`** — `[< | date range | >]` input group. Calendar popover with week selection (row hover, today button in footer). Weeks past forecast range disabled.
- **`LocationPicker.tsx`** — city search (command palette), refresh (clears weather cache), clear.
- **`CalendarImport.tsx`** — file drag-drop or URL paste, refresh, clear.

All three use the same input group pattern: `border-white/10 bg-white/5 backdrop-blur-sm` container with `bg-border/50` dividers and `hover:bg-accent` buttons.

### UI Primitives (`components/ui/`)
shadcn/ui components — owned source files, styled with Tailwind + CSS variables. Glass theme baked into `PopoverContent` and `TooltipContent` via `--glass-bg`/`--glass-border`. Calendar has transparent bg (inherits popover glass), week-row hover, borderless day buttons.

## Styling

### CSS Custom Properties (`index.css`)
- `--bg`, `--text-primary`, `--text-secondary`, `--border-color` — base dark theme
- `--glass-bg`, `--glass-border` — glassmorphism (popover, tooltip, header, toast)
- `--z-event-bg` through `--z-now-indicator` — day column z-index scale
- `--gutter-width`, `--day-header-height` — layout dimensions
- shadcn HSL variables (`--primary`, `--accent`, `--popover`, etc.)

### Approach
CSS modules for calendar visuals (DayColumn, WeekHeader, EventCard, etc.). Tailwind for UI chrome (shadcn components, layout utilities). Glass theme centralized via CSS custom properties.
