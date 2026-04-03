import chroma from 'chroma-js';

/**
 * Perceptually uniform temperature → color scale using chroma.js.
 *
 * Color is driven purely by temperature. All weather conditions
 * (clouds, rain, snow, fog) are rendered as pattern overlays instead.
 */
// Original hue stops — normalized at runtime to equal LAB lightness
// so weather overlays have consistent contrast across all temperatures.
const TARGET_L = 62;
const rawStops: string[] = [
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
 * Returns a CSS color string for a given temperature + time of day.
 * @param temp - Temperature in °F
 * @param _condition - Unused, kept for call-site compatibility
 * @param isNight - Whether this hour is before sunrise or after sunset
 */
export function weatherToColor(temp: number, _condition: string | null, isNight: boolean): string {
  let color = tempScale(temp);

  if (isNight) {
    color = color.darken(1.8).desaturate(0.6);
  }

  return color.css();
}

/**
 * Blend two colors in LAB space.
 */
export function blendColors(color1: string, color2: string, t: number): string {
  return chroma.mix(color1, color2, t, 'lab').css();
}
