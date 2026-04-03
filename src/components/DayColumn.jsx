import { useState, useCallback, useRef, useMemo } from 'react';
import { buildDayGradient, buildPrecipitationOverlays } from '../utils/gradientBuilder';
import { TOTAL_HEIGHT, HOUR_HEIGHT, pixelToHour, conditionIcon } from '../utils/timeUtils';
import SunMarker from './SunMarker';
import EventCard from './EventCard';
import WeatherTooltip from './WeatherTooltip';
import NowIndicator from './NowIndicator';

export default function DayColumn({ dayData, events, showDetails, dayIndex }) {
  const [tooltip, setTooltip] = useState(null);
  const colRef = useRef(null);

  const gradient = useMemo(
    () => buildDayGradient(dayData.hourly, dayData.sunrise, dayData.sunset),
    [dayData],
  );

  const precipOverlays = useMemo(
    () => buildPrecipitationOverlays(dayData.hourly),
    [dayData],
  );

  const handleMouseMove = useCallback((e) => {
    const rect = colRef.current.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const scrollParent = colRef.current.closest('.week-grid');
    const scrollTop = scrollParent ? scrollParent.scrollTop : 0;
    const hour = pixelToHour(relativeY + scrollTop);
    const hourIndex = Math.max(0, Math.min(23, Math.floor(hour)));
    const hourData = dayData.hourly[hourIndex];

    const colWidth = rect.width;
    let x = e.clientX - rect.left + 14;
    if (x + 160 > colWidth) x = e.clientX - rect.left - 160;

    setTooltip({
      hourData,
      hour,
      position: { x, y: relativeY + 14 },
    });
  }, [dayData]);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

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
          <div
            key={i}
            className="day-column__gridline"
            style={{ top: i * HOUR_HEIGHT }}
          />
        ))}

        {/* Precipitation pattern overlays — opacity scales with precip % */}
        {precipOverlays.map((o) => (
          <div
            key={`precip-${o.hour}`}
            className={`precip-overlay precip-overlay--${o.type}`}
            style={{
              top: o.hour * HOUR_HEIGHT,
              height: HOUR_HEIGHT,
              opacity: o.opacity,
            }}
          />
        ))}

        {/* Sunrise / Sunset markers */}
        <SunMarker hour={dayData.sunrise} type="sunrise" />
        <SunMarker hour={dayData.sunset} type="sunset" />

        {/* Now indicator */}
        <NowIndicator dayIndex={dayIndex} />

        {/* Events */}
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}

        {/* Details overlay */}
        {showDetails && (
          <div className="day-column__details-overlay">
            {dayData.hourly.filter((_, i) => i % 3 === 0).map((h) => {
              const isNight = h.hour < dayData.sunrise || h.hour > dayData.sunset;
              return (
                <div
                  key={h.hour}
                  className="day-column__detail-chip"
                  style={{ top: h.hour * HOUR_HEIGHT + HOUR_HEIGHT / 2 - 10 }}
                >
                  {conditionIcon(h.condition, isNight)} {Math.round(h.temp)}°
                  {h.precipitation > 20 ? ` ${h.precipitation}%` : ''}
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
