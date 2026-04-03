/**
 * Generates cloud/fog noise textures using Canvas API.
 * Uses seeded randomness so textures are stable across re-renders.
 */

// Simple seeded PRNG (mulberry32)
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Renders a noise texture to an offscreen canvas and returns a data URL.
 * @param {object} opts
 * @param {number} opts.width - Canvas width
 * @param {number} opts.height - Canvas height
 * @param {number} opts.seed - Random seed for reproducibility
 * @param {string} opts.type - 'partly_cloudy' | 'cloudy' | 'overcast' | 'fog'
 */
export function generateNoiseTexture({ width = 200, height = 60, seed = 42, type = 'cloudy' }) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const rand = mulberry32(seed);

  const config = noiseConfig[type] || noiseConfig.cloudy;

  // Layer multiple passes of blobs for depth
  for (let pass = 0; pass < config.passes; pass++) {
    const count = config.countPerPass;
    for (let i = 0; i < count; i++) {
      const x = rand() * width;
      const y = rand() * height;
      const rx = config.minRadius + rand() * (config.maxRadius - config.minRadius);
      const ry = rx * config.yStretch;
      const alpha = config.minAlpha + rand() * (config.maxAlpha - config.minAlpha);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = config.color;
      ctx.fill();
      ctx.restore();
    }
  }

  // Optional blur for softness — apply by drawing scaled down then up
  if (config.blur) {
    const small = document.createElement('canvas');
    const sf = config.blur; // scale factor (lower = blurrier)
    small.width = Math.ceil(width * sf);
    small.height = Math.ceil(height * sf);
    const sCtx = small.getContext('2d');
    sCtx.drawImage(canvas, 0, 0, small.width, small.height);
    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(small, 0, 0, width, height);
  }

  return canvas.toDataURL();
}

const noiseConfig = {
  partly_cloudy: {
    passes: 2,
    countPerPass: 15,
    minRadius: 20,
    maxRadius: 50,
    yStretch: 0.5,
    minAlpha: 0.03,
    maxAlpha: 0.1,
    color: '#c8d0e0',
    blur: 0.25,
  },
  cloudy: {
    passes: 3,
    countPerPass: 25,
    minRadius: 15,
    maxRadius: 45,
    yStretch: 0.5,
    minAlpha: 0.04,
    maxAlpha: 0.14,
    color: '#b8c0d0',
    blur: 0.2,
  },
  overcast: {
    passes: 4,
    countPerPass: 40,
    minRadius: 12,
    maxRadius: 40,
    yStretch: 0.6,
    minAlpha: 0.06,
    maxAlpha: 0.18,
    color: '#a0a8b8',
    blur: 0.18,
  },
  fog: {
    passes: 3,
    countPerPass: 30,
    minRadius: 30,
    maxRadius: 80,
    yStretch: 0.2, // very horizontally stretched
    minAlpha: 0.04,
    maxAlpha: 0.12,
    color: '#d0d4de',
    blur: 0.15,
  },
};

// Cache generated textures by key
const textureCache = new Map();

/**
 * Get a noise texture data URL, cached by type + seed.
 */
export function getNoiseTexture(type, seed) {
  const key = `${type}-${seed}`;
  if (!textureCache.has(key)) {
    textureCache.set(key, generateNoiseTexture({ seed, type }));
  }
  return textureCache.get(key);
}
