// helpers.js - Math, Hashing & Canvas Gradient Utilities for Monster Rendering

/**
 * Zero-allocation inline hashing function to eliminate transient string allocations during seed generation.
 * @param {string|number} idStr
 * @returns {number}
 */
export function computeFastSeed(idStr) {
  if (!idStr) return 0;
  const str = String(idStr);
  const len = str.length;
  let seed = 0;
  const start = len > 4 ? len - 4 : 0;
  for (let i = start; i < len; i++) {
    seed = ((seed << 5) - seed) + str.charCodeAt(i);
    seed |= 0;
  }
  return Math.abs(seed);
}

/**
 * Safely creates a radial gradient, preventing canvas crash on NaN or negative radii.
 * @param {CanvasRenderingContext2D} targetCtx
 * @param {number} x0
 * @param {number} y0
 * @param {number} r0
 * @param {number} x1
 * @param {number} y1
 * @param {number} r1
 * @returns {CanvasGradient|null}
 */
export function safeCreateRadialGradient(targetCtx, x0, y0, r0, x1, y1, r1) {
  if (
    !targetCtx ||
    !Number.isFinite(x0) ||
    !Number.isFinite(y0) ||
    !Number.isFinite(r0) ||
    !Number.isFinite(x1) ||
    !Number.isFinite(y1) ||
    !Number.isFinite(r1) ||
    r0 < 0 ||
    r1 <= 0
  ) {
    return null;
  }
  try {
    return targetCtx.createRadialGradient(x0, y0, r0, x1, y1, r1);
  } catch (e) {
    return null;
  }
}
