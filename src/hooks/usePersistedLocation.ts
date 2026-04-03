import { useState, useCallback } from 'react';
import type { GeoLocation } from '../types';

const STORAGE_KEY = 'weather-calendar-location';

function readStorage(): GeoLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function usePersistedLocation(): [GeoLocation | null, (loc: GeoLocation | null) => void] {
  const [location, setLocation] = useState<GeoLocation | null>(readStorage);

  const persist = useCallback((loc: GeoLocation | null) => {
    if (loc) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setLocation(loc);
  }, []);

  return [location, persist];
}
