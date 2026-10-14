// spiders.js - Procedural Lineless Giant Cave Spider & Arachnid Entity Renderer
import { computeFastSeed, safeCreateRadialGradient } from './helpers.js';

/**
 * CORE DESIGN RULE: NEVER RENDER SOLID SHADOW CIRCLES
 * Never draw solid or flat circle/ellipse ground shadows beneath monsters.
 * Monsters must never have baked-in dark circular shapes emulating ground shadows.
 * All artificial solid ground shadow discs are strictly prohibited.
 */

/**
 * Triggers an arachnid death explosion with severed multi-jointed chitin legs,
 * bursting toxic venom ichor, silk filaments, and skittering spiderlings.
 * @param {Object} ce - Entity state object
 */
export function triggerSpiderDeathExplosion(ce) {
  if (!ce || ce._spiderExploded) return;
  ce._spiderExploded = true;

  const type = (ce.type || "spider").toLowerCase();
  const isBoss = type.startsWith("boss_") || type.includes("broodmother") || type.includes("weaver");
  const isCrystal = type.includes("crystal") || type.includes("weaver");
  const isStalker = type.includes("stalker") || (type.includes("void") && !isCrystal && !type.includes("broodmother"));
  const isVoid = isStalker || type.includes("void");

  const legColor = isCrystal ? "#c084fc" : isStalker ? "#0a0316" : isVoid ? "#312e81" : "#1e293b";
  const legAccent = isCrystal ? "#f0abfc" : isStalker ? "#00f0ff" : isVoid ? "#4338ca" : "#334155";
  const ichorColors = isCrystal
    ? ["#e879f9", "#c084fc", "#a855f7", "#ffffff"]
    : isStalker
    ? ["#00f0ff", "#38bdf8", "#c084fc", "#e879f9", "#d946ef", "#ffffff"]
    : isVoid
    ? ["#6366f1", "#4f46e5", "#818cf8", "#c084fc"]
    : ["#84cc16", "#a3e635", "#4d7c0f", "#22c55e", "#15803d"];

  if (typeof spawnParticle === "function") {
    if (isStalker) {
      // 1. Severed Void Scythe Legs flying outward in radial burst
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const speed = 125 + Math.random() * 150;
        spawnParticle({
          x: ce.x + Math.cos(angle) * 8,
          y: ce.y + Math.sin(angle) * 6,
          vx: Math.cos(angle) * speed,
          vy: -85 - Math.random() * 120,
          color: "#0a0316",
          accentColor: "#00f0ff",
          size: 7.5,
          maxLife: 2.3,
          drag: 0.94,
          style: "wolf_leg",
          gravity: 220,
          shrink: true,
        });
      }

      // 2. Shattered Obsidian Carapace Shards
      for (let s = 0; s < 6; s++) {
        const angle = (s / 6) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        const speed = 90 + Math.random() * 140;
        spawnParticle({
          x: ce.x + Math.cos(angle) * 8,
          y: ce.y + Math.sin(angle) * 8,
          vx: Math.cos(angle) * speed,
          vy: -90 - Math.random() * 110,
          color: "#05020c",
          accentColor: "#c084fc",
          size: 7,
          maxLife: 2.0,
          drag: 0.94,
          style: "wolf_head",
          gravity: 210,
          shrink: true,
        });
      }

      // 3. Cosmic Nova Spark Motes & Void Lightning Sparks
      for (let m = 0; m < 42; m++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 55 + Math.random() * 220;
        spawnParticle({
          x: ce.x + (Math.random() - 0.5) * 12,
          y: ce.y + (Math.random() - 0.5) * 12,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 35,
          color: ichorColors,
          size: 2.2 + Math.random() * 3.8,
          maxLife: 1.3 + Math.random() * 0.8,
          drag: 0.92,
          gravity: 65,
          shrink: true,
          style: "circle",
        });
      }

      // 4. Central Collapsed Singularity Implosion Pulse
      spawnParticle({
        x: ce.x,
        y: ce.y,
        vx: 0,
        vy: -15,
        color: "#00f0ff",
        size: 22,
        maxLife: 0.65,
        drag: 0.88,
        gravity: 0,
        shrink: true,
        style: "circle",
      });

      // 5. Drifting Ethereal Shadow Mist Wisps
      for (let s = 0; s < 10; s++) {
        spawnParticle({
          x: ce.x + (Math.random() - 0.5) * 14,
          y: ce.y + (Math.random() - 0.5) * 14,
          vx: (Math.random() - 0.5) * 60,
          vy: -35 - Math.random() * 60,
          color: ["#1e0836", "#3b0764", "#4c1d95", "#0f051d"],
          size: 3.5 + Math.random() * 2.5,
          maxLife: 1.6,
          drag: 0.96,
          gravity: -25,
          shrink: true,
          style: "circle",
        });
      }
      return;
    }
    // 8 Severed Chitinous Legs flying outward in radial directions
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = 110 + Math.random() * 140;
      spawnParticle({
        x: ce.x + Math.cos(angle) * 8,
        y: ce.y + Math.sin(angle) * 6,
        vx: Math.cos(angle) * speed,
        vy: -70 - Math.random() * 110,
        color: legColor,
        accentColor: legAccent,
        size: isBoss ? 9 : 6.5,
        maxLife: 2.2,
        drag: 0.94,
        style: "wolf_leg",
        gravity: 240,
        shrink: true,
      });
    }

    // Abdomen rupture pieces
    for (let p = 0; p < 6; p++) {
      spawnParticle({
        x: ce.x + (Math.random() - 0.5) * 14,
        y: ce.y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 160,
        vy: -90 - Math.random() * 100,
        color: legColor,
        accentColor: legAccent,
        size: isBoss ? 11 : 7,
        maxLife: 1.8,
        drag: 0.93,
        style: "wolf_head",
        gravity: 220,
        shrink: true,
      });
    }

    // Splattering toxic venom & ichor droplets
    const dropletCount = isBoss ? 45 : 28;
    for (let b = 0; b < dropletCount; b++) {
      spawnParticle({
        x: ce.x + (Math.random() - 0.5) * 16,
        y: ce.y + (Math.random() - 0.5) * 12,
        vx: (Math.random() - 0.5) * 190,
        vy: -50 - Math.random() * 130,
        color: ichorColors,
        size: 2.2 + Math.random() * 3.8,
        maxLife: 1.1 + Math.random() * 0.7,
        drag: 0.92,
        gravity: 170,
        style: "circle",
      });
    }

    // Drifting silk wisps
    for (let s = 0; s < 8; s++) {
      spawnParticle({
        x: ce.x + (Math.random() - 0.5) * 10,
        y: ce.y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 70,
        vy: -30 - Math.random() * 50,
        color: ["#f8fafc", "#e2e8f0", "#cbd5e1"],
        size: 1.8,
        maxLife: 1.4,
        drag: 0.97,
        gravity: -15, // float gently upwards
        style: "circle",
      });
    }
  }
}

/**
 * Procedural Lineless Giant Cave Spider Entity Renderer
 * Features:
 * - 8 Articulated Inverse-Kinematic legs with Coxa, Femur, Tibia, and Tarsus claws
 * - Alternating tetrapod gait (true arachnid locomotion mechanics)
 * - Volumetric lineless prosoma (carapace) and opisthosoma (abdomen) with breathing hydraulic pulsation
 * - Chelicerae with dripping toxic acid/venom droplets
 * - Articulated pedipalps probing and threat-rearing
 * - 8 glowing predatory ocelli arranged in authentic ocular pattern
 * - Directional 3D depth sorting and continuous facing angle rotation
 * - Dynamic combat animations (threat rear, fang strike, venom spit recoil)
 * - Pure lineless rendering (0 solid ground shadow discs)
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x - Center X
 * @param {number} y - Center Y
 * @param {Object} ent - Entity state object
 * @param {boolean} isShadowPass - Shadow pass flag (strictly prohibited from drawing shadows)
 */
export function drawSpiderEntity(ctx, x, y, ent, isShadowPass = false) {
  if (isShadowPass) return;
  if (!ent) ent = {};

  const type = (ent.type || "giant_cave_spider").toLowerCase();
  const facingAngle = (typeof ent.facingAngle === "number" && !isNaN(ent.facingAngle)) ? ent.facingAngle : 0;
  const isMoving = !!(ent.moving || ent.isMoving);
  const isSlowed = !!ent.isSlowed;

  if (ent._seed === undefined) {
    ent._seed = computeFastSeed(ent.id || "spider_entity");
  }
  const seed = ent._seed;
  const nowMs = typeof performance !== "undefined" ? performance.now() : Date.now();

  // Attack and Cast State Detection
  let isAttacking = !!(ent.isAttacking || ent.currentCast);
  let attackProgress = 0;
  if (isAttacking) {
    let animStart = ent.attackStart || ent.lastAttackTime || ent.attackTime || nowMs;
    if (ent.currentCast && ent.currentCast.startTime) {
      animStart = ent.currentCast.startTime;
    }
    const duration = (ent.currentCast && ent.currentCast.duration) ? ent.currentCast.duration : 450;
    attackProgress = Math.min(1.0, Math.max(0, (nowMs - animStart) / duration));
  }

  // Hit Flash & Knockback Handling
  let kbX = 0;
  let kbY = 0;
  let isFlashing = false;
  let flashAmt = 0;

  if (ent.lastHitTime && (nowMs - ent.lastHitTime < 160)) {
    isFlashing = true;
    flashAmt = Math.max(0, 1 - (nowMs - ent.lastHitTime) / 160);
  }

  // Visual Archetypes & Palettes
  const isBoss = type.startsWith("boss_") || type.includes("broodmother") || type.includes("weaver");
  const isCrystal = type.includes("crystal") || type.includes("weaver");
  const isBroodmother = type.includes("broodmother");
  const isTarantula = type.includes("tarantula");
  const isStalker = type.includes("stalker") || (type.includes("void") && !isCrystal && !isBroodmother);
  const isVoid = isStalker || type.includes("void") || type.includes("shadow");

  // Volumetric Color Palettes (Pure Lineless Digital Shading)
  let p = {
    carapaceGrad0: "#334155", // Prosoma highlights
    carapaceGrad1: "#1e293b", // Prosoma midtone
    carapaceGrad2: "#0f172a", // Prosoma shadow
    carapaceSpecular: "rgba(148, 163, 184, 0.45)",

    abdoGrad0: "#384556",     // Opisthosoma upper highlight
    abdoGrad1: "#1e293b",     // Opisthosoma primary body
    abdoGrad2: "#090d16",     // Opisthosoma deep underbelly
    abdoMarking: "#64748b",   // Tergite plates / dorsal grooves
    abdoMarkingGlow: "#22c55e",

    legFemurGrad0: "#475569", // Upper leg highlight
    legFemurGrad1: "#1e293b", // Upper leg base
    legTibiaGrad0: "#334155", // Lower leg
    legTibiaGrad1: "#0f172a",
    legClaw: "#020617",       // Sharp tarsus claw tip
    legJointSpur: "#64748b",  // Patella knee spur

    chelicerae0: "#334155",
    chelicerae1: "#0f172a",
    fangColor: "#090d16",
    fangGlint: "#cbd5e1",
    venomColor: "#84cc16",
    venomGlow: "rgba(132, 204, 22, 0.7)",

    eyeCore: "#22c55e",       // Bioluminescent Emerald Cave Eyes
    eyeGlow: "rgba(34, 197, 94, 0.8)",
    eyeSpecular: "#ffffff",

    auraColor: "rgba(34, 197, 94, 0.25)"
  };

  if (isCrystal) {
    p = {
      carapaceGrad0: "#c084fc",
      carapaceGrad1: "#7e22ce",
      carapaceGrad2: "#3b0764",
      carapaceSpecular: "rgba(245, 208, 254, 0.75)",

      abdoGrad0: "#e879f9",
      abdoGrad1: "#9333ea",
      abdoGrad2: "#2e1065",
      abdoMarking: "#f0abfc",
      abdoMarkingGlow: "#e879f9",

      legFemurGrad0: "#d8b4fe",
      legFemurGrad1: "#6b21a8",
      legTibiaGrad0: "#a855f7",
      legTibiaGrad1: "#3b0764",
      legClaw: "#2e1065",
      legJointSpur: "#f5d0fe",

      chelicerae0: "#7e22ce",
      chelicerae1: "#3b0764",
      fangColor: "#f0abfc",
      fangGlint: "#ffffff",
      venomColor: "#f43f5e",
      venomGlow: "rgba(244, 63, 94, 0.8)",

      eyeCore: "#f43f5e",
      eyeGlow: "rgba(244, 63, 94, 0.85)",
      eyeSpecular: "#fff1f2",

      auraColor: "rgba(192, 132, 252, 0.35)"
    };
  } else if (isBroodmother) {
    p = {
      carapaceGrad0: "#451a03",
      carapaceGrad1: "#271004",
      carapaceGrad2: "#140702",
      carapaceSpecular: "rgba(217, 119, 6, 0.4)",

      abdoGrad0: "#78350f",
      abdoGrad1: "#361605",
      abdoGrad2: "#0f0501",
      abdoMarking: "#b45309",
      abdoMarkingGlow: "#f59e0b",

      legFemurGrad0: "#572407",
      legFemurGrad1: "#240d02",
      legTibiaGrad0: "#361605",
      legTibiaGrad1: "#140702",
      legClaw: "#0a0301",
      legJointSpur: "#92400e",

      chelicerae0: "#451a03",
      chelicerae1: "#170802",
      fangColor: "#0d0401",
      fangGlint: "#fef3c7",
      venomColor: "#eab308",
      venomGlow: "rgba(234, 179, 8, 0.75)",

      eyeCore: "#dc2626",
      eyeGlow: "rgba(220, 38, 38, 0.85)",
      eyeSpecular: "#fee2e2",

      auraColor: "rgba(217, 119, 6, 0.3)"
    };
  } else if (isTarantula) {
    p = {
      carapaceGrad0: "#3f3f46",
      carapaceGrad1: "#27272a",
      carapaceGrad2: "#09090b",
      carapaceSpecular: "rgba(161, 161, 170, 0.4)",

      abdoGrad0: "#52525b",
      abdoGrad1: "#27272a",
      abdoGrad2: "#09090b",
      abdoMarking: "#ea580c",
      abdoMarkingGlow: "#f97316",

      legFemurGrad0: "#52525b",
      legFemurGrad1: "#27272a",
      legTibiaGrad0: "#3f3f46",
      legTibiaGrad1: "#18181b",
      legClaw: "#000000",
      legJointSpur: "#ea580c",

      chelicerae0: "#3f3f46",
      chelicerae1: "#18181b",
      fangColor: "#09090b",
      fangGlint: "#f4f4f5",
      venomColor: "#f97316",
      venomGlow: "rgba(249, 115, 22, 0.7)",

      eyeCore: "#f59e0b",
      eyeGlow: "rgba(245, 158, 11, 0.85)",
      eyeSpecular: "#ffffff",

      auraColor: "rgba(234, 88, 12, 0.25)"
    };
  } else if (isStalker || isVoid) {
    p = {
      carapaceGrad0: "#3b156b", // spectral amethyst highlight
      carapaceGrad1: "#16082f", // abyssal violet midtone
      carapaceGrad2: "#05020c", // pitch obsidian void shadow
      carapaceSpecular: "rgba(192, 132, 252, 0.8)",

      abdoGrad0: "#4c1d95",     // deep void purple
      abdoGrad1: "#1e0836",     // cosmic event horizon
      abdoGrad2: "#030008",     // abyss core
      abdoMarking: "#c084fc",
      abdoMarkingGlow: "#00f0ff",

      legFemurGrad0: "#581c87", // upper leg abyssal violet
      legFemurGrad1: "#1e0836",
      legTibiaGrad0: "#3b0764", // lower leg
      legTibiaGrad1: "#090214",
      legClaw: "#020006",       // razor obsidian scythe blade
      legJointSpur: "#00f0ff",  // glowing cyan astral crystals

      chelicerae0: "#312e81",
      chelicerae1: "#0a0316",
      fangColor: "#05010d",
      fangGlint: "#38bdf8",     // cyan glint
      venomColor: "#00f0ff",    // celestial plasma venom
      venomGlow: "rgba(0, 240, 255, 0.9)",

      eyeCore: "#00f0ff",       // piercing cyan predatory eyes
      eyeGlow: "rgba(0, 240, 255, 0.95)",
      eyeSpecular: "#ffffff",

      auraColor: "rgba(168, 85, 247, 0.35)",
      runeGlow: "#e879f9",
      voidPhotonRing: "rgba(0, 240, 255, 0.7)"
    };
  }

  // Kinematic Cycle & Walking Phase
  const speedFactor = isSlowed ? 0.45 : 1.0;
  const walkSpeed = 0.011 * speedFactor;
  const walkPhase = isMoving ? (nowMs * walkSpeed + seed) % (Math.PI * 2) : 0;
  const idleBreathe = Math.sin(nowMs * 0.0035 + seed) * 1.2;
  const palpTwitch = Math.sin(nowMs * 0.008 + seed * 2) * 1.5;

  // Elastic Squash & Stretch on Movement / Damage Flash
  let squashX = 1;
  let squashY = 1;
  if (isFlashing) {
    const elasticHit = Math.sin(flashAmt * Math.PI) * 0.24;
    squashY = 1 - elasticHit;
    squashX = 1 + elasticHit;
  } else if (isMoving) {
    const scuttleSquash = Math.sin(walkPhase * 2) * 0.04;
    squashX = 1 + scuttleSquash;
    squashY = 1 - scuttleSquash;
  }

  // Attack Animation Kinetics (Threat display rear-up -> Forward lunge strike -> Recovery)
  let atkLungeY = 0;
  let atkRearAngle = 0;
  let fangSpread = 0;
  let venomDripDrop = 0;

  if (isAttacking) {
    if (attackProgress < 0.35) {
      // Phase 1: Threat Display / Rearing Back
      const t = attackProgress / 0.35;
      atkLungeY = -Math.sin(t * Math.PI * 0.5) * 6;
      atkRearAngle = -0.18 * Math.sin(t * Math.PI * 0.5);
      fangSpread = t * 4;
    } else if (attackProgress < 0.65) {
      // Phase 2: Violent Forward Fang Snap & Venom Strike
      const t = (attackProgress - 0.35) / 0.3;
      atkLungeY = 12 * Math.sin(t * Math.PI);
      atkRearAngle = 0.12 * Math.sin(t * Math.PI);
      fangSpread = 4 * (1 - t * 0.8);
      venomDripDrop = t * 14;
    } else {
      // Phase 3: Recoil & Settle
      const t = (attackProgress - 0.65) / 0.35;
      atkLungeY = (1 - t) * 3;
      atkRearAngle = (1 - t) * 0.04;
      fangSpread = (1 - t) * 1.5;
    }
  }

  // Base Scale of the Giant Spider
  const baseScale = isBoss ? 2.5 : isBroodmother ? 2.3 : isStalker ? 2.25 : isTarantula ? 2.15 : 2.0;

  ctx.save();
  ctx.translate(x + kbX, y + kbY);

  if (isFlashing) {
    ctx.filter = `brightness(${1 + flashAmt * 1.6}) contrast(${1 + flashAmt * 0.6})`;
  }

  ctx.scale(baseScale * squashX, baseScale * squashY);

  // Rotate to entity facing direction (aligning head along facing vector)
  // Spider default orientation: facing downwards (towards positive Y) when angle = 0
  ctx.rotate(facingAngle);

  // Subtle body vertical bobbing while scuttling or breathing
  const bodyBob = isMoving ? Math.abs(Math.sin(walkPhase)) * 1.8 : idleBreathe * 0.6;
  ctx.translate(0, bodyBob + atkLungeY);

  // -------------------------------------------------------------
  // 1. BOSS & VOID STALKER AURA GLOW (Atmospheric bioluminescence, strictly NO solid ground shadow)
  // -------------------------------------------------------------
  if (isStalker) {
    // Cosmic Event Horizon Aura & Gravitational Lensing
    const stalkerPulse = Math.sin(nowMs * 0.0035 + seed) * 0.2 + 0.8;
    const auraR = 48 * stalkerPulse;
    const voidAura = safeCreateRadialGradient(ctx, 0, 0, 6, 0, 0, auraR);
    if (voidAura) {
      voidAura.addColorStop(0, "rgba(217, 70, 239, 0.32)");
      voidAura.addColorStop(0.35, "rgba(59, 7, 100, 0.22)");
      voidAura.addColorStop(0.7, "rgba(6, 182, 212, 0.12)");
      voidAura.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = voidAura;
      ctx.beginPath();
      ctx.arc(0, 0, auraR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Expanding Gravitational Lensing Ring
    ctx.save();
    const ringPhase = ((nowMs * 0.0016 + seed) % 1);
    const ringR = 26 + ringPhase * 26;
    const ringAlpha = (1 - ringPhase) * 0.35;
    ctx.strokeStyle = `rgba(0, 240, 255, ${ringAlpha})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, ringR, ringR * 0.72, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Void Shockwave Ring during Phase-Strike
    if (isAttacking && attackProgress >= 0.32 && attackProgress <= 0.75) {
      const swP = (attackProgress - 0.32) / 0.43;
      const swR = 12 + swP * 46;
      const swAlpha = (1 - swP) * 0.75;
      ctx.save();
      ctx.strokeStyle = `rgba(0, 240, 255, ${swAlpha})`;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(0, -6, swR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  } else if (isBoss) {
    const auraPulse = Math.sin(nowMs * 0.004) * 0.2 + 0.8;
    const auraGrad = safeCreateRadialGradient(ctx, 0, 0, 4, 0, 0, 40 * auraPulse);
    if (auraGrad) {
      auraGrad.addColorStop(0, p.auraColor);
      auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 40 * auraPulse, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // -------------------------------------------------------------
  // 2. EIGHT ARTICULATED INVERSE-KINEMATIC ARACHNID LEGS
  // 4 pairs: L1-L4 (left side) and R1-R4 (right side)
  // Walking Mechanics: Alternating Tetrapod Gait
  // Group A: L1, R2, L3, R4
  // Group B: R1, L2, R4, L3
  // -------------------------------------------------------------
  // Leg Base Config: [angleFromCenter, femurLength, tibiaLength, restSpreadX, restSpreadY]
  const legConfigs = [
    // Pair 1: Front reachers (angled forward-out)
    { side: -1, idx: 0, group: 0, rootX: -6, rootY: -6, kneeReachX: -22, kneeReachY: -18, tipReachX: -28, tipReachY: -28 },
    { side:  1, idx: 0, group: 1, rootX:  6, rootY: -6, kneeReachX:  22, kneeReachY: -18, tipReachX:  28, tipReachY: -28 },

    // Pair 2: Mid-front lateral reachers
    { side: -1, idx: 1, group: 1, rootX: -7, rootY: -2, kneeReachX: -28, kneeReachY: -7,  tipReachX: -36, tipReachY: -10 },
    { side:  1, idx: 1, group: 0, rootX:  7, rootY: -2, kneeReachX:  28, kneeReachY: -7,  tipReachX:  36, tipReachY: -10 },

    // Pair 3: Mid-back lateral reachers
    { side: -1, idx: 2, group: 0, rootX: -7, rootY:  3, kneeReachX: -27, kneeReachY:  8,  tipReachX: -35, tipReachY:  15 },
    { side:  1, idx: 2, group: 1, rootX:  7, rootY:  3, kneeReachX:  27, kneeReachY:  8,  tipReachX:  35, tipReachY:  15 },

    // Pair 4: Rear anchors (angled backward-out)
    { side: -1, idx: 3, group: 1, rootX: -6, rootY:  7, kneeReachX: -20, kneeReachY: 20,  tipReachX: -26, tipReachY:  32 },
    { side:  1, idx: 3, group: 0, rootX:  6, rootY:  7, kneeReachX:  20, kneeReachY: 20,  tipReachX:  26, tipReachY:  32 },
  ];

  // Helper to draw a single 3-segment articulated lineless leg
  function drawArticulatedLeg(legCfg) {
    const isGroupA = legCfg.group === 0;
    const phaseOffset = isGroupA ? 0 : Math.PI;
    const legPhase = (walkPhase + phaseOffset) % (Math.PI * 2);

    // Tetrapod gait kinematics
    // When swinging forward: leg lifts and steps outward/forward
    // When planted: leg pushes down and slightly back
    let stepLift = 0;
    let stepSweepX = 0;
    let stepSweepY = 0;

    if (isMoving) {
      const swingRatio = Math.sin(legPhase);
      stepLift = Math.max(0, swingRatio) * 5; // Knee lift
      stepSweepY = -Math.cos(legPhase) * 4;
      stepSweepX = legCfg.side * Math.sin(legPhase) * 2;
    } else {
      // Subtle idle arachnid twitch
      const microTwitch = Math.sin(nowMs * 0.004 + legCfg.idx * 1.5 + seed) * 0.8;
      stepSweepY = microTwitch;
    }

    // Threat Display Reaction: front pair (idx 0) rears UP high!
    if (isAttacking && legCfg.idx === 0) {
      const rearUp = Math.sin(Math.min(1, attackProgress * 2) * Math.PI) * 12;
      stepLift += rearUp * 0.8;
      stepSweepY -= rearUp * 0.9;
    }

    const rx = legCfg.rootX;
    const ry = legCfg.rootY;
    const kx = legCfg.kneeReachX + stepSweepX * 0.4;
    const ky = legCfg.kneeReachY - stepLift + stepSweepY * 0.3;
    const tx = legCfg.tipReachX + stepSweepX;
    const ty = legCfg.tipReachY + stepSweepY;

    // Segment 1: Coxa & Femur (Carapace to Knee)
    ctx.save();
    const femurGrad = ctx.createLinearGradient(rx, ry, kx, ky);
    femurGrad.addColorStop(0, p.legFemurGrad1);
    femurGrad.addColorStop(0.5, p.legFemurGrad0);
    femurGrad.addColorStop(1, p.legTibiaGrad1);

    ctx.fillStyle = femurGrad;
    ctx.beginPath();
    // Draw tapered muscular chitin segment
    const perpX = -(ky - ry);
    const perpY = (kx - rx);
    const len = Math.hypot(perpX, perpY) || 1;
    const nx = (perpX / len) * 2.2;
    const ny = (perpY / len) * 2.2;

    ctx.moveTo(rx - nx * 0.8, ry - ny * 0.8);
    ctx.lineTo(kx - nx * 0.4, ky - ny * 0.4);
    ctx.lineTo(kx + nx * 0.4, ky + ny * 0.4);
    ctx.lineTo(rx + nx * 0.8, ry + ny * 0.8);
    ctx.closePath();
    ctx.fill();

    // Femur dorsal ridge specular glint
    ctx.strokeStyle = p.carapaceSpecular;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(kx, ky);
    ctx.stroke();

    // Patella Knee Joint Bulb & Spur
    ctx.fillStyle = p.legJointSpur;
    ctx.beginPath();
    ctx.arc(kx, ky, 2.3, 0, Math.PI * 2);
    ctx.fill();

    // Knee spine spur
    const spurAngle = Math.atan2(ky - ry, kx - rx) + (legCfg.side * Math.PI * 0.5);
    ctx.fillStyle = p.legClaw;
    ctx.beginPath();
    ctx.moveTo(kx, ky);
    ctx.lineTo(kx + Math.cos(spurAngle) * 2.5, ky + Math.sin(spurAngle) * 2.5);
    ctx.lineTo(kx - nx * 0.3, ky - ny * 0.3);
    ctx.closePath();
    ctx.fill();

    // Segment 2: Tibia, Metatarsus & Tarsus (Knee to Ground Tip Claw)
    const tibiaGrad = ctx.createLinearGradient(kx, ky, tx, ty);
    tibiaGrad.addColorStop(0, p.legTibiaGrad0);
    tibiaGrad.addColorStop(0.7, p.legTibiaGrad1);
    tibiaGrad.addColorStop(1, p.legClaw);

    ctx.fillStyle = tibiaGrad;
    const tPerpX = -(ty - ky);
    const tPerpY = (tx - kx);
    const tLen = Math.hypot(tPerpX, tPerpY) || 1;
    const tnx = (tPerpX / tLen) * 1.6;
    const tny = (tPerpY / tLen) * 1.6;

    ctx.beginPath();
    ctx.moveTo(kx - tnx, ky - tny);
    ctx.lineTo(tx, ty); // Taper to sharp tip
    ctx.lineTo(kx + tnx, ky + tny);
    ctx.closePath();
    ctx.fill();

    // Sharp Tarsus Claw / Razor Void Scythe Blade
    if (isStalker) {
      // Curved Razor Void Scythe Blade with Astral Edge
      ctx.strokeStyle = "#00f0ff";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(kx, ky);
      ctx.quadraticCurveTo(tx + (legCfg.side * 3.5), ty - 1.5, tx, ty);
      ctx.stroke();

      ctx.fillStyle = "#00f0ff";
      ctx.beginPath();
      ctx.arc(tx, ty, 1.6, 0, Math.PI * 2);
      ctx.fill();

      // Dimensional Phase Trail when moving or attacking
      if (isMoving || isAttacking) {
        ctx.strokeStyle = "rgba(0, 240, 255, 0.4)";
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx + (stepSweepX * -1.5), ty + (stepSweepY * -1.5));
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = p.legClaw;
      ctx.beginPath();
      ctx.arc(tx, ty, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Draw Rear and Mid Legs First (Behind Abdomen Z-Layer)
  for (let i = 2; i < legConfigs.length; i++) {
    drawArticulatedLeg(legConfigs[i]);
  }

  // -------------------------------------------------------------
  // 3. OPISTHOSOMA (ABDOMEN) - Volumetric Lineless Spherical Mass
  // Positioned posteriorly (towards positive Y)
  // Hydraulic respiration pulsing
  // -------------------------------------------------------------
  const abdoPulse = Math.sin(nowMs * 0.003 + seed) * 0.8;
  const abdoRadiusX = (isBroodmother ? 17 : isBoss ? 16 : 13.5) + abdoPulse * 0.4;
  const abdoRadiusY = (isBroodmother ? 21 : isBoss ? 19 : 16.5) + abdoPulse * 0.6;
  const abdoCenterY = 13 + abdoPulse * 0.3;

  ctx.save();
  // Pedicel (waist connecting prosoma and opisthosoma)
  ctx.fillStyle = p.carapaceGrad2;
  ctx.beginPath();
  ctx.ellipse(0, 3, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Opisthosoma Main Mass
  const abdoGrad = safeCreateRadialGradient(
    ctx,
    0, abdoCenterY - abdoRadiusY * 0.25, 2,
    0, abdoCenterY, abdoRadiusY * 1.05
  );
  if (abdoGrad) {
    abdoGrad.addColorStop(0, p.abdoGrad0);
    abdoGrad.addColorStop(0.5, p.abdoGrad1);
    abdoGrad.addColorStop(1, p.abdoGrad2);
    ctx.fillStyle = abdoGrad;
  } else {
    ctx.fillStyle = p.abdoGrad1;
  }

  ctx.beginPath();
  ctx.ellipse(0, abdoCenterY, abdoRadiusX, abdoRadiusY, 0, 0, Math.PI * 2);
  ctx.fill();

  // Opisthosoma Tergite Plates / Segmented Dorsal Grooves
  // 5 curved transverse chitin plates with ambient shadow valleys
  for (let s = 1; s <= 4; s++) {
    const segY = abdoCenterY - abdoRadiusY * 0.55 + s * (abdoRadiusY * 0.28);
    const segWidth = Math.sin((s / 5) * Math.PI) * (abdoRadiusX * 1.5);

    // Deep shadow groove
    ctx.strokeStyle = "rgba(0, 0, 0, 0.45)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, segY - 14, segWidth * 0.7, 0.6, Math.PI - 0.6);
    ctx.stroke();

    // Subtle dorsal highlight on chitin plate lip
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.arc(0, segY - 13, segWidth * 0.68, 0.6, Math.PI - 0.6);
    ctx.stroke();
  }

  // Cave Spider Dorsal Warning Pattern / Bioluminescent Chevron Fissures
  ctx.save();
  ctx.fillStyle = p.abdoMarkingGlow;
  ctx.shadowColor = p.abdoMarkingGlow;
  ctx.shadowBlur = 6;
  ctx.globalAlpha = 0.75 + Math.sin(nowMs * 0.005 + seed) * 0.2;

  if (isCrystal) {
    // Faceted Gemstone Veins
    ctx.strokeStyle = p.abdoMarking;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, abdoCenterY - 12);
    ctx.lineTo(-7, abdoCenterY);
    ctx.lineTo(0, abdoCenterY + 12);
    ctx.lineTo(7, abdoCenterY);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, abdoCenterY - 12);
    ctx.lineTo(0, abdoCenterY + 12);
    ctx.moveTo(-7, abdoCenterY);
    ctx.lineTo(7, abdoCenterY);
    ctx.stroke();
  } else if (isBroodmother) {
    // Cluster of pulsating egg-sac nodules on abdomen
    ctx.shadowBlur = 4;
    const eggNodules = [
      { x: -5, y: abdoCenterY - 4, r: 3.5 },
      { x:  5, y: abdoCenterY - 3, r: 3.2 },
      { x:  0, y: abdoCenterY + 4, r: 4.2 },
      { x: -6, y: abdoCenterY + 6, r: 2.8 },
      { x:  6, y: abdoCenterY + 7, r: 3.0 }
    ];
    for (const egg of eggNodules) {
      const ep = Math.sin(nowMs * 0.006 + egg.x) * 0.4;
      ctx.fillStyle = "#fef08a";
      ctx.beginPath();
      ctx.arc(egg.x, egg.y, egg.r + ep, 0, Math.PI * 2);
      ctx.fill();
      // Glowing spiderling embryo inside
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.arc(egg.x, egg.y, (egg.r + ep) * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (isStalker) {
    // VOID SHADOW STALKER: Embedded Cosmic Singularity Core & Runic Astral Chevron Sigils
    const singularityR = 6.2;

    // 1. Concentric Relativistic Photon Accretion Ring
    const photonGrad = safeCreateRadialGradient(ctx, 0, abdoCenterY, singularityR * 0.4, 0, abdoCenterY, singularityR * 1.8);
    if (photonGrad) {
      photonGrad.addColorStop(0, "rgba(0, 240, 255, 0.95)");
      photonGrad.addColorStop(0.35, "rgba(217, 70, 239, 0.75)");
      photonGrad.addColorStop(0.75, "rgba(76, 29, 149, 0.3)");
      photonGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = photonGrad;
      ctx.beginPath();
      ctx.arc(0, abdoCenterY, singularityR * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Swirling Accretion Spirals & Orbiting Stardust
    ctx.save();
    ctx.translate(0, abdoCenterY);
    const spiralRot = nowMs * 0.003 + seed;
    ctx.rotate(spiralRot);
    ctx.strokeStyle = "rgba(0, 240, 255, 0.85)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let st = 0; st <= 14; st++) {
      const prog = st / 14;
      const sr = singularityR * 0.35 + prog * singularityR * 1.1;
      const stheta = prog * Math.PI * 1.2;
      const sx = Math.cos(stheta) * sr;
      const sy = Math.sin(stheta) * sr * 0.75;
      if (st === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();

    // Orbiting Cosmic Stardust Motes
    for (let m = 0; m < 3; m++) {
      const ma = (m / 3) * Math.PI * 2 + nowMs * 0.0045;
      const md = singularityR * 1.1 + Math.sin(nowMs * 0.005 + m) * 1.2;
      const mx = Math.cos(ma) * md;
      const my = Math.sin(ma) * md * 0.7;
      ctx.fillStyle = (m === 0) ? "#ffffff" : "#00f0ff";
      ctx.beginPath();
      ctx.arc(mx, my, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 3. Pitch-Black Event Horizon Void Core
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(0, abdoCenterY, singularityR * 0.65, 0, Math.PI * 2);
    ctx.fill();

    // Doppler Beaming Rim Arc
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, abdoCenterY, singularityR * 0.72, -Math.PI * 0.7, Math.PI * 0.1);
    ctx.stroke();

    // 4. Glowing Runic Astral Chevron Sigils (Above and below Singularity)
    ctx.fillStyle = "#00f0ff";
    ctx.shadowColor = "#00f0ff";
    ctx.shadowBlur = 8;

    // Upper chevron
    ctx.beginPath();
    ctx.moveTo(0, abdoCenterY - 10.5);
    ctx.lineTo(-6, abdoCenterY - 6.5);
    ctx.lineTo(-4, abdoCenterY - 5.5);
    ctx.lineTo(0, abdoCenterY - 8.5);
    ctx.lineTo(4, abdoCenterY - 5.5);
    ctx.lineTo(6, abdoCenterY - 6.5);
    ctx.closePath();
    ctx.fill();

    // Lower chevron
    ctx.fillStyle = "#e879f9";
    ctx.shadowColor = "#e879f9";
    ctx.beginPath();
    ctx.moveTo(0, abdoCenterY + 9);
    ctx.lineTo(-6, abdoCenterY + 12);
    ctx.lineTo(-4, abdoCenterY + 13);
    ctx.lineTo(0, abdoCenterY + 10.5);
    ctx.lineTo(4, abdoCenterY + 13);
    ctx.lineTo(6, abdoCenterY + 12);
    ctx.closePath();
    ctx.fill();
  } else {
    // Deep Subterranean Arachnid Fissure Chevrons (Classic Cave Predator)
    ctx.beginPath();
    // Chevron 1
    ctx.moveTo(0, abdoCenterY - 8);
    ctx.lineTo(-5, abdoCenterY - 4);
    ctx.lineTo(-3, abdoCenterY - 3);
    ctx.lineTo(0, abdoCenterY - 6);
    ctx.lineTo(3, abdoCenterY - 3);
    ctx.lineTo(5, abdoCenterY - 4);
    ctx.closePath();
    ctx.fill();

    // Chevron 2
    ctx.beginPath();
    ctx.moveTo(0, abdoCenterY - 2);
    ctx.lineTo(-6, abdoCenterY + 2);
    ctx.lineTo(-4, abdoCenterY + 3);
    ctx.lineTo(0, abdoCenterY);
    ctx.lineTo(4, abdoCenterY + 3);
    ctx.lineTo(6, abdoCenterY + 2);
    ctx.closePath();
    ctx.fill();

    // Chevron 3 (smaller)
    ctx.beginPath();
    ctx.moveTo(0, abdoCenterY + 4);
    ctx.lineTo(-4, abdoCenterY + 7);
    ctx.lineTo(-2, abdoCenterY + 8);
    ctx.lineTo(0, abdoCenterY + 6);
    ctx.lineTo(2, abdoCenterY + 8);
    ctx.lineTo(4, abdoCenterY + 7);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Spinnerets at posterior apex (Silk Glands)
  ctx.fillStyle = p.carapaceGrad2;
  ctx.beginPath();
  ctx.ellipse(-2.5, abdoCenterY + abdoRadiusY - 1, 1.8, 3, 0.2, 0, Math.PI * 2);
  ctx.ellipse( 2.5, abdoCenterY + abdoRadiusY - 1, 1.8, 3, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Ethereal Abyssal Shadow Tendrils or Drifting Silk Filament Wisps
  if (isStalker) {
    // Ethereal Abyssal Shadow Tendrils trailing smoothly behind the Stalker
    const tendrilCount = 3;
    for (let td = 0; td < tendrilCount; td++) {
      const tSide = (td === 0 ? 0 : td === 1 ? -1 : 1);
      const tWave = Math.sin(nowMs * 0.007 + td * 1.8 + seed) * (4 + (isMoving ? 3 : 0));
      const tWave2 = Math.cos(nowMs * 0.005 + td * 1.5) * 3;
      const startX = tSide * 2.5;
      const startY = abdoCenterY + abdoRadiusY;

      ctx.save();
      const tGrad = ctx.createLinearGradient(startX, startY, startX + tWave2, startY + 22);
      tGrad.addColorStop(0, "rgba(0, 240, 255, 0.75)");
      tGrad.addColorStop(0.35, "rgba(168, 85, 247, 0.5)");
      tGrad.addColorStop(0.75, "rgba(30, 8, 54, 0.3)");
      tGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.strokeStyle = tGrad;
      ctx.lineWidth = 1.8 - td * 0.3;
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(startX + tWave, startY + 10, startX + tWave2 + (tSide * 4), startY + 22);
      ctx.stroke();
      ctx.restore();
    }
  } else if (isMoving || isAttacking) {
    ctx.strokeStyle = "rgba(241, 245, 249, 0.55)";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    const silkWave = Math.sin(nowMs * 0.01 + seed) * 4;
    ctx.moveTo(0, abdoCenterY + abdoRadiusY + 1);
    ctx.quadraticCurveTo(silkWave, abdoCenterY + abdoRadiusY + 9, silkWave * 1.5, abdoCenterY + abdoRadiusY + 18);
    ctx.stroke();
  }

  ctx.restore();

  // -------------------------------------------------------------
  // 4. CEPHALOTHORAX (PROSOMA) - Armored Lineless Carapace
  // Shield-shaped carapace with fovea depression and eye turret
  // -------------------------------------------------------------
  ctx.save();
  const proGrad = safeCreateRadialGradient(ctx, 0, -6, 2, 0, -4, 13);
  if (proGrad) {
    proGrad.addColorStop(0, p.carapaceGrad0);
    proGrad.addColorStop(0.5, p.carapaceGrad1);
    proGrad.addColorStop(1, p.carapaceGrad2);
    ctx.fillStyle = proGrad;
  } else {
    ctx.fillStyle = p.carapaceGrad1;
  }

  // Draw sculpted arachnid carapace (narrowing at ocular turret, broad at center)
  ctx.beginPath();
  ctx.moveTo(0, -14); // Front ocular rostrum
  ctx.bezierCurveTo(-8, -14, -11, -8, -11, -3);
  ctx.bezierCurveTo(-11, 2, -9, 5, 0, 6); // Posterior margin
  ctx.bezierCurveTo(9, 5, 11, 2, 11, -3);
  ctx.bezierCurveTo(11, -8, 8, -14, 0, -14);
  ctx.closePath();
  ctx.fill();

  // Carapace Fovea & Radiating Furrows (Anatomical chitin depressions)
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.beginPath();
  ctx.ellipse(0, -2, 2.5, 1.4, 0, 0, Math.PI * 2); // Central fovea pit
  ctx.fill();

  ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
  ctx.lineWidth = 1.0;
  // Radial furrows towards leg bases
  ctx.beginPath();
  ctx.moveTo(-1.5, -2); ctx.lineTo(-8, -5);
  ctx.moveTo(-1.5, -2); ctx.lineTo(-9, -1);
  ctx.moveTo(-1.5, -2); ctx.lineTo(-8, 3);
  ctx.moveTo(1.5, -2);  ctx.lineTo(8, -5);
  ctx.moveTo(1.5, -2);  ctx.lineTo(9, -1);
  ctx.moveTo(1.5, -2);  ctx.lineTo(8, 3);
  ctx.stroke();

  // Dorsal Carapace Specular Edge Gleam
  ctx.strokeStyle = p.carapaceSpecular;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(0, -8, 8.5, -Math.PI * 0.8, -Math.PI * 0.2);
  ctx.stroke();

  if (isStalker) {
    // Glowing Runic Void Constellation Veins on Prosoma
    ctx.strokeStyle = "rgba(0, 240, 255, 0.75)";
    ctx.shadowColor = "rgba(0, 240, 255, 0.9)";
    ctx.shadowBlur = 6;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(0, -12); ctx.lineTo(-5, -6); ctx.lineTo(-8, 0);
    ctx.moveTo(0, -12); ctx.lineTo(5, -6); ctx.lineTo(8, 0);
    ctx.moveTo(0, -8); ctx.lineTo(0, -3);
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    const cNodes = [{ x: -5, y: -6 }, { x: -8, y: 0 }, { x: 5, y: -6 }, { x: 8, y: 0 }, { x: 0, y: -3 }];
    for (const cn of cNodes) {
      ctx.beginPath();
      ctx.arc(cn.x, cn.y, 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();

  // -------------------------------------------------------------
  // 5. ARTICULATED PEDIPALPS (Front Feeler Limbs)
  // -------------------------------------------------------------
  ctx.save();
  for (const palpSide of [-1, 1]) {
    const pTwitch = (palpSide === -1 ? palpTwitch : -palpTwitch) + (isAttacking ? -3 : 0);
    const prx = palpSide * 4.5;
    const pry = -12;
    const pkx = palpSide * 9;
    const pky = -18 + pTwitch * 0.5;
    const ptx = palpSide * 7;
    const pty = -23 + pTwitch;

    ctx.strokeStyle = p.legFemurGrad0;
    ctx.lineWidth = 2.0;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(prx, pry);
    ctx.lineTo(pkx, pky);
    ctx.lineTo(ptx, pty);
    ctx.stroke();

    // Palp sensory bulb / claw
    ctx.fillStyle = p.legClaw;
    ctx.beginPath();
    ctx.arc(ptx, pty, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // -------------------------------------------------------------
  // 6. CHELICERAE & DRIPPING VENOM FANGS
  // Positioned anteriorly at rostrum
  // -------------------------------------------------------------
  ctx.save();
  const cSpread = fangSpread;

  // Left & Right Chelicerae base
  for (const cSide of [-1, 1]) {
    const cx = cSide * (3.8 + cSpread * 0.4);
    const cy = -13;

    // Heavy chitin chelicera block
    const chelGrad = ctx.createLinearGradient(cx, cy, cx + cSide * 2, cy - 6);
    chelGrad.addColorStop(0, p.chelicerae0);
    chelGrad.addColorStop(1, p.chelicerae1);
    ctx.fillStyle = chelGrad;

    ctx.beginPath();
    ctx.moveTo(cx - cSide * 2.2, cy);
    ctx.lineTo(cx + cSide * 2.8, cy);
    ctx.lineTo(cx + cSide * 1.5, cy - 7);
    ctx.lineTo(cx - cSide * 1.5, cy - 7);
    ctx.closePath();
    ctx.fill();

    // Curved Piercing Venom Fang
    ctx.fillStyle = p.fangColor;
    ctx.beginPath();
    ctx.moveTo(cx + cSide * 1.2, cy - 7);
    // Curve inward towards center
    ctx.quadraticCurveTo(cx + cSide * 3.5 + (cSide * cSpread), cy - 13, cx - cSide * 1.2, cy - 15);
    ctx.quadraticCurveTo(cx + cSide * 0.5, cy - 11, cx - cSide * 0.8, cy - 7);
    ctx.closePath();
    ctx.fill();

    // Fang Sharp Needle Specular Glint
    ctx.strokeStyle = p.fangGlint;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(cx + cSide * 1.8, cy - 8);
    ctx.quadraticCurveTo(cx + cSide * 2.8, cy - 12, cx - cSide * 1.2, cy - 15);
    ctx.stroke();

    // Electric Cyan Core Needle inside obsidian fang for Void Stalker
    if (isStalker) {
      ctx.strokeStyle = "#00f0ff";
      ctx.shadowColor = "rgba(0, 240, 255, 0.9)";
      ctx.shadowBlur = 5;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(cx + cSide * 1.5, cy - 8);
      ctx.quadraticCurveTo(cx + cSide * 2.2, cy - 12, cx - cSide * 1.2, cy - 15);
      ctx.stroke();
    }

    // Dripping Acid / Venom Droplet
    const dripCycle = (nowMs * 0.005 + seed * 2 + (cSide === 1 ? 2 : 0)) % 1;
    const dripY = -15 - dripCycle * 5 - venomDripDrop;
    const dripAlpha = Math.max(0, 1 - dripCycle);

    ctx.fillStyle = p.venomColor;
    ctx.shadowColor = p.venomGlow;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(cx - cSide * 1.2, -15, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Falling droplet
    if (dripCycle > 0.3) {
      ctx.globalAlpha = dripAlpha;
      ctx.beginPath();
      ctx.arc(cx - cSide * 1.2, dripY, 1.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }
  }
  ctx.restore();

  // -------------------------------------------------------------
  // 7. OCULAR TURRET & 8 GLOWING ARACHNID OCELLI
  // Authentic Arachnid Arrangement:
  // Anterior Median Eyes (AME) - large central hunters
  // Anterior Lateral Eyes (ALE) - forward-side sensors
  // Posterior Median Eyes (PME) - dorsal crown
  // Posterior Lateral Eyes (PLE) - wide angle panoramic
  // -------------------------------------------------------------
  ctx.save();
  const eyeTurretY = -10.5;

  // Dark ocular mound
  ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
  ctx.beginPath();
  ctx.ellipse(0, eyeTurretY, 6.2, 3.8, 0, 0, Math.PI * 2);
  ctx.fill();

  const eyeList = [
    // AME (Anterior Median: 2 large central eyes)
    { x: -1.8, y: eyeTurretY - 1.8, r: 1.8, glow: 5 },
    { x:  1.8, y: eyeTurretY - 1.8, r: 1.8, glow: 5 },

    // ALE (Anterior Lateral: 2 side eyes)
    { x: -4.3, y: eyeTurretY - 1.1, r: 1.3, glow: 3 },
    { x:  4.3, y: eyeTurretY - 1.1, r: 1.3, glow: 3 },

    // PME (Posterior Median: 2 upper eyes)
    { x: -1.6, y: eyeTurretY + 1.2, r: 1.2, glow: 3 },
    { x:  1.6, y: eyeTurretY + 1.2, r: 1.2, glow: 3 },

    // PLE (Posterior Lateral: 2 rear outer eyes)
    { x: -4.1, y: eyeTurretY + 1.4, r: 1.1, glow: 3 },
    { x:  4.1, y: eyeTurretY + 1.4, r: 1.1, glow: 3 },
  ];

  const eyeGlowPulse = Math.sin(nowMs * 0.006 + seed) * 0.2 + 0.8;
  const attackEyeBoost = isAttacking ? (isStalker ? 2.4 : 1.6) : 1.0;

  for (let eIdx = 0; eIdx < eyeList.length; eIdx++) {
    const eye = eyeList[eIdx];
    // Outer Eerie Bioluminescent Halo
    ctx.shadowColor = p.eyeGlow;
    ctx.shadowBlur = eye.glow * eyeGlowPulse * attackEyeBoost;
    ctx.fillStyle = p.eyeCore;

    ctx.beginPath();
    ctx.arc(eye.x, eye.y, eye.r, 0, Math.PI * 2);
    ctx.fill();

    // For isStalker, draw vertical predatory slit pupils inside central hunter eyes (AME)
    if (isStalker && (eIdx === 0 || eIdx === 1)) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.ellipse(eye.x, eye.y, eye.r * 0.3, eye.r * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // High Specular Reflex Pinpoint (Menacing Predatory Gleam)
    ctx.shadowBlur = 0;
    ctx.fillStyle = p.eyeSpecular;
    ctx.beginPath();
    ctx.arc(eye.x - eye.r * 0.25, eye.y - eye.r * 0.25, eye.r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // -------------------------------------------------------------
  // 8. FOREGROUND LEGS (Front Pairs L1, R1, L2, R2)
  // Drawn after Prosoma to layer cleanly in front
  // -------------------------------------------------------------
  for (let i = 0; i < 2; i++) {
    drawArticulatedLeg(legConfigs[i]);
  }

  // -------------------------------------------------------------
  // 9. BOSS CROWN / TROPHY HORN EMBLEM (For Boss Tier)
  // -------------------------------------------------------------
  if (isBoss) {
    ctx.save();
    ctx.translate(0, -18);
    const crownPulse = Math.sin(nowMs * 0.005) * 1.5;

    // Glowing Subterranean Brood Crown Spikes
    ctx.fillStyle = isCrystal ? "#f0abfc" : "#f59e0b";
    ctx.shadowColor = isCrystal ? "#c084fc" : "#fbbf24";
    ctx.shadowBlur = 8;

    ctx.beginPath();
    ctx.moveTo(-8, 3);
    ctx.lineTo(-11, -5 + crownPulse);
    ctx.lineTo(-5, -1);
    ctx.lineTo(0, -9 + crownPulse * 1.2);
    ctx.lineTo(5, -1);
    ctx.lineTo(11, -5 + crownPulse);
    ctx.lineTo(8, 3);
    ctx.closePath();
    ctx.fill();

    // Central Radiant Gem Nucleus
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(0, -2, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  ctx.restore();
}

if (typeof window !== "undefined") {
  window.drawSpiderEntity = drawSpiderEntity;
  window.triggerSpiderDeathExplosion = triggerSpiderDeathExplosion;
}
