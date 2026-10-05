// wolves.js - Procedural Lineless Wolf & Canine Entity Renderer
import { computeFastSeed, safeCreateRadialGradient } from './helpers.js';

export function triggerWolfDeathLimbExplosion(ce) {
  if (!ce || ce._limbsExploded) return;
  ce._limbsExploded = true;

  const maxHp = ce.maxHp || 100;
  const hpRatio = ce.hp !== undefined ? Math.max(0, ce.hp / maxHp) : 1;

  const legsCount = ce._lastActiveLegs !== undefined ? ce._lastActiveLegs : (hpRatio < 0.15 ? 1 : hpRatio < 0.40 ? 2 : hpRatio < 0.70 ? 3 : 4);
  const hasTail = ce._lastTailSevered !== undefined ? !ce._lastTailSevered : (hpRatio >= 0.25);

  let bodyColor = "#4b5563";
  let accentColor = "#1f2937";
  let pawLen = 8;
  let w = 22;

  if (ce.type === "wolf_alpha") {
    bodyColor = "#4a4a4a";
    accentColor = "#2c3e50";
    pawLen = 9;
    w = 23;
  } else if (ce.type === "boss_wolf") {
    bodyColor = "#2c3e50";
    accentColor = "#1a252f";
    pawLen = 15;
    w = 38;
  }

  if (typeof spawnParticle === "function") {
    for (let i = 0; i < legsCount; i++) {
      spawnParticle({
        x: ce.x + (Math.random() - 0.5) * 12,
        y: ce.y + (Math.random() - 0.5) * 12,
        vx: (Math.random() - 0.5) * 200,
        vy: -100 - Math.random() * 150,
        color: bodyColor,
        accentColor: accentColor,
        size: pawLen * 1.5,
        maxLife: 2.5,
        drag: 0.94,
        style: "wolf_leg",
        gravity: 250,
        shrink: true,
      });
    }

    if (hasTail) {
      spawnParticle({
        x: ce.x,
        y: ce.y,
        vx: (Math.random() - 0.5) * 200,
        vy: -100 - Math.random() * 150,
        color: bodyColor,
        accentColor: accentColor,
        size: w * 0.4,
        maxLife: 2.5,
        drag: 0.94,
        style: "wolf_tail",
        gravity: 250,
        shrink: true,
      });
    }

    spawnParticle({
      x: ce.x,
      y: ce.y,
      vx: (Math.random() - 0.5) * 150,
      vy: -120 - Math.random() * 120,
      color: bodyColor,
      accentColor: accentColor,
      size: w * 0.5,
      maxLife: 2.5,
      drag: 0.94,
      style: "wolf_head",
      gravity: 250,
      shrink: true,
    });

    for (let b = 0; b < 25; b++) {
      spawnParticle({
        x: ce.x,
        y: ce.y,
        vx: (Math.random() - 0.5) * 160,
        vy: -50 - Math.random() * 120,
        color: ["#991b1b", "#dc2626", "#7f1d1d"],
        size: 2.5 + Math.random() * 3.5,
        maxLife: 1.2 + Math.random() * 0.6,
        drag: 0.93,
        gravity: 150,
        style: "circle",
      });
    }
  }
}

export function drawWolfEntity(ctx, x, y, ent, isShadowPass = false) {
  if (!ent) ent = {};
  const type = ent.type || "wolf";
  const isSlowed = !!ent.isSlowed;
  const angle = (typeof ent.facingAngle === "number" && !isNaN(ent.facingAngle)) ? ent.facingAngle : 0;
  if (ent._seed === undefined) {
    // Bolt Opt: String Allocation Elimination - Replaced parseInt and .substring with zero-allocation computeFastSeed
    ent._seed = computeFastSeed(ent.id);
  }
  const seed = ent._seed;
  const now = performance.now();

  // Archetype Sizing & Visual Scaling
  const isBoss = type === "boss_wolf" || type === "the_wolf_king";
  const isAlpha = type === "wolf_alpha";
  const isDire = type === "dire_wolf";
  const isCorrupted = type === "corrupted_wolf";

  const scale = isBoss ? 2.35 : isDire ? 2.10 : isAlpha ? 2.05 : isCorrupted ? 2.0 : 1.95;

  let w = isBoss ? 30 : isDire ? 22 : isAlpha ? 21 : 20; // body half-length
  let h = isBoss ? 16 : isDire ? 12 : isAlpha ? 11 : 10.5; // body half-width
  let snoutLen = isBoss ? 14 : isDire ? 11 : isAlpha ? 10.5 : 10;
  let earSize = isBoss ? 12 : isDire ? 9 : isAlpha ? 8.5 : 8;
  let pawLen = isBoss ? 11 : isDire ? 8.5 : isAlpha ? 8 : 7.5;

  // Harmonic Archetype Fur Palettes (Pure Lineless Digital Painting)
  let furPrimary = "#475569";   // Timber Wolf: Slate Charcoal
  let furSecondary = "#334155"; // Spine Mantle
  let furUnder = "#64748b";     // Chest / Underbelly
  let furAccent = "#1e293b";    // Deep Shadow
  let furHighlight = "#94a3b8"; // Silver fur glint
  let eyeColor = "#f59e0b";     // Glowing Amber-Gold Eye
  let eyePupil = "#000000";
  let noseColor = "#0f172a";    // Natural Dark Leather Nose (NO RED CLOWN NOSE!)
  let innerEar = "#1e293b";

  if (isDire) {
    furPrimary = "#334155";     // Grizzled Ash-Dark
    furSecondary = "#1e293b";
    furUnder = "#475569";
    furAccent = "#0f172a";
    furHighlight = "#64748b";
    eyeColor = "#38bdf8";       // Piercing Ice Cyan Eye
    noseColor = "#020617";
    innerEar = "#1e293b";
  } else if (isAlpha) {
    furPrimary = "#1e293b";     // Alpha Jet Black & Silver Mane
    furSecondary = "#0f172a";
    furUnder = "#334155";
    furAccent = "#020617";
    furHighlight = "#cbd5e1";   // Frosted Silver Tips
    eyeColor = "#ea580c";       // Blazing Fiery Amber-Orange Eye
    noseColor = "#020617";
    innerEar = "#0f172a";
  } else if (isCorrupted) {
    furPrimary = "#2e1065";     // Abyssal Void Purple
    furSecondary = "#1e1b4b";
    furUnder = "#3b0764";
    furAccent = "#0f051d";
    furHighlight = "#a855f7";   // Void Amethyst Glow
    eyeColor = "#c084fc";       // Eerie Void Fuchsia Eye
    noseColor = "#0f051d";
    innerEar = "#1e1b4b";
  } else if (isBoss) {
    furPrimary = "#182230";     // The Wolf King: Midnight Blue-Black
    furSecondary = "#0c131c";
    furUnder = "#2d3748";
    furAccent = "#05080c";
    furHighlight = "#e2e8f0";   // Royal Silver Highlights
    eyeColor = "#ef4444";       // Fiery Crimson Blood Monarch Eye
    noseColor = "#05080c";
    innerEar = "#0c131c";
  }

  if (isSlowed) {
    furPrimary = "#38bdf8";
    furSecondary = "#0284c7";
    furUnder = "#7dd3fc";
    furAccent = "#0369a1";
    furHighlight = "#bae6fd";
    eyeColor = "#0284c7";
  }

  // --- Dynamic Wounding & Gait System ---
  const maxHp = ent.maxHp || 100;
  const currentHp = ent.hp !== undefined ? ent.hp : maxHp;
  const hpRatio = Math.max(0, Math.min(1, currentHp / maxHp));

  const isTailSevered = hpRatio < 0.25;
  const isTailDamaged = hpRatio < 0.60;
  const isTorsoExposed = hpRatio < 0.40;
  const isTorsoDamaged = hpRatio < 0.80;
  const isHeadScarred = hpRatio < 0.35;
  const isEarTorn = hpRatio < 0.75;

  let activeLegs = 4;
  if (hpRatio < 0.15) {
    activeLegs = 1;
  } else if (hpRatio < 0.40) {
    activeLegs = 2;
  } else if (hpRatio < 0.70) {
    activeLegs = 3;
  }

  const isMoving = !!(ent.isMoving || ent.moving || (ent.vx !== undefined && ent.vy !== undefined && (ent.vx * ent.vx + ent.vy * ent.vy > 25)));

  // -------------------------------------------------------------
  // 1. Ambient Contact Shadow (Ground-Anchored with Soft Occlusion)
  // -------------------------------------------------------------
  if (!isShadowPass) {
    ctx.save();
    const shadowW = w * scale * 0.95;
    const shadowH = h * scale * 0.65;
    const shadowAlpha = 0.36; // Stable alpha to prevent shadow flickering
    ctx.fillStyle = `rgba(5, 12, 10, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(x, y + 2.0, shadowW, shadowH, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner dark core shadow
    ctx.fillStyle = "rgba(0, 4, 2, 0.25)";
    ctx.beginPath();
    ctx.ellipse(x, y + 2.0, shadowW * 0.55, shadowH * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.rotate(angle);

  // Stance tilt and crawl offsets based on wounded leg count
  let bodyTilt = 0;
  let crawlY = 0;
  if (activeLegs === 3) {
    bodyTilt = -0.10;
  } else if (activeLegs === 2) {
    bodyTilt = -0.22;
    crawlY = 2.5;
  } else if (activeLegs === 1) {
    bodyTilt = 0.35;
    crawlY = 5.0;
  }

  ctx.rotate(bodyTilt);
  ctx.translate(0, crawlY);

  // -------------------------------------------------------------
  // 2. Boss & Corrupted Ethereal Auras
  // -------------------------------------------------------------
  if (!isShadowPass) {
    if (isBoss) {
      const pulse = Math.sin(now * 0.004) * 0.18 + 0.82;
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 1.8);
      glow.addColorStop(0, `rgba(220, 38, 38, ${0.30 * pulse})`);
      glow.addColorStop(0.6, `rgba(153, 27, 27, ${0.12 * pulse})`);
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, w * 1.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (isCorrupted) {
      const pulse = Math.sin(now * 0.005) * 0.15 + 0.85;
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 1.6);
      glow.addColorStop(0, `rgba(192, 132, 252, ${0.28 * pulse})`);
      glow.addColorStop(0.6, `rgba(88, 28, 135, ${0.10 * pulse})`);
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, w * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // -------------------------------------------------------------
  // 3. Realistic Digitigrade Paws & Running Quadruped Gait
  // -------------------------------------------------------------
  const animSpeed = activeLegs === 1 ? 0.014 : activeLegs === 2 ? 0.012 : 0.010;
  if (ent._animWalkPhase === undefined) ent._animWalkPhase = seed;
  if (isMoving) {
    ent._animWalkPhase += animSpeed * 16.6;
  }
  const runPhase = ent._animWalkPhase % (Math.PI * 2);
  const legSwing = isMoving ? Math.sin(runPhase) * (pawLen * 0.75) : 0;
  const diagSwing = isMoving ? -Math.sin(runPhase) * (pawLen * 0.75) : 0;

  const drawDetailedPaw = (px, py, swing, isFront = true) => {
    if (isShadowPass) return;
    ctx.save();
    ctx.translate(px + swing, py);

    // Leg Thigh/Shin Muscle - Pure Lineless
    ctx.fillStyle = furAccent;
    ctx.beginPath();
    ctx.ellipse(0, 0, isFront ? 3.4 : 3.8, isFront ? 2.4 : 2.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Paw Foot
    const footSign = py < 0 ? -1 : 1;
    ctx.fillStyle = furSecondary;
    ctx.beginPath();
    ctx.ellipse(isFront ? 1.8 : 1.4, footSign * 0.6, 2.6, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3 Sharp Obsidian Claws
    ctx.fillStyle = "#020617";
    ctx.beginPath();
    ctx.moveTo(3.6, footSign * 0.6 - 1.2);
    ctx.lineTo(5.2, footSign * 0.6 - 0.8);
    ctx.lineTo(3.8, footSign * 0.6 - 0.2);
    ctx.lineTo(5.6, footSign * 0.6);
    ctx.lineTo(3.8, footSign * 0.6 + 0.2);
    ctx.lineTo(5.2, footSign * 0.6 + 0.8);
    ctx.lineTo(3.6, footSign * 0.6 + 1.2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  // Helper for gory severed leg & tail stumps
  const drawGorySeveredStump = (sx, sy, size = 4.5) => {
    ctx.save();
    ctx.fillStyle = "#450a0a";
    ctx.beginPath();
    ctx.arc(sx, sy, size + 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#991b1b";
    ctx.beginPath();
    ctx.arc(sx, sy, size, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.arc(sx, sy, size * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // Front-Right Leg
  if (activeLegs >= 1) {
    drawDetailedPaw(w * 0.45, h * 0.82, legSwing, true);
  }
  // Front-Left Leg
  if (activeLegs >= 2) {
    drawDetailedPaw(w * 0.45, -h * 0.82, diagSwing, true);
  } else {
    drawGorySeveredStump(w * 0.45, -h * 0.82, 4.0);
  }
  // Back-Left Leg
  if (activeLegs >= 3) {
    drawDetailedPaw(-w * 0.55, -h * 0.82, legSwing, false);
  } else {
    drawGorySeveredStump(-w * 0.55, -h * 0.82, 4.2);
  }
  // Back-Right Leg
  if (activeLegs >= 4) {
    drawDetailedPaw(-w * 0.55, h * 0.82, diagSwing, false);
  } else {
    drawGorySeveredStump(-w * 0.55, h * 0.82, 4.2);
  }

  // -------------------------------------------------------------
  // 4. Bushy Segmented Lupine Tail
  // -------------------------------------------------------------
  if (ent._tailPhase === undefined) ent._tailPhase = seed;
  ent._tailPhase += (isMoving ? 0.008 : 0.002) * 16.6;
  const tailAmp = isMoving ? (isTailSevered ? 0.08 : 0.38) : 0.12;
  const tailWag = Math.sin(ent._tailPhase) * tailAmp;
  ctx.save();
  ctx.translate(-w * 0.85, 0);
  ctx.rotate(tailWag);

  if (isTailSevered) {
    drawGorySeveredStump(-2, 0, 4.5);
  } else {
    const tailLen = w * 0.95;
    const tailW = h * 0.55;

    // Tail Base & Bushy Fur Tufts (Pure Lineless Fur Tufts)
    ctx.fillStyle = isTailDamaged ? "#7f1d1d" : furPrimary;
    ctx.beginPath();
    ctx.moveTo(0, -tailW * 0.4);
    ctx.quadraticCurveTo(-tailLen * 0.35, -tailW * 1.1, -tailLen * 0.65, -tailW * 0.8);
    // Jagged Fur Tufts on Tail
    ctx.lineTo(-tailLen * 0.55, -tailW * 0.4);
    ctx.lineTo(-tailLen * 0.85, -tailW * 0.5);
    ctx.lineTo(-tailLen, 0);
    ctx.lineTo(-tailLen * 0.85, tailW * 0.5);
    ctx.lineTo(-tailLen * 0.55, tailW * 0.4);
    ctx.lineTo(-tailLen * 0.65, tailW * 0.8);
    ctx.quadraticCurveTo(-tailLen * 0.35, tailW * 1.1, 0, tailW * 0.4);
    ctx.closePath();
    ctx.fill();

    // Darker Fur Mantle on top of Tail
    ctx.fillStyle = furSecondary;
    ctx.beginPath();
    ctx.moveTo(0, -tailW * 0.3);
    ctx.quadraticCurveTo(-tailLen * 0.4, -tailW * 0.7, -tailLen * 0.75, 0);
    ctx.quadraticCurveTo(-tailLen * 0.4, 0, 0, 0);
    ctx.closePath();
    ctx.fill();

    // Silver/Highlighted Tail Tip
    ctx.fillStyle = furHighlight;
    ctx.beginPath();
    ctx.moveTo(-tailLen * 0.75, -tailW * 0.25);
    ctx.lineTo(-tailLen, 0);
    ctx.lineTo(-tailLen * 0.75, tailW * 0.25);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // -------------------------------------------------------------
  // 5. Muscular Lupine Torso & Jagged Fur Mantle (Pure Lineless Digital Painting)
  // -------------------------------------------------------------
  ctx.fillStyle = furPrimary;

  ctx.beginPath();
  // Neck top
  ctx.moveTo(w * 0.65, -h * 0.65);
  // Shoulder ruff 1 (fur spike)
  ctx.lineTo(w * 0.45, -h * 1.15);
  ctx.lineTo(w * 0.40, -h * 0.85);
  // Shoulder ruff 2
  ctx.lineTo(w * 0.22, -h * 1.25);
  ctx.lineTo(w * 0.18, -h * 0.85);
  // Mid-back
  ctx.lineTo(-w * 0.20, -h * 0.80);
  // Flank / Haunch fur spike
  ctx.lineTo(-w * 0.45, -h * 1.10);
  ctx.lineTo(-w * 0.40, -h * 0.75);
  // Rump / Rear
  ctx.quadraticCurveTo(-w * 0.90, -h * 0.60, -w * 0.90, 0);
  ctx.quadraticCurveTo(-w * 0.90, h * 0.60, -w * 0.40, h * 0.75);
  // Lower flank spike
  ctx.lineTo(-w * 0.45, h * 1.10);
  ctx.lineTo(-w * 0.20, h * 0.80);
  // Mid-belly
  ctx.lineTo(w * 0.18, h * 0.85);
  // Lower shoulder ruff 2
  ctx.lineTo(w * 0.22, h * 1.25);
  ctx.lineTo(w * 0.40, h * 0.85);
  // Lower shoulder ruff 1
  ctx.lineTo(w * 0.45, h * 1.15);
  ctx.lineTo(w * 0.65, h * 0.65);
  // Front chest curve
  ctx.quadraticCurveTo(w * 0.88, 0, w * 0.65, -h * 0.65);
  ctx.closePath();
  ctx.fill();

  // Darker Spine Fur Mantle
  ctx.fillStyle = furSecondary;
  ctx.beginPath();
  ctx.moveTo(w * 0.55, -h * 0.35);
  ctx.quadraticCurveTo(0, -h * 0.55, -w * 0.75, 0);
  ctx.quadraticCurveTo(0, h * 0.55, w * 0.55, h * 0.35);
  ctx.quadraticCurveTo(w * 0.75, 0, w * 0.55, -h * 0.35);
  ctx.closePath();
  ctx.fill();

  // Alpha / Boss Silver Fur Streaks along Spine (Soft Painterly Fur Wisps)
  if (isAlpha || isBoss) {
    ctx.fillStyle = furHighlight;
    ctx.beginPath();
    ctx.ellipse(w * 0.35, -h * 0.30, w * 0.12, h * 0.08, -0.3, 0, Math.PI * 2);
    ctx.ellipse(w * 0.35, h * 0.30, w * 0.12, h * 0.08, 0.3, 0, Math.PI * 2);
    ctx.ellipse(-w * 0.10, -h * 0.22, w * 0.20, h * 0.07, -0.15, 0, Math.PI * 2);
    ctx.ellipse(-w * 0.10, h * 0.22, w * 0.20, h * 0.07, 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  // Soft Underbelly / Chest Fur Accent
  ctx.fillStyle = furUnder;
  ctx.beginPath();
  ctx.ellipse(w * 0.15, 0, w * 0.35, h * 0.30, 0, 0, Math.PI * 2);
  ctx.fill();

  // -------------------------------------------------------------
  // 6. Wolf Head, Snout, Biting Fangs & Natural Leather Nose
  // -------------------------------------------------------------
  const isAttacking = !!(ent.currentCast || ent.isAttacking || (ent.lastAttackTime && now - ent.lastAttackTime < 450));
  let bitePhase = 0;
  if (ent.currentCast && ent.currentCast.duration > 0) {
    const elapsed = Math.max(0, Date.now() - (ent.currentCast.startTime || Date.now()));
    bitePhase = Math.min(1, elapsed / ent.currentCast.duration);
  } else if (isAttacking) {
    bitePhase = (now % 320) / 320;
  }

  const jawOpenAngle = bitePhase > 0 ? Math.sin(bitePhase * Math.PI) * 0.45 : 0;
  const headLungeX = bitePhase > 0 ? Math.sin(bitePhase * Math.PI) * (w * 0.35) : 0;

  ctx.save();
  ctx.translate(w * 0.52 + headLungeX, 0);

  // Wedge-shaped Head with Flared Cheek Ruff Tufts (Lineless)
  ctx.fillStyle = furPrimary;
  ctx.beginPath();
  ctx.moveTo(-w * 0.15, -h * 0.65);
  // Left cheek ruff spike
  ctx.lineTo(w * 0.08, -h * 0.85);
  ctx.lineTo(w * 0.10, -h * 0.45);
  // Snout base
  ctx.lineTo(w * 0.22, -h * 0.30);
  ctx.lineTo(w * 0.22, h * 0.30);
  // Right cheek ruff spike
  ctx.lineTo(w * 0.10, h * 0.45);
  ctx.lineTo(w * 0.08, h * 0.85);
  ctx.lineTo(-w * 0.15, h * 0.65);
  ctx.closePath();
  ctx.fill();

  // Head Top Cap Fur
  ctx.fillStyle = furSecondary;
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.18, h * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();

  // Mouth Interior & Fangs when Biting
  if (jawOpenAngle > 0.03) {
    ctx.fillStyle = "#881337";
    ctx.beginPath();
    ctx.moveTo(w * 0.12, -h * 0.22);
    ctx.lineTo(w * 0.12 + snoutLen * 0.85, -h * 0.10);
    ctx.lineTo(w * 0.12 + snoutLen * 0.85, h * 0.10);
    ctx.lineTo(w * 0.12, h * 0.22);
    ctx.closePath();
    ctx.fill();

    // Tongue
    ctx.fillStyle = "#f43f5e";
    ctx.beginPath();
    ctx.ellipse(w * 0.12 + snoutLen * 0.45, 0, snoutLen * 0.32, h * 0.10, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Lower Jaw (Hinges down during bite - Lineless)
  ctx.save();
  ctx.rotate(jawOpenAngle);
  ctx.fillStyle = furAccent;
  ctx.beginPath();
  ctx.moveTo(w * 0.12, 0);
  ctx.lineTo(w * 0.12 + snoutLen * 0.88, 0);
  ctx.lineTo(w * 0.12 + snoutLen * 0.85, h * 0.18);
  ctx.lineTo(w * 0.12, h * 0.28);
  ctx.closePath();
  ctx.fill();

  // Bottom Razor Fangs (Pure Ivory Lineless)
  if (jawOpenAngle > 0.03) {
    ctx.fillStyle = "#fffbeb";
    ctx.beginPath();
    ctx.moveTo(w * 0.12 + snoutLen * 0.48, 0);
    ctx.lineTo(w * 0.12 + snoutLen * 0.60, -h * 0.28);
    ctx.lineTo(w * 0.12 + snoutLen * 0.70, 0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore(); // Lower jaw

  // Upper Snout (Hinges slightly up during bite - Lineless)
  ctx.save();
  ctx.rotate(-jawOpenAngle);
  ctx.fillStyle = furPrimary;
  ctx.beginPath();
  ctx.moveTo(w * 0.12, -h * 0.32);
  ctx.lineTo(w * 0.12 + snoutLen, -h * 0.18);
  ctx.lineTo(w * 0.12 + snoutLen, 0);
  ctx.lineTo(w * 0.12, 0);
  ctx.closePath();
  ctx.fill();

  // Snout Top Bridge (Dark Fur Streak)
  ctx.fillStyle = furSecondary;
  ctx.beginPath();
  ctx.moveTo(w * 0.12, -h * 0.20);
  ctx.lineTo(w * 0.12 + snoutLen * 0.85, -h * 0.12);
  ctx.lineTo(w * 0.12 + snoutLen * 0.85, 0);
  ctx.lineTo(w * 0.12, 0);
  ctx.closePath();
  ctx.fill();

  // Upper Deadly Canines (Pure Ivory Lineless)
  if (jawOpenAngle > 0.03) {
    ctx.fillStyle = "#fffbeb";
    ctx.beginPath();
    ctx.moveTo(w * 0.12 + snoutLen * 0.52, 0);
    ctx.lineTo(w * 0.12 + snoutLen * 0.65, h * 0.28);
    ctx.lineTo(w * 0.12 + snoutLen * 0.75, 0);
    ctx.closePath();
    ctx.fill();
  }

  // -------------------------------------------------------------
  // Real Leather Wolf Nose (Sharp Natural Dark Leather, Lineless)
  // -------------------------------------------------------------
  const noseX = w * 0.12 + snoutLen;
  const noseY = -h * 0.08;
  const noseW = isBoss ? 3.6 : 2.6;
  const noseH = isBoss ? 2.8 : 2.0;

  ctx.fillStyle = noseColor;
  ctx.beginPath();
  ctx.ellipse(noseX, noseY, noseW, noseH, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dark nostril indentation
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(noseX - 0.3, noseY, noseH * 0.45, 0, Math.PI * 2);
  ctx.fill();

  // Subtle natural specular glint on wet leather nose
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(noseX - noseW * 0.35, noseY - noseH * 0.35, 0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore(); // Upper snout

  // -------------------------------------------------------------
  // Pricked Lupine Ears with Inner Fur Cavity (Lineless)
  // -------------------------------------------------------------
  const drawWolfEar = (isTopSide) => {
    const earSign = isTopSide ? -1 : 1;
    const baseEarY = earSign * h * 0.56;

    ctx.save();
    ctx.fillStyle = furSecondary;

    ctx.beginPath();
    ctx.moveTo(-w * 0.12, baseEarY + earSign * 1.5);
    ctx.lineTo(w * 0.06, baseEarY - earSign * 1.0);
    if ((isTopSide && isEarTorn) || (!isTopSide && isHeadScarred)) {
      // Battle-torn ear notch
      ctx.lineTo(-w * 0.14, baseEarY + earSign * (earSize * 0.6));
      ctx.lineTo(-w * 0.10, baseEarY + earSign * (earSize * 0.4));
      ctx.lineTo(-w * 0.18, baseEarY + earSign * (earSize * 0.3));
    } else {
      ctx.lineTo(-w * 0.18, baseEarY + earSign * earSize);
    }
    ctx.closePath();
    ctx.fill();

    // Inner Ear Shaded Cavity
    ctx.fillStyle = innerEar;
    ctx.beginPath();
    ctx.moveTo(-w * 0.08, baseEarY + earSign * 1.0);
    ctx.lineTo(w * 0.02, baseEarY - earSign * 0.5);
    ctx.lineTo(-w * 0.12, baseEarY + earSign * (earSize * 0.65));
    ctx.closePath();
    ctx.fill();

    // Inner Ear Fur Wisps
    ctx.fillStyle = furHighlight;
    ctx.beginPath();
    ctx.moveTo(-w * 0.06, baseEarY + earSign * 0.5);
    ctx.lineTo(0, baseEarY + earSign * 0.2);
    ctx.lineTo(-w * 0.09, baseEarY + earSign * (earSize * 0.35));
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  drawWolfEar(true);  // Left / Top Ear
  drawWolfEar(false); // Right / Bottom Ear

  // -------------------------------------------------------------
  // Fierce Predatory Glowing Eyes (Lineless)
  // -------------------------------------------------------------
  const drawFierceEye = (ex, ey) => {
    ctx.save();
    // Brow line anatomical shadow fill
    ctx.fillStyle = furAccent;
    ctx.beginPath();
    ctx.ellipse(ex, ey - 1.0, 2.5, 0.7, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Eye socket
    ctx.fillStyle = "#020617";
    ctx.beginPath();
    ctx.ellipse(ex, ey, 2.4, 1.6, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Glowing Iris
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.ellipse(ex, ey, 1.8, 1.1, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Black Slit Pupil
    ctx.fillStyle = eyePupil;
    ctx.beginPath();
    ctx.ellipse(ex, ey, 0.5, 0.95, 0, 0, Math.PI * 2);
    ctx.fill();

    // Specular Reflection
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(ex - 0.5, ey - 0.35, 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  drawFierceEye(w * 0.06, -h * 0.30); // Left Eye
  drawFierceEye(w * 0.06, h * 0.30);  // Right Eye

  // Bite Snap Arc Impact Visuals
  if (jawOpenAngle > 0.15 && !isShadowPass) {
    ctx.save();
    ctx.strokeStyle = isCorrupted ? "#c084fc" : isBoss ? "#ef4444" : "#f59e0b";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(w * 0.12 + snoutLen + 5, 0, 9, -Math.PI * 0.55, Math.PI * 0.55);
    ctx.stroke();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(w * 0.12 + snoutLen + 8, 0, 12, -Math.PI * 0.35, Math.PI * 0.35);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore(); // Head
  ctx.restore(); // Body
}
if (typeof window !== "undefined") {
  window.drawWolfEntity = drawWolfEntity;
}

if (typeof window !== "undefined") {
  window.triggerWolfDeathLimbExplosion = triggerWolfDeathLimbExplosion;
  window.drawWolfEntity = drawWolfEntity;
}
