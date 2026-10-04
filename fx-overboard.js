"use strict";

let overboardFlash = 0;
let overboardWin = 0;
let overboardStepTimer = 0;
let overboardStepSide = 0;

function overboardPoint(point) {
  return point || { x: 480, y: 270 };
}

function overboardDust(point, amount) {
  const p = overboardPoint(point);
  for (let i = 0; i < amount; i++) spawnDust(p.x, p.y, 3, theme.danger);
}

FableFX.register("overboard", {
  sound: true,
  particles: true,
  labels: true,
  transitions: true,
  winText: true,
  camera: true,
  deathMessage: () => DEATH_LINES[Math.floor(Math.random() * DEATH_LINES.length)],
  events: {
    step(point) {
      const p = overboardPoint(point);
      AudioFX.tone(overboardStepSide ? 145 : 115, 0.055, "square", 0.18, 35);
      overboardStepSide = 1 - overboardStepSide;
      spawnDust(p.x, p.y, 3, theme.accent);
    },
    jump(point) {
      AudioFX.tone(520, 0.16, "sawtooth", 0.2, 420);
      overboardDust(point, 4);
    },
    land(point) {
      AudioFX.noise(0.14, 0.26, 420);
      overboardDust(point, 6);
    },
    bounce(point) {
      AudioFX.tone(760, 0.24, "triangle", 0.22, 620);
      overboardDust(point, 8);
    },
    poof(point) {
      AudioFX.tone(980, 0.2, "sine", 0.18, -480);
      overboardDust(point, 5);
    },
    death(point) {
      const p = overboardPoint(point);
      overboardFlash = 1;
      for (let i = 0; i < 5; i++) spawnBlood(p.x, p.y);
      AudioFX.noise(0.45, 0.3, 520);
      AudioFX.tone(75, 0.5, "sawtooth", 0.28, -42);
      AudioFX.tone(190, 0.38, "square", 0.18, -130);
    },
    win() {
      overboardWin = 1;
      [220, 330, 440, 660, 880].forEach((frequency, index) => {
        setTimeout(() => AudioFX.tone(frequency, 0.32, "square", 0.28, 80), index * 100);
      });
      AudioFX.noise(0.7, 0.25, 1800);
    },
    slam() {
      AudioFX.tone(55, 0.28, "sine", 0.25, -25);
      overboardDust({ x: 480, y: 480 }, 4);
    },
  },
  update(dt, game) {
    overboardFlash = Math.max(0, overboardFlash - dt * 2.8);
    overboardWin = Math.max(0, overboardWin - dt * 1.6);

    if (game.state === "play" && game.player && game.player.grounded && Math.abs(game.player.vx) > 45) {
      overboardStepTimer -= dt;
      if (overboardStepTimer <= 0) {
        AudioFX.step({ x: game.player.x + game.player.w / 2, y: game.player.y + game.player.h });
        overboardStepTimer = 0.13;
      }
    } else {
      overboardStepTimer = 0;
    }

    if (overboardFlash > 0) game.shake(18, 0.08);
    if (overboardWin > 0) game.shake(7, 0.08);
  },
  drawOverlay(context, palette, width, height, font) {
    if (overboardFlash > 0) {
      context.save();
      context.globalAlpha = 0.28 * overboardFlash;
      context.fillStyle = palette.danger;
      context.fillRect(0, 0, width, height);
      context.restore();
    }

    if (overboardWin > 0) {
      context.save();
      context.globalAlpha = Math.min(1, overboardWin * 2);
      context.fillStyle = palette.accent;
      context.font = `900 76px ${font}`;
      context.textAlign = "center";
      context.fillText("YOU WIN!!!", width / 2, height / 2 + 28);
      context.restore();
    }
  },
});
