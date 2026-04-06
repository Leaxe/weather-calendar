import { useState, useEffect } from 'react';
import { useZoom } from '../contexts/ZoomContext';
import { todayStr } from '../utils/dateUtils';
import styles from './NowIndicator.module.css';

interface NowIndicatorProps {
  dayDate: string;
}

function getNowHour(): number {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
}

/**
 * Red horizontal line showing current time, like Google Calendar.
 * Only renders on today's column. Updates every minute.
 */
export default function NowIndicator({ dayDate }: NowIndicatorProps) {
  const [now, setNow] = useState(() => ({ today: todayStr(), hour: getNowHour() }));
  const { hourToPixel } = useZoom();

  useEffect(() => {
    const id = setInterval(() => {
      setNow({ today: todayStr(), hour: getNowHour() });
    }, 60000);
    return () => clearInterval(id);
  }, []);

  if (dayDate !== now.today) return null;

  const top = hourToPixel(now.hour);

  return (
    <div className={styles.root} style={{ top }}>
      <div className={styles.dot} />
      <div className={styles.line} />
    </div>
  );
}
