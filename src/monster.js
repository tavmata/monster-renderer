// monster.js - Master Monster Renderer Dispatcher
/**
 * CORE DESIGN RULE: NEVER RENDER SOLID SHADOW CIRCLES
 * Never draw solid or flat circle/ellipse ground shadows beneath monsters.
 * Monsters must never have baked-in dark circular shapes emulating ground shadows.
 * All artificial solid ground shadow discs are strictly prohibited across all monster renderers.
 */
import { drawSlimeEntity } from './slimes.js';
import { drawWolfEntity } from './wolves.js';
import { drawFrostTrollEntity, drawFrostTroll } from './trolls.js';
import { drawGoblinEntity, drawGoblin, drawSegmentedGoblin } from './goblins.js';
import { drawSkeletonEntity } from './skeletons.js';
import { drawSpiderEntity } from './spiders.js';
import { drawVoidTerrorEntity } from './voidTerror.js';
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
 * @param {boolean} isShadowPass - Shadow pass flag (prohibited from drawing solid shadows)
 */
export function drawMonster(ctx, x, y, ent, isShadowPass = false) {
  if (!ent || isShadowPass) return;
  const type = (ent.type || "").toLowerCase();

  if (type === "slime" || type.startsWith("slime_") || type.includes("slime")) {
    return drawSlimeEntity(ctx, x, y, ent, isShadowPass);
  }

  if (type === "wolf" || type.startsWith("wolf_") || type.includes("wolf") || type === "dire_wolf") {
    return drawWolfEntity(ctx, x, y, ent, isShadowPass);
  }

  if (type === "frost_troll" || type.includes("troll") || type.includes("jotunn") || type.includes("giant") || (type.includes("glass") && !type.includes("slime") && !type.includes("wolf"))) {
    return drawFrostTrollEntity(ctx, x, y, ent, isShadowPass);
  }

  if (type === "goblin" || type.startsWith("goblin_") || type.includes("goblin")) {
    return drawGoblinEntity(ctx, x, y, ent, isShadowPass);
  }

  if (
    type === "skeleton" ||
    type.startsWith("skeleton_") ||
    type.includes("skeleton") ||
    type.includes("samba") ||
    type.includes("passista") ||
    type.includes("malandro") ||
    type === "elite_knight" ||
    type === "boss_samba_king"
  ) {
    return drawSkeletonEntity(ctx, x, y, ent, isShadowPass);
  }

  if (
    type === "spider" ||
    type.startsWith("spider_") ||
    type.includes("spider") ||
    type.includes("weaver") ||
    type.includes("tarantula") ||
    type.includes("broodmother") ||
    type.includes("stalker")
  ) {
    return drawSpiderEntity(ctx, x, y, ent, isShadowPass);
  }

  if (
    type === "boss_void" ||
    type === "boss_void_terror" ||
    type === "void_terror" ||
    type.includes("terror") ||
    type.includes("devourer") ||
    type.includes("gazer") ||
    type.includes("singularity") ||
    (type.includes("void") && !type.includes("wolf") && !type.includes("stalker"))
  ) {
    return drawVoidTerrorEntity(ctx, x, y, ent, isShadowPass);
  }

  // Fallback to generic mob renderer (elementals, bosses, etc.)
  return drawGenericMob(ctx, x, y, ent, isShadowPass);
}

if (typeof window !== "undefined") {
  window.drawMonster = drawMonster;
}
