import { createPortal } from 'react-dom';
import { useRef, useLayoutEffect, useState } from 'react';
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

export interface WeatherSummaryProps {
  hourData?: HourlyData;
  hour?: number;
  sunrise: number;
  sunset: number;
  rangeTitle?: string;
  rangeStartHour?: number;
  rangeEndHour?: number;
  rangeSummary?: WeatherRangeSummary;
  /** Day label shown next to time (e.g. "Mon") — used by the banner */
  dayName?: string;
}

/** Shared weather content — used by both the desktop tooltip and the tap banner */
export function WeatherSummaryContent({
  hourData,
  hour,
  sunrise,
  sunset,
  rangeTitle,
  rangeStartHour,
  rangeEndHour,
  rangeSummary,
  dayName,
}: WeatherSummaryProps) {
  const hasRange = rangeSummary && rangeStartHour !== undefined && rangeEndHour !== undefined;
  const hasHour = hourData && hour !== undefined;

  if (!hasRange && !hasHour) return null;

  const isNight = hasHour ? hour < sunrise || hour > sunset : false;

  const hourContent = hasHour ? (
    <>
      <div className="mb-1 text-xs text-muted-foreground">
        {dayName && `${dayName} `}
        {formatHour(hour)}
      </div>
      <div className="mb-0.5 text-xl font-light text-foreground">{Math.round(hourData.temp)}°F</div>
      <div className="mb-1.5 text-xs text-muted-foreground">
        {wmoConditionIcon(hourData.weatherCode, isNight)} {wmoConditionLabel(hourData.weatherCode)}
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
  ) : null;

  if (hasRange) {
    return (
      <>
        {rangeTitle && (
          <div className="mb-0.5 text-sm font-semibold text-foreground">{rangeTitle}</div>
        )}
        <div className="mb-2 text-xs text-muted-foreground">
          {dayName && `${dayName} `}
          {formatTimeRange(rangeStartHour, rangeEndHour)}
        </div>

        <div className="mb-2">
          <div className="mb-0.5 text-xl font-light text-foreground">
            {rangeSummary.minTemp === rangeSummary.maxTemp
              ? `${rangeSummary.minTemp}°F`
              : `${rangeSummary.minTemp}–${rangeSummary.maxTemp}°F`}
          </div>
          <div className="mb-1.5 text-xs text-muted-foreground">
            {rangeSummary.dominantIcon} {rangeSummary.dominantCondition}
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

        {hourContent && <div className="border-t border-[--glass-border] pt-2">{hourContent}</div>}
      </>
    );
  }

  return <>{hourContent}</>;
}

interface WeatherTooltipProps extends WeatherSummaryProps {
  position: TooltipPosition;
}

/** Desktop-only floating tooltip that follows the cursor */
export default function WeatherTooltip({ position, ...summaryProps }: WeatherTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [clampedY, setClampedY] = useState(position.y);

  const hasRange =
    summaryProps.rangeSummary &&
    summaryProps.rangeStartHour !== undefined &&
    summaryProps.rangeEndHour !== undefined;

  useLayoutEffect(() => {
    const el = tooltipRef.current;
    if (!el) return;
    const h = el.offsetHeight;
    const pad = 8;
    const maxY = window.innerHeight - h - pad;
    setClampedY(Math.max(pad, Math.min(position.y, maxY)));
  }, [position.y]);

  return createPortal(
    <div
      ref={tooltipRef}
      className="pointer-events-none fixed z-50 min-w-[140px] rounded-lg border border-[--glass-border] bg-[--glass-bg] px-3.5 py-2.5 shadow-lg backdrop-blur-[12px] saturate-[1.2]"
      style={{
        ...(hasRange && { minWidth: 180, maxWidth: 240 }),
        top: clampedY,
        ...(position.flipX ? { right: window.innerWidth - position.x } : { left: position.x }),
      }}
    >
      <WeatherSummaryContent {...summaryProps} />
    </div>,
    document.body,
  );
}
