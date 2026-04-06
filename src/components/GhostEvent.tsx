import { useZoom } from '../contexts/ZoomContext';
import { formatTimeRange } from '../utils/timeUtils';
import styles from './GhostEvent.module.css';

interface GhostEventProps {
  startHour: number;
  endHour: number;
}

export default function GhostEvent({ startHour, endHour }: GhostEventProps) {
  const { hourToPixel, hourHeight } = useZoom();
  const top = hourToPixel(startHour);
  const height = Math.max((endHour - startHour) * hourHeight, 0);

  if (height < 1) return null;

  return (
    <div className={styles.ghost} style={{ top, height }}>
      {height >= 24 && (
        <span className={styles.timeLabel}>{formatTimeRange(startHour, endHour)}</span>
      )}
    </div>
  );
}
