export default function WeekHeader({ weekData }) {
  return (
    <div className="week-header">
      <div className="week-header__gutter" />
      {weekData.map((day, i) => {
        const temps = day.hourly.map((h) => h.temp);
        const high = Math.round(Math.max(...temps));
        const low = Math.round(Math.min(...temps));
        const dateNum = new Date(day.date + 'T12:00:00').getDate();

        return (
          <div key={i} className="week-header__day">
            <span className="week-header__day-name">{day.dayName}</span>
            <span className="week-header__date">{dateNum}</span>
            <span className="week-header__temp-range">
              {high}° / {low}°
            </span>
          </div>
        );
      })}
    </div>
  );
}
