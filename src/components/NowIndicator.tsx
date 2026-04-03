import { useState, useEffect } from 'react';
import { hourToPixel } from '../utils/timeUtils';

interface NowIndicatorProps {
  dayDate: string;
}

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
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
  const [now, setNow] = useState(() => ({ today: getTodayStr(), hour: getNowHour() }));

  useEffect(() => {
    const id = setInterval(() => {
      setNow({ today: getTodayStr(), hour: getNowHour() });
    }, 60000);
    return () => clearInterval(id);
  }, []);

  if (dayDate !== now.today) return null;

  const top = hourToPixel(now.hour);

  return (
    <div className="now-indicator" style={{ top }}>
      <div className="now-indicator__dot" />
      <div className="now-indicator__line" />
    </div>
  );
}
