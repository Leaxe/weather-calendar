import { useRef, useEffect, useCallback } from 'react';
import TimeGutter from './TimeGutter';
import DayColumn from './DayColumn';
import { useZoom } from '../contexts/ZoomContext';
import type { DayData, CalendarEvent } from '../types';
import styles from './WeekGrid.module.css';

interface WeekGridProps {
  weekData: DayData[];
  events: CalendarEvent[];
  isLoading?: boolean;
  hasWeather?: boolean;
  isMobile?: boolean;
}

export default function WeekGrid({
  weekData,
  events,
  isLoading,
  hasWeather,
  isMobile,
}: WeekGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { hourHeight, setHourHeight } = useZoom();
  const pinchRef = useRef<{ startDist: number; startHeight: number } | null>(null);

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

  // Pinch-to-zoom for touch devices
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = {
        startDist: Math.hypot(dx, dy),
        startHeight: hourHeight,
      };
    },
    [hourHeight],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length !== 2 || !pinchRef.current) return;
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDist = Math.hypot(dx, dy);
      const scale = currentDist / pinchRef.current.startDist;
      const newHeight = Math.max(30, Math.min(150, pinchRef.current.startHeight * scale));

      const container = scrollRef.current!;
      const rect = container.getBoundingClientRect();
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
      const hourAtMid = (container.scrollTop + midY) / hourHeight;

      setHourHeight(newHeight);

      requestAnimationFrame(() => {
        container.scrollTop = hourAtMid * newHeight - midY;
      });
    },
    [hourHeight, setHourHeight],
  );

  const handleTouchEnd = useCallback(() => {
    pinchRef.current = null;
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div className={styles.root} ref={scrollRef}>
      <div className={styles.body}>
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
