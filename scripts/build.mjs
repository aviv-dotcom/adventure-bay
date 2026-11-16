// Builds single-file versions of the game:
//   dist/index.html    – standalone page (everything inlined), e.g. for sharing as one file
//   dist/artifact.html – fragment for publishing as a claude.ai artifact (the artifact wrapper adds <head>/<body>)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const html = read('index.html');
const inline = s => s
  .replace(/<link rel="stylesheet" href="src\/styles\.css">/, () => `<style>\n${read('src/styles.css')}</style>`)
  .replace(/<script src="(src\/[\w.]+\.js)"><\/script>/g, (_, f) => `<script>\n${read(f).replace(/<\/script/gi, '<\\/script')}</script>`);
const full = inline(html);
mkdirSync(new URL('../dist/', import.meta.url), { recursive: true });
writeFileSync(new URL('../dist/index.html', import.meta.url), full);
const head = full.slice(full.indexOf('<title>'), full.indexOf('</head>'))
  .replace(/<meta name="(description|theme-color)"[^>]*>\n?/g, '');
const body = full.slice(full.indexOf('<body>') + 6, full.indexOf('</body>'));
writeFileSync(new URL('../dist/artifact.html', import.meta.url), head + body);
console.log(`built dist/index.html (${(full.length/1024).toFixed(0)} KB) and dist/artifact.html`);
