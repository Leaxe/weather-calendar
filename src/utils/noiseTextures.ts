import type { OverlayType } from '../types';

/**
 * Generates full-day weather overlay textures using Canvas API.
 * One tall canvas per overlay type per day, with density varying
 * smoothly across the 24-hour height based on an intensity curve.
 * Accepts hourPx to render at the correct zoom level.
 */

// Seeded PRNG (mulberry32)
function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Base reference: configs are tuned for 60px/hour
const BASE_HOUR_PX = 60;

interface CloudFogConfig {
  passes: number;
  densityPerHour: number;
  minRadius: number;
  maxRadius: number;
  yStretch: number;
  minAlpha: number;
  maxAlpha: number;
  color: string;
  blur: number;
}

interface RainConfig {
  densityPerHour: number;
  minLength: number;
  maxLength: number;
  strokeWidth: number;
  angle: number;
  color: string;
  minAlpha: number;
  maxAlpha: number;
}

interface SnowConfig {
  densityPerHour: number;
  minRadius: number;
  maxRadius: number;
  color: string;
  minAlpha: number;
  maxAlpha: number;
  blur: number;
}

interface Configs {
  cloud: CloudFogConfig;
  fog: CloudFogConfig;
  rain: RainConfig;
  freezing_rain: RainConfig;
  snow: SnowConfig;
}

const configs: Configs = {
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
  freezing_rain: {
    densityPerHour: 35,
    minLength: 5,
    maxLength: 12,
    strokeWidth: 3.5,
    angle: -75,
    color: '#d0e8ff',
    minAlpha: 0.35,
    maxAlpha: 0.75,
  },
  snow: {
    densityPerHour: 80,
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
 */
function sampleIntensity(intensities: number[], y: number, hourPx: number): number {
  const hour = y / hourPx;
  const lo = Math.max(0, Math.min(23, Math.floor(hour)));
  const hi = Math.min(23, lo + 1);
  const frac = hour - lo;
  return intensities[lo] * (1 - frac) + intensities[hi] * frac;
}

interface GenerateTextureParams {
  type: OverlayType;
  intensities: number[];
  seed: number;
  hourPx: number;
  width?: number;
}

/**
 * Generate a full-day texture for an overlay type at the given zoom level.
 */
export function generateDayTexture({
  type,
  intensities,
  seed,
  hourPx,
  width = 200,
}: GenerateTextureParams): string {
  if (typeof document === 'undefined') return '';
  const dayHeight = hourPx * 24;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = dayHeight;
  const ctx = canvas.getContext('2d')!;
  const rand = mulberry32(seed);

  // Scale density proportionally to zoom so element count per visual area stays constant
  const densityScale = hourPx / BASE_HOUR_PX;

  if (type === 'rain' || type === 'freezing_rain') {
    drawRain(ctx, rand, width, intensities, hourPx, dayHeight, densityScale, type);
  } else if (type === 'snow') {
    drawSnow(ctx, rand, width, intensities, hourPx, dayHeight, densityScale);
  } else {
    drawClouds(ctx, rand, width, intensities, hourPx, dayHeight, densityScale, type);
  }

  return canvas.toDataURL();
}

function drawClouds(
  ctx: CanvasRenderingContext2D,
  rand: () => number,
  width: number,
  intensities: number[],
  hourPx: number,
  dayHeight: number,
  densityScale: number,
  type: 'cloud' | 'fog',
): void {
  const cfg = configs[type];

  for (let pass = 0; pass < cfg.passes; pass++) {
    for (let hour = 0; hour < 24; hour++) {
      const intensity = intensities[hour];
      if (intensity <= 0) continue;
      const count = Math.ceil(cfg.densityPerHour * intensity * densityScale);

      for (let i = 0; i < count; i++) {
        const x = rand() * width;
        const y = hour * hourPx + (rand() - 0.2) * hourPx * 1.4;
        const rx = cfg.minRadius + rand() * (cfg.maxRadius - cfg.minRadius);
        const ry = rx * cfg.yStretch;
        const localIntensity = sampleIntensity(
          intensities,
          Math.max(0, Math.min(dayHeight - 1, y)),
          hourPx,
        );
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
    small.height = Math.ceil(dayHeight * sf);
    const sCtx = small.getContext('2d')!;
    sCtx.drawImage(ctx.canvas, 0, 0, small.width, small.height);
    ctx.clearRect(0, 0, width, dayHeight);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(small, 0, 0, width, dayHeight);
  }
}

function drawRain(
  ctx: CanvasRenderingContext2D,
  rand: () => number,
  width: number,
  intensities: number[],
  hourPx: number,
  _dayHeight: number,
  densityScale: number,
  type: 'rain' | 'freezing_rain' = 'rain',
): void {
  const cfg = configs[type];
  const angleRad = (cfg.angle * Math.PI) / 180;

  for (let hour = 0; hour < 24; hour++) {
    const intensity = intensities[hour];
    if (intensity <= 0) continue;
    const count = Math.ceil(cfg.densityPerHour * intensity * densityScale);

    for (let i = 0; i < count; i++) {
      const x = rand() * width;
      const y = hour * hourPx + rand() * hourPx;
      const localIntensity = sampleIntensity(intensities, y, hourPx);
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

function drawSnow(
  ctx: CanvasRenderingContext2D,
  rand: () => number,
  width: number,
  intensities: number[],
  hourPx: number,
  dayHeight: number,
  densityScale: number,
): void {
  const cfg = configs.snow;

  for (let hour = 0; hour < 24; hour++) {
    const intensity = intensities[hour];
    if (intensity <= 0) continue;
    const count = Math.ceil(cfg.densityPerHour * intensity * densityScale);

    for (let i = 0; i < count; i++) {
      const x = rand() * width;
      const y = hour * hourPx + rand() * hourPx;
      const localIntensity = sampleIntensity(intensities, y, hourPx);
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
          ctx.lineTo(
            bx + Math.cos(angle + Math.PI / 4) * branchLen,
            by + Math.sin(angle + Math.PI / 4) * branchLen,
          );
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(
            bx + Math.cos(angle - Math.PI / 4) * branchLen,
            by + Math.sin(angle - Math.PI / 4) * branchLen,
          );
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
    small.height = Math.ceil(dayHeight * sf);
    const sCtx = small.getContext('2d')!;
    sCtx.drawImage(ctx.canvas, 0, 0, small.width, small.height);
    ctx.clearRect(0, 0, width, dayHeight);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(small, 0, 0, width, dayHeight);
  }
}

// Cache by key — includes rounded hourPx for zoom-level caching
const textureCache = new Map<string, string>();

/**
 * Get a full-day texture data URL, cached.
 * hourPx is rounded to nearest 10 to limit cache entries across zoom levels.
 */
export function getDayTexture(
  type: OverlayType,
  intensities: number[],
  seed: number,
  hourPx: number,
): string {
  const roundedPx = Math.round(hourPx / 10) * 10;
  const key = `${type}-${seed}-${roundedPx}-${intensities.map((v) => v.toFixed(2)).join(',')}`;
  if (!textureCache.has(key)) {
    textureCache.set(key, generateDayTexture({ type, intensities, seed, hourPx: roundedPx }));
  }
  return textureCache.get(key)!;
}
