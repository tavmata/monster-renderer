// mobUi.js - Monster Nameplates, Offsets & Health Bar UI Systems

const _DEFAULT_OFFSETS = Object.freeze({ hpOffset: 65, nameOffset: 85 });
const _MOB_OFFSETS_CACHE = {
  "ice_elemental": Object.freeze({ hpOffset: 85, nameOffset: 102 }),
  "magma_elemental": Object.freeze({ hpOffset: 85, nameOffset: 102 }),
  "boss_crystal_weaver": Object.freeze({ hpOffset: 130, nameOffset: 150 }),
  "boss_frost_giant": Object.freeze({ hpOffset: 155, nameOffset: 175 }),
  "boss_obsidian_golem": Object.freeze({ hpOffset: 145, nameOffset: 165 }),
  "boss_void_terror": Object.freeze({ hpOffset: 145, nameOffset: 165 }),
  "boss_abyssal_tidecaller": Object.freeze({ hpOffset: 140, nameOffset: 160 }),
  "elite_knight": Object.freeze({ hpOffset: 102, nameOffset: 122 }),
  "elite_archer": Object.freeze({ hpOffset: 102, nameOffset: 122 }),
  "player": Object.freeze({ hpOffset: 95, nameOffset: 115 }),
};

export function getMobUiOffsets(ent) {
  if (!ent || !ent.type) return _DEFAULT_OFFSETS;
  const type = ent.type;
  const direct = _MOB_OFFSETS_CACHE[type];
  if (direct) return direct;
  
  if (type.startsWith("boss_goblin")) return _MOB_OFFSETS_CACHE["boss_goblin"];
  if (type.includes("warrior")) return _MOB_OFFSETS_CACHE["goblin_warrior"];
  if (type.startsWith("goblin")) return _MOB_OFFSETS_CACHE["goblin"];
  
  return _DEFAULT_OFFSETS;
}

export function drawEntityHP(ctx, ent, screenX, screenY, offset = 28) {
  if (!window.shouldShowMobHpBar(ent)) return;
  if (ent.maxHp) {
    if (ent.displayHp === undefined) ent.displayHp = ent.hp;
    // Smooth interpolator for health bar changes (reduces jumpiness)
    ent.displayHp += (ent.hp - ent.displayHp) * 0.15;

    const hpPercent = Math.max(0, ent.displayHp / ent.maxHp);
    const barW = 34;
    const barH = 5;
    const barX = screenX - barW / 2;
    const barY = screenY - offset;

    // Status Effect Visual Effects (Stun Orbit Stars)
    if (ent.buffs && (ent.buffs.stunned || ent.buffs.stun)) {
      ctx.save();
      const rot = (Date.now() * 0.006) % (Math.PI * 2);
      ctx.strokeStyle = "#f1c40f";
      ctx.fillStyle = "#ffe082";
      ctx.lineWidth = 1.5;
      for (let sIdx = 0; sIdx < 3; sIdx++) {
        const sa = rot + (sIdx * Math.PI * 2) / 3;
        const starX = screenX + Math.cos(sa) * 16;
        const starY = barY - 10 + Math.sin(sa) * 5;
        ctx.beginPath();
        ctx.arc(starX, starY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    // Dark background with black stroke border
    ctx.fillStyle = "rgba(15, 15, 15, 0.85)";
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    ctx.strokeRect(barX - 0.5, barY - 0.5, barW + 1, barH + 1);

    if (ent.type === "player" && ent.id === GameState.myId) {
      ctx.fillStyle = hpPercent < 0.25 ? "#e67e22" : "#2ecc71";
    } else if (ent.isPet) {
      ctx.fillStyle = ent.ownerId === GameState.myId ? "#3498db" : "#2980b9";
    } else {
      ctx.fillStyle = hpPercent < 0.3 ? "#c0392b" : "#e74c3c";
    }

    const fillW = Math.max(0, Math.min(barW, barW * hpPercent));
    if (fillW > 0) {
      ctx.fillRect(barX, barY, fillW, barH);
    }

    if (ent.healShield > 0) {
      const shieldPercent = ent.healShield / ent.maxHp;
      ctx.fillStyle = "rgba(0, 255, 255, 0.7)";
      const startX = barX + fillW;
      const shieldWidth = Math.min(barW - fillW, barW * shieldPercent);
      if (shieldWidth > 0) {
        ctx.fillRect(startX, barY, shieldWidth, barH);
      }
    }

    if (ent.maxMana) {
      const manaPercent = Math.max(0, ent.mana / ent.maxMana);
      const manaY = barY + barH + 2;
      const manaH = 3;
      ctx.fillStyle = "rgba(15, 15, 15, 0.85)";
      ctx.fillRect(barX, manaY, barW, manaH);
      ctx.strokeRect(barX - 0.5, manaY - 0.5, barW + 1, manaH + 1);
      ctx.fillStyle = "#3498db";
      ctx.fillRect(barX, manaY, barW * manaPercent, manaH);
    }

    if (ent.currentCast && ent.currentCast.duration > 0) {
      const elapsed = Math.max(0, Date.now() - (ent.currentCast.startTime || Date.now()));
      const castPercent = Math.min(1, elapsed / ent.currentCast.duration);
      const castY = barY + barH + (ent.maxMana ? 5 : 2);
      const castH = 3;
      ctx.fillStyle = "rgba(15, 15, 15, 0.85)";
      ctx.fillRect(barX, castY, barW, castH);
      ctx.strokeRect(barX - 0.5, castY - 0.5, barW + 1, castH + 1);
      ctx.fillStyle = "#f1c40f"; // Yellow color for cast bar
      ctx.fillRect(barX, castY, barW * castPercent, castH);
    }

    // Local player Dodge / Stamina Micro-Bar (Minimalist HUD)
    if (ent.type === "player" && ent.id === GameState.myId) {
      const nowMs = Date.now();
      const dodgeCd = window.localDodgeCooldownAt || 0;
      const isDodgeOnCd = dodgeCd > nowMs;
      const totalDodgeCd = 1500;

      if (isDodgeOnCd) {
        const remaining = dodgeCd - nowMs;
        const progress = Math.max(0, Math.min(1, 1 - (remaining / totalDodgeCd)));
        let dodgeExtraY = ent.maxMana ? 5 : 2;
        if (ent.currentCast && ent.currentCast.duration > 0) dodgeExtraY += 5;
        const dodgeY = barY + barH + dodgeExtraY;
        const dodgeH = 2.5;

        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.fillRect(barX, dodgeY, barW, dodgeH);
        ctx.strokeStyle = "rgba(2, 132, 199, 0.5)";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(barX - 0.5, dodgeY - 0.5, barW + 1, dodgeH + 1);

        const dodgeFillW = Math.max(0, Math.min(barW, barW * progress));
        if (dodgeFillW > 0) {
          ctx.fillStyle = "#38bdf8";
          ctx.fillRect(barX, dodgeY, dodgeFillW, dodgeH);
        }
      }
    }

    if (ent.class === "assassin" && ent.id === GameState.myId) {
      const maxCombo = 5;
      const combo = ent.comboPoints || 0;
      const dotRadius = 1.5;
      const spacing = 5;
      const startX = screenX - (maxCombo * spacing) / 2 + spacing / 2;
      for (let i = 0; i < maxCombo; i++) {
        ctx.beginPath();
        ctx.arc(
          startX + i * spacing,
          screenY - offset + 11,
          dotRadius,
          0,
          Math.PI * 2,
        );
        if (i < combo) {
          ctx.fillStyle = "#9b59b6";
          ctx.fill();
        } else {
          ctx.strokeStyle = "#555";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
  }
}

if (typeof window !== "undefined") {
  window.getMobUiOffsets = getMobUiOffsets;
  window.drawEntityHP = drawEntityHP;
}
