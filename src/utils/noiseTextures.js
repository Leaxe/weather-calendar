/**
 * Generates full-day weather overlay textures using Canvas API.
 * One tall canvas per overlay type per day, with density varying
 * smoothly across the 24-hour height based on an intensity curve.
 */

// Seeded PRNG (mulberry32)
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HOUR_PX = 60; // must match HOUR_HEIGHT in timeUtils
const DAY_HEIGHT = HOUR_PX * 24;

const configs = {
  cloud: {
    passes: 3,
    densityPerHour: 28,
    minRadius: 14,
    maxRadius: 42,
    yStretch: 0.5,
    minAlpha: 0.06,
    maxAlpha: 0.18,
    color: '#c0c8d8',
    blur: 0.22,
  },
  fog: {
    passes: 4,
    densityPerHour: 30,
    minRadius: 28,
    maxRadius: 70,
    yStretch: 0.18,
    minAlpha: 0.07,
    maxAlpha: 0.2,
    color: '#d8dce6',
    blur: 0.15,
  },
  rain: {
    densityPerHour: 40,
    minLength: 6,
    maxLength: 14,
    strokeWidth: 1.5,
    angle: -78,
    color: '#c0d8ff',
    minAlpha: 0.3,
    maxAlpha: 0.7,
  },
  snow: {
    densityPerHour: 28,
    minRadius: 1.0,
    maxRadius: 3.0,
    color: '#ffffff',
    minAlpha: 0.25,
    maxAlpha: 0.65,
    blur: 0.4,
  },
};

/**
 * Sample the intensity curve at a given pixel y-position.
 * Interpolates linearly between hourly values for smooth variation.
 */
function sampleIntensity(intensities, y) {
  const hour = y / HOUR_PX;
  const lo = Math.max(0, Math.min(23, Math.floor(hour)));
  const hi = Math.min(23, lo + 1);
  const frac = hour - lo;
  return intensities[lo] * (1 - frac) + intensities[hi] * frac;
}

/**
 * Generate a full-day texture for an overlay type.
 * @param {string} type - 'cloud' | 'rain' | 'snow' | 'fog'
 * @param {number[]} intensities - 24-element array of 0-1 values
 * @param {number} seed - PRNG seed
 * @param {number} width - Canvas width
 */
export function generateDayTexture({ type, intensities, seed, width = 200 }) {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = DAY_HEIGHT;
  const ctx = canvas.getContext('2d');
  const rand = mulberry32(seed);

  if (type === 'rain') {
    drawRain(ctx, rand, width, intensities);
  } else if (type === 'snow') {
    drawSnow(ctx, rand, width, intensities);
  } else {
    drawClouds(ctx, rand, width, intensities, type);
  }

  return canvas.toDataURL();
}

function drawClouds(ctx, rand, width, intensities, type) {
  const cfg = configs[type];

  for (let pass = 0; pass < cfg.passes; pass++) {
    // Scatter blobs across the entire day, density proportional to local intensity
    for (let hour = 0; hour < 24; hour++) {
      const intensity = intensities[hour];
      if (intensity <= 0) continue;
      const count = Math.ceil(cfg.densityPerHour * intensity);

      for (let i = 0; i < count; i++) {
        const x = rand() * width;
        // Place within this hour's region, with some bleed into neighbors
        const y = hour * HOUR_PX + (rand() - 0.2) * HOUR_PX * 1.4;
        const rx = cfg.minRadius + rand() * (cfg.maxRadius - cfg.minRadius);
        const ry = rx * cfg.yStretch;
        // Alpha scales with the local intensity at this exact y position
        const localIntensity = sampleIntensity(intensities, Math.max(0, Math.min(DAY_HEIGHT - 1, y)));
        const alpha = (cfg.minAlpha + rand() * (cfg.maxAlpha - cfg.minAlpha)) * localIntensity;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = cfg.color;
        ctx.fill();
        ctx.restore();
      }
    }
  }

  if (cfg.blur) {
    const small = document.createElement('canvas');
    const sf = cfg.blur;
    small.width = Math.ceil(width * sf);
    small.height = Math.ceil(DAY_HEIGHT * sf);
    const sCtx = small.getContext('2d');
    sCtx.drawImage(ctx.canvas, 0, 0, small.width, small.height);
    ctx.clearRect(0, 0, width, DAY_HEIGHT);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(small, 0, 0, width, DAY_HEIGHT);
  }
}

function drawRain(ctx, rand, width, intensities) {
  const cfg = configs.rain;
  const angleRad = (cfg.angle * Math.PI) / 180;

  for (let hour = 0; hour < 24; hour++) {
    const intensity = intensities[hour];
    if (intensity <= 0) continue;
    const count = Math.ceil(cfg.densityPerHour * intensity);

    for (let i = 0; i < count; i++) {
      const x = rand() * width;
      const y = hour * HOUR_PX + rand() * HOUR_PX;
      const localIntensity = sampleIntensity(intensities, y);
      const len = cfg.minLength + rand() * (cfg.maxLength - cfg.minLength);
      const alpha = (cfg.minAlpha + rand() * (cfg.maxAlpha - cfg.minAlpha)) * localIntensity;

      const dx = Math.cos(angleRad) * len;
      const dy = Math.sin(angleRad) * len;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = cfg.color;
      ctx.lineWidth = cfg.strokeWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + dx, y - dy);
      ctx.stroke();
      ctx.restore();
    }
  }
}

function drawSnow(ctx, rand, width, intensities) {
  const cfg = configs.snow;

  for (let hour = 0; hour < 24; hour++) {
    const intensity = intensities[hour];
    if (intensity <= 0) continue;
    const count = Math.ceil(cfg.densityPerHour * intensity);

    for (let i = 0; i < count; i++) {
      const x = rand() * width;
      const y = hour * HOUR_PX + rand() * HOUR_PX;
      const localIntensity = sampleIntensity(intensities, y);
      const r = cfg.minRadius + rand() * (cfg.maxRadius - cfg.minRadius);
      const alpha = (cfg.minAlpha + rand() * (cfg.maxAlpha - cfg.minAlpha)) * localIntensity;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = cfg.color;
      ctx.fillStyle = cfg.color;
      ctx.lineWidth = 0.6;
      ctx.translate(x, y);

      if (r > 1.8) {
        const arms = 6;
        const rotation = rand() * Math.PI;
        for (let a = 0; a < arms; a++) {
          const angle = rotation + (a * Math.PI * 2) / arms;
          const armLen = r * 1.5;
          const cx = Math.cos(angle);
          const cy = Math.sin(angle);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(cx * armLen, cy * armLen);
          ctx.stroke();
          const branchPos = 0.6;
          const branchLen = armLen * 0.35;
          const bx = cx * armLen * branchPos;
          const by = cy * armLen * branchPos;
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(bx + Math.cos(angle + Math.PI / 4) * branchLen, by + Math.sin(angle + Math.PI / 4) * branchLen);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(bx + Math.cos(angle - Math.PI / 4) * branchLen, by + Math.sin(angle - Math.PI / 4) * branchLen);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(0, 0, 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  if (cfg.blur) {
    const small = document.createElement('canvas');
    const sf = cfg.blur;
    small.width = Math.ceil(width * sf);
    small.height = Math.ceil(DAY_HEIGHT * sf);
    const sCtx = small.getContext('2d');
    sCtx.drawImage(ctx.canvas, 0, 0, small.width, small.height);
    ctx.clearRect(0, 0, width, DAY_HEIGHT);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(small, 0, 0, width, DAY_HEIGHT);
  }
}

// Cache by key
const textureCache = new Map();

/**
 * Get a full-day texture data URL, cached.
 */
export function getDayTexture(type, intensities, seed) {
  const key = `${type}-${seed}-${intensities.map(v => v.toFixed(2)).join(',')}`;
  if (!textureCache.has(key)) {
    textureCache.set(key, generateDayTexture({ type, intensities, seed }));
  }
  return textureCache.get(key);
}
