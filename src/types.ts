export interface HourlyData {
  hour: number;
  temp: number;
  cloudCover: number;
  precipProb: number;
  precipitation: number;
  snowfall: number;
  visibility: number;
  windSpeed: number;
  humidity: number;
}

export interface DayData {
  date: string;
  dayName: string;
  sunrise: number;
  sunset: number;
  hourly: HourlyData[];
}

export interface CalendarEvent {
  id: number;
  title: string;
  day: number;
  startHour: number;
  endHour: number;
}

export type OverlayType = 'cloud' | 'rain' | 'snow' | 'fog';

export interface WeatherOverlay {
  type: OverlayType;
  intensities: number[];
}
