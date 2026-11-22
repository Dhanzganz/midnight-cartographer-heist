// render.js — every pixel of MIDNIGHT CARTOGRAPHER.
//
// Neon-noir museum at night: deep blue-black tile floors, burgundy carpets,
// marble pillars, glass cases with gold inside, red vision cones with soft
// gradient falloff, teal camera arcs, pools of shadow to hide in, and a HUD
// whose alarm meter you can read from across the room. All of it is drawn
// from the level data each frame — no images, no network, nothing to load.

import { LEVEL, STAGE } from './levels.js';
import { CAMERA_SIGHT, GUARD_SIGHT } from './guards.js';

const TAU = Math.PI * 2;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** A soft-edged vision cone / camera arc with a radial gradient. */
function drawCone(ctx, x, y, dir, range, half, inner, outer, edge) {
  const grad = ctx.createRadialGradient(x, y, 8, x, y, range);
  grad.addColorStop(0, inner);
  grad.addColorStop(1, outer);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, dir - half, dir + half);
  ctx.closePath();
  ctx.fill();
  // Bright rim lines so the cone's sweep reads at thumbnail size.
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(dir - half) * range, y + Math.sin(dir - half) * range);
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(dir + half) * range, y + Math.sin(dir + half) * range);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, range, dir - half, dir + half);
  ctx.stroke();
}

function drawFloor(ctx, t) {
  ctx.fillStyle = '#0a0e22';
  ctx.fillRect(0, STAGE.hudH, STAGE.w, STAGE.h - STAGE.hudH);
  // Room tints: gallery indigo, hall steel blue, vault violet-black.
  ctx.fillStyle = 'rgba(64,72,180,0.10)';
  ctx.fillRect(14, 70, 414, 636);
  ctx.fillStyle = 'rgba(30,120,150,0.08)';
  ctx.fillRect(442, 70, 396, 636);
  ctx.fillStyle = 'rgba(120,50,170,0.10)';
  ctx.fillRect(852, 70, 414, 636);
  // Tile grid with a faint alternating checker.
  const tile = 40;
  ctx.strokeStyle = 'rgba(140,160,255,0.055)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 14; x <= 1266; x += tile) {
    ctx.moveTo(x + 0.5, 70);
    ctx.lineTo(x + 0.5, 706);
  }
  for (let y = 70; y <= 706; y += tile) {
    ctx.moveTo(14, y + 0.5);
    ctx.lineTo(1266, y + 0.5);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.022)';
  for (let gx = 0; gx < 32; gx++) {
    for (let gy = 0; gy < 16; gy++) {
      if ((gx + gy) % 2 === 0) ctx.fillRect(14 + gx * tile, 70 + gy * tile, tile, tile);
    }
  }
  // Moonlight shafts falling diagonally from the north windows.
  ctx.fillStyle = 'rgba(150,180,255,0.045)';
  for (const sx of [120, 560, 980]) {
    ctx.beginPath();
    ctx.moveTo(sx, 70);
    ctx.lineTo(sx + 90, 70);
    ctx.lineTo(sx + 210, 706);
    ctx.lineTo(sx + 120, 706);
    ctx.closePath();
    ctx.fill();
  }
  // Room names lettered into the floor.
  ctx.fillStyle = 'rgba(190,200,255,0.13)';
  ctx.font = '700 17px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('T H E   G A L L E R Y', 221, 700 - 14);
  ctx.fillText('H A L L   O F   M A P S', 640, 700 - 14);
  ctx.fillText('S T A R   V A U L T', 1059, 700 - 14);
  // Carpets with a gold border and a diamond lattice.
  for (const c of LEVEL.carpets) {
    ctx.fillStyle = '#3d1226';
    rr(ctx, c.x, c.y, c.w, c.h, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(230,190,90,0.5)';
    ctx.lineWidth = 2;
    rr(ctx, c.x + 5, c.y + 5, c.w - 10, c.h - 10, 4);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(230,190,90,0.13)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let dx = 30; dx < c.w - 10; dx += 44) {
      ctx.moveTo(c.x + dx, c.y + 12);
      ctx.lineTo(c.x + dx + 18, c.y + c.h / 2);
      ctx.lineTo(c.x + dx, c.y + c.h - 12);
    }
    ctx.stroke();
  }
  // Shadow pools to hide in.
  for (const s of LEVEL.shadows) {
    const g = ctx.createRadialGradient(
      s.x + s.w / 2, s.y + s.h / 2, 6,
      s.x + s.w / 2, s.y + s.h / 2, s.w * 0.62,
    );
    g.addColorStop(0, 'rgba(2,3,10,0.78)');
    g.addColorStop(1, 'rgba(2,3,10,0)');
    ctx.fillStyle = g;
    ctx.fillRect(s.x - 22, s.y - 22, s.w + 44, s.h + 44);
  }
  void t;
}

function drawFurniture(ctx, t) {
  for (const f of LEVEL.furniture) {
    const r = f.rect;
    if (f.kind === 'case') {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      rr(ctx, r.x + 4, r.y + 6, r.w, r.h, 6);
      ctx.fill();
      ctx.fillStyle = '#4a2f18';
      rr(ctx, r.x, r.y, r.w, r.h, 6);
      ctx.fill();
      const glass = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
      glass.addColorStop(0, 'rgba(170,220,255,0.34)');
      glass.addColorStop(0.5, 'rgba(120,180,240,0.13)');
      glass.addColorStop(1, 'rgba(170,220,255,0.26)');
      ctx.fillStyle = glass;
      rr(ctx, r.x + 6, r.y + 6, r.w - 12, r.h - 12, 4);
      ctx.fill();
      // The treasure inside glints through the glass.
      const pulse = 0.75 + 0.25 * Math.sin(t * 2.4 + r.x);
      ctx.fillStyle = `rgba(255,205,80,${0.85 * pulse})`;
      ctx.beginPath();
      ctx.arc(r.x + r.w / 2, r.y + r.h / 2, 7, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,230,150,0.9)';
      ctx.stroke();
    } else if (f.kind === 'pillar') {
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;
      const g = ctx.createRadialGradient(cx - 7, cy - 7, 3, cx, cy, 24);
      g.addColorStop(0, '#cfd6ea');
      g.addColorStop(0.6, '#8d97b5');
      g.addColorStop(1, '#525c78');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, 21, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(230,190,90,0.75)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 16.5, 0, TAU);
      ctx.stroke();
    } else {
      // Planter: dark soil, a burst of leaves.
      ctx.fillStyle = '#1d2b16';
      rr(ctx, r.x, r.y, r.w, r.h, 8);
      ctx.fill();
      ctx.strokeStyle = '#3f6030';
      ctx.lineWidth = 2;
      rr(ctx, r.x + 2, r.y + 2, r.w - 4, r.h - 4, 6);
      ctx.stroke();
      ctx.fillStyle = '#4d8a3a';
      for (let i = 0; i < 7; i++) {
        const lx = r.x + 14 + ((i * 53 + r.x) % Math.max(20, r.w - 26));
        const ly = r.y + 10 + ((i * 29) % Math.max(8, r.h - 18));
        ctx.beginPath();
        ctx.arc(lx, ly, 6.5, 0, TAU);
        ctx.fill();
      }
    }
  }
}

function drawWallsAndDoor(ctx, S) {
  for (const w of LEVEL.walls) {
    ctx.fillStyle = '#232c4e';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = '#39477a';
    if (w.w > w.h) ctx.fillRect(w.x, w.y, w.w, 3);
    else ctx.fillRect(w.x, w.y, 3, w.h);
    ctx.fillStyle = 'rgba(230,190,90,0.55)';
    if (w.w > w.h) ctx.fillRect(w.x, w.y + w.h - 2, w.w, 2);
    else ctx.fillRect(w.x + w.w - 2, w.y, 2, w.h);
  }
  // The locked vault door, or its open frame.
  const d = LEVEL.door.rect;
  if (!S.doorOpen) {
    const steel = ctx.createLinearGradient(d.x, d.y, d.x + d.w, d.y);
    steel.addColorStop(0, '#5a2430');
    steel.addColorStop(0.5, '#8c3548');
    steel.addColorStop(1, '#5a2430');
    ctx.fillStyle = steel;
    ctx.fillRect(d.x - 3, d.y, d.w + 6, d.h);
    ctx.strokeStyle = 'rgba(255,120,130,0.85)';
    ctx.lineWidth = 2;
    ctx.strokeRect(d.x - 3, d.y, d.w + 6, d.h);
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath();
    ctx.arc(d.x + d.w / 2, d.y + d.h / 2, 8, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#5a2430';
    ctx.beginPath();
    ctx.arc(d.x + d.w / 2, d.y + d.h / 2 - 2, 3, 0, TAU);
    ctx.fill();
    ctx.fillRect(d.x + d.w / 2 - 1.5, d.y + d.h / 2, 3, 6);
    ctx.save();
    ctx.translate(d.x + d.w / 2, d.y - 12);
    ctx.rotate(0);
    ctx.fillStyle = 'rgba(255,150,150,0.95)';
    ctx.font = '700 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LOCKED VAULT DOOR', 0, 0);
    ctx.restore();
    if (S.pickProgress > 0) {
      ctx.strokeStyle = '#ffd76a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(d.x + d.w / 2, d.y + d.h / 2, 17, -Math.PI / 2, -Math.PI / 2 + TAU * S.pickProgress);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = 'rgba(90,255,170,0.16)';
    ctx.fillRect(d.x - 3, d.y, d.w + 6, d.h);
    ctx.strokeStyle = 'rgba(90,255,170,0.5)';
    ctx.strokeRect(d.x - 3, d.y, d.w + 6, d.h);
  }
}

function drawExit(ctx, S) {
  const e = LEVEL.exit;
  const open = S.exitOpen;
  const glow = open ? 0.55 + 0.3 * Math.sin(S.t * 5) : 0.16;
  ctx.fillStyle = open ? `rgba(40,255,150,${glow})` : 'rgba(120,140,160,0.25)';
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = open ? '#3dff9d' : '#7c8aa0';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(e.x + 1, e.y + 1, e.w - 2, e.h - 2);
  ctx.fillStyle = open ? '#062b18' : '#dfe6f2';
  ctx.font = '800 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GETAWAY', e.x + e.w / 2, e.y + 30);
  ctx.font = '700 10px system-ui, sans-serif';
  ctx.fillText(open ? 'VAN WAITING' : 'ALL LOOT', e.x + e.w / 2, e.y + 48);
  if (open) {
    ctx.fillStyle = 'rgba(6,43,24,0.9)';
    for (let i = 0; i < 3; i++) {
      const yy = e.y + 58 + i * 13 + Math.sin(S.t * 5 + i) * 1.5;
      ctx.beginPath();
      ctx.moveTo(e.x + 18, yy);
      ctx.lineTo(e.x + e.w / 2, yy + 8);
      ctx.lineTo(e.x + e.w - 18, yy);
      ctx.lineTo(e.x + e.w - 18, yy + 4);
      ctx.lineTo(e.x + e.w / 2, yy + 12);
      ctx.lineTo(e.x + 18, yy + 4);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawLoot(ctx, S) {
  for (const piece of S.loot) {
    if (piece.taken) continue;
    const isStar = piece.id === 'star';
    const bobY = Math.sin(S.t * 2.2 + piece.x * 0.05) * 2.5;
    const y = piece.y + bobY;
    const glowR = piece.r + 15 + Math.sin(S.t * 3.1 + piece.y) * 3;
    const g = ctx.createRadialGradient(piece.x, y, 1, piece.x, y, glowR);
    g.addColorStop(0, 'rgba(255,214,90,0.55)');
    g.addColorStop(1, 'rgba(255,214,90,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(piece.x, y, glowR, 0, TAU);
    ctx.fill();
    // The gem itself: a rotated square with a bright heart.
    ctx.save();
    ctx.translate(piece.x, y);
    ctx.rotate(Math.PI / 4 + Math.sin(S.t * 1.4 + piece.x) * 0.12);
    const s = piece.r * 0.92;
    const gem = ctx.createLinearGradient(-s, -s, s, s);
    gem.addColorStop(0, '#ffe98a');
    gem.addColorStop(0.55, '#ffb92e');
    gem.addColorStop(1, '#e07f00');
    ctx.fillStyle = gem;
    ctx.fillRect(-s / 1.4, -s / 1.4, s * 1.42, s * 1.42);
    ctx.strokeStyle = '#fff3c4';
    ctx.lineWidth = 1.6;
    ctx.strokeRect(-s / 1.4, -s / 1.4, s * 1.42, s * 1.42);
    ctx.restore();
    ctx.fillStyle = '#fff8dc';
    ctx.beginPath();
    ctx.arc(piece.x, y, 2.6, 0, TAU);
    ctx.fill();
    if (isStar) {
      ctx.fillStyle = 'rgba(255,240,190,0.95)';
      ctx.font = '800 13px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText("THE CARTOGRAPHER'S STAR", piece.x, y - 30);
      ctx.font = '700 11px system-ui, sans-serif';
      ctx.fillText('$2,000', piece.x, y + 32);
    }
  }
  // Sparkles drifting off the untaken loot.
  ctx.fillStyle = 'rgba(255,240,180,0.9)';
  for (const p of S.sparkles) {
    const tw = 0.35 + 0.65 * Math.abs(Math.sin(S.t * p.speed + p.phase));
    ctx.globalAlpha = tw * p.alpha;
    ctx.beginPath();
    ctx.arc(p.x + Math.sin(S.t * 0.7 + p.phase) * 3, p.y - ((S.t * p.rise + p.phase * 7) % 26), p.size, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawCameras(ctx, S) {
  for (const cam of S.cameras) {
    if (cam.disabled <= 0) {
      drawCone(ctx, cam.x, cam.y, cam.dir, CAMERA_SIGHT.range, CAMERA_SIGHT.halfAngle,
        'rgba(45,230,210,0.42)', 'rgba(45,230,210,0.07)', 'rgba(45,230,210,0.55)');
    } else {
      drawCone(ctx, cam.x, cam.y, cam.dir, CAMERA_SIGHT.range * 0.4, CAMERA_SIGHT.halfAngle,
        'rgba(120,130,150,0.12)', 'rgba(120,130,150,0)', 'rgba(120,130,150,0.3)');
    }
    // Mount and body.
    ctx.fillStyle = '#1b2138';
    rr(ctx, cam.x - 13, cam.y - 13, 26, 20, 5);
    ctx.fill();
    ctx.strokeStyle = '#45e6d2';
    ctx.lineWidth = 1.6;
    rr(ctx, cam.x - 13, cam.y - 13, 26, 20, 5);
    ctx.stroke();
    const lx = cam.x + Math.cos(cam.dir) * 7;
    const ly = cam.y + Math.sin(cam.dir) * 7 + 2;
    ctx.fillStyle = cam.disabled > 0 ? '#5a6478' : '#0e2a28';
    ctx.beginPath();
    ctx.arc(lx, ly, 5.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = cam.disabled > 0 ? '#39404f' : '#45e6d2';
    ctx.beginPath();
    ctx.arc(lx, ly, 2.4, 0, TAU);
    ctx.fill();
    const blink = Math.sin(S.t * 4 + cam.x) > 0 ? '#ff4757' : '#57141c';
    ctx.fillStyle = cam.disabled > 0 ? '#39404f' : blink;
    ctx.beginPath();
    ctx.arc(cam.x + 9, cam.y - 9, 2.6, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(160,250,240,0.9)';
    ctx.font = '700 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(cam.disabled > 0 ? 'EMP' : 'CAM', cam.x, cam.y - 19);
  }
}

function drawGuards(ctx, S) {
  for (const g of S.guards) {
    const danger = g.mode === 'chase' ? 1 : g.suspicion;
    const inner = danger > 0.55
      ? `rgba(255,45,60,${0.48 + danger * 0.18})`
      : `rgba(255,130,45,${0.34 + danger * 0.2})`;
    const edge = danger > 0.55 ? 'rgba(255,60,70,0.65)' : 'rgba(255,150,60,0.55)';
    drawCone(ctx, g.x, g.y, g.dir, GUARD_SIGHT.range, GUARD_SIGHT.halfAngle, inner, 'rgba(255,70,30,0.09)', edge);
    // Body: dark uniform, shoulders, cap, a face turned toward `dir`.
    const bob = Math.sin(g.bob) * 1.3;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(g.x, g.y + 13, 13, 5, 0, 0, TAU);
    ctx.fill();
    const body = ctx.createRadialGradient(g.x - 4, g.y - 5 + bob, 2, g.x, g.y + bob, 15);
    body.addColorStop(0, g.mode === 'chase' ? '#a12633' : '#3a4a7d');
    body.addColorStop(1, g.mode === 'chase' ? '#5c1420' : '#1d2749');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(g.x, g.y + bob, 13, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(230,190,90,0.8)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    const fx = g.x + Math.cos(g.dir) * 6;
    const fy = g.y + bob + Math.sin(g.dir) * 6;
    ctx.fillStyle = '#e8c39a';
    ctx.beginPath();
    ctx.arc(fx, fy, 6, 0, TAU);
    ctx.fill();
    ctx.fillStyle = g.mode === 'chase' ? '#7d1622' : '#141c36';
    ctx.beginPath();
    ctx.arc(fx - Math.cos(g.dir) * 2, fy - Math.sin(g.dir) * 2 - 1.5, 6.4, Math.PI, TAU);
    ctx.fill();
    // Suspicion arc and alert marks.
    if (g.suspicion > 0.03) {
      ctx.strokeStyle = g.mode === 'chase' ? '#ff2d3f' : '#ffb02e';
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.arc(g.x, g.y + bob, 19, -Math.PI / 2, -Math.PI / 2 + TAU * g.suspicion);
      ctx.stroke();
      ctx.fillStyle = g.mode === 'chase' ? '#ff2d3f' : '#ffb02e';
      ctx.font = `900 ${g.mode === 'chase' ? 24 : 17}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(g.mode === 'chase' ? '!' : '?', g.x, g.y - 22 + bob);
    }
    ctx.fillStyle = 'rgba(220,228,255,0.75)';
    ctx.font = '600 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(g.name.toUpperCase(), g.x, g.y + 30);
  }
}

function drawThief(ctx, S) {
  const th = S.thief;
  const bob = th.moving ? Math.sin(S.t * 11) * 1.6 : Math.sin(S.t * 2.2) * 0.8;
  if (S.smoke > 0) {
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU + S.t * 0.9;
      const px = th.x + Math.cos(a) * (16 + Math.sin(S.t * 2 + i) * 5);
      const py = th.y + Math.sin(a) * 12 + bob;
      const g = ctx.createRadialGradient(px, py, 1, px, py, 15);
      g.addColorStop(0, 'rgba(200,210,230,0.5)');
      g.addColorStop(1, 'rgba(200,210,230,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, 15, 0, TAU);
      ctx.fill();
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(th.x, th.y + 13, 12, 4.6, 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = th.hidden ? 0.45 : 1;
  const cloak = ctx.createRadialGradient(th.x - 4, th.y - 6 + bob, 2, th.x, th.y + bob, 15);
  cloak.addColorStop(0, '#1f8a70');
  cloak.addColorStop(0.6, '#0e5c4a');
  cloak.addColorStop(1, '#07362b');
  ctx.fillStyle = cloak;
  ctx.beginPath();
  ctx.arc(th.x, th.y + bob, 12.5, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#ffd76a';
  ctx.lineWidth = 1.8;
  ctx.stroke();
  // Hood and gold mask stripe, turned toward travel direction.
  const fx = th.x + Math.cos(th.dir) * 5;
  const fy = th.y + bob + Math.sin(th.dir) * 5;
  ctx.fillStyle = '#0a2e26';
  ctx.beginPath();
  ctx.arc(fx, fy, 6.4, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#ffd76a';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(fx, fy, 6.4, th.dir - 0.7, th.dir + 0.7);
  ctx.stroke();
  // The loot bag on the back.
  ctx.fillStyle = '#6b4a1f';
  ctx.beginPath();
  ctx.arc(th.x - Math.cos(th.dir) * 9, th.y + bob - Math.sin(th.dir) * 9, 5, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
  // "YOU" tag so the thief is unmistakable in a screenshot.
  ctx.fillStyle = '#ffd76a';
  ctx.font = '800 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('YOU', th.x, th.y - 21 + bob);
  ctx.beginPath();
  ctx.moveTo(th.x - 4, th.y - 18 + bob);
  ctx.lineTo(th.x + 4, th.y - 18 + bob);
  ctx.lineTo(th.x, th.y - 13 + bob);
  ctx.closePath();
  ctx.fill();
  if (th.hidden && S.smoke <= 0) {
    ctx.fillStyle = 'rgba(180,220,255,0.95)';
    ctx.font = '700 10px system-ui, sans-serif';
    ctx.fillText('HIDDEN', th.x, th.y + 30);
  }
}

/** The full in-play frame: world first, then the HUD band. */
export function drawWorld(ctx, S) {
  drawFloor(ctx, S.t);
  drawExit(ctx, S);
  drawFurniture(ctx, S.t);
  drawLoot(ctx, S);
  drawCameras(ctx, S);
  drawGuards(ctx, S);
  drawWallsAndDoor(ctx, S);
  drawThief(ctx, S);
  // Night vignette, then a whisper of scanline grain.
  const v = ctx.createRadialGradient(640, 388, 260, 640, 388, 780);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,10,0.5)');
  ctx.fillStyle = v;
  ctx.fillRect(0, STAGE.hudH, STAGE.w, STAGE.h - STAGE.hudH);
  ctx.fillStyle = 'rgba(255,255,255,0.028)';
  for (let y = STAGE.hudH + 2; y < STAGE.h; y += 4) ctx.fillRect(0, y, STAGE.w, 1);
  // Alarm pressure closes the edges in red.
  if (S.alarm > 55 || S.anyChase) {
    const pulse = 0.10 + 0.07 * Math.sin(S.t * 6);
    const rg = ctx.createRadialGradient(640, 388, 300, 640, 388, 760);
    rg.addColorStop(0, 'rgba(255,0,30,0)');
    rg.addColorStop(1, `rgba(255,0,30,${pulse + (S.alarm - 55) / 450})`);
    ctx.fillStyle = rg;
    ctx.fillRect(0, STAGE.hudH, STAGE.w, STAGE.h - STAGE.hudH);
  }
  drawHud(ctx, S);
}

function toolChip(ctx, x, label, key, ready, frac, active) {
  const w = 118;
  ctx.fillStyle = active ? 'rgba(255,215,106,0.25)' : 'rgba(20,26,48,0.9)';
  rr(ctx, x, 9, w, 38, 8);
  ctx.fill();
  ctx.strokeStyle = ready ? '#ffd76a' : 'rgba(140,150,180,0.5)';
  ctx.lineWidth = 1.4;
  rr(ctx, x, 9, w, 38, 8);
  ctx.stroke();
  if (!ready) {
    ctx.fillStyle = 'rgba(90,110,160,0.45)';
    const hgt = 38 * (1 - frac);
    rr(ctx, x + 2, 9 + 38 - hgt - 2 + 2, w - 4, Math.max(0, hgt - 2), 6);
    ctx.fill();
  }
  ctx.fillStyle = '#0b0e22';
  rr(ctx, x + 7, 16, 24, 24, 6);
  ctx.fill();
  ctx.fillStyle = '#ffd76a';
  ctx.font = '800 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(key, x + 19, 33);
  ctx.fillStyle = ready ? '#f2f5ff' : '#9aa5c0';
  ctx.font = '700 11px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(label, x + 38, 26);
  ctx.font = '600 9px system-ui, sans-serif';
  ctx.fillStyle = ready ? '#8df0c8' : '#79839e';
  ctx.fillText(ready ? 'READY' : 'CHARGING', x + 38, 39);
}

function drawHud(ctx, S) {
  const grad = ctx.createLinearGradient(0, 0, 0, STAGE.hudH);
  grad.addColorStop(0, '#131a36');
  grad.addColorStop(1, '#0a0e22');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, STAGE.w, STAGE.hudH);
  ctx.fillStyle = 'rgba(230,190,90,0.65)';
  ctx.fillRect(0, STAGE.hudH - 2, STAGE.w, 2);
  ctx.fillStyle = '#ffd76a';
  ctx.font = '800 15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('MIDNIGHT CARTOGRAPHER', 16, 24);
  ctx.fillStyle = '#8fa0c8';
  ctx.font = '600 10px system-ui, sans-serif';
  ctx.fillText(LEVEL.name + '  ·  NIGHT SHIFT', 16, 41);

  // The alarm meter: the loudest thing on the band.
  const ax = 330;
  const aw = 300;
  ctx.fillStyle = '#f2f5ff';
  ctx.font = '800 12px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', ax, 20);
  ctx.fillStyle = S.alarm > 70 ? '#ff4757' : S.alarm > 35 ? '#ffb02e' : '#8df0c8';
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.round(S.alarm)} / 100`, ax + aw, 20);
  ctx.fillStyle = '#05070f';
  rr(ctx, ax, 26, aw, 16, 8);
  ctx.fill();
  const ag = ctx.createLinearGradient(ax, 0, ax + aw, 0);
  ag.addColorStop(0, '#2ee6a8');
  ag.addColorStop(0.55, '#ffb02e');
  ag.addColorStop(1, '#ff2d3f');
  ctx.fillStyle = ag;
  if (S.alarm > 0.4) {
    rr(ctx, ax + 2, 28, Math.max(6, (aw - 4) * (S.alarm / 100)), 12, 6);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(200,210,240,0.4)';
  rr(ctx, ax, 26, aw, 16, 8);
  ctx.stroke();
  for (let i = 1; i < 4; i++) {
    ctx.fillStyle = 'rgba(5,7,15,0.65)';
    ctx.fillRect(ax + (aw / 4) * i - 1, 27, 2, 14);
  }

  // Loot tally and take.
  ctx.fillStyle = '#ffd76a';
  ctx.font = '800 14px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`$${S.banked.toLocaleString('en-US')}`, 656, 24);
  ctx.fillStyle = '#8fa0c8';
  ctx.font = '600 10px system-ui, sans-serif';
  ctx.fillText(`LOOT ${S.lootTaken} / ${S.lootTotal}`, 656, 41);
  ctx.fillStyle = S.spotted ? '#ff8a5c' : '#8df0c8';
  ctx.font = '800 11px system-ui, sans-serif';
  ctx.fillText(S.spotted ? 'SPOTTED!' : S.ghost ? 'GHOST — UNSEEN' : 'SPOTTED EARLIER', 742, 24);
  ctx.fillStyle = '#8fa0c8';
  ctx.font = '600 10px system-ui, sans-serif';
  const mm = String(Math.floor(S.elapsed / 60)).padStart(2, '0');
  const ss = String(Math.floor(S.elapsed % 60)).padStart(2, '0');
  ctx.fillText(`TIME ${mm}:${ss}`, 742, 41);

  toolChip(ctx, 896, 'SMOKE', 'Q', S.tools.smoke.ready, S.tools.smoke.frac, S.smoke > 0);
  toolChip(ctx, 1022, 'EMP', 'E', S.tools.emp.ready, S.tools.emp.frac, S.cameras.some((c) => c.disabled > 0));
  toolChip(ctx, 1148, 'PICK', 'F', true, 1, S.pickProgress > 0);
}
