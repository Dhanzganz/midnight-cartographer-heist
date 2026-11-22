// MIDNIGHT CARTOGRAPHER — hand-in program (Node 22, standard library only).
//
// The game itself is this directory's game/ folder: plain static files a desktop
// browser loads fully offline (game/index.html plus its ES modules, no library,
// no network request). This program hands the entry in: it copies game/ and
// screenshots/ from beside this file into the output directory and writes
// dossier.json there with the vendored make.fun library, exactly as the kit's
// starter does.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Running it twice over the same repository writes byte-identical output:
// the copies are verbatim and buildDossier is a pure function of the tree.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Only ever create the output directory: in the grader /output is a mounted
// volume, so removing or recreating it would fail the run.
mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps: only text_max_bytes shapes the dossier bytes; the
// others refuse an entry the scorer would refuse anyway (more than 4
// screenshots or one over 256 KiB; more than 993 entries in game/ or 48 MiB
// of game files in all; a path under game/ over 1000 UTF-8 bytes).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
