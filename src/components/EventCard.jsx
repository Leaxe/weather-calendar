import { hourToPixel, HOUR_HEIGHT } from '../utils/timeUtils';

export default function EventCard({ event }) {
  const top = hourToPixel(event.startHour);
  const height = (event.endHour - event.startHour) * HOUR_HEIGHT;
  const isShort = height < 36;

  return (
    <div
      className="event-card"
      style={{
        top,
        height: Math.max(height, 20),
      }}
    >
      <div className={`event-card__content ${isShort ? 'event-card__content--compact' : ''}`}>
        <span className="event-card__title">{event.title}</span>
      </div>
    </div>
  );
}
