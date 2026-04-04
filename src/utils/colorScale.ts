import chroma from 'chroma-js';

/**
 * Perceptually uniform temperature → color scale using chroma.js.
 *
 * Color is driven purely by temperature. All weather conditions
 * (clouds, rain, snow, fog) are rendered as pattern overlays instead.
 */

const TARGET_L = 62;
const rawStops = [
  '#1e3a5f', // cold blue (14°F)
  '#3b82c4', // blue (32°F)
  '#5bb8d4', // cool cyan (46°F)
  '#6dbe88', // mild green (61°F)
  '#c4cc44', // warm yellow-green (72°F)
  '#e8a735', // warm orange (82°F)
  '#d45d2c', // hot red-orange (93°F)
  '#b02a1a', // extreme heat (104°F)
];
const normalizedStops = rawStops.map((hex) => {
  const [, a, b] = chroma(hex).lab();
  return chroma.lab(TARGET_L, a, b).hex();
});

const tempScale = chroma
  .bezier(normalizedStops)
  .scale()
  .domain([14, 32, 46, 61, 72, 82, 93, 104])
  .mode('lab');

/**
 * Returns a CSS color string for a given temperature + darkness level.
 * @param temp - Temperature in °F
 * @param darkness - 0 = full daylight, 1 = full night, values in between = twilight
 */
export function weatherToColor(temp: number, darkness: number): string {
  let color = tempScale(temp);

  if (darkness > 0) {
    color = color.darken(1.8 * darkness).desaturate(0.6 * darkness);
  }

  return color.css();
}

/**
 * Blend two colors in LAB space.
 */
export function blendColors(color1: string, color2: string, t: number): string {
  return chroma.mix(color1, color2, t, 'lab').css();
}
