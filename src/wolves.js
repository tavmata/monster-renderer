// wolves.js - Procedural Lineless Wolf & Canine Entity Renderer
import { computeFastSeed, safeCreateRadialGradient } from './helpers.js';

export function triggerWolfDeathLimbExplosion(ce) {
  if (!ce || ce._limbsExploded) return;
  ce._limbsExploded = true;

  const maxHp = ce.maxHp || 100;
  const hpRatio = ce.hp !== undefined ? Math.max(0, ce.hp / maxHp) : 1;

  const legsCount = ce._lastActiveLegs !== undefined ? ce._lastActiveLegs : (hpRatio < 0.15 ? 1 : hpRatio < 0.40 ? 2 : hpRatio < 0.70 ? 3 : 4);
  const hasTail = ce._lastTailSevered !== undefined ? !ce._lastTailSevered : (hpRatio >= 0.25);

  const type = (ce.type || "").toLowerCase();
  let bodyColor = "#4b5563";
  let accentColor = "#1f2937";
  let pawLen = 8;
  let w = 22;

  if (type === "wolf_alpha" || type === "alpha_wolf" || type.includes("alpha")) {
    bodyColor = "#4a4a4a";
    accentColor = "#2c3e50";
    pawLen = 9;
    w = 23;
  } else if (type === "boss_wolf" || type === "the_wolf_king" || type.startsWith("boss_")) {
    bodyColor = "#2c3e50";
    accentColor = "#1a252f";
    pawLen = 15;
    w = 38;
  } else if (type === "arctic_wolf" || type === "frost_wolf" || type.includes("arctic") || type.includes("white_wolf")) {
    bodyColor = "#e2e8f0";
    accentColor = "#94a3b8";
    pawLen = 8;
    w = 22;
  } else if (type === "corrupted_wolf" || type.includes("corrupted")) {
    bodyColor = "#3b0764";
    accentColor = "#1e1b4b";
    pawLen = 8.5;
    w = 22;
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
  if (isShadowPass) return;
  if (!ent) ent = {};
  const rawType = (ent.type || "wolf").toLowerCase();
  const isSlowed = !!ent.isSlowed;
  const angle = (typeof ent.facingAngle === "number" && !isNaN(ent.facingAngle)) ? ent.facingAngle : 0;
  if (ent._seed === undefined) {
    ent._seed = computeFastSeed(ent.id || "wolf_entity");
  }
  const seed = ent._seed;
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();

  // Archetype Sizing & Visual Scaling
  const isBoss = rawType === "boss_wolf" || rawType === "the_wolf_king" || rawType.startsWith("boss_");
  const isAlpha = rawType === "wolf_alpha" || rawType === "alpha_wolf" || rawType.includes("alpha");
  const isDire = rawType === "dire_wolf" || rawType.includes("dire");
  const isArctic = rawType === "arctic_wolf" || rawType === "frost_wolf" || rawType.includes("arctic") || rawType.includes("white_wolf");
  const isCorrupted = rawType === "corrupted_wolf" || rawType.includes("corrupted");

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
  let noseColor = "#0f172a";    // Natural Dark Leather Nose
  let innerEar = "#1e293b";

  if (isArctic) {
    furPrimary = "#f1f5f9";     // Arctic Glacier White
    furSecondary = "#cbd5e1";   // Frosted Slate Mantle
    furUnder = "#ffffff";       // Snow Chest
    furAccent = "#94a3b8";      // Pale Slate Shadow
    furHighlight = "#ffffff";   // Glacial Sheen
    eyeColor = "#38bdf8";       // Piercing Ice Cyan Eye
    noseColor = "#1e293b";
    innerEar = "#94a3b8";
  } else if (isDire) {
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

  // Dynamic Wounding & Gait System
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

  // Attack State Detection & Progress Computation
  let isAttacking = !!(ent.isAttacking || ent.currentCast);
  if (!isAttacking && typeof GameState !== "undefined" && GameState.combatAnimations && ent && ent.id) {
    for (let i = 0; i < GameState.combatAnimations.length; i++) {
      const anim = GameState.combatAnimations[i];
      const dur = anim.duration || anim.durationMs || 450;
      if (anim.attackerId === ent.id && now - anim.createdAt < dur) {
        isAttacking = true;
        break;
      }
    }
  }
  if (!isAttacking && ent.lastAttackTime && (now - ent.lastAttackTime < 450)) {
    isAttacking = true;
  }
  if (!isAttacking && ent.attackStart && (now - ent.attackStart < 450)) {
    isAttacking = true;
  }

  let attackProgress = 0;
  if (isAttacking) {
    if (ent.currentCast) {
      if (typeof ent.currentCast.progress === "number" && !isNaN(ent.currentCast.progress)) {
        attackProgress = Math.min(1, Math.max(0, ent.currentCast.progress));
      } else if (ent.currentCast.duration > 0) {
        const start = ent.currentCast.startTime || now;
        const currentRef = start > 1e11 ? Date.now() : now;
        const elapsed = Math.max(0, currentRef - start);
        attackProgress = Math.min(1, elapsed / ent.currentCast.duration);
      } else {
        attackProgress = (now % 380) / 380;
      }
    } else {
      let animStart = ent.attackStart || ent.lastAttackTime || ent.attackTime;
      if (!animStart && typeof GameState !== "undefined" && GameState.combatAnimations && ent && ent.id) {
        for (let i = 0; i < GameState.combatAnimations.length; i++) {
          if (GameState.combatAnimations[i].attackerId === ent.id) {
            animStart = GameState.combatAnimations[i].createdAt;
            break;
          }
        }
      }
      if (animStart) {
        const currentRef = animStart > 1e11 ? Date.now() : now;
        const elapsed = Math.max(0, currentRef - animStart);
        attackProgress = Math.min(1, elapsed / 420);
      } else {
        attackProgress = (now % 380) / 380;
      }
    }
  }

  // 3-Phase Wolf Attack Kinematics:
  // Phase 1 (0.00-0.30): Coil back, jaws part wide, ears pin back
  // Phase 2 (0.30-0.62): Explosive whole-body spring forward, jaws snap shut with fangs clamped, strike shockwave
  // Phase 3 (0.62-1.00): Recoil ease-out back to combat stance
  let jawOpenAngle = 0;
  let bodyLungeX = 0;
  let headExtraLungeX = 0;
  let attackEarPin = 0;
  let isSnapStrike = false;

  if (isAttacking && attackProgress > 0) {
    if (attackProgress < 0.30) {
      const t = attackProgress / 0.30;
      bodyLungeX = -t * 3.5;
      jawOpenAngle = t * 0.52;
      attackEarPin = t * 0.40;
    } else if (attackProgress < 0.62) {
      const t = (attackProgress - 0.30) / 0.32;
      const spring = Math.sin(t * Math.PI * 0.5);
      bodyLungeX = -3.5 + spring * (w * 0.40 + 7);
      headExtraLungeX = spring * 4.5;
      attackEarPin = 0.40;
      if (t < 0.45) {
        jawOpenAngle = 0.52 * (1 - t / 0.45 * 0.85);
      } else {
        jawOpenAngle = 0.05 + Math.sin((t - 0.45) / 0.55 * Math.PI) * 0.10;
        isSnapStrike = true;
      }
    } else {
      const t = (attackProgress - 0.62) / 0.38;
      const ease = 1 - Math.sin(t * Math.PI * 0.5);
      bodyLungeX = ease * 6.0;
      headExtraLungeX = ease * 2.0;
      jawOpenAngle = ease * 0.08;
      attackEarPin = ease * 0.20;
    }
  }

  // Walk & Trot Kinematics
  const speedFactor = isSlowed ? 0.5 : 1.0;
  const walkSpeedMult = activeLegs === 1 ? 0.005 : activeLegs === 2 ? 0.007 : activeLegs === 3 ? 0.0085 : 0.010;
  
  let runPhase = 0;
  if (isMoving) {
    if (ent._animWalkPhase !== undefined && typeof ent._animWalkPhase === "number" && !isNaN(ent._animWalkPhase) && ent._animWalkPhase > 0) {
      runPhase = ent._animWalkPhase % (Math.PI * 2);
    } else {
      runPhase = (now * walkSpeedMult * speedFactor + (seed % 100)) % (Math.PI * 2);
      ent._animWalkPhase = runPhase;
    }
  }

  // Organic Idle Cycles (alive breathing, ear twitch, flank expansion)
  const breathCycle = Math.sin(now * 0.003 + seed) * 0.6;
  const flankBreathing = isMoving ? 0 : Math.sin(now * 0.003 + seed) * 0.035;
  const idleEarTwitch = (Math.sin(now * 0.0018 + seed) > 0.90) ? Math.sin(now * 0.025) * 0.14 : 0;

  // Stride Dynamics
  const trotBounce = isMoving ? Math.abs(Math.sin(runPhase)) * 1.6 : breathCycle;
  const spineSway = isMoving ? Math.sin(runPhase) * (activeLegs === 4 ? 1.4 : 2.2) : 0;
  const headBob = isMoving ? -Math.cos(runPhase) * 1.2 : (breathCycle * 0.4);

  // Hit Reaction Flinch
  const hitAge = ent.lastHitTime ? (now - ent.lastHitTime) : 9999;
  let hitRecoilX = 0;
  let hitFlashAlpha = 0;
  if (hitAge >= 0 && hitAge < 180) {
    const t = hitAge / 180;
    hitRecoilX = -Math.sin((1 - t) * Math.PI) * 2.8;
    hitFlashAlpha = (1 - t) * 0.45;
  }

  // Stance tilt and crawl offsets based on wounded leg count
  let bodyTilt = 0;
  let crawlY = 0;
  if (activeLegs === 3) {
    bodyTilt = -0.10 + (isMoving ? Math.sin(runPhase) * 0.06 : 0);
  } else if (activeLegs === 2) {
    bodyTilt = -0.22 + (isMoving ? Math.sin(runPhase) * 0.10 : 0);
    crawlY = 2.5;
  } else if (activeLegs === 1) {
    bodyTilt = 0.35 + (isMoving ? Math.sin(runPhase) * 0.16 : 0);
    crawlY = 5.0;
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.rotate(angle);

  // Apply attack surge, hit flinch recoil, trot bounce and wounded posture
  ctx.translate(bodyLungeX + hitRecoilX, crawlY - trotBounce * 0.3);
  ctx.rotate(bodyTilt);

  // -------------------------------------------------------------
  // Boss & Corrupted Ethereal Auras
  // -------------------------------------------------------------
  if (!isShadowPass) {
    if (isBoss) {
      const pulse = Math.sin(now * 0.004) * 0.18 + 0.82;
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 1.8);
      if (glow) {
        glow.addColorStop(0, `rgba(220, 38, 38, ${0.30 * pulse})`);
        glow.addColorStop(0.6, `rgba(153, 27, 27, ${0.12 * pulse})`);
        glow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, w * 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (isCorrupted) {
      const pulse = Math.sin(now * 0.005) * 0.15 + 0.85;
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 1.6);
      if (glow) {
        glow.addColorStop(0, `rgba(192, 132, 252, ${0.28 * pulse})`);
        glow.addColorStop(0.6, `rgba(88, 28, 135, ${0.10 * pulse})`);
        glow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, w * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // -------------------------------------------------------------
  // Realistic Digitigrade Paws & Quadruped Gait
  // Diagonal pair coordination with foot lift and claw flex
  // -------------------------------------------------------------
  const drawDetailedPaw = (px, py, pawPhase, isFront = true) => {
    if (isShadowPass) return;
    
    let swingX = 0;
    let liftY = 0;
    let pawAngle = 0;
    let footSquash = 1.0;

    if (isMoving) {
      swingX = Math.sin(pawPhase) * (pawLen * 0.85);
      const isSwingPhase = Math.sin(pawPhase) > 0;
      if (isSwingPhase) {
        liftY = -Math.sin(pawPhase) * 2.0;
        pawAngle = Math.cos(pawPhase) * 0.18;
      } else {
        footSquash = 1.05;
      }
    } else if (isAttacking && attackProgress > 0) {
      if (isFront) {
        swingX = headExtraLungeX * 0.5;
      }
    }

    ctx.save();
    ctx.translate(px + swingX, py + liftY);
    ctx.rotate(pawAngle);

    // Leg Thigh/Shin Muscle - Pure Lineless
    ctx.fillStyle = furAccent;
    ctx.beginPath();
    ctx.ellipse(0, 0, (isFront ? 3.4 : 3.8) * footSquash, isFront ? 2.4 : 2.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Paw Foot
    const footSign = py < 0 ? -1 : 1;
    ctx.fillStyle = furSecondary;
    ctx.beginPath();
    ctx.ellipse(isFront ? 1.8 : 1.4, footSign * 0.6, 2.6 * footSquash, 1.8, 0, 0, Math.PI * 2);
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

  // Diagonal Pair Trot Mechanics:
  // Pair 1: Front-Right + Rear-Left (runPhase)
  // Pair 2: Front-Left + Rear-Right (runPhase + Math.PI)
  const phasePair1 = runPhase;
  const phasePair2 = runPhase + Math.PI;

  // Front-Right Leg
  if (activeLegs >= 1) {
    drawDetailedPaw(w * 0.45, h * 0.82, phasePair1, true);
  }
  // Front-Left Leg
  if (activeLegs >= 2) {
    drawDetailedPaw(w * 0.45, -h * 0.82, phasePair2, true);
  } else {
    drawGorySeveredStump(w * 0.45, -h * 0.82, 4.0);
  }
  // Back-Left Leg
  if (activeLegs >= 3) {
    drawDetailedPaw(-w * 0.55, -h * 0.82, phasePair1, false);
  } else {
    drawGorySeveredStump(-w * 0.55, -h * 0.82, 4.2);
  }
  // Back-Right Leg
  if (activeLegs >= 4) {
    drawDetailedPaw(-w * 0.55, h * 0.82, phasePair2, false);
  } else {
    drawGorySeveredStump(-w * 0.55, h * 0.82, 4.2);
  }

  // -------------------------------------------------------------
  // Bushy Segmented Lupine Tail with Organic Wave Dynamics
  // -------------------------------------------------------------
  const tailBasePhase = isMoving ? (runPhase * 0.85) : (now * 0.0025 + seed);
  let tailAmp = isMoving ? (isTailSevered ? 0.08 : 0.34) : 0.14;
  if (isAttacking) {
    tailAmp *= 0.35; // Tail stiffens and bristles straight during lunge
  }
  const tailWag = Math.sin(tailBasePhase) * tailAmp;
  const tailTipLag = Math.sin(tailBasePhase - 0.6) * (tailAmp * 1.35);

  ctx.save();
  ctx.translate(-w * 0.85, spineSway * 0.6);
  ctx.rotate(tailWag);

  if (isTailSevered) {
    drawGorySeveredStump(-2, 0, 4.5);
  } else {
    const tailLen = w * 0.95;
    const tailW = h * 0.55;

    // Tail Base & Bushy Fur Tufts with wave curvature
    ctx.fillStyle = isTailDamaged ? "#7f1d1d" : furPrimary;
    ctx.beginPath();
    ctx.moveTo(0, -tailW * 0.4);
    ctx.quadraticCurveTo(-tailLen * 0.35, -tailW * 1.1 + tailTipLag * 4, -tailLen * 0.65, -tailW * 0.8 + tailTipLag * 7);
    ctx.lineTo(-tailLen * 0.55, -tailW * 0.4 + tailTipLag * 6);
    ctx.lineTo(-tailLen * 0.85, -tailW * 0.5 + tailTipLag * 9);
    ctx.lineTo(-tailLen, tailTipLag * 10);
    ctx.lineTo(-tailLen * 0.85, tailW * 0.5 + tailTipLag * 9);
    ctx.lineTo(-tailLen * 0.55, tailW * 0.4 + tailTipLag * 6);
    ctx.lineTo(-tailLen * 0.65, tailW * 0.8 + tailTipLag * 7);
    ctx.quadraticCurveTo(-tailLen * 0.35, tailW * 1.1 + tailTipLag * 4, 0, tailW * 0.4);
    ctx.closePath();
    ctx.fill();

    // Darker Fur Mantle on top of Tail
    ctx.fillStyle = furSecondary;
    ctx.beginPath();
    ctx.moveTo(0, -tailW * 0.3);
    ctx.quadraticCurveTo(-tailLen * 0.4, -tailW * 0.7 + tailTipLag * 4, -tailLen * 0.75, tailTipLag * 7);
    ctx.quadraticCurveTo(-tailLen * 0.4, tailTipLag * 3, 0, 0);
    ctx.closePath();
    ctx.fill();

    // Silver/Highlighted Tail Tip
    ctx.fillStyle = furHighlight;
    ctx.beginPath();
    ctx.moveTo(-tailLen * 0.75, -tailW * 0.25 + tailTipLag * 7);
    ctx.lineTo(-tailLen, tailTipLag * 10);
    ctx.lineTo(-tailLen * 0.75, tailW * 0.25 + tailTipLag * 7);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // -------------------------------------------------------------
  // Muscular Lupine Torso & Jagged Fur Mantle
  // -------------------------------------------------------------
  ctx.save();
  ctx.scale(1.0, 1.0 + flankBreathing);
  ctx.translate(0, spineSway * 0.3);

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

  // Alpha / Boss / Arctic Silver Fur Streaks along Spine
  if (isAlpha || isBoss || isArctic) {
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

  ctx.restore(); // Torso

  // -------------------------------------------------------------
  // Wolf Head, Snout, Biting Fangs & Natural Leather Nose
  // -------------------------------------------------------------
  ctx.save();
  ctx.translate(w * 0.52 + headExtraLungeX, headBob * 0.5);

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

  // Lower Jaw (Hinges down from snout root)
  ctx.save();
  ctx.translate(w * 0.12, 0);
  ctx.rotate(jawOpenAngle);
  ctx.fillStyle = furAccent;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(snoutLen * 0.88, 0);
  ctx.lineTo(snoutLen * 0.85, h * 0.18);
  ctx.lineTo(0, h * 0.28);
  ctx.closePath();
  ctx.fill();

  // Bottom Razor Fangs (Pure Ivory Lineless)
  if (jawOpenAngle > 0.03) {
    ctx.fillStyle = "#fffbeb";
    ctx.beginPath();
    ctx.moveTo(snoutLen * 0.48, 0);
    ctx.lineTo(snoutLen * 0.60, -h * 0.28);
    ctx.lineTo(snoutLen * 0.70, 0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore(); // Lower jaw

  // Upper Snout (Hinges slightly up from snout root)
  ctx.save();
  ctx.translate(w * 0.12, 0);
  ctx.rotate(-jawOpenAngle * 0.7);
  ctx.fillStyle = furPrimary;
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.32);
  ctx.lineTo(snoutLen, -h * 0.18);
  ctx.lineTo(snoutLen, 0);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();

  // Snout Top Bridge (Dark Fur Streak)
  ctx.fillStyle = furSecondary;
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.20);
  ctx.lineTo(snoutLen * 0.85, -h * 0.12);
  ctx.lineTo(snoutLen * 0.85, 0);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();

  // Upper Deadly Canines (Pure Ivory Lineless)
  if (jawOpenAngle > 0.03) {
    ctx.fillStyle = "#fffbeb";
    ctx.beginPath();
    ctx.moveTo(snoutLen * 0.52, 0);
    ctx.lineTo(snoutLen * 0.65, h * 0.28);
    ctx.lineTo(snoutLen * 0.75, 0);
    ctx.closePath();
    ctx.fill();
  }

  // Real Leather Wolf Nose
  const noseX = snoutLen;
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

  // Pricked Lupine Ears with Inner Fur Cavity & Pinning on attack / twitch
  const drawWolfEar = (isTopSide) => {
    const earSign = isTopSide ? -1 : 1;
    const baseEarY = earSign * h * 0.56;
    const earAngle = (isTopSide ? idleEarTwitch : -idleEarTwitch * 0.5) - attackEarPin;

    ctx.save();
    ctx.translate(-w * 0.05, baseEarY);
    ctx.rotate(earAngle);

    ctx.fillStyle = furSecondary;
    ctx.beginPath();
    ctx.moveTo(-w * 0.07, earSign * 1.5);
    ctx.lineTo(w * 0.11, -earSign * 1.0);
    if ((isTopSide && isEarTorn) || (!isTopSide && isHeadScarred)) {
      ctx.lineTo(-w * 0.09, earSign * (earSize * 0.6));
      ctx.lineTo(-w * 0.05, earSign * (earSize * 0.4));
      ctx.lineTo(-w * 0.13, earSign * (earSize * 0.3));
    } else {
      ctx.lineTo(-w * 0.13, earSign * earSize);
    }
    ctx.closePath();
    ctx.fill();

    // Inner Ear Shaded Cavity
    ctx.fillStyle = innerEar;
    ctx.beginPath();
    ctx.moveTo(-w * 0.03, earSign * 1.0);
    ctx.lineTo(w * 0.07, -earSign * 0.5);
    ctx.lineTo(-w * 0.07, earSign * (earSize * 0.65));
    ctx.closePath();
    ctx.fill();

    // Inner Ear Fur Wisps
    ctx.fillStyle = furHighlight;
    ctx.beginPath();
    ctx.moveTo(-w * 0.01, earSign * 0.5);
    ctx.lineTo(w * 0.05, earSign * 0.2);
    ctx.lineTo(-w * 0.04, earSign * (earSize * 0.35));
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  drawWolfEar(true);  // Left / Top Ear
  drawWolfEar(false); // Right / Bottom Ear

  // Fierce Predatory Glowing Eyes (Lineless)
  const drawFierceEye = (ex, ey) => {
    ctx.save();
    ctx.fillStyle = furAccent;
    ctx.beginPath();
    ctx.ellipse(ex, ey - 1.0, 2.5, 0.7, 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#020617";
    ctx.beginPath();
    ctx.ellipse(ex, ey, 2.4, 1.6, 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.ellipse(ex, ey, 1.8, 1.1, 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = eyePupil;
    ctx.beginPath();
    ctx.ellipse(ex, ey, 0.5, 0.95, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(ex - 0.5, ey - 0.35, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  drawFierceEye(w * 0.06, -h * 0.30); // Left Eye
  drawFierceEye(w * 0.06, h * 0.30);  // Right Eye

  // Bite Snap Arc Impact Visuals
  if ((isSnapStrike || (jawOpenAngle > 0.15 && isAttacking)) && !isShadowPass) {
    ctx.save();
    ctx.strokeStyle = isCorrupted ? "#c084fc" : isBoss ? "#ef4444" : isArctic ? "#38bdf8" : "#f59e0b";
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

  // Hit damage flash overlay
  if (hitFlashAlpha > 0) {
    ctx.save();
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = `rgba(239, 68, 68, ${hitFlashAlpha})`;
    ctx.fillRect(-w * 1.5, -h * 1.5, w * 3, h * 3);
    ctx.restore();
  }

  ctx.restore(); // Body
}

if (typeof window !== "undefined") {
  window.drawWolfEntity = drawWolfEntity;
  window.triggerWolfDeathLimbExplosion = triggerWolfDeathLimbExplosion;
}
