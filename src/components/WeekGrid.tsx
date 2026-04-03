import { useRef, useEffect } from 'react';
import TimeGutter from './TimeGutter';
import DayColumn from './DayColumn';
import { HOUR_HEIGHT } from '../utils/timeUtils';
import type { DayData, CalendarEvent } from '../types';

interface WeekGridProps {
  weekData: DayData[];
  events: CalendarEvent[];
  showDetails: boolean;
}

export default function WeekGrid({ weekData, events, showDetails }: WeekGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to ~7 AM on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 7 * HOUR_HEIGHT - 20;
    }
  }, []);

  return (
    <div className="week-grid" ref={scrollRef}>
      <div className="week-grid__body">
        <TimeGutter />
        {weekData.map((day, i) => {
          const dayEvents = events.filter((e) => e.day === i);
          return (
            <DayColumn
              key={i}
              dayIndex={i}
              dayData={day}
              events={dayEvents}
              showDetails={showDetails}
            />
          );
        })}
      </div>
    </div>
  );
}
