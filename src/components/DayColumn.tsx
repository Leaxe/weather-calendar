import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { buildDayGradient, buildWeatherOverlays, getDarkness } from '../utils/gradientBuilder';
import { weatherToColor } from '../utils/colorScale';
import { useZoom } from '../contexts/ZoomContext';

import { getDayTexture } from '../utils/noiseTextures';
import SunMarker from './SunMarker';
import { EventCardBackground, EventCardLabel } from './EventCard';
import WeatherTooltip from './WeatherTooltip';
import EventWeatherTooltip from './EventWeatherTooltip';
import NowIndicator from './NowIndicator';
import GhostEvent from './GhostEvent';
import { computeEventLayout } from '../utils/eventLayout';
import { aggregateWeatherRange } from '../utils/weatherAggregation';
import { useDragSelection } from '../hooks/useDragSelection';
import type { DayData, CalendarEvent, HourlyData } from '../types';
import styles from './DayColumn.module.css';

interface TooltipState {
  hourData: HourlyData;
  hour: number;
  position: { x: number; y: number; flipX: boolean; flipY: boolean };
}

interface DayColumnProps {
  dayData: DayData;
  events: CalendarEvent[];
  hasWeather?: boolean;
}

interface HoveredEventState {
  event: CalendarEvent;
  hourData: HourlyData;
  hour: number;
  position: { x: number; y: number; flipX: boolean; flipY: boolean };
}

export default function DayColumn({ dayData, events, hasWeather }: DayColumnProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<HoveredEventState | null>(null);
  const suppressTooltipRef = useRef(false);
  const colRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const { totalHeight, hourHeight, pixelToHour } = useZoom();

  const placeholderColor = useMemo(() => weatherToColor(20, 0), []);
  const gradient = useMemo(
    () => buildDayGradient(dayData.hourly, dayData.sunrise, dayData.sunset),
    [dayData],
  );

  const weatherOverlays = useMemo(() => buildWeatherOverlays(dayData.hourly), [dayData]);
  const timedEvents = useMemo(() => events.filter((e) => !e.isAllDay), [events]);
  const eventLayout = useMemo(() => computeEventLayout(timedEvents), [timedEvents]);

  const getHourFromMouseEvent = useCallback(
    (e: React.MouseEvent) => {
      const rect = colRef.current!.getBoundingClientRect();
      const gradientY = e.clientY - rect.top;
      const hour = pixelToHour(gradientY);
      const hourIndex = Math.max(0, Math.min(23, Math.floor(hour)));
      return { hour, hourIndex, hourData: dayData.hourly[hourIndex] };
    },
    [dayData, pixelToHour],
  );

  // Event hover callbacks
  const handleEventHoverStart = useCallback(
    (event: CalendarEvent, _rect: DOMRect, e: React.MouseEvent) => {
      suppressTooltipRef.current = true;
      setTooltip(null);

      const { hour, hourData } = getHourFromMouseEvent(e);
      const gap = 12;
      const flipX = e.clientX > window.innerWidth - 280;
      const flipY = e.clientY > window.innerHeight * 0.75;

      setHoveredEvent({
        event,
        hourData,
        hour,
        position: {
          x: e.clientX + (flipX ? -gap : gap),
          y: e.clientY + (flipY ? -gap : gap),
          flipX,
          flipY,
        },
      });
    },
    [getHourFromMouseEvent],
  );

  const handleEventHoverMove = useCallback(
    (e: React.MouseEvent) => {
      if (!hoveredEvent) return;
      const { hour, hourData } = getHourFromMouseEvent(e);
      const gap = 12;
      const flipX = e.clientX > window.innerWidth - 280;
      const flipY = e.clientY > window.innerHeight * 0.75;

      setHoveredEvent((prev) =>
        prev
          ? {
              ...prev,
              hourData,
              hour,
              position: {
                x: e.clientX + (flipX ? -gap : gap),
                y: e.clientY + (flipY ? -gap : gap),
                flipX,
                flipY,
              },
            }
          : null,
      );
    },
    [hoveredEvent, getHourFromMouseEvent],
  );

  const handleEventHoverEnd = useCallback(() => {
    suppressTooltipRef.current = false;
    setHoveredEvent(null);
  }, []);

  const hoveredEventSummary = useMemo(() => {
    if (!hoveredEvent) return null;
    return aggregateWeatherRange(
      dayData.hourly,
      hoveredEvent.event.startHour,
      hoveredEvent.event.endHour,
      dayData.sunrise,
      dayData.sunset,
    );
  }, [hoveredEvent, dayData]);

  // Drag selection for ghost events
  const {
    isDragging,
    activeSelection,
    tooltipPosition: dragTooltipPosition,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    clearSelection,
  } = useDragSelection(pixelToHour, colRef);

  const dragSummary = useMemo(() => {
    if (!activeSelection || activeSelection.endHour - activeSelection.startHour < 0.25) return null;
    return aggregateWeatherRange(
      dayData.hourly,
      activeSelection.startHour,
      activeSelection.endHour,
      dayData.sunrise,
      dayData.sunset,
    );
  }, [activeSelection, dayData]);

  // Unsuppress weather tooltip when drag selection is cleared
  useEffect(() => {
    if (!isDragging && !activeSelection) {
      suppressTooltipRef.current = false;
    }
  }, [isDragging, activeSelection]);

  // Night darkening overlay — a gradient of semi-transparent black matching the twilight curve
  const nightOverlay = useMemo(() => {
    const { sunrise, sunset } = dayData;
    const stops: string[] = [];
    const steps = 48; // every 30 min
    for (let i = 0; i <= steps; i++) {
      const h = (i / steps) * 24;
      const darkness = getDarkness(h, sunrise, sunset);
      const alpha = darkness * 0.25; // max 25% black at full night
      const pct = ((h / 24) * 100).toFixed(1);
      stops.push(`rgba(0,0,0,${alpha.toFixed(3)}) ${pct}%`);
    }
    return `linear-gradient(to bottom, ${stops.join(', ')})`;
  }, [dayData]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Forward drag move if dragging
      if (isDragging) {
        handleDragMove(e);
        return;
      }

      if (suppressTooltipRef.current) return;

      const { hour, hourData } = getHourFromMouseEvent(e);

      // Tooltip positioned in viewport-fixed coordinates via position:fixed
      // Flip horizontally/vertically to stay within viewport
      const gap = 12;
      const flipX = e.clientX > window.innerWidth - 240;
      const flipY = e.clientY > window.innerHeight * 0.75;

      setTooltip({
        hourData,
        hour,
        position: {
          x: e.clientX + (flipX ? -gap : gap),
          y: e.clientY + (flipY ? -gap : gap),
          flipX,
          flipY,
        },
      });
    },
    [getHourFromMouseEvent, isDragging, handleDragMove],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!hasWeather) return;
      clearSelection();
      suppressTooltipRef.current = true;
      setTooltip(null);
      handleDragStart(e);
    },
    [hasWeather, handleDragStart, clearSelection],
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    handleDragEnd();
  }, [isDragging, handleDragEnd]);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
    if (isDragging) {
      handleDragEnd();
    }
  }, [isDragging, handleDragEnd]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    touchRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!touchRef.current || !colRef.current) return;
      const touch = e.changedTouches[0];
      const dt = Date.now() - touchRef.current.time;
      const dx = Math.abs(touch.clientX - touchRef.current.x);
      const dy = Math.abs(touch.clientY - touchRef.current.y);
      touchRef.current = null;

      if (dt > 300 || dx > 10 || dy > 10) return;

      // If tooltip is already showing, dismiss it
      if (tooltip) {
        setTooltip(null);
        return;
      }

      const rect = colRef.current.getBoundingClientRect();
      const gradientY = touch.clientY - rect.top;
      const hour = pixelToHour(gradientY);
      const hourIndex = Math.max(0, Math.min(23, Math.floor(hour)));
      const hourData = dayData.hourly[hourIndex];

      setTooltip({
        hourData,
        hour,
        position: {
          x: touch.clientX,
          y: touch.clientY,
          flipX: false,
          flipY: false,
        },
      });
    },
    [dayData, pixelToHour, tooltip],
  );

  // Dismiss tooltip on any outside touch
  useEffect(() => {
    if (!tooltip) return;
    const dismiss = () => setTooltip(null);
    // Use a timeout so the current touch end doesn't immediately dismiss
    const timer = setTimeout(() => {
      document.addEventListener('touchstart', dismiss, { once: true });
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('touchstart', dismiss);
    };
  }, [tooltip]);

  // Track column width for texture rendering
  const [colWidth, setColWidth] = useState(200);
  useEffect(() => {
    const el = colRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = Math.round(entries[0].contentRect.width);
      if (w > 0) setColWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Derive a stable seed from the date string
  const daySeed = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < dayData.date.length; i++) {
      hash = (hash * 31 + dayData.date.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  }, [dayData.date]);

  return (
    <div
      className={styles.root}
      ref={colRef}
      style={isDragging ? { userSelect: 'none' } : undefined}
      onMouseDown={hasWeather ? handleMouseDown : undefined}
      onMouseMove={hasWeather ? handleMouseMove : undefined}
      onMouseUp={hasWeather ? handleMouseUp : undefined}
      onMouseLeave={hasWeather ? handleMouseLeave : undefined}
      onTouchStart={hasWeather ? handleTouchStart : undefined}
      onTouchEnd={hasWeather ? handleTouchEnd : undefined}
    >
      <div
        className={styles.container}
        style={{ height: totalHeight, background: placeholderColor }}
      >
        {/* Temperature gradient — fades in */}
        <div
          className={`${styles.weatherGradient} ${hasWeather ? styles.weatherVisible : styles.weatherHidden}`}
          style={{ background: gradient }}
        />

        {/* Weather condition overlays — fade in */}
        {weatherOverlays.map(({ type, intensities }) => {
          const seed = daySeed * 100 + type.charCodeAt(0);
          const tex = getDayTexture(type, intensities, seed, hourHeight, colWidth);
          return (
            <div
              key={`wx-${type}`}
              className={`${styles.wxOverlay} ${hasWeather ? styles.weatherVisible : styles.weatherHidden}`}
              style={{
                top: 0,
                height: totalHeight,
                backgroundImage: `url(${tex})`,
                backgroundSize: '100% 100%',
              }}
            />
          );
        })}

        {/* Hour gridlines */}
        {Array.from({ length: 24 }, (_, i) => (
          <div key={i} className={styles.gridline} style={{ top: i * hourHeight }} />
        ))}

        {/* Event backgrounds (z:3) */}
        {timedEvents.map((event) => (
          <EventCardBackground
            key={`bg-${event.id}`}
            event={event}
            layout={eventLayout.get(event.id)}
            onHoverStart={hasWeather ? handleEventHoverStart : undefined}
            onHoverMove={hasWeather ? handleEventHoverMove : undefined}
            onHoverEnd={hasWeather ? handleEventHoverEnd : undefined}
          />
        ))}

        {/* Night darkening (z:5) — fades in */}
        <div
          className={`${styles.nightOverlay} ${hasWeather ? styles.weatherVisible : styles.weatherHidden}`}
          style={{ height: totalHeight, background: nightOverlay }}
        />

        {/* Sunrise / Sunset markers (z:6) */}
        {hasWeather && <SunMarker hour={dayData.sunrise} type="sunrise" />}
        {hasWeather && <SunMarker hour={dayData.sunset} type="sunset" />}

        {/* Now indicator (z:7) */}
        <NowIndicator dayDate={dayData.date} />

        {/* Ghost event from drag selection */}
        {hasWeather &&
          activeSelection &&
          activeSelection.endHour - activeSelection.startHour >= 0.25 && (
            <GhostEvent startHour={activeSelection.startHour} endHour={activeSelection.endHour} />
          )}

        {/* Event labels (z:9) — above all weather effects */}
        {timedEvents.map((event) => (
          <EventCardLabel
            key={`lbl-${event.id}`}
            event={event}
            layout={eventLayout.get(event.id)}
          />
        ))}
      </div>

      {/* Tooltip — only with weather */}
      {hasWeather && tooltip && (
        <WeatherTooltip
          hourData={tooltip.hourData}
          hour={tooltip.hour}
          sunrise={dayData.sunrise}
          sunset={dayData.sunset}
          position={tooltip.position}
        />
      )}

      {/* Event weather tooltip */}
      {hasWeather && hoveredEvent && hoveredEventSummary && (
        <EventWeatherTooltip
          title={hoveredEvent.event.title}
          startHour={hoveredEvent.event.startHour}
          endHour={hoveredEvent.event.endHour}
          summary={hoveredEventSummary}
          currentHourData={hoveredEvent.hourData}
          currentHour={hoveredEvent.hour}
          sunrise={dayData.sunrise}
          sunset={dayData.sunset}
          position={hoveredEvent.position}
        />
      )}

      {/* Ghost event weather tooltip */}
      {hasWeather && !isDragging && activeSelection && dragSummary && dragTooltipPosition && (
        <EventWeatherTooltip
          startHour={activeSelection.startHour}
          endHour={activeSelection.endHour}
          summary={dragSummary}
          sunrise={dayData.sunrise}
          sunset={dayData.sunset}
          position={dragTooltipPosition}
        />
      )}
    </div>
  );
}
