import { wmoConditionLabel, wmoConditionIcon } from './weatherConditions';
import type { HourlyData } from '../types';

export interface WeatherRangeSummary {
  totalPrecipitation: number;
  avgCloudCover: number;
  minTemp: number;
  maxTemp: number;
  avgWindSpeed: number;
  dominantCondition: string;
  dominantIcon: string;
  hasRain: boolean;
  hasSnow: boolean;
}

function isSnowCode(code: number): boolean {
  return (code >= 71 && code <= 77) || (code >= 85 && code <= 86);
}

function isRainCode(code: number): boolean {
  return (
    (code >= 51 && code <= 55) ||
    (code >= 61 && code <= 67) ||
    (code >= 80 && code <= 82) ||
    (code >= 95 && code <= 99)
  );
}

/**
 * Aggregate weather data over a fractional hour range (e.g. 9.5–11.0).
 * Precipitation is summed (prorated for partial hours).
 * Cloud cover, temp, and wind speed are weighted averages.
 * Dominant condition is the most common WMO code weighted by duration.
 */
export function aggregateWeatherRange(
  hourly: HourlyData[],
  startHour: number,
  endHour: number,
  sunrise: number,
  sunset: number,
): WeatherRangeSummary {
  const lo = Math.max(0, Math.floor(startHour));
  const hi = Math.min(23, Math.ceil(endHour) - 1);

  let totalWeight = 0;
  let totalPrecip = 0;
  let weightedCloud = 0;
  let minTemp = Infinity;
  let maxTemp = -Infinity;
  let weightedWind = 0;
  let hasRain = false;
  let hasSnow = false;

  const codeTally = new Map<number, number>();

  for (let i = lo; i <= hi; i++) {
    const h = hourly[i];
    if (!h) continue;

    // Weight = fraction of this hour that falls within [startHour, endHour]
    const hourStart = Math.max(i, startHour);
    const hourEnd = Math.min(i + 1, endHour);
    const weight = Math.max(0, hourEnd - hourStart);
    if (weight <= 0) continue;

    totalWeight += weight;
    totalPrecip += h.precipitation * weight;
    weightedCloud += h.cloudCover * weight;
    if (h.temp < minTemp) minTemp = h.temp;
    if (h.temp > maxTemp) maxTemp = h.temp;
    weightedWind += h.windSpeed * weight;

    codeTally.set(h.weatherCode, (codeTally.get(h.weatherCode) ?? 0) + weight);

    if (isRainCode(h.weatherCode)) hasRain = true;
    if (isSnowCode(h.weatherCode)) hasSnow = true;
  }

  if (totalWeight === 0) {
    return {
      totalPrecipitation: 0,
      avgCloudCover: 0,
      minTemp: 0,
      maxTemp: 0,
      avgWindSpeed: 0,
      dominantCondition: 'Unknown',
      dominantIcon: '',
      hasRain: false,
      hasSnow: false,
    };
  }

  // Find dominant WMO code
  let dominantCode = 0;
  let maxWeight = 0;
  for (const [code, w] of codeTally) {
    if (w > maxWeight) {
      maxWeight = w;
      dominantCode = code;
    }
  }

  const midHour = (startHour + endHour) / 2;
  const isNight = midHour < sunrise || midHour > sunset;

  return {
    totalPrecipitation: Math.round(totalPrecip * 100) / 100,
    avgCloudCover: Math.round(weightedCloud / totalWeight),
    minTemp: Math.round(minTemp),
    maxTemp: Math.round(maxTemp),
    avgWindSpeed: Math.round((weightedWind / totalWeight) * 10) / 10,
    dominantCondition: wmoConditionLabel(dominantCode),
    dominantIcon: wmoConditionIcon(dominantCode, isNight),
    hasRain,
    hasSnow,
  };
}
