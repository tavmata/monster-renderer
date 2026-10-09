// genericMobs.js - Procedural Generic Mob, Undead, Beast & Boss Renderer
import { computeFastSeed, safeCreateRadialGradient } from './helpers.js';

const HUMANOID_REGEX = /skeleton|undead|knight|archer|soldier|guard|humanoid/i;

function drawProceduralHumanoidMob(ctx, ent, type, mobClass, mobColor, isElite, isBoss, isShadowPass, nowMs, seed) {
  const isSkeleton = type.includes("skeleton") || type.includes("undead");
  const boneColor = isSkeleton ? "#e2e8f0" : mobColor;
  const darkColor = isSkeleton ? "#475569" : "#0f172a";
  const glowColor = isElite ? "#fbbf24" : isSkeleton ? "#34d399" : "#38bdf8";
  const facingAngle = ent.facingAngle || 0;
  const isMoving = !!(ent.moving || ent.isMoving);
  const isAttacking = !!(ent.isAttacking || ent.currentCast);
  const walkPhase = isMoving ? (nowMs * 0.009 + seed) : 0;
  const legSwing = Math.sin(walkPhase) * 4;

  ctx.save();
  ctx.rotate(facingAngle * 0.15);

  if (isShadowPass) {
    ctx.beginPath();
    ctx.ellipse(0, 16, 12, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fill();
    ctx.restore();
    return;
  }

  // Legs
  ctx.fillStyle = isSkeleton ? "#cbd5e1" : darkColor;
  ctx.fillRect(-6 + legSwing * 0.5, 4, 3.5, 12);
  ctx.fillRect(2.5 - legSwing * 0.5, 4, 3.5, 12);

  // Feet
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(-7 + legSwing * 0.5, 14, 5, 3);
  ctx.fillRect(1.5 - legSwing * 0.5, 14, 5, 3);

  // Torso / Ribcage
  ctx.fillStyle = boneColor;
  ctx.beginPath();
  ctx.ellipse(0, -2, 7.5, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  if (isSkeleton) {
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    for (let r = -6; r <= 2; r += 2.5) {
      ctx.beginPath();
      ctx.moveTo(-5, r);
      ctx.lineTo(5, r);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = mobColor;
    ctx.beginPath();
    ctx.moveTo(-6, -8);
    ctx.lineTo(6, -8);
    ctx.lineTo(4, 3);
    ctx.lineTo(-4, 3);
    ctx.closePath();
    ctx.fill();
  }

  // Arms & Weapons
  const swing = isAttacking ? Math.sin((nowMs % 300) / 300 * Math.PI) * 8 : 0;

  // Left Arm (Shield or Bow)
  ctx.save();
  ctx.translate(-8, -4);
  ctx.fillStyle = boneColor;
  ctx.fillRect(-1.5, 0, 3, 8);
  if (mobClass === "ranger") {
    ctx.strokeStyle = "#78350f";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 4, 9, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.stroke();
  } else {
    ctx.fillStyle = isElite ? "#b45309" : "#334155";
    ctx.strokeStyle = isElite ? "#fbbf24" : "#64748b";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(-2, 4, 4.5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  // Right Arm (Sword)
  ctx.save();
  ctx.translate(8, -4 + swing);
  ctx.fillStyle = boneColor;
  ctx.fillRect(-1.5, 0, 3, 8);
  ctx.fillStyle = "#94a3b8";
  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.lineTo(12 + swing, 0 - swing * 1.5);
  ctx.lineTo(14 + swing, -2 - swing * 1.5);
  ctx.lineTo(2, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#d97706";
  ctx.fillRect(-1, 3, 5, 2);
  ctx.restore();

  // Head / Skull
  ctx.save();
  ctx.translate(0, -12);
  ctx.fillStyle = isSkeleton ? "#f1f5f9" : "#475569";
  ctx.strokeStyle = isSkeleton ? "#94a3b8" : "#1e293b";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (!isSkeleton || isElite) {
    ctx.fillStyle = "#334155";
    ctx.beginPath();
    ctx.arc(0, -1.5, 7, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = isElite ? "#f59e0b" : "#dc2626";
    ctx.fillRect(-1.5, -9, 3, 4);
  }

  // Eye Sockets
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.arc(-2.5, 0, 1.6, 0, Math.PI * 2);
  ctx.arc(2.5, 0, 1.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = glowColor;
  ctx.beginPath();
  ctx.arc(-2.5, 0, 0.8, 0, Math.PI * 2);
  ctx.arc(2.5, 0, 0.8, 0, Math.PI * 2);
  ctx.fill();

  if (isSkeleton) {
    ctx.fillStyle = "#64748b";
    ctx.fillRect(-2, 3.5, 4, 1.2);
  }
  ctx.restore();

  ctx.restore();
}

export function drawGenericMob(ctx, x, y, ent, isShadowPass = false) {
  const type = ent.type || "monster";
  if (ent._seed === undefined) {
    // Bolt Opt: String Allocation Elimination - Replaced parseInt and .substring with zero-allocation computeFastSeed
    ent._seed = computeFastSeed(ent.id);
  }
  const seed = ent._seed;
  const isBoss = /^boss_/.test(type);
  const isElite = /^elite_/.test(type);

  // Retrieve Visual Effects (Hit Flash, Knockback)
  let kbX = 0;
  let kbY = 0;
  let isFlashing = false;
  let flashAmt = 0;
  const nowMs = performance.now();
  const now = nowMs;

  const entId = ent ? ent.id : null;
  if (typeof visualHitEffects !== "undefined" && entId) {
    const fx = visualHitEffects.get(entId);
    if (fx) {
      kbX = fx.knockbackX;
      kbY = fx.knockbackY;
      
      // Decay knockback
      fx.knockbackX *= 0.78;
      fx.knockbackY *= 0.78;
      if (Math.abs(fx.knockbackX) < 0.05) fx.knockbackX = 0;
      if (Math.abs(fx.knockbackY) < 0.05) fx.knockbackY = 0;

      if (nowMs - fx.hitFlashTime < 150) {
        isFlashing = true;
        flashAmt = Math.max(0, 1 - (nowMs - fx.hitFlashTime) / 150);
      }
    }
  }

  // Calculate movement walking squash and stretch, elastic hit distortion, or organic idle breathing
  const isMoving = !!(ent && (ent.moving || ent.isMoving));
  let squashX = 1;
  let squashY = 1;
  if (isFlashing) {
    const elasticHit = Math.sin(flashAmt * Math.PI) * 0.22;
    squashY = 1 - elasticHit;
    squashX = 1 + elasticHit;
  } else if (isMoving) {
    const walkPhase = (nowMs * 0.009 + seed) % (Math.PI * 2);
    const walkWave = Math.cos(walkPhase * 2);
    squashY = 1 + walkWave * 0.06;
    squashX = 1 - walkWave * 0.04;
  } else {
    const breath = Math.sin(nowMs / 380 + seed) * 0.022;
    squashY = 1 + breath;
    squashX = 1 - breath * 0.7;
  }

  ctx.save();
  ctx.translate(x + kbX, y + kbY);
  ctx.scale(2, 2);

  if (isFlashing && !isShadowPass) {
    ctx.filter = `brightness(${1 + flashAmt * 1.5}) contrast(${1 + flashAmt * 0.5})`;
  }

  if (squashX !== 1 || squashY !== 1) {
    ctx.scale(squashX, squashY);
  }

  // Breathing / Bounce animation
  const bounce = Math.sin(nowMs / 200 + seed) * (isBoss ? 2 : 1.5);
  ctx.translate(0, bounce);

  // 1. Boss Golden Aura Glow (No duplicate black shadow)
  let auraRadius = isBoss ? 35 : isElite ? 22 : 16;

  if (isBoss) {
    const pulse = Math.sin(nowMs / 250) * 0.2 + 0.8;
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, auraRadius * 1.8);
    glow.addColorStop(0, `rgba(241, 196, 15, ${0.4 * pulse})`);
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, auraRadius * 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Mob category specific drawings
  if (type.includes("rat")) {
    const r = isBoss ? 26 : 14;
    const moveWave = Math.sin(now * 0.016 + seed);

    if (isShadowPass) {
      ctx.beginPath();
      ctx.ellipse(0, 10, r * 1.1, r * 0.45, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.fill();
    } else {
      // Ground Shadow
      ctx.beginPath();
      ctx.ellipse(0, 10, r * 1.1, r * 0.45, 0, 0, Math.PI * 2);
      ctx.fillStyle = isBoss ? "rgba(74, 4, 78, 0.35)" : "rgba(0, 0, 0, 0.28)";
      ctx.fill();

      // Boss Noxious Miasma Aura
      if (isBoss) {
        const miasmaGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 1.7);
        miasmaGrad.addColorStop(0, "rgba(132, 204, 22, 0.35)");
        miasmaGrad.addColorStop(0.6, "rgba(88, 28, 135, 0.2)");
        miasmaGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = miasmaGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.7, 0, Math.PI * 2);
        ctx.fill();

        // Floating green poison motes
        for (let p = 0; p < 3; p++) {
          const pCycle = (now * 0.03 + p * 30 + seed * 5) % 40;
          const pY = 4 - pCycle * 0.6;
          const pX = Math.sin(now * 0.007 + p * 2.5) * (r * 0.8);
          ctx.fillStyle = `rgba(163, 230, 53, ${Math.max(0, 1 - pCycle / 38)})`;
          ctx.beginPath();
          ctx.arc(pX, pY, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 4 Scuttling Feet
      ctx.fillStyle = isBoss ? "#2e1065" : "#475569";
      const footOffset = isMoving ? moveWave * 3.5 : 0;
      ctx.fillRect(-r * 0.6 - footOffset, 6, 4, 3);
      ctx.fillRect(-r * 0.3 + footOffset, 6, 4, 3);
      ctx.fillRect(r * 0.2 - footOffset, 6, 4, 3);
      ctx.fillRect(r * 0.5 + footOffset, 6, 4, 3);

      // Sinuous Whip Tail
      ctx.beginPath();
      ctx.moveTo(-r * 0.75, 2);
      ctx.quadraticCurveTo(
        -r * 1.4,
        Math.sin(now * 0.008 + seed) * 10 - 2,
        -r * 1.9,
        Math.cos(now * 0.008 + seed) * 8 + 3
      );
      ctx.strokeStyle = isBoss ? "#a855f7" : "#94a3b8";
      ctx.lineWidth = isBoss ? 2.5 : 1.6;
      ctx.lineCap = "round";
      ctx.stroke();

      // Arched Fur Body
      ctx.save();
      const bodyGrad = ctx.createRadialGradient(0, -2, 2, 0, 0, r * 1.1);
      if (isBoss) {
        bodyGrad.addColorStop(0, "#581c87");
        bodyGrad.addColorStop(0.7, "#3b0764");
        bodyGrad.addColorStop(1, "#1e0438");
      } else {
        bodyGrad.addColorStop(0, "#475569");
        bodyGrad.addColorStop(0.7, "#334155");
        bodyGrad.addColorStop(1, "#1e293b");
      }
      ctx.fillStyle = bodyGrad;
      ctx.strokeStyle = isBoss ? "#7e22ce" : "#0f172a";
      ctx.lineWidth = 1.8;

      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.9, r * 0.65, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Toxic Pustules (for Boss Rat)
      if (isBoss) {
        const pustules = [
          { x: -r * 0.3, y: -r * 0.45, rad: 4.5 },
          { x: 0, y: -r * 0.55, rad: 5.5 },
          { x: r * 0.35, y: -r * 0.35, rad: 4 },
        ];
        for (const pst of pustules) {
          const pulse = Math.sin(now * 0.006 + pst.x) * 1;
          ctx.beginPath();
          ctx.arc(pst.x, pst.y, pst.rad + pulse, 0, Math.PI * 2);
          ctx.fillStyle = "#84cc16";
          ctx.fill();
          ctx.strokeStyle = "#4d7c0f";
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(pst.x - 1, pst.y - 1, (pst.rad + pulse) * 0.35, 0, Math.PI * 2);
          ctx.fillStyle = "#d9f99d";
          ctx.fill();
        }
      }

      // Head & Snout
      ctx.beginPath();
      ctx.ellipse(r * 0.65, 0, r * 0.45, r * 0.38, 0.15, 0, Math.PI * 2);
      ctx.fillStyle = isBoss ? "#3b0764" : "#334155";
      ctx.fill();
      ctx.stroke();

      // Twitching Whiskers
      ctx.strokeStyle = "rgba(226, 232, 240, 0.75)";
      ctx.lineWidth = 0.8;
      const wTwitch = Math.sin(now * 0.015 + seed) * 1.5;
      ctx.beginPath();
      ctx.moveTo(r * 0.8, 1);
      ctx.lineTo(r * 1.25, -2 + wTwitch);
      ctx.moveTo(r * 0.8, 2);
      ctx.lineTo(r * 1.25, 4 - wTwitch);
      ctx.stroke();

      // Sharp Incisor Teeth
      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.fillRect(r * 0.85, 3, 2, 2.5);
      ctx.fillRect(r * 0.95, 3, 2, 2.5);

      // Ears
      ctx.beginPath();
      ctx.ellipse(r * 0.4, -r * 0.5, r * 0.28, r * 0.35, 0.3, 0, Math.PI * 2);
      ctx.fillStyle = isBoss ? "#2e1065" : "#1e293b";
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(r * 0.4, -r * 0.5, r * 0.15, r * 0.2, 0.3, 0, Math.PI * 2);
      ctx.fillStyle = isBoss ? "#701a75" : "#475569";
      ctx.fill();

      // Glowing Eyes
      ctx.fillStyle = isBoss ? "#ef4444" : "#dc2626";
      ctx.beginPath();
      ctx.arc(r * 0.7, -r * 0.15, isBoss ? 2.8 : 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fef08a";
      ctx.beginPath();
      ctx.arc(r * 0.7 + 0.5, -r * 0.15, isBoss ? 1.2 : 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Rat King Crown
      if (isBoss) {
        ctx.fillStyle = "#d97706";
        ctx.strokeStyle = "#78350f";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(r * 0.35, -r * 0.65);
        ctx.lineTo(r * 0.45, -r * 1.05);
        ctx.lineTo(r * 0.55, -r * 0.75);
        ctx.lineTo(r * 0.65, -r * 1.1);
        ctx.lineTo(r * 0.75, -r * 0.65);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
  } else if (type.includes("troll")) {
    drawFrostTrollEntity(ctx, 0, 0, ent || { type }, isShadowPass);
  } else if (type === "magma_elemental" || type.includes("magma")) {
    const r = 20;
    const pulse = Math.sin(now * 0.005 + seed) * 3;
    const rot = now * 0.0025 + seed;
    const revRot = -now * 0.0018 + seed;

    if (isShadowPass) {
      ctx.beginPath();
      ctx.ellipse(0, 16, r * 1.1, r * 0.45, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fill();
    } else {
      // Fiery Ground Shadow / Lava Pool
      ctx.beginPath();
      ctx.ellipse(0, 16, r * 1.1, r * 0.45, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(220, 38, 38, 0.25)";
      ctx.fill();

      // Heatwave Aura Glow
      const glowGrad = ctx.createRadialGradient(0, -2, 2, 0, -2, r * 1.8 + pulse);
      glowGrad.addColorStop(0, "rgba(255, 235, 59, 0.55)");
      glowGrad.addColorStop(0.35, "rgba(255, 87, 34, 0.4)");
      glowGrad.addColorStop(0.7, "rgba(213, 0, 0, 0.15)");
      glowGrad.addColorStop(1, "rgba(213, 0, 0, 0)");
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, -2, r * 1.8 + pulse, 0, Math.PI * 2);
      ctx.fill();

      // Rising Spark Embers
      for (let e = 0; e < 4; e++) {
        const emberCycle = (now * 0.04 + e * 45 + seed * 10) % 60;
        const emberY = 6 - emberCycle * 0.5;
        const emberX = Math.sin(now * 0.006 + e * 2 + seed) * (10 - emberCycle * 0.12);
        const emberAlpha = Math.max(0, 1 - emberCycle / 55);
        ctx.fillStyle = `rgba(255, 215, 0, ${emberAlpha})`;
        ctx.fillRect(emberX - 1, emberY - 1, 2, 2);
      }

      // Orbiting Jagged Obsidian Crust Shards
      ctx.save();
      ctx.translate(0, -2);
      ctx.rotate(revRot);
      const shardCount = 4;
      for (let s = 0; s < shardCount; s++) {
        ctx.rotate((Math.PI * 2) / shardCount);
        ctx.beginPath();
        ctx.moveTo(-4, -r * 1.25);
        ctx.lineTo(0, -r * 1.55);
        ctx.lineTo(4, -r * 1.25);
        ctx.lineTo(0, -r * 1.05);
        ctx.closePath();
        ctx.fillStyle = "#1e293b";
        ctx.fill();
        ctx.strokeStyle = "#ff6d00";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Glowing fissure vein in shard
        ctx.beginPath();
        ctx.moveTo(0, -r * 1.45);
        ctx.lineTo(0, -r * 1.15);
        ctx.strokeStyle = "#ffea00";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
      ctx.restore();

      // Rotating Molten Core (Hexagonal Flame Crystal)
      ctx.save();
      ctx.translate(0, -2);
      ctx.rotate(rot);
      const coreGrad = ctx.createLinearGradient(-r, -r, r, r);
      coreGrad.addColorStop(0, "#ff1744");
      coreGrad.addColorStop(0.45, "#ff6d00");
      coreGrad.addColorStop(0.85, "#ffea00");
      coreGrad.addColorStop(1, "#fff59d");
      ctx.fillStyle = coreGrad;
      ctx.strokeStyle = "#ffe082";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const dist = (i % 2 === 0) ? r * 0.95 : r * 0.75;
        const px = Math.cos(a) * dist;
        const py = Math.sin(a) * dist;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Incandescent Inner Plasma Flare
      ctx.beginPath();
      ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 234, 0, 0.4)";
      ctx.fill();
      ctx.restore();
    }
  } else if (type === "ice_elemental" || (type.includes("elemental") && !type.includes("magma"))) {
    const r = 20;
    const pulse = Math.sin(now * 0.005 + seed) * 2.5;
    const rot = now * 0.0022 + seed;
    const revRot = -now * 0.0016 + seed;

    if (isShadowPass) {
      ctx.beginPath();
      ctx.ellipse(0, 16, r * 1.1, r * 0.45, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fill();
    } else {
      // Ground Frost Pool
      ctx.beginPath();
      ctx.ellipse(0, 16, r * 1.1, r * 0.45, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(56, 189, 248, 0.22)";
      ctx.fill();

      // Freezing Blizzard Radial Aura Glow
      const frostGlow = ctx.createRadialGradient(0, -2, 2, 0, -2, r * 1.8 + pulse);
      frostGlow.addColorStop(0, "rgba(224, 242, 254, 0.65)");
      frostGlow.addColorStop(0.35, "rgba(56, 189, 248, 0.4)");
      frostGlow.addColorStop(0.7, "rgba(2, 132, 199, 0.15)");
      frostGlow.addColorStop(1, "rgba(2, 132, 199, 0)");
      ctx.fillStyle = frostGlow;
      ctx.beginPath();
      ctx.arc(0, -2, r * 1.8 + pulse, 0, Math.PI * 2);
      ctx.fill();

      // Floating Snowflake Particles
      for (let s = 0; s < 4; s++) {
        const sCycle = (now * 0.035 + s * 45 + seed * 8) % 55;
        const sY = 6 - sCycle * 0.55;
        const sX = Math.sin(now * 0.005 + s * 2 + seed) * (11 - sCycle * 0.14);
        const sAlpha = Math.max(0, 1 - sCycle / 50);
        ctx.fillStyle = `rgba(224, 242, 254, ${sAlpha})`;
        ctx.fillRect(sX - 1, sY - 1, 2, 2);
      }

      // Orbiting Glacial Diamond Shards
      ctx.save();
      ctx.translate(0, -2);
      ctx.rotate(revRot);
      const shardCount = 4;
      for (let s = 0; s < shardCount; s++) {
        ctx.rotate((Math.PI * 2) / shardCount);
        ctx.beginPath();
        ctx.moveTo(0, -r * 1.55);
        ctx.lineTo(3.5, -r * 1.25);
        ctx.lineTo(0, -r * 1.05);
        ctx.lineTo(-3.5, -r * 1.25);
        ctx.closePath();
        ctx.fillStyle = "rgba(186, 230, 253, 0.9)";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();

      // Rotating Faceted Glacial Diamond Core
      ctx.save();
      ctx.translate(0, -2);
      ctx.rotate(rot);
      const coreGrad = ctx.createLinearGradient(-r, -r, r, r);
      coreGrad.addColorStop(0, "#0284c7");
      coreGrad.addColorStop(0.4, "#0ea5e9");
      coreGrad.addColorStop(0.8, "#7dd3fc");
      coreGrad.addColorStop(1, "#f0f9ff");
      ctx.fillStyle = coreGrad;
      ctx.strokeStyle = "#e0f2fe";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const dist = (i % 2 === 0) ? r * 0.95 : r * 0.75;
        const px = Math.cos(a) * dist;
        const py = Math.sin(a) * dist;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Inner White-Hot Crystalline Frost Nucleus
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(224, 242, 254, 0.45)";
      ctx.fill();
      ctx.restore();
    }
  } else if (type.includes("weaver") || type.includes("spider")) {
    const r = 30;
    const walkPhase = isMoving ? (nowMs * 0.01 + seed) : (nowMs * 0.002 + seed);
    const breathe = Math.sin(nowMs * 0.004 + seed) * 1.5;

    if (isShadowPass) {
      ctx.beginPath();
      ctx.ellipse(0, 16, r * 1.3, r * 0.7, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fill();
    } else {
      // Arcane Web Shadow Aura
      ctx.beginPath();
      ctx.ellipse(0, 16, r * 1.3, r * 0.7, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(168, 85, 247, 0.2)";
      ctx.fill();

      // Crystalline Spider Legs (4 pairs)
      ctx.save();
      for (let side of [-1, 1]) {
        for (let i = 0; i < 4; i++) {
          const legPhase = walkPhase + i * 0.8 + (side === -1 ? Math.PI : 0);
          const legLift = isMoving ? Math.sin(legPhase) * 6 : 0;
          const legSpread = (i - 1.5) * 8;

          const rootX = side * 10;
          const rootY = legSpread - 2;
          const kneeX = side * (24 + (3 - i) * 3);
          const kneeY = legSpread - 12 - Math.max(0, legLift);
          const tipX = side * (32 + (3 - i) * 4);
          const tipY = legSpread + 16 - Math.max(0, legLift);

          ctx.beginPath();
          ctx.moveTo(rootX, rootY);
          ctx.lineTo(kneeX, kneeY);
          ctx.lineTo(tipX, tipY);
          ctx.strokeStyle = "#c084fc";
          ctx.lineWidth = 2.4;
          ctx.lineCap = "round";
          ctx.stroke();

          // Knee crystal facet
          ctx.beginPath();
          ctx.arc(kneeX, kneeY, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = "#f0abfc";
          ctx.fill();
        }
      }

      // Faceted Gemstone Abdomen
      const abdoGrad = ctx.createRadialGradient(0, 8 + breathe, 2, 0, 8 + breathe, 16);
      abdoGrad.addColorStop(0, "#e879f9");
      abdoGrad.addColorStop(0.5, "#a855f7");
      abdoGrad.addColorStop(1, "#581c87");
      ctx.fillStyle = abdoGrad;
      ctx.strokeStyle = "#f5d0fe";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(0, 8 + breathe, 14, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Facet Lines across Abdomen
      ctx.strokeStyle = "rgba(245, 208, 254, 0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-10, 4 + breathe);
      ctx.lineTo(0, 18 + breathe);
      ctx.lineTo(10, 4 + breathe);
      ctx.moveTo(0, -6 + breathe);
      ctx.lineTo(0, 24 + breathe);
      ctx.stroke();

      // Carapace / Thorax
      ctx.fillStyle = "#3b0764";
      ctx.strokeStyle = "#d8b4fe";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, -6 + breathe * 0.5, 11, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Front Pedipalps / Mandibles
      ctx.fillStyle = "#e879f9";
      ctx.beginPath();
      ctx.moveTo(-6, -14 + breathe * 0.5);
      ctx.lineTo(-9, -21 + breathe * 0.5);
      ctx.lineTo(-4, -17 + breathe * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(6, -14 + breathe * 0.5);
      ctx.lineTo(9, -21 + breathe * 0.5);
      ctx.lineTo(4, -17 + breathe * 0.5);
      ctx.closePath();
      ctx.fill();

      // Cluster of 6 Radiant Eyes
      ctx.fillStyle = "#f43f5e";
      const eyeCoords = [
        [-4, -12], [4, -12],
        [-6, -9], [6, -9],
        [-2, -8], [2, -8]
      ];
      for (const [ex, ey] of eyeCoords) {
        ctx.beginPath();
        ctx.arc(ex, ey + breathe * 0.5, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  } else if (type.includes("frost_giant")) {
    const r = 36;
    const breathe = Math.sin(now * 0.003 + seed) * 2;

    if (isShadowPass) {
      ctx.beginPath();
      ctx.ellipse(0, 20, r * 1.3, r * 0.55, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fill();
    } else {
      // Blizzard Ground Rune Circle
      ctx.save();
      ctx.translate(0, 20);
      const runeAngle = now * 0.001;
      ctx.rotate(runeAngle);
      ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.2, 0, Math.PI * 2);
      ctx.stroke();
      for (let k = 0; k < 4; k++) {
        ctx.rotate(Math.PI / 2);
        ctx.fillRect(-2, -r * 1.25, 4, 6);
      }
      ctx.restore();

      ctx.save();
      // Runic Torso
      const titanGrad = ctx.createLinearGradient(-r, -r, r, r);
      titanGrad.addColorStop(0, "#0369a1");
      titanGrad.addColorStop(0.5, "#075985");
      titanGrad.addColorStop(1, "#0c4a6e");
      ctx.fillStyle = titanGrad;
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(-r * 0.9, r * 0.7);
      ctx.lineTo(-r * 1.1, -r * 0.4);
      ctx.lineTo(-r * 0.5, -r * 0.9 + breathe * 0.5);
      ctx.lineTo(r * 0.5, -r * 0.9 + breathe * 0.5);
      ctx.lineTo(r * 1.1, -r * 0.4);
      ctx.lineTo(r * 0.9, r * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glowing Chest Rune
      ctx.strokeStyle = "#bae6fd";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.6 + breathe * 0.5);
      ctx.lineTo(-8, -r * 0.2 + breathe * 0.5);
      ctx.lineTo(0, r * 0.2 + breathe * 0.5);
      ctx.lineTo(8, -r * 0.2 + breathe * 0.5);
      ctx.closePath();
      ctx.stroke();

      // Colossal Frozen Club
      ctx.fillStyle = "#1e293b";
      ctx.strokeStyle = "#7dd3fc";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(-r * 1.2, -r * 1.3, 10, 42);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#e0f2fe";
      ctx.fillRect(-r * 1.35, -r * 1.2, 5, 6);
      ctx.fillRect(-r * 1.35, -r * 0.8, 5, 6);

      // Titan Bearded Head
      ctx.fillStyle = "#0284c7";
      ctx.strokeStyle = "#082f49";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -r * 0.65 + breathe * 0.4, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Frozen Icicle Beard
      ctx.fillStyle = "#e0f2fe";
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-12, -r * 0.55 + breathe * 0.4);
      ctx.lineTo(-8, -r * 0.15 + breathe * 0.4);
      ctx.lineTo(-4, -r * 0.35 + breathe * 0.4);
      ctx.lineTo(0, -r * 0.05 + breathe * 0.4);
      ctx.lineTo(4, -r * 0.35 + breathe * 0.4);
      ctx.lineTo(8, -r * 0.15 + breathe * 0.4);
      ctx.lineTo(12, -r * 0.55 + breathe * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Horned Permafrost Crown
      ctx.fillStyle = "#38bdf8";
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-14, -r * 0.8 + breathe * 0.4);
      ctx.lineTo(-20, -r * 1.2 + breathe * 0.4);
      ctx.lineTo(-8, -r * 0.95 + breathe * 0.4);
      ctx.lineTo(0, -r * 1.35 + breathe * 0.4);
      ctx.lineTo(8, -r * 0.95 + breathe * 0.4);
      ctx.lineTo(20, -r * 1.2 + breathe * 0.4);
      ctx.lineTo(14, -r * 0.8 + breathe * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cyan Eyes
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(-5, -r * 0.72 + breathe * 0.4, 3, 0, Math.PI * 2);
      ctx.arc(5, -r * 0.72 + breathe * 0.4, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#00f0ff";
      ctx.beginPath();
      ctx.arc(-5, -r * 0.72 + breathe * 0.4, 1.8, 0, Math.PI * 2);
      ctx.arc(5, -r * 0.72 + breathe * 0.4, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  } else if (type.includes("golem")) {
    const r = 34;
    const breathe = Math.sin(now * 0.0035 + seed) * 1.5;

    if (isShadowPass) {
      ctx.beginPath();
      ctx.ellipse(0, 18, r * 1.25, r * 0.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fill();
    } else {
      // Lava Pool Shadow
      ctx.beginPath();
      ctx.ellipse(0, 18, r * 1.25, r * 0.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(220, 38, 38, 0.35)";
      ctx.fill();

      ctx.save();
      // Main Basalt Monolith Torso
      ctx.fillStyle = "#18181b";
      ctx.strokeStyle = "#ff4500";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.rect(-r * 0.75, -r * 0.75 + breathe * 0.4, r * 1.5, r * 1.4);
      ctx.fill();
      ctx.stroke();

      // Glowing Magma Fissure Lines
      ctx.strokeStyle = "#ff9100";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-r * 0.65, -r * 0.4 + breathe * 0.4);
      ctx.lineTo(0, -r * 0.1 + breathe * 0.4);
      ctx.lineTo(r * 0.65, -r * 0.5 + breathe * 0.4);
      ctx.moveTo(0, -r * 0.1 + breathe * 0.4);
      ctx.lineTo(0, r * 0.55 + breathe * 0.4);
      ctx.stroke();

      // Central Molten Furnace Core
      const corePulse = Math.sin(now * 0.006 + seed) * 1.5;
      ctx.beginPath();
      ctx.arc(0, 0 + breathe * 0.4, 8 + corePulse, 0, Math.PI * 2);
      ctx.fillStyle = "#ff3d00";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0 + breathe * 0.4, 5 + corePulse * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = "#ffea00";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0 + breathe * 0.4, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      // Floating Massive Stone Pauldrons
      const leftSway = Math.sin(now * 0.004 + seed) * 2;
      const rightSway = Math.cos(now * 0.004 + seed) * 2;
      ctx.fillStyle = "#27272a";
      ctx.strokeStyle = "#ff5722";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(-r * 1.15, -r * 0.9 + leftSway, 14, 18);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.rect(r * 0.75, -r * 0.9 + rightSway, 14, 18);
      ctx.fill();
      ctx.stroke();

      // Floating Heavy Fists
      ctx.fillStyle = "#09090b";
      ctx.strokeStyle = "#ff9100";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.rect(-r * 1.25, r * 0.1 - leftSway, 16, 16);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.rect(r * 0.8, r * 0.1 - rightSway, 16, 16);
      ctx.fill();
      ctx.stroke();

      // Molten Arcs
      ctx.strokeStyle = "rgba(255, 171, 0, 0.75)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, r * 0.2);
      ctx.lineTo(-r * 1.0, r * 0.3 - leftSway);
      ctx.moveTo(r * 0.7, r * 0.2);
      ctx.lineTo(r * 1.0, r * 0.3 - rightSway);
      ctx.stroke();

      // Golem Head / Visor
      ctx.fillStyle = "#18181b";
      ctx.strokeStyle = "#ff3d00";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(-12, -r * 1.1 + breathe * 0.4, 24, 14);
      ctx.fill();
      ctx.stroke();

      // Glowing Slit Eyes
      ctx.fillStyle = "#ffea00";
      ctx.beginPath();
      ctx.fillRect(-8, -r * 1.0 + breathe * 0.4, 5, 3);
      ctx.fillRect(3, -r * 1.0 + breathe * 0.4, 5, 3);

      ctx.restore();
    }
  } else if (type.includes("terror")) {
    const r = 36;
    const pulse = Math.sin(now * 0.005 + seed) * 3;

    if (isShadowPass) {
      ctx.beginPath();
      ctx.ellipse(0, 18, r * 1.2, r * 0.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fill();
    } else {
      ctx.save();
      // Cosmic Void Rift Shadow
      ctx.beginPath();
      ctx.ellipse(0, 18, r * 1.2, r * 0.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(107, 33, 168, 0.35)";
      ctx.fill();

      // Writhing Shadowy Tentacles
      ctx.strokeStyle = "#3b0764";
      ctx.lineWidth = 3.5;
      ctx.lineCap = "round";
      for (let t = 0; t < 8; t++) {
        const tAngle = (t / 8) * Math.PI * 2;
        const wave = Math.sin(now * 0.006 + t * 1.2 + seed) * 12;
        const startX = Math.cos(tAngle) * (r * 0.7);
        const startY = Math.sin(tAngle) * (r * 0.7);
        const endX = Math.cos(tAngle) * (r * 1.45 + pulse) + wave;
        const endY = Math.sin(tAngle) * (r * 1.45 + pulse) + wave;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(startX * 1.4, startY * 1.4 + wave, endX, endY);
        ctx.stroke();
      }

      // Swirling Cosmic Body Mass
      const voidGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, r + pulse);
      voidGrad.addColorStop(0, "#090014");
      voidGrad.addColorStop(0.5, "#2e1065");
      voidGrad.addColorStop(0.85, "#581c87");
      voidGrad.addColorStop(1, "rgba(88, 28, 135, 0)");
      ctx.fillStyle = voidGrad;
      ctx.beginPath();
      ctx.arc(0, 0, r + pulse, 0, Math.PI * 2);
      ctx.fill();

      // Central Event Horizon Singularity
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fillStyle = "#000000";
      ctx.fill();
      ctx.strokeStyle = "#c084fc";
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Multiple Eldritch Eyes
      const voidEyes = [
        { x: -14, y: -10, rad: 5.5 },
        { x: 14, y: -8, rad: 4.8 },
        { x: -8, y: 12, rad: 4.2 },
        { x: 10, y: 10, rad: 5.2 },
      ];
      for (const eye of voidEyes) {
        ctx.beginPath();
        ctx.arc(eye.x, eye.y, eye.rad, 0, Math.PI * 2);
        ctx.fillStyle = "#c084fc";
        ctx.fill();
        ctx.strokeStyle = "#581c87";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.ellipse(eye.x, eye.y, eye.rad * 0.28, eye.rad * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Orbiting Dark Cosmic Motes
      for (let m = 0; m < 3; m++) {
        const mAngle = now * 0.002 + (m / 3) * Math.PI * 2;
        const mX = Math.cos(mAngle) * (r * 1.2);
        const mY = Math.sin(mAngle) * (r * 0.8);
        ctx.beginPath();
        ctx.arc(mX, mY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "#e879f9";
        ctx.fill();
      }

      ctx.restore();
    }
  } else if (type.includes("tidecaller")) {
    const r = 32;
    const breathe = Math.sin(now * 0.005 + seed) * 2;

    if (isShadowPass) {
      ctx.beginPath();
      ctx.ellipse(0, 18, r * 1.2, r * 0.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fill();
    } else {
      ctx.save();
      // Swirling Foaming Aquatic Whirlpool Pool
      const poolAngle = now * 0.004;
      ctx.save();
      ctx.translate(0, 18);
      ctx.rotate(poolAngle);
      const waterGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 1.3);
      waterGrad.addColorStop(0, "rgba(56, 189, 248, 0.7)");
      waterGrad.addColorStop(0.6, "rgba(2, 132, 199, 0.45)");
      waterGrad.addColorStop(1, "rgba(2, 132, 199, 0)");
      ctx.fillStyle = waterGrad;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.8, 0, Math.PI * 1.2);
      ctx.stroke();
      ctx.restore();

      // Aquatic Chitin Carapace Body
      const deepGrad = ctx.createLinearGradient(0, -r, 0, r);
      deepGrad.addColorStop(0, "#0f766e");
      deepGrad.addColorStop(0.5, "#042f2e");
      deepGrad.addColorStop(1, "#115e59");
      ctx.fillStyle = deepGrad;
      ctx.strokeStyle = "#2dd4bf";
      ctx.lineWidth = 2.2;

      ctx.beginPath();
      ctx.moveTo(-r * 0.7, r * 0.5);
      ctx.quadraticCurveTo(-r * 0.9, -r * 0.3, 0, -r * 0.8 + breathe * 0.5);
      ctx.quadraticCurveTo(r * 0.9, -r * 0.3, r * 0.7, r * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // High Arched Dorsal Fin Crests
      ctx.fillStyle = "rgba(45, 212, 191, 0.85)";
      ctx.strokeStyle = "#99f6e4";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-r * 0.8, -r * 0.2 + breathe * 0.5);
      ctx.lineTo(-r * 1.15, -r * 0.7 + breathe * 0.5);
      ctx.lineTo(-r * 0.5, -r * 0.5 + breathe * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(r * 0.8, -r * 0.2 + breathe * 0.5);
      ctx.lineTo(r * 1.15, -r * 0.7 + breathe * 0.5);
      ctx.lineTo(r * 0.5, -r * 0.5 + breathe * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Abyssal Trident in Right Hand
      ctx.save();
      ctx.translate(r * 0.75, -r * 0.2 + breathe * 0.5);
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 18);
      ctx.lineTo(0, -22);
      ctx.stroke();
      // Trident prongs
      ctx.fillStyle = "#7dd3fc";
      ctx.beginPath();
      ctx.moveTo(-6, -18);
      ctx.lineTo(-6, -26);
      ctx.lineTo(-4, -26);
      ctx.lineTo(-4, -18);
      ctx.moveTo(-2, -18);
      ctx.lineTo(0, -30);
      ctx.lineTo(2, -18);
      ctx.moveTo(4, -18);
      ctx.lineTo(4, -26);
      ctx.lineTo(6, -26);
      ctx.lineTo(6, -18);
      ctx.fill();
      ctx.restore();

      // Sorcerer Head
      ctx.fillStyle = "#042f2e";
      ctx.strokeStyle = "#14b8a6";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, -r * 0.5 + breathe * 0.4, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Bioluminescent Cyan Eyes
      ctx.fillStyle = "#22d3ee";
      ctx.beginPath();
      ctx.arc(-4.5, -r * 0.5 + breathe * 0.4, 2.5, 0, Math.PI * 2);
      ctx.arc(4.5, -r * 0.5 + breathe * 0.4, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Oceanic Coral Crown
      ctx.fillStyle = "#06b6d4";
      ctx.strokeStyle = "#a5f3fc";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-10, -r * 0.65 + breathe * 0.4);
      ctx.lineTo(-8, -r * 0.95 + breathe * 0.4);
      ctx.lineTo(-3, -r * 0.75 + breathe * 0.4);
      ctx.lineTo(0, -r * 1.05 + breathe * 0.4);
      ctx.lineTo(3, -r * 0.75 + breathe * 0.4);
      ctx.lineTo(8, -r * 0.95 + breathe * 0.4);
      ctx.lineTo(10, -r * 0.65 + breathe * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  } else if (
    isElite ||
    HUMANOID_REGEX.test(type)
  ) {
    const isArcher = type.includes("archer");
    const mobClass = isArcher ? "ranger" : "warrior";
    const mobColor = isElite ? (isArcher ? "#064e3b" : "#1e293b") : "#34495e";

    // Elite Ground Aura Emblem
    if (isElite && !isShadowPass) {
      ctx.save();
      const elitePulse = Math.sin(nowMs * 0.005) * 2;
      ctx.beginPath();
      ctx.ellipse(0, 14, 20 + elitePulse, 8 + elitePulse * 0.4, 0, 0, Math.PI * 2);
      ctx.fillStyle = isArcher ? "rgba(16, 185, 129, 0.28)" : "rgba(245, 158, 11, 0.28)";
      ctx.fill();
      ctx.strokeStyle = isArcher ? "rgba(52, 211, 153, 0.6)" : "rgba(251, 191, 36, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    if (typeof drawSegmentedCharacter === "function") {
      drawSegmentedCharacter(ctx, 0, 0, {
        playerClass: mobClass,
        bodyColor: mobColor,
        facingAngle: ent.facingAngle || 0,
        moving: !!ent.isMoving,
        isAttacking: !!ent.currentCast,
        entityId: ent.id || "mob_" + Math.random(),
        scale: isBoss ? 1.3 : (isElite ? 1.15 : 1.0),
      });
    } else if (typeof window !== "undefined" && typeof window.drawSegmentedCharacter === "function") {
      window.drawSegmentedCharacter(ctx, 0, 0, {
        playerClass: mobClass,
        bodyColor: mobColor,
        facingAngle: ent.facingAngle || 0,
        moving: !!ent.isMoving,
        isAttacking: !!ent.currentCast,
        entityId: ent.id || "mob_" + Math.random(),
        scale: isBoss ? 1.3 : (isElite ? 1.15 : 1.0),
      });
    } else {
      drawProceduralHumanoidMob(ctx, ent, type, mobClass, mobColor, isElite, isBoss, isShadowPass, nowMs, seed);
    }
  } else {
    let hash = 0;
    for (let i = 0; i < type.length; i++)
      hash = type.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash) % 360;
    const bodyColor = `hsl(${hue}, 65%, 45%)`;
    const strokeColor = `hsl(${hue}, 75%, 30%)`;
    const r = isBoss ? 30 : 18;

    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(-r * 0.3, -r * 0.15, r * 0.25, 0, Math.PI * 2);
    ctx.arc(r * 0.3, -r * 0.15, r * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(-r * 0.3, -r * 0.15, r * 0.1, 0, Math.PI * 2);
    ctx.arc(r * 0.3, -r * 0.15, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  if (isBoss) {
    ctx.save();
    ctx.translate(0, -auraRadius * 0.95);
    ctx.fillStyle = "#f1c40f";
    ctx.strokeStyle = "#d68910";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-12, 2);
    ctx.lineTo(-14, -8);
    ctx.lineTo(-7, -2);
    ctx.lineTo(0, -12);
    ctx.lineTo(7, -2);
    ctx.lineTo(14, -8);
    ctx.lineTo(12, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

if (typeof window !== "undefined") {
  window.drawGenericMob = drawGenericMob;
}
