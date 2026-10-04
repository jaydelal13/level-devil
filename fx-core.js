"use strict";

const FableFX = (() => {
  const modes = {};
  let selected = null;

  return {
    register(name, config) { modes[name] = config; },
    select(name) { selected = modes[name] ? name : null; },
    get mode() { return selected; },
    allows(feature) { return !!(selected && modes[selected][feature]); },
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
    g.gain.setValueAtTime(vol, a.currentTime);
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
    gain.gain.value = vol;
    src.connect(filter).connect(gain).connect(a.destination);
    src.start();
  }

  return {
    init: ensure,
    jump: () => tone(330, 0.12, "square", 0.08, 260),
    land: () => noise(0.06, 0.10, 500),
    death: () => { noise(0.25, 0.3, 700); tone(160, 0.3, "sawtooth", 0.14, -110); },
    pop: () => tone(700, 0.07, "square", 0.09, 300),
    rumble: () => noise(0.35, 0.22, 220),
    slam: () => { noise(0.18, 0.3, 350); tone(90, 0.18, "sine", 0.2, -40); },
    poof: () => tone(500, 0.16, "triangle", 0.1, -320),
    bounce: () => tone(300, 0.18, "sine", 0.12, 520),
    zap: () => { tone(1200, 0.12, "sawtooth", 0.07, -700); noise(0.07, 0.1, 1600); },
    beep: () => tone(900, 0.04, "square", 0.04),
    win: () => { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.16, "square", 0.09), i * 90)); },
    laugh: () => { [300, 260, 300, 260, 220].forEach((f, i) => setTimeout(() => tone(f, 0.09, "sawtooth", 0.06), i * 110)); },
    toggleMute: () => { muted = !muted; return muted; },
    isMuted: () => muted,
  };
})();
