// guards.js — patrol, suspicion and the chase.
//
// A guard walks its waypoint loop, pausing at each corner. When the thief is
// in its vision cone its suspicion fills (faster up close); at full suspicion
// it gives chase. Lose the guard — break line of sight, hide in shadow, drop
// a smoke bomb — and suspicion drains, the guard returns to its loop, and
// the run can still earn the ghost bonus if no chase ever started.

import { angleDelta, lineOfSight, moveCircle, visionStrength } from './vision.js';

export const GUARD_SIGHT = { range: 168, halfAngle: 0.46 };
export const CAMERA_SIGHT = { range: 185, halfAngle: 0.40 };

/** Fresh runtime state for one guard, from its level definition. */
export function makeGuard(def, index) {
  const [sx, sy] = def.loop[0];
  const [tx, ty] = def.loop[1];
  return {
    name: def.name,
    loop: def.loop,
    speed: def.speed,
    waitTime: def.wait,
    x: sx,
    y: sy,
    dir: Math.atan2(ty - sy, tx - sx),
    target: 1,
    wait: 0,
    suspicion: 0,
    mode: 'patrol', // patrol | chase | return
    seenAt: null, // last position the thief was spotted at
    bob: index * 1.7,
  };
}

/** Fresh runtime state for one camera. */
export function makeCamera(def) {
  return {
    x: def.x,
    y: def.y,
    base: def.base,
    sweep: def.sweep,
    period: def.period,
    phase: def.x * 0.013,
    dir: def.base,
    disabled: 0, // seconds of EMP downtime left
  };
}

/** The camera's current watcher shape, for vision tests and drawing. */
export function cameraWatcher(cam) {
  return { x: cam.x, y: cam.y, dir: cam.dir, range: CAMERA_SIGHT.range, halfAngle: CAMERA_SIGHT.halfAngle };
}

/** The guard's current watcher shape. */
export function guardWatcher(guard) {
  return { x: guard.x, y: guard.y, dir: guard.dir, range: GUARD_SIGHT.range, halfAngle: GUARD_SIGHT.halfAngle };
}

function steer(guard, tx, ty, speed, dt, solids) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const want = Math.atan2(dy, dx);
  guard.dir += Math.max(-3.4 * dt, Math.min(3.4 * dt, angleDelta(guard.dir, want)));
  const step = Math.min(dist, speed * dt);
  const moved = moveCircle(guard, 13, Math.cos(guard.dir) * step, Math.sin(guard.dir) * step, solids);
  guard.x = moved.x;
  guard.y = moved.y;
  return dist <= Math.max(4, speed * dt);
}

/**
 * Advance one guard by dt seconds.
 * ctx: { thief:{x,y,hidden}, solids, alarm } — returns events:
 * { spotted:boolean, chasing:boolean, caught:boolean }
 */
export function updateGuard(guard, dt, ctx) {
  const events = { spotted: false, chasing: guard.mode === 'chase', caught: false };
  const strength = ctx.thief.hidden
    ? 0
    : visionStrength(guardWatcher(guard), ctx.thief.x, ctx.thief.y, ctx.solids);

  if (strength > 0) {
    // Sneaking (ctx.exposure < 1) keeps suspicion climbing slowly: a low
    // profile is worth real time inside a cone.
    guard.suspicion = Math.min(1, guard.suspicion + strength * dt * 1.15 * (ctx.exposure ?? 1));
    guard.seenAt = { x: ctx.thief.x, y: ctx.thief.y };
    events.spotted = true;
    if (guard.suspicion >= 1) guard.mode = 'chase';
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - dt * 0.38);
    if (guard.mode === 'chase' && guard.suspicion <= 0.05) guard.mode = 'return';
  }

  if (guard.mode === 'chase') {
    events.chasing = true;
    const hunt = guard.seenAt ?? ctx.thief;
    steer(guard, hunt.x, hunt.y, 112, dt, ctx.solids);
    const d = Math.hypot(guard.x - ctx.thief.x, guard.y - ctx.thief.y);
    if (d < 26 && lineOfSight(guard.x, guard.y, ctx.thief.x, ctx.thief.y, ctx.solids)) {
      events.caught = true;
    }
  } else if (guard.mode === 'return') {
    const [tx, ty] = guard.loop[guard.target];
    if (steer(guard, tx, ty, guard.speed, dt, ctx.solids)) guard.mode = 'patrol';
  } else {
    if (guard.wait > 0) {
      guard.wait -= dt;
    } else {
      const [tx, ty] = guard.loop[guard.target];
      if (steer(guard, tx, ty, guard.speed, dt, ctx.solids)) {
        guard.target = (guard.target + 1) % guard.loop.length;
        guard.wait = guard.waitTime;
      }
    }
  }
  guard.bob += dt * (guard.mode === 'chase' ? 11 : 7);
  return events;
}

/** Advance one camera: sweep its arc, count down EMP downtime. */
export function updateCamera(cam, dt, elapsed) {
  if (cam.disabled > 0) {
    cam.disabled = Math.max(0, cam.disabled - dt);
    return;
  }
  cam.dir = cam.base + Math.sin(elapsed * ((Math.PI * 2) / cam.period) + cam.phase) * cam.sweep;
}

/** How strongly this camera sees the thief right now (0 when disabled/hidden). */
export function cameraSees(cam, thief, solids) {
  if (cam.disabled > 0 || thief.hidden) return 0;
  return visionStrength(cameraWatcher(cam), thief.x, thief.y, solids);
}
