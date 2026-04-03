import WeekHeader from './components/WeekHeader';
import WeekGrid from './components/WeekGrid';
import LocationPicker from './components/LocationPicker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { usePersistedLocation } from './hooks/usePersistedLocation';
import { useWeather } from './hooks/useWeather';
import { mockEvents } from './data/mockEvents';
import './styles/global.css';

function formatDateRange(data: { date: string }[]): string {
  if (data.length === 0) return '';
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
  const { data, isLoading, error, source } = useWeather(location);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__left">
          <h1 className="app-header__title">Weather Calendar</h1>
          <span className="app-header__subtitle">
            {formatDateRange(data)}
            {source === 'mock' && !location && (
              <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-[10px]">
                Sample
              </Badge>
            )}
            {source === 'api' && (
              <Badge
                variant="outline"
                className="ml-2 border-green-500/50 px-1.5 py-0 text-[10px] text-green-400"
              >
                Live
              </Badge>
            )}
          </span>
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
          <AlertDescription className="text-center text-xs">
            {error} — showing sample data
          </AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <Alert className="rounded-none border-x-0 border-t-0 bg-accent/50 py-1.5">
          <AlertDescription className="text-center text-xs text-muted-foreground">
            Loading weather data...
          </AlertDescription>
        </Alert>
      )}

      <WeekHeader weekData={data} />
      <WeekGrid weekData={data} events={mockEvents} showDetails={false} />
    </div>
  );
}
