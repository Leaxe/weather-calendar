import chroma from 'chroma-js';

/**
 * Perceptually uniform temperature → color scale using chroma.js.
 *
 * Uses a multi-stop bezier scale in LAB space so that transitions
 * between cold→warm feel smooth and evenly lit to the eye.
 */
const tempScale = chroma
  .bezier([
    '#1e3a5f', // deep cold blue (-10°C)
    '#3b82c4', // cold blue (0°C)
    '#5bb8d4', // cool cyan (8°C)
    '#6dbe88', // mild green (16°C)
    '#c4cc44', // warm yellow-green (22°C)
    '#e8a735', // warm orange (28°C)
    '#d45d2c', // hot red-orange (34°C)
    '#b02a1a', // extreme heat (40°C)
  ])
  .scale()
  .domain([-10, 0, 8, 16, 22, 28, 34, 40])
  .mode('lab');

// Sky condition modifiers — applied in LAB space for perceptual accuracy
const skyModifiers = {
  clear:         { darken: -0.3, desaturate: -0.2 }, // slightly brighter + more vivid
  partly_cloudy: { darken: 0,    desaturate: 0.3 },
  cloudy:        { darken: 0.2,  desaturate: 0.7 },
  overcast:      { darken: 0.4,  desaturate: 1.0 },
  fog:           { darken: 0.1,  desaturate: 1.2 },
};

/**
 * Returns a CSS color string for a given weather data point.
 * @param {number} temp - Temperature in °C
 * @param {string} condition - Weather condition key
 * @param {boolean} isNight - Whether this hour is before sunrise or after sunset
 */
export function weatherToColor(temp, condition, isNight) {
  let color = tempScale(temp);

  if (!isNight) {
    const mod = skyModifiers[condition];
    if (mod) {
      color = color.darken(mod.darken).desaturate(mod.desaturate);
    }
  }

  if (isNight) {
    color = color.darken(1.8).desaturate(0.6);
  }

  return color.css();
}

/**
 * Blend two colors in LAB space — used by gradientBuilder for sub-hour interpolation.
 */
export function blendColors(color1, color2, t) {
  return chroma.mix(color1, color2, t, 'lab').css();
}

/**
 * Checks if a condition is a precipitation type that should get a pattern overlay.
 */
export function isPrecipitation(condition) {
  return ['rain', 'heavy_rain', 'thunderstorm', 'snow'].includes(condition);
}
