interface ConditionDisplay {
  icon: string;
  label: string;
}

/**
 * Full WMO weather code → human label + icon.
 * This is the raw API condition, shown in tooltips.
 */
const WMO_CONDITIONS: Record<number, ConditionDisplay> = {
  0: { icon: '\u2600\uFE0F', label: 'Clear Sky' },
  1: { icon: '\u{1F324}\uFE0F', label: 'Mainly Clear' },
  2: { icon: '\u26C5', label: 'Partly Cloudy' },
  3: { icon: '\u2601\uFE0F', label: 'Overcast' },
  45: { icon: '\u{1F32B}\uFE0F', label: 'Fog' },
  48: { icon: '\u{1F32B}\uFE0F', label: 'Depositing Rime Fog' },
  51: { icon: '\u{1F327}\uFE0F', label: 'Light Drizzle' },
  53: { icon: '\u{1F327}\uFE0F', label: 'Moderate Drizzle' },
  55: { icon: '\u{1F327}\uFE0F', label: 'Dense Drizzle' },
  56: { icon: '\u{1F9CA}', label: 'Light Freezing Drizzle' },
  57: { icon: '\u{1F9CA}', label: 'Dense Freezing Drizzle' },
  61: { icon: '\u{1F327}\uFE0F', label: 'Slight Rain' },
  63: { icon: '\u{1F327}\uFE0F', label: 'Moderate Rain' },
  65: { icon: '\u{1F327}\uFE0F', label: 'Heavy Rain' },
  66: { icon: '\u{1F9CA}', label: 'Light Freezing Rain' },
  67: { icon: '\u{1F9CA}', label: 'Heavy Freezing Rain' },
  71: { icon: '\u{1F328}\uFE0F', label: 'Slight Snowfall' },
  73: { icon: '\u{1F328}\uFE0F', label: 'Moderate Snowfall' },
  75: { icon: '\u{1F328}\uFE0F', label: 'Heavy Snowfall' },
  77: { icon: '\u{1F328}\uFE0F', label: 'Snow Grains' },
  80: { icon: '\u{1F327}\uFE0F', label: 'Slight Rain Showers' },
  81: { icon: '\u{1F327}\uFE0F', label: 'Moderate Rain Showers' },
  82: { icon: '\u{1F327}\uFE0F', label: 'Violent Rain Showers' },
  85: { icon: '\u{1F328}\uFE0F', label: 'Slight Snow Showers' },
  86: { icon: '\u{1F328}\uFE0F', label: 'Heavy Snow Showers' },
  95: { icon: '\u26C8\uFE0F', label: 'Thunderstorm' },
  96: { icon: '\u26C8\uFE0F', label: 'Thunderstorm with Slight Hail' },
  99: { icon: '\u26C8\uFE0F', label: 'Thunderstorm with Heavy Hail' },
};

const UNKNOWN: ConditionDisplay = { icon: '\u{1F321}\uFE0F', label: 'Unknown' };

/**
 * Get the WMO condition label for a weather code.
 * Used by tooltips to show exactly what the API reports.
 */
export function wmoConditionLabel(code: number): string {
  return (WMO_CONDITIONS[code] ?? UNKNOWN).label;
}

/**
 * Get the WMO condition icon for a weather code.
 */
export function wmoConditionIcon(code: number, isNight: boolean): string {
  if (code <= 1 && isNight) return '\u{1F319}';
  return (WMO_CONDITIONS[code] ?? UNKNOWN).icon;
}

