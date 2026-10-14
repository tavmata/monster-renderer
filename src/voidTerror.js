// voidTerror.js - Procedural Lineless Void Terror & Eldritch Cosmic Entity Renderer
import { computeFastSeed, safeCreateRadialGradient } from './helpers.js';

/**
 * CORE DESIGN RULE: NEVER RENDER SOLID SHADOW CIRCLES
 * Never draw solid or flat circle/ellipse ground shadows beneath monsters.
 * Monsters must never have baked-in dark circular shapes emulating ground shadows.
 * All artificial solid ground shadow discs are strictly prohibited.
 */

/**
 * Triggers a cosmic void death explosion with collapsing singularity,
 * severed writhing tentacle fragments, shattered obsidian carapace shards,
 * and exploding violet/cyan astral spark motes.
 *
 * @param {Object} ce - Entity state object
 */
export function triggerVoidDeathExplosion(ce) {
  if (!ce || ce._voidExploded) return;
  ce._voidExploded = true;

  const type = (ce.type || "void_terror").toLowerCase();
  const isBoss = type.startsWith("boss_") || type.includes("colossus") || type.includes("leviathan");
  const isDevourer = type.includes("devourer");
  const isNullGazer = type.includes("gazer");

  const primaryColor = isDevourer ? "#4c0519" : isNullGazer ? "#1e1b4b" : "#1e0836";
  const accentColor = isDevourer ? "#e11d48" : isNullGazer ? "#38bdf8" : "#c084fc";
  const shardColor = "#0f071b";
  const coreGlow = isDevourer ? "#f43f5e" : isNullGazer ? "#00f0ff" : "#d946ef";

  if (typeof spawnParticle === "function") {
    // 1. Severed Writhing Tentacle Segments flying outward in radial burst
    const tentacleCount = isBoss ? 10 : isNullGazer ? 6 : 8;
    for (let i = 0; i < tentacleCount; i++) {
      const angle = (i / tentacleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = 120 + Math.random() * 150;
      spawnParticle({
        x: ce.x + Math.cos(angle) * 10,
        y: ce.y + Math.sin(angle) * 10,
        vx: Math.cos(angle) * speed,
        vy: -90 - Math.random() * 120,
        color: primaryColor,
        accentColor: accentColor,
        size: isBoss ? 11 : 7.5,
        maxLife: 2.4,
        drag: 0.94,
        style: "wolf_leg",
        gravity: 190,
        shrink: true,
      });
    }

    // 2. Shattered Obsidian Carapace Monolith Plates
    const shardCount = isBoss ? 8 : 4;
    for (let s = 0; s < shardCount; s++) {
      const angle = (s / shardCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const speed = 90 + Math.random() * 130;
      spawnParticle({
        x: ce.x + Math.cos(angle) * 8,
        y: ce.y + Math.sin(angle) * 8,
        vx: Math.cos(angle) * speed,
        vy: -110 - Math.random() * 100,
        color: shardColor,
        accentColor: accentColor,
        size: isBoss ? 9 : 6,
        maxLife: 2.2,
        drag: 0.95,
        style: "wolf_head",
        gravity: 210,
        shrink: true,
      });
    }

    // 3. Cosmic Singularity Nova Spark Motes & Void Lightning Sparks
    const moteCount = isBoss ? 55 : 32;
    const sparkPalette = isDevourer
      ? ["#f43f5e", "#fda4af", "#e11d48", "#881337", "#ffffff"]
      : isNullGazer
      ? ["#38bdf8", "#bae6fd", "#818cf8", "#0284c7", "#ffffff"]
      : ["#e879f9", "#c084fc", "#d946ef", "#a855f7", "#38bdf8", "#ffffff"];

    for (let m = 0; m < moteCount; m++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 220;
      spawnParticle({
        x: ce.x + (Math.random() - 0.5) * 12,
        y: ce.y + (Math.random() - 0.5) * 12,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        color: sparkPalette,
        size: 2.2 + Math.random() * 3.8,
        maxLife: 1.2 + Math.random() * 0.9,
        drag: 0.92,
        gravity: 60,
        shrink: true,
        style: "circle",
      });
    }

    // 4. Central Collapsed Core Implosion Pulse
    spawnParticle({
      x: ce.x,
      y: ce.y,
      vx: 0,
      vy: -20,
      color: coreGlow,
      size: isBoss ? 26 : 18,
      maxLife: 0.6,
      drag: 0.88,
      gravity: 0,
      shrink: true,
      style: "circle",
    });
  }
}

/**
 * Draws a single fluid, multi-segmented eldritch tentacle with tapered thickness,
 * sinusoidal wave dynamics, barbed suckers/nodules, and volumetric shading.
 */
function drawVoidTentacle(ctx, params) {
  const {
    baseX,
    baseY,
    length,
    baseWidth,
    tipWidth,
    angle,
    wavePhase,
    waveAmp,
    curviness,
    primaryColor,
    shadowColor,
    suckerColor,
    highlightColor,
    segments = 14,
    showSuckers = true,
    barbed = false,
    attackStretch = 0
  } = params;

  // Build skeletal curve nodes using progressive kinematics
  const nodes = [];
  const segLen = (length * (1 + attackStretch * 0.45)) / segments;
  let curX = baseX;
  let curY = baseY;
  let curAngle = angle;

  nodes.push({ x: curX, y: curY, w: baseWidth, perpX: 0, perpY: 0 });

  for (let s = 1; s <= segments; s++) {
    const t = s / segments;
    // Harmonic wave curvature
    const sinWave = Math.sin(wavePhase + t * Math.PI * 2.2);
    const cosWave = Math.cos(wavePhase * 0.7 + t * Math.PI * 1.5);
    const bend = (sinWave * waveAmp + cosWave * (waveAmp * 0.4)) * (t * 0.9 + 0.1) * curviness;

    curAngle += bend;
    curX += Math.cos(curAngle) * segLen;
    curY += Math.sin(curAngle) * segLen;

    const w = baseWidth * (1 - t) + tipWidth * t;
    const perpX = -Math.sin(curAngle);
    const perpY = Math.cos(curAngle);

    nodes.push({ x: curX, y: curY, w, perpX, perpY, angle: curAngle });
  }

  // Draw Tentacle Body Envelope (Left edge then Right edge back)
  ctx.beginPath();
  const first = nodes[0];
  ctx.moveTo(first.x + first.perpX * (first.w * 0.5), first.y + first.perpY * (first.w * 0.5));

  for (let i = 1; i < nodes.length; i++) {
    const node = nodes[i];
    const prev = nodes[i - 1];
    const xc = (prev.x + prev.perpX * (prev.w * 0.5) + node.x + node.perpX * (node.w * 0.5)) * 0.5;
    const yc = (prev.y + prev.perpY * (prev.w * 0.5) + node.y + node.perpY * (node.w * 0.5)) * 0.5;
    ctx.quadraticCurveTo(
      prev.x + prev.perpX * (prev.w * 0.5),
      prev.y + prev.perpY * (prev.w * 0.5),
      xc,
      yc
    );
  }

  const last = nodes[nodes.length - 1];
  ctx.lineTo(last.x, last.y);

  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    const rx = node.x - node.perpX * (node.w * 0.5);
    const ry = node.y - node.perpY * (node.w * 0.5);
    ctx.lineTo(rx, ry);
  }
  ctx.closePath();

  // Volumetric Linear Gradient along tentacle direction
  const grad = ctx.createLinearGradient(baseX, baseY, last.x, last.y);
  grad.addColorStop(0, shadowColor);
  grad.addColorStop(0.4, primaryColor);
  grad.addColorStop(0.85, highlightColor);
  grad.addColorStop(1, suckerColor);
  ctx.fillStyle = grad;
  ctx.fill();

  // Inner Muscle Core Ribbon (Gives 3D rounded tubular appearance)
  ctx.beginPath();
  ctx.moveTo(nodes[0].x, nodes[0].y);
  for (let i = 1; i < nodes.length - 1; i++) {
    const p = nodes[i];
    const next = nodes[i + 1];
    ctx.quadraticCurveTo(p.x, p.y, (p.x + next.x) * 0.5, (p.y + next.y) * 0.5);
  }
  ctx.strokeStyle = highlightColor;
  ctx.lineWidth = Math.max(1, baseWidth * 0.25);
  ctx.lineCap = "round";
  ctx.stroke();

  // Bioluminescent Suckers / Abyssal Thorn Nodules along inner contour
  if (showSuckers) {
    const step = barbed ? 2 : 3;
    for (let i = 2; i < nodes.length - 2; i += step) {
      const node = nodes[i];
      const suckerRadius = Math.max(1.2, node.w * 0.38);
      const side = 1; // inner side
      const sx = node.x + node.perpX * (node.w * 0.42 * side);
      const sy = node.y + node.perpY * (node.w * 0.42 * side);

      if (barbed) {
        // Razor scythe thorn
        ctx.fillStyle = suckerColor;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + node.perpX * suckerRadius * 1.8, sy + node.perpY * suckerRadius * 1.8);
        ctx.lineTo(sx + Math.cos(node.angle) * suckerRadius * 1.2, sy + Math.sin(node.angle) * suckerRadius * 1.2);
        ctx.closePath();
        ctx.fill();
      } else {
        // Glowing suction crater
        ctx.fillStyle = shadowColor;
        ctx.beginPath();
        ctx.arc(sx, sy, suckerRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = suckerColor;
        ctx.beginPath();
        ctx.arc(sx, sy, suckerRadius * 0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(sx - suckerRadius * 0.2, sy - suckerRadius * 0.2, suckerRadius * 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

/**
 * Procedural Lineless Void Terror & Eldritch Cosmic Entity Master Renderer
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x - Target X coordinate
 * @param {number} y - Target Y coordinate
 * @param {Object} ent - Entity state object
 * @param {boolean} isShadowPass - Shadow pass flag (strictly prohibits solid ground shadows)
 */
export function drawVoidTerrorEntity(ctx, x, y, ent, isShadowPass = false) {
  if (isShadowPass) return;
  if (!ent) ent = {};

  const type = (ent.type || "void_terror").toLowerCase();
  const facingAngle = (typeof ent.facingAngle === "number" && !isNaN(ent.facingAngle)) ? ent.facingAngle : 0;
  const isMoving = !!(ent.moving || ent.isMoving);
  const isSlowed = !!ent.isSlowed;

  if (ent._seed === undefined) {
    const id = ent.id || ("void_" + Math.round(x) + "_" + Math.round(y));
    ent._seed = typeof computeFastSeed === "function" ? computeFastSeed(id) : 42;
  }
  const seed = ent._seed;
  const nowMs = typeof performance !== "undefined" ? performance.now() : Date.now();

  // Detect Attack State
  let isAttacking = !!(ent.isAttacking || ent.currentCast);
  let attackProgress = 0;
  if (ent.currentCast && ent.currentCast.duration > 0) {
    const elapsed = Math.max(0, nowMs - (ent.currentCast.startTime || nowMs));
    attackProgress = Math.min(1, elapsed / ent.currentCast.duration);
    isAttacking = true;
  } else if (isAttacking) {
    const animStart = ent.attackStart || ent.lastAttackTime || ent.attackTime || nowMs;
    const dur = 500;
    attackProgress = Math.min(1, (nowMs - animStart) / dur);
    if (attackProgress >= 1) isAttacking = false;
  }

  // Detect Hit Flash
  let isFlashing = false;
  let flashAmt = 0;
  if (ent.lastHitTime && nowMs - ent.lastHitTime < 160) {
    isFlashing = true;
    flashAmt = Math.max(0, 1 - (nowMs - ent.lastHitTime) / 160);
  }

  // Archetype & Boss Sizing
  const isBoss = type.startsWith("boss_") || type.includes("colossus") || type.includes("leviathan");
  const isDevourer = type.includes("devourer");
  const isNullGazer = type.includes("gazer");
  const isSpawn = type.includes("spawn") || type.includes("larva");

  const baseScale = isBoss ? 2.15 : isSpawn ? 1.05 : isNullGazer ? 1.6 : isDevourer ? 1.75 : 1.65;
  const r = isBoss ? 38 : isSpawn ? 18 : isNullGazer ? 30 : 32;

  // Archetype Spectral Palettes (Pure Lineless Digital Painting)
  let shadowColor = "#05010a";
  let primaryColor = "#1e0836";
  let midColor = "#3b0764";
  let rimColor = "#7e22ce";
  let highlightColor = "#c084fc";
  let coreAccent = "#d946ef";
  let eyeSclera = "#f5d0fe";
  let eyeIris = "#c084fc";
  let eyePupil = "#000000";
  let accretionColor1 = "rgba(192, 132, 252, 0.65)";
  let accretionColor2 = "rgba(217, 70, 239, 0.4)";
  let plateColor = "#0d0417";
  let plateHighlight = "#4a044e";
  let runeGlow = "#f472b6";

  if (isDevourer) {
    shadowColor = "#0a0105";
    primaryColor = "#2b0312";
    midColor = "#4c0519";
    rimColor = "#9f1239";
    highlightColor = "#f43f5e";
    coreAccent = "#fb7185";
    eyeSclera = "#ffe4e6";
    eyeIris = "#e11d48";
    eyePupil = "#1c1917";
    accretionColor1 = "rgba(244, 63, 94, 0.7)";
    accretionColor2 = "rgba(225, 29, 72, 0.4)";
    plateColor = "#18020a";
    plateHighlight = "#881337";
    runeGlow = "#fda4af";
  } else if (isNullGazer) {
    shadowColor = "#030712";
    primaryColor = "#0f172a";
    midColor = "#1e1b4b";
    rimColor = "#312e81";
    highlightColor = "#38bdf8";
    coreAccent = "#00f0ff";
    eyeSclera = "#e0f2fe";
    eyeIris = "#0284c7";
    eyePupil = "#030712";
    accretionColor1 = "rgba(56, 189, 248, 0.75)";
    accretionColor2 = "rgba(129, 140, 248, 0.4)";
    plateColor = "#090d16";
    plateHighlight = "#1e293b";
    runeGlow = "#38bdf8";
  }

  // Harmonic Float & Writhing Kinematics
  const speedMult = isSlowed ? 0.45 : 1.0;
  const floatWave = Math.sin(nowMs * 0.003 * speedMult + seed) * (isBoss ? 4.5 : 3.5);
  const breathPulse = Math.sin(nowMs * 0.0045 * speedMult + seed * 2) * (isBoss ? 2.5 : 1.8);
  const rotWobble = Math.sin(nowMs * 0.002 * speedMult + seed) * 0.06;

  // Attack Phase Dynamics (4-Phase Cataclysm)
  let attackSquashX = 1;
  let attackSquashY = 1;
  let attackLungeX = 0;
  let attackLungeY = 0;
  let attackStretch = 0;
  let coreNovaPulse = 0;

  if (isAttacking) {
    if (attackProgress < 0.28) {
      // Phase 1: Windup Compression (entity pulls back and compresses)
      const p = attackProgress / 0.28;
      const ease = Math.sin(p * Math.PI * 0.5);
      attackSquashX = 1 + ease * 0.18;
      attackSquashY = 1 - ease * 0.22;
      attackLungeX = -Math.cos(facingAngle) * (6 * ease);
      attackLungeY = -Math.sin(facingAngle) * (6 * ease);
      coreNovaPulse = ease * 0.5;
    } else if (attackProgress < 0.65) {
      // Phase 2: Cataclysm Nova & Tendril Strike (lunges forward with elongated tentacles)
      const p = (attackProgress - 0.28) / 0.37;
      const strikePeak = Math.sin(p * Math.PI);
      attackSquashX = 1 - strikePeak * 0.15;
      attackSquashY = 1 + strikePeak * 0.25;
      attackLungeX = Math.cos(facingAngle) * (14 * strikePeak);
      attackLungeY = Math.sin(facingAngle) * (14 * strikePeak);
      attackStretch = strikePeak;
      coreNovaPulse = 1.0 - p * 0.4;
    } else {
      // Phase 3 & 4: Recoil & Harmonic Recovery
      const p = (attackProgress - 0.65) / 0.35;
      const damp = (1 - p) * Math.sin(p * Math.PI * 3);
      attackSquashX = 1 + damp * 0.08;
      attackSquashY = 1 - damp * 0.08;
      coreNovaPulse = (1 - p) * 0.2;
    }
  }

  // Hit Elasticity Distortion
  if (isFlashing) {
    const elastic = Math.sin(flashAmt * Math.PI) * 0.22;
    attackSquashY *= (1 - elastic);
    attackSquashX *= (1 + elastic);
  }

  ctx.save();
  ctx.translate(x + attackLungeX, y + floatWave + attackLungeY);
  ctx.scale(baseScale * attackSquashX, baseScale * attackSquashY);
  ctx.rotate(rotWobble);

  if (isFlashing) {
    ctx.filter = `brightness(${1 + flashAmt * 1.6}) contrast(${1 + flashAmt * 0.6})`;
  }

  // -------------------------------------------------------------
  // 1. COSMIC EVENT HORIZON AMBIENT AURA (No Solid Ground Shadow)
  // Volumetric atmospheric abyssal glow radiating into surrounding space
  // -------------------------------------------------------------
  const auraR = (r * 1.75 + breathPulse + coreNovaPulse * 14);
  const cosmicAura = safeCreateRadialGradient(ctx, 0, 0, r * 0.2, 0, 0, auraR);
  if (cosmicAura) {
    cosmicAura.addColorStop(0, isDevourer ? "rgba(225, 29, 72, 0.45)" : isNullGazer ? "rgba(56, 189, 248, 0.45)" : "rgba(217, 70, 239, 0.42)");
    cosmicAura.addColorStop(0.4, isDevourer ? "rgba(76, 5, 25, 0.25)" : isNullGazer ? "rgba(30, 27, 75, 0.22)" : "rgba(88, 28, 135, 0.22)");
    cosmicAura.addColorStop(0.75, "rgba(9, 1, 18, 0.12)");
    cosmicAura.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = cosmicAura;
    ctx.beginPath();
    ctx.arc(0, 0, auraR, 0, Math.PI * 2);
    ctx.fill();
  }

  // Gravitational Lensing Rings (Expands and contracts rhythmically)
  ctx.save();
  const ringCount = isBoss ? 3 : 2;
  for (let k = 0; k < ringCount; k++) {
    const ringPhase = ((nowMs * 0.0015 * speedMult + k * 0.35 + seed) % 1);
    const ringRadius = r * 0.9 + ringPhase * (r * 0.95);
    const ringAlpha = Math.max(0, (1 - ringPhase) * (isBoss ? 0.38 : 0.25));
    ctx.strokeStyle = isDevourer
      ? `rgba(251, 113, 133, ${ringAlpha})`
      : isNullGazer
      ? `rgba(56, 189, 248, ${ringAlpha})`
      : `rgba(232, 121, 249, ${ringAlpha})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, ringRadius, ringRadius * 0.75, facingAngle * 0.3, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // -------------------------------------------------------------
  // 2. BACKGROUND WRITHING TENTACLES (Layered Behind Core)
  // Deep z-sorting: back tentacles are darker and have atmospheric haze
  // -------------------------------------------------------------
  const totalTentacles = isBoss ? 10 : isSpawn ? 5 : isNullGazer ? 6 : 8;
  const backTentacleCount = Math.floor(totalTentacles * 0.5);

  for (let t = 0; t < backTentacleCount; t++) {
    const tIndex = t;
    const baseAngle = (tIndex / backTentacleCount) * Math.PI + Math.PI; // Top/back hemisphere
    const angleSpread = baseAngle + Math.sin(nowMs * 0.0018 + tIndex) * 0.2;
    const tBaseX = Math.cos(angleSpread) * (r * 0.55);
    const tBaseY = Math.sin(angleSpread) * (r * 0.45) - 2;

    const tLen = (r * 1.55 + Math.sin(tIndex * 2 + seed) * 4);
    const tWaveAmp = 0.07 + (isMoving ? 0.04 : 0);
    const tWavePhase = nowMs * 0.0055 * speedMult + tIndex * 1.3 + seed;

    drawVoidTentacle(ctx, {
      baseX: tBaseX,
      baseY: tBaseY,
      length: tLen,
      baseWidth: isBoss ? 7.5 : 5.0,
      tipWidth: 1.5,
      angle: angleSpread,
      wavePhase: tWavePhase,
      waveAmp: tWaveAmp,
      curviness: 1.1,
      primaryColor: shadowColor,
      shadowColor: "#020005",
      suckerColor: rimColor,
      highlightColor: midColor,
      segments: 12,
      showSuckers: true,
      barbed: isDevourer,
      attackStretch: attackStretch * 0.6
    });
  }

  // -------------------------------------------------------------
  // 3. CENTRAL AMORPHOUS COSMIC BODY MASS (Undulating Lobes)
  // -------------------------------------------------------------
  ctx.save();
  // Multi-lobed organic membrane contour
  const lobeCount = isBoss ? 8 : 6;
  ctx.beginPath();
  for (let i = 0; i <= lobeCount * 3; i++) {
    const a = (i / (lobeCount * 3)) * Math.PI * 2;
    const lobeWobble = Math.sin(a * 4 + nowMs * 0.005 * speedMult + seed) * (r * 0.08)
                     + Math.cos(a * 2 - nowMs * 0.003 * speedMult) * (r * 0.06);
    const rad = r + breathPulse + lobeWobble;
    const lx = Math.cos(a) * rad;
    const ly = Math.sin(a) * (rad * 0.88);
    if (i === 0) ctx.moveTo(lx, ly);
    else ctx.lineTo(lx, ly);
  }
  ctx.closePath();

  // Volumetric Deep Core Radial Gradient
  const bodyGrad = safeCreateRadialGradient(ctx, 0, -r * 0.15, r * 0.1, 0, 0, r * 1.15);
  if (bodyGrad) {
    bodyGrad.addColorStop(0, midColor);
    bodyGrad.addColorStop(0.45, primaryColor);
    bodyGrad.addColorStop(0.85, shadowColor);
    bodyGrad.addColorStop(1, "#020005");
    ctx.fillStyle = bodyGrad;
    ctx.fill();
  }

  // Ethereal rim highlight on top crown
  const rimGrad = safeCreateRadialGradient(ctx, 0, -r * 0.5, r * 0.1, 0, -r * 0.3, r * 0.9);
  if (rimGrad) {
    rimGrad.addColorStop(0, highlightColor);
    rimGrad.addColorStop(0.4, rimColor);
    rimGrad.addColorStop(0.9, "rgba(0,0,0,0)");
    ctx.fillStyle = rimGrad;
    ctx.fill();
  }
  ctx.restore();

  // -------------------------------------------------------------
  // 4. ROTATING ACCRETION DISK & RELATIVISTIC PHOTON RING
  // Swirling plasma filaments orbiting the central event horizon
  // -------------------------------------------------------------
  ctx.save();
  const diskRot = nowMs * 0.0025 * speedMult + seed;
  ctx.rotate(diskRot);

  // Concentric Accretion Disk Spirals
  const armCount = isBoss ? 4 : 3;
  for (let a = 0; a < armCount; a++) {
    const armAngle = (a / armCount) * Math.PI * 2;
    ctx.save();
    ctx.rotate(armAngle);
    ctx.strokeStyle = a % 2 === 0 ? accretionColor1 : accretionColor2;
    ctx.lineWidth = isBoss ? 2.8 : 2.0;
    ctx.lineCap = "round";

    ctx.beginPath();
    for (let st = 0; st <= 20; st++) {
      const prog = st / 20;
      const spiralR = (r * 0.3) + prog * (r * 0.55);
      const spiralTheta = prog * Math.PI * 0.9;
      const sx = Math.cos(spiralTheta) * spiralR;
      const sy = Math.sin(spiralTheta) * spiralR * 0.65;
      if (st === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Orbiting Stardust & Cosmic Motes
  const moteCount = isBoss ? 6 : 4;
  for (let m = 0; m < moteCount; m++) {
    const mAngle = (m / moteCount) * Math.PI * 2 + nowMs * 0.003 * (m % 2 === 0 ? 1 : -1);
    const mDist = r * 0.55 + Math.sin(nowMs * 0.004 + m) * (r * 0.15);
    const mx = Math.cos(mAngle) * mDist;
    const my = Math.sin(mAngle) * (mDist * 0.7);
    ctx.fillStyle = (m % 2 === 0) ? highlightColor : coreAccent;
    ctx.beginPath();
    ctx.arc(mx, my, isBoss ? 2.2 : 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Specular center
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(mx - 0.4, my - 0.4, isBoss ? 0.9 : 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // -------------------------------------------------------------
  // 5. CENTRAL EVENT HORIZON SINGULARITY & ABYSSAL MAW
  // Pitch black gravitational void at core with razor concentric fangs
  // -------------------------------------------------------------
  const singularityR = (isBoss ? 13 : isNullGazer ? 15 : 10) + (coreNovaPulse * 6);
  ctx.save();

  // Outer Luminous Photon Ring
  const photonRing = safeCreateRadialGradient(ctx, 0, 0, singularityR * 0.8, 0, 0, singularityR * 1.55);
  if (photonRing) {
    photonRing.addColorStop(0, coreAccent);
    photonRing.addColorStop(0.35, highlightColor);
    photonRing.addColorStop(0.8, "rgba(59, 7, 100, 0.4)");
    photonRing.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = photonRing;
    ctx.beginPath();
    ctx.arc(0, 0, singularityR * 1.55, 0, Math.PI * 2);
    ctx.fill();
  }

  // Pitch-Black Event Horizon Core
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(0, 0, singularityR, 0, Math.PI * 2);
  ctx.fill();

  // Relativistic Doppler Beaming Rim Arc
  ctx.strokeStyle = highlightColor;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, singularityR * 1.05, -Math.PI * 0.6, Math.PI * 0.2);
  ctx.stroke();

  // Abyssal Razor Fangs / Concentric Mandibles
  if (!isNullGazer) {
    const fangCount = isBoss ? 8 : 6;
    const fangOpen = isAttacking ? (0.7 + attackStretch * 0.5) : (0.4 + Math.sin(nowMs * 0.005) * 0.15);
    ctx.fillStyle = isDevourer ? "#fee2e2" : "#f5d0fe";
    for (let f = 0; f < fangCount; f++) {
      const fAngle = (f / fangCount) * Math.PI * 2 + (nowMs * 0.001);
      const fDist = singularityR * (0.55 + fangOpen * 0.35);
      const fx = Math.cos(fAngle) * fDist;
      const fy = Math.sin(fAngle) * fDist;
      const tipDist = singularityR * 0.35;
      const tx = Math.cos(fAngle) * tipDist;
      const ty = Math.sin(fAngle) * tipDist;

      const perp = fAngle + Math.PI * 0.5;
      const b1x = fx + Math.cos(perp) * 2.5;
      const b1y = fy + Math.sin(perp) * 2.5;
      const b2x = fx - Math.cos(perp) * 2.5;
      const b2y = fy - Math.sin(perp) * 2.5;

      ctx.beginPath();
      ctx.moveTo(b1x, b1y);
      ctx.lineTo(tx, ty);
      ctx.lineTo(b2x, b2y);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.restore();

  // -------------------------------------------------------------
  // 6. FLOATING OBSIDIAN CARAPACE MONOLITH PLATES
  // Anti-gravity segmented armor shards orbiting and protecting core
  // -------------------------------------------------------------
  const plateCount = isBoss ? 5 : isNullGazer ? 3 : 4;
  for (let p = 0; p < plateCount; p++) {
    const plateAngle = (p / plateCount) * Math.PI * 2 + (Math.PI * 0.5);
    const pOrbit = r * 0.95;
    const pBob = Math.sin(nowMs * 0.0035 * speedMult + p * 1.4 + seed) * 3;
    const px = Math.cos(plateAngle) * (pOrbit + pBob);
    const py = Math.sin(plateAngle) * ((pOrbit + pBob) * 0.8) - (p === 0 ? r * 0.25 : 0);

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(plateAngle + Math.PI * 0.5 + Math.sin(nowMs * 0.002 + p) * 0.1);

    const plateW = isBoss ? 16 : 12;
    const plateH = isBoss ? 22 : 16;

    // Jagged Chitin Armor Plate
    ctx.beginPath();
    ctx.moveTo(0, -plateH * 0.6);
    ctx.lineTo(plateW * 0.55, -plateH * 0.2);
    ctx.lineTo(plateW * 0.45, plateH * 0.5);
    ctx.lineTo(0, plateH * 0.6);
    ctx.lineTo(-plateW * 0.45, plateH * 0.5);
    ctx.lineTo(-plateW * 0.55, -plateH * 0.2);
    ctx.closePath();

    const pGrad = ctx.createLinearGradient(-plateW * 0.5, -plateH * 0.5, plateW * 0.5, plateH * 0.5);
    pGrad.addColorStop(0, plateHighlight);
    pGrad.addColorStop(0.5, plateColor);
    pGrad.addColorStop(1, shadowColor);
    ctx.fillStyle = pGrad;
    ctx.fill();

    // Runic Vein Glowing Fissure
    ctx.strokeStyle = runeGlow;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -plateH * 0.4);
    ctx.lineTo(Math.sin(p) * 2, 0);
    ctx.lineTo(0, plateH * 0.35);
    ctx.stroke();

    // Specular edge highlight
    ctx.strokeStyle = highlightColor;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, -plateH * 0.6);
    ctx.lineTo(plateW * 0.55, -plateH * 0.2);
    ctx.stroke();

    ctx.restore();
  }

  // Void Lightning Arcs crackling between plates during attacks or casting
  if (isAttacking || coreNovaPulse > 0.1) {
    ctx.save();
    ctx.strokeStyle = isDevourer ? "#fda4af" : isNullGazer ? "#bae6fd" : "#f0abfc";
    ctx.lineWidth = 1.2;
    const arcCount = isBoss ? 4 : 2;
    for (let a = 0; a < arcCount; a++) {
      const a1 = (a / arcCount) * Math.PI * 2;
      const a2 = a1 + Math.PI * 0.6;
      const x1 = Math.cos(a1) * (r * 0.9);
      const y1 = Math.sin(a1) * (r * 0.7);
      const x2 = Math.cos(a2) * (r * 0.9);
      const y2 = Math.sin(a2) * (r * 0.7);
      const midJitterX = (x1 + x2) * 0.5 + (Math.random() - 0.5) * 8;
      const midJitterY = (y1 + y2) * 0.5 + (Math.random() - 0.5) * 8;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(midJitterX, midJitterY);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // -------------------------------------------------------------
  // 7. ELDRITCH VOID EYES CLUSTERS
  // Tracking pupils, organic eyelids, multi-tone irises, and specular gleam
  // -------------------------------------------------------------
  const eyeTrackX = Math.cos(facingAngle);
  const eyeTrackY = Math.sin(facingAngle);

  if (isNullGazer) {
    // Eldritch Null-Gazer: Colossal All-Seeing Ocular Nucleus
    const eyeRadius = isBoss ? 16 : 13;
    const eyeCenterY = -2;

    // Organic Ocular Sclera with pulsing veins
    const eyeScleraGrad = safeCreateRadialGradient(ctx, 0, eyeCenterY, eyeRadius * 0.2, 0, eyeCenterY, eyeRadius);
    if (eyeScleraGrad) {
      eyeScleraGrad.addColorStop(0, eyeSclera);
      eyeScleraGrad.addColorStop(0.7, "#cbd5e1");
      eyeScleraGrad.addColorStop(1, primaryColor);
      ctx.fillStyle = eyeScleraGrad;
      ctx.beginPath();
      ctx.arc(0, eyeCenterY, eyeRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Iris (Dynamic Color Pulsing)
    const irisR = eyeRadius * 0.62;
    const pupilShiftX = eyeTrackX * (eyeRadius * 0.25);
    const pupilShiftY = eyeTrackY * (eyeRadius * 0.25);
    const irisGrad = safeCreateRadialGradient(ctx, pupilShiftX, eyeCenterY + pupilShiftY, irisR * 0.2, pupilShiftX, eyeCenterY + pupilShiftY, irisR);
    if (irisGrad) {
      irisGrad.addColorStop(0, coreAccent);
      irisGrad.addColorStop(0.55, eyeIris);
      irisGrad.addColorStop(1, shadowColor);
      ctx.fillStyle = irisGrad;
      ctx.beginPath();
      ctx.arc(pupilShiftX, eyeCenterY + pupilShiftY, irisR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Slit / Star Pupil with Dynamic Dilation
    const pupilW = isAttacking ? 2.2 : (3.5 + Math.sin(nowMs * 0.003) * 0.8);
    const pupilH = irisR * 0.85;
    ctx.fillStyle = eyePupil;
    ctx.beginPath();
    ctx.ellipse(pupilShiftX, eyeCenterY + pupilShiftY, pupilW, pupilH, 0, 0, Math.PI * 2);
    ctx.fill();

    // Specular Twin Highlights
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(pupilShiftX - irisR * 0.35, eyeCenterY + pupilShiftY - irisR * 0.35, 2.4, 0, Math.PI * 2);
    ctx.arc(pupilShiftX + irisR * 0.3, eyeCenterY + pupilShiftY + irisR * 0.2, 1.2, 0, Math.PI * 2);
    ctx.fill();

  } else {
    // Void Terror & Astral Devourer: Multiple Watching Eldritch Eyes
    const eyeDefinitions = isBoss ? [
      { x: -r * 0.42, y: -r * 0.32, rad: 5.6, blinkOffset: 0.1 },
      { x: r * 0.42,  y: -r * 0.28, rad: 5.2, blinkOffset: 0.4 },
      { x: -r * 0.25, y: -r * 0.60, rad: 4.8, blinkOffset: 0.7 },
      { x: r * 0.22,  y: -r * 0.62, rad: 4.5, blinkOffset: 0.2 },
      { x: 0,         y: -r * 0.45, rad: 6.2, blinkOffset: 0.9 }, // Central Dominant Eye
      { x: -r * 0.50, y: 0,         rad: 4.2, blinkOffset: 0.5 },
      { x: r * 0.50,  y: 0,         rad: 4.0, blinkOffset: 0.8 },
    ] : [
      { x: -r * 0.38, y: -r * 0.32, rad: 4.8, blinkOffset: 0.1 },
      { x: r * 0.38,  y: -r * 0.30, rad: 4.5, blinkOffset: 0.5 },
      { x: 0,         y: -r * 0.48, rad: 5.4, blinkOffset: 0.8 },
      { x: -r * 0.22, y: -r * 0.15, rad: 3.8, blinkOffset: 0.3 },
      { x: r * 0.22,  y: -r * 0.15, rad: 3.8, blinkOffset: 0.6 },
    ];

    for (let eIdx = 0; eIdx < eyeDefinitions.length; eIdx++) {
      const eye = eyeDefinitions[eIdx];
      // Periodic natural blink
      const blinkCycle = ((nowMs * 0.0012 + eye.blinkOffset * 3 + seed) % 4.5);
      const isBlinking = blinkCycle < 0.18;
      const blinkScale = isBlinking ? (1 - Math.sin((blinkCycle / 0.18) * Math.PI)) : 1;

      ctx.save();
      ctx.translate(eye.x, eye.y);
      ctx.scale(1, Math.max(0.1, blinkScale));

      // Eye Socket Chitin Shadow
      ctx.fillStyle = shadowColor;
      ctx.beginPath();
      ctx.arc(0, 0, eye.rad + 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Sclera
      ctx.fillStyle = eyeSclera;
      ctx.beginPath();
      ctx.arc(0, 0, eye.rad, 0, Math.PI * 2);
      ctx.fill();

      // Iris
      const pShiftX = eyeTrackX * (eye.rad * 0.35);
      const pShiftY = eyeTrackY * (eye.rad * 0.35);
      ctx.fillStyle = eyeIris;
      ctx.beginPath();
      ctx.arc(pShiftX, pShiftY, eye.rad * 0.6, 0, Math.PI * 2);
      ctx.fill();

      // Slit Pupil
      ctx.fillStyle = eyePupil;
      ctx.beginPath();
      ctx.ellipse(pShiftX, pShiftY, eye.rad * 0.18, eye.rad * 0.52, 0, 0, Math.PI * 2);
      ctx.fill();

      // Specular Gleam
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(pShiftX - eye.rad * 0.2, pShiftY - eye.rad * 0.2, eye.rad * 0.22, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // -------------------------------------------------------------
  // 8. FOREGROUND WRITHING TENTACLES (Layered in Front of Core)
  // Reaching, grasping tentacles with higher contrast and bright suckers
  // -------------------------------------------------------------
  const frontTentacleCount = totalTentacles - backTentacleCount;
  for (let f = 0; f < frontTentacleCount; f++) {
    const fIndex = f;
    const baseAngle = (fIndex / (frontTentacleCount - 1 || 1)) * Math.PI * 0.85 + (Math.PI * 0.075); // Bottom/front hemisphere
    const angleSpread = baseAngle + Math.sin(nowMs * 0.0022 + fIndex * 2) * 0.18;
    const tBaseX = Math.cos(angleSpread) * (r * 0.65);
    const tBaseY = Math.sin(angleSpread) * (r * 0.52) + 2;

    const tLen = (r * 1.75 + Math.sin(fIndex * 3 + seed) * 5);
    const tWaveAmp = 0.09 + (isMoving ? 0.05 : 0);
    const tWavePhase = nowMs * 0.006 * speedMult + fIndex * 1.5 + seed;

    drawVoidTentacle(ctx, {
      baseX: tBaseX,
      baseY: tBaseY,
      length: tLen,
      baseWidth: isBoss ? 8.5 : 5.8,
      tipWidth: 1.8,
      angle: angleSpread,
      wavePhase: tWavePhase,
      waveAmp: tWaveAmp,
      curviness: 1.25,
      primaryColor: primaryColor,
      shadowColor: shadowColor,
      suckerColor: coreAccent,
      highlightColor: highlightColor,
      segments: 14,
      showSuckers: true,
      barbed: isDevourer,
      attackStretch: attackStretch
    });
  }

  ctx.restore();
}

if (typeof window !== "undefined") {
  window.drawVoidTerrorEntity = drawVoidTerrorEntity;
  window.triggerVoidDeathExplosion = triggerVoidDeathExplosion;
}
