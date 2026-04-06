import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { buildDayGradient, buildWeatherOverlays, getDarkness } from '../utils/gradientBuilder';
import { useZoom } from '../contexts/ZoomContext';

import { getDayTexture } from '../utils/noiseTextures';
import SunMarker from './SunMarker';
import { EventCardBackground, EventCardLabel } from './EventCard';
import WeatherTooltip from './WeatherTooltip';
import NowIndicator from './NowIndicator';
import { computeEventLayout } from '../utils/eventLayout';
import { useIsMobile } from '../hooks/useIsMobile';
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
  isLoading?: boolean;
  hasWeather?: boolean;
}

export default function DayColumn({ dayData, events, isLoading, hasWeather }: DayColumnProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const colRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isMobile = useIsMobile();
  const { totalHeight, hourHeight, pixelToHour } = useZoom();

  const gradient = useMemo(
    () => buildDayGradient(dayData.hourly, dayData.sunrise, dayData.sunset),
    [dayData],
  );

  const weatherOverlays = useMemo(() => buildWeatherOverlays(dayData.hourly), [dayData]);
  const timedEvents = useMemo(() => events.filter((e) => !e.isAllDay), [events]);
  const eventLayout = useMemo(() => computeEventLayout(timedEvents), [timedEvents]);

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
      const rect = colRef.current!.getBoundingClientRect();
      // rect.top is already scroll-adjusted (goes negative as column scrolls up)
      // so e.clientY - rect.top gives the correct position within the full gradient
      const gradientY = e.clientY - rect.top;
      const hour = pixelToHour(gradientY);
      const hourIndex = Math.max(0, Math.min(23, Math.floor(hour)));
      const hourData = dayData.hourly[hourIndex];

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
    [dayData, pixelToHour],
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

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
    if (!isMobile || !tooltip) return;
    const dismiss = () => setTooltip(null);
    // Use a timeout so the current touch end doesn't immediately dismiss
    const timer = setTimeout(() => {
      document.addEventListener('touchstart', dismiss, { once: true });
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('touchstart', dismiss);
    };
  }, [isMobile, tooltip]);

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
      onMouseMove={hasWeather && !isMobile ? handleMouseMove : undefined}
      onMouseLeave={hasWeather && !isMobile ? handleMouseLeave : undefined}
      onTouchStart={hasWeather && isMobile ? handleTouchStart : undefined}
      onTouchEnd={hasWeather && isMobile ? handleTouchEnd : undefined}
    >
      <div
        className={styles.gradient}
        style={{
          background: gradient,
          height: totalHeight,
        }}
      >
        {/* Hour gridlines */}
        {Array.from({ length: 24 }, (_, i) => (
          <div key={i} className={styles.gridline} style={{ top: i * hourHeight }} />
        ))}

        {/* Event backgrounds (z:3) — below weather */}
        {timedEvents.map((event) => (
          <EventCardBackground
            key={`bg-${event.id}`}
            event={event}
            layout={eventLayout.get(event.id)}
          />
        ))}

        {/* Weather condition overlays (z:4) */}
        {hasWeather &&
          weatherOverlays.map(({ type, intensities }) => {
            const seed = daySeed * 100 + type.charCodeAt(0);
            const tex = getDayTexture(type, intensities, seed, hourHeight, colWidth);
            return (
              <div
                key={`wx-${type}`}
                className={styles.wxOverlay}
                style={{
                  top: 0,
                  height: totalHeight,
                  backgroundImage: `url(${tex})`,
                  backgroundSize: '100% 100%',
                }}
              />
            );
          })}

        {/* Night darkening (z:5) */}
        {hasWeather && (
          <div
            className={styles.nightOverlay}
            style={{ height: totalHeight, background: nightOverlay }}
          />
        )}

        {/* Sunrise / Sunset markers (z:6) */}
        {hasWeather && <SunMarker hour={dayData.sunrise} type="sunrise" />}
        {hasWeather && <SunMarker hour={dayData.sunset} type="sunset" />}

        {/* Now indicator (z:7) */}
        <NowIndicator dayDate={dayData.date} />

        {/* Loading shimmer (z:8) */}
        {isLoading && <div className={styles.loadingShimmer} />}

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
    </div>
  );
}
