// skeletons.js - Procedural 8-Directional Samba-Inspired Skeleton Renderer
import { computeFastSeed, safeCreateRadialGradient } from './helpers.js';

/**
 * CORE DESIGN RULE: NEVER RENDER SOLID SHADOW CIRCLES
 * No baked-in solid or flat circle/ellipse ground shadows beneath the skeleton.
 */

const SAMBA_PALETTES = {
  // Emerald Green, Canary Gold & Cyan (Classic Rio Samba School vibe)
  passista: {
    name: "Passista de Carnaval",
    feathers: ["#10b981", "#059669", "#f59e0b", "#fbbf24", "#06b6d4"],
    accent: "#f59e0b",
    sash: "#10b981",
    sashTrim: "#fef08a",
    pandeiroHoop: "#d97706",
    pandeiroSkin: "#fef3c7",
    glow: "#34d399",
    metal: "#fbbf24",
    gem: "#ec4899"
  },
  // Royal Purple, Imperial Gold & Crimson (Mestre de Bateria)
  mestre: {
    name: "Mestre de Bateria",
    feathers: ["#9333ea", "#7e22ce", "#f59e0b", "#fbbf24", "#ef4444"],
    accent: "#fbbf24",
    sash: "#9333ea",
    sashTrim: "#fde047",
    pandeiroHoop: "#b45309",
    pandeiroSkin: "#fef9c3",
    glow: "#a855f7",
    metal: "#f59e0b",
    gem: "#38bdf8"
  },
  // Classic Malandro: Crimson, Pure White, Jet Black (Lapa Street Samba Swagger)
  malandro: {
    name: "Samba Malandro",
    feathers: ["#ef4444", "#dc2626", "#f8fafc", "#f59e0b", "#1e293b"],
    accent: "#ef4444",
    sash: "#dc2626",
    sashTrim: "#ffffff",
    pandeiroHoop: "#b91c1c",
    pandeiroSkin: "#f8fafc",
    glow: "#f87171",
    metal: "#cbd5e1",
    gem: "#f59e0b"
  },
  // Gilded Carnival Champion Guard
  knight: {
    name: "Guerreiro do Sambodromo",
    feathers: ["#f59e0b", "#d97706", "#06b6d4", "#0891b2", "#8b5cf6"],
    accent: "#fbbf24",
    sash: "#0891b2",
    sashTrim: "#fef08a",
    pandeiroHoop: "#d97706",
    pandeiroSkin: "#f1f5f9",
    glow: "#38bdf8",
    metal: "#f59e0b",
    gem: "#10b981"
  },
  // Monumental Carnival Skeleton King Boss (Rei Momo dos Ossos)
  boss: {
    name: "Rei Momo dos Ossos",
    feathers: ["#fbbf24", "#f59e0b", "#ec4899", "#8b5cf6", "#10b981", "#06b6d4"],
    accent: "#fbbf24",
    sash: "#ec4899",
    sashTrim: "#fef08a",
    pandeiroHoop: "#b45309",
    pandeiroSkin: "#fffbeb",
    glow: "#f43f5e",
    metal: "#fbbf24",
    gem: "#67e8f9"
  }
};

/**
 * Renders individual curved carnival plumes with realistic quill lines and harmonic wind flutter.
 */
function drawCarnivalPlume(ctx, x, y, angle, length, width, color, flutter, highlightColor) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + flutter * 0.12);

  // Outer feather contour
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-width * 0.7, -length * 0.45, -width * 0.2 + flutter * 2.5, -length);
  ctx.quadraticCurveTo(width * 0.2 + flutter * 2.5, -length, width * 0.7, -length * 0.45);
  ctx.closePath();

  ctx.fillStyle = color;
  ctx.fill();

  // Central quill spine
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(flutter * 1.2, -length * 0.5, flutter * 2.5, -length);
  ctx.strokeStyle = highlightColor || "rgba(255, 255, 255, 0.45)";
  ctx.lineWidth = Math.max(0.75, width * 0.18);
  ctx.lineCap = "round";
  ctx.stroke();

  // Subtle barbs fringe
  ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
  ctx.lineWidth = 0.5;
  for (let s = 0.25; s <= 0.85; s += 0.2) {
    const py = -length * s;
    const px = flutter * s * 1.5;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px - width * 0.4, py + 1.5);
    ctx.moveTo(px, py);
    ctx.lineTo(px + width * 0.4, py + 1.5);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Renders the grand Carnival Headdress ("Costeiro" / Penacho Real)
 */
function drawCarnivalHeaddress(ctx, tier, palette, nowMs, seed, isBackView = false) {
  const isBoss = tier === "boss";
  const plumeCount = isBoss ? 11 : tier === "mestre" ? 9 : 7;
  const spreadAngle = isBoss ? Math.PI * 0.78 : Math.PI * 0.65;
  const baseLength = isBoss ? 26 : 18;
  const baseWidth = isBoss ? 7 : 5;

  ctx.save();
  // Crest / diadem harness base
  if (!isBackView) {
    // Front jeweled diadem
    ctx.fillStyle = palette.metal;
    ctx.beginPath();
    ctx.arc(0, -1, 7.5, Math.PI * 0.9, Math.PI * 2.1);
    ctx.lineTo(0, -6.5);
    ctx.closePath();
    ctx.fill();

    // Center gemstone
    ctx.fillStyle = palette.gem;
    ctx.beginPath();
    ctx.arc(0, -3.2, isBoss ? 2.5 : 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = palette.metal;
    ctx.lineWidth = 0.75;
    ctx.stroke();
  } else {
    // Back harness straps (golden structure supporting the plumes)
    ctx.strokeStyle = palette.metal;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, -2, 8, Math.PI * 0.8, Math.PI * 2.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-6, -1);
    ctx.lineTo(0, -5.5);
    ctx.lineTo(6, -1);
    ctx.stroke();
  }

  // Radiating plumes
  const colors = palette.feathers;
  const startAngle = -Math.PI / 2 - spreadAngle / 2;
  const step = spreadAngle / (plumeCount - 1);

  for (let i = 0; i < plumeCount; i++) {
    const curAngle = startAngle + i * step;
    const color = colors[i % colors.length];
    const flutter = Math.sin(nowMs * 0.007 + i * 0.8 + seed) * 1.8;
    const lenMult = 1 - Math.abs(i - (plumeCount - 1) / 2) * 0.09;
    const plumeLen = baseLength * lenMult;
    const plumeW = baseWidth * lenMult;

    drawCarnivalPlume(
      ctx,
      0,
      -3.5,
      curAngle,
      plumeLen,
      plumeW,
      color,
      flutter,
      palette.accent
    );
  }

  // Malandro Panama Hat variation if active
  if (tier === "malandro" && !isBackView) {
    ctx.save();
    ctx.translate(0, -4);
    ctx.rotate(-0.1);

    // Hat brim
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Hat crown
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.quadraticCurveTo(-6, -7, 0, -8);
    ctx.quadraticCurveTo(6, -7, 6, 0);
    ctx.closePath();
    ctx.fill();

    // Red ribbon band
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(-6.2, -2.5, 12.4, 2.5);

    ctx.restore();
  }

  ctx.restore();
}

/**
 * Renders the festive Brazilian Pandeiro (Tambourine with brass jingles)
 */
function drawPandeiro(ctx, x, y, scale, angle, palette, isShaking, nowMs) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const jingleVibe = isShaking ? Math.sin(nowMs * 0.04) * 1.5 : 0;
  const r = 7 * scale;

  // Outer wooden frame
  ctx.fillStyle = palette.pandeiroHoop;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // White goat skin drum head
  ctx.fillStyle = palette.pandeiroSkin;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
  ctx.fill();

  // Decorative Samba star or crest on drumhead
  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
  ctx.fill();

  // 6 Brass Jingles (Platinelas) around the rim
  ctx.fillStyle = "#fef08a";
  ctx.strokeStyle = "#ca8a04";
  ctx.lineWidth = 0.6;
  for (let j = 0; j < 6; j++) {
    const ja = (j / 6) * Math.PI * 2;
    const jx = Math.cos(ja) * (r * 0.95);
    const jy = Math.sin(ja) * (r * 0.95);
    ctx.beginPath();
    ctx.arc(jx + jingleVibe * 0.4, jy, 1.4 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Thumb hold notch
  ctx.fillStyle = "#78350f";
  ctx.beginPath();
  ctx.arc(r * 0.88, 0, 1.2 * scale, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Main procedural Samba Skeleton renderer
 */
export function drawSkeletonEntity(ctx, x, y, ent, isShadowPass = false) {
  if (isShadowPass) return;
  if (!ent) ent = {};

  const type = ent.type || "skeleton";
  const facingAngle = ent.facingAngle || 0;
  const isMoving = !!(ent.moving || ent.isMoving);
  const nowMs = performance.now();

  if (ent._seed === undefined) {
    const id = ent.id || ("skel_" + Math.round(x) + "_" + Math.round(y));
    ent._seed = computeFastSeed(id);
  }
  const seed = ent._seed;

  // Variant resolution
  let variantKey = "passista";
  if (type === "boss_samba_king" || type.includes("boss")) {
    variantKey = "boss";
  } else if (type === "elite_knight" || type.includes("knight") || type.includes("warrior")) {
    variantKey = "knight";
  } else if (type.includes("mestre") || type.includes("bateria")) {
    variantKey = "mestre";
  } else if (type.includes("malandro")) {
    variantKey = "malandro";
  }
  const palette = SAMBA_PALETTES[variantKey];

  // Attack detection
  let isAttacking = !!(ent.isAttacking || ent.currentCast);
  if (!isAttacking && typeof GameState !== "undefined" && GameState.combatAnimations && ent.id) {
    for (let i = 0; i < GameState.combatAnimations.length; i++) {
      const anim = GameState.combatAnimations[i];
      const dur = anim.duration || anim.durationMs || 450;
      if (anim.attackerId === ent.id && nowMs - anim.createdAt < dur) {
        isAttacking = true;
        break;
      }
    }
  }

  // Hit flash detection
  let isFlashing = false;
  let flashAmt = 0;
  if (ent.lastHitTime && nowMs - ent.lastHitTime < 160) {
    isFlashing = true;
    flashAmt = Math.max(0, 1 - (nowMs - ent.lastHitTime) / 160);
  }

  // Samba BPM Rhythm Calculation
  // Standard Samba batucada is around 110-140 BPM (syncopated 2/4 signature)
  const bpm = ent.sambaBpm || 124;
  const beatPeriod = 60000 / bpm;
  const beatProgress = ((nowMs + seed * 20) % beatPeriod) / beatPeriod;
  const beatAngle = beatProgress * Math.PI * 2;

  // Syncopated "Samba no Pe" bounce & weight transfer: quick-quick-slow
  const sambaStep = Math.sin(beatAngle) + 0.35 * Math.sin(beatAngle * 2);
  const sambaSway = Math.cos(beatAngle) * 0.12; // Hip & torso sway angle
  const bounceY = Math.abs(Math.sin(beatAngle)) * (isMoving ? 3.5 : 2.0);

  // 8-Direction Matrix
  // 0: E, 1: SE, 2: S, 3: SW, 4: W, 5: NW, 6: N, 7: NE
  const normAngle = ((facingAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const dirIndex = Math.floor(((normAngle + Math.PI / 8) % (Math.PI * 2)) / (Math.PI / 4));

  const isBackView = dirIndex === 5 || dirIndex === 6 || dirIndex === 7;
  const isDirectBack = dirIndex === 6;
  const isSideEast = dirIndex === 0;
  const isSideWest = dirIndex === 4;
  const isFacingWest = dirIndex === 3 || dirIndex === 4 || dirIndex === 5;
  const flipX = isFacingWest ? -1 : 1;

  ctx.save();
  ctx.translate(x, y);

  // Boss scale modifier
  const masterScale = variantKey === "boss" ? 1.55 : variantKey === "knight" ? 1.25 : 1.15;
  ctx.scale(masterScale, masterScale);

  if (isFlashing) {
    ctx.filter = `brightness(${1 + flashAmt * 1.6}) contrast(${1 + flashAmt * 0.4})`;
  }

  // Rhythmic Samba Ginga bounce
  ctx.translate(0, -bounceY);

  // -------------------------------------------------------------------------
  // 1. CARNAVAL CONFETTI & SPARKS AMBIENT AURA (Boss or Elite)
  // -------------------------------------------------------------------------
  if (variantKey === "boss" || variantKey === "knight") {
    ctx.save();
    const particleCount = variantKey === "boss" ? 6 : 3;
    for (let p = 0; p < particleCount; p++) {
      const pCycle = (nowMs * 0.04 + p * 40 + seed * 12) % 60;
      const pAlpha = Math.max(0, 1 - pCycle / 55);
      const px = Math.sin(nowMs * 0.005 + p * 2.3 + seed) * (18 + p * 2);
      const py = 10 - pCycle * 0.7;
      ctx.fillStyle = palette.feathers[p % palette.feathers.length];
      ctx.globalAlpha = pAlpha * 0.85;
      ctx.fillRect(px - 1, py - 1, 2.5, 2.5);
    }
    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // 2. BACK CARNAVAL PLUMES (Visible when facing forward / side)
  // -------------------------------------------------------------------------
  if (!isBackView) {
    ctx.save();
    ctx.translate(0, -18);
    drawCarnivalHeaddress(ctx, variantKey, palette, nowMs, seed, false);
    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // 3. ANATOMY: LEGS & FEET ("Samba no Pe" Dynamic Step)
  // -------------------------------------------------------------------------
  const legSwingL = isMoving ? Math.sin(beatAngle) * 5 : sambaStep * 2;
  const legSwingR = isMoving ? -Math.sin(beatAngle) * 5 : -sambaStep * 2;

  // Bone Colors
  const boneBase = "#f1f5f9";
  const boneShadow = "#94a3b8";
  const boneJoint = "#64748b";

  // Left Leg (Behind/Side)
  ctx.save();
  ctx.translate(-4, 0);
  // Femur & Tibia
  ctx.strokeStyle = boneBase;
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-1.5 + legSwingL * 0.3, 7);
  ctx.lineTo(-1.5 + legSwingL * 0.8, 14);
  ctx.stroke();

  // Knee joint
  ctx.fillStyle = boneJoint;
  ctx.beginPath();
  ctx.arc(-1.5 + legSwingL * 0.3, 7, 1.4, 0, Math.PI * 2);
  ctx.fill();

  // Foot with golden ankle bracelet
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(-3 + legSwingL * 0.8, 14, 4.5, 2.5);
  ctx.fillStyle = palette.metal;
  ctx.fillRect(-2 + legSwingL * 0.8, 13.5, 3.5, 1.2);
  ctx.restore();

  // Right Leg
  ctx.save();
  ctx.translate(4, 0);
  ctx.strokeStyle = boneBase;
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(1.5 + legSwingR * 0.3, 7);
  ctx.lineTo(1.5 + legSwingR * 0.8, 14);
  ctx.stroke();

  // Knee joint
  ctx.fillStyle = boneJoint;
  ctx.beginPath();
  ctx.arc(1.5 + legSwingR * 0.3, 7, 1.4, 0, Math.PI * 2);
  ctx.fill();

  // Foot with golden ankle bracelet
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(0 + legSwingR * 0.8, 14, 4.5, 2.5);
  ctx.fillStyle = palette.metal;
  ctx.fillRect(1 + legSwingR * 0.8, 13.5, 3.5, 1.2);
  ctx.restore();

  // -------------------------------------------------------------------------
  // 4. PELVIS & FESTIVE FRINGE SKIRT / JEWELED BELT ("Cinto de Passista")
  // -------------------------------------------------------------------------
  ctx.save();
  ctx.rotate(sambaSway);

  // Pelvis bone
  ctx.fillStyle = boneBase;
  ctx.beginPath();
  ctx.ellipse(0, 0, 6, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Jeweled Belt
  ctx.fillStyle = palette.metal;
  ctx.fillRect(-5.5, -1, 11, 2.5);

  // Center buckle gem
  ctx.fillStyle = palette.gem;
  ctx.beginPath();
  ctx.arc(0, 0.2, 1.4, 0, Math.PI * 2);
  ctx.fill();

  // Swinging carnival fringe ribbons
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 1;
  const ribbonSway = Math.sin(beatAngle * 1.5) * 2;
  for (let r = -4; r <= 4; r += 2) {
    ctx.beginPath();
    ctx.moveTo(r, 1.5);
    ctx.lineTo(r + ribbonSway * (r > 0 ? 0.6 : -0.6), 5.5);
    ctx.stroke();
  }
  ctx.restore();

  // -------------------------------------------------------------------------
  // 5. RIBCAGE & CARNAVAL SASH ("Faixa de Mestre / Passista")
  // -------------------------------------------------------------------------
  ctx.save();
  ctx.rotate(sambaSway * 0.7);

  // Spine
  ctx.strokeStyle = boneShadow;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -11);
  ctx.stroke();

  // Ribs (volumetric curved ivory bars)
  ctx.strokeStyle = boneBase;
  ctx.lineWidth = 1.3;
  ctx.lineCap = "round";
  for (let rib = -9; rib <= -3; rib += 2.2) {
    const ribW = 6.8 - Math.abs(rib + 6) * 0.55;
    ctx.beginPath();
    ctx.moveTo(-ribW, rib);
    ctx.lineTo(ribW, rib);
    ctx.stroke();
  }

  // Sternum / Front spine plate
  if (!isBackView) {
    ctx.fillStyle = boneBase;
    ctx.fillRect(-1.2, -10, 2.4, 8);
  }

  // Diagonal Parade Sash ("Faixa Carnavalesca")
  ctx.strokeStyle = palette.sash;
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(-6, -10);
  ctx.lineTo(5, -1);
  ctx.stroke();

  // Gold trim on sash
  ctx.strokeStyle = palette.sashTrim;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-6.2, -10.8);
  ctx.lineTo(5.2, -1.8);
  ctx.stroke();

  // -------------------------------------------------------------------------
  // 6. FESTIVE COLLAR & EPAULETTES WITH TASSELS ("Ombreiras Festivas")
  // -------------------------------------------------------------------------
  // Golden Gorget / Collar
  ctx.fillStyle = palette.metal;
  ctx.beginPath();
  ctx.ellipse(0, -10.5, 7, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Epaulette Plumes on Shoulders
  const epauletteFlutter = Math.sin(nowMs * 0.008 + seed) * 1.5;
  // Left shoulder
  drawCarnivalPlume(ctx, -7, -10, -Math.PI * 0.7, 7, 3, palette.feathers[0], epauletteFlutter, palette.accent);
  // Right shoulder
  drawCarnivalPlume(ctx, 7, -10, Math.PI * 0.7, 7, 3, palette.feathers[1 % palette.feathers.length], -epauletteFlutter, palette.accent);

  ctx.restore();

  // -------------------------------------------------------------------------
  // 7. ARMS, PANDEIRO & WEAPON (Rhythmic Playing & Attack Motion)
  // -------------------------------------------------------------------------
  const attackProgress = isAttacking ? Math.min(1, (nowMs - (ent.attackStart || nowMs)) / 450) : 0;
  const attackSwing = isAttacking ? Math.sin(attackProgress * Math.PI) * 16 : 0;

  // Left Arm: Pandeiro (Tambourine)
  // Rhythmic tapping in sync with beat
  const pandeiroTapAngle = isAttacking ? -0.8 : Math.sin(beatAngle * 2) * 0.35 - 0.2;
  const pandeiroY = -8 + (isAttacking ? -6 : Math.sin(beatAngle * 2) * 1.5);

  ctx.save();
  ctx.translate(-7, -9);
  ctx.rotate(pandeiroTapAngle);

  // Upper & Lower Arm bone
  ctx.strokeStyle = boneBase;
  ctx.lineWidth = 2.0;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-4, 5);
  ctx.lineTo(-2, 10);
  ctx.stroke();

  // Hand holding Pandeiro
  ctx.fillStyle = boneBase;
  ctx.beginPath();
  ctx.arc(-2, 10, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Draw Pandeiro
  const isPandeiroShaking = isAttacking || isMoving;
  drawPandeiro(ctx, -2, 10, 1.1, pandeiroTapAngle, palette, isPandeiroShaking, nowMs);
  ctx.restore();

  // Right Arm: Festive Bone Rapier / Maraca / Tamborim Baton
  ctx.save();
  ctx.translate(7, -9);
  const armSwing = isAttacking ? -attackSwing * 0.08 : Math.sin(beatAngle) * 0.25;
  ctx.rotate(armSwing);

  // Upper & Lower Arm bone
  ctx.strokeStyle = boneBase;
  ctx.lineWidth = 2.0;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(4, 5);
  ctx.lineTo(attackSwing > 0 ? 8 + attackSwing * 0.4 : 5, attackSwing > 0 ? -2 - attackSwing * 0.3 : 10);
  ctx.stroke();

  // Weapon Attachment: Sabre Carnavalesco with Ribbon or Percussion Baton
  const handX = attackSwing > 0 ? 8 + attackSwing * 0.4 : 5;
  const handY = attackSwing > 0 ? -2 - attackSwing * 0.3 : 10;
  ctx.translate(handX, handY);

  if (variantKey === "mestre") {
    // Dual golden conductor baton with gem tip
    ctx.rotate(-0.4 - attackSwing * 0.06);
    ctx.strokeStyle = palette.metal;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.lineTo(0, -16);
    ctx.stroke();
    ctx.fillStyle = palette.gem;
    ctx.beginPath();
    ctx.arc(0, -16, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (variantKey === "malandro") {
    // Stylish silver cane with ivory skull pommel
    ctx.rotate(0.2);
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.lineTo(0, 18);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(0, -4, 2.6, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Sabre Carnavalesco (Ivory blade with golden cup-hilt and fluttering festival ribbons)
    ctx.rotate(0.35 - (isAttacking ? attackSwing * 0.08 : 0));

    // Golden Cup Hilt
    ctx.fillStyle = palette.metal;
    ctx.beginPath();
    ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // Sharp Ivory Blade
    ctx.fillStyle = "#f8fafc";
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(-1, 0);
    ctx.lineTo(-0.8, -20);
    ctx.lineTo(0, -22);
    ctx.lineTo(0.8, -20);
    ctx.lineTo(1, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Fluttering Carnival Ribbons tied to hilt
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 1.2;
    const ribFlutter = Math.sin(nowMs * 0.012 + seed) * 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(4 + ribFlutter, 6, 2 + ribFlutter * 1.5, 12);
    ctx.stroke();

    ctx.strokeStyle = palette.feathers[0];
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-4 - ribFlutter, 7, -2 - ribFlutter * 1.5, 14);
    ctx.stroke();
  }
  ctx.restore();

  // -------------------------------------------------------------------------
  // 8. SKULL & CARNAVAL MAKEUP / WARPAINT
  // -------------------------------------------------------------------------
  ctx.save();
  ctx.translate(0, -17);
  // Head tilt with rhythm
  ctx.rotate(sambaSway * 0.5);

  if (isBackView) {
    // Cranium from the back
    ctx.fillStyle = boneBase;
    ctx.beginPath();
    ctx.arc(0, 0, 6.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = boneShadow;
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // Draw Headdress plumes facing camera on the back harness
    drawCarnivalHeaddress(ctx, variantKey, palette, nowMs, seed, true);
  } else {
    // Front Cranium
    ctx.fillStyle = boneBase;
    ctx.beginPath();
    ctx.arc(0, -1, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = boneShadow;
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // Mandible / Cheekbones
    ctx.fillStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(-3, 4.5);
    ctx.lineTo(3, 4.5);
    ctx.lineTo(4, 0);
    ctx.closePath();
    ctx.fill();

    // Teeth (Carnival celebratory grin)
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(-2.5, 2.2, 5, 1.2);
    ctx.fillStyle = "#ffffff";
    for (let t = -2.2; t <= 1.8; t += 1.0) {
      ctx.fillRect(t, 2.0, 0.7, 1.6);
    }
    // Gold tooth for flair
    ctx.fillStyle = palette.metal;
    ctx.fillRect(-0.2, 2.0, 0.8, 1.6);

    // Eye Sockets
    const eyeOffsetX = isSideEast ? 1.5 : isSideWest ? -1.5 : 0;
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.ellipse(-2.5 + eyeOffsetX, -0.8, 1.7, 2.0, 0, 0, Math.PI * 2);
    ctx.ellipse(2.5 + eyeOffsetX, -0.8, 1.7, 2.0, 0, 0, Math.PI * 2);
    ctx.fill();

    // Festive Glowing Gaze
    ctx.fillStyle = palette.glow;
    ctx.beginPath();
    ctx.arc(-2.5 + eyeOffsetX, -0.8, 0.9, 0, Math.PI * 2);
    ctx.arc(2.5 + eyeOffsetX, -0.8, 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Carnival Face Paint / Sugar Skull swirls around eyes
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.arc(-2.5 + eyeOffsetX, -0.8, 2.5, Math.PI * 0.8, Math.PI * 1.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(2.5 + eyeOffsetX, -0.8, 2.5, Math.PI * 1.2, Math.PI * 2.2);
    ctx.stroke();

    // Brow ornamental jewel / feather bind
    ctx.fillStyle = palette.gem;
    ctx.beginPath();
    ctx.arc(0 + eyeOffsetX, -3.2, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  ctx.restore();
}

/**
 * Triggers a festive Samba Skeleton death explosion:
 * Explodes into flying bone segments and vibrant carnival confetti & ribbons!
 */
export function triggerSkeletonDeathExplosion(ent) {
  if (typeof window === "undefined" || !window.spawnParticle) return;
  const x = ent.x || 0;
  const y = ent.y || 0;

  const confettiColors = [
    "#10b981", "#f59e0b", "#ec4899", "#8b5cf6",
    "#06b6d4", "#ef4444", "#fbbf24", "#f8fafc"
  ];

  // 1. Bone fragments
  for (let b = 0; b < 12; b++) {
    const angle = (b / 12) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const speed = 70 + Math.random() * 85;
    window.spawnParticle({
      x: x,
      y: y - 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 40,
      color: "#f1f5f9",
      size: 3 + Math.random() * 3,
      maxLife: 0.85 + Math.random() * 0.35,
      gravity: 120,
      drag: 0.96,
      shrink: true
    });
  }

  // 2. Flying Carnival Confetti & Streamers
  for (let c = 0; c < 28; c++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 110;
    const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
    window.spawnParticle({
      x: x,
      y: y - 15,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 60,
      color: color,
      size: 2.2 + Math.random() * 2.5,
      maxLife: 1.1 + Math.random() * 0.5,
      gravity: 50,
      drag: 0.94,
      shrink: false
    });
  }
}

if (typeof window !== "undefined") {
  window.drawSkeletonEntity = drawSkeletonEntity;
  window.triggerSkeletonDeathExplosion = triggerSkeletonDeathExplosion;
}
