// Each hour = 60px height
export const HOUR_HEIGHT = 60;
export const TOTAL_HOURS = 24;
export const TOTAL_HEIGHT = HOUR_HEIGHT * TOTAL_HOURS;

/**
 * Convert a decimal hour (e.g. 9.5 = 9:30 AM) to a pixel offset.
 */
export function hourToPixel(hour) {
  return hour * HOUR_HEIGHT;
}

/**
 * Convert a pixel offset back to a decimal hour.
 */
export function pixelToHour(px) {
  return px / HOUR_HEIGHT;
}

/**
 * Format a decimal hour to a display string.
 * e.g., 6.5 → "6:30 AM", 14 → "2:00 PM", 0 → "12 AM"
 */
export function formatHour(decimalHour) {
  const h = Math.floor(decimalHour);
  const m = Math.round((decimalHour - h) * 60);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * Format hour for the gutter label (e.g., "6 AM", "12 PM").
 */
export function formatGutterHour(hour) {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

/**
 * Get condition display label.
 */
export function conditionLabel(condition) {
  const labels = {
    clear: 'Clear',
    partly_cloudy: 'Partly Cloudy',
    cloudy: 'Cloudy',
    overcast: 'Overcast',
    fog: 'Fog',
    rain: 'Rain',
    heavy_rain: 'Heavy Rain',
    thunderstorm: 'Thunderstorm',
    snow: 'Snow',
  };
  return labels[condition] || condition;
}

/**
 * Get condition emoji/icon.
 */
export function conditionIcon(condition, isNight) {
  const icons = {
    clear: isNight ? '🌙' : '☀️',
    partly_cloudy: isNight ? '☁️' : '⛅',
    cloudy: '☁️',
    overcast: '☁️',
    fog: '🌫️',
    rain: '🌧️',
    heavy_rain: '🌧️',
    thunderstorm: '⛈️',
    snow: '🌨️',
  };
  return icons[condition] || '🌡️';
}
