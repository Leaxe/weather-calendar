import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

interface ZoomContextValue {
  hourHeight: number;
  totalHeight: number;
  hourToPixel: (hour: number) => number;
  pixelToHour: (px: number) => number;
  setHourHeight: (h: number) => void;
}

const ZoomContext = createContext<ZoomContextValue | null>(null);

const MIN_HOUR_HEIGHT = 30;
const MAX_HOUR_HEIGHT = 150;

export function ZoomProvider({ children }: { children: ReactNode }) {
  const [hourHeight, setHourHeightRaw] = useState(60);

  const setHourHeight = useCallback((h: number) => {
    setHourHeightRaw(Math.max(MIN_HOUR_HEIGHT, Math.min(MAX_HOUR_HEIGHT, h)));
  }, []);

  const value = useMemo<ZoomContextValue>(
    () => ({
      hourHeight,
      totalHeight: hourHeight * 24,
      hourToPixel: (hour: number) => hour * hourHeight,
      pixelToHour: (px: number) => px / hourHeight,
      setHourHeight,
    }),
    [hourHeight, setHourHeight],
  );

  return <ZoomContext.Provider value={value}>{children}</ZoomContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useZoom(): ZoomContextValue {
  const ctx = useContext(ZoomContext);
  if (!ctx) throw new Error('useZoom must be used within a ZoomProvider');
  return ctx;
}
