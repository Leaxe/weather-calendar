import { useState } from 'react';
import WeekHeader from './components/WeekHeader';
import WeekGrid from './components/WeekGrid';
import LocationPicker from './components/LocationPicker';
import DateNavigation from './components/DateNavigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePersistedLocation } from './hooks/usePersistedLocation';
import { useWeather } from './hooks/useWeather';
import { mockEvents } from './data/mockEvents';
import { addDays } from './services/weatherApi';
import './styles/global.css';

function getSunday(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

function formatDateRange(startDate: string, data: { date: string }[]): string {
  if (data.length === 0) {
    // Format from weekStartDate
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
  const [weekStartDate, setWeekStartDate] = useState(() =>
    getSunday(new Date().toISOString().slice(0, 10)),
  );
  const { data, isLoading, error } = useWeather(location, weekStartDate);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__left">
          <h1 className="app-header__title">Weather Calendar</h1>
          <DateNavigation
            weekStartDate={weekStartDate}
            onChange={setWeekStartDate}
            disabled={!location}
          />
          <span className="app-header__subtitle">{formatDateRange(weekStartDate, data)}</span>
        </div>
        <div className="app-header__right">
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

      {isLoading && (
        <Alert className="rounded-none border-x-0 border-t-0 bg-accent/50 py-1.5">
          <AlertDescription className="text-center text-xs text-muted-foreground">
            Loading weather data...
          </AlertDescription>
        </Alert>
      )}

      {!location && !isLoading && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground text-sm">
            Search for a location to see the weather forecast.
          </p>
        </div>
      )}

      {location && data.length > 0 && (
        <>
          <WeekHeader weekData={data} weekStartDate={weekStartDate} />
          <WeekGrid weekData={data} events={mockEvents} />
        </>
      )}

      {location && data.length === 0 && !isLoading && !error && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      )}
    </div>
  );
}
