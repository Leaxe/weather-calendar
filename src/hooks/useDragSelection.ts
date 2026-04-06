import { useState, useCallback, useEffect, useRef } from 'react';

export interface DragSelection {
  startHour: number;
  endHour: number;
}

export interface TooltipPosition {
  x: number;
  y: number;
  flipX: boolean;
  flipY: boolean;
}

interface DragState {
  anchor: number;
  current: number;
}

function snap15(hour: number): number {
  return Math.round(hour * 4) / 4;
}

export function useDragSelection(
  pixelToHour: (px: number) => number,
  colRef: React.RefObject<HTMLDivElement | null>,
) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [selection, setSelection] = useState<DragSelection | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);
  const isDragging = dragState !== null;
  const dragRef = useRef(dragState);
  useEffect(() => {
    dragRef.current = dragState;
  }, [dragState]);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (!colRef.current) return;
      const rect = colRef.current.getBoundingClientRect();
      const hour = snap15(pixelToHour(e.clientY - rect.top));
      setDragState({ anchor: hour, current: hour });
      setSelection(null);
      setTooltipPosition(null);
    },
    [pixelToHour, colRef],
  );

  const handleDragMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragRef.current || !colRef.current) return;
      const rect = colRef.current.getBoundingClientRect();
      const hour = snap15(pixelToHour(e.clientY - rect.top));
      setDragState((prev) => (prev ? { ...prev, current: hour } : null));
    },
    [pixelToHour, colRef],
  );

  const handleDragEnd = useCallback(() => {
    const ds = dragRef.current;
    if (!ds) return;
    const lo = Math.max(0, Math.min(ds.anchor, ds.current));
    const hi = Math.min(24, Math.max(ds.anchor, ds.current));
    if (hi - lo >= 0.25) {
      setSelection({ startHour: lo, endHour: hi });
      // Compute tooltip position from column rect
      const el = colRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const gap = 12;
        const flipX = rect.right > window.innerWidth - 280;
        const midY = (rect.top + rect.bottom) / 2;
        const flipY = midY > window.innerHeight * 0.75;
        setTooltipPosition({
          x: flipX ? rect.left - gap : rect.right + gap,
          y: midY + (flipY ? -gap : gap),
          flipX,
          flipY,
        });
      }
    }
    setDragState(null);
  }, [colRef]);

  const clearSelection = useCallback(() => {
    setSelection(null);
    setTooltipPosition(null);
    setDragState(null);
  }, []);

  // Escape clears selection
  useEffect(() => {
    if (!isDragging && !selection) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearSelection();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isDragging, selection, clearSelection]);

  // Cancel drag if mouse leaves window
  useEffect(() => {
    if (!isDragging) return;
    const onUp = () => handleDragEnd();
    document.addEventListener('mouseup', onUp);
    return () => document.removeEventListener('mouseup', onUp);
  }, [isDragging, handleDragEnd]);

  // Compute live range during drag
  const liveSelection: DragSelection | null = dragState
    ? {
        startHour: Math.max(0, Math.min(dragState.anchor, dragState.current)),
        endHour: Math.min(24, Math.max(dragState.anchor, dragState.current)),
      }
    : null;

  // The displayed selection: live drag takes priority, then finalized selection
  const activeSelection = liveSelection ?? selection;

  return {
    isDragging,
    activeSelection,
    tooltipPosition,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    clearSelection,
  };
}
