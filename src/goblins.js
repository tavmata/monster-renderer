// goblins.js - Procedural 8-Directional Segmented Goblin Entity Renderer
import { computeFastSeed, safeCreateRadialGradient } from './helpers.js';

const MAGE_REGEX = /mage|shaman|occult/i;
const ARCHER_REGEX = /archer|bow|hunter|ranger/i;
const THIEF_REGEX = /thief|rogue|assassin|dagger|scout/i;

// Persistent cycle tracker ensuring exactly 1 arrow release per archer attack cycle across frames
const _archerFiredCycleMap = new Map();

export function drawGoblinEntity(ctx, x, y, ent, isShadowPass = false) {
  if (isShadowPass) return;
  if (!ent) ent = {};
  const type = ent.type || "goblin";
  const isSlowed = !!ent.isSlowed;
  const facingAngle = ent.facingAngle || 0;
  const moving = !!(ent.moving || ent.isMoving);
  if (ent._seed === undefined) {
    const id = ent.id || ("goblin_" + Math.round(x) + "_" + Math.round(y));
    // Bolt Opt: String Allocation Elimination - Replaced parseInt and .substring with zero-allocation computeFastSeed
    ent._seed = computeFastSeed(id);
  }
  const seed = ent._seed;

  // Attack state detection
  let isAttacking = !!(ent.isAttacking || ent.currentCast);
  const nowMs = performance.now();
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

  // Archetype & Identity Mapping
  const isBasicGoblin = type === "goblin";
  const isMage = MAGE_REGEX.test(type);
  const isArcher = ARCHER_REGEX.test(type);
  const isThief = THIEF_REGEX.test(type);
  const isBrute = type.includes("brute");
  const isWarrior = type.includes("warrior") || isBrute;
  const isKing = type === "boss_goblin_king";
  const isBoss = isKing || /^boss_/.test(type);
  const scale = isKing ? 2.9 : isBrute ? 2.3 : isBoss ? 2.25 : isBasicGoblin ? 1.7 : 1.8;

  // -------------------------------------------------------------
  // 8-Direction Mathematical Sector Mapping
  // 0: E, 1: SE, 2: S, 3: SW, 4: W, 5: NW, 6: N, 7: NE
  // -------------------------------------------------------------
  const normAngle = ((facingAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const dirIndex = Math.floor(((normAngle + Math.PI / 8) % (Math.PI * 2)) / (Math.PI / 4));

  // -------------------------------------------------------------
  // True 3D Anatomical Octagonal Matrix
  // Dual-Arm Coordination with Dynamic Depth Sorting in All 8 Angles
  // -------------------------------------------------------------
  const octagonalMatrix = [
    // 0: East (E) - Side Profile facing Right (Right arm far side = behind, Left arm near side = front)
    {
      dir: "E", view: "side", flip: 1, tilt: 0.14,
      headX: 2.0, headY: -18.5, earSpread: 15.0,
      tailX: -10.0, tailY: -2.0, tailFront: false,
      rightArmX: 2.0, rightArmY: -9.5, rightArmFront: false,
      leftArmX: -1.2, leftArmY: -8.8, leftArmFront: true,
      rightLegHipX: -0.6, rightLegFootX: -1.2, rightLegFront: false,
      leftLegHipX: 0.6, leftLegFootX: 1.4,
      facingDirX: 1.0,
      earringVisible: false
    },
    // 1: South-East (SE) - 3/4 Front facing Down-Right (Right arm far side = behind, Left arm near side = front)
    {
      dir: "SE", view: "front_diag", flip: 1, tilt: 0.08,
      headX: 1.4, headY: -18.0, earSpread: 17.5,
      tailX: -7.5, tailY: -0.5, tailFront: false,
      rightArmX: -3.2, rightArmY: -9.5, rightArmFront: false,
      leftArmX: 4.2, leftArmY: -9.0, leftArmFront: true,
      rightLegHipX: -2.4, rightLegFootX: -2.6, rightLegFront: false,
      leftLegHipX: 2.2, leftLegFootX: 3.4,
      facingDirX: 0.7,
      earringVisible: true, earringScreenRight: true
    },
    // 2: South (S) - Direct Front facing Camera (Both arms in foreground)
    {
      dir: "S", view: "front", flip: 1, tilt: 0.00,
      headX: 0.0, headY: -17.8, earSpread: 18.5,
      tailX: 0.0, tailY: 1.0, tailFront: false,
      rightArmX: -4.4, rightArmY: -9.5, rightArmFront: true,
      leftArmX: 4.4, leftArmY: -9.5, leftArmFront: true,
      rightLegHipX: -3.2, rightLegFootX: -3.6, rightLegFront: true,
      leftLegHipX: 3.2, leftLegFootX: 3.6,
      facingDirX: 0.0,
      earringVisible: true, earringScreenRight: true
    },
    // 3: South-West (SW) - 3/4 Front facing Down-Left (Right arm near side = front, Left arm far side = behind)
    {
      dir: "SW", view: "front_diag", flip: -1, tilt: -0.08,
      headX: -1.4, headY: -18.0, earSpread: 17.5,
      tailX: 7.5, tailY: -0.5, tailFront: false,
      rightArmX: -3.8, rightArmY: -9.5, rightArmFront: true,
      leftArmX: 3.2, leftArmY: -9.0, leftArmFront: false,
      rightLegHipX: -2.2, rightLegFootX: -3.4, rightLegFront: true,
      leftLegHipX: 2.4, leftLegFootX: 2.6,
      facingDirX: -0.7,
      earringVisible: true, earringScreenRight: true
    },
    // 4: West (W) - Side Profile facing Left (Right arm near side = front, Left arm far side = behind)
    {
      dir: "W", view: "side", flip: -1, tilt: -0.14,
      headX: -2.0, headY: -18.5, earSpread: 15.0,
      tailX: 10.0, tailY: -2.0, tailFront: false,
      rightArmX: -2.8, rightArmY: -9.5, rightArmFront: true,
      leftArmX: 1.2, leftArmY: -8.8, leftArmFront: false,
      rightLegHipX: -0.6, rightLegFootX: -1.4, rightLegFront: true,
      leftLegHipX: 0.6, leftLegFootX: 1.2,
      facingDirX: -1.0,
      earringVisible: true, earringScreenRight: false
    },
    // 5: North-West (NW) - 3/4 Back facing Up-Left (Right arm far side = behind, Left arm near side = front)
    {
      dir: "NW", view: "back_diag", flip: -1, tilt: -0.08,
      headX: -1.2, headY: -19.2, earSpread: 17.5,
      tailX: 6.5, tailY: 5.5, tailFront: true,
      rightArmX: 3.5, rightArmY: -9.5, rightArmFront: false,
      leftArmX: -3.8, leftArmY: -9.0, leftArmFront: true,
      rightLegHipX: -2.2, rightLegFootX: -3.0, rightLegFront: true,
      leftLegHipX: 2.4, leftLegFootX: 2.4,
      facingDirX: -0.7,
      earringVisible: true, earringScreenRight: false
    },
    // 6: North (N) - Direct Back facing Up (Both arms layered in background)
    {
      dir: "N", view: "back", flip: 1, tilt: 0.00,
      headX: 0.0, headY: -19.5, earSpread: 18.0,
      tailX: 0.0, tailY: 6.5, tailFront: true,
      rightArmX: 4.4, rightArmY: -9.5, rightArmFront: false,
      leftArmX: -4.4, leftArmY: -9.5, leftArmFront: false,
      rightLegHipX: -3.2, rightLegFootX: -3.6, rightLegFront: false,
      leftLegHipX: 3.2, leftLegFootX: 3.6,
      facingDirX: 0.0,
      earringVisible: true, earringScreenRight: false
    },
    // 7: North-East (NE) - 3/4 Back facing Up-Right (Right arm near side = front, Left arm far side = behind)
    {
      dir: "NE", view: "back_diag", flip: 1, tilt: 0.08,
      headX: 1.2, headY: -19.2, earSpread: 17.5,
      tailX: -6.5, tailY: 5.5, tailFront: true,
      rightArmX: 3.5, rightArmY: -9.5, rightArmFront: true,
      leftArmX: -3.2, leftArmY: -9.0, leftArmFront: false,
      rightLegHipX: -2.4, rightLegFootX: -2.4, rightLegFront: false,
      leftLegHipX: 2.2, leftLegFootX: 3.0,
      facingDirX: 0.7,
      earringVisible: true, earringScreenRight: false
    }
  ];

  const cfg = octagonalMatrix[dirIndex] || octagonalMatrix[2];
  const isBackView = cfg.view === "back" || cfg.view === "back_diag";
  const isFrontView = cfg.view === "front" || cfg.view === "front_diag";
  const isProfileView = cfg.view === "side";
  const isDiagView = cfg.view === "front_diag" || cfg.view === "back_diag";

  // -------------------------------------------------------------
  // Cohesive Animation Kinetics (Breathing, Scampering, Lunging)
  // -------------------------------------------------------------
  const speedFactor = isSlowed ? 0.5 : 1.0;
  const walkSpeedMult = isBasicGoblin ? 0.012 : 0.010;
  const walkPhase = (nowMs * walkSpeedMult * speedFactor + seed) % (Math.PI * 2);
  const breathCycle = Math.sin(nowMs * 0.003 + seed) * 0.35;

  const bounce = moving ? Math.abs(Math.sin(walkPhase)) * 2.6 : breathCycle;
  const legSwing = moving ? Math.sin(walkPhase) * 4.8 : 0;

  // Attack 4-Phase Progress
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
    attackProgress = Math.min(1.0, Math.max(0, (nowMs - animStart) / 360));
  }

  // Directional Attack Lunge Vector
  let lungeX = 0;
  let lungeY = 0;
  let squashX = 1;
  let squashY = 1;

  if (moving) {
    squashY = 1 - Math.abs(Math.sin(walkPhase)) * 0.06;
    squashX = 1 + Math.abs(Math.sin(walkPhase)) * 0.04;
  }

  if (isAttacking && attackProgress > 0) {
    const atkDirX = Math.cos(facingAngle);
    const atkDirY = Math.sin(facingAngle);
    if (isArcher) {
      if (attackProgress < 0.52) {
        // Draw bow: steady archer footing, subtle lean back
        const t = attackProgress / 0.52;
        squashY = 1 - t * 0.04;
        squashX = 1 + t * 0.03;
        lungeX = -atkDirX * t * 1.6;
        lungeY = -atkDirY * t * 1.6;
      } else {
        // Release: bow recoil bump
        const t = (attackProgress - 0.52) / 0.48;
        const recoil = Math.sin(t * Math.PI) * Math.exp(-t * 3);
        lungeX = -atkDirX * 1.6 + atkDirX * recoil * 1.8;
        lungeY = -atkDirY * 1.6 + atkDirY * recoil * 1.8;
      }
    } else if (attackProgress < 0.25) {
      const t = attackProgress / 0.25;
      squashY = 1 - t * 0.10;
      squashX = 1 + t * 0.06;
      lungeX = -atkDirX * t * 2.2;
      lungeY = -atkDirY * t * 2.2;
    } else if (attackProgress < 0.65) {
      const t = (attackProgress - 0.25) / 0.40;
      const stretch = Math.sin(t * Math.PI);
      squashY = 1 + stretch * 0.15;
      squashX = 1 - stretch * 0.07;
      lungeX = atkDirX * stretch * 6.0;
      lungeY = atkDirY * stretch * 4.0;
    }
  }

  // Automatic Arrow Release for Goblin Archer (Guaranteed exactly 1 arrow per basic attack cycle)
  const archerEntKey = ent.id || ("goblin_" + Math.round(x) + "_" + Math.round(y));
  if (!isShadowPass && isArcher && isAttacking && attackProgress >= 0.52) {
    const animStart = ent.attackStart || ent.lastAttackTime || ent.attackTime || (ent.currentCast ? ent.currentCast.startTime : null);
    let cycleKey = animStart;
    if (!cycleKey) {
      if (!ent._attackCycleStart) {
        ent._attackCycleStart = nowMs;
      }
      cycleKey = ent._attackCycleStart;
    }

    const lastFired = _archerFiredCycleMap.get(archerEntKey) || ent._lastArrowFiredCycle;
    if (lastFired !== cycleKey) {
      _archerFiredCycleMap.set(archerEntKey, cycleKey);
      ent._lastArrowFiredCycle = cycleKey;
      const launchX = x + Math.cos(facingAngle) * 16 * scale;
      const launchY = y - (9.5 * scale) + Math.sin(facingAngle) * 16 * scale;
      shootGoblinArrow({
        x: launchX,
        y: launchY,
        angle: facingAngle,
        sourceId: ent.id || "goblin_archer",
        speed: 720
      });
    }
  } else if (!isAttacking) {
    _archerFiredCycleMap.delete(archerEntKey);
    ent._lastArrowFiredCycle = null;
    ent._attackCycleStart = null;
  }

  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // Harmonic Natural Goblin Palette (Earthy Moss & Forest Darks)
  // -------------------------------------------------------------
  const skinBase = isSlowed ? "#38bdf8" : isThief ? "#1f5f30" : isMage ? "#1b6350" : isWarrior ? "#287038" : isBrute ? "#1e562c" : isKing ? "#34853d" : "#2d7a38";
  const skinDark = isSlowed ? "#0284c7" : isThief ? "#123d1e" : isMage ? "#104235" : isWarrior ? "#164622" : isBrute ? "#10361a" : isKing ? "#1d5225" : "#1a4c23";
  const innerEar = isSlowed ? "#0284c7" : isMage ? "#0d3b2f" : "#14401e";
  const eyeColor = isMage ? "#c084fc" : isKing ? "#fbbf24" : isThief ? "#f97316" : isWarrior ? "#ea580c" : "#facc15";

  // Ground shadow circle removed per design rule: never render solid shadow circles around monsters

  ctx.save();
  ctx.translate(x + lungeX, y + lungeY - bounce);
  ctx.scale(scale * squashX, scale * squashY);

  // Invariant Anatomical Anchors
  const torsoX = 0;
  const torsoY = -9.5;
  const hunchTilt = cfg.tilt;
  const headX = cfg.headX;
  const headY = cfg.headY;

  // -------------------------------------------------------------
  // 2. Sinewy Whiplike Tail (Anchored to Pelvis) - Lineless
  // -------------------------------------------------------------
  const drawTail = () => {
    ctx.save();
    const tailWave = Math.sin(nowMs * 0.008 + seed) * 2.8 + (moving ? -cfg.flip * Math.cos(walkPhase) * 3.6 : 0);
    const tailBaseX = torsoX - (isProfileView ? cfg.flip * 4.5 : 0);
    const tailBaseY = torsoY + 4.2;
    const tailTipX = tailBaseX + cfg.tailX + (isProfileView ? tailWave * 0.3 : tailWave * 0.8);
    const tailTipY = tailBaseY + cfg.tailY + (isProfileView ? tailWave * 0.7 : Math.abs(tailWave) * 0.4);

    // Lineless tail body with natural skin tone
    ctx.strokeStyle = skinDark;
    ctx.lineWidth = 2.0;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(tailBaseX, tailBaseY);
    ctx.quadraticCurveTo(tailBaseX - (isProfileView ? cfg.flip * 4.0 : 0), tailBaseY + 1.8, tailTipX, tailTipY);
    ctx.stroke();

    // Sharp Tail Barb (Lineless filled shape)
    ctx.fillStyle = skinDark;
    ctx.beginPath();
    ctx.moveTo(tailTipX, tailTipY);
    ctx.lineTo(tailTipX - cfg.flip * 2.2, tailTipY - 1.8);
    ctx.lineTo(tailTipX - cfg.flip * 0.8, tailTipY);
    ctx.lineTo(tailTipX - cfg.flip * 2.2, tailTipY + 1.8);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  if (!cfg.tailFront) {
    drawTail();
  }

  // -------------------------------------------------------------
  // Dedicated Procedural 8-Direction & Continuous Aiming Goblin Archer System
  // Physically connects bow arm, draw arm, bowstring, and arrow at facingAngle
  // -------------------------------------------------------------
  const drawArcherEquipment = (isForegroundPass) => {
    if (isShadowPass || !isArcher) return;

    const aimAngle = normAngle;
    const dx = Math.cos(aimAngle);
    const dy = Math.sin(aimAngle);
    const px = -dy; // perpendicular vector X (-sin)
    const py = dx;  // perpendicular vector Y (cos)

    // 2.5D Layer depth:
    // When aiming upward/North (dy < -0.2), the extended bow is in the background behind the torso.
    const isBowInBackground = dy < -0.2;

    // Draw cycle kinematics
    let drawTension = 0;
    let stringTwang = 0;
    let isArrowLoaded = true;
    let arrowLoadProgress = 1.0;

    if (isAttacking) {
      if (attackProgress < 0.52) {
        drawTension = Math.sin((attackProgress / 0.52) * (Math.PI / 2));
        isArrowLoaded = true;
        arrowLoadProgress = 1.0;
      } else if (attackProgress < 0.72) {
        const relT = attackProgress - 0.52;
        stringTwang = Math.sin(relT * 60) * Math.exp(-relT * 12) * 2.8;
        drawTension = 0;
        isArrowLoaded = false;
      } else {
        const nockT = (attackProgress - 0.72) / 0.28;
        drawTension = 0;
        isArrowLoaded = true;
        arrowLoadProgress = nockT;
      }
    } else {
      drawTension = 0.0;
      isArrowLoaded = true;
      arrowLoadProgress = 1.0;
    }

    const chestX = torsoX;
    const chestY = torsoY;

    // Bow reach from chest along aim direction
    const bowReach = 11.2 + drawTension * 1.5;
    const bowHandleX = chestX + dx * bowReach;
    const bowHandleY = chestY + dy * bowReach;

    // Nock position along aim vector behind bow handle
    const baseNockDist = 5.0;
    const pullDist = 6.2 * drawTension;
    const nockDist = baseNockDist + pullDist - stringTwang;
    const drawHandX = bowHandleX - dx * nockDist;
    const drawHandY = bowHandleY - dy * nockDist;

    // Anatomical shoulders on goblin torso
    const bowShoulderX = chestX + px * 2.6 + dx * 1.0;
    const bowShoulderY = chestY + py * 2.6 + dy * 1.0;
    const drawShoulderX = chestX - px * 2.6 - dx * 1.2;
    const drawShoulderY = chestY - py * 2.6 - dy * 1.2;

    // If bow is in background and this is foreground pass:
    // Only render the draw arm and hand over the torso/back!
    if (isBowInBackground && isForegroundPass) {
      ctx.save();
      ctx.fillStyle = skinBase;
      ctx.beginPath();
      ctx.ellipse(drawShoulderX, drawShoulderY, 2.4, 2.0, aimAngle, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = skinDark;
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(drawShoulderX, drawShoulderY);
      ctx.lineTo(drawHandX, drawHandY);
      ctx.stroke();

      ctx.fillStyle = "#5c2b09";
      ctx.beginPath();
      ctx.arc(drawHandX, drawHandY, 1.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.arc(drawHandX + dx * 0.4, drawHandY + dy * 0.4, 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    // If bow is in foreground and this is background pass:
    // Render far shoulder behind the torso in side views
    if (!isBowInBackground && !isForegroundPass) {
      const farX = dx >= 0 ? drawShoulderX : bowShoulderX;
      const farY = dx >= 0 ? drawShoulderY : bowShoulderY;
      ctx.save();
      ctx.fillStyle = skinDark;
      ctx.beginPath();
      ctx.ellipse(farX, farY, 2.4, 1.9, aimAngle, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    // Main Bow & Arms Pass
    ctx.save();

    // 1. Bow Arm
    ctx.fillStyle = skinBase;
    ctx.beginPath();
    ctx.ellipse(bowShoulderX, bowShoulderY, 2.6, 2.1, aimAngle, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = skinDark;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(bowShoulderX, bowShoulderY);
    ctx.lineTo(bowHandleX, bowHandleY);
    ctx.stroke();

    // Leather Bracer on bow arm
    const bracerMidX = (bowShoulderX + bowHandleX * 2) / 3;
    const bracerMidY = (bowShoulderY + bowHandleY * 2) / 3;
    ctx.strokeStyle = "#3b2314";
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(bracerMidX - dx * 1.5, bracerMidY - dy * 1.5);
    ctx.lineTo(bracerMidX + dx * 1.5, bracerMidY + dy * 1.5);
    ctx.stroke();

    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(bracerMidX, bracerMidY, 0.65, 0, Math.PI * 2);
    ctx.fill();

    // 2. Draw Arm (if bow is in foreground)
    if (!isBowInBackground) {
      ctx.fillStyle = skinBase;
      ctx.beginPath();
      ctx.ellipse(drawShoulderX, drawShoulderY, 2.4, 2.0, aimAngle, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = skinDark;
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(drawShoulderX, drawShoulderY);
      ctx.lineTo(drawHandX, drawHandY);
      ctx.stroke();

      ctx.fillStyle = "#5c2b09";
      ctx.beginPath();
      ctx.arc(drawHandX, drawHandY, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Bow, Bowstring, Arrow & Claws (Transformed to bow handle and rotated along aimAngle)
    ctx.save();
    ctx.translate(bowHandleX, bowHandleY);
    ctx.rotate(aimAngle);

    // Bow Limb Flexing under tension
    const flexX = -1.8 - drawTension * 3.4;
    const topTipX = flexX;
    const topTipY = -12.5;
    const botTipX = flexX;
    const botTipY = 12.5;

    // Upper Recurve Limb
    ctx.strokeStyle = "#5a2d0c";
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(2.6 + flexX * 0.4, -6.5, topTipX, topTipY);
    ctx.stroke();

    // Upper inner belly laminate
    ctx.strokeStyle = "#78350f";
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(2.0 + flexX * 0.4, -6.5, topTipX - 0.5, topTipY);
    ctx.stroke();

    // Lower Recurve Limb
    ctx.strokeStyle = "#5a2d0c";
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(2.6 + flexX * 0.4, 6.5, botTipX, botTipY);
    ctx.stroke();

    // Lower inner belly laminate
    ctx.strokeStyle = "#78350f";
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(2.0 + flexX * 0.4, 6.5, botTipX - 0.5, botTipY);
    ctx.stroke();

    // Horn tip reinforcement on limbs
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(topTipX, topTipY, 1.2, 0, Math.PI * 2);
    ctx.arc(botTipX, botTipY, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Ivory nock grooves on limb tips
    ctx.fillStyle = "#fef3c7";
    ctx.beginPath();
    ctx.arc(topTipX - 0.4, topTipY, 0.5, 0, Math.PI * 2);
    ctx.arc(botTipX - 0.4, botTipY, 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Riser / Handle Wrap (Tanned leather with cross-stitches)
    ctx.fillStyle = "#92400e";
    ctx.beginPath();
    ctx.ellipse(0, 0, 1.8, 3.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Carved arrow shelf on riser
    ctx.fillStyle = "#5c2b09";
    ctx.fillRect(-0.8, -1.8, 1.6, 0.8);

    ctx.strokeStyle = "#fef08a";
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(-0.8, -2.0); ctx.lineTo(0.8, 2.0);
    ctx.moveTo(0.8, -2.0);  ctx.lineTo(-0.8, 2.0);
    ctx.stroke();

    // Bowstring (Braided sinew)
    const localNockX = -nockDist;
    ctx.strokeStyle = "rgba(241, 245, 249, 0.88)";
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    ctx.moveTo(topTipX, topTipY);
    if (drawTension > 0.02 || isArrowLoaded) {
      ctx.lineTo(localNockX, 0);
      ctx.lineTo(botTipX, botTipY);
    } else if (Math.abs(stringTwang) > 0.15) {
      ctx.quadraticCurveTo(flexX + stringTwang, 0, botTipX, botTipY);
    } else {
      ctx.lineTo(botTipX, botTipY);
    }
    ctx.stroke();

    // NOCKED ARROW
    if (isArrowLoaded) {
      let arrowHeadDist = 13.5 - drawTension * 4.2;
      if (arrowLoadProgress < 1.0) {
        arrowHeadDist = 7.0 + arrowLoadProgress * 6.5;
      }

      const arrowHeadX = arrowHeadDist;
      const arrowTailX = localNockX;
      const arrowShelfY = -0.5;

      // 1. High-Density Cedar Shaft
      const shaftLen = arrowHeadX - arrowTailX;
      ctx.fillStyle = "#854d0e";
      ctx.fillRect(arrowTailX, arrowShelfY - 0.8, shaftLen, 1.6);

      // Wood grain specular highlight
      ctx.fillStyle = "#b45309";
      ctx.fillRect(arrowTailX, arrowShelfY - 0.8, shaftLen, 0.5);

      // Lower ambient shadow
      ctx.fillStyle = "#5c2b09";
      ctx.fillRect(arrowTailX, arrowShelfY + 0.4, shaftLen, 0.4);

      // 2. Sinew Thread Bindings
      ctx.fillStyle = "#3b1d06";
      ctx.fillRect(arrowHeadX - 1.8, arrowShelfY - 0.9, 1.4, 1.8);
      ctx.fillRect(arrowTailX + 4.2, arrowShelfY - 0.9, 1.2, 1.8);
      ctx.fillRect(arrowTailX + 0.8, arrowShelfY - 0.9, 1.0, 1.8);

      // 3. Chipped Flint / Obsidian Broadhead Blade
      ctx.save();
      ctx.translate(arrowHeadX, arrowShelfY);
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.moveTo(5.2, 0);
      ctx.lineTo(0.2, -2.6);
      ctx.lineTo(0.9, -0.6);
      ctx.lineTo(0.9, 0.6);
      ctx.lineTo(0.2, 2.6);
      ctx.closePath();
      ctx.fill();

      // Obsidian facet highlight
      ctx.fillStyle = "#475569";
      ctx.beginPath();
      ctx.moveTo(5.2, 0);
      ctx.lineTo(0.8, -1.8);
      ctx.lineTo(1.8, 0);
      ctx.closePath();
      ctx.fill();

      // Razor edge specular glint
      ctx.strokeStyle = "rgba(248, 250, 252, 0.9)";
      ctx.lineWidth = 0.55;
      ctx.beginPath();
      ctx.moveTo(5.2, 0);
      ctx.lineTo(0.3, -2.5);
      ctx.stroke();
      ctx.restore();

      // 4. Split-Feather Fletchings
      // Upper Vane
      ctx.fillStyle = "#166534";
      ctx.beginPath();
      ctx.moveTo(arrowTailX, arrowShelfY - 0.4);
      ctx.lineTo(arrowTailX - 4.2, arrowShelfY - 2.8);
      ctx.lineTo(arrowTailX - 1.4, arrowShelfY - 2.8);
      ctx.lineTo(arrowTailX + 0.4, arrowShelfY - 0.4);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#fef08a";
      ctx.beginPath();
      ctx.moveTo(arrowTailX - 2.8, arrowShelfY - 0.4);
      ctx.lineTo(arrowTailX - 3.4, arrowShelfY - 2.6);
      ctx.lineTo(arrowTailX - 2.4, arrowShelfY - 2.6);
      ctx.lineTo(arrowTailX - 1.8, arrowShelfY - 0.4);
      ctx.closePath();
      ctx.fill();

      // Lower Vane
      ctx.fillStyle = "#15803d";
      ctx.beginPath();
      ctx.moveTo(arrowTailX, arrowShelfY + 0.4);
      ctx.lineTo(arrowTailX - 4.2, arrowShelfY + 2.8);
      ctx.lineTo(arrowTailX - 1.4, arrowShelfY + 2.8);
      ctx.lineTo(arrowTailX + 0.4, arrowShelfY + 0.4);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#fef08a";
      ctx.beginPath();
      ctx.moveTo(arrowTailX - 2.8, arrowShelfY + 0.4);
      ctx.lineTo(arrowTailX - 3.4, arrowShelfY + 2.6);
      ctx.lineTo(arrowTailX - 2.4, arrowShelfY + 2.6);
      ctx.lineTo(arrowTailX - 1.8, arrowShelfY + 0.4);
      ctx.closePath();
      ctx.fill();

      // 5. Polished Bone Nock
      ctx.fillStyle = "#fef3c7";
      ctx.fillRect(arrowTailX - 1.2, arrowShelfY - 0.8, 1.4, 1.6);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(arrowTailX - 0.4, arrowShelfY - 0.5, 0.6, 1.0);

      // 6. Draw Hand Claws gripping the arrow nock (when not in background view)
      if (!isBowInBackground) {
        ctx.save();
        ctx.translate(arrowTailX, arrowShelfY);

        ctx.fillStyle = skinBase;
        ctx.beginPath();
        ctx.ellipse(0.2, -1.4, 1.2, 0.9, 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.moveTo(0.6, -1.8);
        ctx.lineTo(1.8, -0.7);
        ctx.lineTo(0.8, -0.4);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = skinBase;
        ctx.beginPath();
        ctx.ellipse(0.2, 1.4, 1.2, 0.9, -0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.moveTo(0.6, 1.8);
        ctx.lineTo(1.8, 0.7);
        ctx.lineTo(0.8, 0.4);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = skinDark;
        ctx.beginPath();
        ctx.arc(-0.6, 0, 0.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(1.4, -0.8, 0.25, 0, Math.PI * 2);
        ctx.arc(1.4, 0.8, 0.25, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    // 7. Bow Hand Grip on Riser
    for (let f = 0; f < 3; f++) {
      const fY = 1.0 + f * 1.3;
      ctx.fillStyle = skinBase;
      ctx.beginPath();
      ctx.ellipse(0.5, fY, 1.0, 0.75, 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.moveTo(1.2, fY - 0.4);
      ctx.lineTo(2.1, fY);
      ctx.lineTo(1.2, fY + 0.4);
      ctx.closePath();
      ctx.fill();
    }

    if (isArrowLoaded) {
      ctx.fillStyle = skinBase;
      ctx.beginPath();
      ctx.ellipse(0.5, -1.2, 1.2, 0.9, -0.25, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.moveTo(1.0, -1.8);
      ctx.lineTo(2.2, -0.8);
      ctx.lineTo(1.1, -0.4);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(1.8, -0.9, 0.28, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore(); // End local bow & arrow
    ctx.restore(); // End archer main pass
  };

  // -------------------------------------------------------------
  // 3. Feral Left Arm (Off-Hand Claws / Dagger & Wrist Wrap)
  // -------------------------------------------------------------
  const drawLeftArmOffHand = () => {
    if (isShadowPass || isArcher) return;
    ctx.save();
    const armX = cfg.leftArmX;
    const armY = cfg.leftArmY;
    ctx.translate(armX, armY);

    const armDirSign = armX < 0 ? -1 : 1;
    let baseArmRot = isArcher
      ? (isBackView ? -0.25 * armDirSign : -0.15 * armDirSign)
      : (isBackView ? -0.45 * armDirSign : 0.40 * armDirSign);

    // Feral sneak / guard pose micro-motion
    const idleOffHandWave = Math.sin(nowMs * 0.004 + seed + 1.2) * (isArcher ? 0.04 : 0.08);
    const walkOffHandSwing = moving ? -Math.sin(walkPhase) * (isArcher ? 0.08 : 0.22) : 0;
    let attackReaction = 0;
    if (isAttacking && attackProgress > 0) {
      if (isArcher) {
        if (attackProgress < 0.52) {
          // Draw bowstring back towards chest/jaw
          const drawT = attackProgress / 0.52;
          attackReaction = -armDirSign * drawT * 0.55;
        } else if (attackProgress < 0.72) {
          // Follow-through release recoil
          const relT = (attackProgress - 0.52) / 0.20;
          attackReaction = -armDirSign * 0.55 + armDirSign * Math.sin(relT * Math.PI) * 0.22;
        } else {
          // Re-nocking next arrow smoothly
          const nockT = (attackProgress - 0.72) / 0.28;
          attackReaction = -armDirSign * (0.35 * (1 - nockT));
        }
      } else {
        attackReaction = attackProgress < 0.3 ? -0.35 : 0.25;
      }
    }
    ctx.rotate(baseArmRot + idleOffHandWave + walkOffHandSwing + attackReaction);

    // Shoulder / Deltoid
    ctx.fillStyle = skinBase;
    ctx.beginPath();
    ctx.ellipse(0, 0, 2.6, 2.0, armDirSign * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Warty freckle on shoulder
    ctx.fillStyle = skinDark;
    ctx.beginPath();
    ctx.arc(armDirSign * 0.5, -0.6, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Forearm angled inward in defensive/prowling posture
    const handX = armDirSign * 4.8;
    const handY = isArcher ? 1.4 : 2.4;

    ctx.fillStyle = skinDark;
    ctx.beginPath();
    ctx.moveTo(-0.8, -0.4);
    ctx.lineTo(handX, handY - 0.4);
    ctx.lineTo(handX - armDirSign * 0.8, handY + 1.4);
    ctx.lineTo(-0.8, 1.4);
    ctx.closePath();
    ctx.fill();

    if (isArcher) {
      // Archer's Reinforced Leather Bracer (Forearm guard against bowstring slap)
      ctx.fillStyle = "#3b2314";
      ctx.fillRect(handX - armDirSign * 2.8, handY - 1.2, 2.6, 2.4);
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(handX - armDirSign * 2.5, handY - 0.8, 0.8, 1.6);
    } else {
      // Tattered Leather / Cord Wrist Wrap
      ctx.fillStyle = "#451a03";
      ctx.beginPath();
      ctx.ellipse(handX - armDirSign * 1.4, handY + 0.4, 1.3, 1.1, armDirSign * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Hand Knuckle & Weapon / Grip
    ctx.fillStyle = skinBase;
    ctx.beginPath();
    ctx.arc(handX, handY, 1.5, 0, Math.PI * 2);
    ctx.fill();

    if (isThief) {
      // Thief / Assassin: Off-Hand Poison Stiletto
      ctx.save();
      ctx.translate(handX, handY);
      ctx.rotate(-armDirSign * 0.8);
      ctx.fillStyle = "#334155";
      ctx.beginPath();
      ctx.moveTo(0, -1.0);
      ctx.lineTo(-armDirSign * 0.8, -9.0);
      ctx.lineTo(armDirSign * 2.2, -10.5);
      ctx.lineTo(armDirSign * 1.5, -4.0);
      ctx.closePath();
      ctx.fill();

      // Poison Drip Highlight
      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.arc(armDirSign * 2.0, -10.0, 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (isArcher) {
      // Archer's Draw Hand: Anatomical pinch grip with hooked claws holding arrow nock
      ctx.fillStyle = "#5c2b09"; // Archer leather shooting tab
      ctx.beginPath();
      ctx.ellipse(handX + armDirSign * 0.5, handY, 1.3, 1.1, armDirSign * 0.2, 0, Math.PI * 2);
      ctx.fill();

      const isReleasing = isAttacking && attackProgress >= 0.52 && attackProgress < 0.70;
      ctx.fillStyle = "#0f172a"; // Sharp obsidian claws
      if (isReleasing) {
        // Claws splayed open from release follow-through
        ctx.beginPath();
        ctx.moveTo(handX + armDirSign * 0.4, handY - 1.2);
        ctx.lineTo(handX + armDirSign * 2.4, handY - 1.8);
        ctx.lineTo(handX + armDirSign * 1.0, handY - 0.4);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(handX + armDirSign * 0.6, handY + 0.2);
        ctx.lineTo(handX + armDirSign * 2.8, handY + 0.6);
        ctx.lineTo(handX + armDirSign * 1.0, handY + 1.0);
        ctx.closePath();
        ctx.fill();
      } else {
        // Claws hooked tightly in locked Mediterranean draw pinch around nock
        // Claw 1 (Index claw curling over nock)
        ctx.beginPath();
        ctx.moveTo(handX, handY - 1.2);
        ctx.lineTo(handX + armDirSign * 2.0, handY - 0.6);
        ctx.lineTo(handX + armDirSign * 1.2, handY + 0.1);
        ctx.lineTo(handX - armDirSign * 0.2, handY - 0.4);
        ctx.closePath();
        ctx.fill();

        // Claw 2 (Middle claw curling under string)
        ctx.beginPath();
        ctx.moveTo(handX + armDirSign * 0.2, handY + 0.2);
        ctx.lineTo(handX + armDirSign * 2.2, handY + 0.8);
        ctx.lineTo(handX + armDirSign * 1.0, handY + 1.4);
        ctx.lineTo(handX - armDirSign * 0.2, handY + 0.6);
        ctx.closePath();
        ctx.fill();

        // Claw 3 (Thumb support)
        ctx.beginPath();
        ctx.moveTo(handX - armDirSign * 0.4, handY - 0.8);
        ctx.lineTo(handX + armDirSign * 1.2, handY - 1.2);
        ctx.lineTo(handX + armDirSign * 0.6, handY - 0.2);
        ctx.closePath();
        ctx.fill();

        // Specular glint on hooked claw tips
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(handX + armDirSign * 1.8, handY - 0.4, 0.35, 0, Math.PI * 2);
        ctx.arc(handX + armDirSign * 1.9, handY + 0.9, 0.35, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // 3 Sharp Curved Talons / Claws (Lineless)
      ctx.fillStyle = "#0f172a";

      // Claw 1 (Thumb / inner)
      ctx.beginPath();
      ctx.moveTo(handX + armDirSign * 0.4, handY - 1.0);
      ctx.lineTo(handX + armDirSign * 2.2, handY - 1.4);
      ctx.lineTo(handX + armDirSign * 1.0, handY - 0.2);
      ctx.closePath();
      ctx.fill();

      // Claw 2 (Middle)
      ctx.beginPath();
      ctx.moveTo(handX + armDirSign * 0.8, handY - 0.2);
      ctx.lineTo(handX + armDirSign * 2.6, handY + 0.4);
      ctx.lineTo(handX + armDirSign * 0.8, handY + 0.8);
      ctx.closePath();
      ctx.fill();

      // Claw 3 (Outer)
      ctx.beginPath();
      ctx.moveTo(handX + armDirSign * 0.4, handY + 0.6);
      ctx.lineTo(handX + armDirSign * 2.0, handY + 1.6);
      ctx.lineTo(handX, handY + 1.2);
      ctx.closePath();
      ctx.fill();

      // Specular glint on claws
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(handX + armDirSign * 1.8, handY + 0.2, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  // Draw background arms if layered behind
  if (isArcher) {
    drawArcherEquipment(false);
  } else if (!cfg.leftArmFront) {
    drawLeftArmOffHand();
  }

  // -------------------------------------------------------------
  // 4. Dominant Right-Hand Weapon (100% Consistent Anatomical Right Hand)
  // -------------------------------------------------------------
  const drawRightHandWeapon = () => {
    if (isShadowPass || isArcher) return;
    ctx.save();
    const armX = cfg.rightArmX;
    const armY = cfg.rightArmY;
    const armDirSign = armX < 0 ? -1 : 1;
    ctx.translate(armX, armY);

    let swingAngle = 0;
    if (isArcher) {
      if (isAttacking) {
        if (attackProgress < 0.52) {
          // Raise & steady bow arm into aim
          const t = attackProgress / 0.52;
          swingAngle = -armDirSign * 0.22 * t;
        } else if (attackProgress < 0.72) {
          // Release recoil forward spring
          const rel = (attackProgress - 0.52) / 0.20;
          swingAngle = -armDirSign * 0.22 + armDirSign * Math.sin(rel * Math.PI) * 0.12;
        } else {
          // Return to ready stance
          const nockT = (attackProgress - 0.72) / 0.28;
          swingAngle = -armDirSign * 0.22 * (1 - nockT);
        }
      }
    } else if (isAttacking) {
      if (attackProgress < 0.25) {
        swingAngle = -cfg.flip * (attackProgress / 0.25) * 1.0;
      } else if (attackProgress < 0.65) {
        const t = (attackProgress - 0.25) / 0.40;
        swingAngle = cfg.flip * (-1.0 + t * 2.2);

        // Dynamic Stylized Weapon Slash Arc & Particle Spark VFX
        const arcAlpha = Math.sin(t * Math.PI) * 0.88;
        if (arcAlpha > 0.05) {
          ctx.save();
          const slashGrad = ctx.createLinearGradient(-15, -15, 15, 15);
          if (isMage) {
            slashGrad.addColorStop(0, `rgba(192, 132, 252, ${arcAlpha})`);
            slashGrad.addColorStop(1, `rgba(244, 114, 182, 0)`);
          } else if (isKing) {
            slashGrad.addColorStop(0, `rgba(253, 224, 71, ${arcAlpha})`);
            slashGrad.addColorStop(1, `rgba(245, 158, 11, 0)`);
          } else if (isWarrior) {
            slashGrad.addColorStop(0, `rgba(248, 113, 113, ${arcAlpha})`);
            slashGrad.addColorStop(1, `rgba(220, 38, 38, 0)`);
          } else {
            slashGrad.addColorStop(0, `rgba(248, 250, 252, ${arcAlpha})`);
            slashGrad.addColorStop(1, `rgba(148, 163, 184, 0)`);
          }
          ctx.strokeStyle = slashGrad;
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.arc(0, 0, 18.0, facingAngle - 0.7, facingAngle + 0.7, false);
          ctx.stroke();

          // Particle Sparks at blade perimeter
          ctx.fillStyle = isMage ? "#f0abfc" : isKing ? "#fef08a" : isWarrior ? "#fca5a5" : "#fef08a";
          ctx.beginPath();
          const sparkAngle = facingAngle + 0.4;
          ctx.arc(Math.cos(sparkAngle) * 18.5, Math.sin(sparkAngle) * 18.5, 0.9, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      } else {
        const t = (attackProgress - 0.65) / 0.35;
        swingAngle = cfg.flip * (1.2 * (1 - t));
      }
    }

    const baseArmRot = isBackView
      ? (isArcher ? -0.45 * armDirSign : -0.70 * armDirSign)
      : (isArcher ? 0.35 * armDirSign : 0.55 * armDirSign);
    ctx.rotate(baseArmRot + swingAngle);

    // Upper Arm / Shoulder Deltoid
    ctx.fillStyle = skinBase;
    ctx.beginPath();
    ctx.ellipse(0, 0, 2.9, 2.1, armDirSign * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Forearm
    const handX = armDirSign * 5.8;
    const handY = 2.8;

    ctx.fillStyle = skinDark;
    ctx.beginPath();
    ctx.moveTo(-1.0, 0);
    ctx.lineTo(handX, handY);
    ctx.lineTo(handX - armDirSign * 1.0, handY + 1.5);
    ctx.lineTo(-1.0, 1.7);
    ctx.closePath();
    ctx.fill();

    // Tattered Leather / Cord Wrist Wrap on weapon hand
    ctx.fillStyle = "#451a03";
    ctx.beginPath();
    ctx.ellipse(handX - armDirSign * 1.8, handY + 0.4, 1.4, 1.2, armDirSign * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Warrior / Brute Spiked Pauldron on weapon shoulder
    if (isWarrior) {
      ctx.fillStyle = "#475569";
      ctx.beginPath();
      ctx.arc(0, -0.6, 2.8, Math.PI * 0.8, Math.PI * 2.2, false);
      ctx.closePath();
      ctx.fill();

      // Spike
      ctx.fillStyle = "#94a3b8";
      ctx.beginPath();
      ctx.moveTo(-armDirSign * 1.2, -1.8);
      ctx.lineTo(0, -4.2);
      ctx.lineTo(armDirSign * 1.2, -1.8);
      ctx.closePath();
      ctx.fill();
    }

    ctx.save();
    ctx.translate(handX, handY);

    if (isMage) {
      // Occult Shaman Staff with Ornate Skull & Orb
      ctx.strokeStyle = "#451a03";
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(0, 9.0);
      ctx.lineTo(0, -15.0);
      ctx.stroke();

      const pulse = Math.sin(nowMs * 0.007 + seed) * 0.15 + 0.85;
      ctx.fillStyle = "rgba(192, 132, 252, 0.4)";
      ctx.beginPath();
      ctx.arc(0, -16.5, 5.5 * pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#c084fc";
      ctx.beginPath();
      ctx.arc(0, -16.5, 3.0, 0, Math.PI * 2);
      ctx.fill();
    } else if (isArcher) {
      // Procedural Recurve Hunting Bow & Authentically Held Arrow System
      ctx.save();

      // State determination: Tension, release recoil, and loaded arrow status
      let drawTension = 0;
      let stringTwang = 0;
      let isArrowLoaded = true;
      let arrowLoadProgress = 1.0; // 0 to 1

      if (isAttacking) {
        if (attackProgress < 0.52) {
          // Drawing the bow: tension increases smoothly to full draw
          drawTension = Math.sin((attackProgress / 0.52) * (Math.PI / 2));
          isArrowLoaded = true;
          arrowLoadProgress = 1.0;
        } else if (attackProgress < 0.72) {
          // Release & twang: arrow has been shot and launched
          const relT = attackProgress - 0.52;
          stringTwang = Math.sin(relT * 60) * Math.exp(-relT * 12) * 2.8;
          drawTension = 0;
          isArrowLoaded = false;
        } else {
          // Re-nocking next arrow smoothly from quiver (0.72 to 1.0)
          const nockT = (attackProgress - 0.72) / 0.28;
          drawTension = 0;
          isArrowLoaded = true;
          arrowLoadProgress = nockT; // fresh arrow sliding into place
        }
      } else {
        // IDLE / WALKING / READY STANCE: Arrow is ALWAYS securely held and ready!
        drawTension = 0.0;
        isArrowLoaded = true;
        arrowLoadProgress = 1.0;
      }

      // Bow Limb Flexing under tension:
      // When drawn, limb tips bend backward (toward archer)
      const flexX = -armDirSign * drawTension * 3.4;
      const topTipX = armDirSign * 3.2 + flexX;
      const topTipY = -12.5;
      const botTipX = armDirSign * 3.2 + flexX;
      const botTipY = 12.5;

      // Upper Recurve Limb (Wood & Horn laminates)
      ctx.strokeStyle = "#5a2d0c";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(armDirSign * 5.2 + flexX * 0.5, -6.5, topTipX, topTipY);
      ctx.stroke();

      // Upper inner belly laminate
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(armDirSign * 4.6 + flexX * 0.5, -6.5, topTipX - armDirSign * 0.6, topTipY);
      ctx.stroke();

      // Lower Recurve Limb
      ctx.strokeStyle = "#5a2d0c";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(armDirSign * 5.2 + flexX * 0.5, 6.5, botTipX, botTipY);
      ctx.stroke();

      // Lower inner belly laminate
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(armDirSign * 4.6 + flexX * 0.5, 6.5, botTipX - armDirSign * 0.6, botTipY);
      ctx.stroke();

      // Horn tip reinforcement on limbs
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.arc(topTipX, topTipY, 1.2, 0, Math.PI * 2);
      ctx.arc(botTipX, botTipY, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Ivory nock groove on limb tips
      ctx.fillStyle = "#fef3c7";
      ctx.beginPath();
      ctx.arc(topTipX - armDirSign * 0.4, topTipY, 0.5, 0, Math.PI * 2);
      ctx.arc(botTipX - armDirSign * 0.4, botTipY, 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Riser / Handle Wrap (Tanned leather with cross-stitches)
      ctx.fillStyle = "#92400e";
      ctx.beginPath();
      ctx.ellipse(0, 0, 1.8, 3.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Carved arrow shelf on riser
      ctx.fillStyle = "#5c2b09";
      ctx.fillRect(-armDirSign * 0.8, -1.8, 1.6, 0.8);

      ctx.strokeStyle = "#fef08a";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(-0.8, -2.0); ctx.lineTo(0.8, 2.0);
      ctx.moveTo(0.8, -2.0);  ctx.lineTo(-0.8, 2.0);
      ctx.stroke();

      // Bowstring (Braided sinew)
      // When drawn or ready, string forms a clean V-notch pulled back to draw hand
      const restingNockX = -armDirSign * 2.2;
      const drawNockX = restingNockX - armDirSign * (drawTension * 8.6) + (stringTwang * armDirSign);
      const drawNockY = 0;

      ctx.strokeStyle = "rgba(241, 245, 249, 0.88)";
      ctx.lineWidth = 0.85;
      ctx.beginPath();
      ctx.moveTo(topTipX, topTipY);
      if (drawTension > 0.02 || isArrowLoaded) {
        ctx.lineTo(drawNockX, drawNockY);
        ctx.lineTo(botTipX, botTipY);
      } else if (Math.abs(stringTwang) > 0.15) {
        ctx.quadraticCurveTo(armDirSign * 2.8 + stringTwang, 0, botTipX, botTipY);
      } else {
        ctx.lineTo(botTipX, botTipY);
      }
      ctx.stroke();

      // -------------------------------------------------------------
      // NOCKED ARROW - ALWAYS VISIBLE IN READY / AIM STANCE
      // Beautifully rendered with authentic cedar wood shaft, obsidian
      // arrowhead, sinew bindings, feather fletchings, bone nock, and
      // visible clawed goblin fingers securing the arrow!
      // -------------------------------------------------------------
      if (isArrowLoaded) {
        ctx.save();
        let arrowHeadDist = 13.5 - drawTension * 4.2;
        if (arrowLoadProgress < 1.0) {
          arrowHeadDist = 7.0 + arrowLoadProgress * 6.5;
        }

        const arrowHeadX = armDirSign * arrowHeadDist;
        const arrowTailX = drawNockX;
        const arrowShelfY = -0.5; // Rest line along the arrow shelf

        // 1. High-Density Cedar Shaft
        const shaftMinX = Math.min(arrowHeadX, arrowTailX);
        const shaftMaxX = Math.max(arrowHeadX, arrowTailX);
        const shaftLen = Math.abs(arrowHeadX - arrowTailX);

        // Main shaft body
        ctx.fillStyle = "#854d0e";
        ctx.fillRect(shaftMinX, arrowShelfY - 0.8, shaftLen, 1.6);

        // Wood grain specular highlight along upper edge
        ctx.fillStyle = "#b45309";
        ctx.fillRect(shaftMinX, arrowShelfY - 0.8, shaftLen, 0.5);

        // Lower ambient shadow along bottom edge
        ctx.fillStyle = "#5c2b09";
        ctx.fillRect(shaftMinX, arrowShelfY + 0.4, shaftLen, 0.4);

        // 2. Sinew Thread Bindings
        ctx.fillStyle = "#3b1d06";
        // Head binding
        ctx.fillRect(arrowHeadX - armDirSign * 1.8, arrowShelfY - 0.9, 1.4, 1.8);
        // Fletching front binding
        ctx.fillRect(arrowTailX + armDirSign * 4.2, arrowShelfY - 0.9, 1.2, 1.8);
        // Nock base binding
        ctx.fillRect(arrowTailX + armDirSign * 0.8, arrowShelfY - 0.9, 1.0, 1.8);

        // 3. Chipped Flint / Obsidian Broadhead Blade
        ctx.save();
        ctx.translate(arrowHeadX, arrowShelfY);
        // Broadhead shape
        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.moveTo(armDirSign * 5.2, 0);              // Point
        ctx.lineTo(armDirSign * 0.2, -2.6);           // Upper barb
        ctx.lineTo(armDirSign * 0.9, -0.6);           // Inner notch
        ctx.lineTo(armDirSign * 0.9, 0.6);            // Inner notch
        ctx.lineTo(armDirSign * 0.2, 2.6);            // Lower barb
        ctx.closePath();
        ctx.fill();

        // Obsidian facet highlight (chiseled stone reflection)
        ctx.fillStyle = "#475569";
        ctx.beginPath();
        ctx.moveTo(armDirSign * 5.2, 0);
        ctx.lineTo(armDirSign * 0.8, -1.8);
        ctx.lineTo(armDirSign * 1.8, 0);
        ctx.closePath();
        ctx.fill();

        // Keen razor edge specular glint
        ctx.strokeStyle = "rgba(248, 250, 252, 0.9)";
        ctx.lineWidth = 0.55;
        ctx.beginPath();
        ctx.moveTo(armDirSign * 5.2, 0);
        ctx.lineTo(armDirSign * 0.3, -2.5);
        ctx.stroke();
        ctx.restore();

        // 4. Split-Feather Fletchings at the Nock
        // Upper Vane (Forest green with gold striping)
        ctx.fillStyle = "#166534";
        ctx.beginPath();
        ctx.moveTo(arrowTailX, arrowShelfY - 0.4);
        ctx.lineTo(arrowTailX - armDirSign * 4.2, arrowShelfY - 2.8);
        ctx.lineTo(arrowTailX - armDirSign * 1.4, arrowShelfY - 2.8);
        ctx.lineTo(arrowTailX + armDirSign * 0.4, arrowShelfY - 0.4);
        ctx.closePath();
        ctx.fill();

        // Upper Vane Accent Stripe
        ctx.fillStyle = "#fef08a";
        ctx.beginPath();
        ctx.moveTo(arrowTailX - armDirSign * 2.8, arrowShelfY - 0.4);
        ctx.lineTo(arrowTailX - armDirSign * 3.4, arrowShelfY - 2.6);
        ctx.lineTo(arrowTailX - armDirSign * 2.4, arrowShelfY - 2.6);
        ctx.lineTo(arrowTailX - armDirSign * 1.8, arrowShelfY - 0.4);
        ctx.closePath();
        ctx.fill();

        // Lower Vane (Deep emerald green)
        ctx.fillStyle = "#15803d";
        ctx.beginPath();
        ctx.moveTo(arrowTailX, arrowShelfY + 0.4);
        ctx.lineTo(arrowTailX - armDirSign * 4.2, arrowShelfY + 2.8);
        ctx.lineTo(arrowTailX - armDirSign * 1.4, arrowShelfY + 2.8);
        ctx.lineTo(arrowTailX + armDirSign * 0.4, arrowShelfY + 0.4);
        ctx.closePath();
        ctx.fill();

        // Lower Vane Accent Stripe
        ctx.fillStyle = "#fef08a";
        ctx.beginPath();
        ctx.moveTo(arrowTailX - armDirSign * 2.8, arrowShelfY + 0.4);
        ctx.lineTo(arrowTailX - armDirSign * 3.4, arrowShelfY + 2.6);
        ctx.lineTo(arrowTailX - armDirSign * 2.4, arrowShelfY + 2.6);
        ctx.lineTo(arrowTailX - armDirSign * 1.8, arrowShelfY + 0.4);
        ctx.closePath();
        ctx.fill();

        // 5. Polished Bone Nock
        ctx.fillStyle = "#fef3c7";
        ctx.beginPath();
        ctx.fillRect(arrowTailX - armDirSign * 1.2, arrowShelfY - 0.8, 1.4, 1.6);
        ctx.fill();

        // Nock string notch slot
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(arrowTailX - armDirSign * 0.4, arrowShelfY - 0.5, 0.6, 1.0);

        // -------------------------------------------------------------
        // 6. DRAW HAND FINGERS GRIPPING THE ARROW NOCK & BOWSTRING!
        // Clawed goblin fingers physically pinch and hook the nock
        // -------------------------------------------------------------
        ctx.save();
        ctx.translate(arrowTailX, arrowShelfY);

        // Index finger knuckle curling over top of the nock
        ctx.fillStyle = skinBase;
        ctx.beginPath();
        ctx.ellipse(armDirSign * 0.2, -1.4, 1.2, 0.9, armDirSign * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Sharp obsidian claw curling over the arrow shaft
        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.moveTo(armDirSign * 0.6, -1.8);
        ctx.lineTo(armDirSign * 1.8, -0.7);
        ctx.lineTo(armDirSign * 0.8, -0.4);
        ctx.closePath();
        ctx.fill();

        // Middle finger knuckle curling under the nock & string
        ctx.fillStyle = skinBase;
        ctx.beginPath();
        ctx.ellipse(armDirSign * 0.2, 1.4, 1.2, 0.9, -armDirSign * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Sharp obsidian claw curling under the string
        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.moveTo(armDirSign * 0.6, 1.8);
        ctx.lineTo(armDirSign * 1.8, 0.7);
        ctx.lineTo(armDirSign * 0.8, 0.4);
        ctx.closePath();
        ctx.fill();

        // Thumb pad locking the shaft
        ctx.fillStyle = skinDark;
        ctx.beginPath();
        ctx.arc(-armDirSign * 0.6, 0, 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Specular glint on claw hooks
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(armDirSign * 1.4, -0.8, 0.25, 0, Math.PI * 2);
        ctx.arc(armDirSign * 1.4, 0.8, 0.25, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore(); // Nock fingers

        ctx.restore(); // Arrow
      }

      // -------------------------------------------------------------
      // 7. BOW HAND GRIP - CLAWED GOBLIN HAND SECURING THE ARROW TO THE RISER!
      // The hand grips the bow handle and the index knuckle & claw hold
      // the arrow shaft securely against the arrow shelf so it won't slip!
      // -------------------------------------------------------------
      ctx.save();
      // Bow hand palm / wrist wrap behind handle
      ctx.fillStyle = "#451a03";
      ctx.beginPath();
      ctx.ellipse(-armDirSign * 0.4, 1.0, 1.8, 2.6, armDirSign * 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Lower 3 fingers wrapped around the lower handle grip (below arrow shelf)
      for (let f = 0; f < 3; f++) {
        const fY = 1.2 + f * 1.4;
        ctx.fillStyle = skinBase;
        ctx.beginPath();
        ctx.ellipse(armDirSign * 0.6, fY, 1.0, 0.75, armDirSign * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Sharp claw tip curling around handle
        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.moveTo(armDirSign * 1.3, fY - 0.4);
        ctx.lineTo(armDirSign * 2.2, fY);
        ctx.lineTo(armDirSign * 1.3, fY + 0.4);
        ctx.closePath();
        ctx.fill();
      }

      // Goblin Thumb wrapped around inner handle
      ctx.fillStyle = skinDark;
      ctx.beginPath();
      ctx.ellipse(-armDirSign * 0.8, -0.2, 1.1, 0.8, -armDirSign * 0.3, 0, Math.PI * 2);
      ctx.fill();

      // INDEX FINGER CURLED OVER THE ARROW SHAFT!
      // Key archery anatomy: index finger sits right over the arrow pass,
      // locking the shaft securely down onto the shelf!
      if (isArrowLoaded) {
        ctx.fillStyle = skinBase;
        ctx.beginPath();
        ctx.ellipse(armDirSign * 0.5, -1.2, 1.2, 0.9, -armDirSign * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Sharp obsidian claw clamping over the top of the shaft
        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.moveTo(armDirSign * 1.0, -1.8);
        ctx.lineTo(armDirSign * 2.2, -0.8);
        ctx.lineTo(armDirSign * 1.1, -0.4);
        ctx.closePath();
        ctx.fill();

        // Highlight glint on index claw
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(armDirSign * 1.8, -0.9, 0.28, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore(); // Bow hand grip

      ctx.restore(); // Recurve Bow & Arrow System
    } else if (isKing) {
      // Royal Golden Great Cleaver (Lineless)
      ctx.rotate(armDirSign * 0.4);
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.moveTo(0, -2.5);
      ctx.lineTo(-armDirSign * 1.4, -16.0);
      ctx.lineTo(armDirSign * 7.0, -18.0);
      ctx.lineTo(armDirSign * 9.0, -12.0);
      ctx.lineTo(armDirSign * 6.5, -9.0);
      ctx.lineTo(armDirSign * 8.0, -5.5);
      ctx.lineTo(0, -2.5);
      ctx.closePath();
      ctx.fill();

      // Gleaming Gold Fullers & Gem
      ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(armDirSign * 7.0, -17.5);
      ctx.lineTo(armDirSign * 8.8, -12.0);
      ctx.stroke();

      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(armDirSign * 3.2, -10.0, 1.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (isThief) {
      // Assassin Serrated Poison Dagger (Lineless)
      ctx.rotate(armDirSign * 0.45);
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(-1.0, -2.0, 2.0, 4.0);
      ctx.fillStyle = "#334155";
      ctx.beginPath();
      ctx.moveTo(0, -2.0);
      ctx.lineTo(-armDirSign * 1.0, -13.0);
      ctx.lineTo(armDirSign * 3.5, -15.0);
      ctx.lineTo(armDirSign * 4.5, -10.0);
      ctx.lineTo(armDirSign * 2.8, -7.0);
      ctx.lineTo(armDirSign * 4.2, -4.0);
      ctx.lineTo(0, -2.0);
      ctx.closePath();
      ctx.fill();

      // Toxic Poison Edge & Glow
      ctx.strokeStyle = "rgba(34, 197, 94, 0.85)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(armDirSign * 3.5, -14.5);
      ctx.lineTo(armDirSign * 4.5, -10.0);
      ctx.stroke();

      ctx.fillStyle = "#4ade80";
      ctx.beginPath();
      ctx.arc(armDirSign * 3.2, -14.0, 0.7, 0, Math.PI * 2);
      ctx.fill();
    } else if (isBrute) {
      // Heavy Spiked Iron Club (Lineless)
      ctx.rotate(armDirSign * 0.4);
      ctx.fillStyle = "#451a03";
      ctx.fillRect(-1.5, -2.0, 3.0, 6.0); // Thick Handle

      ctx.fillStyle = "#334155";
      ctx.beginPath();
      ctx.moveTo(-armDirSign * 2.0, -2.0);
      ctx.lineTo(-armDirSign * 3.5, -16.0);
      ctx.lineTo(armDirSign * 4.5, -16.0);
      ctx.lineTo(armDirSign * 3.0, -2.0);
      ctx.closePath();
      ctx.fill();

      // Spikes on Club Head
      ctx.fillStyle = "#94a3b8";
      ctx.beginPath();
      ctx.moveTo(-armDirSign * 3.5, -14.0); ctx.lineTo(-armDirSign * 6.5, -14.0); ctx.lineTo(-armDirSign * 3.2, -12.0);
      ctx.moveTo(armDirSign * 4.5, -14.0);  ctx.lineTo(armDirSign * 7.5, -14.0);  ctx.lineTo(armDirSign * 4.2, -12.0);
      ctx.moveTo(-armDirSign * 3.5, -8.0);  ctx.lineTo(-armDirSign * 6.0, -8.0);  ctx.lineTo(-armDirSign * 3.2, -6.0);
      ctx.moveTo(armDirSign * 4.5, -8.0);   ctx.lineTo(armDirSign * 7.0, -8.0);   ctx.lineTo(armDirSign * 4.2, -6.0);
      ctx.closePath();
      ctx.fill();
    } else if (isWarrior) {
      // Heavy Notched Iron Cleaver (Lineless)
      ctx.rotate(armDirSign * 0.4);
      ctx.fillStyle = "#475569";
      ctx.beginPath();
      ctx.moveTo(0, -2.5);
      ctx.lineTo(-armDirSign * 1.2, -15.0);
      ctx.lineTo(armDirSign * 6.5, -17.0);
      ctx.lineTo(armDirSign * 8.5, -11.5);
      ctx.lineTo(armDirSign * 6.0, -8.5);
      ctx.lineTo(armDirSign * 7.5, -5.0);
      ctx.lineTo(0, -2.5);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(armDirSign * 6.5, -16.5);
      ctx.lineTo(armDirSign * 8.2, -11.5);
      ctx.stroke();
    } else {
      // Basic Goblin Scavenger Shiv (Lineless)
      ctx.rotate(armDirSign * 0.45);
      ctx.fillStyle = "#fef3c7";
      ctx.fillRect(-1.0, -2.0, 2.0, 4.0);
      ctx.fillStyle = "#64748b";
      ctx.beginPath();
      ctx.moveTo(0, -2.0);
      ctx.lineTo(-armDirSign * 1.0, -12.0);
      ctx.lineTo(armDirSign * 5.5, -14.0);
      ctx.lineTo(armDirSign * 6.5, -9.5);
      ctx.lineTo(armDirSign * 4.5, -7.0);
      ctx.lineTo(armDirSign * 5.8, -4.0);
      ctx.lineTo(0, -2.0);
      ctx.closePath();
      ctx.fill();

      // Sharp Honed Razor Edge
      ctx.strokeStyle = "rgba(248, 250, 252, 0.75)";
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(armDirSign * 5.5, -13.5);
      ctx.lineTo(armDirSign * 6.2, -9.5);
      ctx.stroke();
    }

    // Hand Knuckle holding weapon
    if (!isArcher) {
      ctx.fillStyle = skinBase;
      ctx.beginPath();
      ctx.arc(0, 0, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore(); // Weapon
    ctx.restore(); // Arm
  };

  // Draw background weapon arm if layered behind
  if (!isArcher && !cfg.rightArmFront) {
    drawRightHandWeapon();
  }

  // -------------------------------------------------------------
  // 5. Digitigrade Legs, Ankle Wraps & 3-Toed Talon Feet
  // -------------------------------------------------------------
  const drawClawedLegs = () => {
    ctx.save();

    const rightStep = moving ? Math.sin(walkPhase) * 2.8 : 0;
    const leftStep = moving ? -Math.sin(walkPhase) * 2.8 : 0;

    const draw3ClawFoot = (footX, footY, dirX, isFacingBack) => {
      if (isShadowPass) return;

      // 1. Ragged Ankle Bandage Wrap (Lineless)
      ctx.fillStyle = "#451a03";
      ctx.beginPath();
      ctx.ellipse(footX, footY - 1.0, 1.4, 0.85, (dirX || 0) * 0.15, 0, Math.PI * 2);
      ctx.fill();

      // Wrap highlight
      ctx.fillStyle = "#78350f";
      ctx.fillRect(footX - 0.8, footY - 1.3, 1.6, 0.5);

      // 2. Obsidian Talons / Toes (Lineless)
      ctx.fillStyle = "#0f172a";

      if (isFacingBack) {
        // Back View: Heel spur + claws gripping away
        ctx.beginPath();
        ctx.moveTo(footX - 1.2, footY - 0.2);
        ctx.lineTo(footX - 1.6, footY + 0.8);
        ctx.lineTo(footX - 0.5, footY + 0.5);
        ctx.lineTo(footX + 0.5, footY + 0.5);
        ctx.lineTo(footX + 1.6, footY + 0.8);
        ctx.lineTo(footX + 1.2, footY - 0.2);
        ctx.closePath();
        ctx.fill();

        // Sharp heel spur pointing back
        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.moveTo(footX - 0.5, footY - 0.5);
        ctx.lineTo(footX, footY - 1.6);
        ctx.lineTo(footX + 0.5, footY - 0.5);
        ctx.closePath();
        ctx.fill();
      } else if (Math.abs(dirX) > 0.3) {
        // Profile or 3/4 Diagonal View: 3 forward-gripping curved obsidian talons
        const d = dirX > 0 ? 1 : -1;

        // Claw 1 (Inner / Far)
        ctx.beginPath();
        ctx.moveTo(footX - d * 0.8, footY - 0.2);
        ctx.lineTo(footX + d * 1.8, footY + 0.4);
        ctx.lineTo(footX - d * 0.2, footY + 0.6);
        ctx.closePath();
        ctx.fill();

        // Claw 2 (Center Main Talon - Longest)
        ctx.beginPath();
        ctx.moveTo(footX - d * 0.4, footY - 0.3);
        ctx.lineTo(footX + d * 2.8, footY + 0.3);
        ctx.lineTo(footX + d * 0.3, footY + 0.7);
        ctx.closePath();
        ctx.fill();

        // Claw 3 (Outer / Near)
        ctx.beginPath();
        ctx.moveTo(footX, footY - 0.1);
        ctx.lineTo(footX + d * 1.9, footY + 0.6);
        ctx.lineTo(footX + d * 0.5, footY + 0.7);
        ctx.closePath();
        ctx.fill();

        // Specular glint on main talon
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(footX + d * 1.8, footY + 0.25, 0.3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Direct Front View: Splayed forward claws (pointing down towards viewer)
        // Claw 1 (Screen-left)
        ctx.beginPath();
        ctx.moveTo(footX - 1.2, footY - 0.2);
        ctx.lineTo(footX - 1.9, footY + 0.8);
        ctx.lineTo(footX - 0.6, footY + 0.6);
        ctx.closePath();
        ctx.fill();

        // Claw 2 (Center)
        ctx.beginPath();
        ctx.moveTo(footX - 0.4, footY - 0.3);
        ctx.lineTo(footX, footY + 1.1);
        ctx.lineTo(footX + 0.4, footY - 0.3);
        ctx.closePath();
        ctx.fill();

        // Claw 3 (Screen-right)
        ctx.beginPath();
        ctx.moveTo(footX + 0.6, footY + 0.6);
        ctx.lineTo(footX + 1.9, footY + 0.8);
        ctx.lineTo(footX + 1.2, footY - 0.2);
        ctx.closePath();
        ctx.fill();

        // Specular glint on center claw
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(footX, footY + 0.65, 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawSingleLeg = (hipX, footX, isNearLeg, legStep, legDirX) => {
      if (isShadowPass) return;
      ctx.save();

      const hipY = torsoY + 5.8; // Pelvis connection: -9.5 + 5.8 = -3.7
      const actualFootX = footX + (moving ? legStep * 0.45 : 0);
      const footLift = moving ? Math.max(0, -legStep) * 0.45 : 0;
      const actualFootY = 1.0 - footLift;

      // Forward knee displacement based on facing direction and stance
      const kneeForward = (isProfileView ? 2.0 : isFrontView ? 0.4 : 1.2) * (legDirX !== 0 ? legDirX : (hipX < 0 ? -0.8 : 0.8));
      const kneeX = (hipX + actualFootX) * 0.5 + kneeForward;
      const kneeY = -1.4 - footLift * 0.25;

      // Digitigrade hock displacement (bends backward from knee / ankle)
      const hockBack = (isProfileView ? 1.0 : 0.5) * (legDirX !== 0 ? legDirX : (hipX < 0 ? -0.4 : 0.4));
      const hockX = actualFootX - hockBack;
      const hockY = actualFootY - 1.2;

      ctx.fillStyle = isNearLeg ? skinBase : skinDark;

      // Muscular Lineless Digitigrade Leg Silhouette
      ctx.beginPath();
      // Outer hip edge
      const hipW = 1.6;
      ctx.moveTo(hipX - hipW, hipY);
      // Outer thigh curve down to knobby knee
      ctx.quadraticCurveTo(kneeX - (legDirX >= 0 ? 0.8 : -0.8), kneeY - 0.7, kneeX - 0.5, kneeY);
      // Knobby knee front apex
      ctx.quadraticCurveTo(kneeX + (legDirX >= 0 ? 1.0 : -1.0), kneeY + 0.5, hockX, hockY);
      // Hock down to ankle
      ctx.lineTo(actualFootX - 1.0, actualFootY);
      ctx.lineTo(actualFootX + 1.0, actualFootY);
      // Inner ankle up along calf / groin to inner hip
      ctx.quadraticCurveTo(kneeX + (legDirX >= 0 ? 0.6 : -0.6), kneeY + 0.8, hipX + hipW, hipY);
      ctx.closePath();
      ctx.fill();

      // Knee joint depth accent
      ctx.strokeStyle = isNearLeg ? (isSlowed ? "#0284c7" : "#1a4c23") : "rgba(0, 0, 0, 0.22)";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.arc(kneeX, kneeY, 0.65, 0, Math.PI * 2);
      ctx.stroke();

      // Talon foot
      draw3ClawFoot(actualFootX, actualFootY, legDirX, isBackView);

      ctx.restore();
    };

    // Layer depth sorting: Far leg drawn first in shadow, Near leg drawn second
    const isRightNear = isFrontView ? true : cfg.rightLegFront;
    const isLeftNear = isFrontView ? true : !cfg.rightLegFront;

    if (cfg.rightLegFront) {
      // Left leg is far leg, Right leg is near leg
      drawSingleLeg(cfg.leftLegHipX, cfg.leftLegFootX, isLeftNear, leftStep, cfg.facingDirX);
      drawSingleLeg(cfg.rightLegHipX, cfg.rightLegFootX, isRightNear, rightStep, cfg.facingDirX);
    } else {
      // Right leg is far leg, Left leg is near leg
      drawSingleLeg(cfg.rightLegHipX, cfg.rightLegFootX, isRightNear, rightStep, cfg.facingDirX);
      drawSingleLeg(cfg.leftLegHipX, cfg.leftLegFootX, isLeftNear, leftStep, cfg.facingDirX);
    }

    ctx.restore();
  };

  drawClawedLegs();

  // Quiver for Goblin Archer (Slung across the back)
  const drawQuiver = () => {
    if (isShadowPass || !isArcher) return;
    ctx.save();
    const qX = torsoX - cfg.flip * (isProfileView ? 3.0 : 1.8);
    const qY = torsoY - 2.5;
    ctx.translate(qX, qY);
    ctx.rotate(cfg.flip * -0.32 + hunchTilt);

    // Cylindrical leather quiver
    ctx.fillStyle = "#451a03";
    ctx.beginPath();
    ctx.ellipse(0, 0, 3.2, 8.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shaded side
    ctx.fillStyle = "#271003";
    ctx.beginPath();
    ctx.ellipse(cfg.flip * 0.8, 0, 1.8, 8.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stitched leather collar rim at top
    ctx.fillStyle = "#78350f";
    ctx.beginPath();
    ctx.ellipse(0, -7.5, 3.4, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Brass rivets
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(-1.5, -4.0, 0.5, 0, Math.PI * 2);
    ctx.arc(1.5, -4.0, 0.5, 0, Math.PI * 2);
    ctx.arc(0, 2.0, 0.5, 0, Math.PI * 2);
    ctx.fill();

    // 4 Arrows sticking out of the open mouth
    const arrowOffsets = [
      { x: -1.6, y: -7.5, rot: -0.22 },
      { x: -0.5, y: -8.0, rot: -0.08 },
      { x: 0.6, y: -8.0, rot: 0.10 },
      { x: 1.8, y: -7.5, rot: 0.25 }
    ];
    for (let i = 0; i < arrowOffsets.length; i++) {
      const ao = arrowOffsets[i];
      ctx.save();
      ctx.translate(ao.x, ao.y);
      ctx.rotate(ao.rot);

      // Shaft
      ctx.fillStyle = "#854d0e";
      ctx.fillRect(-0.4, -6.5, 0.8, 7.0);

      // Feather Fletchings
      ctx.fillStyle = (i % 2 === 0) ? "#166534" : "#15803d";
      ctx.beginPath();
      ctx.moveTo(-0.4, -6.5);
      ctx.lineTo(-1.8, -5.2);
      ctx.lineTo(-1.8, -2.5);
      ctx.lineTo(-0.4, -2.0);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0.4, -6.5);
      ctx.lineTo(1.8, -5.2);
      ctx.lineTo(1.8, -2.5);
      ctx.lineTo(0.4, -2.0);
      ctx.closePath();
      ctx.fill();

      // Ivory tips on feathers
      ctx.fillStyle = "#fef08a";
      ctx.beginPath();
      ctx.moveTo(-1.8, -5.2);
      ctx.lineTo(-1.8, -4.2);
      ctx.lineTo(-0.4, -4.6);
      ctx.lineTo(-0.4, -5.6);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(1.8, -5.2);
      ctx.lineTo(1.8, -4.2);
      ctx.lineTo(0.4, -4.6);
      ctx.lineTo(0.4, -5.6);
      ctx.closePath();
      ctx.fill();

      // Bone nock
      ctx.fillStyle = "#fef3c7";
      ctx.fillRect(-0.5, -7.2, 1.0, 1.0);

      ctx.restore();
    }

    ctx.restore();
  };

  if (!isBackView) {
    drawQuiver();
  }

  // -------------------------------------------------------------
  // 6. Hunched Torso & Sculpted Musculature & Ragged Loincloth
  // -------------------------------------------------------------
  ctx.save();
  ctx.translate(torsoX, torsoY);
  ctx.rotate(hunchTilt);

  const buildTorsoPath = () => {
    ctx.beginPath();
    if (cfg.view === "front") {
      ctx.moveTo(-5.8, -6.8);
      ctx.lineTo(5.8, -6.8);
      ctx.quadraticCurveTo(6.8, 0, 4.6, 6.8);
      ctx.lineTo(-4.6, 6.8);
      ctx.quadraticCurveTo(-6.8, 0, -5.8, -6.8);
    } else if (cfg.view === "back") {
      ctx.moveTo(-6.8, -7.2);
      ctx.quadraticCurveTo(0, -8.6, 6.8, -7.2);
      ctx.quadraticCurveTo(7.2, 0, 4.8, 6.8);
      ctx.lineTo(-4.8, 6.8);
      ctx.quadraticCurveTo(-7.2, 0, -6.8, -7.2);
    } else if (cfg.view === "front_diag") {
      ctx.moveTo(cfg.flip * 1.8, -7.2);
      ctx.quadraticCurveTo(cfg.flip * 6.2, -4.8, cfg.flip * 5.5, 1.0);
      ctx.quadraticCurveTo(cfg.flip * 4.5, 6.8, 0, 7.2);
      ctx.quadraticCurveTo(-cfg.flip * 6.2, 3.8, -cfg.flip * 6.5, -1.8);
      ctx.quadraticCurveTo(-cfg.flip * 7.6, -6.2, -cfg.flip * 1.4, -7.8);
    } else if (cfg.view === "back_diag") {
      ctx.moveTo(-cfg.flip * 1.4, -7.8);
      ctx.quadraticCurveTo(-cfg.flip * 7.2, -6.8, -cfg.flip * 6.2, 1.0);
      ctx.quadraticCurveTo(-cfg.flip * 4.2, 6.8, 0, 7.2);
      ctx.quadraticCurveTo(cfg.flip * 5.8, 3.8, cfg.flip * 6.2, -1.8);
      ctx.quadraticCurveTo(cfg.flip * 7.2, -6.2, cfg.flip * 1.8, -7.8);
    } else {
      // Side Profile
      ctx.moveTo(cfg.flip * 0.8, -7.2);
      ctx.quadraticCurveTo(cfg.flip * 5.8, -5.2, cfg.flip * 5.2, 1.0);
      ctx.quadraticCurveTo(cfg.flip * 4.2, 6.8, 0, 7.2);
      ctx.quadraticCurveTo(-cfg.flip * 6.8, 3.8, -cfg.flip * 7.2, -1.4);
      ctx.quadraticCurveTo(-cfg.flip * 8.6, -6.2, -cfg.flip * 2.2, -7.8);
    }
    ctx.closePath();
  };

  buildTorsoPath();
  ctx.fillStyle = isShadowPass ? "#000000" : skinBase;
  ctx.fill();

  // Internal Anatomical Shading & Muscular Sculpting (Soft Lineless Shading)
  if (!isShadowPass) {
    const softShadowColor = isSlowed ? "rgba(2, 132, 199, 0.35)" : "rgba(16, 60, 25, 0.35)";
    if (isFrontView) {
      // 1. Wiry Pectoral Contours & Sternum Crease (Soft Volumetric Shading)
      ctx.strokeStyle = softShadowColor;
      ctx.lineWidth = 0.6;

      if (cfg.view === "front") {
        // Dual Pectoral Plates
        ctx.beginPath();
        ctx.arc(-2.4, -3.2, 2.2, 0.2, Math.PI * 0.9, false);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(2.4, -3.2, 2.2, 0.1, Math.PI * 0.8, false);
        ctx.stroke();

        // Central Sternum Shadow
        ctx.beginPath();
        ctx.moveTo(0, -5.2);
        ctx.lineTo(0, -1.8);
        ctx.stroke();

        // Lateral Ribcage Contours
        ctx.beginPath();
        ctx.moveTo(-4.8, -0.6); ctx.lineTo(-3.2, 0.4);
        ctx.moveTo(-4.6, 1.2);  ctx.lineTo(-3.0, 2.2);
        ctx.moveTo(4.8, -0.6);  ctx.lineTo(3.2, 0.4);
        ctx.moveTo(4.6, 1.2);   ctx.lineTo(3.0, 2.2);
        ctx.stroke();
      } else {
        // 3/4 Front Pectoral
        const pX = cfg.flip * 1.4;
        ctx.beginPath();
        ctx.arc(pX, -3.2, 2.5, 0.1, Math.PI * 0.85, false);
        ctx.stroke();
      }
    } else if (isBackView) {
      // 2. Sculpted Scapulae (Shoulder Blades) & Vertebral Nodes (Soft Volumetric)
      ctx.strokeStyle = softShadowColor;
      ctx.lineWidth = 0.6;

      if (cfg.view === "back") {
        // Dual Scapular Ridges
        ctx.beginPath();
        ctx.moveTo(-4.2, -4.8); ctx.lineTo(-2.2, -2.4); ctx.lineTo(-3.8, -0.8);
        ctx.moveTo(4.2, -4.8);  ctx.lineTo(2.2, -2.4);  ctx.lineTo(3.8, -0.8);
        ctx.stroke();

        // Vertebral Spine Nodes with Deep Shading
        ctx.fillStyle = skinDark;
        ctx.beginPath();
        ctx.arc(0, -5.8, 0.75, 0, Math.PI * 2);
        ctx.arc(0, -3.2, 0.75, 0, Math.PI * 2);
        ctx.arc(0, -0.6, 0.70, 0, Math.PI * 2);
        ctx.arc(0, 2.0, 0.65, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // 3/4 Back Spine Curve
        ctx.beginPath();
        ctx.moveTo(-cfg.flip * 5.8, -2.0);
        ctx.quadraticCurveTo(-cfg.flip * 7.0, -5.2, -cfg.flip * 1.8, -6.8);
        ctx.stroke();
      }
    } else {
      // Side View Spine Curve
      ctx.strokeStyle = softShadowColor;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(-cfg.flip * 5.2, -1.8);
      ctx.quadraticCurveTo(-cfg.flip * 6.6, -4.8, -cfg.flip * 1.6, -6.4);
      ctx.stroke();
    }

    // -----------------------------------------------------------
    // Ragged Dynamic Loincloth & Archetype Apparel (Seamless Clipped, Lineless)
    // -----------------------------------------------------------
    ctx.save();
    buildTorsoPath();
    ctx.clip();

    if (isBasicGoblin || isThief) {
      // Basic Goblin / Thief: Rugged Distressed Leather Loincloth (Lineless)
      ctx.fillStyle = isThief ? "#1e293b" : "#78350f";
      ctx.beginPath();
      ctx.moveTo(-20, 0.8);
      ctx.lineTo(20, 0.8);
      ctx.lineTo(20, 20);
      ctx.lineTo(-20, 20);
      ctx.closePath();
      ctx.fill();

      // Jagged Hem Fringes
      ctx.fillStyle = isThief ? "#0f172a" : "#451a03";
      ctx.beginPath();
      ctx.moveTo(-15, 6.2);
      ctx.lineTo(-12, 3.8); ctx.lineTo(-9, 6.8);
      ctx.lineTo(-6, 4.2);  ctx.lineTo(-3, 7.2);
      ctx.lineTo(0, 4.0);   ctx.lineTo(3, 7.2);
      ctx.lineTo(6, 4.2);   ctx.lineTo(9, 6.8);
      ctx.lineTo(12, 3.8);  ctx.lineTo(15, 6.2);
      ctx.lineTo(15, 10);   ctx.lineTo(-15, 10);
      ctx.closePath();
      ctx.fill();

      // Stitched Leather Patch
      ctx.fillStyle = isThief ? "#334155" : "#92400e";
      ctx.fillRect(-3.5, 2.2, 3.2, 2.8);

      // Central Pelvic Flap (Lineless)
      ctx.fillStyle = isThief ? "#1e293b" : "#78350f";
      ctx.beginPath();
      ctx.moveTo(-2.2, 1.2);
      ctx.lineTo(2.2, 1.2);
      ctx.lineTo(1.8, 6.8);
      ctx.lineTo(0, 7.6);
      ctx.lineTo(-1.8, 6.8);
      ctx.closePath();
      ctx.fill();

      // Braided Twine Belt & Knot
      ctx.fillStyle = isThief ? "#475569" : "#b45309";
      ctx.fillRect(-20, 0.8, 40, 1.6);
      ctx.fillStyle = isThief ? "#94a3b8" : "#fde68a";
      ctx.fillRect(-20, 1.2, 40, 0.6);

      // Carved Bone Toggle / Knot
      ctx.fillStyle = "#fef3c7";
      ctx.beginPath();
      ctx.ellipse(0.8, 1.6, 1.2, 0.7, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Scavenger Side Coin Pouch
      ctx.fillStyle = "#451a03";
      ctx.beginPath();
      ctx.ellipse(-3.8, 2.2, 1.2, 1.5, -0.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (isKing) {
      // King: Royal Ermine Fur Tunic & Ruby-Set Golden Belt (Lineless)
      ctx.fillStyle = "#831843"; // Royal Crimson Velvet
      ctx.fillRect(-20, -20, 40, 40);

      // Ermine White Fur Collar
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(-20, -15, 40, 7.5);
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.arc(-3.0, -11.0, 0.5, 0, Math.PI * 2);
      ctx.arc(3.0, -11.0, 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Gold Belt Plate with Ruby
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(-20, 1.2, 40, 2.6);

      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(0, 2.5, 1.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (isWarrior) {
      // Warrior: Studded Iron Plate Harness & Chainmail Trim (Lineless)
      ctx.fillStyle = "#475569";
      ctx.fillRect(-20, -20, 40, 40);

      // Reinforced Iron Belt Plate
      ctx.fillStyle = "#334155";
      ctx.fillRect(-20, 1.0, 40, 3.0);
      ctx.fillStyle = "#94a3b8";
      ctx.beginPath();
      ctx.arc(-3.5, 2.5, 0.7, 0, Math.PI * 2);
      ctx.arc(0, 2.5, 0.8, 0, Math.PI * 2);
      ctx.arc(3.5, 2.5, 0.7, 0, Math.PI * 2);
      ctx.fill();
    } else if (isMage) {
      // Mage: Occult Runes & Bone Talisman Chest Piece (Lineless)
      ctx.fillStyle = "#4c1d95";
      ctx.fillRect(-20, -20, 40, 40);

      // Gold Embroidered Sash
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(-20, 1.8, 40, 2.2);

      // Bone Talisman on Chest
      if (isFrontView) {
        ctx.strokeStyle = "rgba(254, 243, 199, 0.8)";
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(-2.8, -5.2); ctx.lineTo(0, -3.2); ctx.lineTo(2.8, -5.2);
        ctx.stroke();

        ctx.fillStyle = "#fef3c7";
        ctx.beginPath();
        ctx.arc(0, -3.0, 1.0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (isArcher) {
      // Archer: Hunting Leather Harness & Quiver Strap (Lineless)
      ctx.fillStyle = "#3b2314";
      ctx.fillRect(-20, -20, 40, 40);

      // Cross-Body Leather Strap
      ctx.fillStyle = "#271003";
      ctx.beginPath();
      ctx.moveTo(-7.0, -7.0); ctx.lineTo(7.0, 5.0);
      ctx.lineTo(5.0, 7.0);   ctx.lineTo(-9.0, -5.0);
      ctx.closePath();
      ctx.fill();

      // Belt
      ctx.fillStyle = "#1e1008";
      ctx.fillRect(-20, 1.5, 40, 2.2);
    }

    ctx.restore(); // End Apparel Clip
  }

  ctx.restore(); // End Torso

  if (isBackView) {
    drawQuiver();
  }

  if (cfg.tailFront) {
    drawTail();
  }

  // -------------------------------------------------------------
  // 7. Expressive Goblin Head, Bat Ears & Pointy Snout
  // -------------------------------------------------------------
  ctx.save();
  const headTilt = (cfg.flip !== 0) ? cfg.flip * (moving ? 0.09 : 0.04) * (isProfileView ? 1 : 0.6) : 0;

  // Secondary Ear Motion: Dynamic Inertia Lag & Micro-Twitch
  const earLag = moving ? Math.sin(walkPhase) * 0.14 : 0;
  const earTwitch = Math.sin(nowMs * 0.005 + seed) * 0.06;

  // Masterwork Bat Ear Geometry (Notched Cartilage & Left Earring)
  const drawBatEar = (isRightSide) => {
    ctx.save();
    const earSign = isRightSide ? 1 : -1;
    let earSpreadX = cfg.earSpread;
    let earAngleY = -7.2;

    if (isProfileView) {
      earSpreadX = (isRightSide === (cfg.flip > 0)) ? 15.0 : 10.5;
    } else if (isDiagView) {
      earSpreadX = (isRightSide === (cfg.flip > 0)) ? 18.5 : 14.5;
    }

    const earTipX = headX + earSign * earSpreadX;
    const earTipY = headY + earAngleY + (isRightSide ? -(earLag - earTwitch) : (earLag + earTwitch)) * 8.5;

    // Temporal Ear Roots
    const rootUpperX = headX + earSign * (isProfileView ? 1.4 : 2.6);
    const rootUpperY = headY - 2.2;
    const rootLowerX = headX + earSign * (isProfileView ? 3.2 : 4.6);
    const rootLowerY = headY + 2.2;
    const notchOuterX = headX + earSign * (earSpreadX * 0.68);
    const notchOuterY = earTipY + 4.8;
    const notchInnerX = headX + earSign * (earSpreadX * 0.58);
    const notchInnerY = earTipY + 3.4;

    ctx.fillStyle = isShadowPass ? "#000000" : skinBase;

    // 1. Outer Cartilage Blade with Iconic Feral Notch (Lineless)
    ctx.beginPath();
    ctx.moveTo(rootUpperX, rootUpperY);
    ctx.quadraticCurveTo(headX + earSign * (earSpreadX * 0.52), headY - 7.8, earTipX, earTipY);
    ctx.quadraticCurveTo(headX + earSign * (earSpreadX * 0.88), earTipY + 2.6, notchOuterX, notchOuterY);
    ctx.lineTo(notchInnerX, notchInnerY);
    ctx.quadraticCurveTo(headX + earSign * (earSpreadX * 0.72), headY + 3.4, rootLowerX, rootLowerY);
    ctx.closePath();
    ctx.fill();

    if (!isShadowPass) {
      // 2. Deep Shaded Inner Pinna & Cartilage Ridge (Lineless)
      if (isFrontView || isProfileView) {
        ctx.fillStyle = innerEar;
        ctx.beginPath();
        ctx.moveTo(rootUpperX + earSign * 1.2, rootUpperY + 0.8);
        ctx.quadraticCurveTo(headX + earSign * (earSpreadX * 0.48), headY - 5.4, earTipX - earSign * 2.8, earTipY + 1.8);
        ctx.quadraticCurveTo(headX + earSign * (earSpreadX * 0.62), earTipY + 3.0, notchInnerX, notchInnerY);
        ctx.quadraticCurveTo(headX + earSign * (earSpreadX * 0.50), headY + 1.8, rootLowerX - earSign * 0.6, rootLowerY - 0.8);
        ctx.closePath();
        ctx.fill();

        // Delicate Cartilage Fold Line (Soft Subtle Accent)
        ctx.strokeStyle = isSlowed ? "rgba(2, 132, 199, 0.4)" : "rgba(16, 60, 25, 0.4)";
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(rootUpperX + earSign * 2.0, rootUpperY + 1.4);
        ctx.quadraticCurveTo(headX + earSign * (earSpreadX * 0.42), headY - 3.2, earTipX - earSign * 4.6, earTipY + 2.6);
        ctx.stroke();
      }

      // 3. Hand-Forged Gold Earring Hoop (Consistent Left Ear)
      const isThisEarringEar = cfg.earringVisible && (isRightSide === !!cfg.earringScreenRight);
      if (isThisEarringEar) {
        const ringX = notchOuterX + (earSign * 0.6);
        const ringY = notchOuterY + 0.6;
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(ringX, ringY, 1.6, 0, Math.PI * 2);
        ctx.stroke();

        // Specular glint
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(ringX - 0.5, ringY - 0.5, 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  };

  if (cfg.view === "front" || cfg.view === "back") {
    drawBatEar(false);
    drawBatEar(true);
  } else if (cfg.flip > 0) {
    drawBatEar(false);
    drawBatEar(true);
  } else {
    drawBatEar(true);
    drawBatEar(false);
  }

  // Bare Sculpted Goblin Cranium (Lineless)
  ctx.fillStyle = isShadowPass ? "#000000" : skinBase;
  ctx.beginPath();
  ctx.ellipse(headX, headY, 7.8, 7.0, headTilt, 0, Math.PI * 2);
  ctx.fill();

  if (!isShadowPass) {
    // Warty freckles on cheekbones
    ctx.fillStyle = skinDark;
    ctx.beginPath();
    ctx.arc(headX - 4.2, headY + 1.2, 0.45, 0, Math.PI * 2);
    ctx.arc(headX + 4.2, headY + 1.2, 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Directional Face across 8 Directions with Hooked Snout & Needle Underbite
    if (isFrontView || isProfileView) {
      const drawEye = (ex, ey, isProfile = false) => {
        // Furrowed sinister brow line (Soft Subtle Line)
        ctx.strokeStyle = isSlowed ? "rgba(2, 132, 199, 0.5)" : "rgba(16, 60, 25, 0.5)";
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(ex - 1.8, ey - 2.0);
        ctx.lineTo(ex + 1.8, ey - 1.5);
        ctx.stroke();

        ctx.fillStyle = "#052e16";
        ctx.beginPath();
        ctx.ellipse(ex, ey, isProfile ? 1.9 : 2.3, isProfile ? 1.5 : 1.7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.ellipse(ex, ey, isProfile ? 1.3 : 1.5, isProfile ? 1.0 : 1.2, 0, 0, Math.PI * 2);
        ctx.fill();

        const pupilShiftX = isArcher ? Math.cos(facingAngle) * 0.55 : 0;
        const pupilShiftY = isArcher ? Math.sin(facingAngle) * 0.45 : 0;

        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.ellipse(ex + pupilShiftX, ey + pupilShiftY, 0.42, 0.95, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(ex + pupilShiftX * 0.5 - 0.35, ey + pupilShiftY * 0.5 - 0.35, 0.38, 0, Math.PI * 2);
        ctx.fill();
      };

      if (cfg.view === "front") {
        drawEye(headX - 2.6, headY - 1.0);
        drawEye(headX + 2.6, headY - 1.0);

        // Defined Hooked Snout Nasal Ridge (Soft Line)
        ctx.strokeStyle = isSlowed ? "rgba(2, 132, 199, 0.4)" : "rgba(16, 60, 25, 0.4)";
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(headX, headY - 0.6);
        ctx.lineTo(headX, headY + 1.2);
        ctx.stroke();

        // Dark Nostril Slits
        ctx.fillStyle = "#052e16";
        ctx.beginPath();
        ctx.ellipse(headX - 0.9, headY + 1.5, 0.38, 0.65, -0.2, 0, Math.PI * 2);
        ctx.ellipse(headX + 0.9, headY + 1.5, 0.38, 0.65, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Front Snarl, Dual Ivory Tusks & Needle Teeth (Soft Lip Line)
        ctx.strokeStyle = isSlowed ? "rgba(2, 132, 199, 0.6)" : "rgba(5, 46, 22, 0.6)";
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.arc(headX, headY + 4.0, 2.8, 0.1, Math.PI - 0.1, false);
        ctx.stroke();

        ctx.fillStyle = "#fffbeb";
        ctx.beginPath();
        // Left Main Tusk
        ctx.moveTo(headX - 2.0, headY + 4.3); ctx.lineTo(headX - 1.5, headY + 2.0); ctx.lineTo(headX - 0.9, headY + 4.3);
        // Middle Needle Teeth
        ctx.moveTo(headX - 0.6, headY + 4.4); ctx.lineTo(headX - 0.3, headY + 3.2); ctx.lineTo(headX, headY + 4.4);
        ctx.moveTo(headX, headY + 4.4); ctx.lineTo(headX + 0.3, headY + 3.2); ctx.lineTo(headX + 0.6, headY + 4.4);
        // Right Main Tusk
        ctx.moveTo(headX + 0.9, headY + 4.3); ctx.lineTo(headX + 1.5, headY + 2.0); ctx.lineTo(headX + 2.0, headY + 4.3);
        ctx.closePath();
        ctx.fill();
      } else {
        const eyeX = headX + cfg.flip * (isProfileView ? 2.8 : 2.4);
        const eyeY = headY - 1.0;
        drawEye(eyeX, eyeY, isProfileView);

        if (isDiagView) {
          drawEye(headX - cfg.flip * 1.4, headY - 1.0, true);
        }

        // Pointy Hooked Snout Contour (Soft Line)
        const snoutTipX = headX + cfg.flip * (isProfileView ? 4.6 : 3.8);
        const snoutTipY = headY + 1.4;

        ctx.strokeStyle = isSlowed ? "rgba(2, 132, 199, 0.45)" : "rgba(16, 60, 25, 0.45)";
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(headX + cfg.flip * 1.8, headY - 0.4);
        ctx.quadraticCurveTo(snoutTipX + cfg.flip * 0.8, snoutTipY - 0.8, snoutTipX, snoutTipY);
        ctx.lineTo(snoutTipX - cfg.flip * 1.2, snoutTipY + 1.2);
        ctx.stroke();

        // Dark Nostril Slit
        ctx.fillStyle = "#052e16";
        ctx.beginPath();
        ctx.ellipse(snoutTipX - cfg.flip * 0.8, snoutTipY + 0.2, 0.42, 0.7, cfg.flip * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Sleek Jawline Snarl & Underbite Tusks (Soft Lip Line)
        const mouthX = headX + cfg.flip * 1.4;
        const mouthY = headY + 3.8;
        ctx.strokeStyle = isSlowed ? "rgba(2, 132, 199, 0.6)" : "rgba(5, 46, 22, 0.6)";
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.arc(mouthX, mouthY, 2.5, 0.1, Math.PI - 0.1, false);
        ctx.stroke();

        ctx.fillStyle = "#fffbeb";
        ctx.beginPath();
        // Main Tusk
        ctx.moveTo(mouthX + cfg.flip * 0.8, mouthY + 0.9);
        ctx.lineTo(mouthX + cfg.flip * 1.3, mouthY - 2.4);
        ctx.lineTo(mouthX + cfg.flip * 2.1, mouthY + 0.9);
        // Needle tooth
        ctx.moveTo(mouthX - cfg.flip * 0.4, mouthY + 0.9);
        ctx.lineTo(mouthX - cfg.flip * 0.1, mouthY - 0.4);
        ctx.lineTo(mouthX + cfg.flip * 0.4, mouthY + 0.9);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Archetype Headwear (Lineless)
    if (isKing) {
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.moveTo(headX - 6.2, headY - 3.4);
      ctx.lineTo(headX - 5.2, headY - 9.2);
      ctx.lineTo(headX - 2.6, headY - 6.0);
      ctx.lineTo(headX, headY - 11.2);
      ctx.lineTo(headX + 2.6, headY - 6.0);
      ctx.lineTo(headX + 5.2, headY - 9.2);
      ctx.lineTo(headX + 6.2, headY - 3.4);
      ctx.closePath();
      ctx.fill();

      if (!isBackView) {
        ctx.fillStyle = "#e11d48";
        ctx.beginPath();
        ctx.arc(headX, headY - 6.8, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (isThief) {
      // Thief: Dark Hood / Cowl (Lineless)
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.arc(headX, headY - 1.8, 8.4, Math.PI * 0.72, Math.PI * 2.28, false);
      ctx.lineTo(headX - cfg.flip * 7.8, headY - 5.8);
      ctx.closePath();
      ctx.fill();
    } else if (isWarrior) {
      // Warrior / Brute: Spiked War Helmet with Crest & Visor Slit (Lineless)
      const plumeWave = Math.sin(nowMs * 0.008 + seed) * 2.0;
      ctx.fillStyle = isBrute ? "#7f1d1d" : "#dc2626";
      ctx.beginPath();
      ctx.moveTo(headX, headY - 6.2);
      ctx.quadraticCurveTo(headX - cfg.flip * 4.2 + plumeWave, headY - 11.5, headX - cfg.flip * 8.0 + plumeWave, headY - 12.5);
      ctx.lineTo(headX - cfg.flip * 2.4, headY - 5.2);
      ctx.closePath();
      ctx.fill();

      // Iron Dome
      ctx.fillStyle = "#475569";
      ctx.beginPath();
      ctx.arc(headX, headY - 2.0, 8.0, Math.PI * 0.85, Math.PI * 2.15, false);
      ctx.closePath();
      ctx.fill();

      // Reinforced Iron Browband
      ctx.fillStyle = "#334155";
      ctx.fillRect(headX - 6.5, headY - 2.8, 13.0, 2.2);

      // Narrow Glowing Visor Eye Slit (Only in front/profile views)
      if (isFrontView || isProfileView) {
        ctx.fillStyle = "#0f172a";
        const visorW = isProfileView ? 5.8 : 10.0;
        const visorX = isProfileView ? (headX + (cfg.flip > 0 ? 0.5 : -6.3)) : (headX - 5.0);
        ctx.fillRect(visorX, headY - 1.2, visorW, 1.5);

        // Glowing fierce amber / orange eyes peering from the visor
        ctx.fillStyle = "#f59e0b";
        if (cfg.view === "front") {
          ctx.fillRect(headX - 3.8, headY - 0.9, 2.2, 0.8);
          ctx.fillRect(headX + 1.6, headY - 0.9, 2.2, 0.8);
        } else {
          ctx.fillRect(headX + cfg.flip * 1.5, headY - 0.9, 3.2, 0.8);
        }
      }
    } else if (isMage) {
      // Mage: Occult Cowl & Gold Runic Trim (Lineless)
      ctx.fillStyle = "#4c1d95";
      ctx.beginPath();
      ctx.arc(headX, headY - 1.6, 8.2, Math.PI * 0.75, Math.PI * 2.25, false);
      ctx.lineTo(headX - cfg.flip * 7.6, headY - 6.2);
      ctx.closePath();
      ctx.fill();

      // Golden Runic Hem Trim
      ctx.strokeStyle = "rgba(251, 191, 36, 0.8)";
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.arc(headX, headY - 1.6, 8.2, Math.PI * 0.82, Math.PI * 2.18, false);
      ctx.stroke();
    }
  }
  ctx.restore(); // End Head

  // -------------------------------------------------------------
  // Foreground Arms (Layered over Torso and Head)
  // -------------------------------------------------------------
  if (isArcher) {
    drawArcherEquipment(true);
  } else {
    if (cfg.leftArmFront) {
      drawLeftArmOffHand();
    }
    if (cfg.rightArmFront) {
      drawRightHandWeapon();
    }
  }

  ctx.restore(); // Root
}

function drawSegmentedGoblin(ctx, x, y, opts = {}) {
  const ent = {
    type: opts.type || "goblin",
    facingAngle: opts.facingAngle || 0,
    moving: opts.moving || false,
    isAttacking: opts.isAttacking || false,
    isSlowed: opts.isSlowed || false,
    id: opts.entityId || "goblin",
    equippedWeapon: opts.equippedWeapon,
    armor: opts.armor,
  };
  drawGoblinEntity(ctx, x, y, ent, opts.isShadowPass || false);
}

export function drawGoblin(ctx, screenX, screenY, sSize, type, ent, isShadowPass = false) {
  if (!ent) ent = {};
  if (type && typeof type === "string") ent.type = type;
  drawGoblinEntity(ctx, screenX, screenY, ent, isShadowPass);
}

export { drawSegmentedGoblin };

// =============================================================
// Goblin Archer Projectile System
// High-performance procedural lineless arrows with authentic physics
// =============================================================
export const goblinArrows = [];

export function shootGoblinArrow(opts = {}) {
  const x = opts.x || 0;
  const y = opts.y || 0;
  const angle = opts.angle || 0;
  const speed = opts.speed || 720;
  const damage = opts.damage || 20;
  const sourceId = opts.sourceId || "goblin_archer";
  const maxDistance = opts.maxDistance || 1500;

  const arrow = {
    id: "arrow_" + Math.random().toString(36).substr(2, 9),
    x,
    y,
    startX: x,
    startY: y,
    angle,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    speed,
    damage,
    sourceId,
    maxDistance,
    distanceTraveled: 0,
    state: "flying", // "flying" | "stuck" | "spent"
    createdAt: performance.now(),
    stuckTime: 0,
    vibration: 0,
    trail: []
  };

  goblinArrows.push(arrow);
  return arrow;
}

export function shootGoblinArrowVolley(opts = {}) {
  const baseAngle = opts.angle || 0;
  const angles = [baseAngle - 0.16, baseAngle, baseAngle + 0.16];
  const spawned = [];
  for (let i = 0; i < angles.length; i++) {
    spawned.push(shootGoblinArrow({
      ...opts,
      angle: angles[i],
      speed: (opts.speed || 720) * (0.95 + i * 0.05)
    }));
  }
  return spawned;
}

export function updateGoblinArrows(dt, bounds = null, targets = null) {
  const now = performance.now();
  for (let i = goblinArrows.length - 1; i >= 0; i--) {
    const a = goblinArrows[i];

    if (a.state === "flying") {
      const stepX = a.vx * dt;
      const stepY = a.vy * dt;
      a.x += stepX;
      a.y += stepY;
      a.distanceTraveled += Math.hypot(stepX, stepY);

      // Trailing motion history
      a.trail.push({ x: a.x, y: a.y, time: now });
      if (a.trail.length > 8) a.trail.shift();

      // Subtle aerodynamic feather / dust particle
      if (typeof window !== "undefined" && window.spawnParticle && Math.random() < 0.35) {
        window.spawnParticle({
          x: a.x - Math.cos(a.angle) * 12,
          y: a.y - Math.sin(a.angle) * 12,
          vx: -Math.cos(a.angle) * 35 + (Math.random() - 0.5) * 20,
          vy: -Math.sin(a.angle) * 35 + (Math.random() - 0.5) * 20,
          color: ["#166534", "#22c55e", "#fef08a", "#e2e8f0"],
          size: 1.5,
          maxLife: 0.3,
          drag: 0.92,
          shrink: true
        });
      }

      // Check collision with targets if provided
      let hitTarget = false;
      if (targets && Array.isArray(targets)) {
        for (const target of targets) {
          const dx = a.x - target.x;
          const dy = a.y - target.y;
          const r = target.radius || 30;
          if (dx * dx + dy * dy < r * r) {
            hitTarget = true;
            a.state = "stuck";
            a.stuckTime = now;
            a.targetHit = target;
            if (typeof target.onHit === "function") {
              target.onHit(a);
            }
            break;
          }
        }
      }

      // Check collision with bounds if provided
      if (!hitTarget && bounds) {
        if (
          a.x < bounds.minX || a.x > bounds.maxX ||
          a.y < bounds.minY || a.y > bounds.maxY
        ) {
          a.state = "stuck";
          a.stuckTime = now;
          a.x = Math.max(bounds.minX, Math.min(bounds.maxX, a.x));
          a.y = Math.max(bounds.minY, Math.min(bounds.maxY, a.y));
        }
      }

      // Max range
      if (!hitTarget && a.distanceTraveled >= a.maxDistance) {
        a.state = "stuck";
        a.stuckTime = now;
      }

      // If just stuck: spawn wood splinters and impact spark particles
      if (a.state === "stuck") {
        if (typeof window !== "undefined" && window.spawnParticle) {
          for (let p = 0; p < 7; p++) {
            const pAngle = a.angle + Math.PI + (Math.random() - 0.5) * 1.6;
            const pSpd = 40 + Math.random() * 90;
            window.spawnParticle({
              x: a.x,
              y: a.y,
              vx: Math.cos(pAngle) * pSpd,
              vy: Math.sin(pAngle) * pSpd,
              color: ["#854d0e", "#b45309", "#94a3b8", "#e2e8f0", "#166534"],
              size: 2.0,
              maxLife: 0.45,
              drag: 0.90,
              gravity: 120,
              shrink: true
            });
          }
        }
      }
    } else if (a.state === "stuck") {
      const elapsed = (now - a.stuckTime) / 1000;
      // Authentic damped spring vibration on impact
      a.vibration = Math.sin(elapsed * 45) * Math.exp(-elapsed * 9) * 0.18;

      // Clean up after 3.5 seconds
      if (elapsed > 3.5) {
        goblinArrows.splice(i, 1);
      }
    }
  }
}

export function drawGoblinArrow(ctx, arrow) {
  if (!arrow) return;
  const now = performance.now();
  const isStuck = arrow.state === "stuck";
  const stuckAge = isStuck ? (now - arrow.stuckTime) / 1000 : 0;
  const alpha = isStuck && stuckAge > 2.5 ? Math.max(0, 1 - (stuckAge - 2.5)) : 1.0;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Aerodynamic speed motion blur streak behind flying arrow
  if (!isStuck && arrow.trail && arrow.trail.length > 2) {
    ctx.save();
    for (let t = 0; t < arrow.trail.length - 1; t++) {
      const p1 = arrow.trail[t];
      const p2 = arrow.trail[t + 1];
      const trailAlpha = (t / arrow.trail.length) * 0.35;
      ctx.strokeStyle = `rgba(226, 232, 240, ${trailAlpha})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Position and orient arrow along trajectory
  ctx.translate(arrow.x, arrow.y);
  ctx.rotate(arrow.angle + (arrow.vibration || 0));

  // 1. Shaft (Hardwood Cedar)
  ctx.fillStyle = "#854d0e";
  ctx.fillRect(-16, -1.0, 22, 2.0);

  // Shaft specular wood grain
  ctx.fillStyle = "#a16207";
  ctx.fillRect(-16, -1.0, 22, 0.7);

  // 2. Sinew wrapping at arrowhead socket
  ctx.fillStyle = "#451a03";
  ctx.fillRect(4.5, -1.2, 2.0, 2.4);

  // 3. Arrowhead (Chipped Flint / Obsidian Broadhead Blade)
  ctx.fillStyle = "#334155";
  ctx.beginPath();
  ctx.moveTo(11.0, 0);       // Tip
  ctx.lineTo(5.5, -3.2);     // Upper barb
  ctx.lineTo(6.5, -0.6);     // Inner notch
  ctx.lineTo(6.5, 0.6);      // Inner notch
  ctx.lineTo(5.5, 3.2);      // Lower barb
  ctx.closePath();
  ctx.fill();

  // Razor edge specular glint
  ctx.strokeStyle = "rgba(241, 245, 249, 0.85)";
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(11.0, 0);
  ctx.lineTo(5.8, -3.0);
  ctx.stroke();

  // 4. Feather Fletchings (Authentic Hunter Green & Pale Gold)
  // Upper Vane
  ctx.fillStyle = "#166534";
  ctx.beginPath();
  ctx.moveTo(-16.0, -0.5);
  ctx.lineTo(-15.0, -3.6);
  ctx.lineTo(-10.5, -3.6);
  ctx.lineTo(-9.0, -0.5);
  ctx.closePath();
  ctx.fill();

  // Upper Vane Accent Stripe
  ctx.fillStyle = "#fef08a";
  ctx.beginPath();
  ctx.moveTo(-13.5, -0.5);
  ctx.lineTo(-13.0, -3.4);
  ctx.lineTo(-12.0, -3.4);
  ctx.lineTo(-12.5, -0.5);
  ctx.closePath();
  ctx.fill();

  // Lower Vane
  ctx.fillStyle = "#15803d";
  ctx.beginPath();
  ctx.moveTo(-16.0, 0.5);
  ctx.lineTo(-15.0, 3.6);
  ctx.lineTo(-10.5, 3.6);
  ctx.lineTo(-9.0, 0.5);
  ctx.closePath();
  ctx.fill();

  // Lower Vane Accent Stripe
  ctx.fillStyle = "#fef08a";
  ctx.beginPath();
  ctx.moveTo(-13.5, 0.5);
  ctx.lineTo(-13.0, 3.4);
  ctx.lineTo(-12.0, 3.4);
  ctx.lineTo(-12.5, 0.5);
  ctx.closePath();
  ctx.fill();

  // Thread binding securing fletching to shaft
  ctx.fillStyle = "#78350f";
  ctx.fillRect(-16.0, -1.2, 1.2, 2.4);
  ctx.fillRect(-9.2, -1.2, 1.2, 2.4);

  // 5. Bone Nock at the rear
  ctx.fillStyle = "#fef3c7";
  ctx.fillRect(-17.5, -0.9, 1.5, 1.8);
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(-17.5, -0.4, 0.8, 0.8);

  ctx.restore();
}

export function drawGoblinArrows(ctx) {
  for (let i = 0; i < goblinArrows.length; i++) {
    drawGoblinArrow(ctx, goblinArrows[i]);
  }
}

export function clearGoblinArrows() {
  goblinArrows.length = 0;
}

if (typeof window !== "undefined") {
  window.drawGoblinEntity = drawGoblinEntity;
  window.drawSegmentedGoblin = drawSegmentedGoblin;
  window.drawGoblin = drawGoblin;
  window.goblinArrows = goblinArrows;
  window.shootGoblinArrow = shootGoblinArrow;
  window.shootGoblinArrowVolley = shootGoblinArrowVolley;
  window.updateGoblinArrows = updateGoblinArrows;
  window.drawGoblinArrow = drawGoblinArrow;
  window.drawGoblinArrows = drawGoblinArrows;
  window.clearGoblinArrows = clearGoblinArrows;
}
