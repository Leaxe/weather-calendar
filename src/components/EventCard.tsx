import { useZoom } from '../contexts/ZoomContext';
import { formatTimeRange } from '../utils/timeUtils';
import type { CalendarEvent } from '../types';
import type { EventLayout } from '../utils/eventLayout';
import styles from './EventCard.module.css';

interface EventCardProps {
  event: CalendarEvent;
  layout?: EventLayout;
  onHoverStart?: (event: CalendarEvent, rect: DOMRect, e: React.MouseEvent) => void;
  onHoverMove?: (e: React.MouseEvent) => void;
  onHoverEnd?: () => void;
  onEventClick?: (event: CalendarEvent, e: React.MouseEvent | React.TouchEvent) => void;
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
export function EventCardBackground({
  event,
  layout,
  onHoverStart,
  onHoverMove,
  onHoverEnd,
  onEventClick,
}: EventCardProps) {
  const pos = useEventPosition(event, layout);

  return (
    <div
      data-event-card
      className={styles.card}
      style={{
        top: pos.top,
        height: pos.height,
        left: pos.left,
        width: pos.width,
      }}
      onMouseEnter={
        onHoverStart
          ? (e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              onHoverStart(event, rect, e);
            }
          : undefined
      }
      onMouseMove={onHoverMove}
      onMouseLeave={onHoverEnd}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onClick={onEventClick ? (e) => onEventClick(event, e) : undefined}
      onTouchEnd={
        onEventClick
          ? (e) => {
              e.preventDefault();
              e.stopPropagation();
              onEventClick(event, e);
            }
          : undefined
      }
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
      className={styles.label}
      style={{
        top: pos.top,
        height: pos.height,
        left: pos.left,
        width: pos.width,
      }}
    >
      <div className={isShort ? styles.contentCompact : styles.content}>
        <span className={styles.title}>{event.title}</span>
        {!isTiny && <span className={styles.time}>{timeStr}</span>}
      </div>
    </div>
  );
}
