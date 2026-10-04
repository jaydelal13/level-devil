"use strict";

const FableFX = (() => {
  const modes = {};
  let selected = null;

  return {
    register(name, config) { modes[name] = config; },
    select(name) { selected = modes[name] ? name : null; },
    get mode() { return selected; },
    allows(feature) { return !!(selected && modes[selected][feature]); },
    trigger(event, payload) {
      const handler = selected && modes[selected].events && modes[selected].events[event];
      if (handler) handler(payload);
    },
    update(dt, game) {
      const update = selected && modes[selected].update;
      if (update) update(dt, game);
    },
    drawOverlay(context, palette, width, height, font) {
      const draw = selected && modes[selected].drawOverlay;
      if (draw) draw(context, palette, width, height, font);
    },
    deathMessage() {
      return selected && modes[selected].deathMessage
        ? modes[selected].deathMessage()
        : "You Died";
    },
  };
})();

const AudioFX = (() => {
  let ac = null;
  let muted = false;
  const MAX_GAIN = 0.32;

  const ensure = () => {
    if (!FableFX.allows("sound")) return null;
    if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === "suspended") ac.resume();
    return ac;
  };

  function tone(freq, dur, type = "square", vol = 0.12, slide = 0) {
    if (muted) return;
    const a = ensure();
    if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, a.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), a.currentTime + dur);
    g.gain.setValueAtTime(Math.min(vol, MAX_GAIN), a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    o.connect(g).connect(a.destination);
    o.start();
    o.stop(a.currentTime + dur + 0.02);
  }

  function noise(dur, vol = 0.25, lp = 900) {
    if (muted) return;
    const a = ensure();
    if (!a) return;
    const len = Math.floor(a.sampleRate * dur);
    const buf = a.createBuffer(1, len, a.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = a.createBufferSource();
    src.buffer = buf;
    const filter = a.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = lp;
    const gain = a.createGain();
    gain.gain.value = Math.min(vol, MAX_GAIN);
    src.connect(filter).connect(gain).connect(a.destination);
    src.start();
  }

  return {
    init: ensure,
    jump: (point) => { tone(330, 0.12, "square", 0.08, 260); FableFX.trigger("jump", point); },
    land: (point) => { noise(0.06, 0.10, 500); FableFX.trigger("land", point); },
    death: (point) => { noise(0.25, 0.3, 700); tone(160, 0.3, "sawtooth", 0.14, -110); FableFX.trigger("death", point); },
    pop: () => { tone(700, 0.07, "square", 0.09, 300); FableFX.trigger("pop"); },
    rumble: () => { noise(0.35, 0.22, 220); FableFX.trigger("rumble"); },
    slam: () => { noise(0.18, 0.3, 350); tone(90, 0.18, "sine", 0.2, -40); FableFX.trigger("slam"); },
    poof: (point) => { tone(500, 0.16, "triangle", 0.1, -320); FableFX.trigger("poof", point); },
    bounce: (point) => { tone(300, 0.18, "sine", 0.12, 520); FableFX.trigger("bounce", point); },
    zap: () => { tone(1200, 0.12, "sawtooth", 0.07, -700); noise(0.07, 0.1, 1600); FableFX.trigger("zap"); },
    beep: () => { tone(900, 0.04, "square", 0.04); FableFX.trigger("beep"); },
    win: () => { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.16, "square", 0.09), i * 90)); FableFX.trigger("win"); },
    laugh: () => { [300, 260, 300, 260, 220].forEach((f, i) => setTimeout(() => tone(f, 0.09, "sawtooth", 0.06), i * 110)); FableFX.trigger("laugh"); },
    step: (point) => FableFX.trigger("step", point),
    tone,
    noise,
    toggleMute: () => { muted = !muted; return muted; },
    isMuted: () => muted,
  };
})();
