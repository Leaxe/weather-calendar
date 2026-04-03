import chroma from 'chroma-js';
import { weatherToColor } from './colorScale';
import type { HourlyData, WeatherOverlay } from '../types';

interface GradientStop {
  hour?: number;
  pct: number;
  color: string;
}

/**
 * Builds a CSS linear-gradient from hourly weather data.
 *
 * Generates color stops in LAB space via weatherToColor, then uses
 * chroma.js to add smooth sub-hour interpolation around sunrise/sunset.
 */
export function buildDayGradient(
  hourlyData: HourlyData[],
  sunrise: number,
  sunset: number,
): string {
  const rawStops: GradientStop[] = [];

  // One stop per hour
  for (const { hour, temp } of hourlyData) {
    const isNight = hour < sunrise || hour > sunset;
    const color = weatherToColor(temp, null, isNight);
    rawStops.push({ hour, pct: (hour / 24) * 100, color });
  }

  // Add sub-hour stops around sunrise/sunset for a smooth day↔night blend.
  // We interpolate between the "night" and "day" color at the boundary
  // using chroma.mix in LAB space for perceptually even fading.
  const transitionWidth = 0.8; // hours on each side
  const steps = 5;

  for (const anchor of [sunrise, sunset]) {
    const startH = anchor - transitionWidth;

    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const h = startH + t * (transitionWidth * 2);
      if (h < 0 || h > 24 || Number.isInteger(h)) continue;

      // Interpolate temperature
      const lowerIdx = Math.max(0, Math.min(23, Math.floor(h)));
      const upperIdx = Math.min(23, lowerIdx + 1);
      const frac = h - lowerIdx;
      const temp = hourlyData[lowerIdx].temp * (1 - frac) + hourlyData[upperIdx].temp * frac;
      const isNight = h < sunrise || h > sunset;
      const color = weatherToColor(temp, null, isNight);
      rawStops.push({ hour: h, pct: (h / 24) * 100, color });
    }
  }

  rawStops.sort((a, b) => a.pct - b.pct);

  // Now smooth adjacent stops using LAB interpolation — insert midpoints
  // between every pair for an even richer gradient.
  const finalStops: GradientStop[] = [];
  for (let i = 0; i < rawStops.length; i++) {
    finalStops.push(rawStops[i]);
    if (i < rawStops.length - 1) {
      const a = rawStops[i];
      const b = rawStops[i + 1];
      const midPct = (a.pct + b.pct) / 2;
      const midColor = chroma.mix(a.color, b.color, 0.5, 'lab').css();
      finalStops.push({ pct: midPct, color: midColor });
    }
  }

  const gradientStops = finalStops.map((s) => `${s.color} ${s.pct.toFixed(2)}%`).join(', ');
  return `linear-gradient(to bottom, ${gradientStops})`;
}

// --- Overlay intensity thresholds & scaling ---
// Cloud: minimum cloud cover % to show overlay, and divisor for intensity
const CLOUD_MIN_PCT = 10;
const CLOUD_SCALE = 100; // cloudCover / CLOUD_SCALE = intensity

// Rain: precip probability threshold when no actual precipitation, and max mm for full intensity
const RAIN_PROB_THRESHOLD = 40;
const RAIN_MAX_MM = 5; // precipitation mm that maps to intensity 1.0
const RAIN_MIN_INTENSITY = 0.05;

// Snow: max cm for full intensity
const SNOW_MAX_CM = 2; // snowfall cm that maps to intensity 1.0

// Fog: visibility threshold in meters (below this, fog overlay appears)
const FOG_VISIBILITY_THRESHOLD = 5000;

/**
 * Builds full-day intensity curves per overlay type.
 * Returns an array of { type, intensities: number[24] } — one entry per
 * active overlay type, with a 24-element array of 0–1 intensities.
 * Only includes types that have at least one non-zero hour.
 */
export function buildWeatherOverlays(hourlyData: HourlyData[]): WeatherOverlay[] {
  const cloud = new Float32Array(24);
  const rain = new Float32Array(24);
  const snow = new Float32Array(24);
  const fog = new Float32Array(24);

  for (const h of hourlyData) {
    const i = h.hour;

    // Snow and rain suppress clouds
    if (h.snowfall > 0) {
      snow[i] = Math.min(1, h.snowfall / SNOW_MAX_CM);
    } else if (h.precipitation > 0 || h.precipProb > RAIN_PROB_THRESHOLD) {
      rain[i] =
        h.precipitation > 0
          ? Math.min(1, h.precipitation / RAIN_MAX_MM)
          : Math.min(1, ((h.precipProb - RAIN_PROB_THRESHOLD) / (100 - RAIN_PROB_THRESHOLD)) * 0.3);
      rain[i] = Math.max(RAIN_MIN_INTENSITY, rain[i]);
    } else if (h.cloudCover > CLOUD_MIN_PCT) {
      cloud[i] = h.cloudCover / CLOUD_SCALE;
    }

    // Fog layers with anything
    if (h.visibility < FOG_VISIBILITY_THRESHOLD) {
      fog[i] = 1 - h.visibility / FOG_VISIBILITY_THRESHOLD;
    }
  }

  const results: WeatherOverlay[] = [];
  if (cloud.some((v) => v > 0)) results.push({ type: 'cloud', intensities: Array.from(cloud) });
  if (rain.some((v) => v > 0)) results.push({ type: 'rain', intensities: Array.from(rain) });
  if (snow.some((v) => v > 0)) results.push({ type: 'snow', intensities: Array.from(snow) });
  if (fog.some((v) => v > 0)) results.push({ type: 'fog', intensities: Array.from(fog) });
  return results;
}
