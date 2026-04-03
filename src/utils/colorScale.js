import chroma from 'chroma-js';

/**
 * Perceptually uniform temperature → color scale using chroma.js.
 *
 * Color is driven purely by temperature. All weather conditions
 * (clouds, rain, snow, fog) are rendered as pattern overlays instead.
 */
const tempScale = chroma
  .bezier([
    '#1e3a5f', // deep cold blue (14°F)
    '#3b82c4', // cold blue (32°F)
    '#5bb8d4', // cool cyan (46°F)
    '#6dbe88', // mild green (61°F)
    '#c4cc44', // warm yellow-green (72°F)
    '#e8a735', // warm orange (82°F)
    '#d45d2c', // hot red-orange (93°F)
    '#b02a1a', // extreme heat (104°F)
  ])
  .scale()
  .domain([14, 32, 46, 61, 72, 82, 93, 104])
  .mode('lab');

/**
 * Returns a CSS color string for a given temperature + time of day.
 * @param {number} temp - Temperature in °F
 * @param {string} _condition - Unused, kept for call-site compatibility
 * @param {boolean} isNight - Whether this hour is before sunrise or after sunset
 */
export function weatherToColor(temp, _condition, isNight) {
  let color = tempScale(temp);

  if (isNight) {
    color = color.darken(1.8).desaturate(0.6);
  }

  return color.css();
}

/**
 * Blend two colors in LAB space.
 */
export function blendColors(color1, color2, t) {
  return chroma.mix(color1, color2, t, 'lab').css();
}
