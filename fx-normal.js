"use strict";

FableFX.register("normal", {
  sound: true,
  particles: true,
  labels: true,
  transitions: true,
  winText: true,
  camera: true,
  deathMessage: () => DEATH_LINES[Math.floor(Math.random() * DEATH_LINES.length)],
});
