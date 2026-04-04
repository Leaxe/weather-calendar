import type { GeoLocation, DayData, HourlyData } from '../types';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';

import { addDays, todayStr } from '../utils/dateUtils';

export async function searchCities(query: string, signal?: AbortSignal): Promise<GeoLocation[]> {
  if (!query.trim()) return [];

  const url = `${GEOCODING_URL}?name=${encodeURIComponent(query)}&count=5&language=en`;
  const res = await fetch(url, { signal });
  if (!res.ok) return [];

  const data = await res.json();
  if (!data.results) return [];

  return data.results.map(
    (r: {
      name: string;
      latitude: number;
      longitude: number;
      country: string;
      admin1?: string;
    }) => ({
      name: r.name,
      latitude: r.latitude,
      longitude: r.longitude,
      country: r.country,
      admin1: r.admin1,
    }),
  );
}

const HOURLY_PARAMS = [
  'temperature_2m',
  'cloud_cover',
  'precipitation',
  'weather_code',
  'wind_speed_10m',
].join(',');

function buildParams(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string,
): URLSearchParams {
  return new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: HOURLY_PARAMS,
    daily: 'sunrise,sunset',
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    timezone: 'auto',
    start_date: startDate,
    end_date: endDate,
  });
}

export async function fetchWeekForecast(
  lat: number,
  lon: number,
  startDate: string,
  signal?: AbortSignal,
): Promise<DayData[]> {
  const endDate = addDays(startDate, 6);
  const today = todayStr();

  // All dates in the future or today: use forecast API
  if (startDate >= today) {
    const params = buildParams(lat, lon, startDate, endDate);
    const res = await fetch(`${FORECAST_URL}?${params}`, { signal });
    if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
    const data = await res.json();
    return mapApiResponse(data);
  }

  // All dates in the past: use archive API
  if (endDate < today) {
    const params = buildParams(lat, lon, startDate, endDate);
    const res = await fetch(`${ARCHIVE_URL}?${params}`, { signal });
    if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
    const data = await res.json();
    return mapApiResponse(data);
  }

  // Mixed: past portion via archive, future portion via forecast
  const yesterday = addDays(today, -1);
  const archiveParams = buildParams(lat, lon, startDate, yesterday);
  const forecastParams = buildParams(lat, lon, today, endDate);

  const [archiveRes, forecastRes] = await Promise.all([
    fetch(`${ARCHIVE_URL}?${archiveParams}`, { signal }),
    fetch(`${FORECAST_URL}?${forecastParams}`, { signal }),
  ]);

  if (!archiveRes.ok) throw new Error(`Archive API error: ${archiveRes.status}`);
  if (!forecastRes.ok) throw new Error(`Forecast API error: ${forecastRes.status}`);

  const [archiveData, forecastData] = await Promise.all([archiveRes.json(), forecastRes.json()]);

  const archiveDays = mapApiResponse(archiveData);
  const forecastDays = mapApiResponse(forecastData);
  return [...archiveDays, ...forecastDays];
}

interface ApiResponse {
  daily: {
    time: string[];
    sunrise: string[];
    sunset: string[];
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    cloud_cover: number[];
    precipitation: number[];
    weather_code: number[];
    wind_speed_10m: number[];
  };
}

function isoToFractionalHour(iso: string): number {
  const date = new Date(iso);
  return date.getHours() + date.getMinutes() / 60;
}

function mapApiResponse(data: ApiResponse): DayData[] {
  const { daily, hourly } = data;
  const days: DayData[] = [];

  for (let d = 0; d < daily.time.length; d++) {
    const date = daily.time[d];
    const dayDate = new Date(date + 'T12:00:00');
    const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
    const sunrise = isoToFractionalHour(daily.sunrise[d]);
    const sunset = isoToFractionalHour(daily.sunset[d]);

    const hourlySlice: HourlyData[] = [];
    for (let h = 0; h < 24; h++) {
      const i = d * 24 + h;
      hourlySlice.push({
        hour: h,
        temp: hourly.temperature_2m[i] ?? 0,
        cloudCover: hourly.cloud_cover[i] ?? 0,
        precipitation: hourly.precipitation[i] ?? 0,
        weatherCode: hourly.weather_code[i] ?? 0,
        windSpeed: hourly.wind_speed_10m[i] ?? 0,
      });
    }

    days.push({ date, dayName, sunrise, sunset, hourly: hourlySlice });
  }

  return days;
}
