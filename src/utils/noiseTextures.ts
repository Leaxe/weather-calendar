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
    densityPerHour: 60,
    minLength: 8,
    maxLength: 18,
    strokeWidth: 1.8,
    angle: -78,
    color: '#c0d8ff',
    minAlpha: 0.4,
    maxAlpha: 0.85,
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
    minRadius: 0.8,
    maxRadius: 2.4,
    color: '#ffffff',
    minAlpha: 0.25,
    maxAlpha: 0.65,
    blur: 0.4,
  },
};

/**
 * Sample the intensity curve at a given pixel y-position.
 * Uses smoothstep interpolation for natural transitions between hours.
 */
function sampleIntensity(intensities: number[], y: number, hourPx: number): number {
  // Center intensity within each hour block rather than anchoring at the top
  const hour = y / hourPx - 0.5;
  const lo = Math.max(0, Math.min(23, Math.floor(hour)));
  const hi = Math.min(23, lo + 1);
  const frac = hour - lo;
  // Smoothstep for more natural transitions (holds values longer, transitions faster)
  const t = frac * frac * (3 - 2 * frac);
  return intensities[lo] * (1 - t) + intensities[hi] * t;
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

  // Scale density proportionally to zoom and width so element count per visual area stays constant
  const BASE_WIDTH = 200;
  const densityScale = (hourPx / BASE_HOUR_PX) * (width / BASE_WIDTH);

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
      // Density ramps up faster at high intensity for denser overcast coverage
      const densityBoost = 1 + intensity * intensity * 6;
      const count = Math.ceil(cfg.densityPerHour * intensity * densityScale * densityBoost);

      for (let i = 0; i < count; i++) {
        const x = rand() * width;
        const y = hour * hourPx + rand() * hourPx;
        // Shrink blobs at high intensity for more uniform coverage
        const sizeScale = 1 - intensity * 0.3;
        const rx = (cfg.minRadius + rand() * (cfg.maxRadius - cfg.minRadius)) * sizeScale;
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
    // Heavier rain gets disproportionately more drops
    const densityBoost = 1 + intensity * intensity * 3;
    const count = Math.ceil(cfg.densityPerHour * intensity * densityScale * densityBoost);

    for (let i = 0; i < count; i++) {
      const x = rand() * width;
      const y = hour * hourPx + rand() * hourPx;
      const localIntensity = sampleIntensity(intensities, y, hourPx);
      // Heavier rain = longer, thicker drops
      const intensityStretch = 1 + localIntensity * 0.5;
      const len = (cfg.minLength + rand() * (cfg.maxLength - cfg.minLength)) * intensityStretch;
      const alpha = (cfg.minAlpha + rand() * (cfg.maxAlpha - cfg.minAlpha)) * localIntensity;

      const dx = Math.cos(angleRad) * len;
      const dy = Math.sin(angleRad) * len;

      // Gradient trail: transparent at top, opaque at bottom
      const grad = ctx.createLinearGradient(x, y, x + dx, y - dy);
      grad.addColorStop(0, `rgba(192, 216, 255, 0)`);
      grad.addColorStop(0.3, `rgba(192, 216, 255, ${alpha * 0.4})`);
      grad.addColorStop(1, `rgba(192, 216, 255, ${alpha})`);

      ctx.save();
      ctx.strokeStyle = grad;
      ctx.lineWidth = cfg.strokeWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x + dx, y - dy);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Small splash dot at the bottom of some drops
      if (rand() < 0.25) {
        ctx.globalAlpha = alpha * 0.4;
        ctx.fillStyle = cfg.color;
        ctx.beginPath();
        ctx.arc(x, y, cfg.strokeWidth * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

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

      if (r > 2.2) {
        // Large snowflakes: 6-armed crystal with glow
        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        ctx.shadowBlur = r * 1.5;
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
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(0, 0, 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (r > 1.4) {
        // Medium snowflakes: simple 4-armed cross with subtle glow
        ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
        ctx.shadowBlur = r;
        const rotation = rand() * Math.PI;
        for (let a = 0; a < 4; a++) {
          const angle = rotation + (a * Math.PI) / 2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(angle) * r * 1.3, Math.sin(angle) * r * 1.3);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      } else {
        // Small snowflakes: soft dots
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
  width = 200,
): string {
  const roundedPx = Math.round(hourPx / 10) * 10;
  const key = `${type}-${seed}-${roundedPx}-${width}-${intensities.map((v) => v.toFixed(2)).join(',')}`;
  if (!textureCache.has(key)) {
    textureCache.set(
      key,
      generateDayTexture({ type, intensities, seed, hourPx: roundedPx, width }),
    );
  }
  return textureCache.get(key)!;
}
