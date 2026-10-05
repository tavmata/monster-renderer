// monster.js - Master Monster Renderer Dispatcher
import { drawSlimeEntity } from './slimes.js';
import { drawWolfEntity } from './wolves.js';
import { drawFrostTrollEntity, drawFrostTroll } from './trolls.js';
import { drawGoblinEntity, drawGoblin, drawSegmentedGoblin } from './goblins.js';
import { drawGenericMob } from './genericMobs.js';
import { drawEntityHP, getMobUiOffsets } from './mobUi.js';

/**
 * Universal Monster Renderer Entry Point
 * Routes any entity to its specialized procedural renderer
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x - Screen or World X
 * @param {number} y - Screen or World Y
 * @param {Object} ent - Entity state object
 * @param {boolean} isShadowPass - Shadow pass flag
 */
export function drawMonster(ctx, x, y, ent, isShadowPass = false) {
  if (!ent) return;
  const type = (ent.type || "").toLowerCase();

  if (type === "slime" || type.startsWith("slime_") || type.includes("slime")) {
    return drawSlimeEntity(ctx, x, y, ent, isShadowPass);
  }

  if (type === "wolf" || type.startsWith("wolf_") || type.includes("wolf") || type === "dire_wolf") {
    return drawWolfEntity(ctx, x, y, ent, isShadowPass);
  }

  if (type === "frost_troll" || type.includes("troll")) {
    return drawFrostTrollEntity(ctx, x, y, ent, isShadowPass);
  }

  if (type === "goblin" || type.startsWith("goblin_") || type.includes("goblin")) {
    return drawGoblinEntity(ctx, x, y, ent, isShadowPass);
  }

  // Fallback to generic mob renderer (skeletons, spiders, bosses, etc.)
  return drawGenericMob(ctx, x, y, ent, isShadowPass);
}

if (typeof window !== "undefined") {
  window.drawMonster = drawMonster;
}
