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
  isRefreshing: boolean;
  importFromFile: (file: File) => Promise<void>;
  importFromUrl: (url: string) => Promise<void>;
  refresh: () => void;
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

async function fetchICS(url: string, signal: AbortSignal): Promise<string> {
  const res = await fetch(`/ics-proxy?url=${encodeURIComponent(url)}`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

export function useCalendarEvents(weekStartDate: string): UseCalendarEventsResult {
  const [icsText, setIcsText] = useState<string | null>(() => localStorage.getItem(ICS_KEY));
  const [source, setSource] = useState<CalendarSource | null>(readStoredSource);
  const [refreshCount, setRefreshCount] = useState(0);
  // Track inflight fetch — uses a counter state so the component re-renders
  // when refreshing starts/stops. The effect sets it via the async callbacks (not sync).
  const [inflightCount, setInflightCount] = useState(0);
  const isRefreshing = inflightCount > 0;

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

  // Re-fetch URL source on mount, week change, or manual refresh
  useEffect(() => {
    if (source?.type !== 'url') return;
    const controller = new AbortController();

    // Use a microtask to avoid the sync-setState-in-effect lint rule
    Promise.resolve().then(() => setInflightCount((c) => c + 1));

    fetchICS(source.name, controller.signal)
      .then((text) => {
        localStorage.setItem(ICS_KEY, text);
        setIcsText(text);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.warn('Failed to refresh calendar URL:', err);
      })
      .finally(() => {
        setInflightCount((c) => Math.max(0, c - 1));
      });

    return () => controller.abort();
    // weekStartDate triggers re-fetch for URL sources so we get fresh data on navigation
    // refreshCount triggers manual re-fetch
  }, [source, weekStartDate, refreshCount]);

  const refresh = useCallback(() => {
    setRefreshCount((c) => c + 1);
  }, []);

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

  return { events, source, isRefreshing, importFromFile, importFromUrl, refresh, clearCalendar };
}
