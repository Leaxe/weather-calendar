// Weather conditions: clear, partly_cloudy, cloudy, overcast, rain, heavy_rain, snow, thunderstorm, fog
// Temperature in °F, wind in mph, precipitation in %

function generateHourlyData(baseTemp, tempCurve, condition, sunriseHour, sunsetHour) {
  return Array.from({ length: 24 }, (_, hour) => {
    const t = hour / 23;
    // Temperature follows a curve: coolest near sunrise, warmest ~2pm
    const peakHour = 14;
    const nightDip = Math.cos(((hour - peakHour) / 24) * 2 * Math.PI);
    const temp = baseTemp + tempCurve * nightDip;

    return {
      hour,
      temp: Math.round(temp * 10) / 10,
      condition: typeof condition === 'function' ? condition(hour) : condition,
      windSpeed: Math.round((5 + Math.sin(hour * 0.5) * 4 + Math.random() * 2.5) * 10) / 10,
      precipitation: getPrecipitation(typeof condition === 'function' ? condition(hour) : condition),
      humidity: getHumidity(typeof condition === 'function' ? condition(hour) : condition, temp),
    };
  });
}

function getPrecipitation(condition) {
  const map = {
    clear: 0, partly_cloudy: 5, cloudy: 10, overcast: 15,
    rain: 65, heavy_rain: 90, snow: 70, thunderstorm: 85, fog: 5,
  };
  return (map[condition] || 0) + Math.round(Math.random() * 10);
}

function getHumidity(condition, temp) {
  const base = condition.includes('rain') || condition === 'snow' ? 80 : condition === 'fog' ? 95 : 50;
  return Math.min(100, Math.max(20, base + Math.round(Math.random() * 15 - 7)));
}

// Week of April 6–12, 2026
export const weekData = [
  {
    date: '2026-04-06',
    dayName: 'Mon',
    sunrise: 6.5,   // 6:30 AM
    sunset: 19.75,   // 7:45 PM
    hourly: generateHourlyData(57, 11, 'clear', 6.5, 19.75),
  },
  {
    date: '2026-04-07',
    dayName: 'Tue',
    sunrise: 6.48,
    sunset: 19.77,
    hourly: generateHourlyData(61, 9, (h) => h >= 10 && h <= 16 ? 'partly_cloudy' : 'clear', 6.48, 19.77),
  },
  {
    date: '2026-04-08',
    dayName: 'Wed',
    sunrise: 6.45,
    sunset: 19.78,
    hourly: generateHourlyData(54, 7, (h) => {
      if (h < 8) return 'cloudy';
      if (h < 11) return 'overcast';
      if (h < 18) return 'rain';
      return 'overcast';
    }, 6.45, 19.78),
  },
  {
    date: '2026-04-09',
    dayName: 'Thu',
    sunrise: 6.43,
    sunset: 19.8,
    hourly: generateHourlyData(43, 5, (h) => {
      if (h < 4) return 'snow';
      if (h < 8) return 'snow';
      if (h < 11) return 'rain';
      if (h < 15) return 'heavy_rain';
      if (h < 18) return 'rain';
      return 'overcast';
    }, 6.43, 19.8),
  },
  {
    date: '2026-04-10',
    dayName: 'Fri',
    sunrise: 6.42,
    sunset: 19.82,
    hourly: generateHourlyData(55, 9, (h) => {
      if (h < 9) return 'overcast';
      if (h < 12) return 'cloudy';
      return 'partly_cloudy';
    }, 6.42, 19.82),
  },
  {
    date: '2026-04-11',
    dayName: 'Sat',
    sunrise: 6.4,
    sunset: 19.83,
    hourly: generateHourlyData(64, 11, 'clear', 6.4, 19.83),
  },
  {
    date: '2026-04-12',
    dayName: 'Sun',
    sunrise: 6.38,
    sunset: 19.85,
    hourly: generateHourlyData(68, 13, (h) => h >= 14 && h <= 20 ? 'partly_cloudy' : 'clear', 6.38, 19.85),
  },
];
