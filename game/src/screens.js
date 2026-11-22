// screens.js — the title card, the pause veil, and the two endings.
//
// The world keeps rendering behind every overlay, dimmed, so a screenshot
// of the title or the getaway still shows the museum the player robbed.

function veil(ctx, alpha) {
  ctx.fillStyle = `rgba(3,4,12,${alpha})`;
  ctx.fillRect(0, 0, 1280, 720);
}

function centre(ctx, text, y, font, colour) {
  ctx.fillStyle = colour;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.fillText(text, 640, y);
}

/** The title screen: name, pitch, controls, and the way in. */
export function drawTitle(ctx, S) {
  veil(ctx, 0.55);
  centre(ctx, 'M I D N I G H T', 208, '800 30px Georgia, serif', '#8fa0c8');
  centre(ctx, 'CARTOGRAPHER', 268, '800 58px Georgia, serif', '#ffd76a');
  centre(ctx, 'One thief. Three rooms. Nine treasures. Every guard awake.', 312, '600 17px system-ui, sans-serif', '#e8ecf8');
  centre(ctx, 'Cross the gallery, pick the vault door, take the Star — and reach the van unseen.', 340, '400 14px system-ui, sans-serif', '#aeb9d6');

  const lines = [
    ['MOVE', 'WASD or arrow keys'],
    ['Q', 'Smoke bomb — vanish from every cone'],
    ['E', 'EMP — kill the cameras for 5 seconds'],
    ['F', 'Hold beside the red door to pick its lock'],
    ['SHIFT', 'Sneak — slower, but suspicion barely climbs'],
    ['P / M', 'Pause · mute'],
  ];
  ctx.textAlign = 'left';
  lines.forEach(([key, what], i) => {
    const y = 396 + i * 30;
    ctx.fillStyle = 'rgba(11,14,34,0.85)';
    ctx.beginPath();
    ctx.roundRect(452, y - 17, 62, 22, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,215,106,0.6)';
    ctx.stroke();
    centre(ctx, key, y, '800 12px system-ui, sans-serif', '#ffd76a');
    ctx.fillStyle = '#dfe6f8';
    ctx.font = '500 14px system-ui, sans-serif';
    ctx.fillText(what, 532, y);
  });
  const pulse = 0.65 + 0.35 * Math.sin(S.t * 3.2);
  ctx.globalAlpha = pulse;
  centre(ctx, 'PRESS ENTER OR CLICK TO BEGIN THE HEIST', 612, '800 17px system-ui, sans-serif', '#8df0c8');
  ctx.globalAlpha = 1;
  void S;
}

/** The pause veil. */
export function drawPaused(ctx) {
  veil(ctx, 0.5);
  centre(ctx, 'PAUSED', 330, '800 44px Georgia, serif', '#f2f5ff');
  centre(ctx, 'The museum holds its breath. Press P to slip back in.', 372, '500 15px system-ui, sans-serif', '#aeb9d6');
}

function scoreLines(S) {
  const timeBonus = Math.max(0, 900 - Math.floor(S.elapsed) * 2);
  const ghostBonus = S.ghost ? 750 : 0;
  return [
    ['Loot taken', `$${S.banked.toLocaleString('en-US')}`],
    ['Time bonus', `$${timeBonus.toLocaleString('en-US')}`],
    ['Ghost bonus — never seen', S.ghost ? '$750' : '$0'],
    ['TOTAL SCORE', `$${(S.banked + timeBonus + ghostBonus).toLocaleString('en-US')}`],
  ];
}

/** The getaway: the van, the take, the score. */
export function drawWin(ctx, S) {
  veil(ctx, 0.45);
  centre(ctx, 'CLEAN GETAWAY', 218, '800 50px Georgia, serif', '#3dff9d');
  centre(ctx, S.ghost
    ? 'Nine treasures, zero witnesses. The museum will notice at dawn.'
    : 'Every treasure is in the van. The night keeps your secret.', 258, '500 16px system-ui, sans-serif', '#e8ecf8');
  scoreLines(S).forEach(([label, value], i) => {
    const y = 330 + i * 38;
    ctx.textAlign = 'right';
    ctx.fillStyle = i === 3 ? '#ffd76a' : '#aeb9d6';
    ctx.font = i === 3 ? '800 19px system-ui, sans-serif' : '500 15px system-ui, sans-serif';
    ctx.fillText(label, 620, y);
    ctx.textAlign = 'left';
    ctx.fillStyle = i === 3 ? '#ffd76a' : '#f2f5ff';
    ctx.fillText(value, 660, y);
  });
  centre(ctx, 'PRESS R TO ROB IT AGAIN', 540, '800 15px system-ui, sans-serif', '#8df0c8');
}

/** Caught: fair, final, and clear about what gave you away. */
export function drawCaught(ctx, S) {
  veil(ctx, 0.52);
  centre(ctx, 'CAUGHT', 226, '800 58px Georgia, serif', '#ff4757');
  centre(ctx, S.caughtBy === 'alarm'
    ? 'The alarm hit 100 and the shutters came down.'
    : `${S.caughtBy} closes a hand on your collar.`, 268, '500 16px system-ui, sans-serif', '#e8ecf8');
  centre(ctx, `You carried $${S.banked.toLocaleString('en-US')} of loot — and left with none of it.`, 306, '400 14px system-ui, sans-serif', '#aeb9d6');
  centre(ctx, 'Read the cones. Use the shadows. The Star is still in there.', 340, 'italic 400 14px Georgia, serif', '#8fa0c8');
  centre(ctx, 'PRESS R TO TRY AGAIN', 420, '800 15px system-ui, sans-serif', '#8df0c8');
}
