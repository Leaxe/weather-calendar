import { HOUR_HEIGHT, formatGutterHour } from '../utils/timeUtils';

export default function TimeGutter() {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="time-gutter">
      {hours.map((hour) => (
        <div
          key={hour}
          className="time-gutter-label"
          style={{ height: HOUR_HEIGHT }}
        >
          {hour > 0 && <span>{formatGutterHour(hour)}</span>}
        </div>
      ))}
    </div>
  );
}
