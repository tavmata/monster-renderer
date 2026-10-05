// trolls.js - Procedural 8-Directional Segmented Frost Troll Entity Renderer
import { computeFastSeed, safeCreateRadialGradient } from './helpers.js';

/**
 * Procedural 8-Directional Segmented Frost Troll Entity Renderer
 * Complies with Goblin anatomical body system architecture and pure lineless standards:
 * - 8-Directional Octagonal Matrix (E, SE, S, SW, W, NW, N, NE) with 5 distinct view perspectives
 * - Dual-arm stance with dynamic depth sorting (Z-ordering)
 * - Knuckle-walking gait with digitigrade hind legs and snow kick-up kinetics
 * - 4-Phase Glacial Slam combat animation (squash windup, lunge stretch, ground slam shockwaves, recovery)
 * - Pure lineless digital painting: 0 vector strokes, 100% volumetric gradients, rim lighting, and specular glints
 * - Invariant spatial weak point mapping (head at Y ≈ -9px on r=26)
 */
export function drawFrostTrollEntity(ctx, x, y, ent, isShadowPass = false) {
  if (!ent) ent = {};
  const type = ent.type || "frost_troll";
  const isSlowed = !!ent.isSlowed;
  const facingAngle = ent.facingAngle || 0;
  const moving = !!(ent.moving || ent.isMoving);

  if (ent._seed === undefined) {
    const id = ent.id || ("troll_" + Math.round(x) + "_" + Math.round(y));
    ent._seed = typeof computeFastSeed === "function" ? computeFastSeed(id) : 42;
  }
  const seed = ent._seed;

  // Attack state detection
  let isAttacking = !!(ent.isAttacking || ent.currentCast);
  const nowMs = typeof performance !== "undefined" ? performance.now() : Date.now();
  if (!isAttacking && typeof GameState !== "undefined" && GameState.combatAnimations && ent && ent.id) {
    for (let i = 0; i < GameState.combatAnimations.length; i++) {
      const anim = GameState.combatAnimations[i];
      const dur = anim.duration || anim.durationMs || 450;
      if (anim.attackerId === ent.id && nowMs - anim.createdAt < dur) {
        isAttacking = true;
        break;
      }
    }
  }

  const isBoss = type.startsWith("boss_") || type.includes("giant");
  const scale = isBoss ? 1.85 : 1.0;
  const r = 26;

  // -------------------------------------------------------------
  // 8-Direction Mathematical Sector Mapping
  // 0: E, 1: SE, 2: S, 3: SW, 4: W, 5: NW, 6: N, 7: NE
  // -------------------------------------------------------------
  const normAngle = ((facingAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const dirIndex = Math.floor(((normAngle + Math.PI / 8) % (Math.PI * 2)) / (Math.PI / 4));

  // True 3D Anatomical Octagonal Matrix with Dynamic Z-Depth Sorting
  const octagonalMatrix = [
    // 0: East (E) - Side Profile facing Right (Right arm far side = behind, Left arm near side = front)
    {
      dir: "E", view: "side", flip: 1, tilt: 0.12,
      headX: 7.5, headY: -8.0,
      rightArmX: -4.0, rightArmY: 2.0, rightArmFront: false,
      leftArmX: 9.0, leftArmY: 6.0, leftArmFront: true,
      hindLegNearX: -4.0, hindLegFarX: -11.0
    },
    // 1: South-East (SE) - 3/4 Front facing Down-Right (Right arm far side = behind, Left arm near side = front)
    {
      dir: "SE", view: "front_diag", flip: 1, tilt: 0.06,
      headX: 5.0, headY: -8.8,
      rightArmX: -13.0, rightArmY: 4.0, rightArmFront: false,
      leftArmX: 15.0, leftArmY: 7.5, leftArmFront: true,
      hindLegNearX: 6.0, hindLegFarX: -8.0
    },
    // 2: South (S) - Direct Front facing Camera (Both arms in foreground)
    {
      dir: "S", view: "front", flip: 1, tilt: 0.00,
      headX: 0.0, headY: -9.1,
      rightArmX: -17.0, rightArmY: 6.0, rightArmFront: true,
      leftArmX: 17.0, leftArmY: 6.0, leftArmFront: true,
      hindLegNearX: 10.0, hindLegFarX: -10.0
    },
    // 3: South-West (SW) - 3/4 Front facing Down-Left (Right arm near side = front, Left arm far side = behind)
    {
      dir: "SW", view: "front_diag", flip: -1, tilt: -0.06,
      headX: -5.0, headY: -8.8,
      rightArmX: -15.0, rightArmY: 7.5, rightArmFront: true,
      leftArmX: 13.0, leftArmY: 4.0, leftArmFront: false,
      hindLegNearX: -6.0, hindLegFarX: 8.0
    },
    // 4: West (W) - Side Profile facing Left (Right arm near side = front, Left arm far side = behind)
    {
      dir: "W", view: "side", flip: -1, tilt: -0.12,
      headX: -7.5, headY: -8.0,
      rightArmX: -9.0, rightArmY: 6.0, rightArmFront: true,
      leftArmX: 4.0, leftArmY: 2.0, leftArmFront: false,
      hindLegNearX: 4.0, hindLegFarX: 11.0
    },
    // 5: North-West (NW) - 3/4 Back facing Up-Left (Right arm near side = front, Left arm far side = behind)
    {
      dir: "NW", view: "back_diag", flip: -1, tilt: -0.06,
      headX: -4.0, headY: -10.5,
      rightArmX: -15.0, rightArmY: 3.0, rightArmFront: true,
      leftArmX: 11.0, leftArmY: 0.5, leftArmFront: false,
      hindLegNearX: -8.0, hindLegFarX: 7.0
    },
    // 6: North (N) - Direct Back facing Up (Both arms in background)
    {
      dir: "N", view: "back", flip: 1, tilt: 0.00,
      headX: 0.0, headY: -11.0,
      rightArmX: -16.0, rightArmY: 2.0, rightArmFront: false,
      leftArmX: 16.0, leftArmY: 2.0, leftArmFront: false,
      hindLegNearX: 9.0, hindLegFarX: -9.0
    },
    // 7: North-East (NE) - 3/4 Back facing Up-Right (Right arm far side = behind, Left arm near side = front)
    {
      dir: "NE", view: "back_diag", flip: 1, tilt: 0.06,
      headX: 4.0, headY: -10.5,
      rightArmX: -11.0, rightArmY: 0.5, rightArmFront: false,
      leftArmX: 15.0, leftArmY: 3.0, leftArmFront: true,
      hindLegNearX: 8.0, hindLegFarX: -7.0
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
  const walkSpeedMult = 0.008;
  const walkPhase = (nowMs * walkSpeedMult * speedFactor + seed) % (Math.PI * 2);
  const breathCycle = Math.sin(nowMs * 0.0035 + seed) * 1.5;

  const bounce = moving ? Math.abs(Math.sin(walkPhase)) * 3.2 : breathCycle;
  const strideSwing = moving ? Math.sin(walkPhase) * 6.0 : 0;

  // 4-Phase Glacial Slam Progress
  let attackProgress = 0;
  if (isAttacking) {
    let animStart = ent.attackStart || ent.lastAttackTime || ent.attackTime || nowMs;
    if (typeof GameState !== "undefined" && GameState.combatAnimations) {
      for (let i = 0; i < GameState.combatAnimations.length; i++) {
        if (GameState.combatAnimations[i].attackerId === ent.id) {
          animStart = GameState.combatAnimations[i].createdAt;
          break;
        }
      }
    }
    attackProgress = Math.min(1.0, Math.max(0, (nowMs - animStart) / 460));
  }

  // Directional Attack Lunge Vector & Squash/Stretch
  let lungeX = 0;
  let lungeY = 0;
  let squashX = 1;
  let squashY = 1;
  const atkDirX = Math.cos(facingAngle);
  const atkDirY = Math.sin(facingAngle);

  if (moving) {
    squashY = 1 - Math.abs(Math.sin(walkPhase)) * 0.06;
    squashX = 1 + Math.abs(Math.sin(walkPhase)) * 0.04;
  }

  if (isAttacking && attackProgress > 0) {
    if (attackProgress < 0.28) {
      // Phase 1: Windup crouch squash
      const t = attackProgress / 0.28;
      squashY = 1 - t * 0.16;
      squashX = 1 + t * 0.10;
      lungeX = -atkDirX * t * 3.6;
      lungeY = -atkDirY * t * 3.6;
    } else if (attackProgress < 0.65) {
      // Phase 2: Forward slam stretch
      const t = (attackProgress - 0.28) / 0.37;
      const stretch = Math.sin(t * Math.PI);
      squashY = 1 + stretch * 0.22;
      squashX = 1 - stretch * 0.10;
      lungeX = atkDirX * stretch * 10.5;
      lungeY = atkDirY * stretch * 7.5;
    } else {
      // Phase 3 & 4: Recovery
      const t = (attackProgress - 0.65) / 0.35;
      squashY = 1 - (1 - t) * 0.08;
      squashX = 1 + (1 - t) * 0.05;
    }
  }

  // -------------------------------------------------------------
  // 1. Ground Ambient Occlusion & Sub-Zero Frost Pool
  // -------------------------------------------------------------
  if (isShadowPass) {
    ctx.beginPath();
    ctx.ellipse(x + lungeX, y + lungeY + 15 * scale, r * 1.35 * scale * squashX, r * 0.55 * scale * squashY, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(4, 10, 20, 0.45)";
    ctx.fill();
    return;
  }

  ctx.save();
  ctx.translate(x + lungeX, y + lungeY - bounce * scale);
  ctx.scale(scale * squashX, scale * squashY);

  // Ground Contact Shadows & Frost Pool
  const shadowGrd = ctx.createRadialGradient(0, 15, 2, 0, 15, r * 1.45);
  shadowGrd.addColorStop(0, "rgba(4, 12, 24, 0.55)");
  shadowGrd.addColorStop(0.5, "rgba(8, 24, 44, 0.30)");
  shadowGrd.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = shadowGrd;
  ctx.beginPath();
  ctx.ellipse(0, 15, r * 1.45, r * 0.58, 0, 0, Math.PI * 2);
  ctx.fill();

  const frostPoolGrd = ctx.createRadialGradient(0, 15, 0, 0, 15, r * 1.55);
  frostPoolGrd.addColorStop(0, "rgba(186, 230, 253, 0.25)");
  frostPoolGrd.addColorStop(0.6, "rgba(56, 189, 248, 0.12)");
  frostPoolGrd.addColorStop(1, "rgba(56, 189, 248, 0)");
  ctx.fillStyle = frostPoolGrd;
  ctx.beginPath();
  ctx.ellipse(0, 15, r * 1.55, r * 0.60, 0, 0, Math.PI * 2);
  ctx.fill();

  // Creeping frost dendrite spurs
  ctx.fillStyle = "rgba(224, 242, 254, 0.38)";
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + (seed % 1);
    const dist = r * 0.95 + ((seed * (i + 1) * 31) % 8);
    const dx = Math.cos(angle) * dist;
    const dy = 15 + Math.sin(angle) * (dist * 0.42);
    ctx.beginPath();
    ctx.moveTo(dx * 0.7, dy * 0.7);
    ctx.lineTo(dx, dy);
    ctx.lineTo(dx * 0.85 + 2, dy * 0.85);
    ctx.fill();
  }

  // Glacial Slam Ground Shockwave VFX (when slamming)
  if (isAttacking && attackProgress >= 0.28 && attackProgress <= 0.80) {
    const slamT = (attackProgress - 0.28) / 0.52;
    const shockRad = slamT * 32.0;
    const shockAlpha = Math.sin(slamT * Math.PI) * 0.65;
    ctx.fillStyle = `rgba(56, 189, 248, ${shockAlpha * 0.35})`;
    ctx.beginPath();
    ctx.ellipse(0, 15, shockRad * 1.4, shockRad * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();

    // Jagged erupted ice shards
    ctx.fillStyle = `rgba(224, 242, 254, ${shockAlpha * 0.85})`;
    for (let k = 0; k < 5; k++) {
      const kAngle = (k / 5) * Math.PI * 2 + 0.3;
      const kDist = shockRad * 0.9;
      const kx = Math.cos(kAngle) * kDist;
      const ky = 15 + Math.sin(kAngle) * (kDist * 0.45);
      ctx.beginPath();
      ctx.moveTo(kx, ky);
      ctx.lineTo(kx - 3, ky - 8 * (1 - slamT * 0.5));
      ctx.lineTo(kx + 2, ky - 10 * (1 - slamT * 0.5));
      ctx.lineTo(kx + 4, ky);
      ctx.closePath();
      ctx.fill();
    }
  }

  // -------------------------------------------------------------
  // Leg Drawing Helper (Digitigrade / Knuckle-Stride)
  // -------------------------------------------------------------
  const drawLeg = (footX, footY, isNearLeg, isFacingBack) => {
    ctx.save();
    const legGrd = ctx.createLinearGradient(footX, footY - 18, footX, footY);
    if (isNearLeg) {
      legGrd.addColorStop(0, "#38bdf8");
      legGrd.addColorStop(0.4, "#0284c7");
      legGrd.addColorStop(1, "#082f49");
    } else {
      legGrd.addColorStop(0, "#0369a1");
      legGrd.addColorStop(0.5, "#075985");
      legGrd.addColorStop(1, "#04192b");
    }
    ctx.fillStyle = legGrd;

    // Muscular crouching thigh
    ctx.beginPath();
    ctx.moveTo(footX - 4.5, footY - 14);
    ctx.quadraticCurveTo(footX - (isNearLeg ? 8.5 : 6.5), footY - 7, footX - 3.5, footY - 1);
    ctx.lineTo(footX + 4.5, footY - 1);
    ctx.quadraticCurveTo(footX + (isNearLeg ? 7.5 : 5.5), footY - 8, footX + 3.5, footY - 14);
    ctx.closePath();
    ctx.fill();

    // Knee highlight
    if (isNearLeg) {
      ctx.fillStyle = "rgba(224, 242, 254, 0.45)";
      ctx.beginPath();
      ctx.ellipse(footX, footY - 8, 2.5, 3.2, 0.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Wide Snowshoe Paw & 3 Obsidian Toes
    ctx.fillStyle = isNearLeg ? "#082f49" : "#04192b";
    ctx.beginPath();
    ctx.ellipse(footX, footY + 1.2, 5.2, 2.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3 Splayed Claws
    const clawColor = isNearLeg ? "#0284c7" : "#075985";
    ctx.fillStyle = clawColor;
    for (let c = -1; c <= 1; c++) {
      const cx = footX + c * 3.2;
      const cy = footY + (isFacingBack ? -0.5 : 2.5);
      ctx.beginPath();
      ctx.moveTo(cx - 1.2, cy - 1);
      ctx.lineTo(cx, cy + (isFacingBack ? -2.8 : 3.2));
      ctx.lineTo(cx + 1.2, cy - 1);
      ctx.closePath();
      ctx.fill();

      // Specular claw tip
      if (isNearLeg) {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(cx, cy + (isFacingBack ? -2.2 : 2.5), 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = clawColor;
      }
    }
    ctx.restore();
  };

  // -------------------------------------------------------------
  // Arm & Knuckleduster Helper
  // -------------------------------------------------------------
  const drawArm = (armX, armY, isRightArm, isNearArm) => {
    ctx.save();
    ctx.translate(armX, armY);

    // Dynamic arm swing during walk and heavy slam during attack
    const armDirSign = isRightArm ? -1 : 1;
    let armRot = isBackView ? -0.25 * armDirSign : 0.20 * armDirSign;
    const walkArmSwing = moving ? (isRightArm ? -strideSwing * 0.04 : strideSwing * 0.04) : 0;

    if (isAttacking && attackProgress > 0) {
      if (attackProgress < 0.28) {
        // Raise fists high during windup
        const t = attackProgress / 0.28;
        armRot += -armDirSign * t * 1.15;
      } else if (attackProgress < 0.65) {
        // Slam fists down
        const t = (attackProgress - 0.28) / 0.37;
        armRot += armDirSign * (-1.15 + t * 1.85);
      }
    }

    ctx.rotate(armRot + walkArmSwing);

    // Muscular Deltoid & Bicep
    const armGrd = ctx.createLinearGradient(-4, -6, 4, 16);
    if (isNearArm) {
      armGrd.addColorStop(0, "#38bdf8");
      armGrd.addColorStop(0.35, "#0284c7");
      armGrd.addColorStop(1, "#082f49");
    } else {
      armGrd.addColorStop(0, "#0369a1");
      armGrd.addColorStop(0.5, "#075985");
      armGrd.addColorStop(1, "#04192b");
    }
    ctx.fillStyle = armGrd;

    ctx.beginPath();
    ctx.moveTo(-5.5, -4.0);
    ctx.quadraticCurveTo(-9.0, 4.0, -6.5, 12.0); // Deltoid to forearm
    ctx.lineTo(6.5, 12.0);
    ctx.quadraticCurveTo(9.0, 4.0, 5.5, -4.0);
    ctx.closePath();
    ctx.fill();

    // Muscle ridge highlight
    if (isNearArm) {
      ctx.fillStyle = "rgba(224, 242, 254, 0.32)";
      ctx.beginPath();
      ctx.ellipse(armDirSign * -1.2, 3.5, 2.8, 6.0, 0.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Heavy Slate Knuckleduster Fist
    const fistY = 14.5;
    const fistGrd = ctx.createRadialGradient(-1.5, fistY - 2, 1, 0, fistY, 9.5);
    fistGrd.addColorStop(0, isNearArm ? "#94a3b8" : "#64748b");
    fistGrd.addColorStop(0.5, isNearArm ? "#475569" : "#334155");
    fistGrd.addColorStop(1, "#0f172a");
    ctx.fillStyle = fistGrd;
    ctx.beginPath();
    ctx.ellipse(0, fistY, 8.5, 6.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3 Embedded Blue Ice Crystals
    const crystalGrd = ctx.createLinearGradient(-4, fistY - 6, 4, fistY + 6);
    crystalGrd.addColorStop(0, "#ffffff");
    crystalGrd.addColorStop(0.3, "#00f0ff");
    crystalGrd.addColorStop(0.7, "#0284c7");
    crystalGrd.addColorStop(1, "#082f49");
    ctx.fillStyle = crystalGrd;

    // Crystal 1 (Left)
    ctx.beginPath();
    ctx.moveTo(-5.2, fistY);
    ctx.lineTo(-4.0, fistY + 4.5);
    ctx.lineTo(-2.2, fistY);
    ctx.lineTo(-3.8, fistY - 4.5);
    ctx.closePath();
    ctx.fill();

    // Crystal 2 (Center Main Spike)
    ctx.beginPath();
    ctx.moveTo(-1.8, fistY - 1.0);
    ctx.lineTo(0.0, fistY + 6.2);
    ctx.lineTo(1.8, fistY - 1.0);
    ctx.lineTo(0.0, fistY - 6.5);
    ctx.closePath();
    ctx.fill();

    // Crystal 3 (Right)
    ctx.beginPath();
    ctx.moveTo(2.2, fistY);
    ctx.lineTo(3.8, fistY + 4.5);
    ctx.lineTo(5.2, fistY);
    ctx.lineTo(4.0, fistY - 4.5);
    ctx.closePath();
    ctx.fill();

    // Prismatic Diamond Specular Glint
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(0, fistY - 3.2, 0.75, 0, Math.PI * 2);
    ctx.arc(-3.5, fistY - 2.0, 0.55, 0, Math.PI * 2);
    ctx.arc(3.5, fistY - 2.0, 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Gathering frost aura on fists during attack windup
    if (isAttacking && attackProgress > 0 && attackProgress < 0.35) {
      const glowT = Math.sin((attackProgress / 0.35) * Math.PI);
      ctx.fillStyle = `rgba(0, 240, 255, ${glowT * 0.45})`;
      ctx.beginPath();
      ctx.arc(0, fistY, 13.0 * glowT, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  // -------------------------------------------------------------
  // Layer Sorting: Background Limbs
  // -------------------------------------------------------------
  // Hind Leg (Far)
  const farLegStep = moving ? -Math.sin(walkPhase) * 2.5 : 0;
  drawLeg(cfg.hindLegFarX, 8.5 + farLegStep, false, isBackView);

  // Background Arm (if designated behind torso)
  if (!cfg.rightArmFront) {
    drawArm(cfg.rightArmX, cfg.rightArmY, true, false);
  }
  if (!cfg.leftArmFront) {
    drawArm(cfg.leftArmX, cfg.leftArmY, false, false);
  }

  // Hind Leg (Near)
  const nearLegStep = moving ? Math.sin(walkPhase) * 2.5 : 0;
  drawLeg(cfg.hindLegNearX, 8.5 + nearLegStep, true, isBackView);

  // -------------------------------------------------------------
  // Main Muscular Hunched Torso & Trapezius Peaks
  // -------------------------------------------------------------
  ctx.save();
  ctx.rotate(cfg.tilt);

  const torsoGrd = ctx.createRadialGradient(-r * 0.25, -r * 0.2, r * 0.15, 0, 0, r * 1.15);
  torsoGrd.addColorStop(0, "#38bdf8"); // Key-lit sunlit chest
  torsoGrd.addColorStop(0.35, "#0284c7"); // Midtone permafrost
  torsoGrd.addColorStop(0.72, "#075985"); // Flank shadow
  torsoGrd.addColorStop(1, "#082f49"); // Occlusion
  ctx.fillStyle = torsoGrd;

  if (cfg.view === "front") {
    // Symmetrical Direct Front Gorilla Torso
    ctx.beginPath();
    ctx.moveTo(-r * 0.75, r * 0.45);
    ctx.quadraticCurveTo(-r * 0.90, -r * 0.1, -r * 0.72, -r * 0.65); // Left trapezius peak
    ctx.quadraticCurveTo(-r * 0.35, -r * 0.82, 0, -r * 0.75); // Saddle
    ctx.quadraticCurveTo(r * 0.35, -r * 0.82, r * 0.72, -r * 0.65); // Right trapezius peak
    ctx.quadraticCurveTo(r * 0.90, -r * 0.1, r * 0.75, r * 0.45);
    ctx.quadraticCurveTo(0, r * 0.60, -r * 0.75, r * 0.45);
    ctx.closePath();
    ctx.fill();

    // Dual Pectoral Plates & Sternum Shadow
    const pecGrd = ctx.createRadialGradient(0, -r * 0.2, 1, 0, -r * 0.1, r * 0.55);
    pecGrd.addColorStop(0, "rgba(224, 242, 254, 0.45)");
    pecGrd.addColorStop(0.5, "rgba(56, 189, 248, 0.2)");
    pecGrd.addColorStop(1, "rgba(8, 47, 73, 0)");
    ctx.fillStyle = pecGrd;
    ctx.beginPath();
    ctx.ellipse(-r * 0.32, -r * 0.22, r * 0.26, r * 0.18, 0.1, 0, Math.PI * 2);
    ctx.ellipse(r * 0.32, -r * 0.22, r * 0.26, r * 0.18, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // Sternum Crease
    ctx.fillStyle = "#082f49";
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.15, 1.4, r * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (cfg.view === "back") {
    // Symmetrical Direct Back Gorilla Torso
    ctx.beginPath();
    ctx.moveTo(-r * 0.78, r * 0.45);
    ctx.quadraticCurveTo(-r * 0.92, -r * 0.15, -r * 0.75, -r * 0.70);
    ctx.quadraticCurveTo(0, -r * 0.86, r * 0.75, -r * 0.70);
    ctx.quadraticCurveTo(r * 0.92, -r * 0.15, r * 0.78, r * 0.45);
    ctx.quadraticCurveTo(0, r * 0.62, -r * 0.78, r * 0.45);
    ctx.closePath();
    ctx.fill();

    // Vertebral spine nodes running down center
    ctx.fillStyle = "#04192b";
    for (let s = -4; s <= 2; s++) {
      ctx.beginPath();
      ctx.ellipse(0, s * 4.2 - 2.0, 2.2, 1.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (isProfileView) {
    // Pure Side Profile Torso
    const f = cfg.flip;
    ctx.beginPath();
    ctx.moveTo(-f * r * 0.65, r * 0.45);
    ctx.quadraticCurveTo(-f * r * 0.85, -r * 0.2, -f * r * 0.50, -r * 0.72); // Heavy dorsal hump
    ctx.quadraticCurveTo(0, -r * 0.85, f * r * 0.45, -r * 0.55); // Forward chest
    ctx.quadraticCurveTo(f * r * 0.75, 0, f * r * 0.45, r * 0.45);
    ctx.quadraticCurveTo(0, r * 0.62, -f * r * 0.65, r * 0.45);
    ctx.closePath();
    ctx.fill();
  } else {
    // Diagonal 3/4 Torso
    const f = cfg.flip;
    ctx.beginPath();
    ctx.moveTo(-f * r * 0.72, r * 0.45);
    ctx.quadraticCurveTo(-f * r * 0.88, -r * 0.15, -f * r * 0.65, -r * 0.68);
    ctx.quadraticCurveTo(0, -r * 0.84, f * r * 0.65, -r * 0.62);
    ctx.quadraticCurveTo(f * r * 0.85, 0, f * r * 0.68, r * 0.45);
    ctx.quadraticCurveTo(0, r * 0.60, -f * r * 0.72, r * 0.45);
    ctx.closePath();
    ctx.fill();
  }

  // -------------------------------------------------------------
  // Volumetric Polar Fur Mantle (3-Tiered Draped Collar)
  // -------------------------------------------------------------
  // Layer A: Under-fur Shadow Base
  const furBaseGrd = ctx.createRadialGradient(0, -r * 0.45, 2, 0, -r * 0.45, r * 0.85);
  furBaseGrd.addColorStop(0, "#cbd5e1");
  furBaseGrd.addColorStop(0.45, "#94a3b8");
  furBaseGrd.addColorStop(0.85, "#64748b");
  furBaseGrd.addColorStop(1, "#334155");
  ctx.fillStyle = furBaseGrd;

  ctx.beginPath();
  ctx.ellipse(0, -r * 0.45, r * 0.75, r * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();

  // Layer B: Mid-fur Volumetric Tufts
  const furMidGrd = ctx.createLinearGradient(0, -r * 0.65, 0, -r * 0.25);
  furMidGrd.addColorStop(0, "#ffffff");
  furMidGrd.addColorStop(0.55, "#e2e8f0");
  furMidGrd.addColorStop(1, "#94a3b8");
  ctx.fillStyle = furMidGrd;

  // Fur tufts draped across shoulders and trapezius
  ctx.beginPath();
  ctx.moveTo(-r * 0.72, -r * 0.35);
  ctx.quadraticCurveTo(-r * 0.78, -r * 0.58, -r * 0.52, -r * 0.60);
  ctx.quadraticCurveTo(-r * 0.35, -r * 0.65, -r * 0.22, -r * 0.52);
  ctx.quadraticCurveTo(0, -r * 0.64, r * 0.22, -r * 0.52);
  ctx.quadraticCurveTo(r * 0.35, -r * 0.65, r * 0.52, -r * 0.60);
  ctx.quadraticCurveTo(r * 0.78, -r * 0.58, r * 0.72, -r * 0.35);
  ctx.quadraticCurveTo(r * 0.45, -r * 0.25, 0, -r * 0.28);
  ctx.quadraticCurveTo(-r * 0.45, -r * 0.25, -r * 0.72, -r * 0.35);
  ctx.closePath();
  ctx.fill();

  // Layer C: Snowy Rim Edge Highlights
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.58, r * 0.42, 2.5, 0, 0, Math.PI * 2);
  ctx.ellipse(-r * 0.45, -r * 0.48, r * 0.16, 2.2, -0.3, 0, Math.PI * 2);
  ctx.ellipse(r * 0.45, -r * 0.48, r * 0.16, 2.2, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Dorsal Ice Crystal Spines (in Back and 3/4 Back views)
  if (isBackView) {
    const spineCrystalGrd = ctx.createLinearGradient(0, -r * 0.6, 0, 0);
    spineCrystalGrd.addColorStop(0, "#ffffff");
    spineCrystalGrd.addColorStop(0.3, "#00f0ff");
    spineCrystalGrd.addColorStop(0.7, "#0284c7");
    spineCrystalGrd.addColorStop(1, "#082f49");
    ctx.fillStyle = spineCrystalGrd;

    for (let sp = -2; sp <= 1; sp++) {
      const spy = sp * 7.5 - 6.0;
      ctx.beginPath();
      ctx.moveTo(-1.8, spy + 2.5);
      ctx.lineTo(0.0, spy - 5.5);
      ctx.lineTo(1.8, spy + 2.5);
      ctx.closePath();
      ctx.fill();

      // Specular diamond glint
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, spy - 3.5, 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = spineCrystalGrd;
    }
  }

  ctx.restore(); // End Torso

  // -------------------------------------------------------------
  // Neanderthal Head & Facial Features
  // -------------------------------------------------------------
  ctx.save();
  const headX = cfg.headX;
  const headY = cfg.headY;
  ctx.translate(headX, headY);
  ctx.rotate(cfg.tilt * 0.7);

  // Skull Base
  const headGrd = ctx.createRadialGradient(-2.5, -3.5, 1, 0, 0, 14.5);
  headGrd.addColorStop(0, "#38bdf8"); // Key-lit cranium
  headGrd.addColorStop(0.4, "#0284c7"); // Midtone permafrost
  headGrd.addColorStop(0.85, "#075985"); // Jaw shadow
  headGrd.addColorStop(1, "#082f49"); // Occlusion
  ctx.fillStyle = headGrd;

  ctx.beginPath();
  ctx.moveTo(-9.5, -4.5);
  ctx.quadraticCurveTo(-9.0, -11.5, 0, -12.0); // Sloping cranium
  ctx.quadraticCurveTo(9.0, -11.5, 9.5, -4.5);
  ctx.quadraticCurveTo(10.5, 3.5, 6.0, 7.5); // Jutting lower jaw
  ctx.quadraticCurveTo(0, 9.2, -6.0, 7.5);
  ctx.quadraticCurveTo(-10.5, 3.5, -9.5, -4.5);
  ctx.closePath();
  ctx.fill();

  // Pointed Ears with Translucent Cartilage
  const earSpread = isProfileView ? 8.0 : 12.5;
  const earFlip = cfg.flip;

  const drawEar = (earDir) => {
    ctx.save();
    const ex = earDir * earSpread;
    const ey = -4.5;
    const earGrd = ctx.createLinearGradient(ex, ey, ex + earDir * 4.5, ey - 5.5);
    earGrd.addColorStop(0, "#0284c7");
    earGrd.addColorStop(0.6, "#38bdf8");
    earGrd.addColorStop(1, "#e0f2fe");
    ctx.fillStyle = earGrd;

    ctx.beginPath();
    ctx.moveTo(ex * 0.8, ey);
    ctx.lineTo(ex + earDir * 5.2, ey - 6.5);
    ctx.lineTo(ex * 0.85, ey + 3.0);
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
    // Heavy Neanderthal Brow Ridge
    const browGrd = ctx.createLinearGradient(0, -6.5, 0, -2.5);
    browGrd.addColorStop(0, "#e0f2fe");
    browGrd.addColorStop(0.4, "#0284c7");
    browGrd.addColorStop(1, "#082f49");
    ctx.fillStyle = browGrd;

    ctx.beginPath();
    ctx.ellipse(0, -4.2, isProfileView ? 6.2 : 8.5, 2.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Piercing Cyan Bioluminescent Eyes
    const eyeOffsetX = isProfileView ? (earFlip > 0 ? 2.5 : -2.5) : 4.0;
    const drawEye = (ex) => {
      // Glow socket
      const eyeGlow = ctx.createRadialGradient(ex, -3.2, 0.5, ex, -3.2, 3.2);
      eyeGlow.addColorStop(0, "rgba(0, 240, 255, 0.95)");
      eyeGlow.addColorStop(0.5, "rgba(2, 132, 199, 0.6)");
      eyeGlow.addColorStop(1, "rgba(8, 47, 73, 0)");
      ctx.fillStyle = eyeGlow;
      ctx.beginPath();
      ctx.arc(ex, -3.2, 3.0, 0, Math.PI * 2);
      ctx.fill();

      // Pupil Specular
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(ex, -3.2, 0.9, 0, Math.PI * 2);
      ctx.fill();
    };

    if (isFrontView) {
      drawEye(-eyeOffsetX);
      drawEye(eyeOffsetX);
    } else {
      drawEye(earFlip * 2.2);
    }

    // 3D Carved Ivory Canines (Tusks)
    const tuskGrd = ctx.createLinearGradient(0, 6, 0, 0);
    tuskGrd.addColorStop(0, "#713f12");
    tuskGrd.addColorStop(0.3, "#fef08a");
    tuskGrd.addColorStop(1, "#ffffff");
    ctx.fillStyle = tuskGrd;

    const drawTusk = (tx, dirSign) => {
      ctx.beginPath();
      ctx.moveTo(tx - 1.2, 5.5);
      ctx.quadraticCurveTo(tx + dirSign * 2.5, 1.5, tx + dirSign * 1.5, -2.5);
      ctx.quadraticCurveTo(tx + dirSign * 0.5, 1.5, tx + 1.2, 5.5);
      ctx.closePath();
      ctx.fill();
    };

    if (isFrontView) {
      drawTusk(-4.5, -1);
      drawTusk(4.5, 1);
    } else {
      drawTusk(earFlip * 3.5, earFlip);
    }

    // Translucent Icicle Beard
    const icicleGrd = ctx.createLinearGradient(0, 4, 0, 15);
    icicleGrd.addColorStop(0, "rgba(224, 242, 254, 0.85)");
    icicleGrd.addColorStop(0.4, "rgba(56, 189, 248, 0.65)");
    icicleGrd.addColorStop(1, "rgba(2, 132, 199, 0.15)");
    ctx.fillStyle = icicleGrd;

    const beardSpikes = isProfileView ? 3 : 5;
    for (let b = 0; b < beardSpikes; b++) {
      const bx = isProfileView ? (b * 2.5 - 2) * earFlip : (b - (beardSpikes - 1) / 2) * 3.2;
      const blen = 8.5 + ((seed * (b + 1) * 17) % 5);
      ctx.beginPath();
      ctx.moveTo(bx - 1.6, 6.0);
      ctx.lineTo(bx, 6.0 + blen);
      ctx.lineTo(bx + 1.6, 6.0);
      ctx.closePath();
      ctx.fill();

      // Diamond ridge highlight
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.beginPath();
      ctx.moveTo(bx, 6.5);
      ctx.lineTo(bx, 6.0 + blen * 0.75);
      ctx.lineTo(bx + 0.6, 6.5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = icicleGrd;
    }

    // Dynamic Cold-Breath Vapor Puffs
    for (let p = 0; p < 3; p++) {
      const pCycle = (nowMs * 0.02 + p * 35 + seed * 12) % 60;
      const pProgress = pCycle / 60;
      const pAlpha = Math.sin(pProgress * Math.PI) * 0.38;
      const pDist = pProgress * 18;
      const pX = (isProfileView ? earFlip * 5.0 : 0) + Math.sin(nowMs * 0.003 + p * 1.7) * 4;
      const pY = 9.0 + pDist * 0.55;
      const pSize = 2.5 + pProgress * 5.5;

      const vaporGrd = ctx.createRadialGradient(pX, pY, 0.5, pX, pY, pSize);
      vaporGrd.addColorStop(0, `rgba(240, 249, 255, ${pAlpha})`);
      vaporGrd.addColorStop(0.5, `rgba(186, 230, 253, ${pAlpha * 0.6})`);
      vaporGrd.addColorStop(1, "rgba(186, 230, 253, 0)");
      ctx.fillStyle = vaporGrd;
      ctx.beginPath();
      ctx.arc(pX, pY, pSize, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Back View: Snowy Cranial Ridge
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(0, -10.5, 6.5, 2.0, 0, 0, Math.PI * 2);
    ctx.fill();

    // Vapor curling around jaw
    for (let p = 0; p < 2; p++) {
      const pCycle = (nowMs * 0.02 + p * 40 + seed) % 60;
      const pProgress = pCycle / 60;
      const pAlpha = Math.sin(pProgress * Math.PI) * 0.32;
      const pX = (p === 0 ? -1 : 1) * (8.5 + pProgress * 6);
      const pY = -2.0 - pProgress * 8;
      const pSize = 2.0 + pProgress * 4.5;
      const vaporGrd = ctx.createRadialGradient(pX, pY, 0.5, pX, pY, pSize);
      vaporGrd.addColorStop(0, `rgba(240, 249, 255, ${pAlpha})`);
      vaporGrd.addColorStop(1, "rgba(186, 230, 253, 0)");
      ctx.fillStyle = vaporGrd;
      ctx.beginPath();
      ctx.arc(pX, pY, pSize, 0, Math.PI * 2);
      ctx.fill();
    }
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
}
