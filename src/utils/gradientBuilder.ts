import chroma from 'chroma-js';
import { weatherToColor } from './colorScale';
import type { HourlyData, OverlayType, WeatherOverlay } from '../types';

interface GradientStop {
  hour?: number;
  pct: number;
  color: string;
}

// Civil twilight duration centered on sunrise/sunset
const TWILIGHT_HALF = 0.25; // hours each side (total 30 min transition)

/**
 * Compute darkness level at a given fractional hour.
 * 0 = full daylight, 1 = full night, 0-1 = twilight.
 * Transition is centered on sunrise/sunset so the midpoint (darkness=0.5)
 * aligns exactly with the sun marker.
 */
function getDarkness(hour: number, sunrise: number, sunset: number): number {
  const dawnStart = sunrise - TWILIGHT_HALF;
  const dawnEnd = sunrise + TWILIGHT_HALF;
  const duskStart = sunset - TWILIGHT_HALF;
  const duskEnd = sunset + TWILIGHT_HALF;

  // Full night
  if (hour <= dawnStart || hour >= duskEnd) return 1;
  // Full day
  if (hour >= dawnEnd && hour <= duskStart) return 0;
  // Dawn twilight (centered on sunrise)
  if (hour < dawnEnd) {
    const t = (hour - dawnStart) / (TWILIGHT_HALF * 2);
    return (1 + Math.cos(t * Math.PI)) / 2;
  }
  // Dusk twilight (centered on sunset)
  const t = (hour - duskStart) / (TWILIGHT_HALF * 2);
  return (1 - Math.cos(t * Math.PI)) / 2;
}

/**
 * Builds a CSS linear-gradient from hourly weather data.
 *
 * Generates color stops in LAB space via weatherToColor with continuous
 * darkness (0=day, 1=night) for smooth twilight transitions.
 */
export function buildDayGradient(
  hourlyData: HourlyData[],
  sunrise: number,
  sunset: number,
): string {
  const rawStops: GradientStop[] = [];

  // Generate stops at sub-hour intervals for smooth twilight
  const stepsPerHour = 4;
  for (let step = 0; step <= 24 * stepsPerHour; step++) {
    const h = step / stepsPerHour;
    const pct = (h / 24) * 100;

    // Interpolate temperature from hourly data
    const lowerIdx = Math.max(0, Math.min(23, Math.floor(h)));
    const upperIdx = Math.min(23, Math.ceil(h));
    const frac = h - lowerIdx;
    const temp =
      lowerIdx === upperIdx
        ? hourlyData[lowerIdx].temp
        : hourlyData[lowerIdx].temp * (1 - frac) + hourlyData[upperIdx].temp * frac;

    const darkness = getDarkness(h, sunrise, sunset);
    const color = weatherToColor(temp, darkness);
    rawStops.push({ pct, color });
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

// Precipitation: max mm for full intensity, and minimum visible intensity
const PRECIP_MAX_MM = 5;
const PRECIP_MIN_INTENSITY = 0.4; // floor so drizzle/light snow is still visible

// Fog: intensity when WMO code indicates fog
const FOG_INTENSITY = 0.6;

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
 * precipitation mm for intensity, cloud cover for cloud overlay, WMO code for fog.
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
      const intensity = Math.max(
        PRECIP_MIN_INTENSITY,
        Math.min(1, h.precipitation / PRECIP_MAX_MM),
      );
      if (precipType === 'snow') snow[i] = intensity;
      else if (precipType === 'freezing_rain') freezingRain[i] = intensity;
      else rain[i] = intensity;
    } else if (h.cloudCover > CLOUD_MIN_PCT) {
      cloud[i] = h.cloudCover / CLOUD_SCALE;
    }

    // Fog layers with anything (WMO codes 45=fog, 48=rime fog)
    if (h.weatherCode === 45 || h.weatherCode === 48) {
      fog[i] = FOG_INTENSITY;
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
