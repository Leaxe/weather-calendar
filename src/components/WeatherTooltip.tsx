import { formatHour, conditionLabel, conditionIcon } from '../utils/timeUtils';
import type { HourlyData } from '../types';

interface TooltipPosition {
  x: number;
  y: number;
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

  return (
    <div
      className="pointer-events-none absolute z-50 min-w-[140px] rounded-lg border border-border/50 bg-popover/95 px-3.5 py-2.5 shadow-lg backdrop-blur-md"
      style={{ top: position.y, left: position.x }}
    >
      <div className="mb-1 text-xs text-muted-foreground">
        {conditionIcon(hourData, isNight)} {formatHour(hour)}
      </div>
      <div className="mb-0.5 text-xl font-light text-foreground">
        {Math.round(hourData.temp)}°F
      </div>
      <div className="mb-1.5 text-xs text-muted-foreground">
        {conditionLabel(hourData, isNight)}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
        <span>
          {'\u2601\uFE0F'} {hourData.cloudCover}%
        </span>
        <span>
          {'\u{1F4A7}'} {hourData.precipProb}%
        </span>
        {hourData.precipitation > 0 && (
          <span>
            {'\u{1F327}\uFE0F'} {hourData.precipitation}mm
          </span>
        )}
        {hourData.snowfall > 0 && (
          <span>
            {'\u2744\uFE0F'} {hourData.snowfall}cm
          </span>
        )}
        <span>
          {'\u{1F4A8}'} {hourData.windSpeed} mph
        </span>
        {hourData.visibility < 10000 && (
          <span>
            {'\u{1F441}\uFE0F'} {(hourData.visibility / 1000).toFixed(1)}km
          </span>
        )}
      </div>
    </div>
  );
}
