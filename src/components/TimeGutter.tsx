import { useZoom } from '../contexts/ZoomContext';
import { formatGutterHour } from '../utils/timeUtils';

export default function TimeGutter() {
  const { hourHeight } = useZoom();
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="time-gutter">
      {hours.map((hour) => (
        <div key={hour} className="time-gutter-label" style={{ height: hourHeight }}>
          {hour > 0 && <span>{formatGutterHour(hour)}</span>}
        </div>
      ))}
    </div>
  );
}
