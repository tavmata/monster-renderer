// trolls.js - Procedural 8-Directional Angular Chiseled Frost Troll Entity Renderer
import { computeFastSeed, safeCreateRadialGradient } from './helpers.js';

/**
 * CORE DESIGN RULE: NEVER RENDER SOLID SHADOW CIRCLES
 * Never draw solid or flat circle/ellipse ground shadows beneath monsters.
 * Monsters must never have baked-in dark circular shapes emulating ground shadows.
 * All artificial solid ground shadow discs are strictly prohibited.
 */

/**
 * Draws a sharp 4-pointed prismatic diamond star glint (glass specular flare).
 */
export function drawPrismaticStarGlint(ctx, x, y, size, alpha = 1.0, rotation = 0) {
  if (alpha <= 0.02 || size <= 0.5) return;
  ctx.save();
  ctx.translate(x, y);
  if (rotation !== 0) ctx.rotate(rotation);

  // Soft cyan/aurora refraction halo
  ctx.fillStyle = `rgba(56, 189, 248, ${alpha * 0.4})`;
  ctx.beginPath();
  ctx.moveTo(0, -size * 1.7);
  ctx.lineTo(size * 0.28, -size * 0.28);
  ctx.lineTo(size * 1.7, 0);
  ctx.lineTo(size * 0.28, size * 0.28);
  ctx.lineTo(0, size * 1.7);
  ctx.lineTo(-size * 0.28, size * 0.28);
  ctx.lineTo(-size * 1.7, 0);
  ctx.lineTo(-size * 0.28, -size * 0.28);
  ctx.closePath();
  ctx.fill();

  // Core brilliant white 4-pointed cross star
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.2, -size * 0.2);
  ctx.lineTo(size, 0);
  ctx.lineTo(size * 0.2, size * 0.2);
  ctx.lineTo(0, size);
  ctx.lineTo(-size * 0.2, size * 0.2);
  ctx.lineTo(-size, 0);
  ctx.lineTo(-size * 0.2, -size * 0.2);
  ctx.closePath();
  ctx.fill();

  // Specular center micro-spark
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(-0.7, -0.7, 1.4, 1.4);
  ctx.restore();
}

/**
 * Draws a crisp diagonal glassy specular gloss reflection ribbon across surface facets.
 */
export function drawGlassGlossSheen(ctx, x1, y1, x2, y2, width, alpha = 0.5) {
  if (alpha <= 0.02) return;
  ctx.save();
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len * (width * 0.5);
  const ny = dx / len * (width * 0.5);

  const grad = ctx.createLinearGradient(x1 + nx, y1 + ny, x1 - nx, y1 - ny);
  grad.addColorStop(0, "rgba(255, 255, 255, 0)");
  grad.addColorStop(0.35, `rgba(224, 242, 254, ${alpha * 0.6})`);
  grad.addColorStop(0.5, `rgba(255, 255, 255, ${alpha * 0.95})`);
  grad.addColorStop(0.65, `rgba(56, 189, 248, ${alpha * 0.4})`);
  grad.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = grad;

  ctx.beginPath();
  ctx.moveTo(x1 + nx, y1 + ny);
  ctx.lineTo(x2 + nx, y2 + ny);
  ctx.lineTo(x2 - nx, y2 - ny);
  ctx.lineTo(x1 - nx, y1 - ny);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Draws subsurface luminous core (spine, ribcage arcs & pulsing heart gem)
 * visible through the translucent glass body shell.
 */
export function drawSubsurfaceLuminousCore(ctx, r, cfg, breathCycle, nowMs, refractionIntensity = 0.85) {
  if (refractionIntensity <= 0.05) return;
  ctx.save();

  const isFront = cfg.view === "front" || cfg.view === "front_diag";
  const isProfile = cfg.view === "side";
  const heartPulse = Math.sin(nowMs * 0.0035) * 0.2 + 0.8;
  const pulseAlpha = heartPulse * refractionIntensity;

  // 1. Arcane Permafrost Heart Gem (Crystalline Core at chest center)
  const heartX = isProfile ? cfg.flip * 4.0 : cfg.flip * 2.0;
  const heartY = -r * 0.22;

  // Heart radial aura
  const heartRadGrd = ctx.createRadialGradient(heartX, heartY, 1, heartX, heartY, 14);
  heartRadGrd.addColorStop(0, `rgba(0, 240, 255, ${0.7 * pulseAlpha})`);
  heartRadGrd.addColorStop(0.45, `rgba(56, 189, 248, ${0.4 * pulseAlpha})`);
  heartRadGrd.addColorStop(1, "rgba(2, 132, 199, 0)");
  ctx.fillStyle = heartRadGrd;
  ctx.beginPath();
  ctx.arc(heartX, heartY, 14, 0, Math.PI * 2);
  ctx.fill();

  // Faceted Inner Heart Diamond
  ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * pulseAlpha})`;
  ctx.beginPath();
  ctx.moveTo(heartX, heartY - 5.5);
  ctx.lineTo(heartX + 4.2, heartY);
  ctx.lineTo(heartX, heartY + 5.5);
  ctx.lineTo(heartX - 4.2, heartY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = `rgba(0, 240, 255, ${0.95 * pulseAlpha})`;
  ctx.beginPath();
  ctx.moveTo(heartX, heartY - 3.5);
  ctx.lineTo(heartX + 2.5, heartY);
  ctx.lineTo(heartX, heartY + 3.5);
  ctx.lineTo(heartX - 2.5, heartY);
  ctx.closePath();
  ctx.fill();

  // 2. Subsurface Vertebral Spine Nodes
  const spineCount = 5;
  for (let s = -2; s <= 2; s++) {
    const sy = heartY + s * 5.2 + 2.0;
    const sx = isProfile ? -cfg.flip * 5.0 + s * 1.5 : 0;
    const sSize = 2.6 - Math.abs(s) * 0.4;

    // Glowing vertebra node
    ctx.fillStyle = `rgba(0, 240, 255, ${0.65 * refractionIntensity})`;
    ctx.beginPath();
    ctx.moveTo(sx, sy - sSize);
    ctx.lineTo(sx + sSize * 1.3, sy);
    ctx.lineTo(sx, sy + sSize);
    ctx.lineTo(sx - sSize * 1.3, sy);
    ctx.closePath();
    ctx.fill();

    // Node bright white spark
    ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * refractionIntensity})`;
    ctx.fillRect(sx - 0.7, sy - 0.7, 1.4, 1.4);

    // 3. Subsurface Ribcage Arcs (if facing front or 3/4 front)
    if (isFront && s <= 1) {
      const ribW = (13 - Math.abs(s) * 3) * refractionIntensity;
      const ribGrd = ctx.createLinearGradient(-ribW, sy, ribW, sy);
      ribGrd.addColorStop(0, "rgba(56, 189, 248, 0)");
      ribGrd.addColorStop(0.2, `rgba(0, 240, 255, ${0.45 * refractionIntensity})`);
      ribGrd.addColorStop(0.5, `rgba(224, 242, 254, ${0.6 * refractionIntensity})`);
      ribGrd.addColorStop(0.8, `rgba(0, 240, 255, ${0.45 * refractionIntensity})`);
      ribGrd.addColorStop(1, "rgba(56, 189, 248, 0)");
      ctx.fillStyle = ribGrd;

      ctx.beginPath();
      ctx.moveTo(-ribW, sy + 1.5);
      ctx.lineTo(0, sy - 1.0);
      ctx.lineTo(ribW, sy + 1.5);
      ctx.lineTo(ribW, sy + 2.6);
      ctx.lineTo(0, sy + 0.2);
      ctx.lineTo(-ribW, sy + 2.6);
      ctx.closePath();
      ctx.fill();
    }
  }

  // 4. Internal Refraction Caustic Shimmer Lines
  for (let c = 0; c < 3; c++) {
    const cPhase = nowMs * 0.002 + c * 2.1;
    const cy = -r * 0.45 + ((cPhase % 1) * r * 0.75);
    const cAlpha = Math.sin((cPhase % 1) * Math.PI) * 0.35 * refractionIntensity;
    if (cAlpha > 0.02) {
      const cGrd = ctx.createLinearGradient(-r * 0.5, cy, r * 0.5, cy + 4);
      cGrd.addColorStop(0, "rgba(255, 255, 255, 0)");
      cGrd.addColorStop(0.5, `rgba(224, 242, 254, ${cAlpha})`);
      cGrd.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = cGrd;

      ctx.beginPath();
      ctx.moveTo(-r * 0.45, cy);
      ctx.lineTo(0, cy + Math.sin(cPhase * 3) * 3);
      ctx.lineTo(r * 0.45, cy);
      ctx.lineTo(r * 0.45, cy + 1.8);
      ctx.lineTo(0, cy + Math.sin(cPhase * 3) * 3 + 1.8);
      ctx.lineTo(-r * 0.45, cy + 1.8);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * Triggers a catastrophic glacial death explosion with shattered permafrost boulder chunks,
 * severed faceted troll limbs, exploding crystalline stalagmites, sub-zero frost vapor clouds,
 * and flying diamond hail motes.
 *
 * @param {Object} ce - Entity state object
 */
export function triggerFrostTrollDeathExplosion(ce) {
  if (!ce || ce._frostTrollExploded) return;
  ce._frostTrollExploded = true;

  const type = (ce.type || "frost_troll").toLowerCase();
  const isJotunn = type.includes("jotunn") || type.includes("giant") || type.includes("chieftain") || type === "boss_frost_giant";
  const isBoss = type.startsWith("boss_") || type.includes("giant") || type.includes("colossus") || isJotunn;
  const isBerserker = type.includes("glacial") || type.includes("berserker");
  const isCrystal = type.includes("crystal");
  const isGlass = ce.glassEffect !== false || type.includes("glass");

  const primarySkin = isGlass ? "rgba(56, 189, 248, 0.75)" : isCrystal ? "#38bdf8" : isBerserker ? "#0284c7" : "#0369a1";
  const darkSkin = isGlass ? "rgba(8, 47, 73, 0.85)" : isCrystal ? "#0284c7" : isBerserker ? "#082f49" : "#075985";
  const iceColor = isGlass ? "#e0f2fe" : isCrystal ? "#e0f2fe" : "#7dd3fc";
  const furColor = isGlass ? "rgba(224, 242, 254, 0.85)" : "#e2e8f0";

  if (typeof spawnParticle === "function") {
    // 1. Massive Severed Faceted Permafrost Troll Limbs & Angular Glass Segments
    const limbCount = isBoss ? 8 : 5;
    for (let i = 0; i < limbCount; i++) {
      const angle = (i / limbCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.45;
      const speed = 130 + Math.random() * 160;
      spawnParticle({
        x: ce.x + Math.cos(angle) * 12,
        y: ce.y + Math.sin(angle) * 12 - 10,
        vx: Math.cos(angle) * speed,
        vy: -110 - Math.random() * 150,
        color: i % 2 === 0 ? primarySkin : darkSkin,
        accentColor: iceColor,
        size: isBoss ? 20 + Math.random() * 10 : 14 + Math.random() * 7,
        maxLife: 2.8,
        drag: 0.94,
        style: isGlass ? "glass_shard" : "wolf_leg",
        gravity: 240,
        shrink: true,
      });
    }

    // 2. Shattered Angular Polar Fur Tufts
    const furCount = isBoss ? 8 : 5;
    for (let f = 0; f < furCount; f++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 110;
      spawnParticle({
        x: ce.x + Math.cos(angle) * 8,
        y: ce.y - 18 + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: -90 - Math.random() * 90,
        color: furColor,
        size: isBoss ? 9 : 6,
        maxLife: 2.2,
        drag: 0.92,
        gravity: 130,
        shrink: true,
      });
    }

    // 3. Exploding Prismatic Ice Shards & Diamond Crystals
    const crystalCount = isBoss ? 20 : 12;
    for (let c = 0; c < crystalCount; c++) {
      const angle = (c / crystalCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const speed = 150 + Math.random() * 210;
      spawnParticle({
        x: ce.x + Math.cos(angle) * 6,
        y: ce.y - 8 + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: -140 - Math.random() * 140,
        color: c % 3 === 0 ? "#ffffff" : c % 3 === 1 ? "#38bdf8" : "#bae6fd",
        size: isBoss ? 6 + Math.random() * 3 : 3.8 + Math.random() * 2,
        maxLife: 1.8,
        drag: 0.96,
        style: isGlass ? "glass_shard" : "circle",
        gravity: 280,
        shrink: true,
      });
    }

    // 4. Vitreous Razor Glass Shards
    if (isGlass) {
      const glassShardCount = isBoss ? 24 : 14;
      for (let g = 0; g < glassShardCount; g++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 160 + Math.random() * 220;
        spawnParticle({
          x: ce.x + (Math.random() - 0.5) * 14,
          y: ce.y - 10 + (Math.random() - 0.5) * 16,
          vx: Math.cos(angle) * speed,
          vy: -150 - Math.random() * 160,
          color: g % 3 === 0 ? "rgba(255, 255, 255, 0.95)" : g % 3 === 1 ? "rgba(186, 230, 253, 0.85)" : "rgba(56, 189, 248, 0.75)",
          accentColor: "#ffffff",
          size: 6 + Math.random() * 5,
          maxLife: 2.2,
          drag: 0.95,
          style: "glass_shard",
          gravity: 260,
          shrink: true,
        });
      }
    }

    // 5. Sub-Zero Blizzard Frost Mist Shards
    const mistCount = isBoss ? 24 : 14;
    for (let m = 0; m < mistCount; m++) {
      const angle = (m / mistCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
      const speed = 50 + Math.random() * 120;
      spawnParticle({
        x: ce.x + Math.cos(angle) * 4,
        y: ce.y - 6 + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: -40 - Math.random() * 60,
        color: m % 2 === 0 ? "rgba(224, 242, 254, 0.75)" : "rgba(186, 230, 253, 0.5)",
        size: isBoss ? 12 + Math.random() * 7 : 7 + Math.random() * 5,
        maxLife: 1.4,
        drag: 0.91,
        gravity: -15,
        shrink: true,
      });
    }
  }
}

/**
 * Procedural 8-Directional Angular Chiseled Frost Troll Entity Renderer
 * Fully lineless digital painting: 0 vector strokes, 100% volumetric gradients, rim lighting, and specular glints.
 * - Angular, craggy, faceted permafrost anatomy: hard-edged trapezoidal muscular planes,
 *   chiseled stone pectorals, jagged rock abdomen, faceted blocky knuckles, and jagged polar fur mantle.
 * - ZERO round "circleish" anatomy: no oval collars, no round ball fists, no rounded balloon torsos.
 * - 8-Directional Octagonal Matrix (E, SE, S, SW, W, NW, N, NE) with 5 distinct view perspectives
 * - Dual-arm knuckle stance with dynamic depth sorting (Z-ordering)
 * - Digitigrade knuckle-walking gait with footstep frost kick-up kinetics
 * - 4-Phase Glacial Slam combat animation with faceted ground crevasses and erupting 3D crystalline ice stalagmites
 * - Channeled Blizzard Roar / Frost Breath ability with diamond hail shards
 * - Rich variants: Ancient Frost Troll, Glacial Berserker (Faceted Ice Pauldron & Monolithic Permafrost Maul),
 *   Jotunn Frost Giant Chieftain (Prismatic Glacial Crown & Blizzard Aura), Crystalline Frost Colossus
 * - Invariant spatial weak point mapping (head at Y ≈ -9px on base r=26)
 */
export function drawFrostTrollEntity(ctx, x, y, ent, isShadowPass = false) {
  if (isShadowPass) return;
  if (!ent) ent = {};
  const type = (ent.type || "frost_troll").toLowerCase();
  const isSlowed = !!ent.isSlowed;
  const facingAngle = ent.facingAngle || 0;
  const moving = !!(ent.moving || ent.isMoving);

  if (ent._seed === undefined) {
    const id = ent.id || ("troll_" + Math.round(x) + "_" + Math.round(y));
    ent._seed = typeof computeFastSeed === "function" ? computeFastSeed(id) : 42;
  }
  const seed = ent._seed;

  // Variant Detection
  const isJotunn = type.includes("jotunn") || type.includes("giant") || type.includes("chieftain") || type === "boss_frost_giant";
  const isBoss = type.startsWith("boss_") || type.includes("giant") || type.includes("chieftain") || type.includes("colossus") || isJotunn;
  const isBerserker = type.includes("glacial") || type.includes("berserker");
  const isCrystal = type.includes("crystal");
  const isGlass = ent.glassEffect !== undefined ? !!ent.glassEffect : true;
  const glassRefraction = typeof ent.glassRefraction === "number" ? Math.max(0.1, Math.min(1.0, ent.glassRefraction)) : 0.85;

  const scale = isJotunn ? 2.15 : isBoss ? 1.85 : 1.0;
  const r = 26;

  // Attack and Ability States
  const nowMs = typeof performance !== "undefined" ? performance.now() : Date.now();
  let isAttacking = !!(ent.isAttacking || ent.currentCast);
  let isBreathingFrost = !!(ent.isBreathingFrost || ent.roarActive || (ent.currentCast && ent.currentCast.name === "blizzard_roar"));

  if (!isAttacking && typeof GameState !== "undefined" && GameState.combatAnimations && ent && ent.id) {
    for (let i = 0; i < GameState.combatAnimations.length; i++) {
      const anim = GameState.combatAnimations[i];
      const dur = anim.duration || anim.durationMs || 480;
      if (anim.attackerId === ent.id && nowMs - anim.createdAt < dur) {
        isAttacking = true;
        break;
      }
    }
  }

  // Hit Flash
  const isHitFlashing = ent.lastHitTime && (nowMs - ent.lastHitTime < 180);

  // -------------------------------------------------------------
  // 8-Direction Mathematical Sector Mapping
  // -------------------------------------------------------------
  const normAngle = ((facingAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const dirIndex = Math.floor(((normAngle + Math.PI / 8) % (Math.PI * 2)) / (Math.PI / 4));

  // Anatomical Octagonal Matrix with Dynamic Z-Depth Sorting
  const octagonalMatrix = [
    // 0: East (E) - Side Profile facing Right
    {
      dir: "E", view: "side", flip: 1, tilt: 0.12,
      headX: 8.0, headY: -8.5,
      rightArmX: -5.0, rightArmY: 2.0, rightArmFront: false,
      leftArmX: 9.5, leftArmY: 6.5, leftArmFront: true,
      hindLegNearX: -3.0, hindLegFarX: -14.0
    },
    // 1: South-East (SE) - 3/4 Front facing Down-Right
    {
      dir: "SE", view: "front_diag", flip: 1, tilt: 0.06,
      headX: 5.5, headY: -9.2,
      rightArmX: -14.0, rightArmY: 4.5, rightArmFront: false,
      leftArmX: 16.0, leftArmY: 7.5, leftArmFront: true,
      hindLegNearX: 8.5, hindLegFarX: -11.0
    },
    // 2: South (S) - Direct Front facing Camera
    {
      dir: "S", view: "front", flip: 1, tilt: 0.00,
      headX: 0.0, headY: -9.5,
      rightArmX: -18.0, rightArmY: 6.5, rightArmFront: true,
      leftArmX: 18.0, leftArmY: 6.5, leftArmFront: true,
      hindLegNearX: 13.0, hindLegFarX: -13.0
    },
    // 3: South-West (SW) - 3/4 Front facing Down-Left
    {
      dir: "SW", view: "front_diag", flip: -1, tilt: -0.06,
      headX: -5.5, headY: -9.2,
      rightArmX: -16.0, rightArmY: 7.5, rightArmFront: true,
      leftArmX: 14.0, leftArmY: 4.5, leftArmFront: false,
      hindLegNearX: -8.5, hindLegFarX: 11.0
    },
    // 4: West (W) - Side Profile facing Left
    {
      dir: "W", view: "side", flip: -1, tilt: -0.12,
      headX: -8.0, headY: -8.5,
      rightArmX: -9.5, rightArmY: 6.5, rightArmFront: true,
      leftArmX: 5.0, leftArmY: 2.0, leftArmFront: false,
      hindLegNearX: 3.0, hindLegFarX: 14.0
    },
    // 5: North-West (NW) - 3/4 Back facing Up-Left
    {
      dir: "NW", view: "back_diag", flip: -1, tilt: -0.06,
      headX: -4.5, headY: -11.0,
      rightArmX: -16.0, rightArmY: 3.0, rightArmFront: true,
      leftArmX: 11.5, leftArmY: 0.5, leftArmFront: false,
      hindLegNearX: -11.0, hindLegFarX: 8.5
    },
    // 6: North (N) - Direct Back facing Up
    {
      dir: "N", view: "back", flip: 1, tilt: 0.00,
      headX: 0.0, headY: -11.5,
      rightArmX: -17.0, rightArmY: 2.5, rightArmFront: false,
      leftArmX: 17.0, leftArmY: 2.5, leftArmFront: false,
      hindLegNearX: 12.0, hindLegFarX: -12.0
    },
    // 7: North-East (NE) - 3/4 Back facing Up-Right
    {
      dir: "NE", view: "back_diag", flip: 1, tilt: 0.06,
      headX: 4.5, headY: -11.0,
      rightArmX: -11.5, rightArmY: 0.5, rightArmFront: false,
      leftArmX: 16.0, leftArmY: 3.0, leftArmFront: true,
      hindLegNearX: 11.0, hindLegFarX: -8.5
    }
  ];

  const cfg = octagonalMatrix[dirIndex] || octagonalMatrix[2];
  const isBackView = cfg.view === "back" || cfg.view === "back_diag";
  const isFrontView = cfg.view === "front" || cfg.view === "front_diag";
  const isProfileView = cfg.view === "side";

  // -------------------------------------------------------------
  // Cohesive Animation Kinetics (Breathing, Knuckle-Walk, Glacial Slam)
  // -------------------------------------------------------------
  const speedFactor = isSlowed ? 0.5 : 1.0;
  const walkSpeedMult = 0.0075;
  const walkPhase = (nowMs * walkSpeedMult * speedFactor + seed) % (Math.PI * 2);
  const breathCycle = Math.sin(nowMs * 0.0035 + seed) * 1.5;

  const bounce = moving ? Math.abs(Math.sin(walkPhase)) * 3.4 : breathCycle;
  const strideSwing = moving ? Math.sin(walkPhase) * 6.5 : 0;
  const torsoSway = moving ? Math.cos(walkPhase) * 0.05 : 0;

  // 4-Phase Glacial Slam Progress
  let attackProgress = 0;
  let attackDuration = 480;
  if (isAttacking) {
    let animStart = ent.attackStart || ent.lastAttackTime || ent.attackTime || nowMs;
    if (ent.currentCast && ent.currentCast.duration) {
      attackDuration = ent.currentCast.duration;
      animStart = ent.currentCast.startTime || animStart;
    }
    attackProgress = Math.min(1.0, Math.max(0, (nowMs - animStart) / attackDuration));
  }

  // Directional Attack Lunge Vector & Squash/Stretch
  let lungeX = 0;
  let lungeY = 0;
  let squashX = 1;
  let squashY = 1;
  const atkDirX = Math.cos(facingAngle);
  const atkDirY = Math.sin(facingAngle);

  if (moving) {
    squashY = 1 - Math.abs(Math.sin(walkPhase)) * 0.07;
    squashX = 1 + Math.abs(Math.sin(walkPhase)) * 0.05;
  }

  if (isAttacking && attackProgress > 0) {
    if (attackProgress < 0.28) {
      const t = attackProgress / 0.28;
      squashY = 1 - t * 0.18;
      squashX = 1 + t * 0.12;
      lungeX = -atkDirX * t * 4.2;
      lungeY = -atkDirY * t * 4.2;
    } else if (attackProgress < 0.65) {
      const t = (attackProgress - 0.28) / 0.37;
      const stretch = Math.sin(t * Math.PI);
      squashY = 1 + stretch * 0.24;
      squashX = 1 - stretch * 0.12;
      lungeX = atkDirX * stretch * 12.0;
      lungeY = atkDirY * stretch * 8.5;
    } else {
      const t = (attackProgress - 0.65) / 0.35;
      squashY = 1 - (1 - t) * 0.08;
      squashX = 1 + (1 - t) * 0.05;
    }
  }

  // -------------------------------------------------------------
  // Palette Definition by Variant, Glass Effect & Hit Flash
  // -------------------------------------------------------------
  let skinLit = isHitFlashing
    ? "#ffffff"
    : isGlass
    ? `rgba(224, 242, 254, ${0.72 + 0.18 * (1 - glassRefraction)})`
    : isCrystal
    ? "#93c5fd"
    : isJotunn
    ? "#7dd3fc"
    : isBerserker
    ? "#0284c7"
    : "#38bdf8";

  let skinMid = isHitFlashing
    ? "#bae6fd"
    : isGlass
    ? `rgba(56, 189, 248, ${0.52 + 0.28 * (1 - glassRefraction)})`
    : isCrystal
    ? "#38bdf8"
    : isJotunn
    ? "#0284c7"
    : isBerserker
    ? "#0369a1"
    : "#0284c7";

  let skinShadow = isHitFlashing
    ? "#7dd3fc"
    : isGlass
    ? `rgba(2, 132, 199, ${0.68 + 0.22 * (1 - glassRefraction)})`
    : isCrystal
    ? "#0284c7"
    : isJotunn
    ? "#0369a1"
    : isBerserker
    ? "#075985"
    : "#075985";

  let skinOcclusion = isHitFlashing
    ? "#0284c7"
    : isGlass
    ? `rgba(8, 47, 73, ${0.82 + 0.15 * (1 - glassRefraction)})`
    : isCrystal
    ? "#082f49"
    : "#082f49";

  let rockFacet = isHitFlashing
    ? "#e0f2fe"
    : isGlass
    ? `rgba(255, 255, 255, ${0.85 * glassRefraction})`
    : isCrystal
    ? "#bae6fd"
    : isJotunn
    ? "#e0f2fe"
    : isBerserker
    ? "#0c4a6e"
    : "#0369a1";

  const runeColor = isHitFlashing ? "#ffffff" : isGlass ? "#00f0ff" : isCrystal ? "#ffffff" : isJotunn ? "#00f0ff" : isBerserker ? "#38bdf8" : "#00f0ff";

  // -------------------------------------------------------------
  // Root Transformation
  // -------------------------------------------------------------
  ctx.save();
  ctx.translate(x + lungeX, y + lungeY - bounce * scale);
  ctx.scale(scale * squashX, scale * squashY);

  // -------------------------------------------------------------
  // Footstep Frost Crack Kick-up Kinetics (Walking)
  // -------------------------------------------------------------
  if (moving) {
    const puffCycle = (walkPhase * 2) % (Math.PI * 2);
    const puffAlpha = Math.max(0, Math.sin(puffCycle)) * 0.42;
    if (puffAlpha > 0.05) {
      ctx.save();
      const puffX = -atkDirX * 12 + Math.sin(walkPhase) * 6;
      const puffY = 15 - atkDirY * 4;
      // Angular crystalline frost kick-up shards (no soft circles)
      ctx.fillStyle = `rgba(224, 242, 254, ${puffAlpha})`;
      ctx.beginPath();
      ctx.moveTo(puffX, puffY - 4);
      ctx.lineTo(puffX + 3.5, puffY);
      ctx.lineTo(puffX, puffY + 3.5);
      ctx.lineTo(puffX - 3.5, puffY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = `rgba(56, 189, 248, ${puffAlpha * 0.7})`;
      ctx.beginPath();
      ctx.moveTo(puffX + 4, puffY - 2);
      ctx.lineTo(puffX + 7, puffY + 1);
      ctx.lineTo(puffX + 3, puffY + 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // -------------------------------------------------------------
  // Glacial Slam Ground Rupture & Shockwave Kinetics
  // -------------------------------------------------------------
  if (isAttacking && attackProgress >= 0.35 && attackProgress <= 0.85) {
    const slamP = (attackProgress - 0.35) / 0.50;
    const slamAlpha = Math.sin(slamP * Math.PI);
    const slamDist = 18 + slamP * 16;
    const impactX = atkDirX * slamDist;
    const impactY = 14 + atkDirY * (slamDist * 0.5);

    ctx.save();
    // 1. Angular Polygonal Permafrost Shockwave Plate (Octagonal Shatter)
    const ringRadius = 14 + slamP * 32;
    ctx.fillStyle = `rgba(56, 189, 248, ${slamAlpha * 0.4})`;
    ctx.beginPath();
    for (let o = 0; o < 8; o++) {
      const oAng = (o / 8) * Math.PI * 2;
      const ox = impactX + Math.cos(oAng) * (ringRadius * 1.25);
      const oy = impactY + Math.sin(oAng) * (ringRadius * 0.6);
      if (o === 0) ctx.moveTo(ox, oy);
      else ctx.lineTo(ox, oy);
    }
    ctx.closePath();
    ctx.fill();

    // 2. Jagged Ground Frost Fissures (Lineless Angular Chisel Crevasses)
    for (let f = -2; f <= 2; f++) {
      const fAng = facingAngle + (f * 0.34);
      const fLen = (13 + Math.abs(f) * 6) * slamP;
      const fx = impactX + Math.cos(fAng) * fLen;
      const fy = impactY + Math.sin(fAng) * (fLen * 0.5);
      const midx = (impactX + fx) * 0.5 + Math.sin(f * 2) * 2;
      const midy = (impactY + fy) * 0.5;

      const crackGrd = ctx.createLinearGradient(impactX, impactY, fx, fy);
      crackGrd.addColorStop(0, `rgba(0, 240, 255, ${slamAlpha * 0.85})`);
      crackGrd.addColorStop(0.5, `rgba(56, 189, 248, ${slamAlpha * 0.6})`);
      crackGrd.addColorStop(1, "rgba(8, 47, 73, 0)");
      ctx.fillStyle = crackGrd;

      ctx.beginPath();
      ctx.moveTo(impactX - 1.8, impactY);
      ctx.lineTo(midx, midy - 2);
      ctx.lineTo(fx, fy - 1.2);
      ctx.lineTo(midx + 1.5, midy + 1);
      ctx.lineTo(impactX + 1.8, impactY);
      ctx.closePath();
      ctx.fill();
    }

    // 3. Erupting 3D Glacial Rupture Spikes (Faceted Diamond Stalagmites)
    const spikeCount = 5;
    for (let s = 0; s < spikeCount; s++) {
      const sOffset = (s - 2) * 8.5;
      const sHeight = (15 + Math.sin(s * 1.5) * 8) * Math.sin(slamP * Math.PI);
      const sx = impactX + Math.cos(facingAngle + Math.PI / 2) * sOffset + atkDirX * (s * 3);
      const sy = impactY + Math.sin(facingAngle + Math.PI / 2) * (sOffset * 0.4);

      if (sHeight > 2) {
        // Facet Left
        const spikeLeftGrd = ctx.createLinearGradient(sx - 4, sy, sx, sy - sHeight);
        spikeLeftGrd.addColorStop(0, "#082f49");
        spikeLeftGrd.addColorStop(0.5, "#0284c7");
        spikeLeftGrd.addColorStop(1, "#bae6fd");
        ctx.fillStyle = spikeLeftGrd;
        ctx.beginPath();
        ctx.moveTo(sx - 4, sy);
        ctx.lineTo(sx, sy - sHeight);
        ctx.lineTo(sx, sy);
        ctx.closePath();
        ctx.fill();

        // Facet Right (lit)
        const spikeRightGrd = ctx.createLinearGradient(sx, sy, sx + 4, sy - sHeight);
        spikeRightGrd.addColorStop(0, "#0284c7");
        spikeRightGrd.addColorStop(0.4, "#38bdf8");
        spikeRightGrd.addColorStop(1, "#ffffff");
        ctx.fillStyle = spikeRightGrd;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx, sy - sHeight);
        ctx.lineTo(sx + 4, sy);
        ctx.closePath();
        ctx.fill();

        // Prismatic diamond glint at the tip
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(sx, sy - sHeight - 2);
        ctx.lineTo(sx + 1.5, sy - sHeight);
        ctx.lineTo(sx, sy - sHeight + 1.5);
        ctx.lineTo(sx - 1.5, sy - sHeight);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // -------------------------------------------------------------
  // Channeled Blizzard Roar / Frost Breath Cone
  // -------------------------------------------------------------
  if (isBreathingFrost) {
    ctx.save();
    const breathHeadX = cfg.headX * scale;
    const breathHeadY = (cfg.headY + 6.0) * scale;

    for (let c = 0; c < 4; c++) {
      const cDist = 20 + c * 22;
      const cWidth = 12 + c * 15;
      const coneX = breathHeadX + atkDirX * cDist;
      const coneY = breathHeadY + atkDirY * cDist;

      // Angular diamond frost burst (not soft blur circles)
      const breathGrd = ctx.createLinearGradient(coneX - cWidth, coneY, coneX + cWidth, coneY);
      breathGrd.addColorStop(0, "rgba(8, 47, 73, 0)");
      breathGrd.addColorStop(0.3, "rgba(56, 189, 248, 0.4)");
      breathGrd.addColorStop(0.5, "rgba(255, 255, 255, 0.7)");
      breathGrd.addColorStop(0.7, "rgba(56, 189, 248, 0.4)");
      breathGrd.addColorStop(1, "rgba(8, 47, 73, 0)");
      ctx.fillStyle = breathGrd;

      ctx.beginPath();
      ctx.moveTo(coneX, coneY - cWidth * 0.75);
      ctx.lineTo(coneX + cWidth, coneY);
      ctx.lineTo(coneX, coneY + cWidth * 0.75);
      ctx.lineTo(coneX - cWidth, coneY);
      ctx.closePath();
      ctx.fill();
    }

    // Flying Diamond Hail Crystals in Breath Stream
    for (let h = 0; h < 6; h++) {
      const hProg = ((nowMs * 0.006 + h * 0.18) % 1.0);
      const hDist = 12 + hProg * 75;
      const hSpread = Math.sin(nowMs * 0.01 + h) * (hDist * 0.28);
      const hx = breathHeadX + atkDirX * hDist - atkDirY * hSpread;
      const hy = breathHeadY + atkDirY * hDist + atkDirX * hSpread;
      const sz = 1.4 + hProg * 1.6;

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(hx, hy - sz);
      ctx.lineTo(hx + sz, hy);
      ctx.lineTo(hx, hy + sz);
      ctx.lineTo(hx - sz, hy);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // -------------------------------------------------------------
  // Leg Drawing Helper (Digitigrade Chiseled Craggy Limbs - ENLARGED)
  // -------------------------------------------------------------
  const drawLeg = (footX, footY, isNearLeg, isFacingBack) => {
    ctx.save();
    const legGrd = ctx.createLinearGradient(footX - 12, footY - 26, footX + 12, footY + 4);
    if (isNearLeg) {
      legGrd.addColorStop(0, skinLit);
      legGrd.addColorStop(0.45, skinMid);
      legGrd.addColorStop(1, skinOcclusion);
    } else {
      legGrd.addColorStop(0, skinMid);
      legGrd.addColorStop(0.55, skinShadow);
      legGrd.addColorStop(1, "#04192b");
    }
    ctx.fillStyle = legGrd;

    // Muscular Angular Thigh & Calf (Elongated, Powerful Polygonal Planes)
    ctx.beginPath();
    ctx.moveTo(footX - 7.5, footY - 26);                       // Upper hip connection
    ctx.lineTo(footX - (isNearLeg ? 11.5 : 9.5), footY - 14); // Massive quad peak
    ctx.lineTo(footX - (isNearLeg ? 10.5 : 8.5), footY - 8);  // Hamstring flare
    ctx.lineTo(footX - 6.0, footY - 2);                       // Outer shin transition
    ctx.lineTo(footX + 6.0, footY - 2);                       // Inner shin base
    ctx.lineTo(footX + (isNearLeg ? 9.5 : 7.5), footY - 8);   // Medial calf / gastrocnemius bulge
    ctx.lineTo(footX + (isNearLeg ? 10.5 : 8.5), footY - 15); // Inner thigh
    ctx.lineTo(footX + 7.5, footY - 26);                       // Inner hip connection
    ctx.closePath();
    ctx.fill();

    // Quadriceps Muscle Facet Highlight (Volumetric Planar Chisel)
    if (isNearLeg) {
      ctx.fillStyle = "rgba(224, 242, 254, 0.35)";
      ctx.beginPath();
      ctx.moveTo(footX - 1.5, footY - 24);
      ctx.lineTo(footX - 7.0, footY - 14);
      ctx.lineTo(footX - 3.0, footY - 8);
      ctx.lineTo(footX + 3.0, footY - 14);
      ctx.closePath();
      ctx.fill();
    }

    // Prominent Chiseled Diamond/Hexagonal Knee Patella Plate (Heavy Armor Joint)
    if (isNearLeg) {
      const kneeGrd = ctx.createLinearGradient(footX, footY - 14, footX, footY - 6);
      kneeGrd.addColorStop(0, "#e0f2fe");
      kneeGrd.addColorStop(1, skinMid);
      ctx.fillStyle = kneeGrd;
      ctx.beginPath();
      ctx.moveTo(footX, footY - 13.5);
      ctx.lineTo(footX + 4.2, footY - 9.5);
      ctx.lineTo(footX + 2.8, footY - 6.0);
      ctx.lineTo(footX - 2.8, footY - 6.0);
      ctx.lineTo(footX - 4.2, footY - 9.5);
      ctx.closePath();
      ctx.fill();

      // Sharp Specular Knee Edge
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(footX, footY - 13.0);
      ctx.lineTo(footX + 3.2, footY - 9.5);
      ctx.lineTo(footX, footY - 9.0);
      ctx.closePath();
      ctx.fill();
    }

    // Heavy Blocky Permafrost Paw Base (Angular Chiseled Metatarsal)
    ctx.fillStyle = isNearLeg ? skinOcclusion : "#04192b";
    ctx.beginPath();
    ctx.moveTo(footX - 7.5, footY - 2);
    ctx.lineTo(footX + 7.5, footY - 2);
    ctx.lineTo(footX + 9.0, footY + 4.0);
    ctx.lineTo(footX - 9.0, footY + 4.0);
    ctx.closePath();
    ctx.fill();

    // 3 Sharp Splayed Stone Claws (Elongated Triangular Dagger Talons)
    const clawColor = isNearLeg ? skinMid : skinShadow;
    ctx.fillStyle = clawColor;
    for (let c = -1; c <= 1; c++) {
      const cx = footX + c * 4.6;
      const cy = footY + (isFacingBack ? -1.0 : 3.5);
      const clawLen = isFacingBack ? -4.5 : 5.8;

      // Faceted Claw Body
      ctx.beginPath();
      ctx.moveTo(cx - 2.0, cy - 0.5);
      ctx.lineTo(cx, cy + clawLen);
      ctx.lineTo(cx + 2.0, cy - 0.5);
      ctx.closePath();
      ctx.fill();

      // Sharp Specular Ridge
      if (isNearLeg) {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx, cy + clawLen * 0.88);
        ctx.lineTo(cx + 0.8, cy);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = clawColor;
      }
    }

    // Glass Visual Effect: Glossy Specular Sheen Ribbons & Diamond Knee Glints
    if (isGlass) {
      drawGlassGlossSheen(ctx, footX - 4, footY - 24, footX - 2, footY - 10, 4.0, 0.55 * glassRefraction);
      drawGlassGlossSheen(ctx, footX - 1, footY - 8, footX + 1, footY + 1, 3.0, 0.45 * glassRefraction);
      if (isNearLeg) {
        ctx.fillStyle = `rgba(0, 240, 255, ${0.75 * glassRefraction})`;
        ctx.fillRect(footX - 3.8, footY - 10.0, 7.6, 1.0);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(footX - 2.5, footY - 10.5, 5.0, 0.8);
        const kneeGlintPhase = (nowMs * 0.003 + (isFacingBack ? 1.5 : 0)) % (Math.PI * 2);
        const glintA = Math.max(0, Math.sin(kneeGlintPhase) - 0.45) * 1.8;
        if (glintA > 0.05) {
          drawPrismaticStarGlint(ctx, footX, footY - 9.5, 4.8, glintA * glassRefraction, 0.25);
        }
      }
    }
    ctx.restore();
  };

  // -------------------------------------------------------------
  // Weapon Drawing Helper (Colossal Monolithic Glacial Stalagmite Maul)
  // -------------------------------------------------------------
  const drawFrozenMaul = (fistY) => {
    ctx.save();
    ctx.translate(0, fistY);

    // Maul Shaft (Faceted Permafrost Timber Monolith)
    const shaftGrd = ctx.createLinearGradient(-3.5, -24, 3.5, 16);
    shaftGrd.addColorStop(0, "#082f49");
    shaftGrd.addColorStop(0.4, "#0f172a");
    shaftGrd.addColorStop(1, "#1e293b");
    ctx.fillStyle = shaftGrd;
    ctx.beginPath();
    ctx.moveTo(-3.0, -24);
    ctx.lineTo(3.0, -24);
    ctx.lineTo(2.4, 16);
    ctx.lineTo(-2.4, 16);
    ctx.closePath();
    ctx.fill();

    // Maul Wrappings (Chiseled Leather Bands)
    ctx.fillStyle = "#334155";
    ctx.beginPath();
    ctx.moveTo(-2.8, -4);
    ctx.lineTo(2.8, -2);
    ctx.lineTo(2.8, 1);
    ctx.lineTo(-2.8, -1);
    ctx.closePath();
    ctx.fill();

    // Giant Spiked Faceted Glacial Stalagmite Hammer Head (Chiseled Polygonal Monolith)
    // Left Shadow Facet
    const headLeftGrd = ctx.createLinearGradient(-15, -30, 0, -10);
    headLeftGrd.addColorStop(0, "#082f49");
    headLeftGrd.addColorStop(0.6, "#0284c7");
    headLeftGrd.addColorStop(1, "#0369a1");
    ctx.fillStyle = headLeftGrd;
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(-15, -24);
    ctx.lineTo(-12, -10);
    ctx.lineTo(0, -14);
    ctx.closePath();
    ctx.fill();

    // Right Lit Facet
    const headRightGrd = ctx.createLinearGradient(0, -32, 15, -10);
    headRightGrd.addColorStop(0, "#ffffff");
    headRightGrd.addColorStop(0.35, "#38bdf8");
    headRightGrd.addColorStop(1, "#0284c7");
    ctx.fillStyle = headRightGrd;
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(15, -24);
    ctx.lineTo(12, -10);
    ctx.lineTo(0, -14);
    ctx.closePath();
    ctx.fill();

    // Center Chiseled Ridge Specular Highlight
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(1.4, -20);
    ctx.lineTo(0, -14);
    ctx.lineTo(-0.8, -20);
    ctx.closePath();
    ctx.fill();

    // Runic Angular Frost Inscription on Hammer (Sharp Elder Futhark Glyph)
    ctx.fillStyle = "rgba(0, 240, 255, 0.95)";
    ctx.beginPath();
    ctx.moveTo(0, -25);
    ctx.lineTo(3.5, -20);
    ctx.lineTo(0, -15);
    ctx.lineTo(-3.5, -20);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(1.5, -20);
    ctx.lineTo(0, -18);
    ctx.lineTo(-1.5, -20);
    ctx.closePath();
    ctx.fill();

    // Lateral Faceted Stalactite Ice Spikes
    for (let sp = -1; sp <= 1; sp += 2) {
      const spikeX = sp * 14;
      const spikeTipX = sp * 22;
      ctx.fillStyle = sp > 0 ? "#e0f2fe" : "#38bdf8";
      ctx.beginPath();
      ctx.moveTo(spikeX, -22);
      ctx.lineTo(spikeTipX, -18);
      ctx.lineTo(spikeX, -13);
      ctx.closePath();
      ctx.fill();

      // Specular Needle Tip
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(spikeTipX - sp * 1.5, -18.5);
      ctx.lineTo(spikeTipX, -18);
      ctx.lineTo(spikeTipX - sp * 1.5, -17.5);
      ctx.closePath();
      ctx.fill();
    }

    if (isGlass) {
      drawGlassGlossSheen(ctx, -12, -26, 12, -14, 6.0, 0.75 * glassRefraction);
      drawPrismaticStarGlint(ctx, 0, -32, 5.5, 0.9 * glassRefraction, 0);
      drawPrismaticStarGlint(ctx, -22, -18, 4.2, 0.8 * glassRefraction, -0.3);
      drawPrismaticStarGlint(ctx, 22, -18, 4.2, 0.8 * glassRefraction, 0.3);
    }
    ctx.restore();
  };

  // -------------------------------------------------------------
  // Arm & Blocky Knuckle Gauntlet Helper (NO MORE CIRCLE FISTS)
  // -------------------------------------------------------------
  const drawArm = (armX, armY, isRightArm, isNearArm) => {
    ctx.save();
    ctx.translate(armX, armY);

    const armDirSign = isRightArm ? -1 : 1;
    let armRot = isBackView ? -0.22 * armDirSign : 0.18 * armDirSign;
    const walkArmSwing = moving ? (isRightArm ? -strideSwing * 0.04 : strideSwing * 0.04) : 0;

    if (isAttacking && attackProgress > 0) {
      if (attackProgress < 0.28) {
        const t = attackProgress / 0.28;
        armRot += -armDirSign * t * 1.35;
      } else if (attackProgress < 0.65) {
        const t = (attackProgress - 0.28) / 0.37;
        armRot += armDirSign * (-1.35 + t * 2.15);
      }
    }

    ctx.rotate(armRot + walkArmSwing);

    // Chiseled Faceted Deltoid, Bicep & Forearm Planes
    const armGrd = ctx.createLinearGradient(-6, -6, 6, 16);
    if (isNearArm) {
      armGrd.addColorStop(0, skinLit);
      armGrd.addColorStop(0.4, skinMid);
      armGrd.addColorStop(1, skinOcclusion);
    } else {
      armGrd.addColorStop(0, skinMid);
      armGrd.addColorStop(0.5, skinShadow);
      armGrd.addColorStop(1, "#04192b");
    }
    ctx.fillStyle = armGrd;

    // Angular Chiseled Muscle Silhouette (Polygonal cuts, no smooth round balls)
    ctx.beginPath();
    ctx.moveTo(-5.5, -4.5);
    ctx.lineTo(-9.5, 3.5);  // Sharp lateral deltoid peak
    ctx.lineTo(-7.5, 11.5); // Brachioradialis forearm cut
    ctx.lineTo(-5.0, 13.5); // Wrist transition
    ctx.lineTo(5.0, 13.5);
    ctx.lineTo(7.5, 11.5);
    ctx.lineTo(9.5, 3.5);   // Medial deltoid peak
    ctx.lineTo(5.5, -4.5);
    ctx.closePath();
    ctx.fill();

    // Muscle Ridge Facet Plane (Volumetric Chisel Highlight)
    if (isNearArm) {
      ctx.fillStyle = "rgba(224, 242, 254, 0.4)";
      ctx.beginPath();
      ctx.moveTo(-armDirSign * 1.5, -2.5);
      ctx.lineTo(-armDirSign * 4.5, 4.0);
      ctx.lineTo(-armDirSign * 2.0, 10.0);
      ctx.lineTo(armDirSign * 1.5, 4.0);
      ctx.closePath();
      ctx.fill();
    }

    // Heavy Faceted Glacial Ice Pauldron (Berserker)
    if (isNearArm && (isBerserker || (isBoss && !isJotunn))) {
      // Angular Pauldron Slab
      const pauldronGrd = ctx.createLinearGradient(-10, -11, 10, 4);
      pauldronGrd.addColorStop(0, "#ffffff");
      pauldronGrd.addColorStop(0.35, "#38bdf8");
      pauldronGrd.addColorStop(0.75, "#0284c7");
      pauldronGrd.addColorStop(1, "#082f49");
      ctx.fillStyle = pauldronGrd;

      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(10, -6);
      ctx.lineTo(8, 5);
      ctx.lineTo(-8, 5);
      ctx.lineTo(-10, -6);
      ctx.closePath();
      ctx.fill();

      // Sharp Faceted Pauldron Bevel
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(1.5, -3);
      ctx.lineTo(0, 5);
      ctx.lineTo(-1.5, -3);
      ctx.closePath();
      ctx.fill();

      // Protruding Glacial Spikes on Pauldron (Faceted Stalagmites)
      for (let psp = -1; psp <= 1; psp++) {
        const px = psp * 5.5;
        const pTipY = -16 - Math.abs(psp) * 3;
        ctx.fillStyle = "#e0f2fe";
        ctx.beginPath();
        ctx.moveTo(px - 2.5, -7);
        ctx.lineTo(px, pTipY);
        ctx.lineTo(px + 2.5, -7);
        ctx.closePath();
        ctx.fill();

        // Tip diamond glint
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(px, pTipY - 1.5);
        ctx.lineTo(px + 1, pTipY);
        ctx.lineTo(px, pTipY + 1);
        ctx.lineTo(px - 1, pTipY);
        ctx.closePath();
        ctx.fill();
      }
    }

    const fistY = 14.5;

    // Berserker Wielding Glacial Maul in Primary Arm
    if (isBerserker && isNearArm && !isRightArm) {
      drawFrozenMaul(fistY);
    }

    // ---------------------------------------------------------
    // BLOCKY CHISELED KNUCKLE GAUNTLET (REPLACES ROUND CIRCLE FIST)
    // ---------------------------------------------------------
    // Main Hexagonal Stone Knuckle Core
    const fistGrd = ctx.createLinearGradient(-8, fistY - 5, 8, fistY + 8);
    fistGrd.addColorStop(0, isNearArm ? "#94a3b8" : "#64748b");
    fistGrd.addColorStop(0.45, isNearArm ? "#475569" : "#334155");
    fistGrd.addColorStop(1, "#0f172a");
    ctx.fillStyle = fistGrd;

    ctx.beginPath();
    ctx.moveTo(-7.5, fistY - 3.5);
    ctx.lineTo(7.5, fistY - 3.5);
    ctx.lineTo(9.5, fistY + 2.5);
    ctx.lineTo(6.5, fistY + 8.5);
    ctx.lineTo(-6.5, fistY + 8.5);
    ctx.lineTo(-9.5, fistY + 2.5);
    ctx.closePath();
    ctx.fill();

    // 4 Distinct Chiseled Knuckle Plates (Blocky Knuckle Ridge)
    const plateWidth = 3.6;
    for (let kp = 0; kp < 4; kp++) {
      const kx = -5.4 + kp * plateWidth;
      const plateGrd = ctx.createLinearGradient(kx, fistY - 2, kx, fistY + 6);
      plateGrd.addColorStop(0, isNearArm ? "#cbd5e1" : "#94a3b8");
      plateGrd.addColorStop(0.6, isNearArm ? "#64748b" : "#475569");
      plateGrd.addColorStop(1, "#1e293b");
      ctx.fillStyle = plateGrd;

      ctx.beginPath();
      ctx.moveTo(kx - 1.5, fistY - 2.5);
      ctx.lineTo(kx + 1.5, fistY - 2.5);
      ctx.lineTo(kx + 1.2, fistY + 6.0);
      ctx.lineTo(kx - 1.2, fistY + 6.0);
      ctx.closePath();
      ctx.fill();

      // Specular Chisel Top Edge
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(kx - 1.5, fistY - 2.5);
      ctx.lineTo(kx + 1.5, fistY - 2.5);
      ctx.lineTo(kx + 1.0, fistY - 1.2);
      ctx.lineTo(kx - 1.0, fistY - 1.2);
      ctx.closePath();
      ctx.fill();
    }

    // 3 Embedded Faceted Crystalline Ice Spikes Protruding from Knuckles
    const crystalGrd = ctx.createLinearGradient(-4, fistY - 6, 4, fistY + 8);
    crystalGrd.addColorStop(0, "#ffffff");
    crystalGrd.addColorStop(0.3, isCrystal ? "#bae6fd" : "#00f0ff");
    crystalGrd.addColorStop(0.7, "#0284c7");
    crystalGrd.addColorStop(1, "#082f49");
    ctx.fillStyle = crystalGrd;

    // Crystal 1 (Left Spike)
    ctx.beginPath();
    ctx.moveTo(-5.5, fistY + 2.0);
    ctx.lineTo(-4.0, fistY + 8.5);
    ctx.lineTo(-2.2, fistY + 2.0);
    ctx.lineTo(-3.8, fistY - 3.5);
    ctx.closePath();
    ctx.fill();

    // Crystal 2 (Center Main Heavy Stalagmite Spike)
    ctx.beginPath();
    ctx.moveTo(-2.0, fistY + 1.0);
    ctx.lineTo(0.0, fistY + 10.5);
    ctx.lineTo(2.0, fistY + 1.0);
    ctx.lineTo(0.0, fistY - 5.0);
    ctx.closePath();
    ctx.fill();

    // Crystal 3 (Right Spike)
    ctx.beginPath();
    ctx.moveTo(2.2, fistY + 2.0);
    ctx.lineTo(4.0, fistY + 8.5);
    ctx.lineTo(5.5, fistY + 2.0);
    ctx.lineTo(3.8, fistY - 3.5);
    ctx.closePath();
    ctx.fill();

    // Sharp Prismatic Diamond Glints on Crystals
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    // Center tip glint
    ctx.moveTo(0, fistY + 8.5);
    ctx.lineTo(1.2, fistY + 10.5);
    ctx.lineTo(0, fistY + 12.0);
    ctx.lineTo(-1.2, fistY + 10.5);
    ctx.closePath();
    ctx.fill();

    // Glass Visual Effect: Glossy Arm Sheen, Pauldron Prisms & Knuckle Glints
    if (isGlass) {
      drawGlassGlossSheen(ctx, -armDirSign * 3, -3, -armDirSign * 1, 12, 3.8, 0.6 * glassRefraction);
      drawGlassGlossSheen(ctx, -6, fistY - 1, 6, fistY + 4, 3.5, 0.65 * glassRefraction);
      for (let kp = -1; kp <= 1; kp++) {
        const kpx = kp * 3.6;
        const kpy = fistY + (kp === 0 ? 10.5 : 8.5);
        const kPhase = (nowMs * 0.0035 + (isRightArm ? 1 : 0) + kp * 1.5) % (Math.PI * 2);
        const kGlintA = Math.max(0, Math.sin(kPhase) - 0.4) * 1.7;
        if (kGlintA > 0.05) {
          drawPrismaticStarGlint(ctx, kpx, kpy, 3.8, kGlintA * glassRefraction, kp * 0.25);
        }
      }
    }

    // Gathering frost aura on fists during attack windup (Angular polygonal burst)
    if (isAttacking && attackProgress > 0 && attackProgress < 0.35) {
      const glowT = Math.sin((attackProgress / 0.35) * Math.PI);
      ctx.fillStyle = `rgba(0, 240, 255, ${glowT * 0.55})`;
      ctx.beginPath();
      for (let a = 0; a < 6; a++) {
        const ang = (a / 6) * Math.PI * 2;
        const rad = 13.0 * glowT;
        const gx = Math.cos(ang) * rad;
        const gy = fistY + Math.sin(ang) * rad;
        if (a === 0) ctx.moveTo(gx, gy);
        else ctx.lineTo(gx, gy);
      }
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  };

  // -------------------------------------------------------------
  // Layer Sorting: Background Limbs
  // -------------------------------------------------------------
  // Hind Leg (Far)
  const farLegStep = moving ? -Math.sin(walkPhase) * 3.2 : 0;
  drawLeg(cfg.hindLegFarX, 12.0 + farLegStep, false, isBackView);

  // Background Arm (if designated behind torso)
  if (!cfg.rightArmFront) {
    drawArm(cfg.rightArmX, cfg.rightArmY, true, false);
  }
  if (!cfg.leftArmFront) {
    drawArm(cfg.leftArmX, cfg.leftArmY, false, false);
  }

  // Hind Leg (Near)
  const nearLegStep = moving ? Math.sin(walkPhase) * 3.2 : 0;
  drawLeg(cfg.hindLegNearX, 12.0 + nearLegStep, true, isBackView);

  // -------------------------------------------------------------
  // Main Chiseled Torso & Muscular Crag Planes (NO BALLOON TORSO)
  // -------------------------------------------------------------
  ctx.save();
  ctx.rotate(cfg.tilt + torsoSway);

  // Glass Visual Effect: Render Subsurface Luminous Core & Spine inside body volume
  if (isGlass) {
    drawSubsurfaceLuminousCore(ctx, r, cfg, breathCycle, nowMs, glassRefraction);
  }

  const torsoGrd = ctx.createLinearGradient(-r * 0.8, -r * 0.8, r * 0.8, r * 0.6);
  torsoGrd.addColorStop(0, skinLit);
  torsoGrd.addColorStop(0.35, skinMid);
  torsoGrd.addColorStop(0.72, skinShadow);
  torsoGrd.addColorStop(1, skinOcclusion);
  ctx.fillStyle = torsoGrd;

  if (cfg.view === "front") {
    // Symmetrical Direct Front Chiseled Permafrost Torso (Inverted Trapezoid / Hexagonal Monolith)
    ctx.beginPath();
    ctx.moveTo(-r * 0.70, r * 0.48);       // Waist Left
    ctx.lineTo(-r * 0.88, -r * 0.15);      // Lats flare
    ctx.lineTo(-r * 0.82, -r * 0.68);      // Trapezius peak Left
    ctx.lineTo(-r * 0.35, -r * 0.78);      // Left neck saddle
    ctx.lineTo(0, -r * 0.72);              // Center collar notch
    ctx.lineTo(r * 0.35, -r * 0.78);       // Right neck saddle
    ctx.lineTo(r * 0.82, -r * 0.68);       // Trapezius peak Right
    ctx.lineTo(r * 0.88, -r * 0.15);       // Lats flare
    ctx.lineTo(r * 0.70, r * 0.48);        // Waist Right
    ctx.lineTo(0, r * 0.55);               // Pelvis notch
    ctx.closePath();
    ctx.fill();

    // Dual Chiseled Armor-Plate Pectorals (Polygonal Rock Slabs with Crisp Bevels)
    const drawPecPlate = (dirSign) => {
      const pecGrd = ctx.createLinearGradient(dirSign * r * 0.1, -r * 0.45, dirSign * r * 0.6, -r * 0.05);
      pecGrd.addColorStop(0, isGlass ? "rgba(224, 242, 254, 0.65)" : "rgba(224, 242, 254, 0.45)");
      pecGrd.addColorStop(0.5, isGlass ? "rgba(56, 189, 248, 0.45)" : "rgba(56, 189, 248, 0.25)");
      pecGrd.addColorStop(1, isGlass ? "rgba(2, 132, 199, 0.25)" : "rgba(8, 47, 73, 0.1)");
      ctx.fillStyle = pecGrd;

      // Hexagonal Pectoral Slab
      ctx.beginPath();
      ctx.moveTo(dirSign * 1.5, -r * 0.42);
      ctx.lineTo(dirSign * r * 0.62, -r * 0.48);
      ctx.lineTo(dirSign * r * 0.70, -r * 0.20);
      ctx.lineTo(dirSign * r * 0.52, -r * 0.04);
      ctx.lineTo(dirSign * 2.0, -r * 0.08);
      ctx.closePath();
      ctx.fill();

      // Sharp Pectoral Ridge Bevel
      ctx.fillStyle = isGlass ? "rgba(255, 255, 255, 0.65)" : "rgba(255, 255, 255, 0.35)";
      ctx.beginPath();
      ctx.moveTo(dirSign * 2.0, -r * 0.40);
      ctx.lineTo(dirSign * r * 0.60, -r * 0.46);
      ctx.lineTo(dirSign * r * 0.58, -r * 0.42);
      ctx.lineTo(dirSign * 2.0, -r * 0.37);
      ctx.closePath();
      ctx.fill();
    };

    drawPecPlate(-1);
    drawPecPlate(1);

    // Deep Chiseled Sternum Crease & Abdominal Rock Strata
    ctx.fillStyle = skinOcclusion;
    ctx.beginPath();
    ctx.moveTo(-1.2, -r * 0.45);
    ctx.lineTo(1.2, -r * 0.45);
    ctx.lineTo(1.5, r * 0.40);
    ctx.lineTo(-1.5, r * 0.40);
    ctx.closePath();
    ctx.fill();

    // 4 Chiseled Abdominal Rock Slabs (Faceted 4-Pack)
    for (let ab = 0; ab < 2; ab++) {
      const aby = -r * 0.02 + ab * (r * 0.22);
      for (let s = -1; s <= 1; s += 2) {
        ctx.fillStyle = isGlass ? "rgba(56, 189, 248, 0.45)" : "rgba(2, 132, 199, 0.35)";
        ctx.beginPath();
        ctx.moveTo(s * 2.5, aby);
        ctx.lineTo(s * r * 0.35, aby - 1);
        ctx.lineTo(s * r * 0.32, aby + r * 0.16);
        ctx.lineTo(s * 2.5, aby + r * 0.18);
        ctx.closePath();
        ctx.fill();

        // Abdominal Slab Highlight
        ctx.fillStyle = isGlass ? "rgba(255, 255, 255, 0.45)" : "rgba(224, 242, 254, 0.25)";
        ctx.beginPath();
        ctx.moveTo(s * 3.0, aby + 1);
        ctx.lineTo(s * r * 0.32, aby);
        ctx.lineTo(s * r * 0.30, aby + 2.5);
        ctx.lineTo(s * 3.0, aby + 3);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Glass Visual Effect: Sweeping Double Diagonal Specular Gloss Reflection Ribbons
    if (isGlass) {
      drawGlassGlossSheen(ctx, -r * 0.55, -r * 0.60, r * 0.35, -r * 0.15, 6.5, 0.75 * glassRefraction);
      drawGlassGlossSheen(ctx, -r * 0.35, -r * 0.65, r * 0.55, -r * 0.20, 3.2, 0.55 * glassRefraction);
      drawGlassGlossSheen(ctx, -r * 0.40, -r * 0.10, r * 0.20, r * 0.32, 4.5, 0.6 * glassRefraction);

      // Chromatic dispersion bevels on pectoral and sternum ridges
      ctx.fillStyle = `rgba(0, 240, 255, ${0.75 * glassRefraction})`;
      ctx.fillRect(-r * 0.55, -r * 0.44, r * 1.1, 1.2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.85 * glassRefraction})`;
      ctx.fillRect(-r * 0.35, -r * 0.45, r * 0.7, 1.0);

      // Star glint on pectoral apex
      const chestGlintPhase = (nowMs * 0.003) % (Math.PI * 2);
      const chestGlintA = Math.max(0, Math.sin(chestGlintPhase) - 0.4) * 1.6;
      if (chestGlintA > 0.05) {
        drawPrismaticStarGlint(ctx, 0, -r * 0.42, 6.0, chestGlintA * glassRefraction, 0);
      }
    }

    // Glowing Nordic/Permafrost Runic Body Markings (Elder Futhark Angular Inscriptions)
    if ((isBoss || isBerserker || isCrystal) && !isJotunn) {
      const runePulse = Math.sin(nowMs * 0.004) * 0.25 + 0.75;
      ctx.fillStyle = `rgba(0, 240, 255, ${0.85 * runePulse})`;

      // Center Tyr/Algiz Rune (Chevron + Spear)
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.25);
      ctx.lineTo(3.5, -r * 0.15);
      ctx.lineTo(0, -r * 0.05);
      ctx.lineTo(-3.5, -r * 0.15);
      ctx.closePath();
      ctx.fill();

      // Flank Chevron Runes
      for (let s = -1; s <= 1; s += 2) {
        ctx.beginPath();
        ctx.moveTo(s * r * 0.42, -r * 0.22);
        ctx.lineTo(s * r * 0.52, -r * 0.12);
        ctx.lineTo(s * r * 0.42, -r * 0.02);
        ctx.lineTo(s * r * 0.38, -r * 0.12);
        ctx.closePath();
        ctx.fill();
      }
    }
  } else if (cfg.view === "back") {
    // Symmetrical Direct Back Chiseled Gorilla/Troll Torso
    ctx.beginPath();
    ctx.moveTo(-r * 0.72, r * 0.48);
    ctx.lineTo(-r * 0.90, -r * 0.15);
    ctx.lineTo(-r * 0.82, -r * 0.72);
    ctx.lineTo(0, -r * 0.84);
    ctx.lineTo(r * 0.82, -r * 0.72);
    ctx.lineTo(r * 0.90, -r * 0.15);
    ctx.lineTo(r * 0.72, r * 0.48);
    ctx.lineTo(0, r * 0.58);
    ctx.closePath();
    ctx.fill();

    // Angular Vertebral Spine Nodes Running Down Center (Faceted Diamond Plates)
    for (let s = -4; s <= 2; s++) {
      const spy = s * 4.6 - 2.0;
      ctx.fillStyle = isGlass ? "rgba(8, 47, 73, 0.75)" : "#04192b";
      ctx.beginPath();
      ctx.moveTo(0, spy - 2.8);
      ctx.lineTo(2.8, spy);
      ctx.lineTo(0, spy + 2.8);
      ctx.lineTo(-2.8, spy);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = isGlass ? "#00f0ff" : "#0284c7";
      ctx.beginPath();
      ctx.moveTo(0, spy - 1.8);
      ctx.lineTo(1.8, spy);
      ctx.lineTo(0, spy + 1.8);
      ctx.lineTo(-1.8, spy);
      ctx.closePath();
      ctx.fill();
    }

    if (isGlass) {
      drawGlassGlossSheen(ctx, -r * 0.5, -r * 0.65, r * 0.4, -r * 0.1, 5.5, 0.7 * glassRefraction);
      drawGlassGlossSheen(ctx, -r * 0.3, 0, r * 0.35, r * 0.4, 4.0, 0.55 * glassRefraction);
    }
  } else if (isProfileView) {
    // Pure Side Profile Hunched Craggy Torso (Angular Predatory Slope)
    const f = cfg.flip;
    ctx.beginPath();
    ctx.moveTo(-f * r * 0.65, r * 0.48);
    ctx.lineTo(-f * r * 0.85, -r * 0.20);
    ctx.lineTo(-f * r * 0.60, -r * 0.78); // Sharp Dorsal Hump
    ctx.lineTo(0, -r * 0.86);
    ctx.lineTo(f * r * 0.55, -r * 0.62);  // Jutting Chest Plate
    ctx.lineTo(f * r * 0.78, -r * 0.10);
    ctx.lineTo(f * r * 0.45, r * 0.48);
    ctx.lineTo(0, r * 0.58);
    ctx.closePath();
    ctx.fill();

    if (isGlass) {
      drawGlassGlossSheen(ctx, -f * r * 0.45, -r * 0.65, f * r * 0.35, -r * 0.15, 5.5, 0.75 * glassRefraction);
      drawGlassGlossSheen(ctx, -f * r * 0.30, -r * 0.10, f * r * 0.25, r * 0.30, 4.0, 0.55 * glassRefraction);
    }
  } else {
    // Diagonal 3/4 Chiseled Torso
    const f = cfg.flip;
    ctx.beginPath();
    ctx.moveTo(-f * r * 0.72, r * 0.48);
    ctx.lineTo(-f * r * 0.88, -r * 0.15);
    ctx.lineTo(-f * r * 0.72, -r * 0.74);
    ctx.lineTo(0, -r * 0.82);
    ctx.lineTo(f * r * 0.72, -r * 0.64);
    ctx.lineTo(f * r * 0.86, -r * 0.05);
    ctx.lineTo(f * r * 0.66, r * 0.48);
    ctx.lineTo(0, r * 0.58);
    ctx.closePath();
    ctx.fill();

    if (isGlass) {
      drawGlassGlossSheen(ctx, -f * r * 0.45, -r * 0.65, f * r * 0.40, -r * 0.15, 5.8, 0.75 * glassRefraction);
      drawGlassGlossSheen(ctx, -f * r * 0.35, -r * 0.05, f * r * 0.30, r * 0.32, 4.2, 0.58 * glassRefraction);
    }
  }

  // -------------------------------------------------------------
  // Volumetric Jagged Polar Fur Mantle (NO ROUND OVAL COLLAR)
  // Sharp, serrated, multi-pointed triangular fur tufts & frost icicles
  // -------------------------------------------------------------
  // Layer A: Under-fur Shadow Base (Jagged Angular Silhouette)
  const furBaseGrd = ctx.createLinearGradient(0, -r * 0.80, 0, -r * 0.20);
  furBaseGrd.addColorStop(0, "#cbd5e1");
  furBaseGrd.addColorStop(0.45, "#94a3b8");
  furBaseGrd.addColorStop(0.85, "#64748b");
  furBaseGrd.addColorStop(1, "#1e293b");
  ctx.fillStyle = furBaseGrd;

  ctx.beginPath();
  ctx.moveTo(0, -r * 0.75);
  ctx.lineTo(-r * 0.40, -r * 0.78);
  ctx.lineTo(-r * 0.85, -r * 0.55); // Left Shoulder Fur Spike 1
  ctx.lineTo(-r * 0.68, -r * 0.48);
  ctx.lineTo(-r * 0.92, -r * 0.35); // Left Shoulder Fur Spike 2
  ctx.lineTo(-r * 0.65, -r * 0.30);
  ctx.lineTo(-r * 0.78, -r * 0.15); // Left Chest Fur Spike 3
  ctx.lineTo(-r * 0.42, -r * 0.22);
  ctx.lineTo(0, -r * 0.26);         // Center Fur Dip
  ctx.lineTo(r * 0.42, -r * 0.22);
  ctx.lineTo(r * 0.78, -r * 0.15);  // Right Chest Fur Spike 3
  ctx.lineTo(r * 0.65, -r * 0.30);
  ctx.lineTo(r * 0.92, -r * 0.35);  // Right Shoulder Fur Spike 2
  ctx.lineTo(r * 0.68, -r * 0.48);
  ctx.lineTo(r * 0.85, -r * 0.55);  // Right Shoulder Fur Spike 1
  ctx.lineTo(r * 0.40, -r * 0.78);
  ctx.closePath();
  ctx.fill();

  // Layer B: Mid-fur Overlapping Chiseled Tufts
  const furMidGrd = ctx.createLinearGradient(0, -r * 0.70, 0, -r * 0.25);
  furMidGrd.addColorStop(0, "#ffffff");
  furMidGrd.addColorStop(0.55, "#e2e8f0");
  furMidGrd.addColorStop(1, "#94a3b8");
  ctx.fillStyle = furMidGrd;

  // Multi-pointed jagged overlapping tufts
  const furTuftPoints = [
    [-r * 0.70, -r * 0.50, -r * 0.52, -r * 0.38],
    [-r * 0.48, -r * 0.58, -r * 0.30, -r * 0.34],
    [-r * 0.24, -r * 0.62, 0, -r * 0.36],
    [r * 0.24, -r * 0.62, 0, -r * 0.36],
    [r * 0.48, -r * 0.58, r * 0.30, -r * 0.34],
    [r * 0.70, -r * 0.50, r * 0.52, -r * 0.38]
  ];

  for (let tp = 0; tp < furTuftPoints.length; tp++) {
    const [tx1, ty1, tx2, ty2] = furTuftPoints[tp];
    ctx.beginPath();
    ctx.moveTo(tx1, ty1);
    ctx.lineTo((tx1 + tx2) * 0.5 + (tp % 2 === 0 ? -3 : 3), (ty1 + ty2) * 0.5 + 4);
    ctx.lineTo(tx2, ty2);
    ctx.closePath();
    ctx.fill();
  }

  // Layer C: Razor Frost Specular Edges on Fur Tufts
  ctx.fillStyle = "#ffffff";
  for (let s = -3; s <= 3; s++) {
    const sx = s * (r * 0.24);
    const sy = -r * 0.45 + Math.abs(s) * 2;
    ctx.beginPath();
    ctx.moveTo(sx - 2, sy);
    ctx.lineTo(sx, sy + 6.5);
    ctx.lineTo(sx + 2, sy);
    ctx.closePath();
    ctx.fill();
  }

  // Dorsal Ice Crystal Spines (in Back and 3/4 Back views - Faceted Prisms)
  if (isBackView) {
    const spineCrystalGrd = ctx.createLinearGradient(0, -r * 0.7, 0, 0);
    spineCrystalGrd.addColorStop(0, "#ffffff");
    spineCrystalGrd.addColorStop(0.3, isCrystal ? "#bae6fd" : "#00f0ff");
    spineCrystalGrd.addColorStop(0.7, "#0284c7");
    spineCrystalGrd.addColorStop(1, "#082f49");
    ctx.fillStyle = spineCrystalGrd;

    const spineCount = isBoss ? 4 : 3;
    for (let sp = -spineCount + 1; sp <= 1; sp++) {
      const spy = sp * 7.5 - 6.0;
      // Faceted Diamond Spine
      ctx.beginPath();
      ctx.moveTo(0, spy - 8.5);
      ctx.lineTo(3.2, spy + 1.0);
      ctx.lineTo(0, spy + 4.5);
      ctx.lineTo(-3.2, spy + 1.0);
      ctx.closePath();
      ctx.fill();

      // Specular diamond glint
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(0, spy - 8.5);
      ctx.lineTo(1.2, spy - 4.0);
      ctx.lineTo(0, spy - 1.5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = spineCrystalGrd;
    }
  }

  ctx.restore(); // End Torso

  // -------------------------------------------------------------
  // Neanderthal Chiseled Head & Facial Features (NO ROUND BALL SKULL)
  // -------------------------------------------------------------
  ctx.save();
  const headX = cfg.headX;
  const headY = cfg.headY;
  ctx.translate(headX, headY);
  ctx.rotate(cfg.tilt * 0.7);

  // Skull Base: Angular Faceted Neanderthal Cranium & Jaw
  const headGrd = ctx.createLinearGradient(-10, -12, 10, 10);
  headGrd.addColorStop(0, skinLit);
  headGrd.addColorStop(0.4, skinMid);
  headGrd.addColorStop(0.85, skinShadow);
  headGrd.addColorStop(1, skinOcclusion);
  ctx.fillStyle = headGrd;

  // Polygonal Chiseled Cranium & Square Cut Mandible
  ctx.beginPath();
  ctx.moveTo(0, -13.0);          // Top Cranium Peak
  ctx.lineTo(8.5, -11.0);        // Right Temple Cut
  ctx.lineTo(10.5, -4.5);        // Right Cheekbone Peak
  ctx.lineTo(9.0, 3.5);          // Right Mandible Angle
  ctx.lineTo(5.5, 9.0);          // Right Chin Point
  ctx.lineTo(-5.5, 9.0);         // Left Chin Point
  ctx.lineTo(-9.0, 3.5);         // Left Mandible Angle
  ctx.lineTo(-10.5, -4.5);       // Left Cheekbone Peak
  ctx.lineTo(-8.5, -11.0);       // Left Temple Cut
  ctx.closePath();
  ctx.fill();

  // Cranial Facet Bevel (Light & Shadow Planes)
  ctx.fillStyle = isGlass ? "rgba(255, 255, 255, 0.55)" : "rgba(255, 255, 255, 0.28)";
  ctx.beginPath();
  ctx.moveTo(0, -13.0);
  ctx.lineTo(6.5, -10.5);
  ctx.lineTo(7.5, -4.5);
  ctx.lineTo(0, -5.5);
  ctx.closePath();
  ctx.fill();

  // Glass Visual Effect: Convex Cranium Reflection Sweep
  if (isGlass) {
    drawGlassGlossSheen(ctx, -7, -13, 7, -5, 4.0, 0.75 * glassRefraction);
  }

  // Glacial Horns (Clean, bold monolithic silhouette)
  if (isBoss || isBerserker) {
    const hornGrd = ctx.createLinearGradient(0, -12, 0, -28);
    hornGrd.addColorStop(0, isGlass ? "rgba(2, 132, 199, 0.7)" : "#0284c7");
    hornGrd.addColorStop(0.4, isGlass ? "rgba(56, 189, 248, 0.85)" : "#38bdf8");
    hornGrd.addColorStop(1, "#ffffff");
    ctx.fillStyle = hornGrd;

    const hornSpreads = [-7.5, 7.5];
    const hornHeight = isJotunn ? 20 : 13;

    for (let h = 0; h < 2; h++) {
      const hx = hornSpreads[h];
      ctx.beginPath();
      ctx.moveTo(hx - 2.5, -11.0);
      ctx.lineTo(hx * 1.25, -11.0 - hornHeight);
      ctx.lineTo(hx + 2.5, -11.0);
      ctx.closePath();
      ctx.fill();

      // Clean specular edge
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(hx, -11.0);
      ctx.lineTo(hx * 1.25, -11.0 - hornHeight);
      ctx.lineTo(hx * 1.25 - (hx > 0 ? 0.8 : -0.8), -11.0 - hornHeight * 0.7);
      ctx.closePath();
      ctx.fill();

      // Glass Horn Sheen & Tip Diamond Glint
      if (isGlass) {
        drawGlassGlossSheen(ctx, hx - 1, -11.0, hx * 1.25, -11.0 - hornHeight, 2.8, 0.8 * glassRefraction);
        const hornGlintPhase = (nowMs * 0.0035 + h * 2.5) % (Math.PI * 2);
        const hGlintA = Math.max(0, Math.sin(hornGlintPhase) - 0.35) * 1.6;
        if (hGlintA > 0.05) {
          drawPrismaticStarGlint(ctx, hx * 1.25, -11.0 - hornHeight, 5.5, hGlintA * glassRefraction, h * 0.35);
        }
      }
      ctx.fillStyle = hornGrd;
    }
  }

  // Pointed Angular Troll Ears with Sharp Cartilage Cuts
  const earSpread = isProfileView ? 8.5 : 13.0;
  const earFlip = cfg.flip;

  const drawEar = (earDir) => {
    ctx.save();
    const ex = earDir * earSpread;
    const ey = -4.5;
    const earGrd = ctx.createLinearGradient(ex, ey, ex + earDir * 6.0, ey - 6.5);
    earGrd.addColorStop(0, skinMid);
    earGrd.addColorStop(0.6, skinLit);
    earGrd.addColorStop(1, "#e0f2fe");
    ctx.fillStyle = earGrd;

    // Sharp Triangular Elf/Troll Ear
    ctx.beginPath();
    ctx.moveTo(ex * 0.75, ey - 1.5);
    ctx.lineTo(ex + earDir * 7.0, ey - 7.5); // Sharp needle ear tip
    ctx.lineTo(ex + earDir * 2.0, ey + 3.5);
    ctx.lineTo(ex * 0.8, ey + 4.0);
    ctx.closePath();
    ctx.fill();

    // Inner Cartilage Chisel Cut
    ctx.fillStyle = skinOcclusion;
    ctx.beginPath();
    ctx.moveTo(ex * 0.8, ey);
    ctx.lineTo(ex + earDir * 4.5, ey - 5.0);
    ctx.lineTo(ex + earDir * 1.5, ey + 1.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  if (!isProfileView) {
    drawEar(-1);
    drawEar(1);
  } else {
    drawEar(earFlip);
  }

  // Front & Profile Facial Features
  if (isFrontView || isProfileView) {
    // Heavy Angular Neanderthal Brow Ridge (Sharp V-Cut Wedge, NO FLAT OVAL DISC)
    const browGrd = ctx.createLinearGradient(0, -7.0, 0, -2.0);
    browGrd.addColorStop(0, "#e0f2fe");
    browGrd.addColorStop(0.4, skinMid);
    browGrd.addColorStop(1, skinOcclusion);
    ctx.fillStyle = browGrd;

    ctx.beginPath();
    ctx.moveTo(0, -3.2);                                  // Center brow V-notch
    ctx.lineTo(isProfileView ? 6.5 : 9.0, -5.5);          // Outer right brow peak
    ctx.lineTo(isProfileView ? 6.0 : 8.5, -2.5);          // Right orbital shelf
    ctx.lineTo(0, -1.8);                                  // Lower glabella notch
    ctx.lineTo(isProfileView ? -6.0 : -8.5, -2.5);        // Left orbital shelf
    ctx.lineTo(isProfileView ? -6.5 : -9.0, -5.5);        // Outer left brow peak
    ctx.closePath();
    ctx.fill();

    // Deep Chiseled Eye Sockets
    ctx.fillStyle = "#04192b";
    const eyeOffsetX = isProfileView ? (earFlip > 0 ? 2.8 : -2.8) : 4.2;

    const drawEye = (ex) => {
      // Angular Diamond Eye Socket
      ctx.fillStyle = "#04192b";
      ctx.beginPath();
      ctx.moveTo(ex, -4.8);
      ctx.lineTo(ex + 3.2, -3.2);
      ctx.lineTo(ex, -1.6);
      ctx.lineTo(ex - 3.2, -3.2);
      ctx.closePath();
      ctx.fill();

      // Cyan Bioluminescent Slit Eye / Diamond Prism
      ctx.fillStyle = "#00f0ff";
      ctx.beginPath();
      ctx.moveTo(ex, -4.2);
      ctx.lineTo(ex + 2.2, -3.2);
      ctx.lineTo(ex, -2.2);
      ctx.lineTo(ex - 2.2, -3.2);
      ctx.closePath();
      ctx.fill();

      // Pure White Horizontal Specular Slit (Fierce Menacing Gaze)
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(ex - 1.8, -3.2);
      ctx.lineTo(ex + 1.8, -3.2);
      ctx.lineTo(ex, -3.6);
      ctx.closePath();
      ctx.fill();
    };

    if (isFrontView) {
      drawEye(-eyeOffsetX);
      drawEye(eyeOffsetX);
    } else {
      drawEye(earFlip * 2.4);
    }

    // Heavy Chiseled Nose Bridge (Polygonal Wedge)
    ctx.fillStyle = skinMid;
    ctx.beginPath();
    ctx.moveTo(0, -2.5);
    ctx.lineTo(2.2, 2.0);
    ctx.lineTo(0, 3.2);
    ctx.lineTo(-2.2, 2.0);
    ctx.closePath();
    ctx.fill();

    // 3D Carved Ivory / Optical Glass Underbite Canines (Sharp Faceted Dagger Tusks)
    const tuskGrd = ctx.createLinearGradient(0, 7, 0, -3);
    if (isGlass) {
      tuskGrd.addColorStop(0, "rgba(2, 132, 199, 0.65)");
      tuskGrd.addColorStop(0.35, "rgba(56, 189, 248, 0.85)");
      tuskGrd.addColorStop(1, "#ffffff");
    } else {
      tuskGrd.addColorStop(0, "#713f12");
      tuskGrd.addColorStop(0.3, "#fef08a");
      tuskGrd.addColorStop(1, "#ffffff");
    }
    ctx.fillStyle = tuskGrd;

    const drawTusk = (tx, dirSign) => {
      // Faceted Dagger-Tusk (Polygonal Bevel)
      ctx.beginPath();
      ctx.moveTo(tx - 1.6, 6.5);
      ctx.lineTo(tx + dirSign * 2.8, -3.5); // Needle Tip
      ctx.lineTo(tx + 1.6, 6.5);
      ctx.closePath();
      ctx.fill();

      // Sharp Specular Edge
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(tx, 6.0);
      ctx.lineTo(tx + dirSign * 2.8, -3.5);
      ctx.lineTo(tx + dirSign * 1.2, -3.5);
      ctx.closePath();
      ctx.fill();

      // Glass Tip Diamond Star Glint
      if (isGlass) {
        drawPrismaticStarGlint(ctx, tx + dirSign * 2.8, -3.5, 3.2, 0.85 * glassRefraction, dirSign * 0.25);
      }
      ctx.fillStyle = tuskGrd;
    };

    if (isFrontView) {
      drawTusk(-4.8, -1);
      drawTusk(4.8, 1);
    } else {
      drawTusk(earFlip * 3.8, earFlip);
    }
  } else {
    // Back View: Clean Snowy Cranial Ridge (No Clutter)
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(0, -12.5);
    ctx.lineTo(7.0, -10.5);
    ctx.lineTo(5.5, -9.0);
    ctx.lineTo(0, -10.0);
    ctx.lineTo(-5.5, -9.0);
    ctx.lineTo(-7.0, -10.5);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore(); // End Head

  // -------------------------------------------------------------
  // Layer Sorting: Foreground Limbs
  // -------------------------------------------------------------
  if (cfg.rightArmFront) {
    drawArm(cfg.rightArmX, cfg.rightArmY, true, true);
  }
  if (cfg.leftArmFront) {
    drawArm(cfg.leftArmX, cfg.leftArmY, false, true);
  }

  // -------------------------------------------------------------
  // Ambient Blizzard Snowflake & Prismatic Glass Motes
  // -------------------------------------------------------------
  if (isGlass) {
    const moteCount = isBoss ? 8 : 5;
    for (let gm = 0; gm < moteCount; gm++) {
      const gmPhase = (nowMs * 0.0014 + gm * 1.45 + seed) % (Math.PI * 2);
      const gmDist = 24 + Math.sin(gmPhase * 1.3) * 14;
      const gmAng = gmPhase * 1.35 + gm * 1.1;
      const gmX = Math.cos(gmAng) * gmDist;
      const gmY = Math.sin(gmAng) * (gmDist * 0.62) - 6;
      const gmAlpha = (Math.sin(gmPhase) * 0.45 + 0.5) * glassRefraction;
      const gmRot = gmPhase * 2.2;
      const gmSize = 1.8 + Math.sin(gmPhase * 2.0) * 0.8;
      drawPrismaticStarGlint(ctx, gmX, gmY, gmSize, gmAlpha, gmRot);
    }
  } else if ((isBoss || isBerserker) && !isJotunn) {
    const flakeCount = isBoss ? 6 : 3;
    for (let fl = 0; fl < flakeCount; fl++) {
      const flPhase = (nowMs * 0.0015 + fl * 1.8 + seed) % (Math.PI * 2);
      const flDist = 24 + Math.sin(flPhase) * 12;
      const flAng = flPhase * 1.5 + fl;
      const flX = Math.cos(flAng) * flDist;
      const flY = Math.sin(flAng) * (flDist * 0.6) - 4;
      const flAlpha = Math.sin(flPhase) * 0.5 + 0.5;

      ctx.fillStyle = `rgba(255, 255, 255, ${flAlpha * 0.85})`;
      ctx.beginPath();
      ctx.moveTo(flX, flY - 1.5);
      ctx.lineTo(flX + 1.5, flY);
      ctx.lineTo(flX, flY + 1.5);
      ctx.lineTo(flX - 1.5, flY);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.restore(); // Root
}

export function drawFrostTroll(ctx, screenX, screenY, sSize, type, ent, isShadowPass = false) {
  if (!ent) ent = {};
  if (type && typeof type === "string") ent.type = type;
  drawFrostTrollEntity(ctx, screenX, screenY, ent, isShadowPass);
}

if (typeof window !== "undefined") {
  window.drawFrostTrollEntity = drawFrostTrollEntity;
  window.drawFrostTroll = drawFrostTroll;
  window.triggerFrostTrollDeathExplosion = triggerFrostTrollDeathExplosion;
}
