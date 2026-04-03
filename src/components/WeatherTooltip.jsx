import { formatHour, conditionLabel, conditionIcon } from '../utils/timeUtils';

export default function WeatherTooltip({ hourData, hour, sunrise, sunset, position }) {
  if (!hourData) return null;

  const isNight = hour < sunrise || hour > sunset;

  return (
    <div
      className="pointer-events-none absolute z-50 min-w-[140px] rounded-lg border border-border/50 bg-popover/95 px-3.5 py-2.5 shadow-lg backdrop-blur-md"
      style={{ top: position.y, left: position.x }}
    >
      <div className="mb-1 text-xs text-muted-foreground">
        {conditionIcon(hourData.condition, isNight)} {formatHour(hour)}
      </div>
      <div className="mb-0.5 text-xl font-light text-foreground">
        {Math.round(hourData.temp)}°C
      </div>
      <div className="mb-1.5 text-xs text-muted-foreground">
        {conditionLabel(hourData.condition)}
      </div>
      <div className="flex gap-3 text-[11px] text-muted-foreground">
        <span>💧 {hourData.precipitation}%</span>
        <span>💨 {hourData.windSpeed} km/h</span>
      </div>
    </div>
  );
}
