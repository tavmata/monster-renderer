# 2D Procedural Monster & Creature Renderer

High-performance, lineless procedural monster, mob, boss and creature renderer built for HTML5 Canvas.

## Features

- **Pure Lineless Digital Painting**: Zero black vector outlines, 100% volumetric gradients, organic specular glints, ambient occlusion, and rim lighting.
- **Organic Slime Entity Engine**:
  - Soft-body bounce, squash-and-stretch wobble physics, and dynamic eye tracking.
  - Multi-tier color gradients: Cave green, deep ocean blue, magma fire red, toxic bile, golden elite crowns.
  - Subterranean fluid puddles, floating bubbles, and crystalline core nuclei.
- **Canine & Wolf Anatomy**:
  - Quadrupedal digitigrade trot cycles, muscular chest curves, spine mantle fur shading, and twitching ears.
  - Directional muzzle tracking, snarling teeth, glowing feral eyes, and fluffy tail wag dynamics.
  - Physics-based severed limb death explosion with directional scatter trajectories.
- **8-Directional Segmented Frost Troll**:
  - Octagonal projection matrix (E, SE, S, SW, W, NW, N, NE) with dynamic Z-sorted dual arms.
  - Knuckle-walking gait, glacial ice horns, heavy stone club, and frost breath particle emissions.
  - 4-Phase Glacial Slam combat kinematic sequence (windup, lunge, shockwave slam, recovery).
- **8-Directional Segmented Goblin Infantry**:
  - Pointy ear oscillation, leather loincloths, jagged iron daggers, round wooden bucklers.
  - Multi-tier variants: Scouts, warriors, shamans, and golden-armored goblin kings.
- **Generic & Undead Mob Kinematics**:
  - Skeletal warriors with rattling ribcages, bone weapons, and glowing skull eye sockets.
  - Multi-legged arachnid / spider procedural leg stepping and venom fangs.
  - Shadow cultists, void horrors, and towering monolithic bosses.
- **Mob UI & Health Nameplates**:
  - Lineless dark slate health bars, golden elite frames, level badges, and cast progression indicators.

## Standalone Preview Studio

Open `index.html` in any browser or launch Vite with:

```bash
npm install
npm run dev
```

Visit `http://localhost:3002` to access the interactive 60 FPS monster audition studio.

## Installation & Usage

### Installing via GitHub

```bash
npm install github:tavmata/monster-renderer
```

### Basic Usage

```javascript
import { drawMonster, drawEntityHP } from '@2mmorpg/monster-renderer';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const wolf = {
  id: 'wolf_101',
  type: 'wolf',
  hp: 75,
  maxHp: 100,
  facingAngle: Math.PI / 4,
  moving: true
};

function renderLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw procedural monster
  drawMonster(ctx, 250, 250, wolf);

  // Draw monster health bar
  drawEntityHP(ctx, wolf, 250, 250);

  requestAnimationFrame(renderLoop);
}

renderLoop();
```

## Architecture

```
monster-renderer/
├── index.html          # Interactive visual audition studio
├── package.json        # NPM package specification
├── README.md           # Documentation
├── vite.config.js      # Vite dev server configuration (Port 3002)
└── src/
    ├── index.js        # Main module exports
    ├── helpers.js      # Zero-allocation hashing & safe radial gradients
    ├── slimes.js       # Soft-body organic slime renderer
    ├── wolves.js       # Wolf anatomy, fur shaders & limb explosion
    ├── trolls.js       # 8-Directional Frost Troll & glacial slam
    ├── goblins.js      # 8-Directional Goblin infantry & gear
    ├── genericMobs.js  # Skeletons, spiders, bosses & undead
    ├── mobUi.js        # Nameplate offsets, level badges & health bars
    └── monster.js      # Universal master monster dispatcher
```

## License

MIT
