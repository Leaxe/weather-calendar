import { createPortal } from 'react-dom';
import { formatHour } from '../utils/timeUtils';
import { wmoConditionLabel, wmoConditionIcon } from '../utils/weatherConditions';
import type { HourlyData } from '../types';

interface TooltipPosition {
  x: number;
  y: number;
  flipX: boolean;
  flipY: boolean;
}

interface WeatherTooltipProps {
  hourData: HourlyData;
  hour: number;
  sunrise: number;
  sunset: number;
  position: TooltipPosition;
}

export default function WeatherTooltip({
  hourData,
  hour,
  sunrise,
  sunset,
  position,
}: WeatherTooltipProps) {
  if (!hourData) return null;

  const isNight = hour < sunrise || hour > sunset;

  return createPortal(
    <div
      className="pointer-events-none fixed z-50 min-w-[140px] rounded-lg border border-border/50 bg-popover/95 px-3.5 py-2.5 shadow-lg backdrop-blur-md"
      style={{
        top: position.y,
        ...(position.flipX ? { right: window.innerWidth - position.x } : { left: position.x }),
        transform: position.flipY ? 'translateY(-100%)' : undefined,
      }}
    >
      <div className="mb-1 text-xs text-muted-foreground">
        {wmoConditionIcon(hourData.weatherCode, isNight)} {formatHour(hour)}
      </div>
      <div className="mb-0.5 text-xl font-light text-foreground">{Math.round(hourData.temp)}°F</div>
      <div className="mb-1.5 text-xs text-muted-foreground">
        {wmoConditionLabel(hourData.weatherCode)}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
        <span>
          {'\u2601\uFE0F'} {hourData.cloudCover}%
        </span>
        {hourData.precipitation > 0 && (
          <span>
            {'\u{1F327}\uFE0F'} {hourData.precipitation}mm
          </span>
        )}
        <span>
          {'\u{1F4A8}'} {hourData.windSpeed} mph
        </span>
      </div>
    </div>,
    document.body,
  );
}
