import { hourToPixel } from '../utils/timeUtils';

interface NowIndicatorProps {
  dayIndex: number;
}

/**
 * Red horizontal line showing current time, like Google Calendar.
 * For the PoC, we simulate "now" as Wednesday 10:30 AM.
 */
export default function NowIndicator({ dayIndex }: NowIndicatorProps) {
  // Simulated current time: Wednesday (index 2) at 10:30
  const nowDay = 2;
  const nowHour = 10.5;

  if (dayIndex !== nowDay) return null;

  const top = hourToPixel(nowHour);

  return (
    <div className="now-indicator" style={{ top }}>
      <div className="now-indicator__dot" />
      <div className="now-indicator__line" />
    </div>
  );
}
