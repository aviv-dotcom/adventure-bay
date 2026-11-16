// Adds a version stamp to the script and style links in index.html (src/x.js?v=STAMP), so browsers load
// fresh files right after each deploy instead of a cached copy (GitHub Pages lets browsers cache for ~10 min).
// Run before committing a release: npm run stamp
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
const url = new URL('../index.html', import.meta.url);
let stamp;
try { stamp = execSync('git rev-parse --short HEAD').toString().trim() + '-' + Date.now().toString(36); }
catch { stamp = Date.now().toString(36); }
const html = readFileSync(url, 'utf8').replace(/(src\/[\w.]+\.(?:js|css))(\?v=[\w-]+)?"/g, `$1?v=${stamp}"`);
writeFileSync(url, html);
console.log('stamped index.html with', stamp);
