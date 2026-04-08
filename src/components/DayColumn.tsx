import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { buildDayGradient, buildWeatherOverlays, getDarkness } from '../utils/gradientBuilder';
import { weatherToColor } from '../utils/colorScale';
import { useZoom } from '../contexts/ZoomContext';

import { getDayTexture } from '../utils/noiseTextures';
import SunMarker from './SunMarker';
import { EventCardBackground, EventCardLabel } from './EventCard';
import WeatherTooltip from './WeatherTooltip';
import NowIndicator from './NowIndicator';
import GhostEvent from './GhostEvent';
import { computeEventLayout } from '../utils/eventLayout';
import { aggregateWeatherRange } from '../utils/weatherAggregation';
import { useDragSelection } from '../hooks/useDragSelection';
import type { DayData, CalendarEvent, HourlyData } from '../types';
import type { WeatherRangeSummary } from '../utils/weatherAggregation';
import styles from './DayColumn.module.css';

interface TooltipPosition {
  x: number;
  y: number;
  flipX: boolean;
  flipY: boolean;
}

interface TooltipState {
  hourData: HourlyData;
  hour: number;
  position: TooltipPosition;
}

interface HoveredEventState {
  event: CalendarEvent;
  hourData: HourlyData;
  hour: number;
  position: TooltipPosition;
}

/** Data passed to parent for the bottom banner */
export interface PinnedTooltipData {
  dayData: DayData;
  hourData?: HourlyData;
  hour?: number;
  event?: CalendarEvent;
  eventSummary?: WeatherRangeSummary;
  rangeStartHour?: number;
  rangeEndHour?: number;
}

interface DayColumnProps {
  dayData: DayData;
  events: CalendarEvent[];
  hasWeather?: boolean;
  hasPinnedTooltip?: boolean;
  onPinTooltip?: (data: PinnedTooltipData) => void;
  onDismissTooltip?: () => void;
}

function computePosition(clientX: number, clientY: number): TooltipPosition {
  const gap = 12;
  const flipX = clientX > window.innerWidth - 280;
  const flipY = clientY > window.innerHeight * 0.75;
  return {
    x: clientX + (flipX ? -gap : gap),
    y: clientY + (flipY ? -gap : gap),
    flipX,
    flipY,
  };
}

export default function DayColumn({
  dayData,
  events,
  hasWeather,
  hasPinnedTooltip,
  onPinTooltip,
  onDismissTooltip,
}: DayColumnProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<HoveredEventState | null>(null);
  const suppressTooltipRef = useRef(false);
  const colRef = useRef<HTMLDivElement>(null);
  const mouseDownRef = useRef<{ x: number; y: number } | null>(null);
  const touchRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const recentTouchRef = useRef(false);
  const { totalHeight, hourHeight, pixelToHour } = useZoom();
  const canHover = window.matchMedia('(hover: hover)').matches;

  const placeholderColor = useMemo(() => weatherToColor(20, 0), []);
  const gradient = useMemo(
    () => buildDayGradient(dayData.hourly, dayData.sunrise, dayData.sunset),
    [dayData],
  );

  const weatherOverlays = useMemo(() => buildWeatherOverlays(dayData.hourly), [dayData]);
  const timedEvents = useMemo(() => events.filter((e) => !e.isAllDay), [events]);
  const eventLayout = useMemo(() => computeEventLayout(timedEvents), [timedEvents]);

  const getHourAtY = useCallback(
    (clientY: number) => {
      const rect = colRef.current!.getBoundingClientRect();
      const gradientY = clientY - rect.top;
      const hour = pixelToHour(gradientY);
      const hourIndex = Math.max(0, Math.min(23, Math.floor(hour)));
      return { hour, hourIndex, hourData: dayData.hourly[hourIndex] };
    },
    [dayData, pixelToHour],
  );

  // Helper to pin a tooltip via parent
  const pinTooltip = useCallback(
    (clientY: number, event?: CalendarEvent) => {
      if (!colRef.current || !onPinTooltip) return;
      const { hour, hourData } = getHourAtY(clientY);
      const data: PinnedTooltipData = {
        hourData,
        hour,
        dayData,
      };
      if (event) {
        data.event = event;
        data.eventSummary = aggregateWeatherRange(
          dayData.hourly,
          event.startHour,
          event.endHour,
          dayData.sunrise,
          dayData.sunset,
        );
      }
      onPinTooltip(data);
    },
    [dayData, getHourAtY, onPinTooltip],
  );

  // Event hover callbacks
  const handleEventHoverStart = useCallback(
    (event: CalendarEvent, _rect: DOMRect, e: React.MouseEvent) => {
      suppressTooltipRef.current = true;
      setTooltip(null);
      const { hour, hourData } = getHourAtY(e.clientY);
      setHoveredEvent({
        event,
        hourData,
        hour,
        position: computePosition(e.clientX, e.clientY),
      });
    },
    [getHourAtY],
  );

  const handleEventHoverMove = useCallback(
    (e: React.MouseEvent) => {
      if (!hoveredEvent) return;
      const { hour, hourData } = getHourAtY(e.clientY);
      setHoveredEvent((prev) =>
        prev
          ? {
              ...prev,
              hourData,
              hour,
              position: computePosition(e.clientX, e.clientY),
            }
          : null,
      );
    },
    [hoveredEvent, getHourAtY],
  );

  const handleEventHoverEnd = useCallback(() => {
    suppressTooltipRef.current = false;
    setHoveredEvent(null);
  }, []);

  // Click on event — toggle pinned tooltip
  const handleEventClick = useCallback(
    (event: CalendarEvent, e: React.MouseEvent | React.TouchEvent) => {
      // Skip synthesized click after touch
      if ('clientX' in e && recentTouchRef.current) return;

      // If this is a touch event, set the flag to block synthesized mouse events
      if (!('clientX' in e)) {
        recentTouchRef.current = true;
        setTimeout(() => {
          recentTouchRef.current = false;
        }, 500);
      }

      if (hasPinnedTooltip) {
        onDismissTooltip?.();
        return;
      }
      const clientY = 'clientX' in e ? e.clientY : e.changedTouches[0].clientY;
      pinTooltip(clientY, event);
      setHoveredEvent(null);
      suppressTooltipRef.current = false;
    },
    [hasPinnedTooltip, onDismissTooltip, pinTooltip],
  );

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
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    clearSelection,
  } = useDragSelection(pixelToHour, colRef);

  // Unsuppress weather tooltip when drag ends
  useEffect(() => {
    if (!isDragging) {
      suppressTooltipRef.current = false;
    }
  }, [isDragging]);

  // Clear ghost selection when banner is dismissed
  const prevPinnedRef = useRef(false);
  useEffect(() => {
    if (prevPinnedRef.current && !hasPinnedTooltip) {
      clearSelection();
    }
    prevPinnedRef.current = !!hasPinnedTooltip;
  }, [hasPinnedTooltip, clearSelection]);

  // Night darkening overlay
  const nightOverlay = useMemo(() => {
    const { sunrise, sunset } = dayData;
    const stops: string[] = [];
    const steps = 48;
    for (let i = 0; i <= steps; i++) {
      const h = (i / steps) * 24;
      const darkness = getDarkness(h, sunrise, sunset);
      const alpha = darkness * 0.25;
      const pct = ((h / 24) * 100).toFixed(1);
      stops.push(`rgba(0,0,0,${alpha.toFixed(3)}) ${pct}%`);
    }
    return `linear-gradient(to bottom, ${stops.join(', ')})`;
  }, [dayData]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (recentTouchRef.current) return;
      if (isDragging) {
        handleDragMove(e);
        return;
      }
      if (suppressTooltipRef.current) return;

      const { hour, hourData } = getHourAtY(e.clientY);
      setTooltip({
        hourData,
        hour,
        position: computePosition(e.clientX, e.clientY),
      });
    },
    [getHourAtY, isDragging, handleDragMove],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!hasWeather || recentTouchRef.current) return;
      mouseDownRef.current = { x: e.clientX, y: e.clientY };
      clearSelection();
      suppressTooltipRef.current = true;
      setTooltip(null);
      handleDragStart(e);
    },
    [hasWeather, handleDragStart, clearSelection],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const downPos = mouseDownRef.current;
      mouseDownRef.current = null;

      if (!downPos) return;
      const finalizedRange = handleDragEnd();

      const dx = Math.abs(e.clientX - downPos.x);
      const dy = Math.abs(e.clientY - downPos.y);
      if (dx < 5 && dy < 5) {
        // Click (not drag) → toggle banner
        clearSelection();
        if (hasPinnedTooltip) {
          onDismissTooltip?.();
        } else {
          pinTooltip(e.clientY);
        }
      } else if (finalizedRange) {
        // Drag completed → pin range summary to banner
        const summary = aggregateWeatherRange(
          dayData.hourly,
          finalizedRange.startHour,
          finalizedRange.endHour,
          dayData.sunrise,
          dayData.sunset,
        );
        onPinTooltip?.({
          dayData,
          eventSummary: summary,
          rangeStartHour: finalizedRange.startHour,
          rangeEndHour: finalizedRange.endHour,
        });
      }
    },
    [
      handleDragEnd,
      clearSelection,
      hasPinnedTooltip,
      onDismissTooltip,
      pinTooltip,
      dayData,
      onPinTooltip,
    ],
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
    if (isDragging) {
      handleDragEnd();
    }
  }, [isDragging, handleDragEnd]);

  // Touch: tap to pin tooltip
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

      // Prevent synthesized mouse events from firing after touch
      recentTouchRef.current = true;
      setTimeout(() => {
        recentTouchRef.current = false;
      }, 500);

      if (hasPinnedTooltip) {
        onDismissTooltip?.();
        return;
      }

      pinTooltip(touch.clientY);
    },
    [hasPinnedTooltip, onDismissTooltip, pinTooltip],
  );

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
      onMouseDown={hasWeather && canHover ? handleMouseDown : undefined}
      onMouseMove={hasWeather && canHover ? handleMouseMove : undefined}
      onMouseUp={hasWeather && canHover ? handleMouseUp : undefined}
      onMouseLeave={hasWeather && canHover ? handleMouseLeave : undefined}
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
            onHoverStart={hasWeather && canHover ? handleEventHoverStart : undefined}
            onHoverMove={hasWeather && canHover ? handleEventHoverMove : undefined}
            onHoverEnd={hasWeather && canHover ? handleEventHoverEnd : undefined}
            onEventClick={hasWeather ? handleEventClick : undefined}
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

      {/* Hover tooltip — desktop only, independent of banner */}
      {hasWeather &&
        (hoveredEvent && hoveredEventSummary ? (
          <WeatherTooltip
            hourData={hoveredEvent.hourData}
            hour={hoveredEvent.hour}
            sunrise={dayData.sunrise}
            sunset={dayData.sunset}
            position={hoveredEvent.position}
            rangeTitle={hoveredEvent.event.title}
            rangeStartHour={hoveredEvent.event.startHour}
            rangeEndHour={hoveredEvent.event.endHour}
            rangeSummary={hoveredEventSummary}
          />
        ) : tooltip ? (
          <WeatherTooltip
            hourData={tooltip.hourData}
            hour={tooltip.hour}
            sunrise={dayData.sunrise}
            sunset={dayData.sunset}
            position={tooltip.position}
          />
        ) : null)}
    </div>
  );
}
