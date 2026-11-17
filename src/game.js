/* Adventure Bay — game logic (worlds, question makers, adaptive learning, UI). Analytics calls go through window.BayAnalytics (src/analytics.js). */
(function(){
/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const rnd = (a,b) => a + Math.floor(Math.random()*(b-a+1));
const pick = arr => arr[Math.floor(Math.random()*arr.length)];
const shuffle = arr => { const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
const esc = s => String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const store = {
  get(k,d){ try{ const v=localStorage.getItem('bay2_'+k); return v==null?d:JSON.parse(v);}catch(e){return d;} },
  set(k,v){ try{ localStorage.setItem('bay2_'+k,JSON.stringify(v)); }catch(e){} }
};

/* ---------- one icon set for the controls (line icons in the ink colour) ---------- */
const svgI = d => `<svg viewBox="0 0 24 24" class="ico" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICON = {
  back: svgI('<path d="M15 5l-7 7 7 7"/>'),
  globe: svgI('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18"/>'),
  soundOn: svgI('<path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12"/>'),
  soundOff: svgI('<path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6"/>'),
  full: svgI('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
  play: '<svg viewBox="0 0 24 24" class="ico" aria-hidden="true"><path d="M8 5.5v13a1 1 0 001.5.86l10.5-6.5a1 1 0 000-1.72L9.5 4.64A1 1 0 008 5.5z" fill="currentColor"/></svg>',
  undo: svgI('<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4 3.5V9h5.5"/>'),
  lock: svgI('<rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 018 0v3"/>')
};
/* Older systems (e.g. Windows 10) lack newer emoji such as 🪜 🪢 🪥 and draw them blank. Load Google's full colour emoji font there,
   so every icon shows and looks the same; Apple devices already have them all. */
if(!/iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)){ try{ const l=document.createElement('link'); l.rel='stylesheet';
  l.href='https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=swap'; document.head.appendChild(l); }catch(e){} }

/* ---------- language ---------- */
let lang = store.get('lang','en');
const names = store.get('names',{en:'',he:''});   // no built-in name: a parent types the child's name on first launch
/* the child's name in this language, else the name typed in the other language, else a friendly placeholder */
const nm = () => names[lang] || names[lang==='he'?'en':'he'] || (lang==='he'?'חוקר':'Explorer');
const he = () => lang==='he';
const T = {
  en:{ title:'Adventure Bay', invite:n=>`Coco the parrot invites <b id="hn">${n}</b> on an adventure!`,
       math:'Numbers Bay', letters:'Letters Island', science:'Discoveries Reef', logic:'Puzzles Port', feelings:'Feelings Lagoon', reclap:["Let's drum it again!",'Listen and drum once more!'],
       retrace:'Keep going, cover the whole letter!', offtrace:'Try to stay on the letter!', hero:"Hero's name:",
       age:'Age', done:'Done!', locked:'🔒 Locked', go:"Let's go!", again:'🔁 Play again', next:'Next stop →', redo:'🔁 Again', toMap:'🗺️ Back to map',
       up:a=>`Next level: age ${a} →`, mapStart:n=>`Hi ${n}! Let's go on an adventure around the bay. Tap the first stop!`,
       mapNext:(n,s)=>`Great job ${n}! Next stop: ${s}.`, mapAll:n=>`${n}, you found the treasure! You can play again.`,
       cheer:['Another one!',"You're doing great!",'Keep going!','Go, hero!'], praise:['Great job','Awesome','You got it','Super','Wow, well done'],
       oops:['Almost! Try again','Oops, one more try',"That's okay, try again"], sticker:(n,s)=>`You did it, ${n}! You earned the ${s} sticker!`,
       treasure:n=>`Hooray! ${n} found the Adventure Bay treasure!`, collected:(s,a)=>`You collected ${s} stars at age ${a}`,
       langBtn:'עברית', back:'⬅️', check:'✓ Done!', recount:["Let's count again!",'Hmm, count once more!'], basket:'basket' },
  he:{ title:'מפרץ ההרפתקאות', invite:n=>`קוקו התוכי מזמין את <b id="hn">${n}</b> להרפתקה!`,
       math:'מפרץ המספרים', letters:'אי האותיות', science:'שונית התגליות', logic:'נמל החידות', feelings:'לגונת הרגשות', reclap:['בוא נתופף שוב!','הקשב ותופף עוד פעם!'],
       retrace:'המשך, כסה את כל האות!', offtrace:'נסה להישאר על האות!', hero:'שם הגיבור:',
       age:'גיל', done:'הושלם!', locked:'🔒 נעול', go:'יוצאים לדרך!', again:'🔁 משחק חדש', next:'לתחנה הבאה ←', redo:'🔁 שוב', toMap:'🗺️ למפה',
       up:a=>`לשלב הבא: גיל ${a} ←`, mapStart:n=>`שלום ${n}! בוא נצא להרפתקה במפרץ. לחץ על התחנה הראשונה!`,
       mapNext:(n,s)=>`כל הכבוד ${n}! ממשיכים ל${s}.`, mapAll:n=>`${n}, מצאת את האוצר! אפשר לשחק שוב.`,
       cheer:['עוד שאלה!','אתה מצליח!','ממשיכים!','קדימה גיבור!'], praise:['כל הכבוד','מעולה','אלוף','נהדר','וואו, יפה מאוד'],
       oops:['כמעט! נסה שוב','אופס, עוד ניסיון','לא נורא, נסה שוב'], sticker:(n,s)=>`${n}, הצלחת! קיבלת מדבקה של ${s}!`,
       treasure:n=>`הידד! ${n} מצא את אוצר מפרץ ההרפתקאות!`, collected:(s,a)=>`אספת ${s} כוכבים בגיל ${a}`,
       langBtn:'English', back:'➡️', check:'✓ סיימתי!', recount:['בוא נספור שוב!','הממ, נספור עוד פעם!'], basket:'סל' }
};
const t = () => T[lang];
function applyLang(){
  document.documentElement.lang = lang; document.documentElement.dir = he()?'rtl':'ltr';
  document.title = t().title;
}

/* ---------- sound + speech ---------- */
let actx=null;
function tone(freqs,dur=.12){
  try{ actx = actx || new (window.AudioContext||window.webkitAudioContext)();
    if(actx.state==='suspended') actx.resume();
    freqs.forEach((f,i)=>{ const o=actx.createOscillator(), g=actx.createGain(); o.type='triangle'; o.frequency.value=f;
      const tt=actx.currentTime+i*dur; g.gain.setValueAtTime(.0001,tt); g.gain.exponentialRampToValueAtTime(.25,tt+.02); g.gain.exponentialRampToValueAtTime(.0001,tt+dur*1.6);
      o.connect(g).connect(actx.destination); o.start(tt); o.stop(tt+dur*1.8); });
  }catch(e){}
}
const sfx = { good:()=>tone([660,880,1100]), bad:()=>tone([300,240],.16), win:()=>tone([523,659,784,1046,1318],.13) };
/* ---------- voice: pick the best installed voice, keep Hebrew vowel marks, slow down short items ---------- */
let voiceOn = store.get('voice', true);
let voiceSpeed = store.get('vspeed', .8);             // 0.8 = slow (default), 1 = normal (Parents' Corner)
let voicePref = store.get('vpref', {en:'', he:''});    // a voice the parent picked, by name
let voices = {en:null, he:null}, voiceLists = {en:[], he:[]}, voicesLoaded = false;
const scoreVoice = v => { const n=v.name; let s=0;
  if(/google us english/i.test(n)) s+=200;   // first choice for English when the device has it
  if(/natural|neural|online|premium|enhanced|wavenet|siri/i.test(n)) s+=50;   // the newer, human-sounding voices
  if(/google/i.test(n)) s+=30;
  if(/carmit|hila|avri|asaf|samantha|aria|jenny|ava|allison|karen|serena|libby|sonia|zira|female/i.test(n)) s+=20;
  if(/compact|espeak|eloquence|novelty/i.test(n)) s-=40;
  return s; };
function loadVoices(){ try{ const vs=speechSynthesis.getVoices(); if(vs.length) voicesLoaded=true;
  voiceLists.he = vs.filter(v=>/^(he|iw)/i.test(v.lang)).sort((a,b)=>scoreVoice(b)-scoreVoice(a));
  voiceLists.en = vs.filter(v=>/^en/i.test(v.lang)).sort((a,b)=>(scoreVoice(b)-scoreVoice(a)) || (/^en-(US|GB)/i.test(b.lang)-/^en-(US|GB)/i.test(a.lang)));
  for(const l of ['en','he']) voices[l] = voiceLists[l].find(v=>v.name===voicePref[l]) || voiceLists[l][0] || null;
}catch(e){} }
try{ loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }catch(e){}
/* Hebrew nikud for the speaker only (src/nikud.js, built by scripts/nikud.mjs): the screen stays plain, speech gets vowel marks */
const NIKUD = window.NIKUD_HE || {words:{}, phrases:{}};
const NIKUD_PHRASES = Object.keys(NIKUD.phrases).sort((a,b)=>b.length-a.length);
function addNikud(s){
  for(const p of NIKUD_PHRASES) if(s.includes(p)) s = s.split(p).join(NIKUD.phrases[p]);
  return s.replace(/[א-ת֑-ׇ]+/g, w => /[֑-ׇ]/.test(w) ? w : (NIKUD.words[w] || w));
}
function prepSpeech(text, L){
  const H = L==='he';
  let s = String(text).replace(/[️‍⃣]/g,'');   // emoji modifiers
  if(H) s = addNikud(s);
  s = s
    .replace(/−/g, H?' פחות ':' minus ').replace(/\+/g, H?' ועוד ':' plus ').replace(/×/g, H?' כפול ':' times ').replace(/=/g, H?' שווה ':' equals ')
    .replace(/(\d+):(30|00)/g, (m,h,mm)=> H ? `${h}${mm==='30'?' וחצי':''}` : `${h} ${mm==='30'?'thirty':"o'clock"}`)
    .replace(/[^\p{L}\p{M}\p{N}\s,.?!'׳״-]/gu,' ');      // keep \p{M}: Hebrew vowel marks (niqqud) guide pronunciation
  if(H) s = s.replace(/(\p{L}\p{M}*)-(\d)/gu,'$1 $2');    // "מ-3" → "מ 3"
  return s.replace(/\s+/g,' ').trim();
}
let noVoiceWarned = false;
function toast(msg){ let el=document.getElementById('toast'); if(!el){ el=document.createElement('div'); el.id='toast'; el.className='toast'; el.setAttribute('role','status'); document.body.appendChild(el); }
  el.textContent=msg; el.classList.add('show'); clearTimeout(toast._t); toast._t=setTimeout(()=>el.classList.remove('show'),4500); }
function speak(text, L=lang){
  if(!voiceOn) return;
  try{
    speechSynthesis.cancel();
    if(voicesLoaded && !voices[L]){   // no voice for this language: stay quiet rather than mangle it with another language's voice
      if(!noVoiceWarned){ noVoiceWarned=true; toast(L==='he' ? 'אין קול עברי בטאבלט הזה. ראו "פינת ההורים" כדי להתקין.' : "No English voice on this device. See the Parents' Corner."); }
      return; }
    const clean = prepSpeech(text, L); if(!clean) return;
    const parts = clean.split(/(?<=[.?!])\s+/).filter(Boolean);   // short utterances: avoids cut-offs in long sentences
    parts.forEach(p=>{ const u=new SpeechSynthesisUtterance(p); u.lang = L==='he'?'he-IL':'en-US'; if(voices[L]) u.voice=voices[L];
      const short = p.replace(/[^\p{L}]/gu,'').length <= 8;          // single letters, syllables, short words: say them slowly
      u.rate = (L==='he'?.9:.92) * voiceSpeed * (short?.75:1); u.pitch = 1.05; speechSynthesis.speak(u); });
  }catch(e){}
}

/* ---------- animals ---------- */
const MOTION = {'🐢':'waddle','🦀':'scuttle','🐚':'wiggle','⛵':'rock','🐟':'swim','🎈':'float','🥥':'wiggle','🍌':'wiggle','🐒':'hop',
  '🍄':'wiggle','🦋':'flutter','🐿️':'hop','🪙':'spin','💎':'sparkle','🗝️':'rock'};
let crN = 0;
const cr = (e,cls='') => `<span class="cr m-${MOTION[e]||'wiggle'} ${cls}" style="--d:${((crN++)%12)*0.08}s">${e}</span>`;
const rep = (e,n) => { crN=0; return Array.from({length:n},()=>cr(e)).join(''); };
const gone = (e,n) => Array.from({length:n},()=>cr(e,'gone')).join('');

/* ---------- world ---------- */
const GUIDE = '🦜';
const STATIONS = [
  { icon:'🏖️', name:{en:'Turtles Beach',he:'חוף הצבים'}, intro:{en:'The little turtles on the beach need help!',he:'הצבים הקטנים בחוף צריכים עזרה!'},
    items:[{e:'🐢',s:'turtle',p:'turtles',h:'צבים'},{e:'🦀',s:'crab',p:'crabs',h:'סרטנים'},{e:'🐚',s:'shell',p:'shells',h:'צדפים'}] },
  { icon:'⚓', name:{en:'The Harbor',he:'הנמל'}, intro:{en:'The boats in the harbor are waiting for us!',he:'הסירות בנמל מחכות לנו!'},
    items:[{e:'⛵',s:'boat',p:'boats',h:'סירות'},{e:'🐟',s:'fish',p:'fish',h:'דגים'},{e:'🎈',s:'balloon',p:'balloons',h:'בלונים'}] },
  { icon:'🌴', name:{en:'Coconuts Island',he:'אי הקוקוסים'}, intro:{en:'We sailed to the island! The monkeys need help.',he:'שטנו לאי! הקופים מבקשים עזרה.'},
    items:[{e:'🥥',s:'coconut',p:'coconuts',h:'קוקוסים'},{e:'🍌',s:'banana',p:'bananas',h:'בננות'},{e:'🐒',s:'monkey',p:'monkeys',h:'קופים'}] },
  { icon:'🌲', name:{en:'Magic Forest',he:'היער הקסום'}, intro:{en:'Into the magic forest. Shhh, quiet now…',he:'נכנסים ליער הקסום. שקט, שקט…'},
    items:[{e:'🍄',s:'mushroom',p:'mushrooms',h:'פטריות'},{e:'🦋',s:'butterfly',p:'butterflies',h:'פרפרים'},{e:'🐿️',s:'squirrel',p:'squirrels',h:'סנאים'}] },
  { icon:'🏴‍☠️', name:{en:'Pirates Cave',he:'מערת הפיראטים'}, intro:{en:'We made it to the Pirate Cave! The treasure is close!',he:'הגענו למערת הפיראטים! האוצר קרוב!'},
    items:[{e:'🪙',s:'coin',p:'coins',h:'מטבעות'},{e:'💎',s:'diamond',p:'diamonds',h:'יהלומים'},{e:'🗝️',s:'key',p:'keys',h:'מפתחות'}] }
];
const STICKERS = ['🐢','⛵','🐒','🦋','💰'];

const LEVELS = {
  4:{ title:{en:'Little Pup',he:'גור הים'}, em:'🐣', cls:'a4', sub:{en:'Counting to 10, shapes, sizes and sorting',he:'סופרים עד 10, צורות, גדלים ומיון'},
      plan:[ ['count5','subitize','recog5','shapes'],['tapn4','more6','size','drag3'],['count8','odd','pop5','shapes'],
             ['count10','next5','order5','subitize'],['drag6','more10','pattern2','add4'] ], opts:3 },
  5:{ title:{en:'Young Sailor',he:'מלח צעיר'}, em:'⛵', cls:'a5', sub:{en:'Adding and taking away, making 10, 3D shapes',he:'חיבור וחיסור, השלמה ל-10, גופים'},
      plan:[ ['count15','ordinal','addPic5','solids'],['tapn8','subPic5','bond10','before10'],['seq20','addPic10','longer','compare10'],
             ['tens','drag10','subPic10','skip10'],['word5','bond10','pattern3','order10'] ], opts:4 },
  6:{ title:{en:'Captain',he:'קפטן'}, em:'🧭', cls:'a6', sub:{en:'Sums to 20, tens and ones, time, halves',he:'תרגילים עד 20, עשרות ואחדות, שעון, חצאים'},
      plan:[ ['add10','sub10','order20','time'],['add20','missing10','compare99','dragAdd'],['placeValue','word10','popSum','half'],
             ['missing20','three','tenMore','trueFalse'],['hundred','addTwo','chart','money'],['word20','sub20','measure','skip5'] ], opts:4,
      /* bonus station before the Pirates Cave: counting to 120, 2-digit sums, picture graphs, money */
      extraAt:4, extraSticker:'🛍️',
      extra:{ icon:'🏪', name:{en:'Market Harbor',he:'שוק הנמל'}, intro:{en:"The harbor market is open! Let's count coins and read the charts.",he:'שוק הנמל פתוח! בוא נספור מטבעות ונקרא טבלאות.'},
              items:[{e:'🍎',s:'apple',p:'apples',h:'תפוחים'},{e:'🐟',s:'fish',p:'fish',h:'דגים'},{e:'🎈',s:'balloon',p:'balloons',h:'בלונים'}] } }
};

/* ---------- question generators (text is a function so the language can switch mid-question) ---------- */
function numOptions(ans, n, lo=0, hi=Math.max(ans+4,10)){
  const set = new Set([ans]); let guard=0;
  while(set.size<n && guard++<200){ const d = ans + pick([-3,-2,-1,1,2,3]); if(d>=lo && d<=hi) set.add(d); }
  for(let v=lo; set.size<n; v++) set.add(v);
  return shuffle([...set]).map(v=>({label:String(v), value:v}));
}
/* standard 2D shapes (CCSS K.G.2 / EYFS / Israeli kindergarten geometry), drawn as SVG so colour is never the clue */
const SHAPES = [{en:'circle',he:'עיגול',k:'circle'},{en:'square',he:'ריבוע',k:'square'},{en:'triangle',he:'משולש',k:'triangle'},{en:'rectangle',he:'מלבן',k:'rectangle'}];
const SHAPE_COL = ['#ff6b4a','#1f8fc4','#2fb36b','#e6a400','#a66cff'];
function shp(k,c,extra=''){
  const f=`fill="${c}"`; let body='';
  if(k==='circle') body=`<circle cx="50" cy="50" r="42" ${f}/>`;
  else if(k==='square') body=`<rect x="10" y="10" width="80" height="80" ${f}/>`;
  else if(k==='triangle') body=`<polygon points="50,8 94,88 6,88" ${f}/>`;
  else if(k==='rectangle') body=`<rect x="3" y="26" width="94" height="48" ${f}/>`;
  return `<svg viewBox="0 0 100 100" class="shp" aria-hidden="true">${body}${extra}</svg>`;
}
const SOLIDS = [{en:'sphere',he:'כדור',e:['⚽','🏀','🌍','🍊']},{en:'cube',he:'קובייה',e:['🎲','📦','🧊']},{en:'cone',he:'חרוט',e:['🍦']},{en:'cylinder',he:'גליל',e:['🥫','🥁','🧻']}];
const CATS = [['🐢','🦀','🐟','🐒','🦋','🐿️','🐘','🐸'],['🍌','🍎','🍇','🥕','🍓','🥥'],['⛵','🚗','🚌','🚆','✈️','🚲'],['🎈','🪁','⚽','🧸','🎲']];
const LINE_ANIMALS = ['🐢','🦀','🐟','🐒','🦋','🐿️','🐘','🐸','🐰','🦆'];
const ORD = {en:['first','second','third','fourth','fifth'], he:['ראשונה','שנייה','שלישית','רביעית','חמישית']};
const DICE = {1:[[50,50]],2:[[28,28],[72,72]],3:[[25,25],[50,50],[75,75]],4:[[28,28],[72,28],[28,72],[72,72]],5:[[28,28],[72,28],[50,50],[28,72],[72,72]],6:[[28,24],[72,24],[28,50],[72,50],[28,76],[72,76]]};
function clockSvg(h,m){
  const rad=d=>d*Math.PI/180, ha=((h%12)+m/60)*30, ma=m*6;
  const nums=Array.from({length:12},(_,i)=>{ const k=i+1, a=rad(k*30); return `<text x="${(50+37*Math.sin(a)).toFixed(1)}" y="${(50-37*Math.cos(a)+4).toFixed(1)}" text-anchor="middle" class="ck-n">${k}</text>`; }).join('');
  return `<svg viewBox="0 0 100 100" class="clock" aria-hidden="true"><circle cx="50" cy="50" r="47" class="ck-face"/>${nums}
    <line x1="50" y1="50" x2="${(50+22*Math.sin(rad(ha))).toFixed(1)}" y2="${(50-22*Math.cos(rad(ha))).toFixed(1)}" class="ck-h"/>
    <line x1="50" y1="50" x2="${(50+33*Math.sin(rad(ma))).toFixed(1)}" y2="${(50-33*Math.cos(rad(ma))).toFixed(1)}" class="ck-m"/><circle cx="50" cy="50" r="3.5" class="ck-c"/></svg>`;
}
function partsSvg(kind, round, c){   // e2 = 2 equal parts, u2 = 2 unequal, e4 = 4 equal, u4 = 4 unequal
  const L=(x1,y1,x2,y2)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="cut"/>`;
  const chordV=x=>{ const h=Math.sqrt(Math.max(0,42*42-(x-50)**2)); return L(x,50-h,x,50+h); };
  const chordH=y=>{ const w=Math.sqrt(Math.max(0,42*42-(y-50)**2)); return L(50-w,y,50+w,y); };
  const v = x => round ? chordV(x) : L(x,10,x,90), hz = y => round ? chordH(y) : L(10,y,90,y);
  const rad = d => { const r=d*Math.PI/180; return L(50,50,(50+42*Math.cos(r)).toFixed(1),(50+42*Math.sin(r)).toFixed(1)); };
  const lines = {e2:v(50), u2:v(30), e4:v(50)+hz(50), u4:v(34)+hz(64), e3: round ? rad(-90)+rad(30)+rad(150) : v(36.7)+v(63.3), u3: round ? rad(-90)+rad(-10)+rad(40) : v(25)+v(45)}[kind];
  return shp(round?'circle':'square', c, lines);
}
const L2 = (enF, heF) => () => he() ? heF() : enF();

function gen(type, it, nOpt){
  const m = type.match(/^([a-zA-Z]+?)(\d*)$/); const kind=m[1]; let N=+m[2]||10;
  if(ADAPT){ N=adaptN(kind,N); nOpt=Math.max(2,Math.min(4,nOpt+ADAPT)); }   // adaptive: bigger/smaller numbers, more/fewer choices
  const nw = n => `${n} ${n===1?it.s:it.p}`;
  const pairVis = (a,b) => `<div class="grp">${rep(it.e,a)}</div><span class="op">+</span><div class="grp">${(crN=0, Array.from({length:b},()=>cr(it.e)).join(''))}</div>`;
  let q;
  switch(kind){
    case 'count': { const n=rnd(N<=5?1:3,N);
      q={t:L2(()=>`How many ${it.p} can you count?`,()=>`כמה ${it.h} יש?`), visual:`<div class="grp" style="max-width:${n>10?360:300}px">${rep(it.e,n)}</div>`, opts:numOptions(n,nOpt,1,N+3), ans:n}; break; }
    case 'recog': { const n=rnd(1,N);
      q={t:L2(()=>`Find the number ${n}!`,()=>`איפה המספר ${n}?`), visual:`<span class="cr m-wiggle">🔎</span>`, opts:numOptions(n,nOpt,1,N), ans:n}; break; }
    case 'shapes': { const s=pick(SHAPES); const others=shuffle(SHAPES.filter(x=>x!==s)).slice(0,nOpt-1); const cols=shuffle(SHAPE_COL);
      q={t:L2(()=>`Which one is the ${s.en}?`,()=>`איפה ה${s.he}?`), visual:'', opts:shuffle([s,...others]).map((x,i)=>({label:shp(x.k,cols[i]),value:x.en})), ans:s.en}; break; }
    case 'more': { let a=rnd(1,N), b=rnd(1,N); while(a===b) b=rnd(1,N);
      q={t:L2(()=>`Which group has more ${it.p}?`,()=>`איפה יש יותר ${it.h}?`), visual:'', opts:shuffle([{label:rep(it.e,a),value:a},{label:rep(it.e,b),value:b}]), ans:Math.max(a,b), small:true}; break; }
    case 'next': { const n=rnd(1,N-1);
      q={t:L2(()=>`What number comes after ${n}?`,()=>`איזה מספר בא אחרי ${n}?`), visual:`<span class="box">${n}</span><span class="op">→</span><span class="box q">?</span>`, opts:numOptions(n+1,nOpt,1,N+2), ans:n+1}; break; }
    case 'before': { const n=rnd(2,N);
      q={t:L2(()=>`What number comes before ${n}?`,()=>`איזה מספר בא לפני ${n}?`), visual:`<span class="box q">?</span><span class="op">→</span><span class="box">${n}</span>`, opts:numOptions(n-1,nOpt,0,N), ans:n-1}; break; }
    case 'add': { const a = N>10 ? rnd(4,15) : rnd(1,N-1), b=rnd(1,Math.max(1,Math.min(N-a, N>10?9:N)));
      if(N<=4) q={t:L2(()=>`${nw(a)} and ${b} more. How many altogether?`,()=>`${a} ${it.h} ועוד ${b}. כמה ביחד?`), visual:pairVis(a,b), opts:numOptions(a+b,nOpt,1,8), ans:a+b};
      else q={t:L2(()=>`What is ${a} plus ${b}?`,()=>`כמה זה ${a} ועוד ${b}?`), visual:`<span class="big">${a} + ${b} = ?</span>`, opts:numOptions(a+b,nOpt,0,20), ans:a+b};
      break; }
    case 'addPic': { const a=rnd(2,N-2), b=rnd(2,N-a);   // 2+ each, so the Hebrew plural always reads correctly
      q={t:L2(()=>`${nw(a)} and ${nw(b)}. How many altogether?`,()=>`${a} ${it.h} ועוד ${b} ${it.h}. כמה ביחד?`), visual:pairVis(a,b), opts:numOptions(a+b,nOpt,1,N+3), ans:a+b}; break; }
    case 'subPic': { const a=rnd(2,N), b = Math.random()<.12 ? a : rnd(1,a-1);   // sometimes all go away → zero
      q={t:L2(()=>`There were ${nw(a)}. ${b} went away. How many are left?`,()=>`היו ${a} ${it.h}. ${b} הלכו. כמה נשארו?`), visual:`<div class="grp" style="max-width:360px">${rep(it.e,a-b)}${gone(it.e,b)}</div>`, opts:numOptions(a-b,nOpt,0,N), ans:a-b}; break; }
    case 'sub': { const a=rnd(N>10?8:3,N), b=rnd(1,Math.min(a-1,9));
      q={t:L2(()=>`What is ${a} minus ${b}?`,()=>`כמה זה ${a} פחות ${b}?`), visual:`<span class="big">${a} − ${b} = ?</span>`, opts:numOptions(a-b,nOpt,0,20), ans:a-b}; break; }
    case 'seq': { const start=rnd(1,N-4), miss=rnd(1,3); const nums=[0,1,2,3].map(i=>start+i);
      q={t:L2(()=>'Which number is missing?',()=>'איזה מספר חסר?'), visual:nums.map((v,i)=>`<span class="box ${i===miss?'q':''}">${i===miss?'?':v}</span>`).join(''), opts:numOptions(nums[miss],nOpt,1,N+2), ans:nums[miss]}; break; }
    case 'pattern': { const k=N===3?3:2; const pool=shuffle(STATIONS.flatMap(s=>s.items.map(x=>x.e))).slice(0,k);
      const len = k===2?5:7; const seq=Array.from({length:len},(_,i)=>pool[i%k]); const ans=pool[len%k];
      const opts=shuffle([...new Set([...pool, pick(STATIONS[4].items).e, pick(STATIONS[0].items).e])]).slice(0,nOpt); if(!opts.includes(ans)) opts[0]=ans;
      crN=0; q={t:L2(()=>'What comes next in the pattern?',()=>'מה בא אחר כך בתבנית?'), visual:seq.map(e=>cr(e)).join('')+'<span class="box q">?</span>', opts:shuffle(opts).map(e=>({label:e,value:e})), ans}; break; }
    case 'compare': { let a=rnd(1,N), b=rnd(1,N); while(a===b) b=rnd(1,N);
      q={t:L2(()=>'Which number is bigger?',()=>'איזה מספר גדול יותר?'), visual:`<span class="box">${a}</span><span class="op">?</span><span class="box">${b}</span>`, opts:shuffle([{label:String(a),value:a},{label:String(b),value:b}]), ans:Math.max(a,b)}; break; }
    case 'missing': { const s=rnd(N>10?11:4,N), a=rnd(1,s-1);
      q={t:L2(()=>`${a} plus what makes ${s}?`,()=>`${a} ועוד כמה שווה ${s}?`), visual:`<span class="big">${a} + <span class="box q">?</span> = ${s}</span>`, opts:numOptions(s-a,nOpt,0,N), ans:s-a}; break; }
    case 'skip': { const st=N, start=rnd(0,3)*st; const nums=[0,1,2,3].map(i=>start+i*st+st);
      q={t:L2(()=>`Count by ${st}s. What comes next?`,()=>`סופרים בקפיצות של ${st}. מה הבא?`), visual:nums.slice(0,3).map(v=>`<span class="box">${v}</span>`).join('')+'<span class="box q">?</span>', opts:numOptions(nums[3],nOpt,0,nums[3]+10), ans:nums[3]}; break; }
    case 'double': { const a=rnd(2,9);
      q={t:L2(()=>`What is ${a} plus ${a}?`,()=>`כמה זה ${a} ועוד ${a}?`), visual:pairVis(a,a), opts:numOptions(a*2,nOpt,2,20), ans:a*2}; break; }
    case 'tens': { const u=rnd(1,9), n=10+u;
      q={t:L2(()=>`A row of 10 ${it.p} and ${u} more. How many in all?`,()=>`שורה של 10 ${it.h} ועוד ${u}. כמה בסך הכול?`), visual:`<div class="grp" style="max-width:460px"><span class="ten">${rep(it.e,10)}</span><span class="op">+</span>${(crN=0, Array.from({length:u},()=>cr(it.e)).join(''))}</div>`, opts:numOptions(n,nOpt,10,20), ans:n}; break; }
    case 'word': { const sub = Math.random()<.5; let a,b,ans,tf;
      if(sub){ a=rnd(Math.min(4,N),N); b=rnd(1,Math.min(a-1,9)); ans=a-b;
        tf=L2(()=>`${nm()} had ${nw(a)}. He gave ${b} to a friend. How many ${it.p} does ${nm()} have left?`,()=>`ל${nm()} היו ${a} ${it.h}. הוא נתן ${b} לחבר. כמה ${it.h} נשארו ל${nm()}?`); }
      else { a=rnd(1,N-1); b=rnd(1,Math.min(N-a,9)); ans=a+b;
        tf=L2(()=>`${nm()} had ${nw(a)}. He found ${b} more. How many ${it.p} does ${nm()} have now?`,()=>`ל${nm()} היו ${a} ${it.h}. הוא מצא עוד ${b}. כמה ${it.h} יש ל${nm()} עכשיו?`); }
      const vis = N<=10 ? (sub ? `<div class="grp" style="max-width:360px">${rep(it.e,ans)}${gone(it.e,b)}</div>` : pairVis(a,b)) : `${cr(it.e)}<span class="cr m-wiggle">🤔</span>`;
      q={t:tf, visual:vis, opts:numOptions(ans,nOpt,0,N+3), ans}; break; }
    /* ---- standards-aligned additions ---- */
    case 'subitize': { const n=rnd(1,6);   // recognise small amounts at a glance
      const svg=`<svg viewBox="0 0 100 100" class="dice" aria-hidden="true"><rect x="4" y="4" width="92" height="92" rx="18" class="dice-bg"/>${DICE[n].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="9" class="dice-dot"/>`).join('')}</svg>`;
      q={t:L2(()=>'How many dots? Try to see it without counting!',()=>'כמה נקודות? נסה לראות בלי לספור!'), visual:svg, opts:numOptions(n,nOpt,1,6), ans:n}; break; }
    case 'size': { const big=Math.random()<.5;
      q={t:L2(()=>big?`Which ${it.s} is bigger?`:`Which ${it.s} is smaller?`,()=>big?'מי גדול יותר?':'מי קטן יותר?'), visual:'',
         opts:shuffle([{label:`<span class="sz-b">${cr(it.e)}</span>`,value:'big'},{label:`<span class="sz-s">${cr(it.e)}</span>`,value:'small'}]), ans:big?'big':'small'}; break; }
    case 'odd': { const [A,B]=shuffle(CATS).slice(0,2); const three=shuffle(A).slice(0,3), odd=pick(B);
      q={t:L2(()=>'Which one does not belong?',()=>'מי לא שייך לקבוצה?'), visual:'', opts:shuffle([...three,odd]).map(e=>({label:cr(e),value:e})), ans:odd}; break; }
    case 'ordinal': { const line=shuffle(LINE_ANIMALS).slice(0,5); const k=rnd(0,4); const ans=line[k];
      const opts=shuffle([ans,...shuffle(line.filter(x=>x!==ans)).slice(0,nOpt-1)]);
      // counting starts at the flag: a "Start" label and an arrow show the direction (it flips in Hebrew, which reads right to left)
      q={t:L2(()=>`Start at the flag 🏁. Which animal is ${ORD.en[k]} in line?`,()=>`מתחילים מהדגל 🏁. איזו חיה היא ה${ORD.he[k]} בתור?`),
         visual:`<div class="line"><span class="lstart"><span class="flag">🏁</span><small>${he()?'מתחילים':'Start'}</small></span><span class="larrow" aria-hidden="true">${svgI('<path d="M3 12h16M13 5l7 7-7 7"/>')}</span>${line.map(e=>cr(e)).join('')}</div>`,
         opts:opts.map(e=>({label:cr(e),value:e})), ans}; break; }
    case 'bond': { const k=rnd(1,9);   // make 10 (CCSS K.OA.4)
      q={t:L2(()=>'How many more to make 10?',()=>'כמה חסר כדי להגיע ל-10?'), visual:`<div class="tf">${Array.from({length:10},(_,i)=>`<span class="${i<k?'on':''}"></span>`).join('')}</div>`,
         opts:numOptions(10-k,nOpt,0,10), ans:10-k}; break; }
    case 'solids': { const s=pick(SOLIDS); const others=shuffle(SOLIDS.filter(x=>x!==s)).slice(0,nOpt-1);
      q={t:L2(()=>`Which one is shaped like a ${s.en}?`,()=>`איזה מהם בצורת ${s.he}?`), visual:'', opts:shuffle([s,...others]).map(x=>({label:cr(pick(x.e)),value:x.en})), ans:s.en}; break; }
    case 'longer': { let a=rnd(2,9), b=rnd(2,9); while(Math.abs(a-b)<2) b=rnd(2,9); const long=Math.random()<.5;
      q={t:L2(()=>long?'Which pencil is longer?':'Which pencil is shorter?',()=>long?'איזה עיפרון ארוך יותר?':'איזה עיפרון קצר יותר?'), visual:'',
         opts:shuffle([a,b]).map(v=>({label:`<span class="pencil" style="width:${v*10}%"></span>`,value:v})), ans:long?Math.max(a,b):Math.min(a,b)}; break; }
    case 'measure': { const n=rnd(3,8);   // measure length with units (CCSS 1.MD.2)
      q={t:L2(()=>'How many blocks long is the pencil?',()=>'מה אורך העיפרון בקוביות?'),
         visual:`<div class="meas"><span class="pencil" style="width:calc(${n} * var(--u))"></span><div class="units">${'<span></span>'.repeat(n+2)}</div></div>`, opts:numOptions(n,nOpt,1,10), ans:n}; break; }
    case 'placeValue': { const tn=rnd(1,9), o=rnd(0,9), v=tn*10+o;   // tens and ones (CCSS 1.NBT.2)
      const set=new Set([v]); if(o>0&&o!==tn) set.add(o*10+tn); set.add(v+10<=99?v+10:v-10); set.add(o<9?v+1:v-1); for(let d=2; set.size<nOpt; d++) set.add(v+d);
      q={t:L2(()=>'What number is this? Each long stick is 10.',()=>'איזה מספר זה? כל מקל ארוך הוא 10.'),
         visual:`<div class="pv">${'<span class="rod"></span>'.repeat(tn)}<span class="pvgap"></span>${'<span class="one"></span>'.repeat(o)}</div>`,
         opts:shuffle([...set].slice(0,nOpt)).map(x=>({label:String(x),value:x})), ans:v}; break; }
    case 'three': { const a=rnd(1,6), b=rnd(1,6), c=rnd(1,6);   // three addends (CCSS 1.OA.2)
      q={t:L2(()=>`What is ${a} + ${b} + ${c}?`,()=>`כמה זה ${a} ועוד ${b} ועוד ${c}?`), visual:`<span class="big">${a} + ${b} + ${c} = ?</span>`, opts:numOptions(a+b+c,nOpt,3,20), ans:a+b+c}; break; }
    case 'trueFalse': { const add=Math.random()<.5; const a=rnd(4,12), b=rnd(1,add?8:a-1), v=add?a+b:a-b; const truth=Math.random()<.5;
      const shown = truth ? v : Math.max(0, v + pick([-2,-1,1,2])); const ok = shown===v;   // meaning of = (CCSS 1.OA.7)
      q={t:L2(()=>'Is this true? ✅ yes or ❌ no',()=>'האם זה נכון? ✅ כן או ❌ לא'), visual:`<span class="big">${a} ${add?'+':'−'} ${b} = ${shown}</span>`,
         opts:[{label:'✅',value:'T'},{label:'❌',value:'F'}], ans:ok?'T':'F'}; break; }
    case 'tenMore': { const v=rnd(12,88), more=Math.random()<.5, ans=more?v+10:v-10;   // CCSS 1.NBT.5
      const set=new Set([ans, more?v+1:v-1, more?v-10:v+10, more?ans+1:ans-1]);
      q={t:L2(()=>`What is 10 ${more?'more':'less'} than ${v}?`,()=>`מה המספר ש${more?'גדול':'קטן'} ב-10 מ-${v}?`), visual:`<span class="big">${v} ${more?'+':'−'} 10 = ?</span>`,
         opts:shuffle([...set].slice(0,nOpt)).map(x=>({label:String(x),value:x})), ans}; break; }
    case 'time': { const h=rnd(1,12), m=Math.random()<.4?30:0, fmt=(hh,mm)=>`${hh}:${mm?'30':'00'}`;   // hours and half hours (CCSS 1.MD.3)
      const oh=(h%12)+1, oh2=h===1?12:h-1; const set=new Set([fmt(h,m), fmt(h,m?0:30), fmt(oh,m), fmt(oh2,m?0:30)]);
      q={t:L2(()=>'What time is it on the clock?',()=>'מה השעה בשעון?'), visual:clockSvg(h,m), opts:shuffle([...set].slice(0,nOpt)).map(x=>({label:x,value:x})), ans:fmt(h,m), small:true}; break; }
    case 'half': { const quarter=Math.random()<.5, round=Math.random()<.5, c=pick(SHAPE_COL);   // halves and quarters (CCSS 1.G.3)
      const kinds = quarter ? ['e4','u4','e2'] : ['e2','u2','e4'];
      q={t:L2(()=>quarter?'Which one is cut into quarters (4 equal parts)?':'Which one is cut into halves (2 equal parts)?',
              ()=>quarter?'איזו צורה חולקה לרבעים (4 חלקים שווים)?':'איזו צורה חולקה לחצאים (2 חלקים שווים)?'),
         visual:'', opts:shuffle(kinds).map(k=>({label:partsSvg(k,round,c),value:k})), ans:kinds[0]}; break; }
    case 'hundred': { const start=rnd(96,115), miss=rnd(1,3); const nums=[0,1,2,3].map(i=>start+i);   // counting to 120 (CCSS 1.NBT.1)
      q={t:L2(()=>'Which number is missing?',()=>'איזה מספר חסר?'), visual:nums.map((v,i)=>`<span class="box ${i===miss?'q':''}">${i===miss?'?':v}</span>`).join(''),
         opts:numOptions(nums[miss],nOpt,90,120), ans:nums[miss]}; break; }
    case 'addTwo': { const mode=rnd(0,2); let a,b;   // adding within 100 (CCSS 1.NBT.4)
      if(mode===0){ a=rnd(11,89); b=rnd(1,9); }
      else if(mode===1){ a=rnd(11,79); b=10*rnd(1,Math.floor((99-a)/10)); }
      else { const at=rnd(1,6), ao=rnd(0,8), bt=rnd(1,8-at), bo=rnd(1,9-ao); a=at*10+ao; b=bt*10+bo; }
      const s=a+b; const set=new Set([s, s>20?s-10:s+10, s+1, s-1]);
      q={t:L2(()=>`What is ${a} + ${b}?`,()=>`כמה זה ${a} ועוד ${b}?`), visual:`<span class="big">${a} + ${b} = ?</span>`,
         opts:shuffle([...set]).map(x=>({label:String(x),value:x})), ans:s}; break; }
    case 'chart': { const F={'🍎':['apples','תפוחים'],'🍌':['bananas','בננות'],'🍇':['grapes','ענבים'],'🍓':['strawberries','תותים'],'🥕':['carrots','גזרים']};   // picture graphs (CCSS 1.MD.4)
      const em=shuffle(Object.keys(F)).slice(0,3), cnt=shuffle([1,2,3,4,5,6,7]).slice(0,3), rows=em.map((e,i)=>[e,cnt[i]]);
      const vis=`<div class="chart">${rows.map(([e,c])=>`<div class="crow"><span class="clab">${e}</span><span class="cbar">${Array.from({length:c},()=>`<span class="cell">${e}</span>`).join('')}</span></div>`).join('')}</div>`;
      const kind2=rnd(0,2);
      if(kind2===0){ const [e,c]=pick(rows);
        q={t:L2(()=>`How many ${F[e][0]} are in the chart?`,()=>`כמה ${F[e][1]} יש בטבלה?`), visual:vis, opts:numOptions(c,nOpt,0,9), ans:c}; }
      else if(kind2===1){ const most=rows.reduce((m,r)=>r[1]>m[1]?r:m);
        q={t:L2(()=>'Which one is there the most of?',()=>'ממה יש הכי הרבה?'), visual:vis, opts:shuffle(em).map(e=>({label:e,value:e})), ans:most[0]}; }
      else { const [x,y]=shuffle(rows).slice(0,2).sort((p,r)=>r[1]-p[1]); const d=x[1]-y[1];
        q={t:L2(()=>`How many more ${F[x[0]][0]} than ${F[y[0]][0]}?`,()=>`בכמה יש יותר ${F[x[0]][1]} מ${F[y[0]][1]}?`), visual:vis, opts:numOptions(d,nOpt,0,7), ans:d}; }
      break; }
    case 'money': { const k=rnd(2,4); const coins=Array.from({length:k},()=>pick([1,1,2,2,5,5,10])).sort((a,b)=>b-a); const tot=coins.reduce((a,b)=>a+b,0);   // coins (UK pence / Israeli shekels)
      q={t:L2(()=>'How much money is there altogether?',()=>'כמה כסף יש בסך הכול?'), visual:coins.map(v=>`<span class="coin c${v}">${v}</span>`).join(''),
         opts:numOptions(tot,nOpt,1,45), ans:tot}; break; }
    /* ---- hands-on tasks ---- */
    case 'drag': { const n=rnd(Math.max(1,N-3),N);
      q={wide:true, t:L2(()=>`Drag ${nw(n)} into the basket!`,()=>`גרור ${n} ${it.h} לסל!`), mount:el=>mountDrag(el,it.e,0,n,n+rnd(2,4))}; break; }
    case 'dragAdd': { const s=rnd(7,12), a=rnd(3,s-2);
      q={wide:true, t:L2(()=>`There are ${nw(a)} in the basket. Drag more so there are ${s}!`,()=>`בסל יש ${a} ${it.h}. גרור עוד כדי שיהיו ${s}!`), mount:el=>mountDrag(el,it.e,a,s,s-a+rnd(2,3))}; break; }
    case 'tapn': { const n=rnd(Math.max(2,N-3),N);
      q={wide:true, t:L2(()=>`Tap exactly ${nw(n)}!`,()=>`גע בדיוק ב-${n} ${it.h}!`), mount:el=>mountTapN(el,it.e,n,Math.min(14,n+rnd(2,4)))}; break; }
    case 'order': { const k = N<=5?5:6; let nums;
      if(N<=5) nums=[1,2,3,4,5]; else if(N<=10){ const st=rnd(1,5); nums=Array.from({length:k},(_,i)=>st+i); }
      else nums=shuffle(Array.from({length:20},(_,i)=>i+1)).slice(0,k).sort((x,y)=>x-y);
      q={wide:true, t:L2(()=>'Tap the numbers in order, from smallest to biggest!',()=>'גע במספרים לפי הסדר, מהקטן לגדול!'), mount:el=>mountOrder(el,nums)}; break; }
    case 'pop': { const n=rnd(1,N); const targets=rnd(2,4); const decoys=Array.from({length:7-targets},()=>{ let d; do{d=rnd(1,N)}while(d===n); return d; });
      const list=shuffle([...Array(targets).fill(0).map(()=>({label:String(n),hit:true})), ...decoys.map(d=>({label:String(d),hit:false}))]);
      q={wide:true, t:L2(()=>`Pop all the bubbles with ${n}!`,()=>`פוצץ את כל הבועות עם המספר ${n}!`), mount:el=>mountPop(el,list)}; break; }
    case 'popSum': { const goal=10; const good=shuffle([[1,9],[2,8],[3,7],[4,6],[5,5],[6,4],[7,3],[8,2]]).slice(0,3);
      const bad=[]; while(bad.length<4){ const a=rnd(1,9), b=rnd(1,9); if(a+b!==goal) bad.push([a,b]); }
      const list=shuffle([...good.map(([a,b])=>({label:`${a}+${b}`,hit:true})), ...bad.map(([a,b])=>({label:`${a}+${b}`,hit:false}))]);
      q={wide:true, t:L2(()=>`Pop all the bubbles that make ${goal}!`,()=>`פוצץ את כל הבועות ששוות ${goal}!`), mount:el=>mountPop(el,list,true)}; break; }
  }
  return q;
}

/* ---------- hands-on task widgets ---------- */
function recount(){ miss(pick(t().recount)); }
function checkBtn(el,fn){ const b=document.createElement('button'); b.className='btn check'; b.textContent=t().check; b.onclick=()=>{ if(!busy) fn(); }; el.appendChild(b); }

function mountDrag(el, e, fixed, goal, total){
  el.innerHTML = `<div class="tray" aria-label="animals"></div>
    <div class="basket"><div class="bk-ic">🧺</div><div class="bk-in"></div></div>`;
  const tray=el.querySelector('.tray'), bin=el.querySelector('.bk-in'), basket=el.querySelector('.basket');
  crN=0;
  for(let i=0;i<fixed;i++) bin.insertAdjacentHTML('beforeend', cr(e,'fixed'));
  for(let i=0;i<total;i++){ tray.insertAdjacentHTML('beforeend', cr(e,'dr')); }
  tray.querySelectorAll('.dr').forEach(item=>makeDraggable(item,tray,bin,basket));
  checkBtn(el, ()=>{ const n=bin.querySelectorAll('.cr').length; n===goal ? correct() : recount(); });
}
function makeDraggable(item, tray, bin, basket){
  item.addEventListener('pointerdown', e=>{
    if(busy) return; e.preventDefault();
    try{ item.setPointerCapture(e.pointerId); }catch(_){}
    const r=item.getBoundingClientRect(), sx=e.clientX, sy=e.clientY, ox=sx-r.left, oy=sy-r.top; let moved=false;
    const mv=ev=>{ if(!moved && Math.hypot(ev.clientX-sx,ev.clientY-sy)<8) return;
      if(!moved){ moved=true; item.classList.add('dragging'); }
      item.style.left=(ev.clientX-ox)/appZoom()+'px'; item.style.top=(ev.clientY-oy)/appZoom()+'px';
      const b=basket.getBoundingClientRect(); basket.classList.toggle('hot', ev.clientX>=b.left&&ev.clientX<=b.right&&ev.clientY>=b.top&&ev.clientY<=b.bottom); };
    const up=ev=>{ item.removeEventListener('pointermove',mv); item.removeEventListener('pointerup',up); item.removeEventListener('pointercancel',up);
      item.classList.remove('dragging'); item.style.left=item.style.top=''; basket.classList.remove('hot');
      let target;
      if(!moved) target = item.parentElement===bin ? tray : bin;   // a simple tap also moves it
      else { const b=basket.getBoundingClientRect(); target = (ev.clientX>=b.left&&ev.clientX<=b.right&&ev.clientY>=b.top&&ev.clientY<=b.bottom) ? bin : tray; }
      if(target!==item.parentElement){ target.appendChild(item); tone([target===bin?720:420],.07); }
    };
    item.addEventListener('pointermove',mv); item.addEventListener('pointerup',up); item.addEventListener('pointercancel',up);
  });
}
function mountTapN(el, e, goal, total){
  el.innerHTML = `<div class="grid-pick">${Array.from({length:total},(_,i)=>`<button class="pickit">${cr(e)}</button>`).join('')}</div>`;
  el.querySelectorAll('.pickit').forEach(b=>b.onclick=()=>{ if(busy) return; b.classList.toggle('sel'); tone([b.classList.contains('sel')?760:420],.07); });
  checkBtn(el, ()=>{ el.querySelectorAll('.pickit.sel').length===goal ? correct() : recount(); });
}
function mountOrder(el, nums, lab, cls){
  let next=0; el.dataset.ord = nums.join('|');
  el.innerHTML = `<div class="bubbles">${shuffle(nums).map((v,i)=>`<button class="bub ${cls||''}" style="--d:${(i*0.37)%2}s" data-v="${v}">${lab?lab(v):v}</button>`).join('')}</div>`;
  el.querySelectorAll('.bub').forEach(b=>b.onclick=()=>{ if(busy||b.classList.contains('ok')) return;
    if(b.dataset.v===String(nums[next])){ b.classList.add('ok'); tone([500+next*90],.09); next++; if(next===nums.length) correct(); }
    else { b.classList.remove('no'); void b.offsetWidth; b.classList.add('no'); miss(); }
  });
}
function mountPop(el, list, small){
  let left=list.filter(x=>x.hit).length; el.dataset.a=(list.find(x=>x.hit)||{}).label;
  el.innerHTML = `<div class="bubbles">${list.map((x,i)=>`<button class="bub ${small?'small':''}" style="--d:${(i*0.37)%2}s" data-i="${i}">${x.label}</button>`).join('')}</div>`;
  el.querySelectorAll('.bub').forEach(b=>b.onclick=()=>{ if(busy||b.classList.contains('popped')) return;
    if(list[+b.dataset.i].hit){ b.classList.add('popped'); tone([880,1200],.06); burstAt(b,14); left--; if(left===0) correct(); }
    else { b.classList.remove('no'); void b.offsetWidth; b.classList.add('no'); miss(); }
  });
}

/* =====================================================================
   LETTER ISLAND — phonological awareness → letters → letter-sounds → reading
   ===================================================================== */
const strip = s => s.replace(/[֑-ׇ]/g,'');
const EN_LET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const HE_LET = 'אבגדהוזחטיכלמנסעפצקרשת'.split('');
const LET = () => he() ? HE_LET : EN_LET;
const EN_NAMES={A:'ay',B:'bee',C:'see',D:'dee',E:'ee',F:'ef',G:'jee',H:'aitch',I:'eye',J:'jay',K:'kay',L:'el',M:'em',N:'en',O:'oh',P:'pee',Q:'cue',R:'ar',S:'ess',T:'tee',U:'you',V:'vee',W:'double you',X:'ex',Y:'why',Z:'zee'};
const HE_NAMES={'א':'אָלֶף','ב':'בֵּית','ג':'גִּימֶל','ד':'דָּלֶת','ה':'הֵא','ו':'וָו','ז':'זַיִן','ח':'חֵית','ט':'טֵית','י':'יוּד','כ':'כָּף','ל':'לָמֶד','מ':'מֵם','נ':'נוּן','ס':'סָמֶךְ','ע':'עַיִן','פ':'פֵּא','צ':'צָדִי','ק':'קוּף','ר':'רֵישׁ','ש':'שִׁין','ת':'תָּו',
  'ך':'כָּף סוֹפִית','ם':'מֵם סוֹפִית','ן':'נוּן סוֹפִית','ף':'פֵּא סוֹפִית','ץ':'צָדִי סוֹפִית'};
const lname = L => he() ? (HE_NAMES[L]||L) : (EN_NAMES[L.toUpperCase()]||L);
const ALIKE = {en:['CKQ','CS','GJ'], he:['אעה','כקח','תט','בו']};      // letters that sound the same
const alike = (a,b) => { a=a.toUpperCase(); b=b.toUpperCase(); return a===b || ALIKE[lang].some(g=>g.includes(a)&&g.includes(b)); };
const SIM_EN = {b:'dpq',d:'bpq',p:'qbd',q:'pgd',m:'nw',n:'mu',u:'nv',w:'mv',h:'nk',i:'jl',j:'ig',f:'tk',t:'fl',g:'qy',E:'FB',F:'EP',O:'QC',M:'NW',W:'MV',P:'RB',B:'PR'};
const SIM_HE = {'ב':'כפ','כ':'בפ','פ':'כב','ד':'רה','ר':'דו','ו':'זי','ז':'וי','ח':'הת','ה':'חד','ת':'חה','ס':'טע','ט':'סמ','מ':'טס','ע':'צש','צ':'עש','ג':'נו','נ':'גכ','י':'וז','ל':'קכ','ק':'לה','ש':'עצ','א':'שע'};
function similar(L,n){   // look-alike letters first, then random ones
  const m = (he()?SIM_HE:SIM_EN)[L]; const isLow = !he() && L===L.toLowerCase();
  const all = he() ? HE_LET : EN_LET.map(x=>isLow?x.toLowerCase():x);
  const out=[]; for(const c of [...shuffle(m?m.split(''):[]), ...shuffle(all)]){ if(out.length>=n) break; if(c!==L && !out.includes(c)) out.push(c); }
  return out;
}
const soundOthers = (L,n,pool) => shuffle(pool.filter(x=>!alike(x,L))).slice(0,n);
const listSay = arr => arr.slice(0,-1).join(', ') + (he()?' או ':', or ') + arr[arr.length-1];

const WORDS = {
  en: [['apple','🍎',2],['ant','🐜',1],['ball','⚽',1],['bee','🐝',1],['bear','🐻',1],['banana','🍌',3],['bus','🚌',1],['bed','🛏️',1],['box','📦',1],['bat','🦇',1],['bug','🐛',1],['butterfly','🦋',3],
       ['cat','🐱',1],['cake','🎂',1],['car','🚗',1],['cup','☕',1],['crab','🦀',1],['dog','🐶',1],['duck','🦆',1],['dinosaur','🦕',3],['drum','🥁',1],['egg','🥚',1],['elephant','🐘',3],
       ['fish','🐟',1],['fox','🦊',1],['frog','🐸',1],['goat','🐐',1],['grapes','🍇',1],['hat','🎩',1],['house','🏠',1],['horse','🐴',1],['hen','🐔',1],['hand','✋',1],['juice','🧃',1],
       ['key','🔑',1],['kite','🪁',1],['lion','🦁',2],['leaf','🍃',1],['log','🪵',1],['moon','🌙',1],['monkey','🐒',2],['mouse','🐭',1],['milk','🥛',1],['nose','👃',1],['octopus','🐙',3],
       ['pig','🐷',1],['pizza','🍕',2],['pen','🖊️',1],['rabbit','🐰',2],['rainbow','🌈',2],['robot','🤖',2],['sun','☀️',1],['snake','🐍',1],['star','⭐',1],['sock','🧦',1],['ship','🚢',1],
       ['tiger','🐯',2],['tree','🌳',1],['turtle','🐢',2],['train','🚆',1],['umbrella','☂️',3],['van','🚐',1],['violin','🎻',3],['whale','🐋',1],['web','🕸️',1],['zebra','🦓',2]],
  he: [['אַרְיֵה','🦁',2],['אֲוִירוֹן','✈️',3],['בַּיִת','🏠',2],['בָּנָנָה','🍌',3],['בַּלּוֹן','🎈',2],['גְּזֶר','🥕',2],['גְּלִידָה','🍦',3],['גַּמָּל','🐫',2],['גִּיטָרָה','🎸',3],
       ['דָּג','🐟',1],['דְּבוֹרָה','🐝',3],['הַר','⛰️',1],['וֶרֶד','🌹',2],['זְאֵב','🐺',2],['זֶבְּרָה','🦓',2],['חָתוּל','🐱',2],['חָלָב','🥛',2],['טַוָּס','🦚',2],
       ['יָד','✋',1],['יֶלֶד','👦',2],['יָם','🌊',1],['כֶּלֶב','🐶',2],['כּוֹכָב','⭐',2],['כַּדּוּר','⚽',2],['כַּפִּית','🥄',2],['לֵב','❤️',1],['לִימוֹן','🍋',2],
       ['מְכוֹנִית','🚗',3],['מֶלֶךְ','👑',2],['נָחָשׁ','🐍',2],['נֵר','🕯️',1],['סוּס','🐴',1],['סִירָה','⛵',2],['עֵץ','🌳',1],['עַכְבָּר','🐭',2],['עוּגָה','🎂',2],
       ['פִּיל','🐘',1],['פַּרְפַּר','🦋',2],['צָב','🐢',1],['צְפַרְדֵּעַ','🐸',0],['קוֹף','🐒',1],['קִפּוֹד','🦔',2],['רַכֶּבֶת','🚆',3],['שֶׁמֶשׁ','☀️',2],['שָׁעוֹן','⏰',2],
       ['שׁוּעָל','🦊',2],['תּוּת','🍓',1],['תַּפּוּחַ','🍎',0]]
};
const W = () => WORDS[lang].map(([w,e,s])=>({w,e,s,f:(he()?strip(w):w)[0].toUpperCase()}));
const RHYMES = {
  en: [[['cat','🐱'],['hat','🎩'],['bat','🦇']],[['dog','🐶'],['log','🪵'],['frog','🐸']],[['bee','🐝'],['tree','🌳'],['key','🔑']],[['cake','🎂'],['snake','🐍']],
       [['mouse','🐭'],['house','🏠']],[['star','⭐'],['car','🚗']],[['moon','🌙'],['spoon','🥄']],[['goat','🐐'],['boat','⛵']],[['fox','🦊'],['box','📦'],['socks','🧦']],[['bear','🐻'],['pear','🍐'],['chair','🪑']]],
  he: [[['לִימוֹן','🍋'],['בַּלּוֹן','🎈'],['שָׁעוֹן','⏰'],['אֲוִירוֹן','✈️']],[['פַּרְפַּר','🦋'],['עַכְבָּר','🐭']],[['מְכוֹנִית','🚗'],['כַּפִּית','🥄']],
       [['דֻּבִּי','🧸'],['צְבִי','🦌']],[['סִירָה','⛵'],['גִּיטָרָה','🎸'],['זֶבְּרָה','🦓']],[['יָרֵחַ','🌙'],['תַּפּוּחַ','🍎'],['מַפְתֵּחַ','🔑']]]
};
const BUILD = { en:{5:['cat','dog','sun','hat','bus','pig','fox','bed','cup','bat','box','hen','bug','web','log','van','pen'], 6:['fish','frog','duck','star','crab','drum','hand','milk','ship']},
                he:{5:['דג','צב','לב','נר','הר','יד','ים','סוס','תות'], 6:['פיל','קוף','עץ','חתול','כלב','שמש','בית','ילד','גזר','נחש']} };
const SWAP_EN = [['cat','hat','bat'],['dog','log'],['fox','box'],['hen','pen']];
const FINALS_HE = [['קוֹ','ף','פ','🐒','קוֹף'],['עֵ','ץ','צ','🌳','עֵץ'],['בַּלּוֹ','ן','נ','🎈','בַּלּוֹן'],['יָ','ם','מ','🌊','יָם'],['מֶלֶ','ך','כ','👑','מֶלֶךְ'],['שָׁעוֹ','ן','נ','⏰','שָׁעוֹן'],['לִימוֹ','ן','נ','🍋','לִימוֹן']];
const LAST_HE = ['דָּג','צָב','לֵב','נֵר','הַר','סוּס','פִּיל','תּוּת','חָתוּל','כֶּלֶב','גַּמָּל','חָלָב','נָחָשׁ','גְּזֶר','יָד','זְאֵב'];
const SIGHT = { en:['the','and','is','I','a','see','you','my','we','go','to','it','in','up','can','me','look','like'],
                he:['שֶׁל','אֶת','הוּא','הִיא','אֲנִי','יֵשׁ','זֶה','גַּם','לֹא','כֵּן','עַל','עִם','מָה','מִי'] };
const SENT = { en:['I can see a {w}.','Look at the {w}!','The {w} is big.','I like the {w}.','Here is a {w}.'],
               he:['אֲנִי רוֹאֶה {w}.','הִנֵּה {w}!','יֵשׁ לִי {w}.','אֲנִי אוֹהֵב {w}.'] };
const READ_EN = () => [...BUILD.en[5], ...BUILD.en[6]];

const STATIONS_L = [
  { icon:'🐚', name:{en:'Rhymes Beach',he:'חוף החרוזים'}, intro:{en:'The waves are singing rhymes! Listen closely.',he:'הגלים שרים חרוזים! הקשב טוב.'} },
  { icon:'🔦', name:{en:'Letters Lighthouse',he:'מגדלור האותיות'}, intro:{en:'The lighthouse shines letters into the night!',he:'המגדלור מאיר אותיות בלילה!'} },
  { icon:'🌿', name:{en:'Sounds Jungle',he:'ג׳ונגל הצלילים'}, intro:{en:"Every word in the jungle has a sound. Let's listen!",he:'לכל מילה בג׳ונגל יש צליל. בוא נקשיב!'} },
  { icon:'🛠️', name:{en:'Words Workshop',he:'סדנת המילים'}, intro:{en:'Here we build words out of letters!',he:'כאן בונים מילים מאותיות!'} },
  { icon:'📜', name:{en:'Stories Cave',he:'מערת הסיפורים'}, intro:{en:"The treasure is hidden behind a story. Let's read!",he:'האוצר מוסתר מאחורי סיפור. בוא נקרא!'} }
];
const STICKERS_L = ['🐚','🔦','🦁','🧩','📖'];
const LEVELS_L = {
  4:{ title:{en:'Little Listener',he:'אוזן קשבת'}, em:'👂', cls:'a4', sub:{en:'Rhymes, syllables and first letters',he:'חרוזים, הברות ואותיות ראשונות'},
      plan:[ ['rhyme','rhyme','letterFind','trace'],['nameLetter','letterFind','popLetter','clap'],['letterPic','clap','rhyme','letterFind'],
             ['trace','letterPic','popLetter','match'],['rhyme','clap','letterPic','nameLetter'] ] },
  5:{ title:{en:'Letters Explorer',he:'חוקר אותיות'}, em:'🔤', cls:'a5', sub:{en:'Letter sounds, ABC order, first words',he:'צלילי אותיות, סדר הא-ב, מילים ראשונות'},
      plan:[ ['firstLetter','caseMatch','clap','trace'],['sameStart','abcOrder','firstLetter','popLetter'],['build','firstLetter','match','caseMatch'],
             ['trace','build','sameStart','abcOrder'],['build','match','firstLetter','clap'] ] },
  6:{ title:{en:'Young Reader',he:'קורא צעיר'}, em:'📖', cls:'a6', sub:{en:'Reading words, sight words and sentences',he:'קריאת מילים, ניקוד ואותיות סופיות'},
      plan:[ ['lastLetter','readWord','trace','swap'],['build','sightPop','vowel','readWord'],['readWord','lastLetter','sightPop','build'],
             ['swap','vowel','sentence','trace'],['sentence','build','sightPop','sentence'] ] }
};

function distinctWords(words,k){ const out=[pick(words)]; for(const w of shuffle(words)){ if(out.length>=k) break; if(out.every(o=>!alike(o.f,w.f))) out.push(w); } return out; }
function threePics(pool){ const ws=[]; for(const x of shuffle(pool)){ if(ws.length>=3) break; if(!ws.some(o=>o.e===x.e)) ws.push(x); } return ws; }
const picOpts = arr => arr.map(x=>({label:cr(x.e), value:x.w}));
const letOpts = arr => arr.map(x=>({label:x, value:x}));

function genL(type){
  const H=he(), n = age===4?3:4, words=W();
  let q;
  switch(type){
    case 'letterFind': { const L=pick(LET()); const o=shuffle([L,...similar(L,n-1)]);
      q={t:()=>H?`איפה האות ${L}?`:`Find the letter ${L}!`, sp:()=>H?`איפה האות ${lname(L)}?`:`Find the letter ${lname(L)}!`,
         visual:'<span class="cr m-wiggle">🔎</span>', opts:letOpts(o), ans:L}; break; }
    case 'nameLetter': { const first=(H?strip(nm()):nm()).trim()[0]||'';
      const L = H ? (HE_LET.includes(first)?first:null) : (/[a-z]/i.test(first)?first.toUpperCase():null);
      if(!L) return genL('letterFind');
      const o=shuffle([L,...similar(L,n-1)]);
      q={t:()=>H?`מצא את האות הראשונה בשם שלך!`:`Find the first letter of your name!`, sp:()=>H?`${nm()}, מצא את האות הראשונה בשם שלך!`:`${nm()}, find the first letter of your name!`,
         visual:`<span class="bigword" dir="auto">${esc(nm())}</span>`, opts:letOpts(o), ans:L}; break; }
    case 'rhyme': { const R=RHYMES[lang]; const gi=rnd(0,R.length-1); const [a,b]=shuffle(R[gi]).slice(0,2);
      const others=shuffle(R.filter((_,i)=>i!==gi)).slice(0,2).map(g=>pick(g)); const opts=shuffle([b,...others]);
      q={t:()=>H?`מה מתחרז עם ${a[0]}?`:`Which one rhymes with “${a[0]}”?`, sp:()=>(H?`מה מתחרז עם ${a[0]}? `:`Which one rhymes with ${a[0]}? `)+listSay(opts.map(x=>x[0])),
         visual:`${cr(a[1])}<span class="bigword" dir="auto">${a[0]}</span>`, opts:opts.map(x=>({label:cr(x[1]),value:x[0]})), ans:b[0]}; break; }
    case 'clap': { const sy = age===4 ? rnd(1,3) : rnd(1,3); const cand=words.filter(x=>x.s===sy); const w=pick(cand.length?cand:words.filter(x=>x.s>0));
      q={wide:true, t:()=>H?`תופף פעם אחת לכל הברה: ${w.w}`:`Drum once for each part of “${w.w}”`,
         sp:()=>H?`בוא נתופף! ${w.w}. תופף על התוף פעם אחת לכל הברה במילה ${w.w}.`:`Let's drum! ${w.w}. Tap the drum once for each part of the word ${w.w}.`,
         mount:el=>mountClap(el,w)}; break; }
    case 'letterPic': { const ws=distinctWords(words,3); const ans=ws[0], L=ans.f; const opts=shuffle(ws);
      q={t:()=>H?`איזו תמונה מתחילה באות ${L}?`:`Which picture starts with ${L}?`, sp:()=>(H?`איזו תמונה מתחילה באות ${lname(L)}? `:`Which picture starts with the letter ${lname(L)}? `)+listSay(opts.map(x=>x.w)),
         visual:`<span class="letter">${L}</span>`, opts:picOpts(opts), ans:ans.w}; break; }
    case 'firstLetter': { const w=pick(words); const o=shuffle([w.f,...soundOthers(w.f,n-1,LET())]);
      q={t:()=>H?'באיזו אות מתחילה המילה?':'What letter does this word start with?', sp:()=>H?`${w.w}. באיזו אות מתחילה המילה ${w.w}?`:`${w.w}. What letter does ${w.w} start with?`,
         visual:cr(w.e), opts:o.map(x=>({label:H?x:x+x.toLowerCase(), value:x})), ans:w.f}; break; }
    case 'sameStart': { const base=pick(words); const same=words.filter(x=>x.f===base.f && x.w!==base.w); if(!same.length) return genL('sameStart');
      const s=pick(same); const others=[]; for(const x of shuffle(words)){ if(others.length>=2) break; if(!alike(x.f,base.f) && !others.some(o=>alike(o.f,x.f))) others.push(x); }
      const opts=shuffle([s,...others]);
      q={t:()=>H?`מה מתחיל באותו צליל כמו ${base.w}?`:`Which one starts like “${base.w}”?`, sp:()=>(H?`מה מתחיל באותו צליל כמו ${base.w}? `:`Which one starts with the same sound as ${base.w}? `)+listSay(opts.map(x=>x.w)),
         visual:cr(base.e), opts:picOpts(opts), ans:s.w}; break; }
    case 'caseMatch': { if(H) return genL('letterFind');
      const U=pick(EN_LET), l=U.toLowerCase(); const o=shuffle([l,...similar(l,n-1)]);
      q={t:()=>`Find the small letter for ${U}!`, sp:()=>`Find the small letter for ${lname(U)}!`, visual:`<span class="letter">${U}</span>`, opts:letOpts(o), ans:l}; break; }
    case 'abcOrder': { const A=LET(); const st=rnd(0,A.length-5); const seq=A.slice(st,st+5);
      q={wide:true, t:()=>H?'גע באותיות לפי סדר הא-ב!':'Tap the letters in ABC order!', mount:el=>mountOrder(el,seq)}; break; }
    case 'popLetter': { const L=pick(LET()); const k=rnd(2,4); const sims=similar(L,3); const dec=Array.from({length:7-k},()=>pick(sims));
      const list=shuffle([...Array.from({length:k},()=>({label:L,hit:true})), ...dec.map(d=>({label:d,hit:false}))]);
      q={wide:true, t:()=>H?`פוצץ את כל הבועות עם האות ${L}!`:`Pop all the bubbles with ${L}!`, sp:()=>H?`פוצץ את כל הבועות עם האות ${lname(L)}!`:`Pop all the bubbles with the letter ${lname(L)}!`,
         mount:el=>mountPop(el,list)}; break; }
    case 'match': { const ws=distinctWords(words,3); const lab=x=>H?x.f:(age>4?x.f+x.f.toLowerCase():x.f);
      q={wide:true, t:()=>H?'התאם כל אות לתמונה שמתחילה בה!':'Match each letter to the picture that starts with it!',
         sp:()=>(H?'התאם כל אות לתמונה שמתחילה בה! ':'Match each letter to the picture that starts with it! ')+listSay(ws.map(x=>x.w)),
         mount:el=>mountMatch(el, ws.map(x=>({L:x.f,label:lab(x),e:x.e,w:x.w})))}; break; }
    case 'trace': { const sets={en:{4:'ABCDEFHILMOTUVY',5:'abcdehilmnorstu',6:'bdgjkpqfy'}, he:{4:'אבגדהלמנסר',5:'אבגדהוזחטיכלמנסעפצקרשת',6:'ךםןףץקשצע'}};
      const L=pick(sets[lang][age].split(''));
      q={wide:true, t:()=>H?`עקוב עם האצבע על האות ${L}!`:`Trace the letter ${L} with your finger!`, sp:()=>H?`עקוב עם האצבע על האות ${lname(L)}!`:`Trace the letter ${lname(L)} with your finger!`,
         mount:el=>mountTrace(el,L)}; break; }
    case 'build': { const p=pick(BUILD[lang][age>=6?6:5]); const info=H?words.find(x=>strip(x.w)===p):words.find(x=>x.w===p); const word=H?info.w:p; const model=age<6;
      q={wide:true, t:()=> model ? (H?`בנה את המילה ${word}!`:`Build the word “${word}”!`) : (H?'איית את המילה!':'Spell the word!'),
         sp:()=>H?`${word}. ${model?'בנה את המילה':'איית את המילה'} ${word}!`:`${word}. ${model?'Build the word':'Spell the word'} ${word}!`,
         mount:el=>mountBuild(el,p.split(''),model?word:'',info.e,word)}; break; }
    case 'lastLetter': {
      if(H){ const w=pick(words.filter(x=>LAST_HE.includes(x.w))); const last=strip(w.w).slice(-1); const stem=w.w.replace(/[א-ת][֑-ׇ]*$/,'');
        q={t:()=>'איזו אות חסרה בסוף המילה?', sp:()=>`${w.w}. איזו אות חסרה בסוף המילה ${w.w}?`,
           visual:`${cr(w.e)}<span class="bigword" dir="rtl">${stem}<span class="blank">?</span></span>`, opts:letOpts(shuffle([last,...soundOthers(last,n-1,HE_LET)])), ans:last}; }
      else { const p=pick(BUILD.en[5]); const w=words.find(x=>x.w===p); const last=p.slice(-1);
        const o=shuffle([last,...soundOthers(last,n-1,EN_LET).map(x=>x.toLowerCase())]);
        q={t:()=>'Which letter is missing at the end?', sp:()=>`${p}. Which letter is missing at the end of ${p}?`,
           visual:`${cr(w.e)}<span class="bigword">${p.slice(0,-1)}<span class="blank">_</span></span>`, opts:letOpts(o), ans:last}; }
      break; }
    case 'vowel': {
      if(H){ const C=pick('למנרס'.split('')); const V=[{d:C+'ָ',s:C+'ָה'},{d:C+'ִ',s:C+'ִי'},{d:C+'וּ',s:C+'וּ'},{d:C+'וֹ',s:C+'וֹ'},{d:C+'ֶ',s:C+'ֶה'}];
        const ch=shuffle(V).slice(0,n); const a=pick(ch);
        q={t:()=>'איזו הברה שומעים?', sp:()=>`הַקְשֵׁב: ${a.s}. ${a.s}. איזו הברה שמעת?`, visual:'<span class="cr m-wiggle">👂</span>', opts:ch.map(x=>({label:x.d,value:x.d})), ans:a.d}; }
      else { const p=pick(BUILD.en[5]); const w=words.find(x=>x.w===p); const v=p[1];
        const o=shuffle([v,...shuffle('aeiou'.split('').filter(x=>x!==v)).slice(0,n-1)]);
        q={t:()=>'Which vowel is missing?', sp:()=>`${p}. Which vowel is missing in ${p}?`,
           visual:`${cr(w.e)}<span class="bigword">${p[0]}<span class="blank">_</span>${p[2]}</span>`, opts:letOpts(o), ans:v}; }
      break; }
    case 'swap': {
      if(H){ const [stem,fin,reg,e,word]=pick(FINALS_HE); const other=pick('ךםןףץ'.split('').filter(x=>x!==fin));
        q={t:()=>'איזו אות באה בסוף המילה?', sp:()=>`${word}. איזו אות באה בסוף המילה ${word}?`,
           visual:`${cr(e)}<span class="bigword" dir="rtl">${stem}<span class="blank">?</span></span>`, opts:letOpts(shuffle([fin,reg,other])), ans:fin}; }
      else { const g=pick(SWAP_EN); const [a,b]=shuffle(g).slice(0,2); const wa=words.find(x=>x.w===a), wb=words.find(x=>x.w===b);
        const third=pick(words.filter(x=>!g.includes(x.w))); const opts=shuffle([wa,wb,third]);
        q={t:()=>`Change the first letter of “${a}” to ${b[0]}. What word is it?`, sp:()=>`${a}. Change the first letter to ${lname(b[0])}. What new word did you make?`,
           visual:`<span class="bigword">${a}</span><span class="op">→</span><span class="bigword"><span class="blank">${b[0]}</span>${a.slice(1)}</span>`, opts:picOpts(opts), ans:b}; }
      break; }
    case 'readWord': { const pool = H ? words.filter(x=>x.s<=2) : words.filter(x=>READ_EN().includes(x.w)); const ws=threePics(pool);
      q={t:()=>H?'קרא את המילה. איזו תמונה מתאימה?':'Read the word. Which picture is it?', visual:`<span class="bigword" dir="auto">${ws[0].w}</span>`, opts:picOpts(shuffle(ws)), ans:ws[0].w}; break; }
    case 'sightPop': { const list=SIGHT[lang]; const sw=pick(list); const k=rnd(2,3); const dec=shuffle(list.filter(x=>x!==sw)).slice(0,7-k);
      const items=shuffle([...Array.from({length:k},()=>({label:sw,hit:true})), ...dec.map(d=>({label:d,hit:false}))]);
      q={wide:true, t:()=>H?`פוצץ את כל הבועות שכתוב בהן: ${sw}`:`Pop every bubble that says “${sw}”!`, sp:()=>H?`פוצץ את כל הבועות שכתוב בהן ${sw}!`:`Pop every bubble that says ${sw}!`,
         mount:el=>mountPop(el,items,true)}; break; }
    case 'sentence': { const pool = H ? words.filter(x=>x.s<=2) : words.filter(x=>READ_EN().includes(x.w)); const ws=threePics(pool); const s=pick(SENT[lang]).replace('{w}',ws[0].w);
      q={t:()=>H?'קרא את המשפט. איזו תמונה מתאימה?':'Read the sentence. Which picture goes with it?', visual:`<span class="bigword sent" dir="auto">${s}</span>`, opts:picOpts(shuffle(ws)), ans:ws[0].w}; break; }
  }
  q.lang=lang; q.type=type; return q;
}

/* ---------- Letter Island hands-on widgets ---------- */
function mountClap(el, w){
  let n=0;
  el.innerHTML=`<button class="clapword" id="cw">${cr(w.e)}<span dir="auto">${w.w}</span></button>
    <button class="drum" id="drum" aria-label="drum">🥁</button><div class="claps" id="claps"></div><div class="row" id="crow"><button class="btn ghost iconb" id="cclr" aria-label="Start again">${ICON.undo}</button></div>`;
  $('#cw').onclick=()=>speak(w.w); el.dataset.a=w.s;
  $('#drum').onclick=()=>{ if(busy) return; n++; $('#claps').insertAdjacentHTML('beforeend','<span class="cl">👏</span>'); tone([300+n*90],.08);
    const d=$('#drum'); d.classList.remove('hit'); void d.offsetWidth; d.classList.add('hit'); };
  $('#cclr').onclick=()=>{ n=0; $('#claps').innerHTML=''; };
  checkBtn($('#crow'), ()=>{ if(n===w.s) correct(); else { miss(pick(t().reclap)); n=0; $('#claps').innerHTML=''; } });
}

function mountTrace(el, L){
  const WD=440, Y=WD/2+(he()?12:26);
  const fam = he() ? '700 300px "Noto Sans Hebrew", Arial, sans-serif' : '800 330px "Nunito", Arial, sans-serif';
  el.innerHTML=`<div class="tracebox"><canvas class="tracecv" width="${WD}" height="${WD}" aria-label="Trace the letter"></canvas></div><div class="row" id="trow"><button class="btn ghost iconb" id="tclr" aria-label="Clear">${ICON.undo}</button></div>`;
  const cv=el.querySelector('canvas'), g=cv.getContext('2d');
  const ink=document.createElement('canvas'); ink.width=ink.height=WD; const ix=ink.getContext('2d');
  const col=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim()||'#999';
  const glyph=(x,fill,stroke,lw,dash)=>{ x.font=fam; x.textAlign='center'; x.textBaseline='middle';
    if(fill){ x.fillStyle=fill; x.fillText(L,WD/2,Y); }
    if(stroke){ x.setLineDash(dash||[]); x.lineWidth=lw; x.lineJoin='round'; x.strokeStyle=stroke; x.strokeText(L,WD/2,Y); x.setLineDash([]); } };
  const mask=lw=>{ const c=document.createElement('canvas'); c.width=c.height=WD; const x=c.getContext('2d'); glyph(x,'#000',lw?'#000':null,lw); return x.getImageData(0,0,WD,WD).data; };
  let shape=null, tol=null;
  const draw=()=>{ g.clearRect(0,0,WD,WD); glyph(g,col('--sand'),col('--ink-soft'),4,[12,12]); g.drawImage(ink,0,0); };
  const ready=()=>{ shape=mask(0); tol=mask(56); draw(); };
  draw(); try{ document.fonts.load(fam).then(ready,ready); }catch(e){ ready(); }
  let down=false, last=null;
  const pos=e=>{ const r=cv.getBoundingClientRect(); return [(e.clientX-r.left)*WD/r.width,(e.clientY-r.top)*WD/r.height]; };
  const line=(a,b)=>{ const c=col('--coral'); ix.strokeStyle=c; ix.fillStyle=c; ix.lineWidth=44; ix.lineCap='round'; ix.lineJoin='round'; ix.beginPath();
    if(a[0]===b[0]&&a[1]===b[1]){ ix.arc(a[0],a[1],22,0,Math.PI*2); ix.fill(); }   // a plain tap leaves a dot
    else { ix.moveTo(a[0],a[1]); ix.lineTo(b[0],b[1]); ix.stroke(); }
    draw(); };
  cv.addEventListener('pointerdown',e=>{ if(busy) return; e.preventDefault(); try{cv.setPointerCapture(e.pointerId)}catch(_){} down=true; last=pos(e); line(last,last); });
  cv.addEventListener('pointermove',e=>{ if(!down) return; const p=pos(e); line(last,p); last=p; });
  const up=()=>{ if(!down) return; down=false; score(false); };
  cv.addEventListener('pointerup',up); cv.addEventListener('pointercancel',up);
  const clear=()=>{ ix.clearRect(0,0,WD,WD); draw(); };
  $('#tclr').onclick=clear;
  function score(final){
    if(!shape||busy) return;
    const d=ix.getImageData(0,0,WD,WD).data; let S=0,C=0,K=0,O=0;
    for(let i=3;i<d.length;i+=12){ const s=shape[i]>80, k=d[i]>80; if(s){S++; if(k)C++;} if(k){K++; if(tol[i]<80)O++;} }
    const cov=S?C/S:0, out=K?O/K:0;
    if(cov>=0.62 && out<=0.35){ correct(); return; }
    if(final){ if(out>0.35){ miss(t().offtrace); setTimeout(clear,700); } else miss(t().retrace); }
  }
  mountTrace.score = score;   // used by the self-test
  checkBtn($('#trow'), ()=>score(true));
}

function mountBuild(el, letters, model, emoji, word){
  const pool = he() ? HE_LET : 'abcdefghijklmnoprstuvwz'.split('');
  const tiles = shuffle([...letters, ...shuffle(pool.filter(x=>!letters.includes(x))).slice(0,2)]);
  el.innerHTML = `<button class="buildpic" id="bp">${cr(emoji)}${model?`<span class="wmodel" dir="auto">${model}</span>`:''}</button>
    <div class="slots">${letters.map((_,i)=>`<button class="slot" data-i="${i}" aria-label="slot ${i+1}"></button>`).join('')}</div>
    <div class="tiles">${tiles.map(c=>`<button class="tile" data-c="${c}">${c}</button>`).join('')}</div>`;
  $('#bp').onclick=()=>speak(word); el.dataset.a=letters.join('|');
  const slots=[...el.querySelectorAll('.slot')];
  el.querySelectorAll('.tile').forEach(tl=>tl.onclick=()=>{ if(busy||tl.classList.contains('used')) return;
    const s=slots.find(x=>!x.dataset.c); if(!s) return;
    s.dataset.c=tl.dataset.c; s.textContent=tl.dataset.c; s._tile=tl; tl.classList.add('used'); tone([700],.06);
    if(slots.every(x=>x.dataset.c)) check(); });
  slots.forEach(s=>s.onclick=()=>{ if(busy||!s.dataset.c) return; s._tile.classList.remove('used'); delete s.dataset.c; s.textContent=''; });
  function check(){
    if(slots.map(s=>s.dataset.c).join('')===letters.join('')){ slots.forEach(s=>s.classList.add('good')); correct(); return; }
    miss();
    slots.forEach((s,i)=>{ if(s.dataset.c!==letters[i]){ s.classList.add('bad');
      setTimeout(()=>{ s.classList.remove('bad'); if(s._tile) s._tile.classList.remove('used'); delete s.dataset.c; s.textContent=''; },700); } });
  }
}

function mountMatch(el, items){
  el.innerHTML = `<div class="match"><div class="mcol">${shuffle(items).map(x=>`<button class="mlet" data-l="${x.L}">${x.label}</button>`).join('')}</div>
    <div class="mcol">${shuffle(items).map(x=>`<button class="mpic" data-l="${x.L}" data-w="${x.w}">${cr(x.e)}</button>`).join('')}</div></div>`;
  let sel=null, left=items.length;
  const tryPic=p=>{
    if(busy||p.classList.contains('ok')) return;
    if(!sel){ speak(p.dataset.w); return; }
    if(p.dataset.l===sel.dataset.l){ p.classList.add('ok'); sel.classList.add('ok'); sel.classList.remove('sel'); sel=null; tone([700,900],.07); if(--left===0) correct(); }
    else { p.classList.remove('no'); void p.offsetWidth; p.classList.add('no'); miss(); }
  };
  el.querySelectorAll('.mlet').forEach(b=>b.addEventListener('pointerdown',()=>{ if(busy||b.classList.contains('ok')) return;
    el.querySelectorAll('.mlet').forEach(x=>x.classList.remove('sel')); sel=b; b.classList.add('sel'); tone([600],.05); }));
  el.addEventListener('pointerup',e=>{ const hit=(e.target.closest&&e.target.closest('.mpic')) || document.elementFromPoint(e.clientX,e.clientY);
    const p=hit&&hit.closest&&hit.closest('.mpic'); if(p&&el.contains(p)) tryPic(p); });
}

/* =====================================================================
   DISCOVERIES REEF — science & nature (EYFS "Understanding the World", NGSS K–1, Israeli מדע וטכנולוגיה בגן)
   ===================================================================== */
const tx = (en,hb) => he() ? hb : en;
const S_EATS = [['🐰','🥕','rabbit','הארנב',0],['🐒','🍌','monkey','הקוף',0],['🐼','🎋','panda','הפנדה',1],['🐿️','🌰','squirrel','הסנאי',0],['🐶','🦴','dog','הכלב',0],
  ['🐱','🐟','cat','החתול',0],['🐝','🌸','bee','הדבורה',1],['🐦','🐛','bird','הציפור',1],['🐄','🌾','cow','הפרה',1],['🐭','🧀','mouse','העכבר',0]];
const S_GIVES = [['🐄','🥛','cow','הפרה'],['🐔','🥚','chicken','התרנגולת'],['🐝','🍯','bee','הדבורה'],['🐑','🧶','sheep','הכבשה']];
const S_SENSES = [{e:'🌸',en:'smell the flower',he:'להריח את הפרח',a:'👃'},{e:'🎵',en:'hear the music',he:'לשמוע את המוזיקה',a:'👂'},{e:'🌈',en:'see the rainbow',he:'לראות את הקשת',a:'👁️'},
  {e:'🍦',en:'taste the ice cream',he:'לטעום את הגלידה',a:'👅'},{e:'🧸',en:'feel the soft teddy',he:'להרגיש את הדובי הרך',a:'✋'},{e:'🔔',en:'hear the bell',he:'לשמוע את הפעמון',a:'👂'},
  {e:'🍕',en:'smell the pizza',he:'להריח את הפיצה',a:'👃'},{e:'🍋',en:'taste the sour lemon',he:'לטעום את הלימון החמוץ',a:'👅'},{e:'⭐',en:'see the stars',he:'לראות את הכוכבים',a:'👁️'},{e:'🧊',en:'feel the cold ice',he:'להרגיש את הקרח הקר',a:'✋'}];
const ORGANS = ['👁️','👂','👃','👅','✋'];
const ALIVE = ['🐶','🌳','🐟','🌻','🐦','🐛','🐢','🌵'], NOTALIVE = ['🪨','🚗','⚽','🪑','🧸','✏️','🔑','☂️'];
const NEEDS = [{v:'🌱',en:'What does a plant need to grow?',he:'מה צמח צריך כדי לגדול?',good:['💧','☀️']},{v:'🐟',en:'What does a fish need to live?',he:'מה דג צריך כדי לחיות?',good:['💧']},
  {v:'🧒',en:'What helps you grow big and strong?',he:'מה עוזר לך לגדול ולהיות חזק?',good:['🥦','🍎','💤']}];
const JUNK = ['🍭','🧸','📺','🎮','👟','🚗'];
const WEATHER = [{icon:'❄️',en:"It's snowing!",he:'יורד שלג!',good:['🧣','🧤','🧥']},{icon:'🌧️',en:"It's raining!",he:'יורד גשם!',good:['☂️','🥾']},{icon:'☀️',en:"It's very hot!",he:'חם מאוד!',good:['🕶️','👒','🩳']}];
const DAYNIGHT = {day:['☀️','🌈','🐓','🏖️','🦋'], night:['🌙','⭐','🦉','😴','🦇']};
const SEASONS = [{k:'winter',icon:'❄️',en:'Winter',he:'חורף',e:['⛄','🧣','☔','🌨️']},{k:'spring',icon:'🌸',en:'Spring',he:'אביב',e:['🌷','🐝','🐣','🌸']},
  {k:'summer',icon:'☀️',en:'Summer',he:'קיץ',e:['🏖️','🍉','🍦','🩳']},{k:'autumn',icon:'🍂',en:'Autumn',he:'סתיו',e:['🍁','🍂','🌰','🍄']}];
const HOMES = [{k:'sea',icon:'🌊',en:'Sea',he:'ים',e:['🐠','🐙','🐬','🦈','🦀','🐳']},{k:'forest',icon:'🌲',en:'Forest',he:'יער',e:['🐿️','🦉','🦌','🐻','🦊','🐇']},
  {k:'desert',icon:'🏜️',en:'Desert',he:'מדבר',e:['🐪','🦂','🦎']}];
const FLOATS = ['🦆','🍃','🪵','🎈','⚽','🍎','🧽'], SINKS = ['🪨','🔑','🪙','⚓','🔨','🥄'];
const CYCLES = [{en:'chicken',he:'תרנגולת',s:['🥚','🐣','🐥','🐔']},{en:'sunflower',he:'חמנייה',s:['🌰','🌱','🌿','🌻']},{en:'butterfly',he:'פרפר',s:['🥚','🐛','🦋']},{en:'person',he:'אדם',s:['👶','🧒','🧑','🧓']}];
const BODY = [['🧠','think','לחשוב'],['❤️','pump blood around your body','להזרים דם בגוף'],['🫁','breathe','לנשום'],['🦷','chew your food','ללעוס את האוכל'],['💪','lift and move','להרים ולזוז'],['🦴','stand up straight','לעמוד ישר']];
const WATER = [{q:{en:'What happens to ice in the hot sun?',he:'מה קורה לקרח בשמש החמה?'},v:'🧊 ☀️',a:'💧'},{q:{en:'What happens to water in the freezer?',he:'מה קורה למים במקפיא?'},v:'💧 ❄️',a:'🧊'},
  {q:{en:'What comes out of a pot of boiling water?',he:'מה יוצא מסיר של מים רותחים?'},v:'🍲 🔥',a:'♨️'}];
const WATER_LAB = {'💧':['Water','מים'],'🧊':['Ice','קרח'],'♨️':['Steam','אדים']};
const PUSHPULL = [{e:'⚽',en:'kick a ball',he:'לבעוט בכדור',a:'push'},{e:'🛒',en:'move a shopping cart forward',he:'להזיז עגלת קניות קדימה',a:'push'},{e:'🔘',en:'press a button',he:'ללחוץ על כפתור',a:'push'},
  {e:'🪁',en:'fly a kite on a string',he:'להעיף עפיפון בחוט',a:'pull'},{e:'🛷',en:'drag a sled by its rope',he:'לגרור מזחלת בחבל',a:'pull'},{e:'🚂',en:'bring a toy train closer with a string',he:'לקרב רכבת צעצוע בעזרת חוט',a:'pull'}];
const METALS = ['🔑','🪙','📎','🔩','✂️'], NONMETAL = ['🧸','🍎','🪵','✏️','🧦','🎈','🍃'];
const RECYCLE = [{k:'paper',icon:'📄',en:'Paper',he:'נייר',c:'#2f7fd8',e:['📰','📦','✉️']},{k:'plastic',icon:'🧴',en:'Plastic',he:'פלסטיק',c:'#f08a24',e:['🧴','🥤','🪣']},{k:'glass',icon:'🍾',en:'Glass',he:'זכוכית',c:'#8e5bd6',e:['🍾','🍶']}];
const iconWord = (icon,en,hb) => `${icon}<span class="lw">${tx(en,hb)}</span>`;

const STATIONS_S = [
  { icon:'🐠', name:{en:'Animals Reef',he:'שונית החיות'}, intro:{en:"The reef is full of animals. Let's get to know them!",he:'השונית מלאה בחיות. בוא נכיר אותן!'} },
  { icon:'🌱', name:{en:'Seeds Garden',he:'גינת הזרעים'}, intro:{en:"Everything grows in the garden. Let's find out how!",he:'בגינה הכול צומח. בוא נגלה איך!'} },
  { icon:'⛅', name:{en:'Weather Hill',he:'גבעת מזג האוויר'}, intro:{en:'From the hill we can see the sky. What will the weather be?',he:'מהגבעה רואים את השמיים. איזה מזג אוויר יהיה?'} },
  { icon:'🧪', name:{en:'Experiments Lab',he:'מעבדת הניסויים'}, intro:{en:'Goggles on. Time for experiments!',he:'משקפי מגן על העיניים. הגיע הזמן לניסויים!'} },
  { icon:'🌍', name:{en:'Nature Island',he:'אי הטבע'}, intro:{en:"The last island! Let's take care of nature and find the treasure.",he:'האי האחרון! בוא נשמור על הטבע ונמצא את האוצר.'} }
];
const STICKERS_S = ['🐠','🌻','🌈','🧪','🌍'];
const LEVELS_S = {
  4:{ title:{en:'Little Explorer',he:'חוקר קטן'}, em:'🔍', cls:'a4', sub:{en:'Senses, animals, living things, weather',he:'חושים, בעלי חיים, חי ודומם, מזג אוויר'},
      plan:[ ['eats','sortHome2','senses','eats'],['needs','living','sortLiving','senses'],['wear','pack','dayNight','senses'],
             ['floatSink','living','floatSink','senses'],['sortLiving','eats','pack','living'] ] },
  5:{ title:{en:'Nature Detective',he:'בלש הטבע'}, em:'🕵️', cls:'a5', sub:{en:'Habitats, seasons, plants, float or sink',he:'בתי גידול, עונות, צמחים, צף או שוקע'},
      plan:[ ['gives','sortHabitat','habitat','gives'],['needs','seasons','sortLiving','needs'],['seasons','pack','dayNight','seasons'],
             ['floatSink','sortFloat','dayNight','floatSink'],['sortHabitat','gives','seasons','habitat'] ] },
  6:{ title:{en:'Young Scientist',he:'מדען צעיר'}, em:'🔬', cls:'a6', sub:{en:'Life cycles, magnets, the body, recycling',he:'מחזורי חיים, מגנטים, גוף האדם, מיחזור'},
      plan:[ ['lifeCycle','bodyPart','habitat','lifeCycle'],['lifeCycle','needs','recycle','bodyPart'],['states','seasons','pushPull','states'],
             ['magnet','pushPull','floatSink','magnet'],['recycle','bodyPart','lifeCycle','states'] ] }
};

function genS(type){
  const n = age===4 ? 3 : 4; let q;
  const sortQ = (enT,heT,bins,per) => { const items=bins.flatMap(b=>shuffle(b.e).slice(0,per).map(e=>({e,k:b.k})));
    return {wide:true, t:L2(()=>enT,()=>heT), mount:el=>mountSort(el, bins.map(b=>({k:b.k,icon:b.icon,label:tx(b.en,b.he),c:b.c})), items)}; };
  switch(type){
    case 'eats': { const x=pick(S_EATS); const opts=shuffle([x,...shuffle(S_EATS.filter(y=>y!==x)).slice(0,n-1)]);
      q={t:L2(()=>`What does the ${x[2]} like to eat?`,()=>`מה ${x[3]} ${x[4]?'אוהבת':'אוהב'} לאכול?`), visual:cr(x[0]), opts:opts.map(y=>({label:cr(y[1]),value:y[1]})), ans:x[1]}; break; }
    case 'gives': { const x=pick(S_GIVES); const opts=shuffle([x,...shuffle(S_GIVES.filter(y=>y!==x)).slice(0,n-1)]);
      q={t:L2(()=>`What do we get from the ${x[2]}?`,()=>`מה מקבלים מ${x[3]}?`), visual:cr(x[0]), opts:opts.map(y=>({label:cr(y[1]),value:y[1]})), ans:x[1]}; break; }
    case 'senses': { const x=pick(S_SENSES); const opts=shuffle([x.a,...shuffle(ORGANS.filter(o=>o!==x.a)).slice(0,n-1)]);
      q={t:L2(()=>`What do you use to ${x.en}?`,()=>`במה משתמשים כדי ${x.he}?`), visual:cr(x.e), opts:opts.map(o=>({label:o,value:o})), ans:x.a}; break; }
    case 'living': { const alive=Math.random()<.5; const one=pick(alive?ALIVE:NOTALIVE), rest=shuffle(alive?NOTALIVE:ALIVE).slice(0,n-1);
      q={t:L2(()=>alive?'Which one is alive?':'Which one is NOT alive?',()=>alive?'מי מהם חי?':'מי מהם לא חי?'), visual:'', opts:shuffle([one,...rest]).map(e=>({label:cr(e),value:e})), ans:one}; break; }
    case 'needs': { const x=pick(NEEDS); const g=pick(x.good);
      q={t:L2(()=>x.en,()=>x.he), visual:cr(x.v), opts:shuffle([g,...shuffle(JUNK).slice(0,n-1)]).map(e=>({label:cr(e),value:e})), ans:g}; break; }
    case 'wear': { const w=pick(WEATHER); const g=pick(w.good); const bad=shuffle(WEATHER.filter(x=>x!==w).flatMap(x=>x.good)).slice(0,n-1);
      q={t:L2(()=>`${w.en} What should ${nm()} take?`,()=>`${w.he} מה ${nm()} צריך לקחת?`), visual:`<span class="big">${w.icon}</span>`, opts:shuffle([g,...bad]).map(e=>({label:cr(e),value:e})), ans:g}; break; }
    case 'pack': { const w=pick(WEATHER); const bad=shuffle(WEATHER.filter(x=>x!==w).flatMap(x=>x.good)).slice(0,3);
      q={wide:true, t:L2(()=>`${w.en} Put everything ${nm()} needs in the bag!`,()=>`${w.he} שים בתיק את כל מה ש${nm()} צריך!`), mount:el=>mountPack(el,w.icon,w.good,bad)}; break; }
    case 'dayNight': { const day=Math.random()<.5; const e=pick(day?DAYNIGHT.day:DAYNIGHT.night);
      q={t:L2(()=>'Do we see this in the day or at night?',()=>'מתי רואים את זה? ביום או בלילה?'), visual:cr(e),
         opts:[{label:iconWord('☀️','Day','יום'),value:'day'},{label:iconWord('🌙','Night','לילה'),value:'night'}], ans:day?'day':'night', small:true}; break; }
    case 'seasons': { const s=pick(SEASONS); const two=shuffle(s.e).slice(0,2);
      q={t:L2(()=>'Which season is it?',()=>'איזו עונה זו?'), visual:two.map(e=>cr(e)).join(''), opts:shuffle(SEASONS).map(x=>({label:iconWord(x.icon,x.en,x.he),value:x.k})), ans:s.k, small:true}; break; }
    case 'habitat': { const h=pick(HOMES); const e=pick(h.e);
      q={t:L2(()=>'Where does this animal live?',()=>'איפה החיה הזאת גרה?'), visual:cr(e), opts:HOMES.map(x=>({label:iconWord(x.icon,x.en,x.he),value:x.k})), ans:h.k, small:true}; break; }
    case 'sortHome2': q=sortQ('Help the animals get home! Drag each one to where it lives.','עזור לחיות להגיע הביתה! גרור כל חיה למקום שבו היא גרה.',[HOMES[0],{...HOMES[1],en:'Land',he:'יבשה'}],3); break;
    case 'sortHabitat': q=sortQ('Help the animals get home! Drag each one to where it lives.','עזור לחיות להגיע הביתה! גרור כל חיה למקום שבו היא גרה.',HOMES,2); break;
    case 'sortLiving': q=sortQ('Sort them: alive or not alive?','מיין: חי או דומם?',[{k:'alive',icon:'💚',en:'Alive',he:'חי',e:ALIVE},{k:'not',icon:'🪨',en:'Not alive',he:'דומם',e:NOTALIVE}],3); break;
    case 'sortFloat': q=sortQ('Guess: what floats and what sinks? Drag them!','נחש: מה צף ומה שוקע? גרור!',[{k:'f',icon:'🛟',en:'Floats',he:'צף',e:FLOATS},{k:'s',icon:'⚓',en:'Sinks',he:'שוקע',e:SINKS}],3); break;
    case 'recycle': q=sortQ('Recycle! Drag each thing into the right bin.','ממחזרים! גרור כל דבר לפח הנכון.',RECYCLE,2); break;
    case 'floatSink': { const fl=Math.random()<.5; const e=pick(fl?FLOATS:SINKS);
      q={wide:true, t:L2(()=>'Will it float or sink? Guess, then watch!',()=>'האם זה יצוף או ישקע? נחש ותראה!'), mount:el=>mountFloat(el,e,fl)}; break; }
    case 'lifeCycle': { const c=pick(CYCLES);
      q={wide:true, t:L2(()=>`How does a ${c.en} grow? Tap from first to last!`,()=>`מחזור החיים של ${c.he}: גע מהראשון לאחרון!`), mount:el=>mountOrder(el,c.s)}; break; }
    case 'bodyPart': { const x=pick(BODY); const opts=shuffle([x,...shuffle(BODY.filter(y=>y!==x)).slice(0,n-1)]);
      q={t:L2(()=>`Which body part helps you ${x[1]}?`,()=>`איזה איבר עוזר לך ${x[2]}?`), visual:'', opts:opts.map(y=>({label:y[0],value:y[0]})), ans:x[0]}; break; }
    case 'states': { const x=pick(WATER);
      q={t:L2(()=>x.q.en,()=>x.q.he), visual:`<span class="big">${x.v}</span>`, opts:shuffle(Object.keys(WATER_LAB)).map(k=>({label:iconWord(k,...WATER_LAB[k]),value:k})), ans:x.a, small:true}; break; }
    case 'pushPull': { const x=pick(PUSHPULL);
      q={t:L2(()=>`To ${x.en}, do you push or pull?`,()=>`כדי ${x.he}, דוחפים או מושכים?`), visual:cr(x.e),
         opts:[{label:iconWord('👐','Push','דוחפים'),value:'push'},{label:iconWord('🪢','Pull','מושכים'),value:'pull'}], ans:x.a, small:true}; break; }
    case 'magnet': { const m=shuffle(METALS).slice(0,3), o=shuffle(NONMETAL).slice(0,4);
      q={wide:true, t:L2(()=>'Move the magnet 🧲 and find everything it picks up!',()=>'הזז את המגנט 🧲 ומצא את כל מה שהוא מושך!'), mount:el=>mountMagnet(el,m,o)}; break; }
  }
  return q;
}

/* ---------- Discoveries Reef hands-on widgets ---------- */
function mountSort(el, bins, items){
  let left=items.length, sel=null;
  el.innerHTML = `<div class="tray">${shuffle(items).map(x=>cr(x.e,'dr sortit').replace('<span ',`<span data-k="${x.k}" `)).join('')}</div>
    <div class="bins">${bins.map(b=>`<div class="bin" data-k="${b.k}" style="--bc:${b.c||'var(--sand-dark)'}"><div class="bhead"><span class="bic">${b.icon}</span><span class="blab">${b.label}</span></div><div class="bin-in"></div></div>`).join('')}</div>`;
  const tray=el.querySelector('.tray'), binEls=[...el.querySelectorAll('.bin')];
  const binAt=(x,y)=>binEls.find(b=>{ const r=b.getBoundingClientRect(); return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom; });
  const drop=(item,bin)=>{ item.classList.remove('picked'); if(!bin) return;
    if(bin.dataset.k===item.dataset.k){ bin.querySelector('.bin-in').appendChild(item); item.classList.add('placed'); tone([700,900],.06); if(--left===0) correct(); }
    else { bin.classList.remove('no'); void bin.offsetWidth; bin.classList.add('no'); miss(); } };
  tray.querySelectorAll('.sortit').forEach(item=>item.addEventListener('pointerdown',e=>{
    if(busy||item.classList.contains('placed')) return; e.preventDefault(); try{item.setPointerCapture(e.pointerId)}catch(_){}
    const r=item.getBoundingClientRect(), sx=e.clientX, sy=e.clientY, ox=sx-r.left, oy=sy-r.top; let moved=false;
    const mv=ev=>{ if(!moved&&Math.hypot(ev.clientX-sx,ev.clientY-sy)<8) return; if(!moved){ moved=true; item.classList.add('dragging'); }
      item.style.left=(ev.clientX-ox)/appZoom()+'px'; item.style.top=(ev.clientY-oy)/appZoom()+'px'; const h=binAt(ev.clientX,ev.clientY); binEls.forEach(b=>b.classList.toggle('hot',b===h)); };
    const up=ev=>{ item.removeEventListener('pointermove',mv); item.removeEventListener('pointerup',up); item.removeEventListener('pointercancel',up);
      item.classList.remove('dragging'); item.style.left=item.style.top=''; binEls.forEach(b=>b.classList.remove('hot'));
      if(moved) drop(item, binAt(ev.clientX,ev.clientY));
      else { tray.querySelectorAll('.picked').forEach(x=>x.classList.remove('picked')); item.classList.add('picked'); sel=item; tone([600],.05); } };   // tap = pick it up, then tap a bin
    item.addEventListener('pointermove',mv); item.addEventListener('pointerup',up); item.addEventListener('pointercancel',up); }));
  binEls.forEach(b=>b.addEventListener('click',()=>{ if(busy||!sel||sel.classList.contains('placed')) return; const it=sel; sel=null; drop(it,b); }));
}
function mountPack(el, icon, goods, bads){
  el.innerHTML = `<div class="tray"></div><div class="basket"><div class="bk-ic">🎒</div><div class="bk-in"></div><div class="bk-ic wx">${icon}</div></div>`;
  const tray=el.querySelector('.tray'), bin=el.querySelector('.bk-in'), basket=el.querySelector('.basket');
  crN=0; shuffle([...goods.map(e=>({e,g:1})),...bads.map(e=>({e,g:0}))]).forEach(x=>tray.insertAdjacentHTML('beforeend', cr(x.e,'dr').replace('<span ',`<span data-g="${x.g}" `)));
  tray.querySelectorAll('.dr').forEach(item=>makeDraggable(item,tray,bin,basket));
  checkBtn(el, ()=>{ const inBag=[...bin.querySelectorAll('.dr')]; (inBag.length===goods.length && inBag.every(x=>x.dataset.g==='1')) ? correct() : miss(tx('Hmm, check the bag again!','הממ, בדוק שוב את התיק!')); });
}
function mountFloat(el, e, floats){
  el.innerHTML = `<div class="tank"><div class="water"></div><span class="fobj">${cr(e)}</span></div>
    <div class="row"><button class="btn fbtn" data-v="1">🛟 ${tx('Floats','צף')}</button><button class="btn fbtn" data-v="0">⚓ ${tx('Sinks','שוקע')}</button></div>`;
  el.dataset.a = floats ? '1' : '0';
  const obj=el.querySelector('.fobj');
  el.querySelectorAll('.fbtn').forEach(b=>b.onclick=()=>{ if(busy||obj.classList.contains('go')) return; const guess=b.dataset.v==='1';
    obj.classList.add('go', floats?'fl':'sk'); tone([floats?660:220],.15);
    setTimeout(()=>{ if(guess===floats) correct();
      else { miss(floats?tx('It floats! It is light.','זה צף! זה קל.'):tx('It sinks! It is heavy.','זה שוקע! זה כבד.')); setTimeout(()=>obj.classList.remove('go','fl','sk'),1600); } },1300); });
}
function mountMagnet(el, metals, others){
  let left=metals.length;
  el.innerHTML = `<div class="mfield">${shuffle([...metals.map(e=>({e,m:1})),...others.map(e=>({e,m:0}))]).map(x=>`<span class="mitem" data-m="${x.m}">${x.e}</span>`).join('')}</div>
    <div class="mdock"><span class="magnet" id="mag" aria-label="magnet">🧲</span><div class="held" id="held"></div></div>`;
  const mag=$('#mag'), held=$('#held'), items=[...el.querySelectorAll('.mitem')];
  const touch=(x,y)=>{ items.forEach(it=>{ if(busy||it.classList.contains('stuck')) return; const r=it.getBoundingClientRect();
    if(Math.hypot(r.left+r.width/2-x, r.top+r.height/2-y) < 55){
      if(it.dataset.m==='1'){ it.classList.add('stuck'); held.appendChild(it); tone([880,1320],.06); if(--left===0) correct(); }
      else if(!it.classList.contains('nope')){ it.classList.add('nope'); tone([200],.08); setTimeout(()=>it.classList.remove('nope'),500); } } }); };
  mag.addEventListener('pointerdown',e=>{ if(busy) return; e.preventDefault(); try{mag.setPointerCapture(e.pointerId)}catch(_){}
    const r=mag.getBoundingClientRect(), ox=e.clientX-r.left, oy=e.clientY-r.top; mag.classList.add('dragging');
    const mv=ev=>{ mag.style.left=(ev.clientX-ox)/appZoom()+'px'; mag.style.top=(ev.clientY-oy)/appZoom()+'px'; touch(ev.clientX,ev.clientY); };
    const up=()=>{ mag.removeEventListener('pointermove',mv); mag.removeEventListener('pointerup',up); mag.removeEventListener('pointercancel',up); mag.classList.remove('dragging'); mag.style.left=mag.style.top=''; };
    mag.addEventListener('pointermove',mv); mag.addEventListener('pointerup',up); mag.addEventListener('pointercancel',up); });
  items.forEach(it=>it.addEventListener('click',()=>{ const r=it.getBoundingClientRect(); touch(r.left+r.width/2, r.top+r.height/2); }));   // tapping an object tests it too
}

/* =====================================================================
   TIME TOWER — time & calendar station inside Discoveries Reef
   ===================================================================== */
const DAYS = {en:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], he:['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת']};
const DAY_INI = {en:['S','M','T','W','T','F','S'], he:['א','ב','ג','ד','ה','ו','ש']};
const MONTHS = {en:['January','February','March','April','May','June','July','August','September','October','November','December'],
                he:['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר']};
const MORNING = [['🛏️','Wake up','להתעורר'],['🪥','Brush your teeth','לצחצח שיניים'],['🥣','Eat breakfast','לאכול ארוחת בוקר'],['🎒','Go to kindergarten','ללכת לגן']];
const EVENING = [['🛁','Take a bath','להתרחץ'],['📖','Read a story','לקרוא סיפור'],['😴','Go to sleep','ללכת לישון']];
const DAYPART = {morning:['🥣','🌅','🐓','🎒'], evening:['🛁','📖','🌙','😴']};
const capLab = list => v => { const x=list.find(y=>y[0]===v); return `${v}<span class="lw">${x?tx(x[1],x[2]):''}</span>`; };
const ordEn = d => d + ((d%100>=11&&d%100<=13)?'th':({1:'st',2:'nd',3:'rd'}[d%10]||'th'));
const TIME_STATION = { icon:'🗓️', name:{en:'Time Tower',he:'מגדל הזמן'}, intro:{en:'Tick, tock! The tower clock teaches us about time.',he:'תיק תק! שעון המגדל מלמד אותנו על הזמן.'} };
const TIME_PLAN = { 4:['dayPart','routine','dayPart','routine'], 5:['beforeAfter','weekday','weekOrder','routine'], 6:['months','calendar','monthOrder','weekday'] };
for(const a of [4,5,6]){ LEVELS_S[a].plan.splice(3,0,TIME_PLAN[a]); Object.assign(LEVELS_S[a],{extraAt:3, extraSticker:'⏰', extra:TIME_STATION}); }
const genS_base = genS;
genS = function(type){
  const n = age===4 ? 3 : 4, D=DAYS[lang], M=MONTHS[lang];
  switch(type){
    case 'dayPart': { const morning=Math.random()<.5; const e=pick(morning?DAYPART.morning:DAYPART.evening);
      return {t:L2(()=>'When does this happen, in the morning or in the evening?',()=>'מתי זה קורה? בבוקר או בערב?'), visual:cr(e),
              opts:[{label:iconWord('☀️','Morning','בוקר'),value:'m'},{label:iconWord('🌙','Evening','ערב'),value:'e'}], ans:morning?'m':'e', small:true}; }
    case 'routine': { const evening = age===4 ? Math.random()<.5 : false; const list = evening ? EVENING : (age===4 ? MORNING.slice(0,3) : MORNING);
      return {wide:true, t:L2(()=>evening?'Bedtime! Tap the steps in order.':'Good morning! Tap the steps in order.',()=>evening?'הולכים לישון! גע בשלבים לפי הסדר.':'בוקר טוב! גע בשלבים לפי הסדר.'),
              mount:el=>mountOrder(el, list.map(x=>x[0]), capLab(list), 'stepc')}; }
    case 'beforeAfter': { const i=rnd(1,MORNING.length-2), after=Math.random()<.5, ans=MORNING[after?i+1:i-1];
      return {t:L2(()=>`What do you do ${after?'after':'before'} “${MORNING[i][1].toLowerCase()}”?`,()=>`מה עושים ${after?'אחרי':'לפני'} "${MORNING[i][2]}"?`), visual:cr(MORNING[i][0]),
              opts:shuffle(MORNING.filter((_,j)=>j!==i)).map(x=>({label:iconWord(x[0],x[1],x[2]),value:x[0]})), ans:ans[0], small:true}; }
    case 'weekday': { const i=rnd(0,6), after=Math.random()<.5, k=(i+(after?1:6))%7; const o=shuffle([k,...shuffle([0,1,2,3,4,5,6].filter(x=>x!==k&&x!==i)).slice(0,n-1)]);
      return {t:L2(()=>`What day comes ${after?'after':'before'} ${D[i]}?`,()=>`איזה יום בא ${after?'אחרי':'לפני'} יום ${D[i]}?`), visual:'<span class="cr m-wiggle">📅</span>',
              opts:o.map(x=>({label:`<span class="wd">${D[x]}</span>`,value:x})), ans:k, small:true}; }
    case 'weekOrder': { const s=rnd(0,2), seq=D.slice(s,s+5);
      return {wide:true, t:L2(()=>'Tap the days of the week in order!',()=>'גע בימי השבוע לפי הסדר!'), mount:el=>mountOrder(el, seq, null, 'stepc')}; }
    case 'months': { const i=rnd(0,11), after=Math.random()<.5, k=(i+(after?1:11))%12; const o=shuffle([k,...shuffle([...Array(12).keys()].filter(x=>x!==k&&x!==i)).slice(0,n-1)]);
      return {t:L2(()=>`What month comes ${after?'after':'before'} ${M[i]}?`,()=>`איזה חודש בא ${after?'אחרי':'לפני'} ${M[i]}?`), visual:'<span class="cr m-wiggle">🗓️</span>',
              opts:o.map(x=>({label:`<span class="wd">${M[x]}</span>`,value:x})), ans:k, small:true}; }
    case 'monthOrder': { const s=rnd(0,7), seq=M.slice(s,s+5);
      return {wide:true, t:L2(()=>'Tap the months in order!',()=>'גע בחודשים לפי הסדר!'), mount:el=>mountOrder(el, seq, null, 'stepc')}; }
    case 'calendar': { const off=rnd(0,6), days=rnd(28,31), d=rnd(2,days), dow=(off+d-1)%7;
      const cells=[...DAY_INI[lang].map(x=>`<span class="ch">${x}</span>`), ...Array(off).fill('<span></span>'), ...Array.from({length:days},(_,i)=>`<span class="cd ${i+1===d?'hit':''}">${i+1}</span>`)];
      const o=shuffle([dow,...shuffle([0,1,2,3,4,5,6].filter(x=>x!==dow)).slice(0,n-1)]);
      return {t:L2(()=>`On the calendar, what day of the week is the ${ordEn(d)}?`,()=>`בלוח השנה, באיזה יום בשבוע חל ה-${d} בחודש?`), visual:`<div class="cal">${cells.join('')}</div>`,
              opts:o.map(x=>({label:`<span class="wd">${D[x]}</span>`,value:x})), ans:dow, small:true}; }
  }
  return genS_base(type);
};

/* =====================================================================
   PUZZLES PORT — logic & early coding (sequencing, algorithms, debugging, loops, conditionals, sorting by rule)
   ===================================================================== */
const DIRS = {'⬆️':[-1,0],'⬇️':[1,0],'⬅️':[0,-1],'➡️':[0,1]};
function boatPuzzle(){
  const size = age===4 ? 4 : age===5 ? 5 : age===6 ? 6 : 7, inb=(r,c)=>r>=0&&c>=0&&r<size&&c<size, key=(r,c)=>r*size+c;
  for(let tries=0; tries<300; tries++){
    const start=[rnd(0,size-1),rnd(0,size-1)];
    if(age>=6){   // rocks in the way: the shortest safe route (found by BFS) is the answer
      const target=[rnd(0,size-1),rnd(0,size-1)]; if(Math.abs(target[0]-start[0])+Math.abs(target[1]-start[1])<4) continue;
      const rs=new Set(); while(rs.size<(age>=7?8:5)){ const k=key(rnd(0,size-1),rnd(0,size-1)); if(k!==key(...start)&&k!==key(...target)) rs.add(k); }
      const prev=new Map([[key(...start),null]]), qq=[start];
      while(qq.length){ const [r,c]=qq.shift(); for(const [d,[dr,dc]] of Object.entries(DIRS)){ const nr=r+dr, nc=c+dc, k=key(nr,nc);
        if(inb(nr,nc)&&!rs.has(k)&&!prev.has(k)){ prev.set(k,[key(r,c),d]); qq.push([nr,nc]); } } }
      if(!prev.has(key(...target))) continue;
      const p=[]; let k=key(...target); while(prev.get(k)){ const [pk,d]=prev.get(k); p.unshift(d); k=pk; }
      if(p.length<(age>=7?6:4)||p.length>(age>=7?11:8)) continue;
      return {size,start,target,rocks:[...rs].map(x=>[Math.floor(x/size),x%size]),path:p};
    }
    let path;
    if(age===4){ path=Array(rnd(1,3)).fill(pick(Object.keys(DIRS))); }
    else { const d1=pick(Object.keys(DIRS)), d2=pick((d1==='⬆️'||d1==='⬇️')?['⬅️','➡️']:['⬆️','⬇️']); path=[...Array(rnd(1,3)).fill(d1),...Array(rnd(1,3)).fill(d2)]; }
    let [r,c]=start, ok=true; for(const d of path){ r+=DIRS[d][0]; c+=DIRS[d][1]; if(!inb(r,c)){ ok=false; break; } }
    if(ok) return {size,start,target:[r,c],rocks:[],path};
  }
}
function mountBoat(el, P, debug){
  const {size,start,target,rocks,path}=P, isRock=(r,c)=>rocks.some(([a,b])=>a===r&&b===c);
  let prog = debug ? [...path] : [], bug=-1, running=false, boat=[...start];
  if(debug){ bug=rnd(0,path.length-1); prog[bug]=pick(Object.keys(DIRS).filter(d=>d!==path[bug])); el.dataset.bug=bug; }
  el.dataset.path=path.join('|');
  el.innerHTML = `<div class="grid" style="--n:${size}">${Array.from({length:size*size},(_,i)=>{ const r=Math.floor(i/size), c=i%size;
      return `<span class="gcell" data-r="${r}" data-c="${c}">${isRock(r,c)?'🪨':(r===target[0]&&c===target[1])?'🏝️':''}</span>`; }).join('')}</div>
    <div class="prog" id="prog"></div>
    ${debug?'':`<div class="pal">${Object.keys(DIRS).map(d=>`<button class="arrow" data-d="${d}" aria-label="arrow">${d}</button>`).join('')}</div>
    <div class="row"><button class="btn ghost iconb" id="pclr" aria-label="Clear">${ICON.undo}</button><button class="btn gobtn" id="run" aria-label="Go">${ICON.play}<span>${tx('Go!','יוצאים!')}</span></button></div>`}`;
  const cell=(r,c)=>el.querySelector(`.gcell[data-r="${r}"][data-c="${c}"]`);
  const put=()=>{ el.querySelectorAll('.boat').forEach(b=>b.remove()); cell(boat[0],boat[1]).insertAdjacentHTML('beforeend','<span class="boat">⛵</span>'); };
  const progEl=el.querySelector('#prog');
  const reset=()=>setTimeout(()=>{ boat=[...start]; put(); progEl.querySelectorAll('.now').forEach(x=>x.classList.remove('now')); },700);
  const run=()=>{ if(running||busy||!prog.length) return; running=true; boat=[...start]; put(); let i=0;
    const step=()=>{ if(!document.body.contains(el)) return;
      if(i>=prog.length){ running=false; if(boat[0]===target[0]&&boat[1]===target[1]) correct(); else { miss(tx('Not there yet! Fix the arrows.','עוד לא הגענו! תקן את החצים.')); reset(); } return; }
      progEl.querySelectorAll('.pcard').forEach((b,j)=>b.classList.toggle('now',j===i));
      const nr=boat[0]+DIRS[prog[i]][0], nc=boat[1]+DIRS[prog[i]][1];
      if(nr<0||nc<0||nr>=size||nc>=size||isRock(nr,nc)){ running=false; const g=el.querySelector('.grid'); g.classList.remove('bump'); void g.offsetWidth; g.classList.add('bump');
        miss(tx('Bump! Fix the arrows.','בום! תקן את החצים.')); reset(); return; }
      boat=[nr,nc]; put(); tone([500+i*60],.06); i++; setTimeout(step,380); };
    setTimeout(step,250); };
  const renderProg=()=>{
    progEl.innerHTML = prog.length ? prog.map((d,i)=>`<button class="pcard" data-i="${i}">${d}</button>`).join('') : `<span class="phint">${tx('Tap the arrows to plan the trip','גע בחצים כדי לתכנן את הדרך')}</span>`;
    progEl.querySelectorAll('.pcard').forEach(b=>b.onclick=()=>{ if(busy||running) return; const i=+b.dataset.i;
      if(debug){ if(i===bug){ prog[i]=path[i]; renderProg(); tone([700,900],.07); run(); } else { b.classList.remove('no'); void b.offsetWidth; b.classList.add('no'); miss(); } }
      else { prog.splice(i,1); renderProg(); } }); };
  put(); renderProg();
  if(!debug){
    el.querySelectorAll('.arrow').forEach(b=>b.onclick=()=>{ if(busy||running||prog.length>=12) return; prog.push(b.dataset.d); renderProg(); tone([650],.05); });
    el.querySelector('#pclr').onclick=()=>{ if(running) return; prog=[]; renderProg(); boat=[...start]; put(); };
    el.querySelector('#run').onclick=run;
  }
}
const STEPS = [
  {en:'brushing teeth',he:'צחצוח שיניים',s:[['🪥','Take the toothbrush','לקחת מברשת'],['🧴','Add toothpaste','לשים משחה'],['😁','Brush your teeth','לצחצח'],['🚰','Rinse','לשטוף']]},
  {en:'planting a seed',he:'שתילת זרע',s:[['🕳️','Dig a hole','לחפור גומה'],['🌰','Put in a seed','לשים זרע'],['💧','Water it','להשקות'],['🌱','It grows!','הוא צומח!']]},
  {en:'making a sandwich',he:'הכנת כריך',s:[['🍞','Take the bread','לקחת לחם'],['🧈','Spread butter','למרוח חמאה'],['🧀','Add cheese','לשים גבינה'],['🥪','Eat it!','לאכול!']]},
  {en:'washing hands',he:'שטיפת ידיים',s:[['🚰','Wet your hands','להרטיב ידיים'],['🧼','Use soap','לסבן'],['👐','Scrub','לשפשף'],['🧻','Dry them','לנגב']]},
  {en:'baking a cake',he:'אפיית עוגה',s:[['🥚','Mix eggs and flour','לערבב ביצים וקמח'],['🔥','Bake in the oven','לאפות בתנור'],['🎂','Decorate it','לקשט'],['🍰','Eat a slice!','לאכול פרוסה!']]}
];
const COLORS = [{k:'red',icon:'🟥',en:'Red',he:'אדום',e:['🍎','🍓','❤️','🚒','🌹','🍒']},{k:'blue',icon:'🟦',en:'Blue',he:'כחול',e:['💙','🐳','🧢','👖','🐬','💎']},
  {k:'yellow',icon:'🟨',en:'Yellow',he:'צהוב',e:['🍌','🌻','⭐','🐥','🌽','🧀']},{k:'green',icon:'🟩',en:'Green',he:'ירוק',e:['🐸','🥦','🍀','🌲','🥒','🦖']}];
const MOVES = [{k:'fly',icon:'☁️',en:'Fly',he:'עף',e:['🐦','✈️','🦋','🚁','🐝','🦅']},{k:'swim',icon:'🌊',en:'Swim',he:'שוחה',e:['🐟','🐬','🐙','🦈','🐠']},{k:'walk',icon:'🦶',en:'Walk',he:'הולך',e:['🐶','🐘','🐄','🐈','🐎']}];
const ACT = { jump:['🦘','Jump','קופץ'], swim:['🏊','Swim','שוחה'], sleep:['😴','Sleep','ישן'], sit:['🪑','Sit','יושב'] };
const loopBox = (k,body) => `<span class="loopc">🔁 ${k} × <span class="lbody">${body}</span></span>`;

const STATIONS_C = [
  { icon:'🚤', name:{en:'Arrows Lagoon',he:'לגונת החצים'}, intro:{en:'Captain, plan the route! Arrows tell the boat where to go.',he:'קפטן, תכנן את המסלול! החצים אומרים לסירה לאן לשוט.'} },
  { icon:'🪜', name:{en:'Steps Bridge',he:'גשר הצעדים'}, intro:{en:'Every job has steps. What comes first?',he:'לכל משימה יש שלבים. מה בא קודם?'} },
  { icon:'🚦', name:{en:'Decisions Gate',he:'שער ההחלטות'}, intro:{en:'If this happens, then we do that. Follow the rules!',he:'אם זה קורה, אז עושים את זה. פעל לפי החוקים!'} },
  { icon:'🎡', name:{en:'Loops Waterfall',he:'מפל הלולאות'}, intro:{en:'A loop repeats the same thing again and again!',he:'לולאה חוזרת על אותו דבר שוב ושוב!'} },
  { icon:'🐞', name:{en:'Bugs Cave',he:'מערת הבאגים'}, intro:{en:'A bug is a mistake in the plan. Find it and fix it!',he:'באג הוא טעות בתוכנית. מצא אותו ותקן!'} }
];
const STICKERS_C = ['🚤','🪜','🚦','🔁','🐞'];
const LEVELS_C = {
  4:{ title:{en:'Little Coder',he:'מתכנת קטן'}, em:'🐣', cls:'a4', sub:{en:'Arrows, steps in order, sorting by color',he:'חצים, שלבים לפי הסדר, מיון לפי צבע'},
      plan:[ ['boat','boat','sortRule','boat'],['steps','sortRule','steps','boat'],['ifThen','sortRule','ifThen','steps'],['loop','boat','loop','steps'],['debug','boat','ifThen','boat'] ] },
  5:{ title:{en:'Code Sailor',he:'מלח הקוד'}, em:'⛵', cls:'a5', sub:{en:'Routes with turns, rules, loops, finding bugs',he:'מסלולים עם פניות, חוקים, לולאות, מציאת באגים'},
      plan:[ ['boat','boat','sortRule','steps'],['steps','boat','loop','sortRule'],['ifThen','sortRule','ifThen','boat'],['loop','loop','boat','steps'],['debug','boat','debug','ifThen'] ] },
  6:{ title:{en:'Code Captain',he:'קפטן הקוד'}, em:'🧭', cls:'a6', sub:{en:'Avoiding rocks, if/else, loops, debugging',he:'עקיפת סלעים, אם/אחרת, לולאות, תיקון באגים'},
      plan:[ ['boat','boat','steps','loop'],['steps','debug','boat','sortRule'],['ifThen','ifThen','boat','loop'],['loop','boat','loop','debug'],['debug','boat','debug','boat'] ] }
};

function genC(type){
  const n = age===4 ? 3 : 4;
  switch(type){
    case 'boat': { const P=boatPuzzle();
      return {wide:true, t:L2(()=>`Tap the arrows to sail the boat ⛵ to the island 🏝️, then press ▶!${P.rocks.length?' Watch out for rocks!':''}`,
                               ()=>`גע בחצים כדי להשיט את הסירה ⛵ לאי 🏝️, ואז לחץ ▶!${P.rocks.length?' היזהר מהסלעים!':''}`), mount:el=>mountBoat(el,P,false)}; }
    case 'debug': { const P=boatPuzzle();
      return {wide:true, t:L2(()=>'One arrow is wrong! Tap the wrong arrow to fix it.',()=>'אחד החצים לא נכון! גע בחץ הלא נכון כדי לתקן אותו.'), mount:el=>mountBoat(el,P,true)}; }
    case 'steps': { const x=pick(STEPS), list = age===4 ? x.s.slice(0,3) : x.s;
      return {wide:true, t:L2(()=>`How do we do ${x.en}? Tap the steps in order!`,()=>`איך עושים ${x.he}? גע בשלבים לפי הסדר!`), mount:el=>mountOrder(el, list.map(s=>s[0]), capLab(list), 'stepc')}; }
    case 'sortRule': {
      let bins, items, tEn, tHe;
      if(age===4){ bins=shuffle(COLORS).slice(0,2); tEn='Sort by color! Drag each thing to its color.'; tHe='מיין לפי צבע! גרור כל דבר לצבע שלו.'; items=bins.flatMap(b=>shuffle(b.e).slice(0,3).map(e=>({e,k:b.k}))); }
      else if(age===5){ bins=MOVES; tEn='Sort by how they move: fly, swim or walk!'; tHe='מיין לפי איך הם זזים: עף, שוחה או הולך!'; items=bins.flatMap(b=>shuffle(b.e).slice(0,2).map(e=>({e,k:b.k}))); }
      else { const th=rnd(5,12); bins=[{k:'big',icon:'🚀',en:`More than ${th}`,he:`יותר מ-${th}`},{k:'small',icon:'🐢',en:`${th} or less`,he:`${th} או פחות`}];
        tEn=`Rule: numbers bigger than ${th} go to the rocket. All the others go to the turtle.`; tHe=`החוק: מספרים גדולים מ-${th} הולכים לטיל. כל השאר הולכים לצב.`;
        const nums=shuffle([...Array(20).keys()].map(x=>x+1)).slice(0,6); items=nums.map(v=>({e:`<b class="numt">${v}</b>`,k:v>th?'big':'small'})); }
      return {wide:true, t:L2(()=>tEn,()=>tHe), mount:el=>mountSort(el, bins.map(b=>({k:b.k,icon:b.icon,label:tx(b.en,b.he)})), items)}; }
    case 'ifThen': {
      if(age===4){ const traffic=Math.random()<.5;
        if(traffic){ const green=Math.random()<.5;
          return {t:L2(()=>`Rule: 🔴 means STOP, 🟢 means GO. The light is ${green?'🟢':'🔴'}. What does the car do?`,()=>`החוק: 🔴 אומר לעצור, 🟢 אומר לנסוע. הרמזור ${green?'🟢':'🔴'}. מה המכונית עושה?`),
                  visual:`<span class="big">${green?'🟢':'🔴'} 🚗</span>`, opts:[{label:iconWord('🛑','Stop','עוצרת'),value:'stop'},{label:iconWord('💨','Go','נוסעת'),value:'go'}], ans:green?'go':'stop', small:true}; }
        const rain=Math.random()<.5;
        return {t:L2(()=>`Rule: if it rains, ${nm()} takes an umbrella. If it is sunny, ${nm()} takes sunglasses. Today: ${rain?'🌧️':'☀️'}. What does ${nm()} take?`,
                     ()=>`החוק: אם יורד גשם, ${nm()} לוקח מטריה. אם יש שמש, ${nm()} לוקח משקפי שמש. היום: ${rain?'🌧️':'☀️'}. מה ${nm()} לוקח?`),
                visual:`<span class="big">${rain?'🌧️':'☀️'}</span>`, opts:shuffle([{label:cr('☂️'),value:'u'},{label:cr('🕶️'),value:'s'}]), ans:rain?'u':'s'}; }
      if(age===5){ const rules=shuffle([['🔴','jump'],['🔵','swim'],['🟡','sleep']]); const card=pick(rules);
        const ruleHtml=`<div class="rules">${rules.map(([c,a])=>`<span>${c} → ${ACT[a][0]}</span>`).join('')}</div>`;
        return {t:L2(()=>`Follow the rules! The card is ${card[0]}. What does the frog do?`,()=>`פעל לפי החוקים! הכרטיס ${card[0]}. מה הצפרדע עושה?`),
                visual:`${ruleHtml}<span class="big">🃏${card[0]} 🐸</span>`, opts:shuffle(['jump','swim','sleep']).map(a=>({label:iconWord(ACT[a][0],ACT[a][1],ACT[a][2]),value:a})), ans:card[1], small:true}; }
      const th=rnd(3,8); let v=rnd(1,10); while(v===th) v=rnd(1,10); const big=v>th;
      return {t:L2(()=>`IF the number is bigger than ${th}, THEN the frog jumps. ELSE the frog sits. The number is ${v}. What does the frog do?`,
                   ()=>`אם המספר גדול מ-${th}, אז הצפרדע קופצת. אחרת הצפרדע יושבת. המספר הוא ${v}. מה הצפרדע עושה?`),
              visual:`<span class="big">${v} 🐸</span>`, opts:[{label:iconWord(ACT.jump[0],ACT.jump[1],'קופצת'),value:'jump'},{label:iconWord(ACT.sit[0],ACT.sit[1],'יושבת'),value:'sit'}], ans:big?'jump':'sit', small:true}; }
    case 'loop': {
      if(age===4){ const k=rnd(2,4), a=pick(['🦘','👏','🦶']);
        return {t:L2(()=>`The loop says: repeat ${k} times. How many times do we do it?`,()=>`הלולאה אומרת: חזור ${k} פעמים. כמה פעמים עושים את זה?`), visual:loopBox(k,cr(a)), opts:numOptions(k,n,1,6), ans:k}; }
      if(age===5){ const k=rnd(2,5), a=pick(['🦶','👏','🦘']), other=a==='👏'?'🦶':'👏'; const seqHtml=Array.from({length:k},()=>cr(a)).join('');
        const cand=[[k,a],[k+1,a],[Math.max(1,k-1),a],[k,other]]; const uniq=[]; cand.forEach(c=>{ if(!uniq.some(u=>u[0]===c[0]&&u[1]===c[1])) uniq.push(c); });
        return {t:L2(()=>'Which loop makes this?',()=>'איזו לולאה יוצרת את זה?'), visual:seqHtml, opts:shuffle(uniq.slice(0,n)).map(([kk,e])=>({label:loopBox(kk,e),value:kk+e})), ans:k+a, small:true}; }
      const k=rnd(2,3), body=shuffle(['👏','🦶','🦘']).slice(0,2); const right=Array(k).fill(body.join('')).join('');
      const wrong1=Array(k+1).fill(body.join('')).join(''), wrong2=Array(k).fill(body.slice().reverse().join('')).join(''), wrong3=body[0].repeat(k)+body[1].repeat(k);
      return {t:L2(()=>'What does this loop make?',()=>'מה הלולאה הזאת יוצרת?'), visual:loopBox(k,body.join(' ')),
              opts:shuffle([right,wrong1,wrong2,wrong3]).map(s=>({label:`<span class="seq">${s}</span>`,value:s})), ans:right, small:true}; }
  }
}

/* =====================================================================
   FEELINGS LAGOON — social & emotional learning
   ===================================================================== */
const FACES = {happy:['😀','happy','השמח','שמח'], sad:['😢','sad','העצוב','עצוב'], angry:['😠','angry','הכועס','כועס'], scared:['😨','scared','המפוחד','מפוחד'], surprised:['😮','surprised','המופתע','מופתע'], tired:['😴','tired','העייף','עייף']};
const SITS = [{e:'🎂🎈',en:"It's your birthday party!",he:'יש לך מסיבת יום הולדת!',f:'happy'},{e:'🍦💔',en:'Your ice cream fell on the floor.',he:'הגלידה שלך נפלה על הרצפה.',f:'sad'},
  {e:'🐕💥',en:'A big dog barks loudly at you.',he:'כלב גדול נובח עליך בקול רם.',f:'scared'},{e:'🧸✋',en:'Someone grabbed your toy without asking.',he:'מישהו חטף לך את הצעצוע בלי לשאול.',f:'angry'},
  {e:'🎁❗',en:'You open the door and find a surprise present!',he:'פתחת את הדלת ומצאת מתנת הפתעה!',f:'surprised'},{e:'🏖️🌙',en:'You played all day and now it is late at night.',he:'שיחקת כל היום ועכשיו כבר מאוחר בלילה.',f:'tired'},
  {e:'🎢😃',en:'You go on a fun ride with your family.',he:'אתה עולה עם המשפחה על מתקן כיפי.',f:'happy'},{e:'👋🚚',en:'Your best friend moved to another city.',he:'החבר הכי טוב שלך עבר לעיר אחרת.',f:'sad'},
  {e:'⛈️⚡',en:'There is very loud thunder outside.',he:'יש בחוץ רעם חזק מאוד.',f:'scared'},{e:'🏗️💥',en:'Someone knocked down your tower on purpose.',he:'מישהו הפיל בכוונה את המגדל שלך.',f:'angry'}];
const CLOSE = {happy:['surprised'], surprised:['happy'], scared:['surprised'], angry:[], sad:[], tired:[]};   // feelings that could both fit — never offered together
const KIND = [{e:'🧸🤝',en:'Sharing your toys with a friend',he:'לשתף את הצעצועים עם חבר',k:1},{e:'🤗',en:'Hugging a friend who is sad',he:'לחבק חבר עצוב',k:1},
  {e:'🙏',en:'Saying sorry when you made a mistake',he:'להגיד סליחה כשטעית',k:1},{e:'💐',en:'Saying thank you',he:'להגיד תודה',k:1},{e:'🧹',en:'Helping to clean up',he:'לעזור לסדר',k:1},
  {e:'👊',en:'Hitting a friend',he:'להרביץ לחבר',k:0},{e:'✋🧸',en:'Grabbing a toy from someone',he:'לחטוף צעצוע ממישהו',k:0},{e:'😝',en:'Laughing at someone who fell',he:'לצחוק על מישהו שנפל',k:0},
  {e:'🏗️💥',en:"Knocking down a friend's tower on purpose",he:'להפיל בכוונה מגדל של חבר',k:0}];
const DO = [
  {e:'🧒🩹',en:'Your friend fell down and is crying.',he:'החבר שלך נפל ובוכה.',good:['🤝','Help him get up','לעזור לו לקום'],bad:[['😂','Laugh','לצחוק'],['🏃','Run away','לברוח'],['🙈','Pretend not to see','לעשות כאילו לא ראית']]},
  {e:'🧸👀',en:'Your friend wants to play with your toy.',he:'חבר רוצה לשחק בצעצוע שלך.',good:['🔄','Take turns','לשחק בתורות'],bad:[['🙅','Hide the toy','להחביא את הצעצוע'],['😠','Shout "No!"','לצעוק "לא!"'],['👊','Push him away','לדחוף אותו']]},
  {e:'🧍',en:'A child is standing all alone at playtime.',he:'ילד עומד לבד בהפסקה.',good:['👋','Invite him to play','להזמין אותו לשחק'],bad:[['🙈','Ignore him','להתעלם ממנו'],['😝','Make faces at him','לעשות לו פרצופים'],['🏃','Run away','לברוח']]},
  {e:'🏗️💥',en:"You knocked down a friend's tower by accident.",he:'הפלת בטעות מגדל של חבר.',good:['🙏','Say sorry and help build it','להגיד סליחה ולעזור לבנות'],bad:[['🏃','Walk away','ללכת משם'],['😂','Laugh','לצחוק'],['🤐','Say nothing','לא להגיד כלום']]},
  {e:'😡',en:'You feel very, very angry.',he:'אתה מרגיש מאוד מאוד כועס.',good:['🌬️','Take deep breaths','לנשום עמוק'],bad:[['👊','Hit someone','להרביץ למישהו'],['💥','Throw toys','לזרוק צעצועים'],['😱','Scream at friends','לצעוק על חברים']]},
  {e:'🎁',en:'A friend gives you a present.',he:'חבר נותן לך מתנה.',good:['💐','Say thank you','להגיד תודה'],bad:[['🙄','Say nothing','לא להגיד כלום'],['😒','Say "I don\'t like it"','להגיד "אני לא אוהב את זה"'],['🏃','Run away','לברוח']]},
  {e:'🆕',en:'A new child joins your class.',he:'ילד חדש מצטרף לגן.',good:['👋','Say hello and smile','להגיד שלום ולחייך'],bad:[['🙈','Hide','להתחבא'],['😝','Make fun of him','לצחוק עליו'],['🤐','Say nothing','לא להגיד כלום']]}
];
const CALM = { good:[['🌬️','Breathe slowly','לנשום לאט'],['🧸','Hug a soft toy','לחבק בובה רכה'],['🗣️','Tell a grown-up','לספר למבוגר'],['💧','Drink some water','לשתות מים']],
               bad:[['👊','Hit someone','להרביץ למישהו'],['😱','Scream at friends','לצעוק על חברים'],['💥','Break things','לשבור דברים']] };

const STATIONS_F = [
  { icon:'😊', name:{en:'Faces Beach',he:'חוף הפרצופים'}, intro:{en:'Every face tells us a feeling. Let\'s look closely!',he:'כל פרצוף מספר לנו על רגש. בוא נסתכל טוב!'} },
  { icon:'🤝', name:{en:'Friends Harbor',he:'נמל החברים'}, intro:{en:'Good friends help each other. What would you do?',he:'חברים טובים עוזרים זה לזה. מה היית עושה?'} },
  { icon:'🌬️', name:{en:'Calm Cove',he:'מפרץ הרוגע'}, intro:{en:'When feelings get big, we can calm down together.',he:'כשהרגשות גדולים, אפשר להירגע ביחד.'} },
  { icon:'🍪', name:{en:'Sharing Island',he:'אי השיתוף'}, intro:{en:'Sharing makes everyone happy. Let\'s share fairly!',he:'שיתוף משמח את כולם. בוא נחלק בצורה הוגנת!'} },
  { icon:'💖', name:{en:'Kind Heart Cave',he:'מערת הלב הטוב'}, intro:{en:'A kind heart is the real treasure!',he:'לב טוב הוא האוצר האמיתי!'} }
];
const STICKERS_F = ['😊','🤝','🌬️','🍪','💖'];
const LEVELS_F = {
  4:{ title:{en:'Little Heart',he:'לב קטן'}, em:'💛', cls:'a4', sub:{en:'Naming feelings, kind or unkind, sharing',he:'זיהוי רגשות, מעשה טוב או לא, שיתוף'},
      plan:[ ['whichFace','situation','whichFace','kindOrNot'],['kindOrNot','whichFace','share','situation'],['breathe','whichFace','situation','kindOrNot'],
             ['share','kindOrNot','whichFace','share'],['faceMatch','situation','breathe','kindOrNot'] ] },
  5:{ title:{en:'Good Friend',he:'חבר טוב'}, em:'🤝', cls:'a5', sub:{en:'Feelings in stories, helping friends, calming down',he:'רגשות בסיפורים, עזרה לחברים, הרגעה'},
      plan:[ ['situation','whichFace','faceMatch','situation'],['whatToDo','kindOrNot','whatToDo','share'],['breathe','whatToDo','situation','whichFace'],
             ['share','whatToDo','share','kindOrNot'],['faceMatch','whatToDo','breathe','situation'] ] },
  6:{ title:{en:'Kind Captain',he:'קפטן טוב לב'}, em:'🧭', cls:'a6', sub:{en:'Solving problems, calming strategies, fair sharing',he:'פתרון בעיות, דרכי הרגעה, חלוקה הוגנת'},
      plan:[ ['situation','faceMatch','whatToDo','situation'],['whatToDo','share','whatToDo','situation'],['breathe','calmPick','whatToDo','faceMatch'],
             ['share','whatToDo','calmPick','situation'],['whatToDo','faceMatch','breathe','whatToDo'] ] }
};

function genF(type){
  const n = age===4 ? 3 : 4, keys=Object.keys(FACES);
  const faceOpts = (ans,count) => shuffle([ans,...shuffle(keys.filter(k=>k!==ans && !CLOSE[ans].includes(k))).slice(0,count-1)]).map(k=>({label:cr(FACES[k][0]),value:k}));
  const actOpts = (good,bads,count) => shuffle([good,...shuffle(bads).slice(0,count-1)]);
  switch(type){
    case 'whichFace': { const k=pick(keys);
      return {t:L2(()=>`Find the ${FACES[k][1]} face!`,()=>`מצא את הפרצוף ${FACES[k][2]}!`), visual:'', opts:faceOpts(k,n), ans:k}; }
    case 'situation': { const s=pick(SITS); const o=faceOpts(s.f,n);
      return {t:L2(()=>`${s.en} How would you feel?`,()=>`${s.he} איך היית מרגיש?`), visual:`<span class="big">${s.e}</span>`, opts:o, ans:s.f}; }
    case 'kindOrNot': { const x=pick(KIND);
      return {t:L2(()=>`${x.en}. Is that kind?`,()=>`${x.he}. האם זה מעשה טוב?`), visual:`<span class="big">${x.e}</span>`,
              opts:[{label:iconWord('👍','Yes','כן'),value:1},{label:iconWord('👎','No','לא'),value:0}], ans:x.k, small:true}; }
    case 'whatToDo': { const x=pick(DO); const opts=actOpts(x.good,x.bad,age===4?3:Math.min(4,1+x.bad.length));
      return {t:L2(()=>`${x.en} What can you do?`,()=>`${x.he} מה אפשר לעשות?`), sp:()=>`${tx(x.en,x.he)} ${tx('What can you do?','מה אפשר לעשות?')} ${listSay(opts.map(o=>tx(o[1],o[2])))}`,
              visual:`<span class="big">${x.e}</span>`, opts:opts.map(o=>({label:iconWord(o[0],o[1],o[2]),value:o[0]})), ans:x.good[0], small:true}; }
    case 'calmPick': { const f=pick(['angry','sad','scared']); const g=pick(CALM.good); const opts=shuffle([g,...shuffle(CALM.bad).slice(0,n-1)]);
      return {t:L2(()=>`When you feel ${FACES[f][1]}, what can help you feel better?`,()=>`כשאתה מרגיש ${FACES[f][3]}, מה יכול לעזור לך להרגיש טוב יותר?`),
              sp:()=>`${tx(`When you feel ${FACES[f][1]}, what can help you feel better?`,`כשאתה מרגיש ${FACES[f][3]}, מה יכול לעזור לך להרגיש טוב יותר?`)} ${listSay(opts.map(o=>tx(o[1],o[2])))}`,
              visual:cr(FACES[f][0]), opts:opts.map(o=>({label:iconWord(o[0],o[1],o[2]),value:o[0]})), ans:g[0], small:true}; }
    case 'faceMatch': { const picked=[]; for(const s of shuffle(SITS)){ if(picked.length>=3) break; if(!picked.some(p=>p.f===s.f||CLOSE[p.f].includes(s.f))) picked.push(s); }
      return {wide:true, t:L2(()=>'Match each face to what happened! Tap a picture to hear the story.',()=>'התאם כל פרצוף למה שקרה! גע בתמונה כדי לשמוע את הסיפור.'),
              mount:el=>mountMatch(el, picked.map(s=>({L:s.f,label:FACES[s.f][0],e:s.e,w:tx(s.en,s.he)})))}; }
    case 'breathe':
      return {wide:true, t:L2(()=>'Calm breathing: tap the balloon, then breathe in as it grows and out as it shrinks.',()=>'נשימה רגועה: גע בבלון, ואז שאף כשהוא גדל ונשוף כשהוא קטן.'), mount:el=>mountBreathe(el)};
    case 'share': { const friends = age===4 ? 2 : age===5 ? rnd(2,3) : 3, per = age===4 ? rnd(2,3) : rnd(2,4), total=friends*per;
      return {wide:true, t:L2(()=>`Share ${total} cookies fairly between ${friends} friends!`,()=>`חלק ${total} עוגיות בצורה הוגנת בין ${friends} חברים!`), mount:el=>mountShare(el,total,friends)}; }
  }
}
function mountBreathe(el){
  el.innerHTML = `<button class="breath" id="br" aria-label="breathing balloon"><span class="bcirc"></span><span class="blab" id="brl">${tx('Tap to start','גע כדי להתחיל')}</span></button><div class="claps" id="brc"></div>`;
  const br=el.querySelector('#br'), lab=el.querySelector('#brl'), dots=el.querySelector('#brc'); let started=false, cyc=0;
  const phase=inn=>{ if(!document.body.contains(br)) return;
    br.classList.toggle('in',inn); br.classList.toggle('out',!inn); lab.textContent = inn ? tx('Breathe in…','שאיפה…') : tx('Breathe out…','נשיפה…');
    speak(inn ? tx('Breathe in','שאף') : tx('Breathe out','נשוף'));
    setTimeout(()=>{ if(!document.body.contains(br)) return;
      if(inn) phase(false);
      else { cyc++; dots.insertAdjacentHTML('beforeend','<span class="cl">💙</span>'); if(cyc>=3){ lab.textContent=tx('So calm!','איזה רוגע!'); correct(); } else phase(true); } }, 3200); };
  br.onclick=()=>{ if(started||busy) return; started=true; phase(true); };
}
function mountShare(el, total, friends){
  const kids=shuffle(['🧒','👧','👦','🧑']).slice(0,friends);
  el.innerHTML = `<div class="tray" id="ctray">${Array.from({length:total},()=>cr('🍪','dr sortit')).join('')}</div>
    <div class="bins">${kids.map((f,i)=>`<div class="bin plate" data-k="${i}"><div class="bhead"><span class="bic">${f}</span><span class="blab">🍽️</span></div><div class="bin-in"></div></div>`).join('')}</div>`;
  const tray=el.querySelector('#ctray'), binEls=[...el.querySelectorAll('.bin')]; let sel=null;
  const binAt=(x,y)=>binEls.find(b=>{ const r=b.getBoundingClientRect(); return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom; });
  const place=(item,bin)=>{ item.classList.remove('picked'); if(!bin) return; bin.querySelector('.bin-in').appendChild(item); tone([700],.05); };
  el.querySelectorAll('.sortit').forEach(item=>item.addEventListener('pointerdown',e=>{
    if(busy) return; e.preventDefault(); try{item.setPointerCapture(e.pointerId)}catch(_){}
    const r=item.getBoundingClientRect(), sx=e.clientX, sy=e.clientY, ox=sx-r.left, oy=sy-r.top; let moved=false;
    const mv=ev=>{ if(!moved&&Math.hypot(ev.clientX-sx,ev.clientY-sy)<8) return; if(!moved){ moved=true; item.classList.add('dragging'); }
      item.style.left=(ev.clientX-ox)/appZoom()+'px'; item.style.top=(ev.clientY-oy)/appZoom()+'px'; const h=binAt(ev.clientX,ev.clientY); binEls.forEach(b=>b.classList.toggle('hot',b===h)); };
    const up=ev=>{ item.removeEventListener('pointermove',mv); item.removeEventListener('pointerup',up); item.removeEventListener('pointercancel',up);
      item.classList.remove('dragging'); item.style.left=item.style.top=''; binEls.forEach(b=>b.classList.remove('hot'));
      if(moved) place(item, binAt(ev.clientX,ev.clientY));
      else if(item.parentElement!==tray){ tray.appendChild(item); tone([420],.05); }   // tap a cookie on a plate to take it back
      else { el.querySelectorAll('.picked').forEach(x=>x.classList.remove('picked')); item.classList.add('picked'); sel=item; tone([600],.05); } };
    item.addEventListener('pointermove',mv); item.addEventListener('pointerup',up); item.addEventListener('pointercancel',up); }));
  binEls.forEach(b=>b.addEventListener('click',()=>{ if(busy||!sel) return; const it=sel; sel=null; if(it.parentElement===tray) place(it,b); }));
  checkBtn(el, ()=>{ const counts=binEls.map(b=>b.querySelectorAll('.sortit').length);
    (tray.querySelectorAll('.sortit').length===0 && counts.every(c=>c===counts[0])) ? correct() : miss(tx('Is it fair? Everyone should get the same!','זה הוגן? כל אחד צריך לקבל אותו דבר!')); });
}

/* =====================================================================
   AGE 7 — second grade (CCSS Grade 2 / UK Year 2 / Israeli כיתה ב׳), in all five worlds
   ===================================================================== */
const pad2 = m => String(m).padStart(2,'0');
const optSet = (vals, n) => shuffle([...new Set(vals.filter(v=>v>=0))].slice(0,n)).map(x=>({label:String(x),value:x}));
const POLY = [{n:3,en:'triangle',he:'משולש'},{n:4,en:'square',he:'ריבוע'},{n:5,en:'pentagon',he:'מחומש'},{n:6,en:'hexagon',he:'משושה'},{n:8,en:'octagon',he:'מתומן'}];
function polySvg(n, c){
  const pts = Array.from({length:n},(_,i)=>{ const a=-Math.PI/2 + i*2*Math.PI/n + (n===4?Math.PI/4:0); return `${(50+42*Math.cos(a)).toFixed(1)},${(52+42*Math.sin(a)).toFixed(1)}`; }).join(' ');
  return `<svg viewBox="0 0 100 100" class="shp" aria-hidden="true"><polygon points="${pts}" fill="${c}"/></svg>`;
}
/* math: wrap the number generator with the new second-grade question kinds */
const gen_base = gen;
gen = function(type, it, nOpt){
  const m = type.match(/^([a-zA-Z]+?)(\d*)$/); const kind=m[1];
  switch(kind){
    case 'evenOdd': { const v=rnd(3,30), even=v%2===0;
      return {t:L2(()=>`Is ${v} even or odd? Even numbers can be shared in pairs.`,()=>`האם ${v} זוגי או אי-זוגי? מספר זוגי אפשר לחלק לזוגות.`),
        visual:`<span class="big">${v}</span>${v<=20?`<div class="pairs" style="--c:${Math.ceil(v/2)}">${Array.from({length:v},()=>'<span></span>').join('')}</div>`:''}`,
        opts:[{label:iconWord('👫','Even','זוגי'),value:'even'},{label:iconWord('🧍','Odd','אי-זוגי'),value:'odd'}], ans:even?'even':'odd', small:true}; }
    case 'array': { const r=rnd(2,5), c=rnd(2,5);
      return {t:L2(()=>`${r} rows of ${c} ${it.p}. How many in all?`,()=>`${r} שורות של ${c} ${it.h}. כמה בסך הכול?`),
        visual:`<div class="arr" style="--c:${c}">${rep(it.e,r*c)}</div>`, opts:numOptions(r*c,nOpt,2,30), ans:r*c}; }
    case 'hundreds': { const h=rnd(1,9), tn=rnd(0,9), o=rnd(0,9), v=h*100+tn*10+o;
      return {t:L2(()=>'What number is this? A big square is 100, a stick is 10, a cube is 1.',()=>'איזה מספר זה? ריבוע גדול הוא 100, מקל הוא 10, קובייה היא 1.'),
        visual:`<div class="pv">${'<span class="flat"></span>'.repeat(h)}<span class="pvgap"></span>${'<span class="rod sm"></span>'.repeat(tn)}<span class="pvgap"></span>${'<span class="one"></span>'.repeat(o)}</div>`,
        opts:optSet([v, tn!==h?tn*100+h*10+o:v+1, v+100<=999?v+100:v-100, v+10<=999?v+10:v-10, v+1],nOpt), ans:v}; }
    case 'addBig': { const a=rnd(12,78), b=rnd(11,99-a), s=a+b;
      return {t:L2(()=>`What is ${a} + ${b}?`,()=>`כמה זה ${a} ועוד ${b}?`), visual:`<span class="big">${a} + ${b} = ?</span>`, opts:optSet([s,s+10,s-10,s+1],nOpt), ans:s}; }
    case 'subBig': { const a=rnd(30,99), b=rnd(11,a-10), d=a-b;
      return {t:L2(()=>`What is ${a} − ${b}?`,()=>`כמה זה ${a} פחות ${b}?`), visual:`<span class="big">${a} − ${b} = ?</span>`, opts:optSet([d,d+10,d-10>=0?d-10:d+2,d+1],nOpt), ans:d}; }
    case 'clock': { const h=rnd(1,12), mm=5*rnd(1,11), f=(hh,x)=>`${hh}:${pad2(x)}`;   // time to 5 minutes (CCSS 2.MD.7)
      const set=new Set([f(h,mm), f(h,(mm+15)%60||5), f((h%12)+1,mm), f(h,mm/5)]); let k=10; while(set.size<nOpt) set.add(f(h,(mm+k)%60||k)), k+=5;
      return {t:L2(()=>'What time is it on the clock?',()=>'מה השעה בשעון?'), visual:clockSvg(h,mm), opts:shuffle([...set].slice(0,nOpt)).map(x=>({label:x,value:x})), ans:f(h,mm), small:true}; }
    case 'fractions': { const F=[['e2','halves','לחצאים',2,'u2'],['e3','thirds','לשלישים',3,'u3'],['e4','fourths','לרבעים',4,'u4']]; const x=pick(F), other=pick(F.filter(y=>y!==x)), round=Math.random()<.5, c=pick(SHAPE_COL);
      const kinds=[x[0], x[4], other[0]];
      return {t:L2(()=>`Which one is cut into ${x[1]} (${x[3]} equal parts)?`,()=>`איזו צורה חולקה ${x[2]} (${x[3]} חלקים שווים)?`),
        visual:'', opts:shuffle(kinds).map(k=>({label:partsSvg(k,round,c),value:k})), ans:x[0]}; }
    case 'polygons': { const p=pick(POLY), cols=shuffle(SHAPE_COL);
      if(Math.random()<.5) return {t:L2(()=>'How many sides does this shape have?',()=>'כמה צלעות יש לצורה הזאת?'), visual:polySvg(p.n,cols[0]).replace('class="shp"','class="shp bigshp"'),
        opts:shuffle([p.n,...shuffle(POLY.filter(y=>y!==p).map(y=>y.n)).slice(0,nOpt-1)]).map(v=>({label:String(v),value:v})), ans:p.n};
      const o=shuffle([p,...shuffle(POLY.filter(y=>y!==p)).slice(0,nOpt-1)]);
      return {t:L2(()=>`Which one is the ${p.en}?`,()=>`איפה ה${p.he}?`), visual:'', opts:o.map((y,i)=>({label:polySvg(y.n,cols[i]),value:y.n})), ans:p.n}; }
    case 'twoStep': { const a=rnd(5,15), b=rnd(2,9), c=rnd(2,Math.min(9,a+b-1)), ans=a+b-c;   // two-step story problem (CCSS 2.OA.1)
      return {t:L2(()=>`${nm()} had ${a} ${it.p}. He found ${b} more, then gave ${c} to a friend. How many does he have now?`,()=>`ל${nm()} היו ${a} ${it.h}. הוא מצא עוד ${b}, ואז נתן ${c} לחבר. כמה יש לו עכשיו?`),
        visual:`${cr(it.e)}<span class="cr m-wiggle">🤔</span>`, opts:numOptions(ans,nOpt,0,30), ans}; }
    case 'skip': { const st=+m[2]||10; if(st<10) break; const start=rnd(0,3)*st; const nums=[0,1,2,3].map(i=>start+i*st+st);   // big skips: choices differ by a whole step
      return {t:L2(()=>`Count by ${st}s. What comes next?`,()=>`סופרים בקפיצות של ${st}. מה הבא?`), visual:nums.slice(0,3).map(v=>`<span class="box">${v}</span>`).join('')+'<span class="box q">?</span>',
        opts:optSet([nums[3], nums[3]+st, nums[3]-st, nums[3]+(st>=100?10:1)],nOpt), ans:nums[3]}; }
  }
  return gen_base(type, it, nOpt);
};
LEVELS[7] = { title:{en:'Admiral',he:'אדמירל'}, em:'🎖️', cls:'a7', sub:{en:'Numbers to 1000, arrays, time, fractions',he:'מספרים עד 1000, מערכים, שעון, שברים'},
  plan:[ ['addBig','subBig','evenOdd','skip5'],['hundreds','compare999','addBig','array'],['array','clock','subBig','fractions'],['polygons','missing100','twoStep','skip100'],
         ['money','chart','twoStep','hundreds'],['twoStep','subBig','clock','array'] ], opts:4, extraAt:4, extraSticker:'🛍️', extra:LEVELS[6].extra };

/* letters: second-grade reading */
WORDS.en.push(['clock','⏰',1],['plant','🪴',1],['lemon','🍋',2],['cloud','☁️',1]);
BUILD.en[7] = ['snake','train','clock','plant','lemon','tiger','robot','zebra','cloud'];
BUILD.he[7] = ['שעון','לימון','בלון','סירה','גמל','קפוד','שועל','עכבר','כוכב'];
const SIGHT7 = { en:['because','where','there','said','could','would','their','which','about','every','after','again'],
                 he:['כִּי','אֵיפֹה','שָׁם','אָמַר','יָכוֹל','אֲבָל','כָּל','עַכְשָׁו','אַחֲרֵי','לִפְנֵי','שׁוּב','מְאוֹד'] };
const DIGRAPH = [['ship','🚢','sh'],['shell','🐚','sh'],['sheep','🐑','sh'],['shoe','👟','sh'],['chick','🐥','ch'],['cheese','🧀','ch'],['chair','🪑','ch'],['cherry','🍒','ch'],['thumb','👍','th'],['whale','🐋','wh']];
const HE_SPELL = [['תות','🍓','תּוּת'],['כלב','🐶','כֶּלֶב'],['קוף','🐒','קוֹף'],['חתול','🐱','חָתוּל'],['כוכב','⭐','כּוֹכָב'],['בית','🏠','בַּיִת'],['עכבר','🐭','עַכְבָּר'],['תפוח','🍎','תַּפּוּחַ']];
const SOUNDALIKE = {'ת':'ט','ט':'ת','כ':'ק','ק':'כ','א':'ע','ע':'א','ח':'כ','ב':'ו','ו':'ב'};
const PLACES = [{e:'🏞️',en:'park',he:'לפארק'},{e:'🏖️',en:'beach',he:'לים'},{e:'🌻',en:'garden',he:'לגינה'},{e:'🦁',en:'zoo',he:'לגן החיות'}];
const genL_base = genL;
genL = function(type){
  if(age<7 && !['spell','story'].includes(type)) return genL_base(type);   // age-7-only kinds always use their own version
  const H=he(), words=W(); let q=null;
  switch(type){
    case 'spell': {
      if(H){ const [p,e,nik]=pick(HE_SPELL); const wrong=new Set();
        for(let i=0;i<p.length && wrong.size<3;i++){ const r=SOUNDALIKE[p[i]]; if(r) wrong.add(p.slice(0,i)+r+p.slice(i+1)); }
        const opts=shuffle([p,...shuffle([...wrong]).slice(0,3)]);
        q={t:()=>'איך כותבים נכון את המילה?', sp:()=>`${nik}. איך כותבים נכון את המילה ${nik}?`, visual:cr(e), opts:opts.map(x=>({label:`<span class="wd">${x}</span>`,value:x})), ans:p}; }
      else { const [w,e,dg]=pick(DIGRAPH);
        q={t:()=>'Which letters are missing?', sp:()=>`${w}. Which two letters make the first sound of ${w}?`, visual:`${cr(e)}<span class="bigword"><span class="blank">__</span>${w.slice(2)}</span>`,
           opts:shuffle(['sh','ch','th','wh']).map(x=>({label:x,value:x})), ans:dg}; }
      break; }
    case 'story': { const pool = H ? words.filter(x=>x.s>0&&x.s<=2) : words.filter(x=>[...READ_EN(),...BUILD.en[7]].includes(x.w)); const ws=threePics(pool), pl=pick(PLACES), askPlace=Math.random()<.4;
      const text = H ? `${nm()} הלך ${pl.he}. שם הוא ראה ${ws[0].w}. ${nm()} שמח מאוד.` : `${nm()} went to the ${pl.en}. There he saw a ${ws[0].w}. ${nm()} was very happy.`;
      if(askPlace) q={t:()=>H?`קרא את הסיפור. לאן ${nm()} הלך?`:`Read the story. Where did ${nm()} go?`, visual:`<span class="bigword sent story" dir="auto">${text}</span>`,
        opts:shuffle([pl,...shuffle(PLACES.filter(x=>x!==pl)).slice(0,2)]).map(x=>({label:iconWord(x.e, x.en[0].toUpperCase()+x.en.slice(1), x.he.slice(1)),value:x.en})), ans:pl.en, small:true};
      else q={t:()=>H?`קרא את הסיפור. מה ${nm()} ראה?`:`Read the story. What did ${nm()} see?`, visual:`<span class="bigword sent story" dir="auto">${text}</span>`, opts:picOpts(shuffle(ws)), ans:ws[0].w};
      break; }
    case 'build': { const p=pick(BUILD[lang][7]); const info=H?words.find(x=>strip(x.w)===p):words.find(x=>x.w===p); const word=H?info.w:p;
      q={wide:true, t:()=>H?'איית את המילה!':'Spell the word!', sp:()=>H?`${word}. איית את המילה ${word}!`:`${word}. Spell the word ${word}!`, mount:el=>mountBuild(el,p.split(''),'',info.e,word)}; break; }
    case 'sightPop': { const list=SIGHT7[lang]; const sw=pick(list); const k=rnd(2,3); const dec=shuffle(list.filter(x=>x!==sw)).slice(0,7-k);
      const items=shuffle([...Array.from({length:k},()=>({label:sw,hit:true})), ...dec.map(d=>({label:d,hit:false}))]);
      q={wide:true, t:()=>H?`פוצץ את כל הבועות שכתוב בהן: ${sw}`:`Pop every bubble that says “${sw}”!`, sp:()=>H?`פוצץ את כל הבועות שכתוב בהן ${sw}!`:`Pop every bubble that says ${sw}!`, mount:el=>mountPop(el,items,true)}; break; }
    case 'trace': { const L=pick((H?'ךםןףץשצקע':'bdpqgjfkyz').split(''));
      q={wide:true, t:()=>H?`עקוב עם האצבע על האות ${L}!`:`Trace the letter ${L} with your finger!`, sp:()=>H?`עקוב עם האצבע על האות ${lname(L)}!`:`Trace the letter ${lname(L)} with your finger!`, mount:el=>mountTrace(el,L)}; break; }
    case 'readWord': if(!H){ const ws=threePics(words.filter(x=>[...READ_EN(),...BUILD.en[7]].includes(x.w)));
      q={t:()=>'Read the word. Which picture is it?', visual:`<span class="bigword">${ws[0].w}</span>`, opts:picOpts(shuffle(ws)), ans:ws[0].w}; } break;
  }
  if(!q) return genL_base(type);
  q.lang=lang; q.type=type; return q;
};
LEVELS_L[7] = { title:{en:'Story Reader',he:'קורא סיפורים'}, em:'📚', cls:'a7', sub:{en:'Spelling, sight words, short stories',he:'איות, מילים שכיחות, סיפורים קצרים'},
  plan:[ ['spell','readWord','story','swap'],['sightPop','build','spell','trace'],['clap','vowel','story','lastLetter'],['build','spell','sentence','sightPop'],['story','sentence','story','build'] ] };

/* science: second-grade topics */
const FOODCHAINS = [[['🌿','Leaf','עלה'],['🐛','Caterpillar','זחל'],['🐦','Bird','ציפור'],['🦅','Eagle','נשר']],[['🌾','Grain','גרעינים'],['🐭','Mouse','עכבר'],['🦉','Owl','ינשוף']],
  [['🥕','Carrot','גזר'],['🐰','Rabbit','ארנב'],['🦊','Fox','שועל']],[['🌱','Seaweed','אצה'],['🐟','Small fish','דג קטן'],['🦈','Shark','כריש']]];
const FOODS = {day:['🥦','🍎','🥕','🍌','🥛','🥚','🍇'], some:['🍭','🍩','🍟','🍰','🍫','🍬']};
const LANDS = [{k:'mountain',e:'⛰️',en:'a mountain',he:'הר'},{k:'river',e:'🏞️',en:'a river',he:'נהר'},{k:'island',e:'🏝️',en:'an island',he:'אי'},{k:'desert',e:'🏜️',en:'a desert',he:'מדבר'},{k:'volcano',e:'🌋',en:'a volcano',he:'הר געש'},{k:'sea',e:'🌊',en:'the sea',he:'ים'}];
const HEATCOOL = [{q:{en:'What happens to chocolate in the hot sun?',he:'מה קורה לשוקולד בשמש החמה?'},v:'🍫 ☀️',a:'melt'},{q:{en:'What happens to juice in the freezer?',he:'מה קורה למיץ במקפיא?'},v:'🧃 ❄️',a:'freeze'},
  {q:{en:'What happens to ice cream on a hot day?',he:'מה קורה לגלידה ביום חם?'},v:'🍦 ☀️',a:'melt'},{q:{en:'What happens to a puddle on a freezing night?',he:'מה קורה לשלולית בלילה קפוא?'},v:'💧 🥶',a:'freeze'},
  {q:{en:'What happens to cold butter when you warm it up?',he:'מה קורה לחמאה קרה כשמחממים אותה?'},v:'🧈 🔥',a:'melt'},{q:{en:'What happens to a rock in the sun?',he:'מה קורה לסלע בשמש?'},v:'🪨 ☀️',a:'same'}];
const HC_OPTS = [['🫠','It melts','נמס','melt'],['🧊','It freezes','קופא','freeze'],['🪨','It stays the same','נשאר אותו דבר','same']];
const MATERIALS = [{q:{en:'What is best for a window? You need to see through it.',he:'ממה הכי טוב לעשות חלון? צריך לראות דרכו.'},a:'glass'},{q:{en:'What is best for a raincoat? It must keep the water out.',he:'ממה הכי טוב להכין מעיל גשם? הוא צריך לעצור את המים.'},a:'plastic'},
  {q:{en:'What is best for a warm winter hat?',he:'ממה הכי טוב להכין כובע חם לחורף?'},a:'wool'},{q:{en:'What is best for a strong bridge?',he:'ממה הכי טוב לבנות גשר חזק?'},a:'metal'},
  {q:{en:'Which material comes from trees and is used for tables?',he:'איזה חומר מגיע מעצים ומשמש להכנת שולחנות?'},a:'wood'},{q:{en:'Which material is soft and used for T-shirts?',he:'איזה חומר רך ומשמש להכנת חולצות?'},a:'cotton'}];
const MAT = {glass:['🪟','Glass','זכוכית'],plastic:['🧴','Plastic','פלסטיק'],wool:['🧶','Wool','צמר'],metal:['🔩','Metal','מתכת'],wood:['🪵','Wood','עץ'],cotton:['👕','Cotton','כותנה']};
const genS_t = genS;
genS = function(type){
  const n = age===4 ? 3 : 4;
  switch(type){
    case 'foodChain': { const c=pick(FOODCHAINS);
      return {wide:true, t:L2(()=>'Who eats what? Tap the food chain in order, starting with the plant!',()=>'מי אוכל את מי? גע בשרשרת המזון לפי הסדר, החל מהצמח!'), mount:el=>mountOrder(el, c.map(x=>x[0]), capLab(c), 'stepc')}; }
    case 'foodGroup': { const bins=[{k:'day',icon:'💪',en:'Every day',he:'כל יום',e:FOODS.day},{k:'some',icon:'🎉',en:'Sometimes',he:'לפעמים',e:FOODS.some}];
      const items=bins.flatMap(b=>shuffle(b.e).slice(0,3).map(e=>({e,k:b.k})));
      return {wide:true, t:L2(()=>'Sort the food: good for every day, or only sometimes?',()=>'מיין את האוכל: טוב לכל יום, או רק לפעמים?'), mount:el=>mountSort(el, bins.map(b=>({k:b.k,icon:b.icon,label:tx(b.en,b.he)})), items)}; }
    case 'landforms': { const x=pick(LANDS); const o=shuffle([x,...shuffle(LANDS.filter(y=>y!==x)).slice(0,n-1)]);
      return {t:L2(()=>`Which picture shows ${x.en}?`,()=>`איזו תמונה מראה ${x.he}?`), visual:'', opts:o.map(y=>({label:cr(y.e),value:y.k})), ans:x.k}; }
    case 'heatCool': { const x=pick(HEATCOOL);
      return {t:L2(()=>x.q.en,()=>x.q.he), visual:`<span class="big">${x.v}</span>`, opts:shuffle(HC_OPTS).map(o=>({label:iconWord(o[0],o[1],o[2]),value:o[3]})), ans:x.a, small:true}; }
    case 'materials': { const x=pick(MATERIALS); const ks=shuffle([x.a,...shuffle(Object.keys(MAT).filter(k=>k!==x.a)).slice(0,n-1)]);
      return {t:L2(()=>x.q.en,()=>x.q.he), visual:'', opts:ks.map(k=>({label:iconWord(MAT[k][0],MAT[k][1],MAT[k][2]),value:k})), ans:x.a, small:true}; }
  }
  return genS_t(type);
};
LEVELS_S[7] = { title:{en:'Expert Explorer',he:'חוקר מומחה'}, em:'🧪', cls:'a7', sub:{en:'Food chains, materials, landforms, healthy food',he:'שרשראות מזון, חומרים, נופים, תזונה בריאה'},
  plan:[ ['foodChain','habitat','bodyPart','foodChain'],['lifeCycle','foodGroup','needs','lifeCycle'],['landforms','seasons','heatCool','landforms'],['materials','magnet','heatCool','floatSink'],['recycle','materials','foodGroup','landforms'] ] };
TIME_PLAN[7] = ['months','calendar','monthOrder','weekday'];
LEVELS_S[7].plan.splice(3,0,TIME_PLAN[7]); Object.assign(LEVELS_S[7],{extraAt:3, extraSticker:'⏰', extra:TIME_STATION});

/* logic: second-grade computational thinking */
const genC_base = genC;
genC = function(type){
  if(age<7 && type!=='predict') return genC_base(type);
  switch(type){
    case 'predict': { const P=boatPuzzle(); const {size,start,target,rocks,path}=P; const isRock=(r,c)=>rocks.some(([a,b])=>a===r&&b===c);
      const cand=[]; for(let r=0;r<size;r++) for(let c=0;c<size;c++){ const d=Math.abs(r-target[0])+Math.abs(c-target[1]); if(d>=1&&d<=2&&!isRock(r,c)&&!(r===start[0]&&c===start[1])) cand.push([r,c]); }
      const spots=shuffle([target, ...shuffle(cand).slice(0,2)]); const letters=['A','B','C']; const at=(r,c)=>spots.findIndex(([a,b])=>a===r&&b===c);
      const grid=`<div class="grid static" style="--n:${size}">${Array.from({length:size*size},(_,i)=>{ const r=Math.floor(i/size), c=i%size, k=at(r,c);
        return `<span class="gcell">${isRock(r,c)?'🪨':(r===start[0]&&c===start[1])?'⛵':k>=0?`<b class="cand">${letters[k]}</b>`:''}</span>`; }).join('')}</div>`;
      return {t:L2(()=>'Read the code. Where will the boat stop?',()=>'קרא את הקוד. איפה הסירה תעצור?'), visual:`${grid}<div class="prog static">${path.map(d=>`<span class="pcard">${d}</span>`).join('')}</div>`,
              opts:letters.slice(0,spots.length).map(l=>({label:l,value:l})), ans:letters[at(target[0],target[1])]}; }
    case 'loop': { const k=rnd(2,4), claps=rnd(1,3), stomps=rnd(1,2), askClaps=Math.random()<.5, ans=k*(askClaps?claps:stomps);
      return {t:L2(()=>`How many ${askClaps?'claps':'stomps'} in total?`,()=>`כמה ${askClaps?'מחיאות כפיים':'רקיעות'} יש בסך הכול?`),
              visual:loopBox(k,'👏'.repeat(claps)+' '+'🦶'.repeat(stomps)), opts:numOptions(ans,4,1,16), ans}; }
    case 'ifThen': { const v=rnd(1,20), ok=v>10 && v%2===0;
      return {t:L2(()=>`IF the number is bigger than 10 AND even, THEN the frog jumps. ELSE it sits. The number is ${v}. What does the frog do?`,
                   ()=>`אם המספר גדול מ-10 וגם זוגי, אז הצפרדע קופצת. אחרת היא יושבת. המספר הוא ${v}. מה הצפרדע עושה?`),
              visual:`<span class="big">${v} 🐸</span>`, opts:[{label:iconWord(ACT.jump[0],ACT.jump[1],'קופצת'),value:'jump'},{label:iconWord(ACT.sit[0],ACT.sit[1],'יושבת'),value:'sit'}], ans:ok?'jump':'sit', small:true}; }
    case 'sortRule': { const nums=[...shuffle([2,4,6,8,10,12,14,16,18,20,22,24]).slice(0,3), ...shuffle([1,3,5,7,9,11,13,15,17,19,21,23]).slice(0,3)];
      return {wide:true, t:L2(()=>'Sort the numbers: even or odd?',()=>'מיין את המספרים: זוגי או אי-זוגי?'),
              mount:el=>mountSort(el, [{k:'even',icon:'👫',label:tx('Even','זוגי')},{k:'odd',icon:'🧍',label:tx('Odd','אי-זוגי')}], nums.map(v=>({e:`<b class="numt">${v}</b>`,k:v%2?'odd':'even'})))}; }
  }
  return genC_base(type);
};
LEVELS_C[7] = { title:{en:'Code Admiral',he:'אדמירל הקוד'}, em:'🎖️', cls:'a7', sub:{en:'Predicting code, big mazes, AND rules, loops',he:'חיזוי קוד, מבוכים גדולים, חוקי "וגם", לולאות'},
  plan:[ ['boat','predict','boat','loop'],['steps','debug','predict','sortRule'],['ifThen','ifThen','boat','sortRule'],['loop','predict','loop','debug'],['debug','boat','predict','boat'] ] };

/* feelings: second-grade social-emotional learning */
const PERSP = [{e:'🎈💨',en:"Noa's balloon flew away.",he:'הבלון של נועה עף.',f:'sad',w:'noa'},{e:'🏆🏃',en:'Dan won the race!',he:'דן ניצח במרוץ!',f:'happy',w:'dan'},
  {e:'🌑💥',en:'Noa heard a loud bang in the dark.',he:'נועה שמעה בום חזק בחושך.',f:'scared',w:'noa'},{e:'🚶💢',en:'Someone pushed in front of Dan in the line.',he:'מישהו נדחף לפני דן בתור.',f:'angry',w:'dan'},
  {e:'🎉🎁',en:'Noa walked in and everyone shouted "Surprise!"',he:'נועה נכנסה וכולם צעקו "הפתעה!"',f:'surprised',w:'noa'},{e:'🥱🌙',en:'Dan stayed up very, very late.',he:'דן נשאר ער עד מאוחר מאוד.',f:'tired',w:'dan'},
  {e:'🐶❤️',en:'Noa got a new puppy!',he:'נועה קיבלה גור כלבים חדש!',f:'happy',w:'noa'},{e:'🧩💔',en:"Dan's puzzle fell on the floor and broke apart.",he:'הפאזל של דן נפל והתפרק.',f:'sad',w:'dan'}];
const PNAME = {noa:{en:'Noa',he:'נועה',fem:1}, dan:{en:'Dan',he:'דן',fem:0}};
const GROWTH = [{e:'🧩',en:'{n} can\'t finish a hard puzzle yet.',he:'{n} עוד לא מצליח לסיים פאזל קשה.',good:['💪',"I can't do it YET. I'll keep trying!",'אני עוד לא מצליח, אבל אמשיך לנסות!'],bad:[['😤','I quit!','אני מוותר!'],['😞',"I'm bad at everything.",'אני גרוע בהכול.']]},
  {e:'🚲',en:'{n} fell off his bike.',he:'{n} נפל מהאופניים.',good:['💪','I will practice and try again!','אתאמן ואנסה שוב!'],bad:[['😤','Bikes are stupid!','אופניים זה טיפשי!'],['🙅','I will never ride again.','לא ארכב יותר אף פעם.']]},
  {e:'✏️',en:'{n} wrote a letter the wrong way round.',he:'{n} כתב אות הפוך.',good:['🌱','Mistakes help me learn!','טעויות עוזרות לי ללמוד!'],bad:[['😭',"I can't write!",'אני לא יודע לכתוב!'],['🗑️','Throw the page away and stop.','לזרוק את הדף ולהפסיק.']]},
  {e:'⚽',en:'{n} missed the goal.',he:'{n} החטיא את השער.',good:['🔁','Next time I can practice and do better!','בפעם הבאה אתאמן ואצליח יותר!'],bad:[['😡','Blame a friend','להאשים חבר'],['🚪','Leave the game','לעזוב את המשחק']]}];
const CONFLICT = [['🛑','Stop and calm down','לעצור ולהירגע'],['🗣️','Say how you feel','להגיד מה אני מרגיש'],['👂','Listen to your friend','להקשיב לחבר'],['🤝','Find a fair solution together','למצוא פתרון הוגן ביחד']];
DO.push({e:'😢👥',en:'Some kids are teasing a child.',he:'כמה ילדים מציקים לילד.',good:['🙋','Tell a grown-up and stay with the child','לספר למבוגר ולהישאר עם הילד'],bad:[['😂','Laugh with them','לצחוק איתם'],['👀','Just watch','רק להסתכל'],['🏃','Walk away','ללכת משם']]},
        {e:'🥛💥',en:'You broke a cup by mistake and nobody saw.',he:'שברת כוס בטעות ואף אחד לא ראה.',good:['🗣️','Tell the truth','לספר את האמת'],bad:[['🙈','Hide the pieces','להחביא את השברים'],['👉','Blame someone else','להאשים מישהו אחר'],['🤐','Say nothing','לא להגיד כלום']]});
const genF_base = genF;
genF = function(type){
  if(age<7 && !['perspective','growth','conflict'].includes(type)) return genF_base(type);
  const keys=Object.keys(FACES);
  switch(type){
    case 'perspective': { const x=pick(PERSP), p=PNAME[x.w]; const o=shuffle([x.f,...shuffle(keys.filter(k=>k!==x.f && !CLOSE[x.f].includes(k))).slice(0,3)]);
      return {t:L2(()=>`${x.en} How does ${p.en} feel?`,()=>`${x.he} איך ${p.he} ${p.fem?'מרגישה':'מרגיש'}?`), visual:`<span class="big">${x.e}</span>`, opts:o.map(k=>({label:cr(FACES[k][0]),value:k})), ans:x.f}; }
    case 'growth': { const x=pick(GROWTH); const opts=shuffle([x.good,...x.bad]); const s=L2(()=>x.en.replace('{n}',nm()),()=>x.he.replace('{n}',nm()));
      return {t:L2(()=>`${s()} What can he say to himself?`,()=>`${s()} מה הוא יכול להגיד לעצמו?`), sp:()=>`${s()} ${tx('What can he say to himself?','מה הוא יכול להגיד לעצמו?')} ${listSay(opts.map(o=>tx(o[1],o[2])))}`,
              visual:`<span class="big">${x.e}</span>`, opts:opts.map(o=>({label:iconWord(o[0],o[1],o[2]),value:o[0]})), ans:x.good[0], small:true}; }
    case 'conflict':
      return {wide:true, t:L2(()=>'Solving a problem with a friend: tap the steps in order!',()=>'פותרים בעיה עם חבר: גע בשלבים לפי הסדר!'), mount:el=>mountOrder(el, CONFLICT.map(x=>x[0]), capLab(CONFLICT), 'stepc')};
    case 'share': { const total=4*rnd(2,3);
      return {wide:true, t:L2(()=>`Share ${total} cookies fairly between 4 friends!`,()=>`חלק ${total} עוגיות בצורה הוגנת בין 4 חברים!`), mount:el=>mountShare(el,total,4)}; }
  }
  return genF_base(type);
};
LEVELS_F[7] = { title:{en:'Heart Hero',he:'גיבור הלב'}, em:'🦸', cls:'a7', sub:{en:"Others' feelings, solving problems, never giving up",he:'רגשות של אחרים, פתרון בעיות, לא מוותרים'},
  plan:[ ['perspective','faceMatch','perspective','situation'],['whatToDo','conflict','whatToDo','perspective'],['breathe','calmPick','growth','whatToDo'],['share','growth','whatToDo','conflict'],['growth','perspective','whatToDo','conflict'] ] };

/* ---------- state ---------- */
const blank = () => ({4:{done:[],stars:0},5:{done:[],stars:0},6:{done:[],stars:0},7:{done:[],stars:0}});
/* progress is kept per world AND per language — the Hebrew and English trails have different content */
let progressAll = store.get('progress2', null);
if(!progressAll){ const m=store.get('progress',blank()), l=store.get('progressL',blank()), copy=o=>JSON.parse(JSON.stringify(o));
  progressAll = {math:{en:m, he:copy(m)}, letters:{en:l, he:copy(l)}}; }
for(const w of ['science','logic','feelings']) if(!progressAll[w]) progressAll[w] = {en:blank(), he:blank()};
for(const w in progressAll) for(const l of ['en','he']){ progressAll[w][l]=progressAll[w][l]||blank(); if(!progressAll[w][l][7]) progressAll[w][l][7]={done:[],stars:0}; }
let world = store.get('world','math'); if(!progressAll[world]) world='math';
const WORLD_DATA = { math:[STATIONS,STICKERS,LEVELS], letters:[STATIONS_L,STICKERS_L,LEVELS_L], science:[STATIONS_S,STICKERS_S,LEVELS_S],
                     logic:[STATIONS_C,STICKERS_C,LEVELS_C], feelings:[STATIONS_F,STICKERS_F,LEVELS_F] };
/* every world is shown as the same kind of thing: a colourful object inside a round badge in the world's colour */
const WICON = { math:'🧮', letters:'📖', science:'🔬', logic:'🧩', feelings:'💛' };
const WCOL  = { math:'#1f8fc4', letters:'#ff6b4a', science:'#2fb36b', logic:'#8a5cf6', feelings:'#f2b600' };
const wbadge = (w, cls='') => `<span class="wbadge ${cls}" style="--wc:${WCOL[w]}" aria-hidden="true">${WICON[w]}</span>`;
const WORLD_GEN = { letters:genL, science:t=>genS(t), logic:genC, feelings:genF };
const save = () => store.set('progress2', progressAll);
const PR = () => progressAll[world][lang];
const LV = () => WORLD_DATA[world][2];
const ST = (a=age) => { const base = WORLD_DATA[world][0]; const L=LV()[a];
  return (L&&L.extra) ? [...base.slice(0,L.extraAt), L.extra, ...base.slice(L.extraAt)] : base; };
const STK = (a=age) => { const base = WORLD_DATA[world][1]; const L=LV()[a];
  return (L&&L.extra) ? [...base.slice(0,L.extraAt), L.extraSticker, ...base.slice(L.extraAt)] : base; };
let age = null, stIdx = 0, qIdx = 0, qs = [], firstTry = true, stationStars = 0, busy = false;
let savedAge = store.get('age', null);
/* ---------- analytics hooks (sent through src/analytics.js → Amplitude; anonymous, parent opt-in, never names) ---------- */
let qStart=0, stStart=0, hintShown=false;
function track(name, props={}){ try{ if(window.BayAnalytics) window.BayAnalytics.track(name, Object.assign({language:lang, age_level:age||savedAge||null}, props)); }catch(e){} }
function syncUser(){ try{ if(!window.BayAnalytics || !savedAge) return;
  window.BayAnalytics.setUser({ language:lang, age_level:savedAge, voice_on:voiceOn, total_stars:WORLD_ORDER.reduce((s,w)=>s+progOf(w,savedAge).stars,0),
    worlds_completed:WORLD_ORDER.filter(w=>progOf(w,savedAge).done.length>=stationsOf(w,savedAge).length).length,
    app_version:(window.ADVENTURE_BAY_CONFIG||{}).appVersion||'dev' }); }catch(e){} }
const stats = store.get('stats', {});   // first-try results per language|world|age|station, for the Parents' Corner
const statKey = (w,a,i) => [lang,w,a,i].join('|');
/* ---------- adaptive learning: each skill gets easier or harder from its last 5 first-try answers ---------- */
let ADAPT = 0;   // -1 easier, 0 on level, +1 harder — read by the question makers while a question is being built
const skills = store.get('skills', {});   // key lang|world|age|skill → {h:[last 5 first-try results], tok, ex}
const skillOf = tp => tp.replace(/\d+$/,'');
const skKey = (w,a,sk) => [lang,w,a,sk].join('|');
const levelFrom = h => { if(!h || h.length<3) return 0; const r=h.reduce((x,y)=>x+y,0)/h.length; if(h.length>=4 && r>=0.8) return 1; if(r<=0.4) return -1; return 0; };
const lvlOf = (w,a,sk) => levelFrom((skills[skKey(w,a,sk)]||{}).h);
const weakSkills = (w,a) => Object.keys(skills).filter(k=>{ const [l,ww,aa]=k.split('|'); return l===lang && ww===w && +aa===a && skills[k].tok && levelFrom(skills[k].h)<0; })
  .map(k=>({sk:k.split('|')[3], tok:skills[k].tok}));
function recordSkill(q, ok){
  if(!q || !q.skill) return 0;
  const k=skKey(world,age,q.skill), r=skills[k]||(skills[k]={h:[]}), before=levelFrom(r.h);
  r.h.push(ok?1:0); if(r.h.length>5) r.h.shift(); r.tok=q.tok; try{ r.ex=q.t(); }catch(e){}
  store.set('skills',skills); return levelFrom(r.h)-before;
}
/* how far each number-based question can stretch or shrink */
const ADAPT_CAP = {count:20,recog:20,more:12,next:30,before:30,add:30,addPic:15,subPic:15,sub:30,seq:30,compare:120,missing:30,word:30,tapn:12,drag:12,order:20,pop:15};
const ADAPT_MIN = {count:3,recog:3,more:3,next:3,before:3,add:3,addPic:4,subPic:3,sub:4,seq:6,compare:3,missing:5,word:4,tapn:3,drag:2,order:5,pop:3};
function adaptN(kind, N){
  if(!ADAPT) return N;
  if(kind==='pattern') return ADAPT>0 ? 3 : 2;
  if(!(kind in ADAPT_CAP)) return N;
  return Math.max(ADAPT_MIN[kind], Math.min(Math.max(ADAPT_CAP[kind],N), Math.round(N*(ADAPT>0?1.5:0.6))));
}
function makeQ(tp, items){   // build one question at this skill's current level
  const sk=skillOf(tp), lv=lvlOf(world,age,sk), real=age, L=LV()[age];
  ADAPT=lv; let q;
  try{ if(WORLD_GEN[world]){ age=Math.max(4,Math.min(7,age+lv)); q=WORLD_GEN[world](tp); }   // other worlds: borrow the next/previous age's version
       else q=gen(tp, items, L.opts); }                                                      // numbers: stretch or shrink the numbers and answer choices
  finally{ age=real; ADAPT=0; }
  q.skill=sk; q.tok=tp; q.lvl=lv; return q;
}
const PRACTICE_ST = { icon:'🎯', name:{en:'Practice',he:'תרגול'}, intro:{en:"Let's practice the tricky ones together!",he:'בוא נתרגל ביחד את מה שקשה!'} };
function skillRows(w,A){
  const ks=Object.keys(skills).filter(k=>{ const [l,ww,aa]=k.split('|'); return l===lang && ww===w && +aa===A; });
  if(!ks.length) return '';
  return `<div class="skl"><b>${u().skillsH}</b>${ks.map(k=>{ const r=skills[k], lv=levelFrom(r.h);
    return `<div class="skr"><span class="lvl ${lv>0?'up':lv<0?'down':'on'}">${lv>0?'⬆ '+u().lvHarder:lv<0?'⬇ '+u().lvEasier:'● '+u().lvOn}</span><span class="dots5">${r.h.map(x=>x?'🟢':'⚪').join('')}</span><span class="skx">${esc(r.ex||'')}</span></div>`; }).join('')}</div>`;
}
if(/^(127\.0\.0\.1|localhost)$/.test(location.hostname)) window.__adv = { makeQ, skills, skKey, setW:w=>{world=w;}, setA:a=>{age=a;}, LV:()=>LV(), lang:()=>lang };   // local testing only

const WORLD_ORDER = ['math','letters','science','logic','feelings'];
const stationsOf = (w,a) => { const base=WORLD_DATA[w][0], L=WORLD_DATA[w][2][a]; return (L&&L.extra) ? [...base.slice(0,L.extraAt), L.extra, ...base.slice(L.extraAt)] : base; };
const stickersOf = (w,a) => { const base=WORLD_DATA[w][1], L=WORLD_DATA[w][2][a]; return (L&&L.extra) ? [...base.slice(0,L.extraAt), L.extraSticker, ...base.slice(L.extraAt)] : base; };
const progOf = (w,a) => progressAll[w][lang][a];
const totalStars = (a=savedAge) => WORLD_ORDER.reduce((s,w)=>s+progOf(w,a).stars,0);   // stars at one level, so counts match the trail and resets
const T2 = {
  en:{ hello:n=>`Hi ${n}! Ready for an adventure?`, dataH:'Usage data', dataShare:'Share anonymous usage data', off:'Off', on:'On',
       dataNote:"When on, the game sends anonymous events (like “station completed” or “question answered”) to help improve it. It never sends names, typed text or IP addresses. On by default; you can turn it off here at any time.",
       dataOff:'Usage data is not set up in this copy of the game, so nothing is sent.', practice:g=>`Practice with ${g}`, practiceOffer:'I made a special practice round with the tricky ones. Tap the Practice button!', practiceDone:n=>`Great practice, ${n}! The tricky ones are getting easier.`, lvUp:"You're getting really good at this! Next time it'll be a bit more challenging 🚀", skillsH:'Skills (the game adjusts these automatically)', lvHarder:'Harder', lvEasier:'Easier', lvOn:'On level', locked:'Finish every stop to open the treasure!', openIt:'Tap to open the treasure!', guideHi:(n,g)=>`Hi ${n}! I'm ${g.name.en} ${g.kind.en}, your guide here. Tap the first stop and let's go!`, welcome:(n,s)=>`Welcome back, ${n}! You have ${s} stars.`, welcome0:n=>`Welcome back, ${n}! Let's keep going.`, cont:'Continue the adventure', start:'Start the adventure',
       allDone:'You finished every world! 🎉', trophies:'My trophies', trophyTitle:n=>`${n}'s trophies`, howOld:'How old is our hero?', setupHi:"Welcome! Let's get ready for the adventure.", whatName:"What is your child's name?", namePh:'Name (optional)', years:a=>`${a} years old`,
       gateQ:(a,b)=>`For grown-ups: what is ${a} × ${b}?`, parents:"Parents' Corner", settings:'Settings', nameEn:'Name in English', nameHe:'Name in Hebrew',
       level:'Level (age)', progress:'Progress', progressNote:(a)=>`English trail, age ${a}. Each language keeps its own progress.`, firstTry:'The % shows how often he answered right on the first try.',
       needs:'Needs practice', none:'Not played yet', allGood:'No weak spots yet. Keep playing!', reset:'Reset this progress',
       resetAge:a=>`Reset age ${a} (English)`, resetAll:'Reset everything (all ages, both languages)', confirm:'Tap again to reset',
       voiceH:'Voice', voiceIn:'English voice', noVoice:'No English voice found on this device.', speed:'Speaking speed', slow:'Slow', normal:'Normal', test:'Test the voice',
       sample:()=>`Hi ${nm()}! A, B, C. Cat. Dog. Sun. What number comes after 3?`,
       voiceTip:'For a better voice: on iPad go to Settings → Accessibility → Spoken Content → Voices and download an "Enhanced" or "Premium" voice. On Android, install "Speech Services by Google" and download its voices. Then come back and pick it here.',
       resetDone:'Progress reset.', device:'Progress is saved on this device and browser only. Clearing browser data or using a private window erases it.', back:'Back to the game' },
  he:{ hello:n=>`שלום ${n}! מוכן להרפתקה?`, dataH:'נתוני שימוש', dataShare:'שיתוף נתוני שימוש אנונימיים', off:'כבוי', on:'פעיל',
       dataNote:'כשהאפשרות פעילה, המשחק שולח אירועים אנונימיים (כמו "סיום תחנה" או "מענה על שאלה") כדי לשפר אותו. הוא לעולם לא שולח שמות, טקסט שהוקלד או כתובות IP. פעיל כברירת מחדל; אפשר לכבות כאן בכל רגע.',
       dataOff:'נתוני שימוש לא הוגדרו בעותק הזה של המשחק, ולכן שום דבר לא נשלח.', practice:g=>`תרגול עם ${g}`, practiceOffer:'הכנתי לך סבב תרגול מיוחד עם מה שקשה. גע בכפתור התרגול!', practiceDone:n=>`תרגול מצוין, ${n}! הדברים הקשים נהיים קלים יותר.`, lvUp:'אתה ממש משתפר בזה! בפעם הבאה זה יהיה קצת יותר מאתגר 🚀', skillsH:'מיומנויות (המשחק מתאים אותן אוטומטית)', lvHarder:'מאתגר יותר', lvEasier:'קל יותר', lvOn:'ברמה', locked:'סיים את כל התחנות כדי לפתוח את האוצר!', openIt:'גע כדי לפתוח את האוצר!', guideHi:(n,g)=>{ const f=(g===GUIDES.science||g===GUIDES.feelings); return `שלום ${n}! אני ${g.name.he} ${g.kind.he}, ${f?'המדריכה':'המדריך'} שלך כאן. גע בתחנה הראשונה ויוצאים לדרך!`; }, welcome:(n,s)=>`ברוך שובך, ${n}! יש לך ${s} כוכבים.`, welcome0:n=>`ברוך שובך, ${n}! ממשיכים הלאה.`, cont:'ממשיכים בהרפתקה', start:'מתחילים בהרפתקה',
       allDone:'סיימת את כל העולמות! 🎉', trophies:'הגביעים שלי', trophyTitle:n=>`הגביעים של ${n}`, howOld:'בן כמה הגיבור שלנו?', setupHi:'ברוכים הבאים! בואו נתכונן להרפתקה.', whatName:'מה שם הילד או הילדה?', namePh:'שם (לא חובה)', years:a=>`בן ${a}`,
       gateQ:(a,b)=>`למבוגרים: כמה זה ${a} × ${b}?`, parents:'פינת ההורים', settings:'הגדרות', nameEn:'השם באנגלית', nameHe:'השם בעברית',
       level:'רמה (גיל)', progress:'התקדמות', progressNote:(a)=>`המסלול בעברית, גיל ${a}. לכל שפה יש התקדמות משלה.`, firstTry:'האחוז מראה כמה פעמים ענה נכון כבר בניסיון הראשון.',
       needs:'כדאי לתרגל', none:'עוד לא שוחק', allGood:'אין עדיין נקודות חלשות. ממשיכים לשחק!', reset:'איפוס ההתקדמות הזאת',
       resetAge:a=>`איפוס גיל ${a} (עברית)`, resetAll:'איפוס הכול (כל הגילים, שתי השפות)', confirm:'גע שוב כדי לאפס',
       voiceH:'קול', voiceIn:'קול בעברית', noVoice:'לא נמצא קול עברי במכשיר הזה.', speed:'מהירות דיבור', slow:'איטי', normal:'רגיל', test:'בדיקת הקול',
       sample:()=>`שָׁלוֹם ${nm()}! אָלֶף, בֵּית, גִּימֶל. בָּה, בִּי, בּוּ. אַרְיֵה. כֶּלֶב. שֶׁמֶשׁ.`,
       voiceTip:'לקול טוב יותר: באייפד היכנסו להגדרות ← נגישות ← תוכן מדובר ← קולות ← עברית, והורידו קול "משופר" (למשל כרמית). באנדרואיד התקינו את "Speech Services by Google" והורידו את הקול העברי. אחר כך חזרו לכאן ובחרו בו.',
       resetDone:'ההתקדמות אופסה.', device:'ההתקדמות נשמרת רק במכשיר ובדפדפן האלה. מחיקת נתוני הדפדפן או גלישה בחלון פרטי ימחקו אותה.', back:'חזרה למשחק' }
};
const u = () => T2[lang];
function nextStation(){
  const order=[world, ...WORLD_ORDER.filter(w=>w!==world)];
  for(const w of order){ const d=progOf(w,savedAge).done.length, n=stationsOf(w,savedAge).length; if(d<n) return {w,i:d}; }
  return null;
}
const ring = (done,total) => { const C=2*Math.PI*26, f=total?done/total:0;
  return `<svg viewBox="0 0 64 64" class="ring" aria-hidden="true"><circle cx="32" cy="32" r="26" class="ring-bg"/><circle cx="32" cy="32" r="26" class="ring-fg" stroke-dasharray="${(C*f).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 32 32)"/><text x="32" y="37" text-anchor="middle" class="ring-t">${done}/${total}</text></svg>`; };
let current = () => home();   // re-renders the visible screen when the language changes

/* ---------- render ---------- */
const app = $('#app');
const canFS = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
function topbar(back){
  const p = age ? PR()[age] : null;
  return `<div class="top">
    ${back?`<button class="iconbtn" id="back" aria-label="Back">${ICON.back}</button>`:`<div class="brand">${GUIDE} ${t().title}</div>`}
    <div class="tools">
      ${p?`<span class="pill">⭐ ${p.stars}</span>`:''}
      <button class="langbtn" id="lang" aria-label="Switch language">${ICON.globe}<span>${t().langBtn}</span></button>
      <button class="iconbtn" id="voice" aria-label="Voice on or off">${voiceOn?ICON.soundOn:ICON.soundOff}</button>
      ${canFS?`<button class="iconbtn" id="fs" aria-label="Full screen">${ICON.full}</button>`:''}
      ${back?'':`<button class="iconbtn" id="pc" aria-label="Parents' Corner">${ICON.lock}</button>`}
    </div></div>`;
}
function bindTop(backFn){
  const b=$('#back'); if(b) b.onclick=()=>{ busy=false; backFn(); };
  $('#lang').onclick=()=>{ lang = he()?'en':'he'; store.set('lang',lang); track('Language Changed',{to:lang}); syncUser(); applyLang(); try{speechSynthesis.cancel()}catch(e){};
    busy=false;
    if(age && !document.querySelector('.trail')) map(false);   // mid-station: go to this language's own map
    else current(); };
  $('#voice').onclick=()=>{ voiceOn=!voiceOn; store.set('voice',voiceOn); track('Voice Toggled',{voice_on:voiceOn}); if(!voiceOn) try{speechSynthesis.cancel()}catch(e){}; $('#voice').innerHTML=voiceOn?ICON.soundOn:ICON.soundOff; };
  const f=$('#fs'); if(f) f.onclick=()=>{ try{
    const d=document, el=d.documentElement;
    if(d.fullscreenElement||d.webkitFullscreenElement){ (d.exitFullscreen||d.webkitExitFullscreen).call(d); }
    else { const r=(el.requestFullscreen||el.webkitRequestFullscreen).call(el); if(r&&r.catch) r.catch(()=>{}); }
  }catch(e){} };
}

function home(){
  age=null; current=home; setWorldBg('home');
  if(!savedAge){   // first time: ask the hero's age once (it can be changed later in the Parents' Corner)
    app.innerHTML = topbar(false) + `
    <div class="hero pop"><div class="guide">${GUIDE}</div><h1>${t().title}</h1><p>${u().setupHi}</p></div>
    <div class="namebox setup"><label for="kidname">${u().whatName}</label><input id="kidname" maxlength="14" autocomplete="off" autocapitalize="words" placeholder="${u().namePh}" value="${esc(names[lang]||'')}"></div>
    <p class="setupq">${u().howOld}</p>
    <div class="ages">${[4,5,6,7].map(a=>`<button class="age ${LV()[a].cls}" data-age="${a}"><span class="em">${['🐣','⛵','🧭','🎖️'][a-4]}</span><span class="t">${u().years(a)}</span></button>`).join('')}</div>`;
    bindTop(); bindPC();
    app.querySelectorAll('.age').forEach(b=>b.onclick=()=>{
      const typed=($('#kidname').value||'').trim(); if(typed){ names[lang]=typed; store.set('names',names); }   // the name stays on this device only
      savedAge=+b.dataset.age; store.set('age',savedAge); track('Age Level Set',{age_level:savedAge, source:'first_launch'}); syncUser(); tone([520,780],.08); home(); });
    return;
  }
  const stars=totalStars(), nx=nextStation();
  const played = stars>0 || WORLD_ORDER.some(w=>[4,5,6,7].some(a=>progOf(w,a).done.length>0));
  const nxLabel = nx ? (()=>{ const s=stationsOf(nx.w,savedAge)[nx.i]; return `${WICON[nx.w]} ${t()[nx.w]} · ${s.icon} ${s.name[lang]}`; })() : '';
  app.innerHTML = topbar(false) + `
  <div class="hero pop">
    <div class="guide">${GUIDE}</div>
    <h1>${t().title}</h1>
    <p>${esc(!played ? u().hello(nm()) : stars ? u().welcome(nm(),stars) : u().welcome0(nm()))}</p>
  </div>
  ${nx ? `<button class="cont" id="cont"><span class="cplay">${ICON.play}</span><span class="ctxt"><b>${played?u().cont:u().start}</b><small>${nxLabel}</small></span></button>`
       : `<button class="cont" id="cont"><span class="cplay">🏆</span><span class="ctxt"><b>${u().allDone}</b></span></button>`}
  <div class="wcards">${WORLD_ORDER.map(w=>{ const p=progOf(w,savedAge), n=stationsOf(w,savedAge).length;
    return `<button class="wcard ${p.done.length>=n?'full':''}" data-w="${w}">${wbadge(w,'lg')}<span class="wname">${t()[w]}</span><span class="wguide">${GUIDES[w].e} ${GUIDES[w].name[lang]}</span>${ring(p.done.length,n)}<span class="wstar">⭐ ${p.stars}</span></button>`; }).join('')}</div>
  <div class="row"><button class="btn ghost" id="shelf">🏆 ${u().trophies}</button></div>`;
  bindTop(); bindPC();
  $('#cont').onclick=()=>{ if(!nx){ shelf(); return; } world=nx.w; store.set('world',world); age=savedAge; tone([520,780],.08); startStation(nx.i); };
  app.querySelectorAll('.wcard').forEach(b=>b.onclick=()=>{ world=b.dataset.w; store.set('world',world); age=savedAge; tone([520,780],.08); map(true); });
  $('#shelf').onclick=()=>{ track('Trophy Shelf Viewed'); shelf(); };
  if(!home.greeted){ home.greeted=true; setTimeout(()=>{ if(document.querySelector('#cont')) buddySay(HOME_LINES[lang][0](nm()), {speak:false}); }, 900); }
}
function bindPC(){ const b=$('#pc'); if(b) b.onclick=gate; }

function shelf(viewAge=savedAge){
  age=null; current=()=>shelf(viewAge); setWorldBg('home');
  app.innerHTML = topbar(true) + `
  <div class="celebrate pop shelfhead"><div class="huge">🏆</div><h2>${esc(u().trophyTitle(nm()))}</h2><div class="stars">⭐ ${totalStars(viewAge)}</div>
    <div class="chips">${[4,5,6,7].map(a=>`<button class="chip ${a===viewAge?'on':''}" data-a="${a}">${t().age} ${a}</button>`).join('')}</div></div>
  <div class="shelf">${WORLD_ORDER.map(w=>{ const p=progOf(w,viewAge), stk=stickersOf(w,viewAge), all=p.done.length>=stk.length;
    return `<div class="srow"><div class="sname">${wbadge(w)} ${t()[w]} <span class="wstar">⭐ ${p.stars}</span></div>
      <div class="slots2">${stk.map((s,i)=>`<span class="tro ${p.done.includes(i)?'on':''}">${p.done.includes(i)?s:'❔'}</span>`).join('')}<span class="tro big ${all?'on':''}">${chestSvg(all)}</span></div></div>`; }).join('')}</div>`;
  bindTop(home);
  app.querySelectorAll('.chip').forEach(b=>b.onclick=()=>shelf(+b.dataset.a));
}

function gate(){
  current=home; setWorldBg('home'); hideBuddy();
  const a=rnd(6,9), b=rnd(6,9), ans=a*b; const set=new Set([ans]); while(set.size<4) set.add(ans+pick([-10,-8,-6,-3,3,6,8,10]));
  app.innerHTML = topbar(true) + `
  <div class="qcard pop"><h2 class="qtext"><span>🔒 ${u().gateQ(a,b)}</span></h2>
    <div class="answers">${shuffle([...set]).map(v=>`<button class="ans small" data-v="${v}">${v}</button>`).join('')}</div></div>`;
  bindTop(home);
  app.querySelectorAll('.ans').forEach(btn=>btn.onclick=()=>{ if(+btn.dataset.v===ans){ track('Parents Corner Opened'); parents(); } else { track('Parents Gate Failed'); home(); } });
}

function parents(msg=''){
  age=null; current=()=>parents(); setWorldBg('home'); hideBuddy();
  const A=savedAge||5;
  const weak=[];
  const worldBlocks = WORLD_ORDER.map(w=>{ const p=progOf(w,A), sts=stationsOf(w,A);
    const rows = sts.map((s,i)=>{ const st=stats[statKey(w,A,i)]; const pct = st&&st.n ? Math.round(100*st.f/st.n) : null;
      if(pct!==null && st.n>=4 && pct<60) weak.push(`${WICON[w]} ${s.name[lang]} (${pct}%)`);
      return `<tr><td>${p.done.includes(i)?'✅':'⬜'}</td><td>${s.icon} ${s.name[lang]}</td><td class="pct ${pct===null?'':pct<60?'lo':pct<80?'mid':'hi'}">${pct===null?u().none:pct+'%'}</td></tr>`; }).join('');
    return `<details class="pworld"><summary>${wbadge(w,'sm')} ${t()[w]} <span class="wstar">${p.done.length}/${sts.length} · ⭐ ${p.stars}</span></summary><table class="ptable"><tbody>${rows}</tbody></table>${skillRows(w,A)}</details>`; }).join('');
  app.innerHTML = topbar(true) + `
  <div class="pcard2 pop">
    <h2>🔒 ${u().parents}</h2>
    <h3>${u().settings}</h3>
    <div class="pform">
      <label for="nmEn">${u().nameEn}</label><input id="nmEn" value="${esc(names.en||'')}" maxlength="14" autocomplete="off">
      <label for="nmHe">${u().nameHe}</label><input id="nmHe" value="${esc(names.he||'')}" maxlength="14" autocomplete="off" dir="rtl">
      <span class="lbl">${u().level}</span><div class="chips">${[4,5,6,7].map(a=>`<button class="chip ${a===A?'on':''}" data-a="${a}">${t().age} ${a}</button>`).join('')}</div>
    </div>
    <h3>📊 ${u().dataH}</h3>
    <div class="pform"><span class="lbl">${u().dataShare}</span><div class="chips" id="consent">${[[false,u().off],[true,u().on]].map(([v,l])=>`<button class="chip ${(!!(window.BayAnalytics&&window.BayAnalytics.consent))===v?'on':''}" data-v="${v}">${l}</button>`).join('')}</div></div>
    <p class="note">${window.BayAnalytics&&window.BayAnalytics.configured ? u().dataNote : u().dataOff}</p>
    <h3>🔊 ${u().voiceH}</h3>
    <div class="pform">
      <label for="vsel">${u().voiceIn}</label>
      ${voiceLists[lang].length ? `<select id="vsel">${voiceLists[lang].map(v=>`<option value="${esc(v.name)}" ${voices[lang]&&voices[lang].name===v.name?'selected':''}>${esc(v.name)}</option>`).join('')}</select>`
                                : `<span class="warnv">${u().noVoice}</span>`}
      <span class="lbl">${u().speed}</span><div class="chips" id="vspd">${[[.8,u().slow],[1,u().normal]].map(([v,l])=>`<button class="chip ${voiceSpeed===v?'on':''}" data-v="${v}">${l}</button>`).join('')}</div>
    </div>
    <div class="row"><button class="btn ghost" id="vtest">🔊 ${u().test}</button></div>
    <p class="note">${u().voiceTip}</p>
    <h3>${u().progress}</h3>
    <p class="note">${u().progressNote(A)} ${u().firstTry}</p>
    <div class="weak">${weak.length?`<b>${u().needs}:</b> ${weak.join(' · ')}`:u().allGood}</div>
    ${worldBlocks}
    <div class="row"><button class="btn ghost" id="rstAge">${u().resetAge(A)}</button><button class="btn ghost" id="rstAll">${u().resetAll}</button></div>
    <div class="row"><button class="btn" id="bk">${u().back}</button></div>
    ${msg?`<p class="note ok">${msg}</p>`:''}
    <p class="note">${u().device}</p>
  </div>`;
  bindTop(home);
  $('#nmEn').oninput=e=>{ names.en=e.target.value.trim(); store.set('names',names); };
  $('#nmHe').oninput=e=>{ names.he=e.target.value.trim(); store.set('names',names); };
  app.querySelectorAll('.pform .chip[data-a]').forEach(b=>b.onclick=()=>{ savedAge=+b.dataset.a; store.set('age',savedAge); track('Age Level Set',{age_level:savedAge, source:'parents_corner'}); syncUser(); parents(); });
  const vs=$('#vsel'); if(vs) vs.onchange=()=>{ voicePref[lang]=vs.value; store.set('vpref',voicePref); loadVoices(); speak(u().sample()); };
  app.querySelectorAll('#vspd .chip').forEach(b=>b.onclick=()=>{ voiceSpeed=+b.dataset.v; store.set('vspeed',voiceSpeed); track('Voice Speed Changed',{speed:voiceSpeed}); parents(); speak(u().sample()); });
  $('#vtest').onclick=()=>{ if(!voiceOn){ voiceOn=true; store.set('voice',true); } noVoiceWarned=false; speak(u().sample()); };
  const twoTap = (btn, action) => { let armed=false; btn.onclick=()=>{ if(!armed){ armed=true; btn.textContent=u().confirm; btn.classList.add('danger'); return; } action(); }; };
  twoTap($('#rstAge'), ()=>{   // this level, this language: trail, stars, stickers and first-try stats
    WORLD_ORDER.forEach(w=>{ progressAll[w][lang][A]={done:[],stars:0}; });
    Object.keys(stats).forEach(k=>{ const [l,,a]=k.split('|'); if(l===lang && +a===A) delete stats[k]; });
    Object.keys(skills).forEach(k=>{ const [l,,a]=k.split('|'); if(l===lang && +a===A) delete skills[k]; }); store.set('skills',skills);
    save(); store.set('stats',stats); track('Progress Reset',{scope:'age', age_level:A}); syncUser(); parents(u().resetDone); });
  twoTap($('#rstAll'), ()=>{   // everything: every world, every level, both languages
    WORLD_ORDER.forEach(w=>{ progressAll[w]={en:blank(), he:blank()}; });
    Object.keys(stats).forEach(k=>delete stats[k]);
    Object.keys(skills).forEach(k=>delete skills[k]); store.set('skills',skills);
    save(); store.set('stats',stats); track('Progress Reset',{scope:'all'}); syncUser(); parents(u().resetDone); });
  $('#bk').onclick=home;
  app.querySelectorAll('#consent .chip').forEach(b=>b.onclick=()=>{ const on=b.dataset.v==='true';
    if(!on) track('Analytics Turned Off');   // sent just before sharing stops, so opt-outs can be counted
    if(window.BayAnalytics) window.BayAnalytics.setConsent(on); if(on){ track('Analytics Consent Given'); syncUser(); } parents(); });
}

function map(greet){
  current=()=>map(false); setWorldBg(world);
  const P=PR()[age], L=LV()[age]; const next=P.done.length;
  const allDone = next>=ST().length, weakN = weakSkills(world,age).length;
  const msg = allDone ? t().mapAll(nm()) : next===0 ? u().guideHi(nm(), G()) : t().mapNext(nm(), ST()[next].name[lang]);
  app.innerHTML = topbar(true) + `
  <div class="maphead pop">${wbadge(world,'lg')}<div class="txt"><b>${t()[world]} · ${L.em} ${t().age} ${age} · ${L.title[lang]}</b><div>${esc(msg)}</div></div></div>
  ${weakN?`<div class="row"><button class="btn practice" id="practice">🎯 ${u().practice(G().name[lang])}</button></div>`:''}
  <div class="trail">
    ${ST().map((s,i)=>{ const done=P.done.includes(i), open=i===next, locked=i>next;
      return `<button class="stop ${done?'done':''} ${open?'open':''}" data-i="${i}" ${locked?'disabled':''}>
        <span class="ic">${done?'✅':s.icon}</span><span><div class="nm">${s.name[lang]}</div><div class="st">${done?t().done:locked?t().locked:t().go}</div></span></button>`; }).join('')}
  </div>
  <button class="chest ${allDone?'ready':''}" id="chest" aria-label="Treasure chest" ${allDone?'':'disabled'}>${chestSvg(allDone)}<span class="chestcap">${allDone?u().openIt:u().locked}</span></button>
  ${allDone?`<div class="row"><button class="btn" id="again">${t().again}</button></div>`:''}`;
  bindTop(home);
  app.querySelectorAll('.stop:not([disabled])').forEach(b=>b.onclick=()=>startStation(+b.dataset.i));
  if(allDone){ $('#again').onclick=()=>{ PR()[age]={done:[],stars:0}; save(); map(true); }; $('#chest').onclick=()=>{ track('Treasure Opened',{world}); treasure(); }; }
  if(weakN){ $('#practice').onclick=startPractice; if(greet) setTimeout(()=>{ if($('#practice')) buddySay(u().practiceOffer,{hop:true,speak:false}); },1800); }
  if(greet) track('World Opened',{world, stations_done:P.done.length, stations_total:ST().length, practice_offered:!!weakN});
  if(greet) speak(msg);
}

function startStation(i){
  stIdx=i; qIdx=0; stationStars=0;
  const s=ST()[i], L=LV()[age];
  const make = tp => makeQ(tp, s.items ? pick(s.items) : null);
  qs = [];
  for(const tp of L.plan[i]){   // avoid the same question twice in one station
    qs.push(pickFresh(()=>make(tp), qs));
  }
  const weak = weakSkills(world, age).filter(w=>!qs.some(q=>q.skill===w.sk));   // a weak skill comes back for review
  if(weak.length && qs.length>1 && Math.random()<.6){ const w=pick(weak); const slot=rnd(1,qs.length-1); qs[slot] = pickFresh(()=>make(w.tok), qs.filter((_,i)=>i!==slot)); }
  rememberQs(qs);
  stStart=Date.now();
  track('Station Started',{world, station_index:i, station_name:s.name.en, review_question:qs.some(q=>!L.plan[i].includes(q.tok))});
  showQ(true);
}
function startPractice(){   // a bonus round made of this world's weakest skills
  const weak = weakSkills(world, age); if(!weak.length) return;
  stIdx=-1; qIdx=0; stationStars=0;
  const withItems = ST().filter(x=>x.items), items = withItems.length ? pick(pick(withItems).items) : null;
  qs = [];
  for(let i=0;i<4;i++){ const tp=weak[i%weak.length].tok; qs.push(pickFresh(()=>makeQ(tp, items), qs)); }
  rememberQs(qs);
  stStart=Date.now();
  track('Practice Started',{world, skills:weak.map(w=>w.sk), skill_count:weak.length});
  showQ(true);
}
function practiceDone(){
  busy=false; track('Practice Completed',{world, stars:stationStars, max_stars:qs.length, duration_ms:Date.now()-stStart}); current=()=>map(false); setWorldBg(world);
  const msg=u().practiceDone(nm());
  app.innerHTML = topbar(true) + `<div class="celebrate pop"><div class="huge">${G().e}</div><h2>${esc(msg)}</h2>
    <div class="stars">${'⭐'.repeat(stationStars)}${'☆'.repeat(qs.length-stationStars)}</div>
    <div class="row"><button class="btn" id="go">${t().toMap}</button></div></div>`;
  bindTop(()=>map(false)); sfx.win(); burst(120); speak(msg); $('#go').onclick=()=>map(false);
}

let cheerIdx = 0;
function showQ(fresh){
  const s=stIdx<0?PRACTICE_ST:ST()[stIdx];
  if(qs[qIdx].lang && qs[qIdx].lang!==lang) qs[qIdx]=genL(qs[qIdx].type);   // letter questions are rebuilt in the new language
  const q=qs[qIdx], spk=()=>q.sp?q.sp():q.t();
  if(fresh){ firstTry=true; busy=false; cheerIdx=rnd(0,3); }
  current=()=>showQ(false); setWorldBg(world);
  const cheer = qIdx===0 ? s.intro[lang] : t().cheer[cheerIdx];
  app.innerHTML = topbar(true) + `
  <div class="qcard pop ${q.wide?'wide':''} ${world==='letters'&&he()?'nq':''}">
    <div class="story"><span class="g">${G().e}</span><div class="bubble"><b>${s.icon} ${s.name[lang]}</b> · ${cheer}</div></div>
    <div class="dots">${qs.map((_,i)=>`<span class="${i<qIdx?'on':i===qIdx?'cur':''}"></span>`).join('')}</div>
    <h2 class="qtext"><span>${esc(q.t())}</span><button class="say" id="say" aria-label="Read it again">${ICON.soundOn}</button></h2>
    ${q.visual?`<div class="visual">${q.visual}</div>`:''}
    ${q.mount ? `<div class="task" id="task"></div>` : `<div class="answers">${q.opts.map((o,i)=>`<button class="ans ${q.small?'small':''}" data-i="${i}">${o.label}</button>`).join('')}</div>`}
    <div class="feedback" id="fb" aria-live="polite"></div>
  </div>`;
  bindTop(()=>map(false));
  $('#say').onclick=()=>speak(spk());
  const vis=app.querySelector('.visual');
  if(vis) vis.onclick=e=>{ const c=e.target.closest('.cr'); if(!c||c.classList.contains('gone')) return;
    c.classList.remove('boing'); void c.offsetWidth; c.classList.add('boing'); tone([500+Math.random()*500],.08);
    c.addEventListener('animationend',()=>c.classList.remove('boing'),{once:true}); };
  document.body.classList.add('quiz');
  { const sg=$('.qcard .story .g'); if(sg){ sg.setAttribute('role','button'); sg.setAttribute('aria-label',G().name[lang]); sg.onclick=buddyTap; } }
  if(q.mount) q.mount($('#task'));
  else app.querySelectorAll('.ans').forEach(b=>b.onclick=()=>answer(b, q.opts[+b.dataset.i].value));
  speak(qIdx===0 ? `${s.intro[lang]} ${spk()}` : spk());
  if(fresh){ wrongs=0; qStart=Date.now(); hintShown=false; }
  armIdle();
}

function answer(btn, val){
  if(busy) return;
  if(val===qs[qIdx].ans){ btn.classList.add('right'); correct(); }
  else { btn.classList.add('wrong'); btn.disabled=true; miss(); }
}
function correct(){
  if(busy) return; busy=true;
  const fb=$('#fb');
  app.querySelectorAll('.ans,.check').forEach(b=>b.disabled=true);
  if(firstTry){ stationStars++; PR()[age].stars++; save(); }
  clearTimeout(idleT);
  if(firstTry){ streak++; if(streak%3===0) setTimeout(()=>buddySay(pick(BUDDY_TXT[lang].streak),{hop:true,speak:false}),400); } else streak=0;
  { const q=qs[qIdx], dl=recordSkill(q, firstTry); if(dl>0) setTimeout(()=>buddySay(u().lvUp,{hop:true,speak:false}),900);
    track('Question Answered',{world, station_index:stIdx, is_practice:stIdx<0, question_index:qIdx, skill:q.skill, question_type:q.tok, difficulty_level:q.lvl||0,
      first_try:firstTry, attempts:wrongs+1, time_to_answer_ms:Date.now()-qStart, hint_shown:hintShown, interaction:q.mount?'task':'choice'});
    if(dl) track('Skill Level Changed',{world, skill:q.skill, from_level:lvlOf(world,age,q.skill)-dl, to_level:lvlOf(world,age,q.skill)}); }
  if(stIdx>=0){ const k=statKey(world,age,stIdx), st=stats[k]||(stats[k]={n:0,f:0}); st.n++; if(firstTry) st.f++; store.set('stats',stats); }
  const praise = pick(t().praise) + `, ${nm()}!`;
  fb.className='feedback good'; fb.textContent='⭐ '+praise; sfx.good(); speak(praise); burst(40);
  app.querySelectorAll('.visual,.task').forEach(v=>v.classList.add('party'));
  const here=qIdx;
  setTimeout(()=>{ if(!busy || qIdx!==here) return; qIdx++; qIdx<qs.length ? showQ(true) : stationDone(); }, 1800);
}
function miss(text){
  firstTry=false; sfx.bad(); wrongs++; streak=0;
  const fb=$('#fb'), w = text || pick(t().oops);
  fb.className='feedback bad'; fb.textContent=w;
  if(wrongs===2){ buddySay(pickLine(G().hints[lang]), {hop:true}); hintShown=true; track('Hint Shown',{world, reason:'second_wrong_try', skill:(qs[qIdx]||{}).skill}); }   // second wrong try: the guide gives a hint
  else speak(w);
  armIdle();
}

function stationDone(){
  busy=false;
  if(stIdx<0){ practiceDone(); return; }
  const P=PR()[age]; if(!P.done.includes(stIdx)) P.done.push(stIdx); save();
  track('Station Completed',{world, station_index:stIdx, station_name:ST()[stIdx].name.en, stars:stationStars, max_stars:qs.length, duration_ms:Date.now()-stStart});
  if(stIdx===ST().length-1){ track('World Completed',{world, world_stars:PR()[age].stars}); syncUser(); treasure(); return; }
  syncUser();
  renderSticker(true);
}
function renderSticker(loud){
  current=()=>renderSticker(false); setWorldBg(world);
  const s=ST()[stIdx];
  const msg=t().sticker(nm(), s.name[lang]);
  app.innerHTML = topbar(true) + `
  <div class="celebrate pop">
    <div class="huge">${STK()[stIdx]}</div>
    <h2>${esc(msg)}</h2>
    <div class="stars">${'⭐'.repeat(stationStars)}${'☆'.repeat(qs.length-stationStars)}</div>
    <div class="row"><button class="btn" id="go">${t().next}</button><button class="btn ghost" id="redo">${t().redo}</button></div>
  </div>`;
  bindTop(()=>map(false));
  if(loud){ sfx.win(); burst(120); }
  speak(msg);
  $('#go').onclick=()=>map(true); $('#redo').onclick=()=>startStation(stIdx);
}

function treasure(loud=true){
  current=()=>treasure(false); setWorldBg(world);
  const msg=t().treasure(nm());
  app.innerHTML = topbar(true) + `
  <div class="celebrate pop">
    <div class="huge chestbig">${chestSvg(true)}</div>
    <h2>${esc(msg)}</h2>
    <div>${t().collected(PR()[age].stars, age)}</div>
    <div class="stickers">${STK().map((s,i)=>`<span style="--d:${i*0.15}s">${s}</span>`).join('')}</div>
    <div class="row">
      <button class="btn" id="home2">🏠 ${u().cont}</button>
      <button class="btn ghost" id="map">${t().toMap}</button>
    </div>
  </div>`;
  bindTop(()=>map(false));
  if(loud){ sfx.win(); burst(260); setTimeout(()=>burst(200),700); }
  speak(msg);
  $('#home2').onclick=home;
  $('#map').onclick=()=>map(false);
}

/* ---------- guide animals: one per world, a talking buddy that chats, helps and cheers ---------- */
const GUIDES = {
  math: { e:'🦜', name:{en:'Coco',he:'קוקו'}, kind:{en:'the parrot',he:'התוכי'},
    facts:{ en:['An octopus has 8 arms. Count them with me: 1, 2, 3, 4, 5, 6, 7, 8!','A spider has 8 legs, and you have 2!','5 fingers on each hand. How many on two hands? 10!',
                'Zero means nothing at all, like an empty treasure chest!','What did 0 say to 8? Nice belt! Squawk!','Numbers are everywhere: on clocks, on buses and on birthday cakes!'],
            he:['לתמנון יש 8 זרועות. בוא נספור: 1, 2, 3, 4, 5, 6, 7, 8!','לעכביש יש 8 רגליים, ולך יש 2!','5 אצבעות בכל יד. כמה בשתי ידיים? 10!',
                'אפס זה כלום, כמו תיבת אוצר ריקה!','מה אמר האפס לשמונה? איזו חגורה יפה!','מספרים יש בכל מקום: על השעון, על האוטובוס ועל עוגת יום ההולדת!'] },
    hints:{ en:['Touch each one with your finger as you count.','Count slowly, one at a time.','Tap the speaker to hear the question again.'],
            he:['גע בכל אחד עם האצבע בזמן שאתה סופר.','ספור לאט, אחד אחד.','גע ברמקול כדי לשמוע שוב את השאלה.'] } },
  letters: { e:'🦉', name:{en:'Ollie',he:'אולי'}, kind:{en:'the owl',he:'הינשוף'},
    facts:{ en:['A is the first letter of the alphabet, and Z is the last!','Every word is made of letters, like a tower made of blocks.','Who-who! Every letter has a sound. Listen closely!',
                'Cat, hat, bat. They rhyme! Can you think of another one?','Owls love stories. Will you read a book tonight?','Your name has letters too! Do you know the first one?'],
            he:['א היא האות הראשונה, ות היא האחרונה!','כל מילה בנויה מאותיות, כמו מגדל מקוביות.','הוּ הוּ! לכל אות יש צליל. הקשב טוב!',
                'בלון, שעון, לימון. הם מתחרזים! אתה מכיר עוד אחד?','ינשופים אוהבים סיפורים. תקרא ספר הערב?','גם בשם שלך יש אותיות! אתה יודע מה האות הראשונה?'] },
    hints:{ en:['Say the word out loud. What sound does it start with?','Look carefully at the shape of the letter.','Tap the speaker to hear it again.'],
            he:['תגיד את המילה בקול. באיזה צליל היא מתחילה?','הסתכל טוב על צורת האות.','גע ברמקול כדי לשמוע שוב.'] } },
  science: { e:'🐢', name:{en:'Shelly',he:'שלי'}, kind:{en:'the turtle',he:'הצבה'},
    facts:{ en:['Turtles carry their home on their back!','Plants drink water through their roots.','A caterpillar turns into a butterfly. Isn\'t that magic?',
                'Magnets pull metal things, like keys and coins.','Ice is just water that got very cold!','The sun is a star, and it is very, very far away!'],
            he:['צבים נושאים את הבית שלהם על הגב!','צמחים שותים מים דרך השורשים.','זחל הופך לפרפר. זה לא קסם?',
                'מגנטים מושכים דברים ממתכת, כמו מפתחות ומטבעות.','קרח הוא בעצם מים שהתקררו מאוד!','השמש היא כוכב, והיא מאוד מאוד רחוקה!'] },
    hints:{ en:['Think about what you see outside, in nature.','Take your time, explorer!','Tap the speaker to hear the question again.'],
            he:['חשוב על מה שאתה רואה בחוץ, בטבע.','קח את הזמן, חוקר!','גע ברמקול כדי לשמוע שוב את השאלה.'] } },
  logic: { e:'🦊', name:{en:'Finn',he:'פין'}, kind:{en:'the fox',he:'השועל'},
    facts:{ en:['A plan is a list of steps: first, then, last!','Computers follow instructions, just like the boat follows your arrows.','A bug is a mistake in a plan. Even grown-ups find bugs every day!',
                'If it rains, then I take an umbrella. That\'s a rule!','Foxes are clever, but I think you are even cleverer!','A loop means doing the same thing again and again. Clap, clap, clap!'],
            he:['תוכנית היא רשימה של שלבים: קודם, אחר כך, ובסוף!','מחשבים עושים מה שאומרים להם, בדיוק כמו שהסירה הולכת לפי החצים שלך.','באג זה טעות בתוכנית. גם מבוגרים מוצאים באגים כל יום!',
                'אם יורד גשם, אז אני לוקח מטריה. זה חוק!','שועלים הם חכמים, אבל נדמה לי שאתה עוד יותר חכם!','לולאה זה לעשות את אותו דבר שוב ושוב. מחיאה, מחיאה, מחיאה!'] },
    hints:{ en:['Try one step at a time.','Follow the path with your finger first.','It\'s okay to try again. That\'s how coders learn!'],
            he:['נסה צעד אחד בכל פעם.','עקוב קודם אחרי הדרך עם האצבע.','זה בסדר לנסות שוב. ככה מתכנתים לומדים!'] } },
  feelings: { e:'🐰', name:{en:'Luna',he:'לונה'}, kind:{en:'the bunny',he:'הארנבת'},
    facts:{ en:['All feelings are okay. What matters is what we do with them.','When I feel worried, I take three slow breaths.','A smile is a gift you can give every day!',
                'Helping a friend makes two people happy!','It\'s always okay to ask a grown-up for help.','Hop, hop! Bunnies feel happy when they play with friends.'],
            he:['כל הרגשות בסדר. מה שחשוב זה מה שעושים איתם.','כשאני דואגת, אני לוקחת שלוש נשימות איטיות.','חיוך הוא מתנה שאפשר לתת כל יום!',
                'כשעוזרים לחבר, שניים שמחים!','תמיד אפשר לבקש עזרה ממבוגר.','הופ הופ! ארנבות שמחות כשהן משחקות עם חברים.'] },
    hints:{ en:['How would your face look? Try making that face!','Think about how your friend feels.','Take your time. There\'s no rush.'],
            he:['איך הפנים שלך היו נראות? נסה לעשות את הפרצוף!','חשוב על מה שהחבר שלך מרגיש.','קח את הזמן. אין לחץ.'] } }
};
const HOME_LINES = { en:[n=>`Hi ${n}! Pick a world. My friends are waiting: Ollie the owl, Shelly the turtle, Finn the fox and Luna the bunny!`,
                         n=>`Tap the big yellow button and we'll continue the adventure, ${n}!`, n=>`Every station you finish gives you a sticker for your trophy shelf!`, n=>`Squawk! I'm Coco. I love numbers and adventures!`],
                     he:[n=>`שלום ${n}! בחר עולם. החברים שלי מחכים: אולי הינשוף, שלי הצבה, פין השועל ולונה הארנבת!`,
                         n=>`גע בכפתור הצהוב הגדול ונמשיך בהרפתקה, ${n}!`, n=>`על כל תחנה שתסיים תקבל מדבקה למדף הגביעים!`, n=>`קוואק! אני קוקו. אני אוהב מספרים והרפתקאות!`] };
const BUDDY_TXT = {
  en:{ streak:['Three in a row! You\'re amazing!','Wow, what a streak! Keep going!','You\'re on fire!'], idle:n=>`Hi ${n}, I'm right here. Need help?`, tap:'Tap me!' },
  he:{ streak:['שלוש ברצף! אתה מדהים!','וואו, איזה רצף! ממשיכים!','אתה בוער!'], idle:n=>`היי ${n}, אני כאן. צריך עזרה?`, tap:'גע בי!' }
};
const G = (w) => GUIDES[w===undefined ? world : w] || GUIDES.math;
let buddyTheme='home', buddyHideT=null, idleT=null, streak=0, wrongs=0, lastLine='';
function pickLine(list){ let l=pick(list), k=0; while(l===lastLine && k++<5) l=pick(list); lastLine=l; return l; }
function buddyEl(){
  let b=document.getElementById('buddy');
  if(!b){ b=document.createElement('div'); b.id='buddy';
    b.innerHTML=`<div class="bbl" id="bbl" role="status" aria-live="polite"></div><button class="buddy" id="buddyBtn" aria-label="Talk to the guide"><span class="bface" id="bface"></span></button>`;
    document.body.appendChild(b);
    b.querySelector('#buddyBtn').onclick=buddyTap;
  }
  return b;
}
function showBuddy(theme){
  const changed = theme!==buddyTheme;
  buddyTheme = theme; const b=buddyEl(); b.hidden=false;
  if(changed){ b.classList.remove("talk"); clearTimeout(buddyHideT); }   // a new guide never keeps the previous guide's words
  const g = theme==='home' ? GUIDES.math : G(theme);
  b.className = 'bd-'+theme; b.querySelector('#bface').textContent = g.e;
  b.querySelector('#buddyBtn').setAttribute('aria-label', `${g.name[lang]} ${g.kind[lang]}`);
}
function hideBuddy(){ const b=document.getElementById('buddy'); if(b){ b.hidden=true; b.classList.remove('talk'); } clearTimeout(idleT); }
function buddyTap(){ const lines = buddyTheme==='home' ? HOME_LINES[lang].map(f=>f(nm())) : G(buddyTheme).facts[lang];
  buddySay(pickLine(lines), {hop:true}); tone([700,950],.07); track('Guide Tapped',{guide:buddyTheme}); }
function buddySay(text, opt={}){
  /* during a question the guide talks in the story bubble at the top of the card: it can never cover an answer */
  const story = document.body.classList.contains('quiz') && document.querySelector('.qcard .story');
  if(story){
    const bub=story.querySelector('.bubble');
    if(bub.dataset.orig===undefined) bub.dataset.orig=bub.innerHTML;
    bub.textContent=text; bub.classList.add('talking'); fitScreen();
    if(opt.hop){ const g=story.querySelector('.g'); g.classList.remove('hop'); void g.offsetWidth; g.classList.add('hop'); }
    if(opt.speak!==false) speak(text);
    clearTimeout(buddyHideT); buddyHideT=setTimeout(()=>{ if(document.body.contains(bub)){ bub.innerHTML=bub.dataset.orig; delete bub.dataset.orig; bub.classList.remove('talking'); fitScreen(); } }, Math.max(4500, text.length*75));
    return;
  }
  const b=buddyEl(); if(b.hidden) return;
  b.querySelector('#bbl').textContent = text; b.classList.add('talk');
  placeBubble(b);
  if(opt.hop){ const f=b.querySelector('.buddy'); f.classList.remove('hop'); void f.offsetWidth; f.classList.add('hop'); }
  if(opt.speak!==false) speak(text);
  clearTimeout(buddyHideT); buddyHideT=setTimeout(()=>b.classList.remove('talk'), Math.max(3500, text.length*70));
}
/* the speech bubble must never cover something a child taps: if it would, it moves to the top of the screen */
const TAPPABLE = '#app button:not([disabled]), #app .ans, #app canvas, #app input, #app .bub, #app .tile, #app .slot, #app .mitem, #app .magnet, #app .cr.dr, #app .bin, #app .pickit, #app .tank';
function placeBubble(b){
  // the bubble always stays by the guide: above it, or beside it when that would cover a button
  // (it never blocks taps either way: they pass through it, and any tap closes it)
  const bb=b.querySelector('#bbl'); b.classList.remove('bbl-side');
  const covers = () => { const r=bb.getBoundingClientRect();
    return [...document.querySelectorAll(TAPPABLE)].some(el=>{ const e=el.getBoundingClientRect(); return e.width && e.height && e.bottom>0 && e.top<innerHeight && !(e.right<r.left||e.left>r.right||e.bottom<r.top||e.top>r.bottom); }); };
  if(covers()) b.classList.add('bbl-side');
}
/* any tap outside the guide closes the bubble straight away */
document.addEventListener('pointerdown', e=>{ const b=document.getElementById('buddy'); if(b && !e.target.closest('#buddy')) b.classList.remove('talk'); }, true);
addEventListener('scroll', ()=>{ const b=document.getElementById('buddy'); if(b && b.classList.contains('talk')) placeBubble(b); }, {passive:true});
function armIdle(){   // if a question sits unanswered for a while, the guide offers help
  clearTimeout(idleT); const here=qIdx, qs0=qs;
  idleT=setTimeout(()=>{ if(busy || qs!==qs0 || qIdx!==here || !document.querySelector('.qcard')) return;
    buddySay(`${BUDDY_TXT[lang].idle(nm())} ${pickLine(G().hints[lang])}`, {hop:true});
    hintShown=true; track('Hint Shown',{world, reason:'idle', skill:(qs[qIdx]||{}).skill}); }, 22000);
}

/* ---------- animated background: one scene per world ----------
   Three depths: far (small, faded, slow), mid, near (big, soft shadow). Sizes scale with --s (smaller on phones). */
const FXR = (a,b) => a + Math.random()*(b-a);
const fxEl = (cls, content, style) => `<span class="fx ${cls}" style="${style}" aria-hidden="true">${content}</span>`;
const fxLoop = (d) => `--dur:${d.toFixed(1)}s;--del:${(-FXR(0,d)).toFixed(1)}s`;
const sz = (rem) => `font-size:calc(var(--s) * ${rem.toFixed(2)}rem)`;
const many = (n, f) => Array.from({length:n}, (_,i)=>f(i)).join('');
const BG = {
  home: () =>
      fxEl('fx-swim fx-bob near','🐠',`bottom:70px;${sz(3.4)};${fxLoop(17)}`)
    + fxEl('fx-swimback fx-bob near','🐬',`bottom:18px;${sz(4.2)};${fxLoop(24)}`)
    + fxEl('fx-swimback far','🦀',`bottom:6px;${sz(2.6)};${fxLoop(30)}`)
    + fxEl('fx-swim fx-bob','🐙',`bottom:40px;${sz(3)};${fxLoop(32)}`)
    + fxEl('fx-jump near','🐳',`left:${FXR(15,70).toFixed(0)}%;bottom:30px;${sz(4.6)};${fxLoop(13)}`)
    + many(2,i=>fxEl('fx-swimback fx-flap',`🕊️`,`top:${(14+i*9)}%;${sz(2.6-i*.6)};${fxLoop(FXR(22,30))}`))
    + '<span class="fx fx-waves" aria-hidden="true"></span>',
  math: () =>
      fxEl('fx-isle far','🏝️',`bottom:58px;inset-inline-end:8%;${sz(5.5)}`)
    + many(12,()=>fxEl('fx-rise fx-num', rnd(0,9), `left:${FXR(2,94).toFixed(1)}%;${sz(FXR(1.8,3.2))};${fxLoop(FXR(15,26))}`))
    + fxEl('fx-swim fx-bob near','⛵',`bottom:54px;${sz(5)};${fxLoop(FXR(34,44))}`)
    + fxEl('fx-swimback fx-bob','🚤',`bottom:78px;${sz(3.2)};${fxLoop(FXR(20,28))}`)
    + fxEl('fx-swim fx-bob far','⛵',`bottom:96px;${sz(2.2)};${fxLoop(FXR(50,60))}`)
    + fxEl('fx-jump near','🐳',`left:${FXR(10,60).toFixed(0)}%;bottom:26px;${sz(5)};${fxLoop(12)}`)
    + many(3,i=>fxEl('fx-swimback fx-flap',`🕊️`,`top:${(10+i*8)}%;${sz(2.8-i*.5)};${fxLoop(FXR(20,30))}`))
    + '<span class="fx fx-waves" aria-hidden="true"></span><span class="fx fx-waves fx-waves2" aria-hidden="true"></span>',
  letters: () => {
    const A = LET(), cols = ['#ff6b4a','#1f8fc4','#2fb36b','#8a5cf6','#e6a400'];
    return many(14,()=>fxEl('fx-fall fx-let', pick(A), `left:${FXR(2,94).toFixed(1)}%;${sz(FXR(2.2,3.8))};color:${pick(cols)};${fxLoop(FXR(16,26))}`))
      + fxEl('fx-sun near','☀️',`${sz(6)}`)
      + fxEl('fx-kite near','🪁',`top:46%;left:5%;${sz(4)};--del:0s`) + fxEl('fx-kite','🪁',`top:62%;right:9%;${sz(3)};--del:-2.5s`)
      + many(2,i=>fxEl('fx-rise fx-slow','🎈',`left:${(20+i*55).toFixed(0)}%;${sz(3.4-i*.8)};${fxLoop(FXR(28,36))}`))
      + many(2,i=>fxEl('fx-swimback fx-flap',`🐦`,`top:${(12+i*10)}%;${sz(2.6-i*.6)};${fxLoop(FXR(18,26))}`))
      + '<span class="fx fx-dunes" aria-hidden="true"></span>'
      + fxEl('fx-weed near','🌴',`left:1%;bottom:10px;${sz(6.5)}`) + fxEl('fx-weed','🌴',`right:3%;bottom:6px;${sz(5)};--del:-1.5s`); },
  science: () =>
      '<span class="fx fx-rays" aria-hidden="true"></span>'
    + fxEl('fx-swim far','🐋',`top:16%;${sz(5.5)};${fxLoop(60)}`)
    + many(18,()=>{ const s=FXR(12,40).toFixed(0); return fxEl('fx-rise fx-bub',``,`left:${FXR(1,98).toFixed(1)}%;width:calc(var(--s) * ${s}px);height:calc(var(--s) * ${s}px);${fxLoop(FXR(8,16))}`); })
    + [['🐠',3.6,1],['🐡',3.2,0],['🐟',2.6,1],['🐠',2.2,0],['🐢',4.4,1]].map(([e,s,n],i)=>fxEl(`${i%2?'fx-swimback':'fx-swim'} fx-bob ${n?'near':'far'}`, e, `top:${(26+i*12)}%;${sz(s)};${fxLoop(FXR(22,38))}`)).join('')
    + fxEl('fx-jelly','🪼',`left:${FXR(55,80).toFixed(0)}%;top:30%;${sz(3.8)};${fxLoop(7)}`)
    + fxEl('fx-jelly far','🪼',`left:${FXR(8,30).toFixed(0)}%;top:45%;${sz(2.4)};${fxLoop(9)}`)
    + fxEl('fx-octo near','🐙',`left:6%;top:58%;${sz(4.4)};${fxLoop(6)}`)
    + fxEl('fx-walk near','🦀',`left:4%;bottom:4px;${sz(3.2)};${fxLoop(18)}`)
    + many(4,i=>fxEl('fx-coral','🪸',`left:${(10+i*24+FXR(0,8)).toFixed(1)}%;bottom:-6px;${sz(FXR(3.2,4.4))}`))
    + many(7,i=>fxEl('fx-weed','🌿',`left:${(i*14+FXR(0,6)).toFixed(1)}%;${sz(FXR(3.8,5.6))};--del:${(-FXR(0,4)).toFixed(1)}s`)),
  logic: () =>
      many(42,()=>{ const s=FXR(2,6).toFixed(1); return fxEl('fx-star',``,`left:${FXR(0,100).toFixed(1)}%;top:${FXR(0,75).toFixed(1)}%;width:${s}px;height:${s}px;${fxLoop(FXR(2,5))}`); })
    + many(2,i=>fxEl('fx-shoot',``,`left:${FXR(40,95).toFixed(0)}%;top:${FXR(4,30).toFixed(0)}%;${fxLoop(FXR(7,11))}`))
    + fxEl('fx-moon near','🌙',`${sz(5.2)}`)
    + fxEl('fx-drift far','🪐',`left:${FXR(55,80).toFixed(0)}%;top:12%;${sz(4.2)};${fxLoop(40)}`)
    + fxEl('fx-rocket near','🚀',`left:0;top:70%;${sz(3.6)};${fxLoop(16)}`)
    + fxEl('fx-swimback','🛰️',`top:22%;${sz(2.8)};${fxLoop(45)}`)
    + '<span class="fx fx-beam" aria-hidden="true"></span>'
    + fxEl('fx-house near','🗼',`${sz(6.2)}`)
    + many(7,i=>fxEl('fx-drift', i%2?'⚙️':'🧩', `left:${FXR(4,88).toFixed(1)}%;top:${FXR(12,78).toFixed(1)}%;${sz(FXR(2.6,3.8))};${fxLoop(FXR(18,30))}`)),
  feelings: () =>
      fxEl('fx-rainbow','🌈',`${sz(11)}`)
    + fxEl('fx-sunface near','🌞',`${sz(5)}`)
    + many(3,i=>fxEl('fx-cloud','☁️',`top:${8+i*13}%;${sz(6.4-i*1.2)};${fxLoop(FXR(55,85))}`))
    + many(10,()=>fxEl('fx-rise fx-heart', pick(['💗','💛','💜','💙','🩷']), `left:${FXR(2,94).toFixed(1)}%;${sz(FXR(2,3.2))};${fxLoop(FXR(16,26))}`))
    + many(3,i=>fxEl('fx-rise fx-slow near','🎈',`left:${(12+i*30+FXR(0,10)).toFixed(0)}%;${sz(3.6-i*.4)};${fxLoop(FXR(26,36))}`))
    + many(3,i=>fxEl('fx-flutter','🦋',`top:${22+i*20}%;${sz(3.4-i*.5)};${fxLoop(FXR(24,34))}`))
    + many(9,i=>fxEl('fx-weed', ['🌷','🌸','🌻','🌼'][i%4], `left:${(i*11+FXR(0,5)).toFixed(1)}%;bottom:-4px;${sz(FXR(3.4,4.8))};--del:${(-FXR(0,4)).toFixed(1)}s`))
};
let bgKey = '';
function setWorldBg(theme){   // called at the start of every screen
  showBuddy(theme);
  document.body.classList.remove('quiz');
  window.scrollTo(0,0);                                         // every new screen starts at the top
  requestAnimationFrame(()=>requestAnimationFrame(fitScreen)); setTimeout(fitScreen, 120);   // after the new screen is drawn (timer as a backup)
  const key = theme + '|' + lang;
  if(key === bgKey) return;          // same scene: keep the animation running smoothly between screens
  bgKey = key;
  let layer = document.getElementById('bgfx');
  if(!layer){ layer=document.createElement('div'); layer.id='bgfx'; layer.setAttribute('aria-hidden','true'); document.body.insertBefore(layer, document.body.firstChild); }
  document.body.classList.remove(...[...document.body.classList].filter(c=>c.startsWith('w-')));
  document.body.classList.add('w-'+theme);
  layer.innerHTML = (BG[theme]||BG.home)();
}

/* ---------- fit the whole screen to tablets: no scrolling ----------
   On screens 600px+ wide, if a screen is taller than the window it is scaled down (CSS zoom, never below 60%).
   Phones keep normal scrolling. Drag code divides by appZoom() so dragged items stay under the finger. */
const appZoom = () => parseFloat(document.getElementById('app').style.zoom) || 1;
function fitScreen(){
  const app=document.getElementById('app'); if(!app) return;
  app.style.zoom='';
  if(innerWidth<600) return;
  const cs=getComputedStyle(document.body), avail=innerHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom)-2;
  // big computer screens: grow everything evenly (same size on every screen), up to 140%
  const base = innerWidth>=1280 ? Math.min(1.4, Math.max(1, Math.min(innerWidth/1320, innerHeight/860))) : 1;
  const h=app.getBoundingClientRect().height, z=Math.max(0.6, Math.min(base, avail/h));
  if(Math.abs(z-1)>0.01) app.style.zoom=z.toFixed(3);
}
addEventListener('resize', ()=>{ requestAnimationFrame(fitScreen); clearTimeout(fitScreen._t); fitScreen._t=setTimeout(fitScreen, 150); });
try{ document.fonts.ready.then(()=>fitScreen()); }catch(e){}

/* ---------- remember recent questions so the same one doesn't come back soon (per language, world and age) ---------- */
const recentQ = store.get('recent', {});
const qSig = q => { try{ return q.t()+'|'+(q.ans===undefined?'':String(q.ans)); }catch(e){ return ''; } };
const recentKey = () => [lang,world,age].join('|');
const isRecent = q => (recentQ[recentKey()]||[]).includes(qSig(q));
/* make a question that is new: never twice in a station, not seen recently, else the one seen longest ago */
function pickFresh(make, qs){
  const r=recentQ[recentKey()]||[]; let best=null, bestScore=Infinity;
  for(let i=0;i<16;i++){ const q=make(), s=qSig(q);
    if(qs.some(p=>qSig(p)===s || (p.t()===q.t() && (p.visual||'')===(q.visual||'')))) continue;
    const score=r.lastIndexOf(s);   // -1 = not seen recently (best); smaller = seen longer ago
    if(score<bestScore){ best=q; bestScore=score; if(score<0) break; } }
  return best || make();
}
function rememberQs(list){ const k=recentKey(), r=recentQ[k]||(recentQ[k]=[]); list.forEach(q=>{ const s=qSig(q); if(s) r.push(s); }); while(r.length>80) r.shift(); store.set('recent',recentQ); }

/* ---------- treasure chest drawing: closed (locked, wobbles) and open (glowing, full of treasure) ---------- */
function chestSvg(open){
  const u = Math.random().toString(36).slice(2,7);
  const defs = `<defs>
    <linearGradient id="cw${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c47c3c"/><stop offset="1" stop-color="#7a431d"/></linearGradient>
    <linearGradient id="cl${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d48a46"/><stop offset="1" stop-color="#8f5126"/></linearGradient>
    <linearGradient id="cg${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1a8"/><stop offset=".45" stop-color="#f7c22c"/><stop offset="1" stop-color="#c88a00"/></linearGradient>
    <radialGradient id="cr${u}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6b0" stop-opacity=".95"/><stop offset=".6" stop-color="#ffd23f" stop-opacity=".35"/><stop offset="1" stop-color="#ffd23f" stop-opacity="0"/></radialGradient>
    <linearGradient id="cin${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a2f12"/><stop offset="1" stop-color="#2e170a"/></linearGradient>
  </defs>`;
  const W=`url(#cw${u})`, L=`url(#cl${u})`, G=`url(#cg${u})`;
  const spark = (x,y,s,d) => `<g transform="translate(${x} ${y}) scale(${s})"><path class="spk" style="animation-delay:${d}s" d="M0-7 1.6-1.6 7 0 1.6 1.6 0 7-1.6 1.6-7 0-1.6-1.6Z" fill="#fff"/></g>`;
  const body = `
    <rect x="14" y="58" width="92" height="44" rx="6" fill="${W}" stroke="#53300f" stroke-width="3"/>
    <path d="M16 73h88M16 88h88" stroke="#5e3414" stroke-width="2" opacity=".45"/>
    <rect x="26" y="56" width="10" height="46" rx="2" fill="${G}" stroke="#9a6a00" stroke-width="1.5"/>
    <rect x="84" y="56" width="10" height="46" rx="2" fill="${G}" stroke="#9a6a00" stroke-width="1.5"/>
    <rect x="11" y="53" width="98" height="9" rx="3" fill="${G}" stroke="#9a6a00" stroke-width="1.5"/>
    <circle cx="31" cy="95" r="1.6" fill="#9a6a00"/><circle cx="89" cy="95" r="1.6" fill="#9a6a00"/>`;
  const lock = `<rect x="50" y="52" width="20" height="24" rx="4" fill="${G}" stroke="#9a6a00" stroke-width="2"/>
    <circle cx="60" cy="61" r="3.2" fill="#4a2a0e"/><path d="M58.4 62h3.2l1.1 7h-5.4z" fill="#4a2a0e"/>`;
  if(!open) return `<svg viewBox="0 0 120 112" class="chest-svg closed" aria-hidden="true">${defs}
    <ellipse cx="60" cy="106" rx="48" ry="5" fill="rgba(0,0,0,.2)"/>
    ${body}
    <path d="M14 56V42Q14 16 60 16Q106 16 106 42V56Z" fill="${L}" stroke="#53300f" stroke-width="3"/>
    <path d="M20 34Q60 14 100 34" stroke="#5e3414" stroke-width="2" fill="none" opacity=".45"/>
    <path d="M26 20Q31 18 36 17V56H26Z" fill="${G}" stroke="#9a6a00" stroke-width="1.5"/>
    <path d="M84 17Q89 18 94 20V56H84Z" fill="${G}" stroke="#9a6a00" stroke-width="1.5"/>
    ${lock}
    <path d="M20 44Q22 28 38 22" stroke="#fff" stroke-opacity=".4" stroke-width="4" fill="none" stroke-linecap="round"/>
    ${spark(100,18,.7,0)}${spark(16,30,.5,1.1)}
  </svg>`;
  const rays = Array.from({length:12},(_,i)=>`<path d="M60 40 L${(60+70*Math.cos(i*Math.PI/6-0.12)).toFixed(1)} ${(40+70*Math.sin(i*Math.PI/6-0.12)).toFixed(1)} L${(60+70*Math.cos(i*Math.PI/6+0.12)).toFixed(1)} ${(40+70*Math.sin(i*Math.PI/6+0.12)).toFixed(1)}Z" fill="#ffe680" opacity=".55"/>`).join('');
  const coin = (x,y,r=6) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${(r*.8).toFixed(1)}" fill="${G}" stroke="#a87200" stroke-width="1.3"/><ellipse cx="${x}" cy="${y}" rx="${(r*.5).toFixed(1)}" ry="${(r*.38).toFixed(1)}" fill="none" stroke="#c88a00" stroke-width="1"/>`;
  const gem = (x,y,c,s=1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-6-3 -3-7H3L6-3 0 6Z" fill="${c}" stroke="rgba(0,0,0,.25)" stroke-width="1"/><path d="M-6-3H6M-3-7-1-3 0 6M3-7 1-3" stroke="rgba(255,255,255,.55)" stroke-width=".8" fill="none"/></g>`;
  return `<svg viewBox="-10 -30 140 142" class="chest-svg open" aria-hidden="true">${defs}
    <circle cx="60" cy="40" r="66" fill="url(#cr${u})"/>
    <g class="rays">${rays}</g>
    <ellipse cx="60" cy="106" rx="50" ry="5" fill="rgba(0,0,0,.2)"/>
    <path d="M16 54L20 12Q60-6 100 12L104 54Z" fill="${L}" stroke="#53300f" stroke-width="3"/>
    <path d="M22 50L25 18Q60 4 95 18L98 50Z" fill="url(#cin${u})"/>
    <path d="M26 16Q31 13 36 12L35 54H26Z" fill="${G}" stroke="#9a6a00" stroke-width="1.5"/>
    <path d="M84 12Q89 13 94 16L94 54H85Z" fill="${G}" stroke="#9a6a00" stroke-width="1.5"/>
    <path d="M18 58Q60 20 102 58Z" fill="#f2b51c" stroke="#a87200" stroke-width="1.5"/>
    ${coin(30,50)}${coin(42,44,7)}${coin(56,38,7)}${coin(70,40,7)}${coin(84,46,7)}${coin(92,52)}${coin(48,50)}${coin(64,48,7)}${coin(76,52)}${coin(36,56)}${coin(60,30,6)}
    ${gem(46,34,'#ff4d6d',1.1)}${gem(78,34,'#3fa9f5',1)}${gem(62,22,'#2fd17a',1.2)}${gem(88,40,'#b06cff',.9)}
    <path d="M24 56Q40 66 56 58Q70 52 86 62" stroke="#fff" stroke-width="3" fill="none" stroke-dasharray="0.1 5" stroke-linecap="round"/>
    ${body}
    ${lock}
    ${spark(22,8,1,0)}${spark(98,4,.8,.6)}${spark(60,-14,1.1,1.2)}${spark(8,40,.7,.9)}${spark(112,30,.9,.3)}
  </svg>`;
}

/* ---------- confetti ---------- */
const cv=$('#confetti'), cx=cv.getContext('2d'); let parts=[], raf=null;
function sizeCv(){ cv.width=innerWidth; cv.height=innerHeight; } sizeCv(); addEventListener('resize',sizeCv);
function burst(n){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cols=['#ffc533','#ff6b4a','#2fb36b','#1f8fc4','#ff9ad5'];
  for(let i=0;i<n;i++) parts.push({x:innerWidth/2,y:innerHeight*.45,vx:(Math.random()-.5)*14,vy:-Math.random()*14-4,r:5+Math.random()*6,c:pick(cols),life:90+Math.random()*40});
  if(!raf) loop();
}
function burstAt(elm,n){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const r=elm.getBoundingClientRect(), cols=['#cdeefc','#1f8fc4','#ffffff','#ffc533'];
  for(let i=0;i<n;i++) parts.push({x:r.left+r.width/2,y:r.top+r.height/2,vx:(Math.random()-.5)*10,vy:-Math.random()*8-2,r:4+Math.random()*4,c:pick(cols),life:40+Math.random()*20});
  if(!raf) loop();
}
function loop(){
  cx.clearRect(0,0,cv.width,cv.height);
  parts=parts.filter(p=>p.life-->0 && p.y<cv.height+20);
  parts.forEach(p=>{ p.vy+=.4; p.x+=p.vx; p.y+=p.vy; cx.fillStyle=p.c; cx.fillRect(p.x,p.y,p.r,p.r*1.6); });
  raf = parts.length ? requestAnimationFrame(loop) : (cx.clearRect(0,0,cv.width,cv.height), null);
}

try{ if(navigator.wakeLock){ const ask=()=>navigator.wakeLock.request('screen').catch(()=>{}); ask(); document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible') ask(); }); } }catch(e){}

applyLang();
home();
track('App Opened', {returning: WORLD_ORDER.some(w=>[4,5,6,7].some(a=>progOf(w,a).done.length>0)), age_set: !!savedAge});
syncUser();
})();
