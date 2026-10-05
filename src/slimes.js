// slimes.js - Procedural Organic Slime Entity Renderer
import { computeFastSeed } from './helpers.js';

export function drawSlimeEntity(ctx, x, y, ent, isShadowPass = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(2, 2);
  ctx.translate(-x, -y);

  const type = ent.type || "slime";
  const isSlowed = !!ent.isSlowed;

  // Unique rhythm seed & time
  if (ent._seed === undefined) {
    // Bolt Opt: String Allocation Elimination - Replaced parseInt and .slice with zero-allocation computeFastSeed
    ent._seed = computeFastSeed(ent.id);
  }
  const seed = ent._seed;
  const now = performance.now();

  // World coordinates velocity (100% immune to camera scroll)
  const worldX = (typeof ent.x === "number") ? ent.x : (ent._prevWorldX || 0);
  const worldY = (typeof ent.y === "number") ? ent.y : (ent._prevWorldY || 0);
  if (ent._prevWorldX === undefined) ent._prevWorldX = worldX;
  if (ent._prevWorldY === undefined) ent._prevWorldY = worldY;
  const vx = (worldX - ent._prevWorldX) * 0.4;
  const vy = (worldY - ent._prevWorldY) * 0.4;
  ent._prevWorldX = worldX;
  ent._prevWorldY = worldY;

  const isMoving = ent.moving || (Math.abs(vx) > 0.1 || Math.abs(vy) > 0.1);

  // Attack & Hit states
  let isAttacking = false;
  if (typeof GameState.combatAnimations !== "undefined") {
    for (let i = 0; i < GameState.combatAnimations.length; i++) {
      const anim = GameState.combatAnimations[i];
      if (anim.attackerId === ent.id && now - anim.createdAt < 450) {
        isAttacking = true;
        break;
      }
    }
  }

  const hpRatio = (ent.hp !== undefined && ent.maxHp) ? Math.max(0, ent.hp / ent.maxHp) : 1;
  const isHit = ent.lastHitTime && (now - ent.lastHitTime < 300);

  // 3D Soft-Body Harmonic Breathing & Jiggle Dynamics
  const timeScale = type === "boss_slime" ? 0.0025 : 0.006;
  const jiggleAmp = isHit ? 0.32 : (isAttacking ? 0.26 : (isMoving ? 0.18 : (type === "boss_slime" ? 0.07 : 0.11)));
  const bounce = Math.sin(now * timeScale + seed) * jiggleAmp;
  const secondaryWobble = Math.cos(now * timeScale * 1.6 + seed * 0.5) * (jiggleAmp * 0.4);
  const hitWobble = isHit ? Math.sin(now * 0.06) * 0.15 : 0;

  // 3D Ground compression & inertial velocity lean
  const moveStretch = Math.min(0.25, Math.sqrt(vx * vx + vy * vy) * 0.05);
  const scaleX = (1 + bounce - moveStretch * 0.4 + hitWobble);
  const scaleY = (1 - bounce - secondaryWobble + moveStretch - hitWobble * 0.4);
  const moveAngle = isMoving ? Math.atan2(vy, vx) : 0;

  // Base 3D Radius and Volumetric Palettes
  let radius = 16;
  let baseHue = 150; // Emerald Green
  let outerColor1 = "rgba(74, 222, 128, 0.94)";  // Luminous top glass dome
  let outerColor2 = "rgba(22, 163, 74, 0.76)";   // Mid translucent jelly body
  let baseShadowCol = "#14532d";                 // Deep bottom ambient shadow
  let innerCoreColor = "#15803d";                // Bioluminescent nucleus
  let strokeColor = "#166534";
  let highlightColor = "rgba(255, 255, 255, 0.85)";
  let rimGlowCol = "rgba(187, 247, 208, 0.55)";
  let eyeColor = "#ffffff";
  let shadowRx = 16;

  if (type === "slime_heavy") {
    radius = 23;
    baseHue = 175; // Jade/Dark Teal
    outerColor1 = "rgba(45, 212, 191, 0.95)";
    outerColor2 = "rgba(13, 148, 136, 0.82)";
    baseShadowCol = "#115e59";
    innerCoreColor = "#0f766e";
    strokeColor = "#134e4a";
    highlightColor = "rgba(255, 255, 255, 0.90)";
    rimGlowCol = "rgba(204, 251, 241, 0.6)";
    shadowRx = 23;
  } else if (type === "boss_slime") {
    radius = 46;
    baseHue = 200; // Royal Celestial Sapphire
    outerColor1 = "rgba(56, 189, 248, 0.96)";
    outerColor2 = "rgba(14, 165, 233, 0.84)";
    baseShadowCol = "#0369a1";
    innerCoreColor = "#0284c7";
    strokeColor = "#075985";
    highlightColor = "rgba(255, 255, 255, 0.95)";
    rimGlowCol = "rgba(224, 242, 254, 0.75)";
    shadowRx = 46;
  }

  if (isSlowed) {
    outerColor1 = "rgba(186, 230, 253, 0.94)";
    outerColor2 = "rgba(96, 165, 250, 0.80)";
    baseShadowCol = "#1e40af";
    innerCoreColor = "#2563eb";
    strokeColor = "#1d4ed8";
    rimGlowCol = "rgba(239, 246, 255, 0.7)";
  }

  // Motion Acid Droplets in World Space
  if (!isShadowPass && isMoving && Math.random() < (type === "boss_slime" ? 0.35 : 0.15)) {
    if (typeof spawnParticle === "function") {
      const pColor = type === "boss_slime" ? ["#38bdf8", "#0ea5e9", "#7dd3fc"] : (type === "slime_heavy" ? ["#14b8a6", "#0d9488", "#5eead4"] : ["#4ade80", "#22c55e", "#86efac"]);
      spawnParticle({
        x: worldX + (Math.random() - 0.5) * radius,
        y: worldY + radius * 0.4 + (Math.random() - 0.5) * 4,
        vx: (Math.random() - 0.5) * 16 - vx * 8,
        vy: -4 - Math.random() * 12,
        color: pColor,
        size: 2 + Math.random() * 3,
        maxLife: 0.35 + Math.random() * 0.25,
        gravity: 25,
        drag: 0.92,
        style: "circle",
        shrink: true,
      });
    }
  }

  ctx.save();
  ctx.translate(x, y);

  // 1. Multi-Layer 3D Ground Compression Shadow (Simulates 3D Ambient Occlusion)
  ctx.save();
  ctx.scale(1, 0.34);
  const shadowY = radius * 1.05 + bounce * 4;
  // Outer soft contact shadow
  ctx.fillStyle = "rgba(10, 18, 14, 0.35)";
  ctx.beginPath();
  ctx.ellipse(0, shadowY, shadowRx * scaleX * 1.1, shadowRx * scaleX * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();
  // Inner dark occlusion core
  ctx.fillStyle = "rgba(5, 10, 8, 0.55)";
  ctx.beginPath();
  ctx.ellipse(0, shadowY, shadowRx * scaleX * 0.65, shadowRx * scaleX * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. Slime King Grand Atmospheric Radial Aura
  if (type === "boss_slime" && !isShadowPass) {
    const bsPulse = Math.sin(now * 0.0035) * 0.15 + 0.85;
    const auraGrd = ctx.createRadialGradient(0, -5, radius * 0.2, 0, 0, radius * 1.8 * bsPulse);
    auraGrd.addColorStop(0, "rgba(56, 189, 248, 0.45)");
    auraGrd.addColorStop(0.5, "rgba(14, 165, 233, 0.18)");
    auraGrd.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = auraGrd;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.8 * bsPulse, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. 3D Body Transform (Velocity Lean + Jiggle Scale)
  if (isMoving) ctx.rotate(moveAngle * 0.12);
  ctx.scale(scaleX, scaleY);

  // 4. Multi-Pass 3D Volumetric Gel Shading (Simulates Raymarched Sphere Normals)
  // Backside Dark Absorption Layer
  const backGrd = ctx.createRadialGradient(
    0, radius * 0.35, radius * 0.1,
    0, 0, radius * 1.15
  );
  backGrd.addColorStop(0, baseShadowCol);
  backGrd.addColorStop(0.7, strokeColor);
  backGrd.addColorStop(1, "rgba(0, 0, 0, 0.6)");

  ctx.fillStyle = backGrd;
  ctx.beginPath();

  // 16-Point 3D Organic Fluid Surface Tension Perimeter
  const points = 16;
  const perimeterPoints = [];
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const wave1 = Math.sin(now * 0.007 + angle * 3 + seed) * (radius * 0.05);
    const wave2 = Math.cos(now * 0.011 - angle * 2 + seed) * (radius * 0.035);
    const r = radius + wave1 + wave2;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    perimeterPoints.push({ x: px, y: py });
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // 5. Translucent 3D Glassmorphic Front Shell with Light Source at Top-Left
  const frontGrd = ctx.createRadialGradient(
    -radius * 0.35, -radius * 0.4, radius * 0.05,
    -radius * 0.1, -radius * 0.1, radius * 1.1
  );
  frontGrd.addColorStop(0, outerColor1);
  frontGrd.addColorStop(0.55, outerColor2);
  frontGrd.addColorStop(0.88, strokeColor);
  frontGrd.addColorStop(1, "rgba(0, 0, 0, 0.45)");

  ctx.fillStyle = frontGrd;
  ctx.beginPath();
  for (let i = 0; i < perimeterPoints.length; i++) {
    if (i === 0) ctx.moveTo(perimeterPoints[i].x, perimeterPoints[i].y);
    else ctx.lineTo(perimeterPoints[i].x, perimeterPoints[i].y);
  }
  ctx.closePath();
  ctx.fill();

  // 6. Suspended 3D Internal Bioluminescent Nucleus Core (Parallax Inertia)
  ctx.save();
  const nParallaxX = -vx * 3.5 + Math.sin(now * 0.003 + seed) * 1.5;
  const nParallaxY = -vy * 3.5 + bounce * radius * 0.22;
  ctx.translate(nParallaxX, nParallaxY);

  const coreRadius = radius * 0.48;
  const coreGrad = ctx.createRadialGradient(
    -coreRadius * 0.25, -coreRadius * 0.25, 0,
    0, 0, coreRadius
  );
  coreGrad.addColorStop(0, "#ffffff");
  coreGrad.addColorStop(0.35, rimGlowCol);
  coreGrad.addColorStop(0.7, innerCoreColor);
  coreGrad.addColorStop(1, outerColor2);

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
  ctx.fill();

  // Nucleus internal glowing energy ring
  ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, coreRadius * 0.65, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 7. Suspended 3D Floating Relics inside the Gel Body
  ctx.save();
  const relicParallaxX = -vx * 2.0;
  const relicParallaxY = -vy * 2.0 + Math.sin(now * 0.002 + seed * 2) * 2;
  ctx.translate(relicParallaxX, relicParallaxY);

  if (type === "boss_slime") {
    // 3D Floating Golden Royal Crown inside the Slime King's volume
    const crownSpin = Math.sin(now * 0.002) * 0.15;
    ctx.rotate(crownSpin);

    // Crown Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fillRect(-11, -radius * 0.15 + 2, 22, 10);

    // Golden Crown Base
    const crownGrad = ctx.createLinearGradient(0, -radius * 0.4, 0, -radius * 0.1);
    crownGrad.addColorStop(0, "#fde047");
    crownGrad.addColorStop(0.5, "#eab308");
    crownGrad.addColorStop(1, "#a16207");

    ctx.fillStyle = crownGrad;
    ctx.strokeStyle = "#78350f";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-12, -radius * 0.1);
    ctx.lineTo(-15, -radius * 0.35);
    ctx.lineTo(-7, -radius * 0.22);
    ctx.lineTo(0, -radius * 0.45);
    ctx.lineTo(7, -radius * 0.22);
    ctx.lineTo(15, -radius * 0.35);
    ctx.lineTo(12, -radius * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3 Inlaid Crown Gemstones (Ruby, Sapphire, Emerald)
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(-14, -radius * 0.36, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3b82f6";
    ctx.beginPath();
    ctx.arc(0, -radius * 0.46, 3.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.arc(14, -radius * 0.36, 2.4, 0, Math.PI * 2);
    ctx.fill();

    // Gemstone specular sparkle
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(0 - 0.7, -radius * 0.46 - 0.7, 0.9, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === "slime_heavy") {
    // 3D Faceted Obsidian / Jade Crystal Shard floating inside
    const crystalAngle = (now * 0.001 + seed) % (Math.PI * 2);
    ctx.save();
    ctx.translate(Math.sin(now * 0.001) * 3, -radius * 0.15);
    ctx.rotate(crystalAngle * 0.2);

    // Facet 1 (Dark shadow face)
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(-5, 0);
    ctx.lineTo(0, 7);
    ctx.closePath();
    ctx.fill();

    // Facet 2 (Luminous crystal face)
    ctx.fillStyle = "#2dd4bf";
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5, 0);
    ctx.lineTo(0, 7);
    ctx.closePath();
    ctx.fill();

    // Facet Ridge Highlight
    ctx.strokeStyle = "#f0fdfa";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(0, 7);
    ctx.stroke();
    ctx.restore();
  } else {
    // 3D Floating Ancient Clover Leaf Spec
    const cloverRot = Math.sin(now * 0.0015 + seed) * 0.4;
    ctx.save();
    ctx.translate(Math.cos(now * 0.001 + seed) * (radius * 0.25), -radius * 0.12);
    ctx.rotate(cloverRot);

    ctx.fillStyle = "rgba(187, 247, 208, 0.9)";
    ctx.beginPath();
    ctx.ellipse(-2, -2, 2.5, 1.6, Math.PI / 4, 0, Math.PI * 2);
    ctx.ellipse(2, -2, 2.5, 1.6, -Math.PI / 4, 0, Math.PI * 2);
    ctx.ellipse(-2, 2, 2.5, 1.6, -Math.PI / 4, 0, Math.PI * 2);
    ctx.ellipse(2, 2, 2.5, 1.6, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // 8. 3D Rising Viscous Micro-Air-Bubbles
  ctx.save();
  for (let i = 0; i < 4; i++) {
    const bSeed = seed + i * 512;
    const bCycle = ((now * 0.001 + i * 0.25 + bSeed) % 1.0);
    const bx = Math.sin(bCycle * Math.PI * 2 + bSeed) * (radius * 0.38);
    const by = (radius * 0.42) - bCycle * (radius * 0.95);
    const bAlpha = Math.sin(bCycle * Math.PI) * 0.75;
    const bSize = 1.0 + Math.sin(bCycle * Math.PI) * 1.5;

    // Bubble body
    ctx.fillStyle = `rgba(255, 255, 255, ${bAlpha * 0.7})`;
    ctx.beginPath();
    ctx.arc(bx, by, bSize, 0, Math.PI * 2);
    ctx.fill();

    // Bubble specular glint
    ctx.fillStyle = `rgba(255, 255, 255, ${bAlpha * 0.95})`;
    ctx.beginPath();
    ctx.arc(bx - bSize * 0.35, by - bSize * 0.35, bSize * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 9. 3D Spherical Specular Caustic Dome Highlights (Dual-Lobe Glass Sheen)
  // Primary Specular Crescent Highlight (Top-Left 3D Glare)
  ctx.fillStyle = highlightColor;
  ctx.beginPath();
  ctx.ellipse(
    -radius * 0.38,
    -radius * 0.40,
    radius * 0.32,
    radius * 0.16,
    Math.PI / 4,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Pinpoint 3D Sun Reflection Glint
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(-radius * 0.22, -radius * 0.58, radius * 0.09, 0, Math.PI * 2);
  ctx.fill();

  // Secondary Ambient Ground-Bounce Glare (Bottom-Right Translucent Flare)
  ctx.fillStyle = "rgba(255, 255, 255, 0.20)";
  ctx.beginPath();
  ctx.arc(radius * 0.35, radius * 0.32, radius * 0.24, 0, Math.PI * 2);
  ctx.fill();

  // 3D Fresnel Rim Arc along perimeter
  ctx.strokeStyle = rimGlowCol;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.92, Math.PI * 0.7, Math.PI * 1.65);
  ctx.stroke();

  // 10. Expressive 3D Eyes with Glistening Cornea & Depth Pupils
  const isBlinking = (now + seed * 10) % 4200 < 160;
  const eyeSpacing = radius * 0.28;
  const eyeY = -radius * 0.06;
  const eyeR = radius * 0.17;

  // Blushing cheeks
  ctx.fillStyle = "rgba(244, 63, 94, 0.65)";
  ctx.beginPath();
  ctx.ellipse(-eyeSpacing - eyeR * 0.9, eyeY + eyeR * 1.3, eyeR * 0.95, eyeR * 0.5, 0, 0, Math.PI * 2);
  ctx.ellipse(eyeSpacing + eyeR * 0.9, eyeY + eyeR * 1.3, eyeR * 0.95, eyeR * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  if (isBlinking || hpRatio < 0.25) {
    // Blinking / hurt eyes
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-eyeSpacing - eyeR, eyeY);
    ctx.lineTo(-eyeSpacing + eyeR, eyeY);
    ctx.moveTo(eyeSpacing - eyeR, eyeY);
    ctx.lineTo(eyeSpacing + eyeR, eyeY);
    ctx.stroke();
  } else if (isAttacking || isHit) {
    // Combat / Angry Eyes
    ctx.fillStyle = isSlowed ? "#ffffff" : eyeColor;
    ctx.beginPath();
    ctx.arc(-eyeSpacing, eyeY, eyeR, 0, Math.PI * 2);
    ctx.arc(eyeSpacing, eyeY, eyeR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(-eyeSpacing + 1, eyeY, eyeR * 0.55, 0, Math.PI * 2);
    ctx.arc(eyeSpacing - 1, eyeY, eyeR * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Angry Brow
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-eyeSpacing - eyeR * 1.1, eyeY - eyeR * 0.9);
    ctx.lineTo(-eyeSpacing + eyeR * 0.8, eyeY - eyeR * 0.2);
    ctx.moveTo(eyeSpacing + eyeR * 1.1, eyeY - eyeR * 0.9);
    ctx.lineTo(eyeSpacing - eyeR * 0.8, eyeY - eyeR * 0.2);
    ctx.stroke();
  } else {
    // Expressive 3D Spherical Eyeballs
    ctx.fillStyle = isSlowed ? "#ffffff" : eyeColor;
    ctx.beginPath();
    ctx.arc(-eyeSpacing, eyeY, eyeR, 0, Math.PI * 2);
    ctx.arc(eyeSpacing, eyeY, eyeR, 0, Math.PI * 2);
    ctx.fill();

    // 3D Iris / Pupil Tracking
    ctx.fillStyle = "#0f172a";
    const pOffX = Math.max(-1.5, Math.min(1.5, vx * 1.5));
    const pOffY = Math.max(-1.5, Math.min(1.5, vy * 1.5));
    ctx.beginPath();
    ctx.arc(-eyeSpacing + pOffX, eyeY + pOffY, eyeR * 0.56, 0, Math.PI * 2);
    ctx.arc(eyeSpacing + pOffX, eyeY + pOffY, eyeR * 0.56, 0, Math.PI * 2);
    ctx.fill();

    // Primary Specular Eye Glint
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(-eyeSpacing + pOffX - 1.0, eyeY + pOffY - 1.0, eyeR * 0.24, 0, Math.PI * 2);
    ctx.arc(eyeSpacing + pOffX - 1.0, eyeY + pOffY - 1.0, eyeR * 0.24, 0, Math.PI * 2);
    ctx.fill();

    // Secondary Micro Catchlight
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(-eyeSpacing + pOffX + 1.1, eyeY + pOffY + 1.1, eyeR * 0.12, 0, Math.PI * 2);
    ctx.arc(eyeSpacing + pOffX + 1.1, eyeY + pOffY + 1.1, eyeR * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  // Mouth
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2.0;
  ctx.lineCap = "round";
  ctx.beginPath();
  if (isAttacking) {
    ctx.fillStyle = strokeColor;
    ctx.arc(0, radius * 0.14, radius * 0.18, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.arc(0, radius * 0.1, radius * 0.14, 0, Math.PI, false);
  }
  ctx.stroke();

  ctx.restore(); // Restore scale & translate
  ctx.restore(); // Restore master save
}

if (typeof window !== "undefined") {
  window.drawSlimeEntity = drawSlimeEntity;
}
