import chroma from 'chroma-js';
import { weatherToColor } from './colorScale';

/**
 * Builds a CSS linear-gradient from hourly weather data.
 *
 * Generates color stops in LAB space via weatherToColor, then uses
 * chroma.js to add smooth sub-hour interpolation around sunrise/sunset.
 */
export function buildDayGradient(hourlyData, sunrise, sunset) {
  const rawStops = [];

  // One stop per hour
  for (const { hour, temp, condition } of hourlyData) {
    const isNight = hour < sunrise || hour > sunset;
    const color = weatherToColor(temp, condition, isNight);
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
      const condition = hourlyData[Math.round(h)]?.condition || hourlyData[lowerIdx].condition;
      const isNight = h < sunrise || h > sunset;
      const color = weatherToColor(temp, condition, isNight);
      rawStops.push({ hour: h, pct: (h / 24) * 100, color });
    }
  }

  rawStops.sort((a, b) => a.pct - b.pct);

  // Now smooth adjacent stops using LAB interpolation — insert midpoints
  // between every pair for an even richer gradient.
  const finalStops = [];
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

  const gradientStops = finalStops.map(s => `${s.color} ${s.pct.toFixed(2)}%`).join(', ');
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
