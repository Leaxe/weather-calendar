import { useState, useCallback, useRef, useMemo } from 'react';
import { buildDayGradient, buildWeatherOverlays } from '../utils/gradientBuilder';
import { TOTAL_HEIGHT, HOUR_HEIGHT, pixelToHour, conditionIcon } from '../utils/timeUtils';
import { getDayTexture } from '../utils/noiseTextures';
import SunMarker from './SunMarker';
import EventCard from './EventCard';
import WeatherTooltip from './WeatherTooltip';
import NowIndicator from './NowIndicator';
import type { DayData, CalendarEvent, HourlyData } from '../types';

interface TooltipState {
  hourData: HourlyData;
  hour: number;
  position: { x: number; y: number };
}

interface DayColumnProps {
  dayData: DayData;
  events: CalendarEvent[];
  showDetails: boolean;
}

export default function DayColumn({ dayData, events, showDetails }: DayColumnProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const colRef = useRef<HTMLDivElement>(null);

  const gradient = useMemo(
    () => buildDayGradient(dayData.hourly, dayData.sunrise, dayData.sunset),
    [dayData],
  );

  const weatherOverlays = useMemo(() => buildWeatherOverlays(dayData.hourly), [dayData]);

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
      const colWidth = rect.width;
      let x = e.clientX + 14;
      if (e.clientX - rect.left + 14 + 160 > colWidth) x = e.clientX - 160;

      setTooltip({
        hourData,
        hour,
        position: { x, y: e.clientY + 14 },
      });
    },
    [dayData],
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
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
      className="day-column"
      ref={colRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="day-column__gradient"
        style={{
          background: gradient,
          height: TOTAL_HEIGHT,
        }}
      >
        {/* Hour gridlines */}
        {Array.from({ length: 24 }, (_, i) => (
          <div key={i} className="day-column__gridline" style={{ top: i * HOUR_HEIGHT }} />
        ))}

        {/* Weather condition overlays — one full-day texture per type */}
        {weatherOverlays.map(({ type, intensities }) => {
          const seed = daySeed * 100 + type.charCodeAt(0);
          const tex = getDayTexture(type, intensities, seed);
          return (
            <div
              key={`wx-${type}`}
              className="wx-overlay"
              style={{
                top: 0,
                height: TOTAL_HEIGHT,
                backgroundImage: `url(${tex})`,
                backgroundSize: '100% 100%',
              }}
            />
          );
        })}

        {/* Sunrise / Sunset markers */}
        <SunMarker hour={dayData.sunrise} type="sunrise" />
        <SunMarker hour={dayData.sunset} type="sunset" />

        {/* Now indicator */}
        <NowIndicator dayDate={dayData.date} />

        {/* Events */}
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}

        {/* Details overlay */}
        {showDetails && (
          <div className="day-column__details-overlay">
            {dayData.hourly
              .filter((_, i) => i % 3 === 0)
              .map((h) => {
                const isNight = h.hour < dayData.sunrise || h.hour > dayData.sunset;
                return (
                  <div
                    key={h.hour}
                    className="day-column__detail-chip"
                    style={{ top: h.hour * HOUR_HEIGHT + HOUR_HEIGHT / 2 - 10 }}
                  >
                    {conditionIcon(h, isNight)} {Math.round(h.temp)}°
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Tooltip */}
      {tooltip && !showDetails && (
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
