// mobUi.js - Monster Nameplates, Offsets & Health Bar UI Systems

const _DEFAULT_OFFSETS = Object.freeze({ hpOffset: 65, nameOffset: 85 });
const _MOB_OFFSETS_CACHE = {
  "ice_elemental": Object.freeze({ hpOffset: 85, nameOffset: 102 }),
  "magma_elemental": Object.freeze({ hpOffset: 85, nameOffset: 102 }),
  "boss_crystal_weaver": Object.freeze({ hpOffset: 130, nameOffset: 150 }),
  "boss_frost_giant": Object.freeze({ hpOffset: 165, nameOffset: 185 }),
  "jotunn": Object.freeze({ hpOffset: 165, nameOffset: 185 }),
  "boss_obsidian_golem": Object.freeze({ hpOffset: 145, nameOffset: 165 }),
  "boss_void_terror": Object.freeze({ hpOffset: 125, nameOffset: 145 }),
  "void_terror": Object.freeze({ hpOffset: 95, nameOffset: 115 }),
  "boss_void_devourer": Object.freeze({ hpOffset: 120, nameOffset: 140 }),
  "void_devourer": Object.freeze({ hpOffset: 92, nameOffset: 112 }),
  "void_null_gazer": Object.freeze({ hpOffset: 88, nameOffset: 108 }),
  "null_gazer": Object.freeze({ hpOffset: 88, nameOffset: 108 }),
  "void_spawn": Object.freeze({ hpOffset: 55, nameOffset: 72 }),
  "boss_singularity_colossus": Object.freeze({ hpOffset: 135, nameOffset: 155 }),
  "boss_abyssal_tidecaller": Object.freeze({ hpOffset: 140, nameOffset: 160 }),
  "elite_knight": Object.freeze({ hpOffset: 102, nameOffset: 122 }),
  "elite_archer": Object.freeze({ hpOffset: 102, nameOffset: 122 }),
  "player": Object.freeze({ hpOffset: 95, nameOffset: 115 }),
  "boss_goblin_king": Object.freeze({ hpOffset: 145, nameOffset: 165 }),
  "boss_goblin": Object.freeze({ hpOffset: 120, nameOffset: 140 }),
  "goblin_brute": Object.freeze({ hpOffset: 98, nameOffset: 116 }),
  "goblin_warrior": Object.freeze({ hpOffset: 95, nameOffset: 115 }),
  "goblin_archer": Object.freeze({ hpOffset: 82, nameOffset: 100 }),
  "goblin": Object.freeze({ hpOffset: 78, nameOffset: 96 }),
  "boss_slime": Object.freeze({ hpOffset: 135, nameOffset: 155 }),
  "boss_wolf": Object.freeze({ hpOffset: 135, nameOffset: 155 }),
  "slime_heavy": Object.freeze({ hpOffset: 88, nameOffset: 106 }),
  "wolf_alpha": Object.freeze({ hpOffset: 88, nameOffset: 106 }),
  "slime": Object.freeze({ hpOffset: 65, nameOffset: 82 }),
  "wolf": Object.freeze({ hpOffset: 75, nameOffset: 92 }),
  "corrupted_wolf": Object.freeze({ hpOffset: 75, nameOffset: 92 }),
  "dire_wolf": Object.freeze({ hpOffset: 75, nameOffset: 92 }),
  "plague_rat": Object.freeze({ hpOffset: 55, nameOffset: 72 }),
  "boss_plague_rat": Object.freeze({ hpOffset: 95, nameOffset: 115 }),
  "frost_troll": Object.freeze({ hpOffset: 72, nameOffset: 90 }),
  "glacial_troll": Object.freeze({ hpOffset: 86, nameOffset: 106 }),
  "crystal_troll": Object.freeze({ hpOffset: 78, nameOffset: 96 }),
  "boss_frost_troll": Object.freeze({ hpOffset: 155, nameOffset: 175 }),
  "skeleton": Object.freeze({ hpOffset: 64, nameOffset: 82 }),
  "skeleton_mestre": Object.freeze({ hpOffset: 68, nameOffset: 86 }),
  "skeleton_malandro": Object.freeze({ hpOffset: 60, nameOffset: 78 }),
  "elite_knight": Object.freeze({ hpOffset: 70, nameOffset: 88 }),
  "boss_samba_king": Object.freeze({ hpOffset: 96, nameOffset: 116 }),
  "giant_cave_spider": Object.freeze({ hpOffset: 82, nameOffset: 102 }),
  "spider": Object.freeze({ hpOffset: 80, nameOffset: 100 }),
  "boss_broodmother": Object.freeze({ hpOffset: 115, nameOffset: 135 }),
  "toxic_tarantula": Object.freeze({ hpOffset: 85, nameOffset: 105 }),
  "void_stalker": Object.freeze({ hpOffset: 82, nameOffset: 102 }),
};

export function getMobUiOffsets(ent) {
  if (!ent || !ent.type) return _DEFAULT_OFFSETS;
  const type = ent.type.toLowerCase();
  const direct = _MOB_OFFSETS_CACHE[type];
  if (direct) return direct;
  
  if (type.includes("colossus") || type.includes("singularity")) return _MOB_OFFSETS_CACHE["boss_singularity_colossus"];
  if (type.includes("terror") || type === "boss_void") return type.startsWith("boss") ? _MOB_OFFSETS_CACHE["boss_void_terror"] : _MOB_OFFSETS_CACHE["void_terror"];
  if (type.includes("devourer")) return type.startsWith("boss") ? _MOB_OFFSETS_CACHE["boss_void_devourer"] : _MOB_OFFSETS_CACHE["void_devourer"];
  if (type.includes("gazer")) return _MOB_OFFSETS_CACHE["void_null_gazer"];
  if (type.includes("spawn") || type.includes("larva")) return _MOB_OFFSETS_CACHE["void_spawn"];
  if (type.startsWith("boss_goblin")) return _MOB_OFFSETS_CACHE["boss_goblin"];
  if (type.includes("warrior")) return _MOB_OFFSETS_CACHE["goblin_warrior"];
  if (type.startsWith("goblin")) return _MOB_OFFSETS_CACHE["goblin"];
  if (type.startsWith("boss_samba") || type.includes("samba_king") || (type.includes("skeleton") && type.includes("boss"))) return _MOB_OFFSETS_CACHE["boss_samba_king"];
  if (type.includes("mestre") || type.includes("bateria")) return _MOB_OFFSETS_CACHE["skeleton_mestre"];
  if (type.includes("malandro")) return _MOB_OFFSETS_CACHE["skeleton_malandro"];
  if (type.includes("knight")) return _MOB_OFFSETS_CACHE["elite_knight"];
  if (type.includes("skeleton") || type.includes("samba") || type.includes("passista")) return _MOB_OFFSETS_CACHE["skeleton"];
  if (type.includes("broodmother") || (type.includes("spider") && type.includes("boss"))) return _MOB_OFFSETS_CACHE["boss_broodmother"];
  if (type.includes("tarantula")) return _MOB_OFFSETS_CACHE["toxic_tarantula"];
  if (type.includes("stalker")) return _MOB_OFFSETS_CACHE["void_stalker"];
  if (type.includes("spider") || type.includes("weaver")) return _MOB_OFFSETS_CACHE["giant_cave_spider"];
  if (type.includes("giant") || (type.includes("troll") && type.startsWith("boss"))) return _MOB_OFFSETS_CACHE["boss_frost_troll"];
  if (type.includes("glacial")) return _MOB_OFFSETS_CACHE["glacial_troll"];
  if (type.includes("crystal_troll")) return _MOB_OFFSETS_CACHE["crystal_troll"];
  if (type.includes("troll")) return _MOB_OFFSETS_CACHE["frost_troll"];
  
  return _DEFAULT_OFFSETS;
}

export function drawEntityHP(ctx, ent, screenX, screenY, offset = null) {
  if (typeof window !== "undefined" && typeof window.shouldShowMobHpBar === "function" && !window.shouldShowMobHpBar(ent)) return;
  if (!ent || !ent.maxHp) return;

  // Resolve entity UI offset so the life bar floats cleanly above towering headdresses and plumes
  let effectiveOffset = offset;
  if (effectiveOffset === null || effectiveOffset === undefined || effectiveOffset === 28) {
    const mobOffsets = getMobUiOffsets(ent);
    effectiveOffset = mobOffsets ? mobOffsets.hpOffset : 62;
  }
    if (ent.displayHp === undefined) ent.displayHp = ent.hp;
    // Smooth interpolator for health bar changes (reduces jumpiness)
    ent.displayHp += (ent.hp - ent.displayHp) * 0.15;

    const hpPercent = Math.max(0, ent.displayHp / ent.maxHp);
    const barW = 34;
    const barH = 5;
    const barX = screenX - barW / 2;
    const barY = screenY - effectiveOffset;

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

    const myId = (typeof GameState !== "undefined" && GameState) ? GameState.myId : (typeof window !== "undefined" && window.GameState ? window.GameState.myId : null);

    if (ent.type === "player" && myId && ent.id === myId) {
      ctx.fillStyle = hpPercent < 0.25 ? "#e67e22" : "#2ecc71";
    } else if (ent.isPet) {
      ctx.fillStyle = (myId && ent.ownerId === myId) ? "#3498db" : "#2980b9";
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
    if (ent.type === "player" && myId && ent.id === myId) {
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

    if (ent.class === "assassin" && myId && ent.id === myId) {
      const maxCombo = 5;
      const combo = ent.comboPoints || 0;
      const dotRadius = 1.5;
      const spacing = 5;
      const startX = screenX - (maxCombo * spacing) / 2 + spacing / 2;
      for (let i = 0; i < maxCombo; i++) {
        ctx.beginPath();
        ctx.arc(
          startX + i * spacing,
          screenY - effectiveOffset + 11,
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

if (typeof window !== "undefined") {
  window.getMobUiOffsets = getMobUiOffsets;
  window.drawEntityHP = drawEntityHP;
}
