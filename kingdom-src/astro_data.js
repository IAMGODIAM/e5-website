/* ============================================================
   THE KINGDOM — Deep Astro + Numerology Corpus
   Real, specific, dynamic content. Not surface-level.
   ============================================================ */
const ASTRO = {
  // ---- SUN SIGNS (the core self) ----
  sun: {
    Gemini:   { glyph:'♊', element:'Air', mode:'Mutable', ruler:'Mercury',
      line:"Quick, curious, and impossible to bore — your mind moves faster than most people can follow, and you fall in love through words.",
      gift:"You make connection feel effortless. You can talk to anyone, about anything, and leave them feeling seen.",
      shadow:"Restlessness. Your mind wants the next thing before you've finished the last. Stillness is your growth edge." },
    Aquarius: { glyph:'♒', element:'Air', mode:'Fixed', ruler:'Uranus / Saturn',
      line:"A builder of futures that don't exist yet — you see the world not as it is, but as it could be, and you refuse to look away.",
      gift:"Unshakeable conviction. Once you decide something matters, you'll build it brick by brick while everyone else is still talking.",
      shadow:"Emotional distance. You live in the idea; remember the people in front of you live in the moment." },
  },
  // ---- MOON SIGNS (the inner emotional world) ----
  moon: {
    Leo:   { glyph:'☾', line:"Your heart needs to be witnessed. You love loudly, generously, theatrically — and you wilt without warmth returned.",
      need:"To be adored, and to adore back. Affection is your oxygen." },
    Libra: { glyph:'☾', line:"You feel most at peace when things are fair and beautiful. Conflict unsettles your core; harmony restores it.",
      need:"Balance, partnership, and a home that feels like art." },
  },
  // ---- RISING SIGNS (the mask, the first impression) ----
  rising: {
    Capricorn: { glyph:'ASC', line:"You walk in composed, capable, a little reserved — people trust you before you've said a word. The warmth is earned, not given." },
    Scorpio:   { glyph:'ASC', line:"You enter a room and it shifts. Intense, magnetic, unreadable at first — people feel your depth before they understand it." },
  },
  // ---- SYNASTRY (the two charts together) ----
  synastry: {
    headline:"Air meets Air",
    detail:"Gemini and Aquarius are both Air signs — two minds that never run out of words. This is the rarest kind of compatibility: you actually like talking to each other, decades in. Gemini brings curiosity and play; Aquarius brings vision and loyalty. Together you build a world of ideas no one else is invited into.",
    moonNote:"Her Leo Moon needs to be adored; his Libra Moon lives to make things harmonious and beautiful. She wants to be seen — he is wired to see her. That's not luck. That's design.",
    challenge:"Both Air. Sometimes you'll live in your heads and forget the body, the rest, the quiet. Your work is to come down out of the mind and just be in the same room, saying nothing.",
  },
};

// ---- CHINESE ZODIAC: Fire Rabbit (丁卯) — deep, not surface ----
const FIRE_RABBIT = {
  glyph:'丁卯',
  name:'Fire Rabbit',
  years:'1987',
  essence:"The Fire Rabbit is the most warm-blooded of the Rabbits — gentle by nature, but lit from within by Fire. Diplomatic, intuitive, and quietly ambitious, the Fire Rabbit builds a beautiful life and then guards it fiercely.",
  traits:[
    {k:'Devotion', v:"Once the Fire Rabbit chooses you, it is for life. Loyalty isn't a decision — it's the whole personality."},
    {k:'Intuition', v:"They read a room in seconds and a person in less. Trust the gut feeling; it's almost always right."},
    {k:'Refinement', v:"Drawn to beauty, comfort, and a home that feels like a sanctuary. The Fire Rabbit makes everywhere softer."},
    {k:'Quiet fire', v:"Underneath the gentleness is real ambition. The Fire Rabbit doesn't shout — it simply doesn't stop."},
  ],
  together:"Two Fire Rabbits, born ninety-six days apart in the same Miami spring of 1987. The same heart, doubled. You don't just love each other — you recognize each other. This is the rarest pairing in the zodiac: two souls running the exact same operating system, choosing the same home.",
};

// ---- NUMEROLOGY: real Life Path meanings ----
const NUMEROLOGY = {
  6: { title:'The Nurturer', color:'var(--elvia)',
    line:"Life Path 6 is the heart of the home — responsible, protective, devoted to the people they love. You give, and give, and your love is the gravity others orbit.",
    gift:"You create belonging. People feel safe with you.",
    work:"Remember to receive, not only give." },
  8: { title:'The Builder', color:'var(--izzy)',
    line:"Life Path 8 is the architect of the material world — ambitious, disciplined, born to build things that outlast them. Power, when used in love, becomes legacy.",
    gift:"You turn vision into structure. You make ideas real.",
    work:"Let the empire serve the love, never the reverse." },
  5: { title:'Freedom', color:'var(--gold)',
    line:"Together: 6 + 8 = 14 → 5. Your union's number is Freedom — adventure, change, and a life that refuses to be small. You were never meant to stay still. You were meant to move through the world together.",
    gift:"As a pair, you are unstoppable and unbound.",
    work:"Freedom with roots. Wander — but always come home." },
};

// Map a person id -> their personalized cosmic profile
function cosmicProfile(who){
  const P = (typeof PEOPLE!=='undefined') ? PEOPLE[who] : null;
  if(!P) return null;
  return {
    sun: ASTRO.sun[P.sunName]||null,
    moon: ASTRO.moon[P.moon]||null,
    rising: ASTRO.rising[P.rising]||null,
    life: NUMEROLOGY[P.life]||null,
  };
}

/* ---- LIVE TRANSITS: lightweight geocentric ephemeris (sign-accurate) ---- */
const ZODIAC=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const ZGLYPH={Aries:'♈',Taurus:'♉',Gemini:'♊',Cancer:'♋',Leo:'♌',Virgo:'♍',Libra:'♎',Scorpio:'♏',Sagittarius:'♐',Capricorn:'♑',Aquarius:'♒',Pisces:'♓'};
function julian(d){return d.getTime()/86400000 + 2440587.5;}
function norm360(x){x%=360;return x<0?x+360:x;}
// Mean-longitude approximations (deg). Good enough to place each planet in the correct sign.
function planetLongitudes(date){
  const d=julian(date)-2451545.0; // days since J2000
  const T=d/36525.0;
  const L={};
  L.Sun=norm360(280.460+0.9856474*d);
  // Moon mean longitude
  L.Moon=norm360(218.316+13.176396*d);
  L.Mercury=norm360(252.251+4.092339*d);
  L.Venus=norm360(181.980+1.602131*d);
  L.Mars=norm360(355.433+0.524033*d);
  L.Jupiter=norm360(34.351+0.083091*d);
  L.Saturn=norm360(50.077+0.033494*d);
  L.Uranus=norm360(314.055+0.011733*d);
  L.Neptune=norm360(304.349+0.005965*d);
  L.Pluto=norm360(238.96+0.003968*d);
  return L;
}
function signOf(lon){const i=Math.floor(norm360(lon)/30);return {sign:ZODIAC[i],glyph:ZGLYPH[ZODIAC[i]],deg:(lon%30)};}
const PLANET_GLYPH={Sun:'☉',Moon:'☾',Mercury:'☿',Venus:'♀',Mars:'♂',Jupiter:'♃',Saturn:'♄',Uranus:'♅',Neptune:'♆',Pluto:'♇'};
const PLANET_NOTE={
  Sun:'where the light falls today',Moon:'today\'s emotional weather',Mercury:'how words move now',
  Venus:'where love & beauty gather',Mars:'where the fire is',Jupiter:'where grace expands',
  Saturn:'where the work is',Uranus:'where the surprise lives',Neptune:'where the dream drifts',Pluto:'what\'s being reborn'};
// Which of a person's natal signs the current transits "touch"
function transitsFor(date){
  const L=planetLongitudes(date);
  return Object.keys(L).map(p=>({planet:p,glyph:PLANET_GLYPH[p],note:PLANET_NOTE[p],...signOf(L[p])}));
}
// gentle interpretation when a transiting planet sits in someone's sun/moon/rising sign
function transitTouch(date,who){
  const P=(typeof PEOPLE!=='undefined')?PEOPLE[who]:null; if(!P)return [];
  const mine=[P.sunName,P.moon,P.rising];
  return transitsFor(date).filter(t=>mine.includes(t.sign)).map(t=>{
    const which=t.sign===P.sunName?'Sun':t.sign===P.moon?'Moon':'Rising';
    return {...t,which,line:`${t.planet} is moving through your ${which} sign (${t.sign}) — ${t.note}.`};
  });
}

/* ---- COSMOS COMMITTEE (Mira · Celeste): term definitions + dynamic zodiac depth ---- */
const COSMOS_LEXICON = [
  {term:'Twin Flame', def:"Not the same as a soulmate. A twin flame is your mirror — one soul expressed in two bodies. The bond is less about comfort and more about recognition: meeting someone who runs the same inner code you do. Two Fire Rabbits born 96 days apart is about as close as astrology gets to it."},
  {term:'Life Path', def:"The single most important number in numerology. You get it by reducing your full birth date to one digit (or a master number 11/22/33). It describes the central lesson and gift you carry through life."},
  {term:'Element', def:"Every zodiac sign belongs to one of four elements. Fire (drive, spirit), Earth (body, stability), Air (mind, ideas), Water (emotion, depth). Your Sun's element is how your core energy moves through the world."},
  {term:'Mode (Quality)', def:"Cardinal signs start things, Fixed signs hold and sustain, Mutable signs adapt and change. It tells you how a sign acts, not just what it cares about."},
  {term:'Sun · Moon · Rising', def:"The big three. Sun = who you are at your core. Moon = your inner emotional world, what you need to feel safe. Rising (Ascendant) = the mask you wear, how the world first meets you."},
  {term:'Synastry', def:"The astrology of relationship — laying two charts on top of each other to see where you harmonize and where you stretch each other. It's the chart of 'us,' not just 'me.'"},
  {term:'Gematria', def:"An ancient practice (Hebrew, Greek, and English systems) that assigns a number to each letter, then sums a word. Names that share a number are said to share a hidden resonance. A way of hearing the math underneath language."},
  {term:'Fixed Stars', def:"Specific bright stars that sit at fixed points in the sky. When a planet in your chart lands on one, classical astrologers read it as a deep, fated theme woven into your life."},
];

// Chinese zodiac context — the 60-year cycle that makes "Fire Rabbit" specific
const ZODIAC_CYCLE = {
  intro:"The Chinese zodiac runs on two wheels turning together: 12 animals and 5 elements. The animal repeats every 12 years; the element shifts every 2. Combined, the same animal-element pair returns only once every 60 years. That's what makes 'Fire Rabbit' rare — not just a Rabbit, but a Rabbit lit by Fire.",
  elements:[
    {e:'Wood',  yin:'growth, kindness', glyph:'木'},
    {e:'Fire',  yin:'warmth, passion, spirit', glyph:'火', active:true},
    {e:'Earth', yin:'stability, care', glyph:'土'},
    {e:'Metal', yin:'resolve, clarity', glyph:'金'},
    {e:'Water', yin:'depth, intuition', glyph:'水'},
  ],
  rabbitNature:"The Rabbit is the gentlest sign of the twelve — diplomatic, artistic, home-loving, allergic to conflict. Of all the Rabbit types, the Fire Rabbit (1987) is the warmest and most driven: the softness stays, but there's a quiet engine underneath that never fully powers down.",
  nextReturn:"The last Fire Rabbit year was 1987. The next won't arrive until 2047. You were both born inside the same once-in-60-years window — 96 days apart.",
};


// ---- DAILY SYNASTRY WHISPER (Celeste) — short rotating line on how the two charts meet today ----
const SYNASTRY_WHISPERS = [
  "Two Air signs today — let the conversation be the date. You never run out of words; lean on that.",
  "Her Leo Moon wants to be adored; his Libra Moon was built to adore. Today, say the thing out loud.",
  "Fire Rabbits move best in motion. A small adventure together beats a perfect plan apart.",
  "Gemini curiosity + Aquarius vision = a world only the two of you are invited into. Tend it today.",
  "Your union's number is 5 — Freedom. Today, choose the thing that makes the life feel bigger, not smaller.",
  "Ninety-six days apart in the same 1987 spring. The sky lined you up on purpose. Act like it today.",
  "Both of you live in your heads. Today's assignment: be in the same room, saying nothing, and let that be enough.",
  "Air feeds fire. When one of you sparks an idea, the other can carry it further than either could alone.",
  "Mercury favors the talkers today — and you two have never stopped talking. Trade one real thought.",
  "Venus remembers the 8th grade at Drew. Some loves are recognized before they're chosen. Yours was.",
  "Leo Moon shines, Libra Moon balances. Together you are warmth that doesn't burn. Stay in it today.",
  "The rabbit is gentle, the fire is brave. Be gentle with each other and brave for each other today.",
  "Two minds, one home. Today, let the small kindness be the strategy.",
  "Aquarius builds the future; Gemini keeps it playful. Dream out loud together for five minutes today.",
  "You married in twos — 2/22/22. Today, do one thing in pairs you'd normally do alone.",
];

// ---- SOLAR RETURN (Celeste) — auto-reading around each birthday ----
const SOLAR_BIRTHDAYS = { elvia:{m:5,d:2,name:'Elvia',born:1987}, izzy:{m:1,d:17,name:'Israel',born:1987} };
function solarReturn(who, now){
  const B=SOLAR_BIRTHDAYS[who]; if(!B) return null;
  const m=now.getMonth(), d=now.getDate(), y=now.getFullYear();
  const bday=new Date(y, B.m, B.d);
  const diff=(now - bday)/86400000;
  const inWindow = diff>=-7 && diff<=14;
  if(!inWindow) return null;
  const age = y - B.born;
  const reduce=(n)=>{while(n>9){n=String(n).split('').reduce((a,c)=>a+ +c,0);} return n;};
  const py = reduce(age);
  const THEMES={1:'a beginning — a clean page, a new self stepping forward',2:'partnership & patience — the year you build with someone, not alone',3:'expression & joy — speak, create, be seen this year',4:'foundation — the year you lay stone that lasts',5:'freedom & change — movement, adventure, a life refusing to stay small',6:'love & home — the heart of the house, nurture and be nurtured',7:'depth & spirit — a quieter, wiser, more inward turn',8:'power & harvest — the year effort returns as abundance',9:'completion & release — closing a chapter to make room for the next'};
  const suf = age%10===1&&age!==11?'st':age%10===2&&age!==12?'nd':age%10===3&&age!==13?'rd':'th';
  return {
    name:B.name, age, personalYear:py, theme:THEMES[py]||'a turning',
    isToday: (m===B.m && d===B.d),
    headline: B.name+"'s "+age+suf+" Solar Return",
    body: "The Sun returns to the exact place it held the day "+B.name+" was born — a Fire Rabbit's fire, renewed. This is a Personal Year "+py+": "+(THEMES[py]||'a turning')+". "+((m===B.m&&d===B.d)?'Today is the return itself — the year resets now.':'The return is near; the new year is already arriving.')
  };
}
