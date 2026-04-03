import { useState, useEffect, useRef, useMemo } from 'react';
import type { GeoLocation, DayData } from '../types';
import { fetchWeekForecast } from '../services/weatherApi';
import { weekData as mockData } from '../data/mockWeather';

interface WeatherState {
  data: DayData[];
  isLoading: boolean;
  error: string | null;
  source: 'api' | 'mock';
}

interface FetchState {
  data: DayData[] | null;
  isLoading: boolean;
  error: string | null;
}

export function useWeather(location: GeoLocation | null): WeatherState {
  const [fetchState, setFetchState] = useState<FetchState>({
    data: null,
    isLoading: false,
    error: null,
  });
  const cacheRef = useRef<{ key: string; data: DayData[]; time: number } | null>(null);

  const locationKey = useMemo(
    () => (location ? `${location.latitude},${location.longitude}` : null),
    [location],
  );

  useEffect(() => {
    if (!locationKey || !location) return;

    const now = Date.now();
    const cached = cacheRef.current;
    if (cached && cached.key === locationKey && now - cached.time < 60000) {
      setFetchState({ data: cached.data, isLoading: false, error: null });
      return;
    }

    setFetchState((prev) => ({ ...prev, isLoading: true, error: null }));

    const controller = new AbortController();
    fetchWeekForecast(location.latitude, location.longitude, controller.signal)
      .then((result) => {
        cacheRef.current = { key: locationKey, data: result, time: Date.now() };
        setFetchState({ data: result, isLoading: false, error: null });
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        const message = err instanceof Error ? err.message : 'Failed to load weather data';
        setFetchState({ data: null, isLoading: false, error: message });
      });

    return () => controller.abort();
  }, [location, locationKey]);

  // Derive final state: no location = mock, fetch success = api, fetch error = mock fallback
  if (!location) {
    return { data: mockData, isLoading: false, error: null, source: 'mock' };
  }

  return {
    data: fetchState.data ?? mockData,
    isLoading: fetchState.isLoading,
    error: fetchState.error,
    source: fetchState.data ? 'api' : 'mock',
  };
}
