import { hourToPixel, formatHour } from '../utils/timeUtils';

interface SunMarkerProps {
  hour: number;
  type: 'sunrise' | 'sunset';
}

export default function SunMarker({ hour, type }: SunMarkerProps) {
  const top = hourToPixel(hour);
  const isSunrise = type === 'sunrise';

  return (
    <div className={`sun-marker sun-marker--${type}`} style={{ top }}>
      <div className="sun-marker__line" />
      <div className="sun-marker__label">
        {isSunrise ? '\u2600\uFE0F' : '\u{1F305}'} {formatHour(hour)}
      </div>
    </div>
  );
}
