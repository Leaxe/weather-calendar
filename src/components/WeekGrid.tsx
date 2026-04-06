import { useRef, useEffect, useCallback } from 'react';
import TimeGutter from './TimeGutter';
import DayColumn from './DayColumn';
import { useZoom } from '../contexts/ZoomContext';
import type { DayData, CalendarEvent } from '../types';

interface WeekGridProps {
  weekData: DayData[];
  events: CalendarEvent[];
  isLoading?: boolean;
  hasWeather?: boolean;
}

export default function WeekGrid({ weekData, events, isLoading, hasWeather }: WeekGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { hourHeight, setHourHeight } = useZoom();

  // Auto-scroll to ~7 AM on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 7 * hourHeight - 20;
    }
    // Only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Zoom on Ctrl/Cmd + scroll wheel
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();

      const container = scrollRef.current!;
      const rect = container.getBoundingClientRect();
      const cursorY = e.clientY - rect.top;
      const scrollTop = container.scrollTop;
      const hourAtCursor = (scrollTop + cursorY) / hourHeight;

      const delta = e.deltaY > 0 ? -5 : 5;
      const newHeight = Math.max(30, Math.min(150, hourHeight + delta));
      setHourHeight(newHeight);

      // Restore scroll so the hour at cursor stays at the same viewport position
      requestAnimationFrame(() => {
        container.scrollTop = hourAtCursor * newHeight - cursorY;
      });
    },
    [hourHeight, setHourHeight],
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  return (
    <div className="week-grid" ref={scrollRef}>
      <div className="week-grid__body">
        <TimeGutter />
        {weekData.map((day) => {
          const dayEvents = events.filter((e) => e.date === day.date);
          return (
            <DayColumn
              key={day.date}
              dayData={day}
              events={dayEvents}
              isLoading={isLoading}
              hasWeather={hasWeather}
            />
          );
        })}
      </div>
    </div>
  );
}
