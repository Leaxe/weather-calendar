export interface HourlyData {
  hour: number;
  temp: number;
  cloudCover: number;
  precipitation: number;
  weatherCode: number;
  visibility: number;
  windSpeed: number;
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

export interface GeoLocation {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}

export type OverlayType = 'cloud' | 'rain' | 'snow' | 'freezing_rain' | 'fog';

export interface WeatherOverlay {
  type: OverlayType;
  intensities: number[];
}
