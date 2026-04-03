import { hourToPixel, formatHour } from '../utils/timeUtils';

export default function SunMarker({ hour, type }) {
  const top = hourToPixel(hour);
  const isSunrise = type === 'sunrise';

  return (
    <div
      className={`sun-marker sun-marker--${type}`}
      style={{ top }}
    >
      <div className="sun-marker__line" />
      <div className="sun-marker__label">
        {isSunrise ? '☀️' : '🌅'} {formatHour(hour)}
      </div>
    </div>
  );
}
