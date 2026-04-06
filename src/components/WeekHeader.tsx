import type { DayData } from '../types';
import { todayStr } from '../utils/dateUtils';
import styles from './WeekHeader.module.css';

interface WeekHeaderProps {
  weekData: DayData[];
  hasWeather?: boolean;
}

export default function WeekHeader({ weekData, hasWeather }: WeekHeaderProps) {
  const today = todayStr();

  return (
    <div className={styles.root}>
      <div className={styles.gutter} />
      {weekData.map((day, i) => {
        const dateNum = new Date(day.date + 'T12:00:00').getDate();
        const isToday = day.date === today;

        let tempRange: string | null = null;
        if (hasWeather) {
          const temps = day.hourly.map((h) => h.temp);
          tempRange = `${Math.round(Math.max(...temps))}° / ${Math.round(Math.min(...temps))}°`;
        }

        return (
          <div key={i} className={styles.day}>
            <span className={styles.dayName}>{day.dayName}</span>
            <span className={isToday ? styles.dateToday : styles.date}>{dateNum}</span>
            {tempRange && <span className={styles.tempRange}>{tempRange}</span>}
          </div>
        );
      })}
    </div>
  );
}
