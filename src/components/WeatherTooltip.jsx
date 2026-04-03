import { formatHour, conditionLabel, conditionIcon } from '../utils/timeUtils';

export default function WeatherTooltip({ hourData, hour, sunrise, sunset, position }) {
  if (!hourData) return null;

  const isNight = hour < sunrise || hour > sunset;

  return (
    <div
      className="weather-tooltip"
      style={{
        top: position.y,
        left: position.x,
      }}
    >
      <div className="weather-tooltip__time">
        {conditionIcon(hourData.condition, isNight)} {formatHour(hour)}
      </div>
      <div className="weather-tooltip__temp">
        {Math.round(hourData.temp)}°C
      </div>
      <div className="weather-tooltip__condition">
        {conditionLabel(hourData.condition)}
      </div>
      <div className="weather-tooltip__details">
        <span>💧 {hourData.precipitation}%</span>
        <span>💨 {hourData.windSpeed} km/h</span>
      </div>
    </div>
  );
}
