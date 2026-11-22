// vision.js — the geometry of being seen.
//
// Guards and cameras share one question: is the thief inside my cone, close
// enough, and not hidden behind a wall? Everything here is a pure function
// of points and rectangles, so the self-test can drive it without a canvas.

/** Is point (px,py) inside rectangle r (optionally grown by `pad`)? */
export function pointInRect(px, py, r, pad = 0) {
  return px >= r.x - pad && px <= r.x + r.w + pad && py >= r.y - pad && py <= r.y + r.h + pad;
}

/** Does the circle at (cx,cy) with radius `rad` overlap rectangle r? */
export function circleHitsRect(cx, cy, rad, r) {
  const nx = Math.max(r.x, Math.min(cx, r.x + r.w));
  const ny = Math.max(r.y, Math.min(cy, r.y + r.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < rad * rad;
}

/** Do two segments (a-b) and (c-d) cross? */
function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
  const d2 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
  const d3 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const d4 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

/** Does segment (x1,y1)-(x2,y2) pass through rectangle r? */
export function segmentHitsRect(x1, y1, x2, y2, r) {
  if (pointInRect(x1, y1, r) || pointInRect(x2, y2, r)) return true;
  const x3 = r.x;
  const y3 = r.y;
  const x4 = r.x + r.w;
  const y4 = r.y + r.h;
  return (
    segmentsCross(x1, y1, x2, y2, x3, y3, x4, y3) ||
    segmentsCross(x1, y1, x2, y2, x4, y3, x4, y4) ||
    segmentsCross(x1, y1, x2, y2, x4, y4, x3, y4) ||
    segmentsCross(x1, y1, x2, y2, x3, y4, x3, y3)
  );
}

/** Clear line of sight between two points, against a list of solid rects. */
export function lineOfSight(x1, y1, x2, y2, solids) {
  for (const r of solids) {
    if (segmentHitsRect(x1, y1, x2, y2, r)) return false;
  }
  return true;
}

/** The smallest signed angle from `from` to `to`, in (-PI, PI]. */
export function angleDelta(from, to) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/**
 * The full "can this watcher see the thief" test.
 * watcher: {x, y, dir, range, halfAngle}. Returns 0 when unseen, else a
 * strength in (0, 1]: stronger when the thief is close and dead ahead.
 */
export function visionStrength(watcher, tx, ty, solids) {
  const dx = tx - watcher.x;
  const dy = ty - watcher.y;
  const dist = Math.hypot(dx, dy);
  if (dist > watcher.range || dist < 0.001) return dist < 0.001 ? 1 : 0;
  const ang = Math.atan2(dy, dx);
  if (Math.abs(angleDelta(watcher.dir, ang)) > watcher.halfAngle) return 0;
  if (!lineOfSight(watcher.x, watcher.y, tx, ty, solids)) return 0;
  const centred = 1 - Math.abs(angleDelta(watcher.dir, ang)) / watcher.halfAngle;
  const near = 1 - dist / watcher.range;
  return 0.35 + 0.65 * Math.max(centred, near);
}

/** The centre point of a rectangle. */
export function rectCentre(r) {
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

/** Move a circle through the world, sliding along solids axis by axis. */
export function moveCircle(pos, radius, dx, dy, solids) {
  let nx = pos.x + dx;
  for (const r of solids) {
    if (circleHitsRect(nx, pos.y, radius, r)) {
      nx = dx > 0 ? r.x - radius : r.x + r.w + radius;
    }
  }
  let ny = pos.y + dy;
  for (const r of solids) {
    if (circleHitsRect(nx, ny, radius, r)) {
      ny = dy > 0 ? r.y - radius : r.y + r.h + radius;
    }
  }
  return { x: nx, y: ny };
}
