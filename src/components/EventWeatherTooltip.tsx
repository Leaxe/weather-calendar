import { createPortal } from 'react-dom';
import { formatHour, formatTimeRange } from '../utils/timeUtils';
import { wmoConditionLabel, wmoConditionIcon } from '../utils/weatherConditions';
import type { WeatherRangeSummary } from '../utils/weatherAggregation';
import type { HourlyData } from '../types';

interface TooltipPosition {
  x: number;
  y: number;
  flipX: boolean;
  flipY: boolean;
}

interface EventWeatherTooltipProps {
  title?: string;
  startHour: number;
  endHour: number;
  summary: WeatherRangeSummary;
  /** Current hour data at cursor position */
  currentHourData?: HourlyData;
  currentHour?: number;
  sunrise: number;
  sunset: number;
  position: TooltipPosition;
}

export default function EventWeatherTooltip({
  title,
  startHour,
  endHour,
  summary,
  currentHourData,
  currentHour,
  sunrise,
  sunset,
  position,
}: EventWeatherTooltipProps) {
  const precipLabel = summary.hasSnow ? 'Snow' : 'Rain';

  return createPortal(
    <div
      className="pointer-events-none fixed z-50 min-w-[180px] max-w-[240px] rounded-lg border border-[--glass-border] bg-[--glass-bg] px-3.5 py-2.5 shadow-lg backdrop-blur-[12px] saturate-[1.2]"
      style={{
        top: position.y,
        ...(position.flipX ? { right: window.innerWidth - position.x } : { left: position.x }),
        transform: position.flipY ? 'translateY(-100%)' : undefined,
      }}
    >
      {/* Event header */}
      {title && <div className="mb-0.5 text-sm font-semibold text-foreground">{title}</div>}
      <div className="mb-2 text-xs text-muted-foreground">
        {formatTimeRange(startHour, endHour)}
      </div>

      {/* Aggregated weather summary */}
      <div className="mb-2 border-t border-[--glass-border] pt-2">
        <div className="mb-1 flex items-center gap-1.5 text-xs text-foreground">
          <span>{summary.dominantIcon}</span>
          <span>{summary.dominantCondition}</span>
          <span className="ml-auto">{summary.avgTemp}°F</span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
          <span>
            {'\u2601\uFE0F'} {summary.avgCloudCover}%
          </span>
          {summary.totalPrecipitation > 0 && (
            <span>
              {summary.hasSnow ? '\u{1F328}\uFE0F' : '\u{1F327}\uFE0F'} {summary.totalPrecipitation}
              mm {precipLabel.toLowerCase()}
            </span>
          )}
          <span>
            {'\u{1F4A8}'} {summary.avgWindSpeed} mph
          </span>
        </div>
      </div>

      {/* Current hour detail at cursor */}
      {currentHourData && currentHour !== undefined && (
        <div className="border-t border-[--glass-border] pt-2">
          <div className="mb-0.5 text-[11px] text-muted-foreground">
            {wmoConditionIcon(
              currentHourData.weatherCode,
              currentHour < sunrise || currentHour > sunset,
            )}{' '}
            {formatHour(currentHour)}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-light text-foreground">
              {Math.round(currentHourData.temp)}°F
            </span>
            <span className="text-[11px] text-muted-foreground">
              {wmoConditionLabel(currentHourData.weatherCode)}
            </span>
          </div>
          <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
            <span>
              {'\u2601\uFE0F'} {currentHourData.cloudCover}%
            </span>
            {currentHourData.precipitation > 0 && (
              <span>
                {'\u{1F327}\uFE0F'} {currentHourData.precipitation}mm
              </span>
            )}
            <span>
              {'\u{1F4A8}'} {currentHourData.windSpeed} mph
            </span>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
