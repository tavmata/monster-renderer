// goblins.js - Procedural 8-Directional Segmented Goblin Entity Renderer
import { computeFastSeed, safeCreateRadialGradient } from './helpers.js';

export function drawGoblinEntity(ctx, x, y, ent, isShadowPass = false) {
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
      earringVisible: false
    },
    // 1: South-East (SE) - 3/4 Front facing Down-Right (Right arm far side = behind, Left arm near side = front)
    {
      dir: "SE", view: "front_diag", flip: 1, tilt: 0.08,
      headX: 1.4, headY: -18.0, earSpread: 17.5,
      tailX: -7.5, tailY: -0.5, tailFront: false,
      rightArmX: -3.2, rightArmY: -9.5, rightArmFront: false,
      leftArmX: 4.2, leftArmY: -9.0, leftArmFront: true,
      earringVisible: true, earringScreenRight: true
    },
    // 2: South (S) - Direct Front facing Camera (Both arms in foreground)
    {
      dir: "S", view: "front", flip: 1, tilt: 0.00,
      headX: 0.0, headY: -17.8, earSpread: 18.5,
      tailX: 0.0, tailY: 1.0, tailFront: false,
      rightArmX: -4.4, rightArmY: -9.5, rightArmFront: true,
      leftArmX: 4.4, leftArmY: -9.5, leftArmFront: true,
      earringVisible: true, earringScreenRight: true
    },
    // 3: South-West (SW) - 3/4 Front facing Down-Left (Right arm near side = front, Left arm far side = behind)
    {
      dir: "SW", view: "front_diag", flip: -1, tilt: -0.08,
      headX: -1.4, headY: -18.0, earSpread: 17.5,
      tailX: 7.5, tailY: -0.5, tailFront: false,
      rightArmX: -3.8, rightArmY: -9.5, rightArmFront: true,
      leftArmX: 3.2, leftArmY: -9.0, leftArmFront: false,
      earringVisible: true, earringScreenRight: true
    },
    // 4: West (W) - Side Profile facing Left (Right arm near side = front, Left arm far side = behind)
    {
      dir: "W", view: "side", flip: -1, tilt: -0.14,
      headX: -2.0, headY: -18.5, earSpread: 15.0,
      tailX: 10.0, tailY: -2.0, tailFront: false,
      rightArmX: -2.8, rightArmY: -9.5, rightArmFront: true,
      leftArmX: 1.2, leftArmY: -8.8, leftArmFront: false,
      earringVisible: true, earringScreenRight: false
    },
    // 5: North-West (NW) - 3/4 Back facing Up-Left (Right arm far side = behind, Left arm near side = front)
    {
      dir: "NW", view: "back_diag", flip: -1, tilt: -0.08,
      headX: -1.2, headY: -19.2, earSpread: 17.5,
      tailX: 6.5, tailY: 5.5, tailFront: true,
      rightArmX: 3.5, rightArmY: -9.5, rightArmFront: false,
      leftArmX: -3.8, leftArmY: -9.0, leftArmFront: true,
      earringVisible: true, earringScreenRight: false
    },
    // 6: North (N) - Direct Back facing Up (Both arms layered in background)
    {
      dir: "N", view: "back", flip: 1, tilt: 0.00,
      headX: 0.0, headY: -19.5, earSpread: 18.0,
      tailX: 0.0, tailY: 6.5, tailFront: true,
      rightArmX: 4.4, rightArmY: -9.5, rightArmFront: false,
      leftArmX: -4.4, leftArmY: -9.5, leftArmFront: false,
      earringVisible: true, earringScreenRight: false
    },
    // 7: North-East (NE) - 3/4 Back facing Up-Right (Right arm near side = front, Left arm far side = behind)
    {
      dir: "NE", view: "back_diag", flip: 1, tilt: 0.08,
      headX: 1.2, headY: -19.2, earSpread: 17.5,
      tailX: -6.5, tailY: 5.5, tailFront: true,
      rightArmX: 3.5, rightArmY: -9.5, rightArmFront: true,
      leftArmX: -3.2, leftArmY: -9.0, leftArmFront: false,
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
    if (attackProgress < 0.25) {
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

  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // Harmonic Natural Goblin Palette (Earthy Moss & Forest Darks)
  // -------------------------------------------------------------
  const skinBase = isSlowed ? "#38bdf8" : isThief ? "#1f5f30" : isMage ? "#1b6350" : isWarrior ? "#287038" : isBrute ? "#1e562c" : isKing ? "#34853d" : "#2d7a38";
  const skinDark = isSlowed ? "#0284c7" : isThief ? "#123d1e" : isMage ? "#104235" : isWarrior ? "#164622" : isBrute ? "#10361a" : isKing ? "#1d5225" : "#1a4c23";
  const skinOutline = isSlowed ? "#0369a1" : "#051d0d";
  const innerEar = isSlowed ? "#0284c7" : isMage ? "#0d3b2f" : "#14401e";
  const eyeColor = isMage ? "#c084fc" : isKing ? "#fbbf24" : isThief ? "#f97316" : isWarrior ? "#ea580c" : "#facc15";

  // -------------------------------------------------------------
  // 1. Ambient Contact Shadow (Ground-Anchored with Occlusion)
  // -------------------------------------------------------------
  if (!isShadowPass) {
    ctx.save();
    const shadowW = 9.2 * (scale / 1.7);
    const shadowH = 4.2 * (scale / 1.7);
    const shadowAlpha = moving ? 0.30 : 0.38;
    ctx.fillStyle = `rgba(5, 20, 10, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(x, y + 2.0, shadowW, shadowH, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner dark core shadow
    ctx.fillStyle = "rgba(0, 5, 2, 0.25)";
    ctx.beginPath();
    ctx.ellipse(x, y + 2.0, shadowW * 0.55, shadowH * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

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
  // 2. Sinewy Whiplike Tail (Anchored to Pelvis)
  // -------------------------------------------------------------
  const drawTail = () => {
    ctx.save();
    const tailWave = Math.sin(nowMs * 0.008 + seed) * 2.8 + (moving ? -cfg.flip * Math.cos(walkPhase) * 3.6 : 0);
    const tailBaseX = torsoX - (isProfileView ? cfg.flip * 4.5 : 0);
    const tailBaseY = torsoY + 4.2;
    const tailTipX = tailBaseX + cfg.tailX + (isProfileView ? tailWave * 0.3 : tailWave * 0.8);
    const tailTipY = tailBaseY + cfg.tailY + (isProfileView ? tailWave * 0.7 : Math.abs(tailWave) * 0.4);

    ctx.strokeStyle = isShadowPass ? "#000000" : skinOutline;
    ctx.lineWidth = 3.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(tailBaseX, tailBaseY);
    ctx.quadraticCurveTo(tailBaseX - (isProfileView ? cfg.flip * 4.0 : 0), tailBaseY + 1.8, tailTipX, tailTipY);
    ctx.stroke();

    if (!isShadowPass) {
      ctx.strokeStyle = skinBase;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(tailBaseX, tailBaseY);
      ctx.quadraticCurveTo(tailBaseX - (isProfileView ? cfg.flip * 4.0 : 0), tailBaseY + 1.8, tailTipX, tailTipY);
      ctx.stroke();

      // Sharp Tail Barb
      ctx.fillStyle = skinDark;
      ctx.strokeStyle = skinOutline;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(tailTipX, tailTipY);
      ctx.lineTo(tailTipX - cfg.flip * 2.2, tailTipY - 1.8);
      ctx.lineTo(tailTipX - cfg.flip * 0.8, tailTipY);
      ctx.lineTo(tailTipX - cfg.flip * 2.2, tailTipY + 1.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  };

  if (!cfg.tailFront) {
    drawTail();
  }

  // -------------------------------------------------------------
  // 3. Feral Left Arm (Off-Hand Claws / Dagger & Wrist Wrap)
  // -------------------------------------------------------------
  const drawLeftArmOffHand = () => {
    if (isShadowPass) return;
    ctx.save();
    const armX = cfg.leftArmX;
    const armY = cfg.leftArmY;
    ctx.translate(armX, armY);

    const armDirSign = armX < 0 ? -1 : 1;
    let baseArmRot = isBackView ? -0.45 * armDirSign : 0.40 * armDirSign;

    // Feral sneak / guard pose micro-motion
    const idleOffHandWave = Math.sin(nowMs * 0.004 + seed + 1.2) * 0.08;
    const walkOffHandSwing = moving ? -Math.sin(walkPhase) * 0.22 : 0;
    const attackReaction = (isAttacking && attackProgress > 0) ? (attackProgress < 0.3 ? -0.35 : 0.25) : 0;
    ctx.rotate(baseArmRot + idleOffHandWave + walkOffHandSwing + attackReaction);

    // Shoulder / Deltoid
    ctx.fillStyle = skinBase;
    ctx.strokeStyle = skinOutline;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.ellipse(0, 0, 2.6, 2.0, armDirSign * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Warty freckle on shoulder
    ctx.fillStyle = skinDark;
    ctx.beginPath();
    ctx.arc(armDirSign * 0.5, -0.6, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Forearm angled inward in defensive/prowling posture
    const handX = armDirSign * 4.8;
    const handY = 2.4;

    ctx.beginPath();
    ctx.moveTo(-0.8, -0.4);
    ctx.lineTo(handX, handY - 0.4);
    ctx.lineTo(handX - armDirSign * 0.8, handY + 1.4);
    ctx.lineTo(-0.8, 1.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tattered Leather / Cord Wrist Wrap
    ctx.fillStyle = "#451a03";
    ctx.strokeStyle = "#271003";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(handX - armDirSign * 1.4, handY + 0.4, 1.3, 1.1, armDirSign * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Hand Knuckle & 3 Sharp Obsidian Talons or Dual Off-hand Dagger for Thief
    ctx.fillStyle = skinBase;
    ctx.strokeStyle = skinOutline;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(handX, handY, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (isThief) {
      // Thief / Assassin: Off-Hand Poison Stiletto
      ctx.save();
      ctx.translate(handX, handY);
      ctx.rotate(-armDirSign * 0.8);
      ctx.fillStyle = "#334155";
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, -1.0);
      ctx.lineTo(-armDirSign * 0.8, -9.0);
      ctx.lineTo(armDirSign * 2.2, -10.5);
      ctx.lineTo(armDirSign * 1.5, -4.0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Poison Drip Highlight
      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.arc(armDirSign * 2.0, -10.0, 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // 3 Sharp Curved Talons / Claws
      ctx.fillStyle = "#0f172a";
      ctx.strokeStyle = "#020617";
      ctx.lineWidth = 0.6;

      // Claw 1 (Thumb / inner)
      ctx.beginPath();
      ctx.moveTo(handX + armDirSign * 0.4, handY - 1.0);
      ctx.lineTo(handX + armDirSign * 2.2, handY - 1.4);
      ctx.lineTo(handX + armDirSign * 1.0, handY - 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Claw 2 (Middle)
      ctx.beginPath();
      ctx.moveTo(handX + armDirSign * 0.8, handY - 0.2);
      ctx.lineTo(handX + armDirSign * 2.6, handY + 0.4);
      ctx.lineTo(handX + armDirSign * 0.8, handY + 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Claw 3 (Outer)
      ctx.beginPath();
      ctx.moveTo(handX + armDirSign * 0.4, handY + 0.6);
      ctx.lineTo(handX + armDirSign * 2.0, handY + 1.6);
      ctx.lineTo(handX, handY + 1.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Specular glint on claws
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(handX + armDirSign * 1.8, handY + 0.2, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  // Draw background off-hand arm if layered behind
  if (!cfg.leftArmFront) {
    drawLeftArmOffHand();
  }

  // -------------------------------------------------------------
  // 4. Dominant Right-Hand Weapon (100% Consistent Anatomical Right Hand)
  // -------------------------------------------------------------
  const drawRightHandWeapon = () => {
    if (isShadowPass) return;
    ctx.save();
    const armX = cfg.rightArmX;
    const armY = cfg.rightArmY;
    ctx.translate(armX, armY);

    let swingAngle = 0;
    if (isAttacking) {
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

    const armDirSign = armX < 0 ? -1 : 1;
    const baseArmRot = isBackView ? -0.70 * armDirSign : 0.55 * armDirSign;
    ctx.rotate(baseArmRot + swingAngle);

    // Upper Arm / Shoulder Deltoid
    ctx.fillStyle = skinBase;
    ctx.strokeStyle = skinOutline;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.ellipse(0, 0, 2.9, 2.1, armDirSign * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Forearm
    const handX = armDirSign * 5.8;
    const handY = 2.8;

    ctx.beginPath();
    ctx.moveTo(-1.0, 0);
    ctx.lineTo(handX, handY);
    ctx.lineTo(handX - armDirSign * 1.0, handY + 1.5);
    ctx.lineTo(-1.0, 1.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tattered Leather / Cord Wrist Wrap on weapon hand
    ctx.fillStyle = "#451a03";
    ctx.strokeStyle = "#271003";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(handX - armDirSign * 1.8, handY + 0.4, 1.4, 1.2, armDirSign * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Warrior / Brute Spiked Pauldron on weapon shoulder
    if (isWarrior) {
      ctx.fillStyle = "#475569";
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.arc(0, -0.6, 2.8, Math.PI * 0.8, Math.PI * 2.2, false);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Spike
      ctx.fillStyle = "#94a3b8";
      ctx.beginPath();
      ctx.moveTo(-armDirSign * 1.2, -1.8);
      ctx.lineTo(0, -4.2);
      ctx.lineTo(armDirSign * 1.2, -1.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(handX, handY);

    if (isMage) {
      // Occult Shaman Staff with Ornate Skull & Orb
      ctx.strokeStyle = "#451a03";
      ctx.lineWidth = 2.2;
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
      ctx.strokeStyle = "#f0abfc";
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.arc(0, -16.5, 3.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (isArcher) {
      // Recurve Hunting Bow
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(armDirSign * 2.8, -11.0);
      ctx.quadraticCurveTo(-armDirSign * 3.0, 0, armDirSign * 2.8, 11.0);
      ctx.stroke();

      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(armDirSign * 2.8, -11.0);
      ctx.lineTo(armDirSign * 2.8, 11.0);
      ctx.stroke();
    } else if (isKing) {
      // Royal Golden Great Cleaver
      ctx.rotate(armDirSign * 0.4);
      ctx.fillStyle = "#f59e0b";
      ctx.strokeStyle = "#b45309";
      ctx.lineWidth = 1.2;
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
      ctx.stroke();

      // Gleaming Gold Fullers & Gem
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(armDirSign * 7.0, -17.5);
      ctx.lineTo(armDirSign * 8.8, -12.0);
      ctx.stroke();

      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(armDirSign * 3.2, -10.0, 1.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (isThief) {
      // Assassin Serrated Poison Dagger
      ctx.rotate(armDirSign * 0.45);
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(-1.0, -2.0, 2.0, 4.0);
      ctx.fillStyle = "#334155";
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 1.0;
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
      ctx.stroke();

      // Toxic Poison Edge & Glow
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(armDirSign * 3.5, -14.5);
      ctx.lineTo(armDirSign * 4.5, -10.0);
      ctx.stroke();

      ctx.fillStyle = "#4ade80";
      ctx.beginPath();
      ctx.arc(armDirSign * 3.2, -14.0, 0.7, 0, Math.PI * 2);
      ctx.fill();
    } else if (isBrute) {
      // Heavy Spiked Iron Club
      ctx.rotate(armDirSign * 0.4);
      ctx.fillStyle = "#451a03";
      ctx.fillRect(-1.5, -2.0, 3.0, 6.0); // Thick Handle

      ctx.fillStyle = "#334155";
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-armDirSign * 2.0, -2.0);
      ctx.lineTo(-armDirSign * 3.5, -16.0);
      ctx.lineTo(armDirSign * 4.5, -16.0);
      ctx.lineTo(armDirSign * 3.0, -2.0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Spikes on Club Head
      ctx.fillStyle = "#94a3b8";
      ctx.beginPath();
      ctx.moveTo(-armDirSign * 3.5, -14.0); ctx.lineTo(-armDirSign * 6.5, -14.0); ctx.lineTo(-armDirSign * 3.2, -12.0);
      ctx.moveTo(armDirSign * 4.5, -14.0);  ctx.lineTo(armDirSign * 7.5, -14.0);  ctx.lineTo(armDirSign * 4.2, -12.0);
      ctx.moveTo(-armDirSign * 3.5, -8.0);  ctx.lineTo(-armDirSign * 6.0, -8.0);  ctx.lineTo(-armDirSign * 3.2, -6.0);
      ctx.moveTo(armDirSign * 4.5, -8.0);   ctx.lineTo(armDirSign * 7.0, -8.0);   ctx.lineTo(armDirSign * 4.2, -6.0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (isWarrior) {
      // Heavy Notched Iron Cleaver
      ctx.rotate(armDirSign * 0.4);
      ctx.fillStyle = "#475569";
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1.1;
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
      ctx.stroke();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(armDirSign * 6.5, -16.5);
      ctx.lineTo(armDirSign * 8.2, -11.5);
      ctx.stroke();
    } else {
      // Basic Goblin Scavenger Shiv (Rough Jagged Slate Blade with Twine Grip)
      ctx.rotate(armDirSign * 0.45);
      ctx.fillStyle = "#fef3c7";
      ctx.fillRect(-1.0, -2.0, 2.0, 4.0);
      ctx.fillStyle = "#64748b";
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 1.0;
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
      ctx.stroke();

      // Sharp Honed Razor Edge
      ctx.strokeStyle = "#f8fafc";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(armDirSign * 5.5, -13.5);
      ctx.lineTo(armDirSign * 6.2, -9.5);
      ctx.stroke();
    }

    // Hand Knuckle holding weapon
    ctx.fillStyle = skinBase;
    ctx.strokeStyle = skinOutline;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(0, 0, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore(); // Weapon
    ctx.restore(); // Arm
  };

  // Draw background weapon arm if layered behind
  if (!cfg.rightArmFront) {
    drawRightHandWeapon();
  }

  // -------------------------------------------------------------
  // 5. Digitigrade Legs, Ankle Wraps & 3-Toed Talon Feet
  // -------------------------------------------------------------
  const drawClawedLegs = () => {
    ctx.save();
    ctx.strokeStyle = isShadowPass ? "#000000" : skinOutline;
    ctx.lineWidth = 1.2;

    const leftStep = moving ? Math.sin(walkPhase) * 2.8 : 0;
    const rightStep = moving ? -Math.sin(walkPhase) * 2.8 : 0;

    const draw3ClawFoot = (footX, footY, dirFlip, isFacingBack) => {
      if (isShadowPass) return;
      // Ambient contact drop shadow under foot
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.beginPath();
      ctx.ellipse(footX, footY + 1.2, 2.4, 0.9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ragged Ankle Bandage Wrap
      ctx.fillStyle = "#451a03";
      ctx.strokeStyle = "#271003";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.ellipse(footX - dirFlip * 0.4, footY - 1.2, 1.4, 0.9, dirFlip * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 3 Sharp Obsidian Talons / Toes
      ctx.fillStyle = "#0f172a";
      ctx.strokeStyle = "#020617";
      ctx.lineWidth = 0.6;

      if (isFacingBack) {
        // Back View: Heel spur + claws pointing slightly away
        ctx.beginPath();
        ctx.moveTo(footX - 1.2, footY);
        ctx.lineTo(footX - 1.6, footY + 1.2);
        ctx.lineTo(footX - 0.6, footY + 0.8);
        ctx.lineTo(footX + 0.6, footY + 0.8);
        ctx.lineTo(footX + 1.6, footY + 1.2);
        ctx.lineTo(footX + 1.2, footY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // Front / Side / Diag: 3 Splayed Obsidian Claws
        // Claw 1 (Inner)
        ctx.beginPath();
        ctx.moveTo(footX - dirFlip * 1.4, footY - 0.2);
        ctx.lineTo(footX + dirFlip * 1.8, footY + 0.8);
        ctx.lineTo(footX - dirFlip * 0.6, footY + 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Claw 2 (Center Main Talon)
        ctx.beginPath();
        ctx.moveTo(footX - dirFlip * 0.6, footY - 0.4);
        ctx.lineTo(footX + dirFlip * 3.4, footY + 0.4);
        ctx.lineTo(footX + dirFlip * 0.4, footY + 0.9);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Claw 3 (Outer)
        ctx.beginPath();
        ctx.moveTo(footX, footY);
        ctx.lineTo(footX + dirFlip * 2.2, footY - 0.6);
        ctx.lineTo(footX + dirFlip * 1.2, footY + 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Specular glint on main talon
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(footX + dirFlip * 2.0, footY + 0.2, 0.35, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    if (cfg.view === "front" || cfg.view === "back") {
      // Front / Back Symmetrical Digitigrade Leg Anchors
      const leftFootX = -4.2;
      const leftFootY = 1.0 - (moving ? Math.max(0, leftStep) : 0);
      const isBack = cfg.view === "back";

      // Left Leg (Muscular Thigh -> Knobby Knee -> Ankle -> Paw)
      ctx.fillStyle = isShadowPass ? "#000000" : (isBack ? skinDark : skinBase);
      ctx.beginPath();
      ctx.moveTo(-5.4, torsoY + 5.2);
      ctx.quadraticCurveTo(-6.6, torsoY + 8.2, -5.2, torsoY + 10.5); // Knobby outer knee
      ctx.quadraticCurveTo(-5.8, torsoY + 12.5, leftFootX - 1.2, leftFootY); // Hock to ankle
      ctx.lineTo(leftFootX + (isBack ? 0 : -1.0), leftFootY + 0.8);
      ctx.lineTo(leftFootX + 1.8, leftFootY);
      ctx.quadraticCurveTo(-2.0, torsoY + 9.5, -2.2, torsoY + 5.2); // Inner groin
      ctx.closePath();
      ctx.fill();
      if (!isShadowPass) ctx.stroke();

      draw3ClawFoot(leftFootX, leftFootY, -1, isBack);

      // Right Leg
      const rightFootX = 4.2;
      const rightFootY = 1.0 - (moving ? Math.max(0, rightStep) : 0);

      ctx.beginPath();
      ctx.moveTo(2.2, torsoY + 5.2);
      ctx.quadraticCurveTo(2.0, torsoY + 9.5, rightFootX - 1.8, rightFootY);
      ctx.lineTo(rightFootX + (isBack ? 0 : 1.0), rightFootY + 0.8);
      ctx.lineTo(rightFootX + 1.2, rightFootY);
      ctx.quadraticCurveTo(5.8, torsoY + 12.5, 5.2, torsoY + 10.5);
      ctx.quadraticCurveTo(6.6, torsoY + 8.2, 5.4, torsoY + 5.2);
      ctx.closePath();
      ctx.fill();
      if (!isShadowPass) ctx.stroke();

      draw3ClawFoot(rightFootX, rightFootY, 1, isBack);
    } else {
      // Profile / Diagonal Digitigrade Leg Anchors
      const drawSingleProfileLeg = (isBackLeg) => {
        const hipX = isBackLeg ? -cfg.flip * 2.6 : cfg.flip * 2.2;
        const step = isBackLeg ? -legSwing : legSwing;
        const footX = hipX + (moving ? step * 0.52 : 0) + cfg.flip * 1.4;
        const footY = 1.0 - (moving ? Math.max(0, Math.sin(walkPhase + (isBackLeg ? Math.PI : 0)) * 2.4) : 0);

        ctx.fillStyle = isShadowPass ? "#000000" : (isBackLeg ? skinDark : skinBase);
        ctx.beginPath();
        ctx.moveTo(hipX - 2.0, torsoY + 5.2);
        ctx.quadraticCurveTo(hipX + (isBackLeg ? -2.8 : 2.8), torsoY + 8.6, hipX + cfg.flip * 1.2, torsoY + 11.2); // Crouched knee
        ctx.quadraticCurveTo(hipX + (isBackLeg ? -1.6 : 1.6), torsoY + 13.0, footX - 1.4, footY); // Digitigrade hock
        ctx.lineTo(footX + cfg.flip * 2.4, footY + 0.4);
        ctx.quadraticCurveTo(hipX + (isBackLeg ? 1.6 : 3.2), torsoY + 8.8, hipX + 2.0, torsoY + 5.2);
        ctx.closePath();
        ctx.fill();
        if (!isShadowPass) ctx.stroke();

        draw3ClawFoot(footX, footY, cfg.flip, false);
      };

      drawSingleProfileLeg(true);
      drawSingleProfileLeg(false);
    }
    ctx.restore();
  };

  drawClawedLegs();

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
  ctx.strokeStyle = isShadowPass ? "#000000" : skinOutline;
  ctx.lineWidth = 1.3;
  ctx.fill();

  // Internal Anatomical Shading & Muscular Sculpting
  if (!isShadowPass) {
    if (isFrontView) {
      // 1. Wiry Pectoral Contours & Sternum Crease (Deep Shading)
      ctx.strokeStyle = skinDark;
      ctx.lineWidth = 0.9;

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
        ctx.strokeStyle = skinDark;
        ctx.lineWidth = 0.7;
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
      // 2. Sculpted Scapulae (Shoulder Blades) & Vertebral Nodes
      ctx.strokeStyle = skinDark;
      ctx.lineWidth = 0.9;

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
        ctx.strokeStyle = skinDark;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(-cfg.flip * 5.8, -2.0);
        ctx.quadraticCurveTo(-cfg.flip * 7.0, -5.2, -cfg.flip * 1.8, -6.8);
        ctx.stroke();
      }
    } else {
      // Side View Spine Curve
      ctx.strokeStyle = skinDark;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-cfg.flip * 5.2, -1.8);
      ctx.quadraticCurveTo(-cfg.flip * 6.6, -4.8, -cfg.flip * 1.6, -6.4);
      ctx.stroke();
    }

    // -----------------------------------------------------------
    // Ragged Dynamic Loincloth & Archetype Apparel (Seamless Clipped)
    // -----------------------------------------------------------
    ctx.save();
    buildTorsoPath();
    ctx.clip();

    if (isBasicGoblin || isThief) {
      // Basic Goblin / Thief: Rugged Distressed Leather Loincloth with Jagged Hem Cuts
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
      ctx.strokeStyle = isThief ? "#64748b" : "#fde68a";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(-3.5, 2.2, 3.2, 2.8);

      // Central Pelvic Flap
      ctx.fillStyle = isThief ? "#1e293b" : "#78350f";
      ctx.strokeStyle = isThief ? "#0f172a" : "#451a03";
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(-2.2, 1.2);
      ctx.lineTo(2.2, 1.2);
      ctx.lineTo(1.8, 6.8);
      ctx.lineTo(0, 7.6);
      ctx.lineTo(-1.8, 6.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Braided Twine Belt & Knot
      ctx.fillStyle = isThief ? "#475569" : "#b45309";
      ctx.fillRect(-20, 0.8, 40, 1.6);
      ctx.fillStyle = isThief ? "#94a3b8" : "#fde68a";
      ctx.fillRect(-20, 1.2, 40, 0.6);

      // Carved Bone Toggle / Knot
      ctx.fillStyle = "#fef3c7";
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.ellipse(0.8, 1.6, 1.2, 0.7, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Scavenger Side Coin Pouch
      ctx.fillStyle = "#451a03";
      ctx.strokeStyle = "#271003";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.ellipse(-3.8, 2.2, 1.2, 1.5, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (isKing) {
      // King: Royal Ermine Fur Tunic & Ruby-Set Golden Belt
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
      ctx.strokeStyle = "#b45309";
      ctx.lineWidth = 1.0;
      ctx.fillRect(-20, 1.2, 40, 2.6);
      ctx.strokeRect(-20, 1.2, 40, 2.6);

      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(0, 2.5, 1.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (isWarrior) {
      // Warrior: Studded Iron Plate Harness & Chainmail Trim
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
      // Mage: Occult Runes & Bone Talisman Chest Piece
      ctx.fillStyle = "#4c1d95";
      ctx.fillRect(-20, -20, 40, 40);

      // Gold Embroidered Sash
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(-20, 1.8, 40, 2.2);

      // Bone Talisman on Chest
      if (isFrontView) {
        ctx.strokeStyle = "#fef3c7";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-2.8, -5.2); ctx.lineTo(0, -3.2); ctx.lineTo(2.8, -5.2);
        ctx.stroke();

        ctx.fillStyle = "#fef3c7";
        ctx.beginPath();
        ctx.arc(0, -3.0, 1.0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (isArcher) {
      // Archer: Hunting Leather Harness & Quiver Strap
      ctx.fillStyle = "#3b2314";
      ctx.fillRect(-20, -20, 40, 40);

      // Cross-Body Leather Strap
      ctx.fillStyle = "#271003";
      ctx.strokeStyle = "#d97706";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(-7.0, -7.0); ctx.lineTo(7.0, 5.0);
      ctx.lineTo(5.0, 7.0);   ctx.lineTo(-9.0, -5.0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Belt
      ctx.fillStyle = "#1e1008";
      ctx.fillRect(-20, 1.5, 40, 2.2);
    }

    ctx.restore(); // End Apparel Clip

    buildTorsoPath();
    ctx.stroke();
  }

  ctx.restore(); // End Torso

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
    ctx.strokeStyle = isShadowPass ? "#000000" : skinOutline;
    ctx.lineWidth = 1.3;
    ctx.lineJoin = "round";

    // 1. Outer Cartilage Blade with Iconic Feral Notch
    ctx.beginPath();
    ctx.moveTo(rootUpperX, rootUpperY);
    ctx.quadraticCurveTo(headX + earSign * (earSpreadX * 0.52), headY - 7.8, earTipX, earTipY);
    ctx.quadraticCurveTo(headX + earSign * (earSpreadX * 0.88), earTipY + 2.6, notchOuterX, notchOuterY);
    ctx.lineTo(notchInnerX, notchInnerY);
    ctx.quadraticCurveTo(headX + earSign * (earSpreadX * 0.72), headY + 3.4, rootLowerX, rootLowerY);
    ctx.closePath();
    ctx.fill();

    if (!isShadowPass) {
      ctx.stroke();

      // 2. Deep Shaded Inner Pinna & Cartilage Ridge
      if (isFrontView || isProfileView) {
        ctx.fillStyle = innerEar;
        ctx.beginPath();
        ctx.moveTo(rootUpperX + earSign * 1.2, rootUpperY + 0.8);
        ctx.quadraticCurveTo(headX + earSign * (earSpreadX * 0.48), headY - 5.4, earTipX - earSign * 2.8, earTipY + 1.8);
        ctx.quadraticCurveTo(headX + earSign * (earSpreadX * 0.62), earTipY + 3.0, notchInnerX, notchInnerY);
        ctx.quadraticCurveTo(headX + earSign * (earSpreadX * 0.50), headY + 1.8, rootLowerX - earSign * 0.6, rootLowerY - 0.8);
        ctx.closePath();
        ctx.fill();

        // Delicate Cartilage Fold Line
        ctx.strokeStyle = skinDark;
        ctx.lineWidth = 0.8;
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
        ctx.strokeStyle = "#b45309";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(ringX, ringY, 1.6, 0, Math.PI * 2);
        ctx.stroke();

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

  // Bare Sculpted Goblin Cranium
  ctx.fillStyle = isShadowPass ? "#000000" : skinBase;
  ctx.strokeStyle = isShadowPass ? "#000000" : skinOutline;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.ellipse(headX, headY, 7.8, 7.0, headTilt, 0, Math.PI * 2);
  ctx.fill();
  if (!isShadowPass) ctx.stroke();

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
        // Furrowed sinister brow line
        ctx.strokeStyle = skinDark;
        ctx.lineWidth = 0.9;
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

        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.ellipse(ex, ey, 0.42, 0.95, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(ex - 0.35, ey - 0.35, 0.38, 0, Math.PI * 2);
        ctx.fill();
      };

      if (cfg.view === "front") {
        drawEye(headX - 2.6, headY - 1.0);
        drawEye(headX + 2.6, headY - 1.0);

        // Defined Hooked Snout Nasal Ridge
        ctx.strokeStyle = skinDark;
        ctx.lineWidth = 0.8;
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

        // Front Snarl, Dual Ivory Tusks & Needle Teeth
        ctx.strokeStyle = "#052e16";
        ctx.lineWidth = 1.3;
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

        // Pointy Hooked Snout Contour
        const snoutTipX = headX + cfg.flip * (isProfileView ? 4.6 : 3.8);
        const snoutTipY = headY + 1.4;

        ctx.strokeStyle = skinDark;
        ctx.lineWidth = 0.9;
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

        // Sleek Jawline Snarl & Underbite Tusks
        const mouthX = headX + cfg.flip * 1.4;
        const mouthY = headY + 3.8;
        ctx.strokeStyle = "#052e16";
        ctx.lineWidth = 1.3;
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

    // Archetype Headwear
    if (isKing) {
      ctx.fillStyle = "#f59e0b";
      ctx.strokeStyle = "#b45309";
      ctx.lineWidth = 1.1;
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
      ctx.stroke();

      if (!isBackView) {
        ctx.fillStyle = "#e11d48";
        ctx.beginPath();
        ctx.arc(headX, headY - 6.8, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (isThief) {
      // Thief: Dark Hood / Cowl
      ctx.fillStyle = "#1e293b";
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(headX, headY - 1.8, 8.4, Math.PI * 0.72, Math.PI * 2.28, false);
      ctx.lineTo(headX - cfg.flip * 7.8, headY - 5.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (isWarrior) {
      // Warrior / Brute: Spiked War Helmet with Crest & Visor Slit
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
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(headX, headY - 2.0, 8.0, Math.PI * 0.85, Math.PI * 2.15, false);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

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
      // Mage: Occult Cowl & Gold Runic Trim
      ctx.fillStyle = "#4c1d95";
      ctx.strokeStyle = "#2e1065";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(headX, headY - 1.6, 8.2, Math.PI * 0.75, Math.PI * 2.25, false);
      ctx.lineTo(headX - cfg.flip * 7.6, headY - 6.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Golden Runic Hem Trim
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(headX, headY - 1.6, 8.2, Math.PI * 0.82, Math.PI * 2.18, false);
      ctx.stroke();
    }
  }
  ctx.restore(); // End Head

  // -------------------------------------------------------------
  // Foreground Arms (Layered over Torso and Head)
  // -------------------------------------------------------------
  if (cfg.leftArmFront) {
    drawLeftArmOffHand();
  }
  if (cfg.rightArmFront) {
    drawRightHandWeapon();
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
if (typeof window !== "undefined") {
  window.drawGoblinEntity = drawGoblinEntity;
  window.drawSegmentedGoblin = drawSegmentedGoblin;
  window.drawGoblin = drawGoblin;
}
