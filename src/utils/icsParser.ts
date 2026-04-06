import ICAL from 'ical.js';
import type { CalendarEvent } from '../types';
import { addDays, toLocalDateStr } from './dateUtils';

/**
 * Parse an ICS string and return CalendarEvents within the given week range.
 * Handles recurring events (RRULE expansion) bounded to the visible week.
 */
export function parseICS(icsText: string, weekStart?: string, weekEnd?: string): CalendarEvent[] {
  const jcal = ICAL.parse(icsText);
  const comp = new ICAL.Component(jcal);
  const vevents = comp.getAllSubcomponents('vevent');
  const events: CalendarEvent[] = [];

  // Use a wide range when no week is specified (for pre-parsing all events)
  const rangeStart = weekStart
    ? new Date(weekStart + 'T00:00:00')
    : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const rangeEnd = weekEnd
    ? new Date(addDays(weekEnd, 1) + 'T00:00:00')
    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  for (const vevent of vevents) {
    const event = new ICAL.Event(vevent);

    if (event.isRecurring()) {
      expandRecurring(event, rangeStart, rangeEnd, events);
    } else {
      const parsed = parseSingleEvent(event, rangeStart, rangeEnd);
      if (parsed) events.push(...parsed);
    }
  }

  return events.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return a.startHour - b.startHour;
  });
}

function expandRecurring(
  event: ICAL.Event,
  rangeStart: Date,
  rangeEnd: Date,
  results: CalendarEvent[],
): void {
  const iter = event.iterator();
  const duration = event.endDate.toJSDate().getTime() - event.startDate.toJSDate().getTime();

  // Expand up to 500 occurrences to avoid infinite loops
  for (let i = 0; i < 500; i++) {
    const next = iter.next();
    if (!next || iter.complete) break;

    const start = next.toJSDate();
    if (start >= rangeEnd) break;

    const end = new Date(start.getTime() + duration);
    if (end <= rangeStart) continue;

    const parsed = eventFromDates(event, start, end, next.isDate, i);
    if (parsed) results.push(...parsed);
  }
}

function parseSingleEvent(
  event: ICAL.Event,
  rangeStart: Date,
  rangeEnd: Date,
): CalendarEvent[] | null {
  const start = event.startDate.toJSDate();
  const end = event.endDate.toJSDate();

  if (end <= rangeStart || start >= rangeEnd) return null;

  return eventFromDates(event, start, end, event.startDate.isDate, 0);
}

/**
 * Convert an event with concrete start/end dates into CalendarEvent(s).
 * Multi-day events get split into one entry per day.
 */
function eventFromDates(
  event: ICAL.Event,
  start: Date,
  end: Date,
  isAllDay: boolean,
  instanceIndex: number,
): CalendarEvent[] {
  const results: CalendarEvent[] = [];
  const baseId = `${event.uid}-${instanceIndex}`;

  if (isAllDay) {
    // All-day events: one entry per day
    const startStr = toLocalDateStr(start);
    const endStr = toLocalDateStr(end);
    let current = startStr;
    let dayIdx = 0;
    while (current < endStr) {
      results.push({
        id: `${baseId}-${dayIdx}`,
        title: event.summary || '(No title)',
        date: current,
        startHour: 0,
        endHour: 24,
        isAllDay: true,
        location: event.location || undefined,
        description: event.description || undefined,
      });
      current = addDays(current, 1);
      dayIdx++;
    }
  } else {
    // Timed event — may span midnight
    const startStr = toLocalDateStr(start);
    const endStr = toLocalDateStr(end);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;

    if (startStr === endStr) {
      // Same day
      results.push({
        id: baseId,
        title: event.summary || '(No title)',
        date: startStr,
        startHour,
        endHour: endHour === 0 ? 24 : endHour,
        location: event.location || undefined,
        description: event.description || undefined,
      });
    } else {
      // Spans midnight — split into two entries
      results.push({
        id: `${baseId}-a`,
        title: event.summary || '(No title)',
        date: startStr,
        startHour,
        endHour: 24,
        location: event.location || undefined,
        description: event.description || undefined,
      });
      results.push({
        id: `${baseId}-b`,
        title: event.summary || '(No title)',
        date: endStr,
        startHour: 0,
        endHour: endHour === 0 ? 24 : endHour,
        location: event.location || undefined,
        description: event.description || undefined,
      });
    }
  }

  return results;
}
