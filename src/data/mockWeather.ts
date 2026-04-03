import type { HourlyData, DayData } from '../types';

// Numeric weather channels matching Open-Meteo API shape
// Temperature in °F, wind in mph, precipitation in mm, snowfall in cm, visibility in meters

interface Keyframe {
  hour: number;
  value: number;
}

interface GenerateDayParams {
  baseTemp: number;
  tempRange: number;
  peakHour?: number;
  cloudKF: Keyframe[];
  precipProbKF?: Keyframe[];
  precipKF?: Keyframe[];
  snowKF?: Keyframe[];
  visibilityKF?: Keyframe[];
  windKF?: Keyframe[];
  humidityKF?: Keyframe[];
}

/**
 * Attempt a smooth sinusoidal interpolation between keyframes.
 * keyframes: array of { hour, value } sorted by hour.
 * Returns value at the given hour with cosine interpolation.
 */
function interpolate(keyframes: Keyframe[], hour: number): number {
  if (hour <= keyframes[0].hour) return keyframes[0].value;
  if (hour >= keyframes[keyframes.length - 1].hour) return keyframes[keyframes.length - 1].value;

  let i = 0;
  while (i < keyframes.length - 1 && keyframes[i + 1].hour < hour) i++;
  const a = keyframes[i];
  const b = keyframes[i + 1];
  const t = (hour - a.hour) / (b.hour - a.hour);
  // Cosine interpolation for smooth transitions
  const ct = (1 - Math.cos(t * Math.PI)) / 2;
  return a.value + (b.value - a.value) * ct;
}

function generateDay({
  baseTemp,
  tempRange,
  peakHour,
  cloudKF,
  precipProbKF,
  precipKF,
  snowKF,
  visibilityKF,
  windKF,
  humidityKF,
}: GenerateDayParams): HourlyData[] {
  const peak = peakHour ?? 14;
  return Array.from({ length: 24 }, (_, hour) => {
    // Temperature: cosine curve peaking at peakHour
    const nightDip = Math.cos(((hour - peak) / 24) * 2 * Math.PI);
    const temp = Math.round((baseTemp + tempRange * nightDip) * 10) / 10;

    const cloudCover = Math.round(Math.max(0, Math.min(100, interpolate(cloudKF, hour))));
    const precipProb = precipProbKF
      ? Math.round(Math.max(0, Math.min(100, interpolate(precipProbKF, hour))))
      : 0;
    const precipitation = precipKF
      ? Math.round(Math.max(0, interpolate(precipKF, hour)) * 100) / 100
      : 0;
    const snowfall = snowKF ? Math.round(Math.max(0, interpolate(snowKF, hour)) * 100) / 100 : 0;
    const visibility = visibilityKF
      ? Math.round(Math.max(100, interpolate(visibilityKF, hour)))
      : 16000;
    const windSpeed = windKF
      ? Math.round(Math.max(0, interpolate(windKF, hour)) * 10) / 10
      : Math.round((5 + Math.sin(hour * 0.5) * 4) * 10) / 10;
    const humidity = humidityKF
      ? Math.round(Math.max(20, Math.min(100, interpolate(humidityKF, hour))))
      : Math.round(50 + Math.sin(hour * 0.3) * 10);

    return {
      hour,
      temp,
      cloudCover,
      precipProb,
      precipitation,
      snowfall,
      visibility,
      windSpeed,
      humidity,
    };
  });
}

// Week of April 6–12, 2026
export const weekData: DayData[] = [
  // Monday: Clear, low cloud cover (0-15%), no precip
  {
    date: '2026-04-06',
    dayName: 'Mon',
    sunrise: 6.5,
    sunset: 19.75,
    hourly: generateDay({
      baseTemp: 57,
      tempRange: 11,
      peakHour: 14,
      cloudKF: [
        { hour: 0, value: 8 },
        { hour: 6, value: 5 },
        { hour: 10, value: 12 },
        { hour: 14, value: 15 },
        { hour: 18, value: 10 },
        { hour: 23, value: 6 },
      ],
    }),
  },
  // Tuesday: Increasing clouds through the day (10% → 60%), no precip
  {
    date: '2026-04-07',
    dayName: 'Tue',
    sunrise: 6.48,
    sunset: 19.77,
    hourly: generateDay({
      baseTemp: 61,
      tempRange: 9,
      peakHour: 14,
      cloudKF: [
        { hour: 0, value: 8 },
        { hour: 6, value: 10 },
        { hour: 9, value: 15 },
        { hour: 12, value: 30 },
        { hour: 15, value: 45 },
        { hour: 18, value: 55 },
        { hour: 21, value: 60 },
        { hour: 23, value: 58 },
      ],
    }),
  },
  // Wednesday: Cloudy morning (70-80%), rain developing afternoon, tapering evening
  {
    date: '2026-04-08',
    dayName: 'Wed',
    sunrise: 6.45,
    sunset: 19.78,
    hourly: generateDay({
      baseTemp: 54,
      tempRange: 7,
      peakHour: 14,
      cloudKF: [
        { hour: 0, value: 55 },
        { hour: 4, value: 65 },
        { hour: 7, value: 75 },
        { hour: 10, value: 80 },
        { hour: 13, value: 85 },
        { hour: 16, value: 90 },
        { hour: 19, value: 75 },
        { hour: 22, value: 60 },
        { hour: 23, value: 55 },
      ],
      precipProbKF: [
        { hour: 0, value: 5 },
        { hour: 8, value: 10 },
        { hour: 11, value: 20 },
        { hour: 13, value: 50 },
        { hour: 15, value: 75 },
        { hour: 17, value: 80 },
        { hour: 19, value: 50 },
        { hour: 21, value: 20 },
        { hour: 23, value: 10 },
      ],
      precipKF: [
        { hour: 0, value: 0 },
        { hour: 11, value: 0 },
        { hour: 13, value: 0.5 },
        { hour: 15, value: 2.0 },
        { hour: 17, value: 3.0 },
        { hour: 19, value: 1.5 },
        { hour: 21, value: 0.3 },
        { hour: 23, value: 0 },
      ],
      humidityKF: [
        { hour: 0, value: 55 },
        { hour: 8, value: 60 },
        { hour: 12, value: 70 },
        { hour: 16, value: 85 },
        { hour: 20, value: 75 },
        { hour: 23, value: 65 },
      ],
      windKF: [
        { hour: 0, value: 5 },
        { hour: 8, value: 7 },
        { hour: 14, value: 12 },
        { hour: 18, value: 10 },
        { hour: 23, value: 6 },
      ],
    }),
  },
  // Thursday: Early morning snow → rain midday → clearing evening
  {
    date: '2026-04-09',
    dayName: 'Thu',
    sunrise: 6.43,
    sunset: 19.8,
    hourly: generateDay({
      baseTemp: 38,
      tempRange: 8,
      peakHour: 14,
      cloudKF: [
        { hour: 0, value: 90 },
        { hour: 4, value: 92 },
        { hour: 8, value: 88 },
        { hour: 12, value: 85 },
        { hour: 16, value: 70 },
        { hour: 19, value: 45 },
        { hour: 22, value: 25 },
        { hour: 23, value: 20 },
      ],
      precipProbKF: [
        { hour: 0, value: 70 },
        { hour: 3, value: 80 },
        { hour: 6, value: 75 },
        { hour: 9, value: 70 },
        { hour: 12, value: 80 },
        { hour: 15, value: 65 },
        { hour: 18, value: 30 },
        { hour: 21, value: 10 },
        { hour: 23, value: 5 },
      ],
      snowKF: [
        { hour: 0, value: 0.8 },
        { hour: 2, value: 1.2 },
        { hour: 4, value: 1.5 },
        { hour: 6, value: 1.0 },
        { hour: 8, value: 0.5 },
        { hour: 10, value: 0 },
        { hour: 23, value: 0 },
      ],
      precipKF: [
        { hour: 0, value: 0 },
        { hour: 8, value: 0 },
        { hour: 10, value: 1.0 },
        { hour: 12, value: 3.0 },
        { hour: 14, value: 4.0 },
        { hour: 16, value: 2.5 },
        { hour: 18, value: 0.8 },
        { hour: 20, value: 0 },
        { hour: 23, value: 0 },
      ],
      visibilityKF: [
        { hour: 0, value: 4000 },
        { hour: 3, value: 3000 },
        { hour: 6, value: 3500 },
        { hour: 10, value: 6000 },
        { hour: 14, value: 8000 },
        { hour: 18, value: 12000 },
        { hour: 23, value: 16000 },
      ],
      humidityKF: [
        { hour: 0, value: 85 },
        { hour: 6, value: 88 },
        { hour: 12, value: 80 },
        { hour: 18, value: 60 },
        { hour: 23, value: 50 },
      ],
      windKF: [
        { hour: 0, value: 8 },
        { hour: 6, value: 10 },
        { hour: 12, value: 15 },
        { hour: 18, value: 8 },
        { hour: 23, value: 5 },
      ],
    }),
  },
  // Friday: Overcast morning (80-90%), breaking up afternoon (90→30%)
  {
    date: '2026-04-10',
    dayName: 'Fri',
    sunrise: 6.42,
    sunset: 19.82,
    hourly: generateDay({
      baseTemp: 55,
      tempRange: 9,
      peakHour: 15,
      cloudKF: [
        { hour: 0, value: 75 },
        { hour: 4, value: 82 },
        { hour: 7, value: 88 },
        { hour: 10, value: 90 },
        { hour: 13, value: 80 },
        { hour: 15, value: 60 },
        { hour: 17, value: 45 },
        { hour: 19, value: 35 },
        { hour: 22, value: 30 },
        { hour: 23, value: 28 },
      ],
      humidityKF: [
        { hour: 0, value: 65 },
        { hour: 8, value: 70 },
        { hour: 14, value: 55 },
        { hour: 20, value: 48 },
        { hour: 23, value: 45 },
      ],
    }),
  },
  // Saturday: Clear and warm, minimal clouds (5-15%)
  {
    date: '2026-04-11',
    dayName: 'Sat',
    sunrise: 6.4,
    sunset: 19.83,
    hourly: generateDay({
      baseTemp: 64,
      tempRange: 11,
      peakHour: 14,
      cloudKF: [
        { hour: 0, value: 8 },
        { hour: 6, value: 5 },
        { hour: 10, value: 10 },
        { hour: 14, value: 15 },
        { hour: 18, value: 12 },
        { hour: 23, value: 7 },
      ],
      humidityKF: [
        { hour: 0, value: 40 },
        { hour: 10, value: 35 },
        { hour: 16, value: 38 },
        { hour: 23, value: 42 },
      ],
    }),
  },
  // Sunday: Partly cloudy (20-40% clouds), pleasant
  {
    date: '2026-04-12',
    dayName: 'Sun',
    sunrise: 6.38,
    sunset: 19.85,
    hourly: generateDay({
      baseTemp: 68,
      tempRange: 13,
      peakHour: 14,
      cloudKF: [
        { hour: 0, value: 15 },
        { hour: 6, value: 20 },
        { hour: 9, value: 25 },
        { hour: 12, value: 35 },
        { hour: 15, value: 40 },
        { hour: 18, value: 35 },
        { hour: 21, value: 25 },
        { hour: 23, value: 20 },
      ],
      humidityKF: [
        { hour: 0, value: 45 },
        { hour: 10, value: 40 },
        { hour: 16, value: 42 },
        { hour: 23, value: 48 },
      ],
    }),
  },
];
