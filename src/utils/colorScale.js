/**
 * Maps temperature + sky condition to an HSL color.
 *
 * Temperature controls the hue (blue → red).
 * Sky conditions (cloud cover) modify saturation/lightness — but only during daytime.
 * Precipitation (rain/snow/thunderstorm) does NOT affect color — those use pattern overlays.
 * Night hours are simply darkened, ignoring sky conditions.
 */

// Temperature range: -10°C to 40°C mapped to hue 240 (blue) → 0 (red)
function tempToHue(temp) {
  const clamped = Math.max(-10, Math.min(40, temp));
  return 240 - ((clamped + 10) / 50) * 240;
}

// Only sky/visibility conditions affect color — precipitation conditions are excluded
const skyModifiers = {
  clear:         { satAdj: 0,    lightAdj: 8 },
  partly_cloudy: { satAdj: -10,  lightAdj: 4 },
  cloudy:        { satAdj: -25,  lightAdj: 0 },
  overcast:      { satAdj: -35,  lightAdj: -5 },
  fog:           { satAdj: -40,  lightAdj: 5 },
};

/**
 * Returns an HSL color string for a given weather data point.
 * @param {number} temp - Temperature in °C
 * @param {string} condition - Weather condition key
 * @param {boolean} isNight - Whether this hour is before sunrise or after sunset
 */
export function weatherToColor(temp, condition, isNight) {
  const hue = tempToHue(temp);
  let saturation = 55;
  let lightness = 55;

  // Only apply sky modifiers during the day
  if (!isNight) {
    const mod = skyModifiers[condition];
    if (mod) {
      saturation += mod.satAdj;
      lightness += mod.lightAdj;
    }
    // Precipitation conditions (rain, snow, etc.) get no color modifier —
    // they use a pattern overlay instead.
  }

  if (isNight) {
    lightness -= 20;
    saturation -= 10;
  }

  saturation = Math.max(10, Math.min(100, saturation));
  lightness = Math.max(12, Math.min(85, lightness));

  return `hsl(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
}

/**
 * Checks if a condition is a precipitation type that should get a pattern overlay.
 */
export function isPrecipitation(condition) {
  return ['rain', 'heavy_rain', 'thunderstorm', 'snow'].includes(condition);
}
