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
 * Determine the dominant condition from numeric weather channels.
 * Returns { icon, label } based on priority rules.
 */
function dominantCondition(hourData, isNight) {
  if (hourData.visibility < 2000) {
    return { icon: '🌫️', label: 'Fog' };
  }
  if (hourData.snowfall > 0) {
    return { icon: '🌨️', label: 'Snow' };
  }
  if (hourData.precipitation > 0) {
    return { icon: '🌧️', label: 'Rain' };
  }
  if (hourData.cloudCover > 70) {
    return { icon: '☁️', label: 'Overcast' };
  }
  if (hourData.cloudCover > 30) {
    return { icon: '☁️', label: 'Cloudy' };
  }
  if (hourData.cloudCover > 10) {
    return { icon: isNight ? '☁️' : '⛅', label: 'Partly Cloudy' };
  }
  return { icon: isNight ? '🌙' : '☀️', label: 'Clear' };
}

/**
 * Get condition display label from numeric channels.
 */
export function conditionLabel(hourData, isNight) {
  return dominantCondition(hourData, isNight).label;
}

/**
 * Get condition emoji/icon from numeric channels.
 */
export function conditionIcon(hourData, isNight) {
  return dominantCondition(hourData, isNight).icon;
}
