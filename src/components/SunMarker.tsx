import { useZoom } from '../contexts/ZoomContext';
import { formatHour } from '../utils/timeUtils';
import styles from './SunMarker.module.css';

interface SunMarkerProps {
  hour: number;
  type: 'sunrise' | 'sunset';
}

export default function SunMarker({ hour, type }: SunMarkerProps) {
  const { hourToPixel } = useZoom();
  const top = hourToPixel(hour);
  const isSunrise = type === 'sunrise';

  return (
    <div className={styles.root} style={{ top }}>
      <div className={`${styles.line} ${isSunrise ? styles.lineSunrise : styles.lineSunset}`} />
      <div className={styles.label}>
        {isSunrise ? '\u2600\uFE0F' : '\u{1F305}'} {formatHour(hour)}
      </div>
    </div>
  );
}
