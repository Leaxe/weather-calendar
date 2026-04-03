import type { GeoLocation, DayData, HourlyData } from '../types';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

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

export async function fetchWeekForecast(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<DayData[]> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: [
      'temperature_2m',
      'cloud_cover',
      'precipitation_probability',
      'precipitation',
      'snowfall',
      'visibility',
      'wind_speed_10m',
      'relative_humidity_2m',
    ].join(','),
    daily: 'sunrise,sunset',
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    timezone: 'auto',
    forecast_days: '7',
  });

  const res = await fetch(`${FORECAST_URL}?${params}`, { signal });
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);

  const data = await res.json();
  return mapApiResponse(data);
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
    precipitation_probability: number[];
    precipitation: number[];
    snowfall: number[];
    visibility: number[];
    wind_speed_10m: number[];
    relative_humidity_2m: number[];
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
        precipProb: hourly.precipitation_probability[i] ?? 0,
        precipitation: hourly.precipitation[i] ?? 0,
        snowfall: hourly.snowfall[i] ?? 0,
        visibility: hourly.visibility[i] ?? 16000,
        windSpeed: hourly.wind_speed_10m[i] ?? 0,
        humidity: hourly.relative_humidity_2m[i] ?? 50,
      });
    }

    days.push({ date, dayName, sunrise, sunset, hourly: hourlySlice });
  }

  return days;
}
