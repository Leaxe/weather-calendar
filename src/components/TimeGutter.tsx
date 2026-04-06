import { useZoom } from '../contexts/ZoomContext';
import { formatGutterHour } from '../utils/timeUtils';
import styles from './TimeGutter.module.css';

export default function TimeGutter() {
  const { hourHeight } = useZoom();
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className={styles.root}>
      {hours.map((hour) => (
        <div key={hour} className={styles.label} style={{ height: hourHeight }}>
          {hour > 0 && <span>{formatGutterHour(hour)}</span>}
        </div>
      ))}
    </div>
  );
}
