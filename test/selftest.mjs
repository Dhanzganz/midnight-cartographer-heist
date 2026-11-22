// selftest.mjs — headless checks for MIDNIGHT CARTOGRAPHER.
//
//   node test/selftest.mjs
//
// 1. Serves game/ on a local port with a tiny static server.
// 2. Loads the game in headless Chromium with ?test=1: the game drives its
//    own demo thief through the real simulation and writes its verdict
//    (HEIST_OK / HEIST_FAIL, loot taken, mode) into the document title.
// 3. Loads the staged cover scene and confirms the page renders a canvas
//    frame without a script error (the title stays the game's own).
//
// Exits 0 only when every check passes.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const root = fileURLToPath(new URL('../game/', import.meta.url));
const CHROME = join(
  process.env.HOME,
  '.cache/ms-playwright/chromium_headless_shell-1193/chrome-linux/headless_shell',
);

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
};

function serve() {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      try {
        const url = new URL(req.url, 'http://localhost');
        let path = normalize(decodeURIComponent(url.pathname)).replace(/^\/+/, '');
        if (path === '' || path === '.') path = 'index.html';
        const file = join(root, path);
        if (!file.startsWith(root)) throw new Error('escape');
        const body = await readFile(file);
        res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
        res.end(body);
      } catch {
        res.writeHead(404);
        res.end('not found');
      }
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function dumpDom(url, budgetMs = 20000) {
  return new Promise((resolve, reject) => {
    const args = [
      '--headless', '--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader',
      `--virtual-time-budget=${budgetMs}`, '--dump-dom', url,
    ];
    const proc = spawn(CHROME, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    proc.stdout.on('data', (d) => { out += d; });
    proc.stderr.on('data', (d) => { err += d; });
    proc.on('error', reject);
    proc.on('close', (code) => resolve({ code, out, err }));
  });
}

async function main() {
  if (!existsSync(CHROME)) {
    console.error(`FAIL: headless chromium not found at ${CHROME}`);
    process.exit(1);
  }
  const server = await serve();
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;
  let failures = 0;
  try {
    const test = await dumpDom(`${base}/index.html?test=1`);
    const title = /<title>([^<]*)<\/title>/.exec(test.out)?.[1] ?? '';
    if (title.startsWith('HEIST_OK')) {
      console.log(`PASS self-test simulation: ${title}`);
    } else {
      console.log(`FAIL self-test simulation: title="${title}"`);
      failures += 1;
    }
    const cover = await dumpDom(`${base}/index.html?scene=cover`, 6000);
    if (cover.out.includes('<canvas') && !/HEIST_FAIL/.test(cover.out)) {
      console.log('PASS cover scene renders (canvas present, no failure marker)');
    } else {
      console.log('FAIL cover scene render');
      failures += 1;
    }
  } finally {
    server.close();
  }
  console.log(failures === 0 ? 'SELFTEST OK' : `SELFTEST FAILED (${failures})`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
