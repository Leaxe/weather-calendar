import { useState } from 'react';
import WeekGrid from './components/WeekGrid';
import LocationPicker from './components/LocationPicker';
import DateRangePicker from './components/DateRangePicker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePersistedLocation } from './hooks/usePersistedLocation';
import { useWeather } from './hooks/useWeather';
import { useCalendarEvents } from './hooks/useCalendarEvents';
import { useIsMobile } from './hooks/useIsMobile';
import CalendarImport from './components/CalendarImport';
import Logo from './components/Logo';
import { generateDemoWeek } from './data/demoWeather';
import { addDays, getSunday, todayStr } from './utils/dateUtils';
import { ZoomProvider } from './contexts/ZoomContext';
import styles from './App.module.css';

function formatDateRange(startDate: string, data: { date: string }[]): string {
  if (data.length === 0) {
    const first = new Date(startDate + 'T12:00:00');
    const lastStr = addDays(startDate, 6);
    const last = new Date(lastStr + 'T12:00:00');
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const yearOpts: Intl.DateTimeFormatOptions = { ...opts, year: 'numeric' };
    const sameMonth = first.getMonth() === last.getMonth();
    if (sameMonth) {
      return `${first.toLocaleDateString('en-US', opts)} – ${last.getDate()}, ${last.getFullYear()}`;
    }
    return `${first.toLocaleDateString('en-US', opts)} – ${last.toLocaleDateString('en-US', yearOpts)}`;
  }
  const first = new Date(data[0].date + 'T12:00:00');
  const last = new Date(data[data.length - 1].date + 'T12:00:00');
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const yearOpts: Intl.DateTimeFormatOptions = { ...opts, year: 'numeric' };
  const sameMonth = first.getMonth() === last.getMonth();
  if (sameMonth) {
    return `${first.toLocaleDateString('en-US', opts)} – ${last.getDate()}, ${last.getFullYear()}`;
  }
  return `${first.toLocaleDateString('en-US', opts)} – ${last.toLocaleDateString('en-US', yearOpts)}`;
}

export default function App() {
  const isMobile = useIsMobile();
  const [location, setLocation] = usePersistedLocation();
  const [weekStartDate, setWeekStartDate] = useState(() => getSunday(todayStr()));
  const [demoMode] = useState(false);
  const {
    data: apiData,
    hasWeather: apiHasWeather,
    isLoading,
    error,
    refresh: refreshWeather,
  } = useWeather(location, weekStartDate);
  const data = demoMode ? generateDemoWeek(weekStartDate) : apiData;
  const hasWeather = demoMode || apiHasWeather;
  const {
    events,
    source: calSource,
    isRefreshing,
    importFromFile,
    importFromUrl,
    refresh: refreshCalendar,
    clearCalendar,
  } = useCalendarEvents(weekStartDate);

  return (
    <ZoomProvider>
      <div className={styles.root}>
        {isMobile ? (
          <>
            <header className={styles.mobileHeader}>
              <div className={styles.mobileLeft}>
                <Logo size={28} />
              </div>
              <div className={styles.mobileRight}>
                <CalendarImport
                  source={calSource}
                  isRefreshing={isRefreshing}
                  onFileImport={importFromFile}
                  onUrlImport={importFromUrl}
                  onRefresh={refreshCalendar}
                  onClear={clearCalendar}
                  iconOnly
                />
                <LocationPicker
                  location={location}
                  onSelect={setLocation}
                  onClear={() => setLocation(null)}
                  onRefresh={refreshWeather}
                  isRefreshing={isLoading}
                  iconOnly
                />
              </div>
            </header>
            <div className={styles.mobileNav}>
              <DateRangePicker
                label={formatDateRange(weekStartDate, data)}
                weekStartDate={weekStartDate}
                onChange={setWeekStartDate}
              />
            </div>
          </>
        ) : (
          <header className={styles.desktopHeader}>
            <Logo size={36} />
            <h1 className={styles.title}>Weather Calendar</h1>
            <div className={styles.spacer} />
            <DateRangePicker
              label={formatDateRange(weekStartDate, data)}
              weekStartDate={weekStartDate}
              onChange={setWeekStartDate}
            />
            <CalendarImport
              source={calSource}
              isRefreshing={isRefreshing}
              onFileImport={importFromFile}
              onUrlImport={importFromUrl}
              onRefresh={refreshCalendar}
              onClear={clearCalendar}
              iconOnly={!!calSource}
            />
            <LocationPicker
              location={location}
              onSelect={setLocation}
              onClear={() => setLocation(null)}
              onRefresh={refreshWeather}
              isRefreshing={isLoading}
            />
          </header>
        )}

        {error && (
          <Alert variant="destructive" className="rounded-none border-x-0 border-t-0 py-1.5">
            <AlertDescription className="text-center text-xs">{error}</AlertDescription>
          </Alert>
        )}

        <WeekGrid weekData={data} events={events} hasWeather={hasWeather} isMobile={isMobile} />

        {/* Loading toast — floats over the calendar */}
        {(isLoading || isRefreshing) && (
          <div className="fixed bottom-4 left-1/2 z-50" style={{ transform: 'translateX(-50%)' }}>
            <div className="flex items-center gap-2 rounded-full border border-[--glass-border] bg-[--glass-bg] px-4 py-2 shadow-lg backdrop-blur-[12px] saturate-[1.2]">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
              <span className="text-xs text-muted-foreground">Loading...</span>
            </div>
          </div>
        )}
      </div>
    </ZoomProvider>
  );
}
