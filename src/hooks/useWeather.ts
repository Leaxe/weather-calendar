import { useState, useEffect, useRef, useMemo } from 'react';
import type { GeoLocation, DayData } from '../types';
import { fetchWeekForecast } from '../services/weatherApi';

interface FetchState {
  data: DayData[] | null;
  isLoading: boolean;
  error: string | null;
}

interface WeatherResult {
  data: DayData[];
  isLoading: boolean;
  error: string | null;
}

export function useWeather(location: GeoLocation | null, weekStartDate: string): WeatherResult {
  const [fetchState, setFetchState] = useState<FetchState>({
    data: null,
    isLoading: false,
    error: null,
  });
  const cacheRef = useRef<{ key: string; data: DayData[]; time: number } | null>(null);

  const cacheKey = useMemo(
    () => (location ? `${location.latitude},${location.longitude}:${weekStartDate}` : null),
    [location, weekStartDate],
  );

  useEffect(() => {
    if (!cacheKey || !location) return;

    const now = Date.now();
    const cached = cacheRef.current;
    if (cached && cached.key === cacheKey && now - cached.time < 60000) {
      setFetchState({ data: cached.data, isLoading: false, error: null });
      return;
    }

    setFetchState((prev) => ({ ...prev, isLoading: true, error: null }));

    const controller = new AbortController();
    fetchWeekForecast(location.latitude, location.longitude, weekStartDate, controller.signal)
      .then((result) => {
        cacheRef.current = { key: cacheKey, data: result, time: Date.now() };
        setFetchState({ data: result, isLoading: false, error: null });
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        const message = err instanceof Error ? err.message : 'Failed to load weather data';
        setFetchState({ data: null, isLoading: false, error: message });
      });

    return () => controller.abort();
  }, [location, cacheKey, weekStartDate]);

  if (!location) {
    return { data: [], isLoading: false, error: null };
  }

  return {
    data: fetchState.data ?? [],
    isLoading: fetchState.isLoading,
    error: fetchState.error,
  };
}
