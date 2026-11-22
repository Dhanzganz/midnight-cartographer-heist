// input.js — keyboard and mouse state, in one small object.
//
// main.js polls `keys` each frame for movement and reads edge-triggered
// presses from `pressed` for tools and menus, so a held key never fires a
// smoke bomb twice.

export const input = {
  keys: new Set(),
  pressed: new Set(),
  clicked: false,
  mouse: { x: 0, y: 0 },
};

const HANDLED = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space',
  'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'KeyF', 'KeyP', 'KeyM', 'KeyR', 'Enter', 'ShiftLeft', 'ShiftRight',
]);

/** Wire the listeners. `onGesture` runs on the first real interaction. */
export function bindInput(canvas, onGesture) {
  let gestured = false;
  const gesture = () => {
    if (!gestured) {
      gestured = true;
      onGesture();
    }
  };
  window.addEventListener('keydown', (ev) => {
    gesture();
    if (HANDLED.has(ev.code)) ev.preventDefault();
    if (!ev.repeat) input.pressed.add(ev.code);
    input.keys.add(ev.code);
  });
  window.addEventListener('keyup', (ev) => {
    input.keys.delete(ev.code);
  });
  window.addEventListener('blur', () => {
    input.keys.clear();
  });
  canvas.addEventListener('pointerdown', () => {
    gesture();
    input.clicked = true;
  });
  canvas.addEventListener('pointermove', (ev) => {
    const box = canvas.getBoundingClientRect();
    input.mouse.x = ((ev.clientX - box.left) / box.width) * canvas.width;
    input.mouse.y = ((ev.clientY - box.top) / box.height) * canvas.height;
  });
}

/** The movement vector the held keys ask for, normalised. */
export function moveVector() {
  let x = 0;
  let y = 0;
  if (input.keys.has('KeyA') || input.keys.has('ArrowLeft')) x -= 1;
  if (input.keys.has('KeyD') || input.keys.has('ArrowRight')) x += 1;
  if (input.keys.has('KeyW') || input.keys.has('ArrowUp')) y -= 1;
  if (input.keys.has('KeyS') || input.keys.has('ArrowDown')) y += 1;
  if (x !== 0 && y !== 0) {
    x *= Math.SQRT1_2;
    y *= Math.SQRT1_2;
  }
  return { x, y };
}

/** Was this code pressed since the last frame? Consumes the press. */
export function takePress(code) {
  if (input.pressed.has(code)) {
    input.pressed.delete(code);
    return true;
  }
  return false;
}

/** End-of-frame housekeeping: clear unconsumed presses and the click. */
export function endFrame() {
  input.pressed.clear();
  input.clicked = false;
}
