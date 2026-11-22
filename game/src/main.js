// main.js — MIDNIGHT CARTOGRAPHER: state, simulation, tools, demo, scenes.
//
// One thief, three rooms, nine treasures. This module owns the run: the
// player (or the demo driver) moves the thief, guards.js thinks for the
// wardens and cameras, vision.js decides who is seen, render.js draws it
// all, and screens.js covers the title and the endings.
//
// URL hooks, all optional:
//   ?scene=cover|chase|vault|win   stage a frozen, screenshot-ready moment
//   ?demo=1                        the demo thief plays the museum alone
//   ?test=1                        run a headless self-test, verdict in the title

import { LEVEL, STAGE, solids } from './levels.js';
import { makeRng, WORLD_SEED } from './random.js';
import { moveCircle, pointInRect } from './vision.js';
import {
  cameraSees, makeCamera, makeGuard, updateCamera, updateGuard,
} from './guards.js';
import { drawWorld } from './render.js';
import { drawCaught, drawPaused, drawTitle, drawWin } from './screens.js';
import { bindInput, endFrame, input, moveVector, takePress } from './input.js';
import { playCaught, playDoor, playLoot, playSpotted, playWin, toggleMute, unlockAudio } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(location.search);
const TEST_MODE = params.has('test');

const SMOKE = { duration: 3, cooldown: 9 };
const EMP = { duration: 5, cooldown: 13 };

/** A whole fresh run of the heist. */
function makeState() {
  const rng = makeRng(WORLD_SEED);
  const loot = LEVEL.loot.map((p) => ({ ...p, taken: false }));
  const sparkles = [];
  for (const piece of loot) {
    for (let i = 0; i < 3; i++) {
      sparkles.push({
        x: piece.x + rng.range(-16, 16),
        y: piece.y + rng.range(-8, 12),
        size: rng.range(1.1, 2.4),
        phase: rng.range(0, Math.PI * 2),
        speed: rng.range(1.2, 2.6),
        rise: rng.range(4, 9),
        alpha: rng.range(0.4, 0.95),
      });
    }
  }
  return {
    mode: 'title', // title | play | paused | won | caught
    t: 0,
    elapsed: 0,
    thief: { x: LEVEL.spawn.x, y: LEVEL.spawn.y, dir: 0, moving: false, hidden: false },
    guards: LEVEL.guards.map((g, i) => makeGuard(g, i)),
    cameras: LEVEL.cameras.map((c) => makeCamera(c)),
    loot,
    sparkles,
    alarm: 0,
    banked: 0,
    lootTaken: 0,
    lootTotal: loot.length,
    doorOpen: false,
    pickProgress: 0,
    picking: false,
    exitOpen: false,
    spotted: false,
    ghost: true,
    anyChase: false,
    smoke: 0,
    smokeCd: 0,
    empCd: 0,
    caughtBy: '',
    demo: false,
    demoStep: 0,
    staged: false,
    test: TEST_MODE,
    tools: {
      smoke: { ready: true, frac: 1 },
      emp: { ready: true, frac: 1 },
    },
  };
}

let S = makeState();

function resetRun() {
  const demo = S.demo;
  S = makeState();
  S.demo = demo;
  S.mode = 'play';
}

/** Is the thief standing in a pool of shadow right now? */
function inShadow(thief) {
  return LEVEL.shadows.some((s) => pointInRect(thief.x, thief.y, s, -4));
}

function refreshTools() {
  S.tools.smoke.ready = S.smokeCd <= 0;
  S.tools.smoke.frac = S.smokeCd <= 0 ? 1 : 1 - S.smokeCd / SMOKE.cooldown;
  S.tools.emp.ready = S.empCd <= 0;
  S.tools.emp.frac = S.empCd <= 0 ? 1 : 1 - S.empCd / EMP.cooldown;
}

/** The demo driver: walks the route, picks the vault door, takes the loot. */
function driveDemo(dt) {
  const th = S.thief;
  const route = LEVEL.demoRoute;
  if (S.demoStep >= route.length) {
    S.demoStep = 0;
    if (S.mode === 'play') resetRun();
    return;
  }
  let [tx, ty] = route[S.demoStep];
  // The vault door blocks the lane at x 838..852: stop in front of it and pick.
  if (!S.doorOpen && tx > 852 && th.x < 838) {
    tx = 812;
    ty = 392;
    if (Math.hypot(th.x - tx, th.y - ty) < 10) {
      S.picking = true;
      S.pickProgress += dt / LEVEL.door.pickSeconds;
      if (S.pickProgress >= 1) {
        S.doorOpen = true;
        S.pickProgress = 0;
        S.picking = false;
        playDoor();
      }
      return;
    }
  }
  const dx = tx - th.x;
  const dy = ty - th.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 9) {
    S.demoStep += 1;
    return;
  }
  th.dir = Math.atan2(dy, dx);
  th.moving = true;
  const speed = 128;
  const moved = moveCircle(th, 12, (dx / dist) * speed * dt, (dy / dist) * speed * dt, solids(S.doorOpen));
  th.x = moved.x;
  th.y = moved.y;
}

/** Advance the whole simulation by dt seconds (play modes only). */
function update(dt) {
  S.t += dt;
  S.elapsed += dt;
  const th = S.thief;
  const solid = solids(S.doorOpen);
  th.moving = false;
  S.picking = false;

  if (S.demo) {
    driveDemo(dt);
  } else {
    const mv = moveVector();
    const sneak = input.keys.has('ShiftLeft') || input.keys.has('ShiftRight');
    if (mv.x !== 0 || mv.y !== 0) {
      th.dir = Math.atan2(mv.y, mv.x);
      th.moving = true;
      const speed = sneak ? 92 : 158;
      const moved = moveCircle(th, 12, mv.x * speed * dt, mv.y * speed * dt, solid);
      th.x = moved.x;
      th.y = moved.y;
    }
    th.sneak = sneak;
    // Tools.
    if (takePress('KeyQ') && S.smokeCd <= 0) {
      S.smoke = SMOKE.duration;
      S.smokeCd = SMOKE.cooldown;
    }
    if (takePress('KeyE') && S.empCd <= 0) {
      S.empCd = EMP.cooldown;
      for (const cam of S.cameras) cam.disabled = EMP.duration;
    }
    // Lockpicking: hold F beside the shut vault door.
    const d = LEVEL.door.rect;
    const nearDoor = !S.doorOpen
      && th.x > d.x - 52 && th.x < d.x + d.w + 52
      && th.y > d.y - 26 && th.y < d.y + d.h + 26;
    if (nearDoor && input.keys.has('KeyF')) {
      S.picking = true;
      S.pickProgress += dt / LEVEL.door.pickSeconds;
      if (S.pickProgress >= 1) {
        S.doorOpen = true;
        S.pickProgress = 0;
        playDoor();
      }
    } else if (!S.demo) {
      S.pickProgress = Math.max(0, S.pickProgress - dt * 1.6);
    }
  }

  // Timers.
  if (S.smoke > 0) S.smoke = Math.max(0, S.smoke - dt);
  if (S.smokeCd > 0) S.smokeCd = Math.max(0, S.smokeCd - dt);
  if (S.empCd > 0) S.empCd = Math.max(0, S.empCd - dt);
  th.hidden = S.smoke > 0 || inShadow(th);

  // Cameras sweep and watch.
  let seen = 0;
  for (const cam of S.cameras) {
    updateCamera(cam, dt, S.t);
    seen = Math.max(seen, cameraSees(cam, th, solid));
  }

  // Guards patrol, suspect, chase.
  let guardSeen = 0;
  S.anyChase = false;
  for (const g of S.guards) {
    const before = g.suspicion;
    const ev = updateGuard(g, dt, {
      thief: { x: th.x, y: th.y, hidden: th.hidden },
      solids: solid,
      exposure: th.sneak ? 0.45 : 1,
    });
    if (ev.spotted) guardSeen = Math.max(guardSeen, g.suspicion);
    if (g.mode === 'chase') S.anyChase = true;
    if (ev.spotted && before < 0.25 && g.suspicion >= 0.25) playSpotted();
    if (ev.caught && !S.test) {
      S.mode = 'caught';
      S.caughtBy = g.name;
      playCaught();
    }
  }

  // The alarm: the loud sum of every eye on the thief.
  const exposure = th.sneak ? 0.45 : 1;
  const pressure = Math.max(seen * 1.25, guardSeen) * exposure;
  S.spotted = pressure > 0.02;
  if (S.spotted) {
    S.ghost = false;
    S.alarm += pressure * dt * 17;
  } else {
    S.alarm -= dt * 3.4;
  }
  if (S.test) S.alarm = Math.min(S.alarm, 88);
  S.alarm = Math.max(0, Math.min(100, S.alarm));
  if (S.alarm >= 100 && !S.test) {
    S.mode = 'caught';
    S.caughtBy = 'alarm';
    playCaught();
  }

  // Loot pickup.
  for (const piece of S.loot) {
    if (piece.taken) continue;
    if (Math.hypot(th.x - piece.x, th.y - piece.y) < piece.r + 15) {
      piece.taken = true;
      S.lootTaken += 1;
      S.banked += piece.value;
      playLoot();
    }
  }
  S.exitOpen = S.lootTaken >= S.lootTotal;

  // The getaway.
  if (S.exitOpen && pointInRect(th.x, th.y, LEVEL.exit)) {
    S.mode = 'won';
    playWin();
  }
  refreshTools();
}

/** Frozen, screenshot-ready stagings of real in-play moments. */
function stageScene(name) {
  S = makeState();
  S.mode = 'play';
  S.staged = true;
  const [g1, g2, g3, g4] = S.guards;
  if (name === 'cover') {
    // Mid-gallery crossing: thief in the open, a cone swinging onto him,
    // the gallery camera watching, loot lit, the alarm already warm.
    S.thief.x = 322;
    S.thief.y = 318;
    S.thief.dir = 0.2;
    g1.x = 196;
    g1.y = 246;
    g1.dir = 0.55;
    g1.suspicion = 0.45;
    g3.x = 560;
    g3.y = 415;
    g3.dir = Math.PI;
    S.cameras[0].dir = Math.PI * 0.78;
    S.alarm = 34;
    S.spotted = true;
    S.elapsed = 47;
  } else if (name === 'chase') {
    // The Hall of Maps, one second into a chase: alarm screaming.
    S.thief.x = 626;
    S.thief.y = 330;
    S.thief.dir = 0.5;
    g3.x = 528;
    g3.y = 296;
    g3.dir = 0.35;
    g3.mode = 'chase';
    g3.suspicion = 1;
    g3.seenAt = { x: S.thief.x, y: S.thief.y };
    g2.x = 716;
    g2.y = 168;
    g2.dir = 2.6;
    g2.suspicion = 0.3;
    S.cameras[1].dir = Math.PI * 0.42;
    S.alarm = 72;
    S.spotted = true;
    S.anyChase = true;
    S.ghost = false;
    S.elapsed = 96;
    S.loot[0].taken = true;
    S.loot[1].taken = true;
    S.lootTaken = 2;
    S.banked = 550;
  } else if (name === 'vault') {
    // The door is picked, the Star is one step away, a guard turns below.
    S.doorOpen = true;
    S.thief.x = 952;
    S.thief.y = 388;
    S.thief.dir = 0.3;
    g4.x = 1150;
    g4.y = 596;
    g4.dir = -2.2;
    g4.suspicion = 0.15;
    S.cameras[2].dir = Math.PI * 0.9;
    S.alarm = 18;
    S.elapsed = 163;
    for (let i = 0; i < 6; i++) S.loot[i].taken = true;
    S.lootTaken = 6;
    S.banked = 2400;
  } else if (name === 'win') {
    S.mode = 'won';
    S.doorOpen = true;
    S.thief.x = 52;
    S.thief.y = 640;
    for (const piece of S.loot) piece.taken = true;
    S.lootTaken = S.lootTotal;
    S.banked = 5650;
    S.exitOpen = true;
    S.elapsed = 214;
    S.ghost = true;
  }
  refreshTools();
}

/** One frame: simulate (unless staged or on a menu), then draw. */
function frame(dt) {
  if (S.staged) {
    S.t += dt;
    for (const cam of S.cameras) updateCamera(cam, dt, S.t);
    for (const g of S.guards) g.bob += dt * 7;
    refreshTools();
  } else if (S.mode === 'play') {
    update(dt);
  } else {
    S.t += dt;
    for (const cam of S.cameras) updateCamera(cam, dt, S.t);
    for (const g of S.guards) g.bob += dt * 5;
  }
  drawWorld(ctx, S);
  if (S.mode === 'title') drawTitle(ctx, S);
  if (S.mode === 'paused') drawPaused(ctx);
  if (S.mode === 'won') drawWin(ctx, S);
  if (S.mode === 'caught') drawCaught(ctx, S);
}

/** Menu keys and run restarts, once per frame. */
function handleMetaKeys() {
  if (takePress('KeyM')) toggleMute();
  if (S.mode === 'title' && (takePress('Enter') || input.clicked)) {
    S.mode = 'play';
  } else if (S.mode === 'play' && takePress('KeyP')) {
    S.mode = 'paused';
  } else if (S.mode === 'paused' && takePress('KeyP')) {
    S.mode = 'play';
  } else if ((S.mode === 'won' || S.mode === 'caught') && takePress('KeyR')) {
    resetRun();
  }
}

function runSelfTest() {
  // Drive the demo thief through the real simulation for up to 90 seconds
  // of game time and report through the document title, where the headless
  // test script reads it.
  try {
    S = makeState();
    S.mode = 'play';
    S.demo = true;
    const dt = 1 / 60;
    for (let i = 0; i < 60 * 90; i++) {
      update(dt);
      if (S.mode === 'won') break;
      if (S.mode !== 'play') break;
    }
    drawWorld(ctx, S);
    const ok = S.lootTaken >= 1;
    document.title = ok
      ? `HEIST_OK loot=${S.lootTaken} banked=${S.banked} mode=${S.mode}`
      : `HEIST_FAIL loot=${S.lootTaken} mode=${S.mode}`;
  } catch (err) {
    document.title = `HEIST_FAIL error=${err && err.message}`;
  }
}

function start() {
  bindInput(canvas, unlockAudio);
  const scene = params.get('scene');
  if (TEST_MODE) {
    runSelfTest();
    return;
  }
  if (scene) {
    stageScene(scene);
  } else if (params.has('demo')) {
    S.demo = true;
    S.mode = 'play';
  }
  window.__heist = S;
  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    handleMetaKeys();
    frame(dt);
    endFrame();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

start();
