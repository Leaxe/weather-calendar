import chroma from 'chroma-js';
import { weatherToColor } from './colorScale';
import type { HourlyData, OverlayType, WeatherOverlay } from '../types';

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

// Precipitation: max mm for full intensity (applies to rain, snow, freezing rain)
const PRECIP_MAX_MM = 5;

// Fog: visibility threshold in meters (below this, fog overlay appears)
const FOG_VISIBILITY_THRESHOLD = 5000;

/**
 * Map WMO weather code to a precipitation overlay type.
 * Returns null for non-precipitation codes (clear, clouds, fog).
 *
 * WMO codes:
 *   51-55: Drizzle → rain
 *   56-57: Freezing drizzle → freezing_rain
 *   61-65: Rain → rain
 *   66-67: Freezing rain → freezing_rain
 *   71-77: Snow → snow
 *   80-82: Rain showers → rain
 *   85-86: Snow showers → snow
 *   95-99: Thunderstorm → rain
 */
function weatherCodeToOverlay(code: number): OverlayType | null {
  if (code >= 51 && code <= 55) return 'rain';
  if (code >= 56 && code <= 57) return 'freezing_rain';
  if (code >= 61 && code <= 65) return 'rain';
  if (code >= 66 && code <= 67) return 'freezing_rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain';
  if (code >= 85 && code <= 86) return 'snow';
  if (code >= 95 && code <= 99) return 'rain';
  return null;
}

/**
 * Builds full-day intensity curves per overlay type.
 * Uses WMO weather_code to determine precipitation type (rain/snow/freezing rain),
 * precipitation mm for intensity, cloud cover for cloud overlay, visibility for fog.
 * Returns an array of { type, intensities: number[24] }.
 */
export function buildWeatherOverlays(hourlyData: HourlyData[]): WeatherOverlay[] {
  const cloud = new Float32Array(24);
  const rain = new Float32Array(24);
  const snow = new Float32Array(24);
  const freezingRain = new Float32Array(24);
  const fog = new Float32Array(24);

  for (const h of hourlyData) {
    const i = h.hour;
    const precipType = weatherCodeToOverlay(h.weatherCode);

    // Precipitation overlays suppress clouds
    if (precipType && h.precipitation > 0) {
      const intensity = Math.min(1, h.precipitation / PRECIP_MAX_MM);
      if (precipType === 'snow') snow[i] = intensity;
      else if (precipType === 'freezing_rain') freezingRain[i] = intensity;
      else rain[i] = intensity;
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
  if (freezingRain.some((v) => v > 0))
    results.push({ type: 'freezing_rain', intensities: Array.from(freezingRain) });
  if (fog.some((v) => v > 0)) results.push({ type: 'fog', intensities: Array.from(fog) });
  return results;
}
