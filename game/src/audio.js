// audio.js — a pocket WebAudio synth: no files, no network, three sounds.
//
// Everything is wrapped so a browser that refuses an AudioContext (headless
// screenshots, autoplay policies) simply plays the game in silence. Sounds
// only start after the first real key press or click, per browser rules.

let ctx = null;
let muted = false;

function ensureCtx() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  } catch {
    ctx = null;
  }
  return ctx;
}

/** Call from a user gesture so later sounds are allowed to play. */
export function unlockAudio() {
  const c = ensureCtx();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function blip(freqA, freqB, seconds, type = 'sine', gain = 0.05) {
  if (muted) return;
  const c = ensureCtx();
  if (!c || c.state !== 'running') return;
  try {
    const osc = c.createOscillator();
    const amp = c.createGain();
    const t = c.currentTime;
    osc.type = type;
    osc.frequency.setValueAtTime(freqA, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqB), t + seconds);
    amp.gain.setValueAtTime(gain, t);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    osc.connect(amp).connect(c.destination);
    osc.start(t);
    osc.stop(t + seconds + 0.02);
  } catch {
    /* silence is always safe */
  }
}

/** A soft two-note chime when a piece of loot enters the bag. */
export function playLoot() {
  blip(880, 1320, 0.14, 'triangle', 0.06);
}

/** A low buzz while a guard's suspicion is climbing. */
export function playSpotted() {
  blip(196, 147, 0.18, 'sawtooth', 0.035);
}

/** The alarm sting: the run is over. */
export function playCaught() {
  blip(392, 98, 0.55, 'square', 0.06);
}

/** A glassy arpeggio for a clean getaway. */
export function playWin() {
  blip(660, 990, 0.3, 'triangle', 0.06);
  setTimeout(() => blip(880, 1320, 0.4, 'triangle', 0.05), 120);
}

/** A soft metallic click-clunk when the vault door gives way. */
export function playDoor() {
  blip(240, 120, 0.16, 'square', 0.045);
  setTimeout(() => blip(520, 780, 0.14, 'triangle', 0.05), 110);
}
