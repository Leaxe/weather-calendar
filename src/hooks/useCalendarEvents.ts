import { useState, useEffect, useCallback, useMemo } from 'react';
import type { CalendarEvent } from '../types';
import { parseICS } from '../utils/icsParser';
import { addDays } from '../utils/dateUtils';

const ICS_KEY = 'weather-calendar-ics';
const SOURCE_KEY = 'weather-calendar-ics-source';

export interface CalendarSource {
  type: 'file' | 'url';
  name: string;
}

export interface UseCalendarEventsResult {
  events: CalendarEvent[];
  source: CalendarSource | null;
  importFromFile: (file: File) => Promise<void>;
  importFromUrl: (url: string) => Promise<void>;
  clearCalendar: () => void;
}

function readStoredSource(): CalendarSource | null {
  try {
    const raw = localStorage.getItem(SOURCE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useCalendarEvents(weekStartDate: string): UseCalendarEventsResult {
  const [icsText, setIcsText] = useState<string | null>(() => localStorage.getItem(ICS_KEY));
  const [source, setSource] = useState<CalendarSource | null>(readStoredSource);

  const weekEnd = useMemo(() => addDays(weekStartDate, 6), [weekStartDate]);

  const events = useMemo(() => {
    if (!icsText) return [];
    try {
      return parseICS(icsText, weekStartDate, weekEnd);
    } catch (e) {
      console.error('Failed to parse ICS:', e);
      return [];
    }
  }, [icsText, weekStartDate, weekEnd]);

  // Re-fetch URL source on mount to get latest data
  useEffect(() => {
    if (source?.type !== 'url') return;
    const controller = new AbortController();

    fetch(`/ics-proxy?url=${encodeURIComponent(source.name)}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        localStorage.setItem(ICS_KEY, text);
        setIcsText(text);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.warn('Failed to refresh calendar URL:', err);
      });

    return () => controller.abort();
  }, [source]);

  const importFromFile = useCallback(async (file: File) => {
    const text = await file.text();
    localStorage.setItem(ICS_KEY, text);
    const src: CalendarSource = { type: 'file', name: file.name };
    localStorage.setItem(SOURCE_KEY, JSON.stringify(src));
    setIcsText(text);
    setSource(src);
  }, []);

  const importFromUrl = useCallback(async (url: string) => {
    const res = await fetch(`/ics-proxy?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error(`Failed to fetch calendar: HTTP ${res.status}`);
    const text = await res.text();
    localStorage.setItem(ICS_KEY, text);
    const src: CalendarSource = { type: 'url', name: url };
    localStorage.setItem(SOURCE_KEY, JSON.stringify(src));
    setIcsText(text);
    setSource(src);
  }, []);

  const clearCalendar = useCallback(() => {
    localStorage.removeItem(ICS_KEY);
    localStorage.removeItem(SOURCE_KEY);
    setIcsText(null);
    setSource(null);
  }, []);

  return { events, source, importFromFile, importFromUrl, clearCalendar };
}
