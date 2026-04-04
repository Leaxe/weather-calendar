import { useState } from 'react';
import WeekHeader from './components/WeekHeader';
import WeekGrid from './components/WeekGrid';
import LocationPicker from './components/LocationPicker';
import DateNavigation from './components/DateNavigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePersistedLocation } from './hooks/usePersistedLocation';
import { useWeather } from './hooks/useWeather';
import { useCalendarEvents } from './hooks/useCalendarEvents';
import CalendarImport from './components/CalendarImport';
import { generateDemoWeek } from './data/demoWeather';
import { addDays, getSunday, todayStr } from './utils/dateUtils';
import './styles/global.css';

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
  const [location, setLocation] = usePersistedLocation();
  const [weekStartDate, setWeekStartDate] = useState(() => getSunday(todayStr()));
  const [demoMode] = useState(false);
  const { data: apiData, hasWeather: apiHasWeather, isLoading, error } = useWeather(location, weekStartDate);
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
    <div className="app">
      <header className="app-header">
        <div className="app-header__left">
          <h1 className="app-header__title">Weather Calendar</h1>
          <DateNavigation weekStartDate={weekStartDate} onChange={setWeekStartDate} />
          <span className="app-header__subtitle">{formatDateRange(weekStartDate, data)}</span>
        </div>
        <div className="app-header__right">
          <CalendarImport
            source={calSource}
            isRefreshing={isRefreshing}
            onFileImport={importFromFile}
            onUrlImport={importFromUrl}
            onRefresh={refreshCalendar}
            onClear={clearCalendar}
          />
          <LocationPicker
            location={location}
            onSelect={setLocation}
            onClear={() => setLocation(null)}
          />
        </div>
      </header>

      {error && (
        <Alert variant="destructive" className="rounded-none border-x-0 border-t-0 py-1.5">
          <AlertDescription className="text-center text-xs">{error}</AlertDescription>
        </Alert>
      )}

      <WeekHeader weekData={data} hasWeather={hasWeather} />
      <WeekGrid weekData={data} events={events} isLoading={isLoading} hasWeather={hasWeather} />

      {/* Loading toast — floats over the calendar */}
      {isLoading && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 rounded-full border border-border bg-popover/95 px-4 py-2 shadow-lg backdrop-blur-md">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            <span className="text-xs text-muted-foreground">Loading weather data...</span>
          </div>
        </div>
      )}
    </div>
  );
}
