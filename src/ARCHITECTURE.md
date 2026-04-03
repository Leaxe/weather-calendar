# Architecture — Module Reference

**This is a living document. Any change that adds, removes, renames, or significantly alters a module's behavior should include an update to the relevant section here.**

## Domain Types (`types.ts`)

All shared interfaces live here. Key types:
- `HourlyData` — one hour's weather: temp, cloudCover, precipProb, precipitation, snowfall, visibility, windSpeed, humidity
- `DayData` — a day: date, dayName, sunrise/sunset times, 24 HourlyData entries
- `CalendarEvent` — an event: id, title, day index, start/end hour
- `GeoLocation` — a city: name, lat/lon, country, optional admin1 (state/province)
- `OverlayType` — `'cloud' | 'rain' | 'snow' | 'fog'`
- `WeatherOverlay` — a type + 24-element intensity array

## Data Layer (`data/`)

### `mockWeather.ts`
Generates a week of weather data using keyframe-based cosine interpolation. Each day is defined by keyframes for each channel (cloud cover, precipitation, snowfall, visibility, etc.) and `interpolate()` smoothly fills in all 24 hours. The week tells a story: clear Mon → building clouds Tue → rain Wed → snow-to-rain Thu → clearing Fri → nice weekend.

### `mockEvents.ts`
Static array of `CalendarEvent` objects. Events are positioned by day index (0=Mon) and decimal start/end hours.

## API Layer (`services/`)

### `weatherApi.ts`
Two functions for the Open-Meteo API (free, no key required):
- `searchCities(query, signal?)` — geocoding search, returns `GeoLocation[]`
- `fetchWeekForecast(lat, lon, signal?)` — 7-day hourly forecast, maps the API response into `DayData[]` matching the same types the mock data uses. Handles field renames (`temperature_2m→temp`, `cloud_cover→cloudCover`, etc.) and parses sunrise/sunset ISO strings into fractional hours.

## Hooks (`hooks/`)

### `useWeather.ts`
React hook: `useWeather(location: GeoLocation | null) → { data, isLoading, error, source }`. When location is null, returns mock data. When set, fetches from the API with AbortController cleanup and a 60-second cache. Falls back to mock data on error.

### `usePersistedLocation.ts`
Reads/writes the selected `GeoLocation` to localStorage (`weather-calendar-location` key). Returns `[location, setLocation]` tuple.

## Color & Gradient Engine (`utils/`)

### `colorScale.ts`
Maps temperature → color using chroma.js bezier interpolation in LAB space. The 8 hue stops (blue→cyan→green→yellow→orange→red) are normalized at runtime to equal LAB lightness (`TARGET_L = 62`), ensuring weather overlays have uniform contrast across all temperatures. Night darkening is applied via `chroma.darken(1.8).desaturate(0.6)`.

### `gradientBuilder.ts`
- `buildDayGradient()` — generates a CSS `linear-gradient` string from hourly data. Adds sub-hour interpolation points around sunrise/sunset and LAB-blended midpoints between all stops for smooth transitions.
- `buildWeatherOverlays()` — converts 24 hours of numeric weather channels into per-type intensity arrays. Returns `WeatherOverlay[]` where each entry has a type and a 24-element float array.

### `noiseTextures.ts`
Renders full-day (1440px tall) canvas textures for weather overlays. Uses a seeded PRNG (mulberry32) for reproducible randomness. Each overlay type has distinct rendering:
- **Cloud/Fog**: Elliptical blobs with configurable stretch, multiple passes, blur via scale-down-then-up trick
- **Rain**: Short diagonal lines at ~78° angle
- **Snow**: Mix of 6-armed branching snowflakes (larger) and soft dots (smaller), with blur

Element density and alpha scale with `sampleIntensity()` which linearly interpolates the intensity curve at the exact y-position, giving smooth variation across hours.

### `timeUtils.ts`
Constants (`HOUR_HEIGHT = 60px`, `TOTAL_HEIGHT = 1440px`) and helpers for hour↔pixel conversion, time formatting, and condition display (maps numeric channels to dominant condition icon/label).

## Components

### Layout
- `App.tsx` — holds `showDetails` state, wires `usePersistedLocation` + `useWeather` hooks, renders header (with LocationPicker + DetailToggle), loading/error banners, WeekHeader + WeekGrid
- `WeekHeader.tsx` — day name, date number, high/low temp per column
- `WeekGrid.tsx` — scrollable container with TimeGutter + 7 DayColumns, auto-scrolls to 7 AM
- `TimeGutter.tsx` — left column with hour labels (12 AM–11 PM)

### Day Column (`DayColumn.tsx`)
The core visual component. Renders:
1. Temperature gradient background (full 1440px height)
2. Hour gridlines
3. Weather overlay divs (one per active overlay type, full-day canvas textures)
4. Sunrise/sunset markers
5. Current-time indicator (NowIndicator)
6. Event cards
7. Detail chips (when toggled)
8. Mouse-following weather tooltip

### Supporting Components
- `SunMarker.tsx` — glowing horizontal line at sunrise/sunset position
- `NowIndicator.tsx` — red dot + line at simulated current time (Wed 10:30 AM)
- `EventCard.tsx` — absolutely positioned card, sized by event duration
- `WeatherTooltip.tsx` — cursor-following tooltip showing temp, condition, precip, wind, visibility
- `DetailToggle.tsx` — shadcn Toggle button to pin weather detail chips on all columns
- `LocationPicker.tsx` — city search dropdown in the header. Debounced input calls geocoding API, displays results, persists selection via parent callback. Uses shadcn Button + lucide icons (MapPin, Search, X).

### UI Primitives (`components/ui/`)
shadcn/ui components (Button, Toggle, Tooltip) — owned source files, styled with Tailwind + CSS variables.

## Styling

### `styles/global.css`
Custom CSS for calendar-specific layout: grid structure, day column, gridlines, weather overlay positioning, sun markers, event cards, now indicator, scrollbar. Uses CSS custom properties for theming.

### `index.css`
Tailwind directives + shadcn/ui CSS variable definitions (light + dark themes). The app uses dark theme via `class="dark"` on `<html>`.

### Tailwind
Used for shadcn/ui components and the weather tooltip. Config in `tailwind.config.js` with shadcn theme extensions.
