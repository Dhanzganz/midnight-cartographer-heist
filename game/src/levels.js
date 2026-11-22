// levels.js — the floor plan of the Aurelian Museum, as data.
//
// One screen, three rooms in a row, read left to right:
//   THE GALLERY      display cases and planters, one guard, one camera
//   THE HALL OF MAPS long sightlines, two guards crossing, one camera
//   THE STAR VAULT   a locked door, the Cartographer's Star, one guard, one camera
//
// Coordinates are canvas pixels on a 1280x720 stage. The HUD band occupies the
// top 56 px; the playfield runs from y = 56 to y = 720. Every rectangle here
// is solid: it blocks both movement and sight, which is what makes the
// patrol routes and shadow corners readable at a glance.

export const STAGE = { w: 1280, h: 720, hudH: 56 };

/** Axis-aligned rectangle helper. */
const R = (x, y, w, h) => ({ x, y, w, h });

export const LEVEL = {
  name: 'THE AURELIAN MUSEUM',
  spawn: { x: 62, y: 648 },
  // The getaway van waits at the west loading door; it opens once every
  // piece of loot is in the bag.
  exit: R(14, 588, 66, 100),

  // Outer shell plus the two room dividers. Divider A (x 428..442) has an
  // open doorway at y 356..428. Divider B (x 838..852) is sealed by the
  // locked vault door at y 340..444 (see `door`).
  walls: [
    R(0, 56, 1280, 14), // north wall, under the HUD
    R(0, 706, 1280, 14), // south wall
    R(0, 56, 14, 664), // west wall
    R(1266, 56, 14, 664), // east wall
    R(428, 70, 14, 286), // divider A, north of the doorway
    R(428, 428, 14, 278), // divider A, south of the doorway
    R(838, 70, 14, 270), // divider B, north of the vault door
    R(838, 444, 14, 262), // divider B, south of the vault door
  ],

  // The one locked door in the game. Hold F beside it to pick the lock.
  door: { rect: R(838, 340, 14, 104), pickSeconds: 2.5 },

  // Furniture: display cases, marble pillars and planters. All solid.
  furniture: [
    // Gallery
    { kind: 'case', rect: R(84, 148, 116, 56) },
    { kind: 'case', rect: R(84, 462, 116, 56) },
    { kind: 'case', rect: R(238, 292, 56, 116) },
    { kind: 'pillar', rect: R(316, 148, 42, 42) },
    { kind: 'pillar', rect: R(316, 540, 42, 42) },
    { kind: 'planter', rect: R(238, 96, 128, 34) },
    { kind: 'planter', rect: R(120, 612, 128, 34) },
    // Hall of Maps
    { kind: 'case', rect: R(516, 168, 124, 56) },
    { kind: 'case', rect: R(648, 452, 124, 56) },
    { kind: 'pillar', rect: R(600, 316, 42, 42) },
    { kind: 'pillar', rect: R(726, 148, 42, 42) },
    { kind: 'planter', rect: R(492, 612, 128, 34) },
    { kind: 'planter', rect: R(690, 96, 128, 34) },
    // Star Vault
    { kind: 'case', rect: R(916, 168, 116, 56) },
    { kind: 'case', rect: R(916, 500, 116, 56) },
    { kind: 'pillar', rect: R(1136, 148, 42, 42) },
    { kind: 'pillar', rect: R(1136, 540, 42, 42) },
    { kind: 'planter', rect: R(1000, 96, 128, 34) },
    { kind: 'planter', rect: R(1048, 630, 128, 34) },
  ],

  // Deep-shadow patches: stand in one and neither guards nor cameras can
  // raise suspicion on you. Drawn as pools of darkness over the floor.
  shadows: [
    R(128, 596, 150, 62),
    R(452, 620, 150, 62),
    R(892, 104, 150, 62),
    R(1064, 596, 168, 62),
    R(238, 420, 90, 70),
    R(560, 540, 90, 70),
  ],

  // Carpets are pure decoration, but they mark the patrol lanes.
  carpets: [
    R(60, 236, 330, 120),
    R(478, 236, 330, 120),
    R(884, 236, 350, 120),
    R(884, 452, 350, 130),
  ],

  // Loot: name, floor position (just beside its display case), value.
  loot: [
    { id: 'opal', name: 'Opal Brooch', x: 232, y: 176, value: 250, r: 11 },
    { id: 'vase', name: 'Ming Vase', x: 232, y: 490, value: 300, r: 11 },
    { id: 'atlas', name: 'Lost Atlas', x: 330, y: 470, value: 400, r: 11 },
    { id: 'crown', name: 'Paper Crown', x: 676, y: 196, value: 450, r: 11 },
    { id: 'astrolabe', name: 'Brass Astrolabe', x: 612, y: 480, value: 500, r: 11 },
    { id: 'chart', name: 'Star Chart', x: 540, y: 360, value: 500, r: 11 },
    { id: 'tiara', name: 'Glass Tiara', x: 1064, y: 196, value: 600, r: 11 },
    { id: 'sextant', name: 'Ivory Sextant', x: 1064, y: 528, value: 650, r: 11 },
    { id: 'star', name: "Cartographer's Star", x: 1052, y: 356, value: 2000, r: 17 },
  ],

  // Guards patrol waypoint loops. `wait` is the pause at each corner.
  guards: [
    { name: 'Warden Ilya', loop: [[128, 258], [384, 258], [384, 640], [128, 640]], speed: 56, wait: 0.7 },
    { name: 'Warden Bram', loop: [[486, 140], [806, 140], [806, 646], [486, 646]], speed: 60, wait: 0.5 },
    { name: 'Warden Sef', loop: [[806, 420], [500, 420], [500, 250], [806, 250]], speed: 66, wait: 0.4 },
    { name: 'Warden Noor', loop: [[928, 646], [1216, 646], [1216, 140], [928, 140]], speed: 58, wait: 0.6 },
  ],

  // Cameras sit in the north corners and sweep a teal arc back and forth.
  // `base` is the centre direction (radians, 0 = east, PI/2 = south).
  cameras: [
    { x: 420, y: 84, base: Math.PI * 0.72, sweep: 0.55, period: 5.2 },
    { x: 830, y: 84, base: Math.PI * 0.30, sweep: 0.55, period: 6.4 },
    { x: 1252, y: 84, base: Math.PI * 0.78, sweep: 0.5, period: 4.6 },
  ],

  // The demo thief's route for the attract mode and the self-test: a lane
  // through all three rooms that passes every loot piece and the vault door.
  // It threads the divider-A doorway at (390, 392), pauses in front of the
  // vault door at (812, 392) to pick it, and ends on the getaway square.
  demoRoute: [
    [62, 648], [70, 676], [290, 676], [290, 490], [232, 490], [330, 470],
    [360, 250], [232, 176], [390, 392], [560, 392], [612, 480], [676, 250],
    [676, 196], [540, 360], [700, 560], [1000, 392], [1052, 356],
    [1064, 250], [1064, 196], [1064, 528], [1064, 392], [560, 392],
    [390, 392], [390, 560], [390, 676], [100, 676], [60, 640],
  ],
};

/** Every solid rectangle in the level (walls + furniture + a shut door). */
export function solids(doorOpen) {
  const list = [...LEVEL.walls, ...LEVEL.furniture.map((f) => f.rect)];
  if (!doorOpen) list.push(LEVEL.door.rect);
  return list;
}
