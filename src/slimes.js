// slimes.js - Procedural Organic Slime Entity Renderer with Volumetric Gradients
import { computeFastSeed } from './helpers.js';

// Classic DVD Screensaver color palette: shifts to a new vibrant hue on each wall ricochet
const DVD_SCREENSAVER_COLORS = [
  "#38bdf8", // Electric Cyan
  "#f43f5e", // Crimson Rose
  "#a855f7", // Neon Purple
  "#22c55e", // Bright Emerald
  "#eab308", // Golden Topaz
  "#ec4899", // Hot Magenta
  "#06b6d4", // Deep Cyan
  "#f97316"  // Radiant Orange
];

const _dvdEyeMap = new Map();

/**
 * Returns color palettes tailored for each slime archetype and state.
 * Emphasizes rich multi-stop volumetric gradients with zero harsh static lines.
 */
function getSlimePalette(type, isSlowed) {
  if (isSlowed) {
    return {
      name: "frost",
      radius: 17,
      baseHue: 200,
      glowAura: "rgba(56, 189, 248, 0.42)",
      bodyBack: ["#082f49", "#0369a1", "rgba(2, 132, 199, 0.85)"],
      bodyFront: ["rgba(224, 242, 254, 0.96)", "rgba(56, 189, 248, 0.86)", "rgba(2, 132, 199, 0.45)"],
      bodyBottom: "rgba(8, 47, 73, 0.72)",
      coreGrad: ["#ffffff", "#e0f2fe", "#38bdf8", "#0284c7"],
      fresnel: "rgba(186, 230, 253, 0.75)",
      highlight: "rgba(255, 255, 255, 0.92)",
      eyeGlow: "#38bdf8",
      pupilColor: "#082f49",
      cheekColor: "rgba(14, 165, 233, 0.4)",
      particleColors: ["#bae6fd", "#7dd3fc", "#38bdf8"]
    };
  }

  if (type === "toxic_slime" || type.includes("toxic") || type.includes("acid")) {
    return {
      name: "toxic",
      radius: 18,
      baseHue: 85,
      glowAura: "rgba(163, 230, 53, 0.48)",
      bodyBack: ["#14532d", "#3f6212", "rgba(77, 124, 15, 0.88)"],
      bodyFront: ["rgba(236, 252, 203, 0.97)", "rgba(163, 230, 53, 0.88)", "rgba(101, 163, 13, 0.48)"],
      bodyBottom: "rgba(20, 83, 45, 0.78)",
      coreGrad: ["#ffffff", "#bef264", "#84cc16", "#4d7c0f"],
      fresnel: "rgba(236, 252, 203, 0.78)",
      highlight: "rgba(255, 255, 255, 0.94)",
      eyeGlow: "#facc15",
      pupilColor: "#14532d",
      cheekColor: "rgba(132, 204, 22, 0.45)",
      particleColors: ["#d9f99d", "#a3e635", "#84cc16"]
    };
  }

  if (type === "magma_slime" || type.includes("magma") || type.includes("lava") || type.includes("fire")) {
    return {
      name: "magma",
      radius: 19,
      baseHue: 25,
      glowAura: "rgba(249, 115, 22, 0.52)",
      bodyBack: ["#450a0a", "#7c2d12", "rgba(154, 52, 18, 0.92)"],
      bodyFront: ["rgba(254, 240, 138, 0.97)", "rgba(249, 115, 22, 0.9)", "rgba(194, 65, 12, 0.48)"],
      bodyBottom: "rgba(69, 10, 10, 0.82)",
      coreGrad: ["#ffffff", "#fef08a", "#f97316", "#b91c1c"],
      fresnel: "rgba(254, 240, 138, 0.82)",
      highlight: "rgba(255, 255, 255, 0.96)",
      eyeGlow: "#fef08a",
      pupilColor: "#450a0a",
      cheekColor: "rgba(239, 68, 68, 0.5)",
      particleColors: ["#fef08a", "#fb923c", "#ef4444"]
    };
  }

  if (type === "frost_slime" || type.includes("frost") || type.includes("ice")) {
    return {
      name: "frost",
      radius: 17,
      baseHue: 195,
      glowAura: "rgba(56, 189, 248, 0.46)",
      bodyBack: ["#082f49", "#0369a1", "rgba(2, 132, 199, 0.88)"],
      bodyFront: ["rgba(224, 242, 254, 0.97)", "rgba(56, 189, 248, 0.88)", "rgba(2, 132, 199, 0.46)"],
      bodyBottom: "rgba(8, 47, 73, 0.78)",
      coreGrad: ["#ffffff", "#e0f2fe", "#38bdf8", "#0284c7"],
      fresnel: "rgba(186, 230, 253, 0.78)",
      highlight: "rgba(255, 255, 255, 0.94)",
      eyeGlow: "#e0f2fe",
      pupilColor: "#082f49",
      cheekColor: "rgba(14, 165, 233, 0.42)",
      particleColors: ["#e0f2fe", "#7dd3fc", "#0284c7"]
    };
  }

  if (type === "elite_slime" || type.includes("elite") || type.includes("gold") || type.includes("golden")) {
    return {
      name: "gold",
      radius: 22,
      baseHue: 45,
      glowAura: "rgba(250, 204, 21, 0.52)",
      bodyBack: ["#713f12", "#a16207", "rgba(202, 138, 4, 0.9)"],
      bodyFront: ["rgba(254, 249, 195, 0.98)", "rgba(250, 204, 21, 0.9)", "rgba(202, 138, 4, 0.48)"],
      bodyBottom: "rgba(113, 63, 18, 0.8)",
      coreGrad: ["#ffffff", "#fef9c3", "#eab308", "#854d0e"],
      fresnel: "rgba(254, 249, 195, 0.88)",
      highlight: "rgba(255, 255, 255, 0.97)",
      eyeGlow: "#ffffff",
      pupilColor: "#713f12",
      cheekColor: "rgba(245, 158, 11, 0.45)",
      particleColors: ["#fef9c3", "#fde047", "#eab308"],
      hasCrown: true
    };
  }

  if (type === "boss_slime") {
    return {
      name: "boss",
      radius: 46,
      baseHue: 210,
      glowAura: "rgba(56, 189, 248, 0.52)",
      bodyBack: ["#082f49", "#0369a1", "rgba(14, 165, 233, 0.92)"],
      bodyFront: ["rgba(224, 242, 254, 0.98)", "rgba(56, 189, 248, 0.92)", "rgba(2, 132, 199, 0.52)"],
      bodyBottom: "rgba(8, 47, 73, 0.82)",
      coreGrad: ["#ffffff", "#e0f2fe", "#0284c7", "#075985"],
      fresnel: "rgba(186, 230, 253, 0.88)",
      highlight: "rgba(255, 255, 255, 0.98)",
      eyeGlow: "#38bdf8",
      pupilColor: "#082f49",
      cheekColor: "rgba(14, 165, 233, 0.5)",
      particleColors: ["#bae6fd", "#38bdf8", "#0284c7"],
      hasCrown: true
    };
  }

  if (type === "slime_heavy") {
    return {
      name: "heavy",
      radius: 24,
      baseHue: 175,
      glowAura: "rgba(45, 212, 191, 0.48)",
      bodyBack: ["#134e4a", "#0f766e", "rgba(13, 148, 136, 0.9)"],
      bodyFront: ["rgba(204, 251, 241, 0.97)", "rgba(45, 212, 191, 0.9)", "rgba(13, 148, 136, 0.48)"],
      bodyBottom: "rgba(19, 78, 74, 0.8)",
      coreGrad: ["#ffffff", "#ccfbf1", "#14b8a6", "#115e59"],
      fresnel: "rgba(204, 251, 241, 0.78)",
      highlight: "rgba(255, 255, 255, 0.94)",
      eyeGlow: "#ccfbf1",
      pupilColor: "#134e4a",
      cheekColor: "rgba(20, 184, 166, 0.4)",
      particleColors: ["#99f6e4", "#2dd4bf", "#0d9488"],
      hasCrystal: true
    };
  }

  // Default: Organic Forest Green Slime
  return {
    name: "forest",
    radius: 17,
    baseHue: 145,
    glowAura: "rgba(74, 222, 128, 0.42)",
    bodyBack: ["#14532d", "#166534", "rgba(22, 163, 74, 0.88)"],
    bodyFront: ["rgba(220, 252, 231, 0.96)", "rgba(74, 222, 128, 0.88)", "rgba(22, 163, 74, 0.48)"],
    bodyBottom: "rgba(20, 83, 45, 0.78)",
    coreGrad: ["#ffffff", "#bbf7d0", "#22c55e", "#15803d"],
    fresnel: "rgba(187, 247, 208, 0.75)",
    highlight: "rgba(255, 255, 255, 0.92)",
    eyeGlow: "#bbf7d0",
    pupilColor: "#14532d",
    cheekColor: "rgba(34, 197, 94, 0.4)",
    particleColors: ["#bbf7d0", "#4ade80", "#16a34a"]
  };
}

/**
 * Builds a smooth continuous spline loop through radial points,
 * eliminating harsh polygonal lines and faceted polygon boundaries.
 */
function drawSmoothFluidPath(ctx, pts) {
  ctx.beginPath();
  const n = pts.length;
  if (n < 3) return;
  const startMidX = (pts[n - 1].x + pts[0].x) / 2;
  const startMidY = (pts[n - 1].y + pts[0].y) / 2;
  ctx.moveTo(startMidX, startMidY);
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    const midX = (pts[i].x + pts[next].x) / 2;
    const midY = (pts[i].y + pts[next].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
  }
  ctx.closePath();
}

export function drawSlimeEntity(ctx, x, y, ent, isShadowPass = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(2, 2);
  ctx.translate(-x, -y);

  const type = ent.type || "slime";
  const isSlowed = !!ent.isSlowed;

  if (ent._seed === undefined) {
    ent._seed = computeFastSeed(ent.id);
  }
  const seed = ent._seed;
  const now = performance.now();

  // World coordinates velocity
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
  let isAttacking = !!ent.isAttacking;
  if (typeof GameState !== "undefined" && GameState && typeof GameState.combatAnimations !== "undefined") {
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

  // Kinetic breathing & jiggle
  const timeScale = type === "boss_slime" ? 0.0025 : 0.0055;
  const jiggleAmp = isHit ? 0.35 : (isAttacking ? 0.28 : (isMoving ? 0.20 : (type === "boss_slime" ? 0.08 : 0.12)));
  const bounce = Math.sin(now * timeScale + seed) * jiggleAmp;
  const secondaryWobble = Math.cos(now * timeScale * 1.7 + seed * 0.5) * (jiggleAmp * 0.45);
  const hitWobble = isHit ? Math.sin(now * 0.06) * 0.16 : 0;

  // Ground compression & inertia lean
  const moveStretch = Math.min(0.24, Math.sqrt(vx * vx + vy * vy) * 0.05);
  const scaleX = (1 + bounce - moveStretch * 0.4 + hitWobble);
  const scaleY = (1 - bounce - secondaryWobble + moveStretch - hitWobble * 0.4);
  const moveAngle = isMoving ? Math.atan2(vy, vx) : 0;

  // Archetype palette configuration
  const pal = getSlimePalette(type, isSlowed);
  const radius = pal.radius;
  const shadowRx = radius;

  // Motion droplet particles
  if (!isShadowPass && isMoving && Math.random() < (type === "boss_slime" ? 0.35 : 0.16)) {
    if (typeof spawnParticle === "function") {
      spawnParticle({
        x: worldX + (Math.random() - 0.5) * radius,
        y: worldY + radius * 0.4 + (Math.random() - 0.5) * 4,
        vx: (Math.random() - 0.5) * 16 - vx * 8,
        vy: -4 - Math.random() * 12,
        color: pal.particleColors,
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

  // 1. Soft Multi-Stop Radial Ambient Occlusion Shadow (Zero Hard Lines)
  ctx.save();
  ctx.scale(1, 0.34);
  const shadowY = radius * 1.05 + bounce * 4;
  
  // Outer soft contact shadow
  const shadowGrd = ctx.createRadialGradient(0, shadowY, 0, 0, shadowY, shadowRx * scaleX * 1.25);
  shadowGrd.addColorStop(0, "rgba(5, 12, 10, 0.55)");
  shadowGrd.addColorStop(0.5, "rgba(5, 12, 10, 0.22)");
  shadowGrd.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = shadowGrd;
  ctx.beginPath();
  ctx.ellipse(0, shadowY, shadowRx * scaleX * 1.25, shadowRx * scaleX * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();

  // Translucent colored floor glow reflection
  const glowGrd = ctx.createRadialGradient(0, shadowY, 0, 0, shadowY, shadowRx * scaleX * 1.45);
  glowGrd.addColorStop(0, pal.glowAura);
  glowGrd.addColorStop(0.65, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glowGrd;
  ctx.beginPath();
  ctx.ellipse(0, shadowY, shadowRx * scaleX * 1.45, shadowRx * scaleX * 0.95, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (isShadowPass) {
    ctx.restore();
    ctx.restore();
    return;
  }

  // 2. Boss Atmospheric Radial Aura Glow
  if (type === "boss_slime") {
    const bsPulse = Math.sin(now * 0.0035) * 0.15 + 0.85;
    const auraGrd = ctx.createRadialGradient(0, -4, radius * 0.2, 0, 0, radius * 1.9 * bsPulse);
    auraGrd.addColorStop(0, pal.glowAura);
    auraGrd.addColorStop(0.55, "rgba(14, 165, 233, 0.16)");
    auraGrd.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = auraGrd;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.9 * bsPulse, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Fluid Body Transform
  if (isMoving) ctx.rotate(moveAngle * 0.12);
  ctx.scale(scaleX, scaleY);

  // Compute 24-point harmonic organic fluid membrane
  const pointsCount = 24;
  const perimeterPoints = [];
  for (let i = 0; i < pointsCount; i++) {
    const angle = (i / pointsCount) * Math.PI * 2;
    const wave1 = Math.sin(now * 0.0075 + angle * 3 + seed) * (radius * 0.055);
    const wave2 = Math.cos(now * 0.011 - angle * 2 + seed) * (radius * 0.038);
    // Organic tear-drop drooping: slightly wider bottom
    const verticalDroop = Math.sin(angle) * (radius * 0.04);
    const r = radius + wave1 + wave2 + verticalDroop;
    perimeterPoints.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r
    });
  }

  // 4. Backside Deep Volumetric Jelly Absorption Gradient
  const backGrd = ctx.createRadialGradient(
    0, radius * 0.42, radius * 0.08,
    0, 0, radius * 1.22
  );
  backGrd.addColorStop(0, pal.bodyBack[0]);
  backGrd.addColorStop(0.55, pal.bodyBack[1]);
  backGrd.addColorStop(0.92, pal.bodyBack[2]);
  backGrd.addColorStop(1, "rgba(0, 0, 0, 0.5)");

  ctx.fillStyle = backGrd;
  drawSmoothFluidPath(ctx, perimeterPoints);
  ctx.fill();

  // 5. Translucent Sub-Surface Scattering & Front Gel Dome (Multi-Stop Radial Gradient)
  const frontGrd = ctx.createRadialGradient(
    -radius * 0.35, -radius * 0.42, radius * 0.05,
    -radius * 0.08, -radius * 0.08, radius * 1.15
  );
  frontGrd.addColorStop(0, pal.bodyFront[0]);
  frontGrd.addColorStop(0.42, pal.bodyFront[1]);
  frontGrd.addColorStop(0.82, pal.bodyFront[2]);
  frontGrd.addColorStop(1, pal.bodyBottom);

  ctx.fillStyle = frontGrd;
  drawSmoothFluidPath(ctx, perimeterPoints);
  ctx.fill();

  // 6. Internal Ground-Bounce Ambient Liquid Caustic (Soft Refraction Crescent)
  const causticGrd = ctx.createRadialGradient(
    radius * 0.15, radius * 0.45, 0,
    radius * 0.15, radius * 0.45, radius * 0.65
  );
  causticGrd.addColorStop(0, pal.fresnel);
  causticGrd.addColorStop(0.65, "rgba(255, 255, 255, 0.05)");
  causticGrd.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = causticGrd;
  ctx.beginPath();
  ctx.ellipse(radius * 0.12, radius * 0.38, radius * 0.62, radius * 0.32, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // 7. Suspended 3D Bioluminescent Liquid Nucleus Core (Lineless Soft Radiant Falloff)
  ctx.save();
  const nParallaxX = -vx * 3.2 + Math.sin(now * 0.003 + seed) * 1.5;
  const nParallaxY = -vy * 3.2 + bounce * radius * 0.22;
  ctx.translate(nParallaxX, nParallaxY);

  const coreRadius = radius * 0.46;
  const coreGrad = ctx.createRadialGradient(
    -coreRadius * 0.25, -coreRadius * 0.25, 0,
    0, 0, coreRadius * 1.15
  );
  coreGrad.addColorStop(0, pal.coreGrad[0]);
  coreGrad.addColorStop(0.32, pal.coreGrad[1]);
  coreGrad.addColorStop(0.72, pal.coreGrad[2]);
  coreGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, 0, coreRadius * 1.15, 0, Math.PI * 2);
  ctx.fill();

  // Soft glowing plasma corona around nucleus (zero stroke line)
  const coronaGrad = ctx.createRadialGradient(0, 0, coreRadius * 0.5, 0, 0, coreRadius * 1.35);
  coronaGrad.addColorStop(0, pal.fresnel);
  coronaGrad.addColorStop(0.6, "rgba(255, 255, 255, 0.18)");
  coronaGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = coronaGrad;
  ctx.beginPath();
  ctx.arc(0, 0, coreRadius * 1.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 8. Suspended Relics with Soft Gradients
  ctx.save();
  const relicParallaxX = -vx * 1.8;
  const relicParallaxY = -vy * 1.8 + Math.sin(now * 0.0022 + seed * 2) * 2;
  ctx.translate(relicParallaxX, relicParallaxY);

  if (pal.hasCrown) {
    // Lineless Golden Crown with Rich Metallic Linear Gradients
    const crownSpin = Math.sin(now * 0.002) * 0.15;
    ctx.rotate(crownSpin);

    // Soft Crown Ambient Drop Shadow
    const crownShadowGrd = ctx.createRadialGradient(0, -radius * 0.08, 0, 0, -radius * 0.08, 14);
    crownShadowGrd.addColorStop(0, "rgba(0, 0, 0, 0.38)");
    crownShadowGrd.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = crownShadowGrd;
    ctx.beginPath();
    ctx.ellipse(0, -radius * 0.08, 13, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Metallic Gold Crown Facets
    const crownGrad = ctx.createLinearGradient(0, -radius * 0.44, 0, -radius * 0.1);
    crownGrad.addColorStop(0, "#fef08a");
    crownGrad.addColorStop(0.35, "#facc15");
    crownGrad.addColorStop(0.7, "#ca8a04");
    crownGrad.addColorStop(1, "#713f12");

    ctx.fillStyle = crownGrad;
    ctx.beginPath();
    ctx.moveTo(-13, -radius * 0.1);
    ctx.lineTo(-16, -radius * 0.34);
    ctx.lineTo(-8, -radius * 0.22);
    ctx.lineTo(0, -radius * 0.44);
    ctx.lineTo(8, -radius * 0.22);
    ctx.lineTo(16, -radius * 0.34);
    ctx.lineTo(13, -radius * 0.1);
    ctx.closePath();
    ctx.fill();

    // Soft Crown Rim Highlight
    const rimGrad = ctx.createLinearGradient(-13, 0, 13, 0);
    rimGrad.addColorStop(0, "rgba(255, 255, 255, 0.3)");
    rimGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.95)");
    rimGrad.addColorStop(1, "rgba(255, 255, 255, 0.3)");
    ctx.fillStyle = rimGrad;
    ctx.fillRect(-12, -radius * 0.12, 24, 2);

    // 3 Inlaid Radiant Gemstones with Radial Glows
    const gems = [
      { x: -14, y: -radius * 0.34, r: 2.5, c0: "#fca5a5", c1: "#dc2626" },
      { x: 0,   y: -radius * 0.44, r: 3.2, c0: "#93c5fd", c1: "#2563eb" },
      { x: 14,  y: -radius * 0.34, r: 2.5, c0: "#86efac", c1: "#16a34a" }
    ];
    for (const gem of gems) {
      const gGrd = ctx.createRadialGradient(gem.x - 0.6, gem.y - 0.6, 0.2, gem.x, gem.y, gem.r);
      gGrd.addColorStop(0, "#ffffff");
      gGrd.addColorStop(0.4, gem.c0);
      gGrd.addColorStop(1, gem.c1);
      ctx.fillStyle = gGrd;
      ctx.beginPath();
      ctx.arc(gem.x, gem.y, gem.r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (pal.hasCrystal) {
    // Inlaid Volumetric Crystal with Faceted Linear Gradients
    const crystalAngle = (now * 0.001 + seed) % (Math.PI * 2);
    ctx.save();
    ctx.translate(Math.sin(now * 0.001) * 3, -radius * 0.15);
    ctx.rotate(crystalAngle * 0.18);

    // Facet 1 (Deep Refraction)
    const f1Grd = ctx.createLinearGradient(-6, -8, 6, 8);
    f1Grd.addColorStop(0, "#042f2e");
    f1Grd.addColorStop(0.7, "#0f766e");
    f1Grd.addColorStop(1, "#14b8a6");
    ctx.fillStyle = f1Grd;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(-6, 0);
    ctx.lineTo(0, 8);
    ctx.closePath();
    ctx.fill();

    // Facet 2 (Luminous Face)
    const f2Grd = ctx.createLinearGradient(-6, -8, 6, 8);
    f2Grd.addColorStop(0, "#ffffff");
    f2Grd.addColorStop(0.35, "#5eead4");
    f2Grd.addColorStop(1, "#0d9488");
    ctx.fillStyle = f2Grd;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(6, 0);
    ctx.lineTo(0, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else {
    // 3D Floating Ancient Clover Leaf with Soft Translucent Gradients
    const cloverRot = Math.sin(now * 0.0015 + seed) * 0.35;
    ctx.save();
    ctx.translate(Math.cos(now * 0.001 + seed) * (radius * 0.25), -radius * 0.12);
    ctx.rotate(cloverRot);

    const clvGrd = ctx.createRadialGradient(0, 0, 0, 0, 0, 3.5);
    clvGrd.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    clvGrd.addColorStop(0.4, pal.fresnel);
    clvGrd.addColorStop(1, pal.bodyFront[1]);
    ctx.fillStyle = clvGrd;
    ctx.beginPath();
    ctx.ellipse(-2, -2, 2.6, 1.7, Math.PI / 4, 0, Math.PI * 2);
    ctx.ellipse(2, -2, 2.6, 1.7, -Math.PI / 4, 0, Math.PI * 2);
    ctx.ellipse(-2, 2, 2.6, 1.7, -Math.PI / 4, 0, Math.PI * 2);
    ctx.ellipse(2, 2, 2.6, 1.7, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // 9. Floating Liquid Micro-Bubbles with Radial Lens Flares (Zero Hard Lines)
  ctx.save();
  for (let i = 0; i < 4; i++) {
    const bSeed = seed + i * 512;
    const bCycle = ((now * 0.001 + i * 0.25 + bSeed) % 1.0);
    const bx = Math.sin(bCycle * Math.PI * 2 + bSeed) * (radius * 0.38);
    const by = (radius * 0.42) - bCycle * (radius * 0.95);
    const bAlpha = Math.sin(bCycle * Math.PI) * 0.82;
    const bSize = 1.2 + Math.sin(bCycle * Math.PI) * 1.6;

    const bubGrd = ctx.createRadialGradient(
      bx - bSize * 0.35, by - bSize * 0.35, 0.2,
      bx, by, bSize
    );
    bubGrd.addColorStop(0, `rgba(255, 255, 255, ${bAlpha * 0.95})`);
    bubGrd.addColorStop(0.4, `rgba(255, 255, 255, ${bAlpha * 0.55})`);
    bubGrd.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = bubGrd;
    ctx.beginPath();
    ctx.arc(bx, by, bSize, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 10. Separated DVD Screensaver Bouncing Eyes (Roaming Across the Entire Slime Body)
  const isBlinking = (now + seed * 10) % 4200 < 160;
  const eyeR = Math.max(2.8, radius * 0.165);

  const entKey = (ent.id || "preview_mob") + "_" + type;
  let dvd = _dvdEyeMap.get(entKey);
  const baseSpeed = Math.max(24, Math.round(radius * 1.5));

  if (!dvd || dvd.slimeRadius !== radius) {
    // Each eye starts in separate quadrants with 45-degree diagonal velocities
    dvd = {
      slimeRadius: radius,
      left: {
        x: -radius * 0.45,
        y: -radius * 0.30,
        vx: baseSpeed,
        vy: baseSpeed,
        colorIndex: seed % DVD_SCREENSAVER_COLORS.length,
        lastBounceTime: now
      },
      right: {
        x: radius * 0.45,
        y: radius * 0.25,
        vx: -baseSpeed,
        vy: -baseSpeed,
        colorIndex: (seed + 3) % DVD_SCREENSAVER_COLORS.length,
        lastBounceTime: now
      },
      lastTime: now
    };
    _dvdEyeMap.set(entKey, dvd);
  }

  // Smooth frame delta calculation
  const dt = Math.min(0.06, Math.max(0.001, (now - dvd.lastTime) / 1000));
  dvd.lastTime = now;

  // Update and ricochet each eye separately across the entire organic slime body
  const updateSingleEye = (eye) => {
    // Maintain constant DVD screensaver speed and true 45-degree diagonal trajectory
    const dirX = eye.vx >= 0 ? 1 : -1;
    const dirY = eye.vy >= 0 ? 1 : -1;
    eye.vx = dirX * baseSpeed;
    eye.vy = dirY * baseSpeed;

    eye.x += eye.vx * dt;
    eye.y += eye.vy * dt;

    // Evaluate organic slime fluid boundary at current eye angle
    const curDist = Math.hypot(eye.x, eye.y);
    const curAngle = Math.atan2(eye.y, eye.x);
    const wave1 = Math.sin(now * 0.0075 + curAngle * 3 + seed) * (radius * 0.055);
    const wave2 = Math.cos(now * 0.011 - curAngle * 2 + seed) * (radius * 0.038);
    const verticalDroop = Math.sin(curAngle) * (radius * 0.04);
    const slimeBoundaryR = radius + wave1 + wave2 + verticalDroop;

    // Full-body travel envelope: eye reaches all regions of the slime body right to the edge
    const maxAllowedR = Math.max(radius * 0.4, slimeBoundaryR - eyeR * 0.85);

    if (curDist >= maxAllowedR) {
      const nx = eye.x / (curDist || 1);
      const ny = eye.y / (curDist || 1);

      // Clamp position just inside the gelatin membrane
      eye.x = nx * (maxAllowedR * 0.985);
      eye.y = ny * (maxAllowedR * 0.985);

      let isCorner = false;
      let bounced = false;

      // DVD screensaver ricochet logic (45-degree angle reflection on wall hits)
      if (Math.abs(nx) > Math.abs(ny) * 1.25) {
        // Vertical side wall hit (left or right edge)
        if (eye.vx * nx > 0) {
          eye.vx = -eye.vx;
          bounced = true;
        }
      } else if (Math.abs(ny) > Math.abs(nx) * 1.25) {
        // Horizontal wall hit (top dome or bottom base)
        if (eye.vy * ny > 0) {
          eye.vy = -eye.vy;
          bounced = true;
        }
      } else {
        // Corner / shoulder hit
        if (eye.vx * nx > 0) eye.vx = -eye.vx;
        if (eye.vy * ny > 0) eye.vy = -eye.vy;
        bounced = true;
        isCorner = true;
      }

      // Guarantee direction reversal if still pointing outward
      if (!bounced) {
        if (eye.vx * nx > 0) eye.vx = -eye.vx;
        if (eye.vy * ny > 0) eye.vy = -eye.vy;
        bounced = true;
      }

      // Shift to the next bright DVD screensaver color on each bounce
      eye.colorIndex = (eye.colorIndex + 1) % DVD_SCREENSAVER_COLORS.length;
      eye.lastBounceTime = now;

      // Corner hit sparkle particle celebration
      if (isCorner && typeof spawnParticle === "function") {
        for (let k = 0; k < 6; k++) {
          spawnParticle({
            x: worldX + eye.x * 2,
            y: worldY + eye.y * 2,
            vx: (Math.random() - 0.5) * 45,
            vy: (Math.random() - 0.5) * 45,
            color: ["#ffffff", DVD_SCREENSAVER_COLORS[eye.colorIndex], "#fef08a"],
            size: 2.2,
            maxLife: 0.45,
            shrink: true
          });
        }
      }
    }
  };

  updateSingleEye(dvd.left);
  updateSingleEye(dvd.right);

  const leftColor = DVD_SCREENSAVER_COLORS[dvd.left.colorIndex];
  const rightColor = DVD_SCREENSAVER_COLORS[dvd.right.colorIndex];

  // Fluid inertia wobble on each separated eye
  const leftWobbleX = -vx * 2.0 + Math.sin(now * 0.007 + seed) * (radius * 0.025);
  const leftWobbleY = -vy * 2.0 + Math.cos(now * 0.008 + seed) * (radius * 0.03) + bounce * radius * 0.15;
  const rightWobbleX = -vx * 2.0 + Math.sin(now * 0.007 + seed + 2.5) * (radius * 0.025);
  const rightWobbleY = -vy * 2.0 + Math.cos(now * 0.008 + seed + 2.5) * (radius * 0.03) + bounce * radius * 0.15;

  // Contain rendered eye centers within the organic slime boundary under all motion
  const clampEyePosition = (ex, ey) => {
    const d = Math.hypot(ex, ey);
    const ang = Math.atan2(ey, ex);
    const w1 = Math.sin(now * 0.0075 + ang * 3 + seed) * (radius * 0.055);
    const w2 = Math.cos(now * 0.011 - ang * 2 + seed) * (radius * 0.038);
    const vDroop = Math.sin(ang) * (radius * 0.04);
    const maxR = (radius + w1 + w2 + vDroop) - eyeR * 0.75;
    if (d > maxR && d > 0.001) {
      return { x: (ex / d) * maxR, y: (ey / d) * maxR };
    }
    return { x: ex, y: ey };
  };

  const leftPos = clampEyePosition(dvd.left.x + leftWobbleX, dvd.left.y + leftWobbleY);
  const rightPos = clampEyePosition(dvd.right.x + rightWobbleX, dvd.right.y + rightWobbleY);

  const leftEyeX = leftPos.x;
  const leftEyeY = leftPos.y;
  const rightEyeX = rightPos.x;
  const rightEyeY = rightPos.y;

  // Visual interaction when separated eyes cross paths inside the translucent fluid
  const eyeDx = rightEyeX - leftEyeX;
  const eyeDy = rightEyeY - leftEyeY;
  const eyeDist = Math.hypot(eyeDx, eyeDy);
  if (eyeDist < eyeR * 2.4) {
    const midX = (leftEyeX + rightEyeX) / 2;
    const midY = (leftEyeY + rightEyeY) / 2;
    const crossAlpha = (1 - eyeDist / (eyeR * 2.4)) * 0.45;
    const crossGrd = ctx.createRadialGradient(midX, midY, 0, midX, midY, eyeR * 1.4);
    crossGrd.addColorStop(0, `rgba(255, 255, 255, ${crossAlpha})`);
    crossGrd.addColorStop(0.5, `rgba(186, 230, 253, ${crossAlpha * 0.5})`);
    crossGrd.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = crossGrd;
    ctx.beginPath();
    ctx.arc(midX, midY, eyeR * 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Soft Rosy Cheeks via Radial Gradients (following each separated eye closely)
  const drawCheek = (cx, cy) => {
    const chkGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, eyeR * 1.1);
    chkGrd.addColorStop(0, pal.cheekColor);
    chkGrd.addColorStop(0.6, "rgba(244, 63, 94, 0.16)");
    chkGrd.addColorStop(1, "rgba(244, 63, 94, 0)");
    ctx.fillStyle = chkGrd;
    ctx.beginPath();
    ctx.ellipse(cx, cy, eyeR * 1.1, eyeR * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  drawCheek(leftEyeX - eyeR * 0.45, leftEyeY + eyeR * 0.85);
  drawCheek(rightEyeX + eyeR * 0.45, rightEyeY + eyeR * 0.85);

  if (isBlinking || hpRatio < 0.25) {
    // Soft Lineless Closed Eyelid Creases (Deep Liquid Folds)
    const drawClosedEye = (cx, cy, eyeColor) => {
      const lidGrd = ctx.createLinearGradient(cx - eyeR, cy, cx + eyeR, cy);
      lidGrd.addColorStop(0, "rgba(0, 0, 0, 0.2)");
      lidGrd.addColorStop(0.5, eyeColor);
      lidGrd.addColorStop(1, "rgba(0, 0, 0, 0.2)");
      ctx.fillStyle = lidGrd;
      ctx.beginPath();
      ctx.ellipse(cx, cy, eyeR, 1.4, 0, 0, Math.PI * 2);
      ctx.fill();
    };
    drawClosedEye(leftEyeX, leftEyeY, leftColor);
    drawClosedEye(rightEyeX, rightEyeY, rightColor);
  } else {
    // Volumetric Spherical Eyeballs with Independent DVD Color Shifts
    const drawEye = (ex, ey, pOffX, pOffY, eyeColor) => {
      // Liquid Eye Socket Ambient Shadow
      const sckGrd = ctx.createRadialGradient(ex, ey, eyeR * 0.4, ex, ey, eyeR * 1.25);
      sckGrd.addColorStop(0, "rgba(0, 0, 0, 0.25)");
      sckGrd.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = sckGrd;
      ctx.beginPath();
      ctx.arc(ex, ey, eyeR * 1.25, 0, Math.PI * 2);
      ctx.fill();

      // Cornea / Sclera Spherical Radial Gradient tinted with DVD bouncing hue
      const sclGrd = ctx.createRadialGradient(
        ex - eyeR * 0.3, ey - eyeR * 0.3, 0.2,
        ex, ey, eyeR
      );
      sclGrd.addColorStop(0, "#ffffff");
      sclGrd.addColorStop(0.65, eyeColor);
      sclGrd.addColorStop(1, pal.fresnel);

      ctx.fillStyle = sclGrd;
      ctx.beginPath();
      ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
      ctx.fill();

      // Deep Liquid Pupil with Soft Rim
      const pupilR = (isAttacking || isHit) ? eyeR * 0.65 : eyeR * 0.54;
      const pupGrd = ctx.createRadialGradient(
        ex + pOffX, ey + pOffY, 0,
        ex + pOffX, ey + pOffY, pupilR
      );
      pupGrd.addColorStop(0, "#020617");
      pupGrd.addColorStop(0.85, pal.pupilColor);
      pupGrd.addColorStop(1, "rgba(15, 23, 42, 0.7)");

      ctx.fillStyle = pupGrd;
      ctx.beginPath();
      ctx.arc(ex + pOffX, ey + pOffY, pupilR, 0, Math.PI * 2);
      ctx.fill();

      // Primary Specular Cornea Sparkle
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(ex + pOffX - eyeR * 0.22, ey + pOffY - eyeR * 0.22, eyeR * 0.26, 0, Math.PI * 2);
      ctx.fill();

      // Secondary Micro Catchlight
      ctx.beginPath();
      ctx.arc(ex + pOffX + eyeR * 0.24, ey + pOffY + eyeR * 0.24, eyeR * 0.12, 0, Math.PI * 2);
      ctx.fill();
    };

    const leftPOffX = Math.max(-1.5, Math.min(1.5, vx * 1.5 + dvd.left.vx * 0.1));
    const leftPOffY = Math.max(-1.5, Math.min(1.5, vy * 1.5 + dvd.left.vy * 0.1));
    const rightPOffX = Math.max(-1.5, Math.min(1.5, vx * 1.5 + dvd.right.vx * 0.1));
    const rightPOffY = Math.max(-1.5, Math.min(1.5, vy * 1.5 + dvd.right.vy * 0.1));

    drawEye(leftEyeX, leftEyeY, leftPOffX, leftPOffY, leftColor);
    drawEye(rightEyeX, rightEyeY, rightPOffX, rightPOffY, rightColor);

    if (isAttacking || isHit) {
      // Soft Liquid Furrow Crease above eyes (Gradient-based instead of harsh line)
      const browGrd = ctx.createLinearGradient(leftEyeX, leftEyeY - eyeR, rightEyeX, rightEyeY - eyeR);
      browGrd.addColorStop(0, leftColor);
      browGrd.addColorStop(0.5, "rgba(0, 0, 0, 0.15)");
      browGrd.addColorStop(1, rightColor);
      ctx.fillStyle = browGrd;
      ctx.beginPath();
      ctx.ellipse(leftEyeX, leftEyeY - eyeR * 0.9, eyeR * 0.8, 1.2, -0.2, 0, Math.PI * 2);
      ctx.ellipse(rightEyeX, rightEyeY - eyeR * 0.9, eyeR * 0.8, 1.2, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 11. Multi-Lobe Liquid Specular Surface Sheen & Glare (Translucent Glass Dome Over Eyes)
  // Primary Liquid Glare (Top-Left)
  const specX = -radius * 0.36;
  const specY = -radius * 0.40;
  const specRx = radius * 0.36;
  const specRy = radius * 0.20;

  const specGrd = ctx.createRadialGradient(specX, specY, 0, specX, specY, specRx);
  specGrd.addColorStop(0, pal.highlight);
  specGrd.addColorStop(0.45, "rgba(255, 255, 255, 0.4)");
  specGrd.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = specGrd;
  ctx.beginPath();
  ctx.ellipse(specX, specY, specRx, specRy, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  // Sun Reflection Micro-Catchlight Glint
  const glintGrd = ctx.createRadialGradient(-radius * 0.22, -radius * 0.56, 0, -radius * 0.22, -radius * 0.56, radius * 0.12);
  glintGrd.addColorStop(0, "#ffffff");
  glintGrd.addColorStop(0.6, "rgba(255, 255, 255, 0.8)");
  glintGrd.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = glintGrd;
  ctx.beginPath();
  ctx.arc(-radius * 0.22, -radius * 0.56, radius * 0.12, 0, Math.PI * 2);
  ctx.fill();

  // Secondary Soft Ambient Ground-Bounce Sheen (Bottom-Right)
  const bncGrd = ctx.createRadialGradient(radius * 0.35, radius * 0.34, 0, radius * 0.35, radius * 0.34, radius * 0.3);
  bncGrd.addColorStop(0, "rgba(255, 255, 255, 0.28)");
  bncGrd.addColorStop(0.65, "rgba(255, 255, 255, 0.08)");
  bncGrd.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = bncGrd;
  ctx.beginPath();
  ctx.arc(radius * 0.35, radius * 0.34, radius * 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore(); // Scale & Translate
  ctx.restore(); // Master Save
}

if (typeof window !== "undefined") {
  window.drawSlimeEntity = drawSlimeEntity;
}
