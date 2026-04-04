import { useState, useEffect, useRef, useMemo } from 'react';
import type { GeoLocation, DayData, HourlyData } from '../types';
import { fetchWeekForecast } from '../services/weatherApi';
import { addDays } from '../utils/dateUtils';

interface FetchState {
  data: DayData[] | null;
  dataKey: string | null; // which cacheKey this data belongs to
  isLoading: boolean;
  error: string | null;
}

interface WeatherResult {
  data: DayData[];
  hasWeather: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Generate empty placeholder days for a week so the grid can render immediately.
 */
function makePlaceholderWeek(startDate: string): DayData[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(startDate, i);
    const d = new Date(date + 'T12:00:00');
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const hourly: HourlyData[] = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      temp: 60,
      cloudCover: 0,
      precipitation: 0,
      weatherCode: 0,
      windSpeed: 0,
    }));
    return { date, dayName, sunrise: 0, sunset: 24, hourly };
  });
}

export function useWeather(location: GeoLocation | null, weekStartDate: string): WeatherResult {
  const [fetchState, setFetchState] = useState<FetchState>({
    data: null,
    dataKey: null,
    isLoading: false,
    error: null,
  });
  const cacheRef = useRef<{ key: string; data: DayData[]; time: number } | null>(null);

  const cacheKey = useMemo(
    () => (location ? `${location.latitude},${location.longitude}:${weekStartDate}` : null),
    [location, weekStartDate],
  );

  // Refresh every hour
  const [refreshTick, setRefreshTick] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setRefreshTick((t) => t + 1),
      60 * 60 * 1000,
    );
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!cacheKey || !location) return;

    const now = Date.now();
    const cached = cacheRef.current;
    if (cached && cached.key === cacheKey && now - cached.time < 60000) {
      setFetchState({ data: cached.data, dataKey: cacheKey, isLoading: false, error: null });
      return;
    }

    // Don't show loading indicator for background refreshes (when we already have data)
    const isBackgroundRefresh = fetchState.data && fetchState.dataKey === cacheKey;
    if (!isBackgroundRefresh) {
      setFetchState((prev) => ({ ...prev, isLoading: true, error: null }));
    }

    const controller = new AbortController();
    fetchWeekForecast(location.latitude, location.longitude, weekStartDate, controller.signal)
      .then((result) => {
        cacheRef.current = { key: cacheKey, data: result, time: Date.now() };
        setFetchState({ data: result, dataKey: cacheKey, isLoading: false, error: null });
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        const message = err instanceof Error ? err.message : 'Failed to load weather data';
        setFetchState((prev) => ({ ...prev, isLoading: false, error: message }));
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, cacheKey, weekStartDate, refreshTick]);

  if (!location) {
    return { data: makePlaceholderWeek(weekStartDate), hasWeather: false, isLoading: false, error: null };
  }

  const hasCurrentData = !!(fetchState.data && fetchState.dataKey === cacheKey);

  return {
    data: hasCurrentData ? fetchState.data! : makePlaceholderWeek(weekStartDate),
    hasWeather: hasCurrentData,
    isLoading: fetchState.isLoading,
    error: fetchState.error,
  };
}
