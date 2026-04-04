import type { DayData, HourlyData } from '../types';
import { addDays } from '../utils/dateUtils';

/**
 * Generates 7 days of demo data, each showcasing a different weather condition.
 * Sun: Clear, Mon: Cloudy, Tue: Rain, Wed: Heavy Rain,
 * Thu: Snow, Fri: Freezing Rain, Sat: Fog
 */
export function generateDemoWeek(startDate: string): DayData[] {
  const conditions: {
    label: string;
    weatherCode: number;
    cloudCover: number;
    precipitation: number;
    visibility: number;
    temp: number;
  }[] = [
    { label: 'Clear', weatherCode: 0, cloudCover: 5, precipitation: 0, visibility: 16000, temp: 72 },
    { label: 'Cloudy', weatherCode: 3, cloudCover: 85, precipitation: 0, visibility: 12000, temp: 58 },
    { label: 'Rain', weatherCode: 61, cloudCover: 90, precipitation: 1.5, visibility: 8000, temp: 52 },
    { label: 'Heavy Rain', weatherCode: 65, cloudCover: 95, precipitation: 8, visibility: 4000, temp: 50 },
    { label: 'Snow', weatherCode: 73, cloudCover: 90, precipitation: 2, visibility: 3000, temp: 30 },
    { label: 'Freezing Rain', weatherCode: 66, cloudCover: 90, precipitation: 2, visibility: 5000, temp: 33 },
    { label: 'Fog', weatherCode: 45, cloudCover: 60, precipitation: 0, visibility: 500, temp: 48 },
  ];

  return conditions.map((cond, i) => {
    const date = addDays(startDate, i);
    const d = new Date(date + 'T12:00:00');
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

    const hourly: HourlyData[] = Array.from({ length: 24 }, (_, hour) => {
      // Vary intensity through the day — peaks at midday
      const dayCurve = Math.sin((hour / 24) * Math.PI);
      const intensity = 0.3 + 0.7 * dayCurve;

      return {
        hour,
        temp: cond.temp + Math.round(dayCurve * 8 - 4),
        cloudCover: Math.round(cond.cloudCover * (0.5 + 0.5 * intensity)),
        precipitation: Math.round(cond.precipitation * intensity * 100) / 100,
        weatherCode: cond.precipitation > 0 || cond.weatherCode >= 45 ? cond.weatherCode : hour >= 6 && hour <= 20 ? cond.weatherCode : 0,
        visibility: Math.round(cond.visibility + (16000 - cond.visibility) * (1 - intensity)),
        windSpeed: Math.round((5 + dayCurve * 8) * 10) / 10,
      };
    });

    return { date, dayName, sunrise: 6.5, sunset: 19.5, hourly };
  });
}
