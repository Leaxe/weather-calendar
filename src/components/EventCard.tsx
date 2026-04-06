import { useZoom } from '../contexts/ZoomContext';
import type { CalendarEvent } from '../types';

interface EventCardProps {
  event: CalendarEvent;
}

/**
 * Event background — renders below weather overlays.
 * Semi-transparent so weather effects show through.
 */
export function EventCardBackground({ event }: EventCardProps) {
  const { hourToPixel, hourHeight } = useZoom();
  const top = hourToPixel(event.startHour);
  const height = (event.endHour - event.startHour) * hourHeight;

  return (
    <div
      className="event-card"
      style={{
        top,
        height: Math.max(height, 20),
      }}
    />
  );
}

/**
 * Event label — renders above weather overlays.
 * Positioned identically to the background but at a higher z-index.
 */
export function EventCardLabel({ event }: EventCardProps) {
  const { hourToPixel, hourHeight } = useZoom();
  const top = hourToPixel(event.startHour);
  const height = (event.endHour - event.startHour) * hourHeight;
  const isShort = height < 36;

  return (
    <div
      className="event-card__label"
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
