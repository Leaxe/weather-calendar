import { useZoom } from '../contexts/ZoomContext';
import { formatTimeRange } from '../utils/timeUtils';
import type { CalendarEvent } from '../types';
import type { EventLayout } from '../utils/eventLayout';

interface EventCardProps {
  event: CalendarEvent;
  layout?: EventLayout;
}

function useEventPosition(event: CalendarEvent, layout?: EventLayout) {
  const { hourToPixel, hourHeight } = useZoom();
  const top = hourToPixel(event.startHour);
  const height = Math.max((event.endHour - event.startHour) * hourHeight, 20);

  const gap = 2; // px gap between overlapping columns
  if (layout && layout.totalColumns > 1) {
    const colWidth = 100 / layout.totalColumns;
    return {
      top,
      height,
      left: `calc(${layout.column * colWidth}% + ${gap}px)`,
      width: `calc(${colWidth}% - ${gap * 2}px)`,
    };
  }
  return { top, height, left: '4px', width: 'calc(100% - 8px)' };
}

/**
 * Event background — renders below weather overlays.
 * Glass-morphism effect lets temperature gradient show through.
 */
export function EventCardBackground({ event, layout }: EventCardProps) {
  const pos = useEventPosition(event, layout);

  return (
    <div
      className="event-card"
      style={{
        top: pos.top,
        height: pos.height,
        left: pos.left,
        width: pos.width,
      }}
    />
  );
}

/**
 * Event label — renders above weather overlays but below night.
 * Shows title and time range.
 */
export function EventCardLabel({ event, layout }: EventCardProps) {
  const pos = useEventPosition(event, layout);
  const isShort = pos.height < 36;
  const isTiny = pos.height < 24;
  const timeStr = formatTimeRange(event.startHour, event.endHour);

  return (
    <div
      className="event-card__label"
      style={{
        top: pos.top,
        height: pos.height,
        left: pos.left,
        width: pos.width,
      }}
    >
      <div className={`event-card__content ${isShort ? 'event-card__content--compact' : ''}`}>
        <span className="event-card__title">{event.title}</span>
        {!isTiny && <span className="event-card__time">{timeStr}</span>}
      </div>
    </div>
  );
}
