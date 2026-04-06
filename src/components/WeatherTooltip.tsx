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

interface WeatherTooltipProps {
  hourData: HourlyData;
  hour: number;
  sunrise: number;
  sunset: number;
  position: TooltipPosition;
  /** Optional event/range context — adds header and aggregated summary */
  rangeTitle?: string;
  rangeStartHour?: number;
  rangeEndHour?: number;
  rangeSummary?: WeatherRangeSummary;
}

export default function WeatherTooltip({
  hourData,
  hour,
  sunrise,
  sunset,
  position,
  rangeTitle,
  rangeStartHour,
  rangeEndHour,
  rangeSummary,
}: WeatherTooltipProps) {
  const isTouchOnly = !window.matchMedia('(hover: hover)').matches;

  if (!hourData) return null;

  const isNight = hour < sunrise || hour > sunset;
  const hasRange = rangeSummary && rangeStartHour !== undefined && rangeEndHour !== undefined;

  const hourContent = (
    <>
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
    </>
  );

  const rangeContent = hasRange && (
    <>
      {/* Event/range header */}
      {rangeTitle && (
        <div className="mb-0.5 text-sm font-semibold text-foreground">{rangeTitle}</div>
      )}
      <div className="mb-2 text-xs text-muted-foreground">
        {formatTimeRange(rangeStartHour, rangeEndHour)}
      </div>

      {/* Aggregated weather summary */}
      <div className="mb-2 border-t border-[--glass-border] pt-2">
        <div className="mb-1 flex items-center gap-1.5 text-xs text-foreground">
          <span>{rangeSummary.dominantIcon}</span>
          <span>{rangeSummary.dominantCondition}</span>
          <span className="ml-auto">{rangeSummary.avgTemp}°F</span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
          <span>
            {'\u2601\uFE0F'} {rangeSummary.avgCloudCover}%
          </span>
          {rangeSummary.totalPrecipitation > 0 && (
            <span>
              {rangeSummary.hasSnow ? '\u{1F328}\uFE0F' : '\u{1F327}\uFE0F'}{' '}
              {rangeSummary.totalPrecipitation}mm {rangeSummary.hasSnow ? 'snow' : 'rain'}
            </span>
          )}
          <span>
            {'\u{1F4A8}'} {rangeSummary.avgWindSpeed} mph
          </span>
        </div>
      </div>

      {/* Current hour detail at cursor */}
      <div className="border-t border-[--glass-border] pt-2">{hourContent}</div>
    </>
  );

  const content = hasRange ? rangeContent : hourContent;

  if (isTouchOnly && !hasRange) {
    return createPortal(
      <div
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-[--glass-border] bg-[--glass-bg] px-4 py-3 shadow-lg backdrop-blur-[12px] saturate-[1.2]"
        style={{ textAlign: 'center' }}
      >
        {content}
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div
      className="pointer-events-none fixed z-50 min-w-[140px] rounded-lg border border-[--glass-border] bg-[--glass-bg] px-3.5 py-2.5 shadow-lg backdrop-blur-[12px] saturate-[1.2]"
      style={{
        ...(hasRange && { minWidth: 180, maxWidth: 240 }),
        top: position.y,
        ...(position.flipX ? { right: window.innerWidth - position.x } : { left: position.x }),
        transform: position.flipY ? 'translateY(-100%)' : undefined,
      }}
    >
      {content}
    </div>,
    document.body,
  );
}
