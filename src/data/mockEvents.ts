import type { CalendarEvent } from '../types';
import { getSunday, addDays, todayStr } from '../utils/dateUtils';

/**
 * Generate mock events relative to the current week so they always show.
 */
function makeMockEvents(): CalendarEvent[] {
  const sun = getSunday(todayStr());
  const d = (offset: number) => addDays(sun, offset);

  return [
    { id: 'mock-1', title: 'Team Standup', date: d(1), startHour: 9, endHour: 9.5 },
    { id: 'mock-2', title: 'Lunch with Sarah', date: d(1), startHour: 12, endHour: 13 },
    { id: 'mock-3', title: 'Team Standup', date: d(2), startHour: 9, endHour: 9.5 },
    { id: 'mock-4', title: 'Dentist Appointment', date: d(2), startHour: 14, endHour: 15 },
    { id: 'mock-5', title: 'Team Standup', date: d(3), startHour: 9, endHour: 9.5 },
    { id: 'mock-6', title: 'Project Review', date: d(3), startHour: 13, endHour: 14.5 },
    { id: 'mock-7', title: 'Team Standup', date: d(4), startHour: 9, endHour: 9.5 },
    { id: 'mock-8', title: 'Outdoor Team Building', date: d(4), startHour: 11, endHour: 15 },
    { id: 'mock-9', title: 'Team Standup', date: d(5), startHour: 9, endHour: 9.5 },
    { id: 'mock-10', title: 'Happy Hour', date: d(5), startHour: 17, endHour: 19 },
    { id: 'mock-11', title: 'Morning Hike', date: d(6), startHour: 7, endHour: 10 },
    { id: 'mock-12', title: 'BBQ at Park', date: d(6), startHour: 15, endHour: 18 },
    { id: 'mock-13', title: 'Farmers Market', date: d(0), startHour: 8, endHour: 10 },
    { id: 'mock-14', title: 'Movie Night', date: d(0), startHour: 19, endHour: 21.5 },
  ];
}

export const mockEvents = makeMockEvents();
