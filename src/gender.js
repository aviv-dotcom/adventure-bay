/* Adventure Bay: boy/girl wording.
   The game's texts are written for a boy. When a parent picks "girl", these rules rewrite the words that talk to,
   or about, the child: commands (גע → געי), "you" (אתה → את), praise (אלוף → אלופה), level titles, short stories
   about the child by name, and the things the child says in the feelings questions.
   Words that describe someone else (a friend, an animal, a plant) are left alone, so every rule here is either a
   word only ever used for the child, or a phrase checked in context. {N} stands for the child's name.
   Used for the screen (game.js) and for speech; scripts/nikud.mjs also reads it to add vowel marks to the girl's forms. */
(function(){
  const L = '\\u05D0-\\u05EA\\u0591-\\u05C7';   // Hebrew letters and vowel marks
  const HE = {
    // Phrases first (checked in context)
    phrases: [
      // short stories about the child
      ['{N} הלך', '{N} הלכה'], ['לאן {N} הלך', 'לאן {N} הלכה'], ['שם הוא ראה', 'שם היא ראתה'], ['{N} שמח מאוד', '{N} שמחה מאוד'],
      ['מה {N} ראה', 'מה {N} ראתה'], ['מה {N} צריך', 'מה {N} צריכה'], ['ש{N} צריך', 'ש{N} צריכה'], ['{N} לוקח', '{N} לוקחת'],
      ['הוא מצא עוד', 'היא מצאה עוד'], ['הוא נתן', 'היא נתנה'], ['ואז נתן', 'ואז נתנה'], ['יש לו עכשיו', 'יש לה עכשיו'],
      ['מצא את אוצר', 'מצאה את אוצר'],
      // feelings and "keep trying" stories: the child and what the child says
      ['עוד לא מצליח לסיים', 'עוד לא מצליחה לסיים'], ['נפל מהאופניים', 'נפלה מהאופניים'], ['כתב אות הפוך', 'כתבה אות הפוך'],
      ['החטיא את השער', 'החטיאה את השער'], ['מה הוא יכול להגיד לעצמו', 'מה היא יכולה להגיד לעצמה'],
      ['אני עוד לא מצליח', 'אני עוד לא מצליחה'], ['אני מוותר', 'אני מוותרת'], ['אני גרוע', 'אני גרועה'],
      ['אני לא יודע לכתוב', 'אני לא יודעת לכתוב'], ['אני לא אוהב את זה', 'אני לא אוהבת את זה'], ['מה אני מרגיש', 'מה אני מרגישה'],
      ['היית מרגיש', 'היית מרגישה'], ['כשאתה מרגיש', 'כשאת מרגישה'], ['אתה מרגיש', 'את מרגישה'],
      // ...and the feeling after it ("when you feel sad")
      ['מרגישה שמח', 'מרגישה שמחה'], ['מרגישה עצוב', 'מרגישה עצובה'], ['מרגישה כועס', 'מרגישה כועסת'], ['מרגישה מפוחד', 'מרגישה מפוחדת'],
      ['מרגישה מופתע', 'מרגישה מופתעת'], ['מרגישה עייף', 'מרגישה עייפה'], ['מרגישה מאוד מאוד כועס', 'מרגישה מאוד מאוד כועסת'],
      ['אתה מצליח', 'את מצליחה'], ['אתה מכיר', 'את מכירה'], ['אתה יודע', 'את יודעת'], ['עוד יותר חכם', 'עוד יותר חכמה'],
      ['מוכן להרפתקה', 'מוכנה להרפתקה'], ['אתה מדהים', 'את מדהימה'], ['אתה בוער', 'את בוערת'], ['שאתה סופר', 'שאת סופרת'],
      ['אתה ממש משתפר', 'את ממש משתפרת'], ['חשוב על', 'חשבי על'], ['צריך עזרה', 'צריכה עזרה'],
      // setup and the hero
      ['בן כמה הגיבור', 'בת כמה הגיבורה'], ['שם הגיבור', 'שם הגיבורה'], ['קדימה גיבור', 'קדימה גיבורה'],
      // level titles
      ['חוקר אותיות', 'חוקרת אותיות'], ['חוקר קטן', 'חוקרת קטנה'], ['חוקר מומחה', 'חוקרת מומחית'], ['קורא צעיר', 'קוראת צעירה'],
      ['קורא סיפורים', 'קוראת סיפורים'], ['בלש הטבע', 'בלשית הטבע'], ['מדען צעיר', 'מדענית צעירה'], ['מתכנת קטן', 'מתכנתת קטנה'],
      ['מלח הקוד', 'מלחית הקוד'], ['מלח צעיר', 'מלחית צעירה'], ['גיבור הלב', 'גיבורת הלב'], ['חבר טוב', 'חברה טובה'],
      ['קפטן טוב לב', 'קפטנית טובת לב']
    ],
    // Single words that are only ever said to the child
    words: {
      'אתה':'את', 'שאתה':'שאת', 'כשאתה':'כשאת', 'חוקר':'חוקרת', 'אלוף':'אלופה', 'גיבור':'גיבורה', 'קפטן':'קפטנית',
      'גע':'געי', 'בוא':'בואי', 'נסה':'נסי', 'לחץ':'לחצי', 'בחר':'בחרי', 'גרור':'גררי', 'ספור':'ספרי', 'מצא':'מצאי', 'ומצא':'ומצאי',
      'עזור':'עזרי', 'נחש':'נחשי', 'הקשב':'הקשיבי', 'הסתכל':'הסתכלי', 'פוצץ':'פוצצי', 'הזז':'הזיזי', 'איית':'אייתי', 'עקוב':'עקבי',
      'מיין':'מייני', 'התאם':'התאימי', 'בנה':'בני', 'קרא':'קראי', 'פעל':'פעלי', 'סיים':'סיימי', 'קח':'קחי', 'שים':'שימי',
      'בדוק':'בדקי', 'היזהר':'היזהרי', 'המשך':'המשיכי', 'כסה':'כסי', 'תכנן':'תכנני', 'תופף':'תופפי', 'ותופף':'ותופפי',
      'תקן':'תקני', 'ותקן':'ותקני', 'ותראה':'ותראי', 'תגיד':'תגידי', 'תקבל':'תקבלי', 'תקרא':'תקראי', 'שתסיים':'שתסיימי'
    },
    // Not to be touched by the word rules ("no pressure", "what does a plant need")
    keep: ['אין לחץ', 'מה צמח צריך'],
    // For speech only: same spelling, different vowels for a girl (הצלחת: hitzlachta → hitzlacht)
    speech: {
      'את':'אַתְּ', 'שאת':'שֶׁאַתְּ', 'כשאת':'כְּשֶׁאַתְּ', 'לך':'לָךְ', 'שלך':'שֶׁלָּךְ', 'עליך':'עָלַיִךְ', 'ולך':'וְלָךְ',
      'הצלחת':'הִצְלַחְתְּ', 'מצאת':'מָצָאת', 'ומצאת':'וּמָצָאת', 'קיבלת':'קִבַּלְתְּ', 'סיימת':'סִיַּמְתְּ', 'אספת':'אָסַפְתְּ',
      'שיחקת':'שִׂחַקְתְּ', 'ראית':'רָאִית', 'שמעת':'שָׁמַעַתְּ', 'פתחת':'פָּתַחַתְּ', 'שברת':'שָׁבַרְתְּ', 'כשטעית':'כְּשֶׁטָּעִית',
      'היית':'הָיִית', 'הפלת':'הִפַּלְתְּ'
    }
  };
  const EN = {
    phrases: [
      ['He found', 'She found'], ['does he have', 'does she have'], ['There he saw', 'There she saw'], ['his bike', 'her bike'],
      ['What can he say to himself', 'What can she say to herself'], ['He gave', 'She gave']
    ]
  };

  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const cache = {};
  function compile(name){
    const key = name || '';
    if(cache[key]) return cache[key];
    const N = esc(name || '\u0000');
    const heRules = HE.phrases.map(([a, b]) => [new RegExp(`(?<![${L}])${esc(a).replace('\\{N\\}', N)}(?![${L}])`, 'g'), b.replace('{N}', name || '')]);
    const words = new RegExp(`(?<![${L}])(${Object.keys(HE.words).sort((a, b) => b.length - a.length).map(esc).join('|')})(?![${L}])`, 'g');
    const enRules = EN.phrases.map(([a, b]) => [new RegExp(`\\b${esc(a)}\\b`, 'g'), b]);
    return cache[key] = { heRules, words, enRules };
  }
  // Rewrite text for a girl. lang: 'he' | 'en'. name: the child's name as shown. speech: also fix vowels for speaking.
  function girl(text, lang, name, speech){
    if(!text) return text;
    const c = compile(name);
    if(lang !== 'he'){ let s = text; for(const [re, b] of c.enRules) s = s.replace(re, b); return s; }
    let s = text;
    const held = [];
    HE.keep.forEach((k, i) => { if(s.includes(k)){ s = s.split(k).join(`\u0001${i}\u0001`); held.push(i); } });
    // for speech, the word את that is already in the text means "the" (אֶת), not "you": keep it out of the "you" vowels
    if(speech) s = s.replace(new RegExp(`(?<![${L}])את(?![${L}])`, 'g'), '\u0002');
    for(const [re, b] of c.heRules) s = s.replace(re, b);
    s = s.replace(c.words, w => HE.words[w]);
    held.forEach(i => { s = s.split(`\u0001${i}\u0001`).join(HE.keep[i]); });
    if(speech) s = s.replace(new RegExp(`(?<![${L}])(${Object.keys(HE.speech).map(esc).join('|')})(?![${L}])`, 'g'), w => HE.speech[w]).replace(/\u0002/g, 'את');
    return s;
  }
  window.BayGender = { girl, rules: { HE, EN } };
})();
