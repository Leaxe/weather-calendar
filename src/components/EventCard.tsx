import { useZoom } from '../contexts/ZoomContext';
import type { CalendarEvent } from '../types';

interface EventCardProps {
  event: CalendarEvent;
}

export default function EventCard({ event }: EventCardProps) {
  const { hourToPixel, hourHeight } = useZoom();
  const top = hourToPixel(event.startHour);
  const height = (event.endHour - event.startHour) * hourHeight;
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
