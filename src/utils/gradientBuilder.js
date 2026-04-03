import { weatherToColor } from './colorScale';

/**
 * Builds a CSS linear-gradient string from hourly weather data.
 *
 * Instead of injecting hard-coded sunrise/sunset color stops, we add
 * extra interpolation points around dawn/dusk so the temperature-based
 * gradient naturally warms up there — the existing night-darkening in
 * weatherToColor already handles the day/night transition.
 */
export function buildDayGradient(hourlyData, sunrise, sunset) {
  const stops = [];

  // Generate a color stop for each hour
  for (const { hour, temp, condition } of hourlyData) {
    const isNight = hour < sunrise || hour > sunset;
    const pct = (hour / 24) * 100;
    const color = weatherToColor(temp, condition, isNight);
    stops.push({ pct, color });
  }

  // Add extra sub-hour stops around sunrise and sunset so the transition
  // between dark-night and bright-day isn't a single abrupt jump.
  const transitionOffsets = [-0.6, -0.3, 0, 0.3, 0.6];

  for (const anchor of [sunrise, sunset]) {
    for (const offset of transitionOffsets) {
      const h = anchor + offset;
      if (h < 0 || h > 24) continue;
      // Don't duplicate an existing whole-hour stop
      if (Number.isInteger(h)) continue;

      const pct = (h / 24) * 100;
      // Interpolate temp between the two surrounding hours
      const lowerIdx = Math.max(0, Math.min(23, Math.floor(h)));
      const upperIdx = Math.min(23, lowerIdx + 1);
      const frac = h - lowerIdx;
      const temp = hourlyData[lowerIdx].temp * (1 - frac) + hourlyData[upperIdx].temp * frac;
      const condition = hourlyData[Math.round(h)]?.condition || hourlyData[lowerIdx].condition;
      const isNight = h < sunrise || h > sunset;
      const color = weatherToColor(temp, condition, isNight);
      stops.push({ pct, color });
    }
  }

  // Sort by percentage
  stops.sort((a, b) => a.pct - b.pct);

  const gradientStops = stops.map(s => `${s.color} ${s.pct.toFixed(2)}%`).join(', ');
  return `linear-gradient(to bottom, ${gradientStops})`;
}

/**
 * Builds per-hour precipitation overlays from hourly data.
 * Each entry has its own opacity derived from precipitation %.
 * Returns an array of { hour, type, opacity }.
 */
export function buildPrecipitationOverlays(hourlyData) {
  const overlays = [];

  for (const { hour, condition, precipitation } of hourlyData) {
    const isPrecip = ['rain', 'heavy_rain', 'thunderstorm', 'snow'].includes(condition);
    if (!isPrecip) continue;

    const type = condition === 'snow' ? 'snow' : 'rain';
    // Map precipitation 0–100% → opacity 0.15–1.0
    const opacity = 0.15 + (Math.min(precipitation, 100) / 100) * 0.85;
    overlays.push({ hour, type, opacity });
  }

  return overlays;
}
