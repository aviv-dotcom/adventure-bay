// Builds src/nikud.js: a speech-only dictionary that adds Hebrew vowel marks (nikud) to every Hebrew word in the game.
// The screen keeps showing plain text; the speaker reads the vocalized form, so it pronounces words correctly.
// Words are vocalized in their sentence context by Dicta's Nakdan (https://nakdan.dicta.org.il), then the most common
// reading of each word is kept. Hand fixes go in FIX below and always win.
// Run after changing Hebrew text in src/game.js: npm run nikud
import { readFileSync, writeFileSync } from 'node:fs';

// Hand fixes (always win, also inside phrases). Mostly commands to the child, which the vocalizer tends to read
// as nouns or past tense, and "you" forms, which should be masculine (the game talks to a boy).
const FIX = {
  'גרור':'גְּרֹר', 'ספור':'סְפֹר', 'עזור':'עֲזֹר', 'עקוב':'עֲקֹב', 'תפוס':'תְּפֹס', 'אסוף':'אֱסֹף', 'נחש':'נַחֵשׁ', 'בחר':'בְּחַר',
  'הזז':'הָזֵז', 'מיין':'מַיֵּן', 'מצא':'מְצָא', 'בנה':'בְּנֵה', 'פעל':'פְּעַל', 'המשך':'הַמְשֵׁךְ', 'איית':'אַיֵּת', 'צייר':'צַיֵּר',
  'לחץ':'לְחַץ', 'לגדול':'לִגְדּוֹל', 'לאכול':'לֶאֱכֹל', 'לצחוק':'לִצְחֹק', 'לצעוק':'לִצְעֹק', 'לשמוע':'לִשְׁמֹעַ', 'לטעום':'לִטְעֹם',
  'לעזור':'לַעֲזֹר', 'לנשום':'לִנְשֹׁם', 'לזרוק':'לִזְרֹק', 'לישון':'לִישֹׁן', 'אספת':'אָסַפְתָּ', 'קיבלת':'קִבַּלְתָּ', 'הושלם':'הֻשְׁלַם',
  'אוצר':'אוֹצָר', 'שווה':'שָׁוֶה', 'אם':'אִם', 'לך':'לְךָ', 'המספר':'הַמִּסְפָּר', 'וואו':'וָאוּ', 'תוכי':'תֻּכִּי', 'שיתוף':'שִׁתּוּף',
  'איפוס':'אִפּוּס', 'נועה':'נוֹעָה', 'פינת':'פִּנַּת', 'בוקר':'בֹּקֶר', 'טוב':'טוֹב', 'לב':'לֵב', 'עכשיו':'עַכְשָׁיו', 'שלי':'שֶׁלִּי',
  'הממ':'הממ', 'אולי':'אוֹלִי',   // אולי is the owl guide's name (Ollie), not "maybe"
};
// Hand fixes for whole phrases, where the right reading depends on the sentence (the child's name is cut out of it).
const PHRASE_FIX = {
  'מצא את אוצר מפרץ ההרפתקאות!':'מָצָא אֶת אוֹצַר מִפְרַץ הַהַרְפַּתְקָאוֹת!',
  'קח את הזמן. אין לחץ.':'קַח אֶת הַזְּמַן. אֵין לַחַץ.',
};

const src = readFileSync(new URL('../src/game.js', import.meta.url), 'utf8');
const HEB = /[א-ת]/, MARK = /[֑-ׇ]/;
// Hebrew stretches of text inside the code (letters, vowel marks, spaces and sentence punctuation)
const frags = [...new Set((src.match(/[א-ת֑-ׇ][א-ת֑-ׇ ,.?!:;\-־…׳״]*/g) || [])
  .map(s => s.trim()).filter(s => HEB.test(s)))];

const isWord = w => w.length > 1 && !MARK.test(w) && !/[׳״'"]/.test(w);
const skel = w => w.replace(/[֑-ׇ]/g, '').replace(/[וי]/g, '');   // the vocalized spelling may drop a vav/yod (תוכי → תֻּכִּי)
const clean = v => v.replace(/\|/g, '').replace(/ֽ/g, '');   // drop prefix separators and meteg marks

async function nakdan(text){
  for(let tries = 0; tries < 3; tries++){
    try{
      const r = await fetch('https://nakdan-2-0.loadbalancer.dicta.org.il/api', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ task:'nakdan', genre:'modern', data:text, addmorph:false, keepqq:false, nodageshdefmem:false, patachma:false, keepmetagim:false }) });
      if(r.ok) return await r.json();
    }catch(e){}
    await new Promise(r => setTimeout(r, 1500));
  }
  throw new Error('Nakdan did not answer');
}

const votes = new Map();   // word → Map(vocalized → count)
const fragVoc = new Map(); // fragment → its vocalization in context
let batch = [], size = 0;
const batches = [];
for(const f of frags){ if(size + f.length > 2500){ batches.push(batch); batch = []; size = 0; } batch.push(f); size += f.length + 1; }
if(batch.length) batches.push(batch);

for(const [i, b] of batches.entries()){
  const out = await nakdan(b.join('\n'));
  let text = '';
  for(const tok of out){
    const v = (!tok.sep && isWord(tok.word) && tok.options?.length) ? clean(tok.options[0]) : '';
    const ok = v && MARK.test(v) && skel(v) === skel(tok.word);
    text += ok ? v : tok.word;
    if(!ok) continue;
    const m = votes.get(tok.word) || new Map(); m.set(v, (m.get(v) || 0) + 1); votes.set(tok.word, m);
  }
  const lines = text.split('\n');
  if(lines.length === b.length) b.forEach((f, j) => fragVoc.set(f, lines[j].trim()));
  else console.warn(`\nbatch ${i + 1}: line count changed, skipping phrase context`);
  process.stdout.write(`\rvocalized ${i + 1}/${batches.length} batches`);
  await new Promise(r => setTimeout(r, 300));
}

const dict = {};
for(const [w, m] of [...votes].sort((a, b) => a[0].localeCompare(b[0], 'he'))) dict[w] = [...m].sort((a, b) => b[1] - a[1])[0][0];
Object.assign(dict, FIX);
// Phrases whose in-context reading differs from the word-by-word one (e.g. "אוצר" vs "אוצר מפרץ…")
const byWord = s => s.replace(/[א-ת֑-ׇ]+/g, w => dict[w] || w);
const phrases = {};
for(const [f, v] of fragVoc){
  if(!/\s/.test(f)) continue;
  const ws = f.match(/[א-ת֑-ׇ]+/g), vs = v.match(/[א-ת֑-ׇ]+/g) || [];
  if(ws.length !== vs.length) continue;
  let k = 0;   // rebuild the phrase from the original text so punctuation and spacing match exactly
  const fixed = f.replace(/[א-ת֑-ׇ]+/g, w => { const c = vs[k++];
    if(MARK.test(w) || !isWord(w)) return w;
    if(FIX[w]) return FIX[w];
    return MARK.test(c) && skel(c) === skel(w) ? c : (dict[w] || w); });
  if(fixed !== byWord(f)) phrases[f] = fixed;
}
Object.assign(phrases, PHRASE_FIX);
writeFileSync(new URL('../src/nikud.js', import.meta.url),
`/* Adventure Bay: Hebrew vowel marks for the speaker only (generated by scripts/nikud.mjs: npm run nikud).
   The screen shows plain text; speech reads these vocalized forms.
   words: ${Object.keys(dict).length} single words; phrases: ${Object.keys(phrases).length} game phrases whose reading depends on context. */
window.NIKUD_HE = { words: ${JSON.stringify(dict)},
  phrases: ${JSON.stringify(phrases)} };
`);
console.log(`\nwrote src/nikud.js with ${Object.keys(dict).length} words and ${Object.keys(phrases).length} phrases`);
