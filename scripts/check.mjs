// Syntax-checks the game's scripts: npm run check
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
let ok = true;
for (const f of ['src/config.js', 'src/analytics.js', 'src/gender.js', 'src/nikud.js', 'src/game.js']) {
  try { new Script(readFileSync(new URL('../' + f, import.meta.url), 'utf8'), { filename: f }); console.log('ok   ', f); }
  catch (e) { ok = false; console.error('ERROR', f, '\n', e.message); }
}
process.exit(ok ? 0 : 1);
