import type { DayData } from '../types';
import { todayStr } from '../utils/dateUtils';

interface WeekHeaderProps {
  weekData: DayData[];
  hasWeather?: boolean;
}

export default function WeekHeader({ weekData, hasWeather }: WeekHeaderProps) {
  const today = todayStr();

  return (
    <div className="week-header">
      <div className="week-header__gutter" />
      {weekData.map((day, i) => {
        const dateNum = new Date(day.date + 'T12:00:00').getDate();
        const isToday = day.date === today;

        let tempRange: string | null = null;
        if (hasWeather) {
          const temps = day.hourly.map((h) => h.temp);
          tempRange = `${Math.round(Math.max(...temps))}° / ${Math.round(Math.min(...temps))}°`;
        }

        return (
          <div key={i} className="week-header__day">
            <span className="week-header__day-name">{day.dayName}</span>
            <span
              className={
                isToday ? 'week-header__date week-header__date--today' : 'week-header__date'
              }
            >
              {dateNum}
            </span>
            {tempRange && <span className="week-header__temp-range">{tempRange}</span>}
          </div>
        );
      })}
    </div>
  );
}
