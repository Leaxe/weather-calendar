import type { HourlyData } from '../types';

// Each hour = 60px height
export const HOUR_HEIGHT = 60;
export const TOTAL_HOURS = 24;
export const TOTAL_HEIGHT = HOUR_HEIGHT * TOTAL_HOURS;

/**
 * Convert a decimal hour (e.g. 9.5 = 9:30 AM) to a pixel offset.
 */
export function hourToPixel(hour: number): number {
  return hour * HOUR_HEIGHT;
}

/**
 * Convert a pixel offset back to a decimal hour.
 */
export function pixelToHour(px: number): number {
  return px / HOUR_HEIGHT;
}

/**
 * Format a decimal hour to a display string.
 * e.g., 6.5 → "6:30 AM", 14 → "2:00 PM", 0 → "12 AM"
 */
export function formatHour(decimalHour: number): string {
  const h = Math.floor(decimalHour);
  const m = Math.round((decimalHour - h) * 60);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * Format hour for the gutter label (e.g., "6 AM", "12 PM").
 */
export function formatGutterHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

interface ConditionDisplay {
  icon: string;
  label: string;
}

/**
 * Determine the dominant condition from numeric weather channels.
 * Returns { icon, label } based on priority rules.
 */
function dominantCondition(hourData: HourlyData, isNight: boolean): ConditionDisplay {
  if (hourData.visibility < 2000) {
    return { icon: '\u{1F32B}\uFE0F', label: 'Fog' };
  }
  if (hourData.snowfall > 0) {
    return { icon: '\u{1F328}\uFE0F', label: 'Snow' };
  }
  if (hourData.precipitation > 0) {
    return { icon: '\u{1F327}\uFE0F', label: 'Rain' };
  }
  if (hourData.cloudCover > 70) {
    return { icon: '\u2601\uFE0F', label: 'Overcast' };
  }
  if (hourData.cloudCover > 30) {
    return { icon: '\u2601\uFE0F', label: 'Cloudy' };
  }
  if (hourData.cloudCover > 10) {
    return { icon: isNight ? '\u2601\uFE0F' : '\u26C5', label: 'Partly Cloudy' };
  }
  return { icon: isNight ? '\u{1F319}' : '\u2600\uFE0F', label: 'Clear' };
}

/**
 * Get condition display label from numeric channels.
 */
export function conditionLabel(hourData: HourlyData, isNight: boolean): string {
  return dominantCondition(hourData, isNight).label;
}

/**
 * Get condition emoji/icon from numeric channels.
 */
export function conditionIcon(hourData: HourlyData, isNight: boolean): string {
  return dominantCondition(hourData, isNight).icon;
}
