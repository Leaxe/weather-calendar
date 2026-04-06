import type { CalendarEvent } from '../types';

export interface EventLayout {
  column: number;
  totalColumns: number;
}

/**
 * Compute horizontal layout for overlapping events (Google Calendar style).
 * Returns a map from event id to { column, totalColumns }.
 */
export function computeEventLayout(events: CalendarEvent[]): Map<string, EventLayout> {
  if (events.length === 0) return new Map();

  // Sort by start time, then longest first as tiebreaker
  const sorted = [...events].sort((a, b) => {
    if (a.startHour !== b.startHour) return a.startHour - b.startHour;
    return b.endHour - b.startHour - (a.endHour - a.startHour);
  });

  // Assign columns: for each event, find the lowest column not occupied by an overlapping event
  const assignments = new Map<string, number>();
  const columnEnds: number[] = []; // tracks the end hour of the event in each column

  for (const event of sorted) {
    let placed = false;
    for (let col = 0; col < columnEnds.length; col++) {
      if (columnEnds[col] <= event.startHour) {
        assignments.set(event.id, col);
        columnEnds[col] = event.endHour;
        placed = true;
        break;
      }
    }
    if (!placed) {
      assignments.set(event.id, columnEnds.length);
      columnEnds.push(event.endHour);
    }
  }

  // For each event, find the max columns among all events it overlaps with
  // to determine totalColumns for its group
  const result = new Map<string, EventLayout>();

  for (const event of sorted) {
    const col = assignments.get(event.id)!;

    // Find all events overlapping with this one
    let maxCol = col;
    for (const other of sorted) {
      if (other.startHour < event.endHour && other.endHour > event.startHour) {
        maxCol = Math.max(maxCol, assignments.get(other.id)!);
      }
    }

    result.set(event.id, { column: col, totalColumns: maxCol + 1 });
  }

  return result;
}
