/* ============================================================
   THE KINGDOM — PHASE 1 ENGINE  (kingdom-v2-2026-0601)
   Living content · Per-person identity · Motion · Ambient audio
   Injected ABOVE the existing components. Pure additive.
   ============================================================ */

/* ---------- 0. TIME + LIVING-CONTENT CORE ---------- */
const ANNIVERSARY = new Date('2022-02-22T00:00:00');
const MET_AT_DREW = new Date('2001-09-01T00:00:00'); // 8th grade, Charles R. Drew
const ELVIA_BDAY = {month:5, day:2};                 // June 2 (0-indexed month)
const ELVIA_BORN = new Date('1987-06-02T00:00:00');

function daysBetween(a,b){return Math.floor((a-b)/86400000);}
function nowET(){ // approximate ET regardless of device tz, good enough for greeting logic
  try{return new Date(new Date().toLocaleString('en-US',{timeZone:'America/New_York'}));}catch(e){return new Date();}
}
function isBirthday(d){d=d||nowET();return d.getMonth()===ELVIA_BDAY.month&&d.getDate()===ELVIA_BDAY.day;}
function isAnniversary(d){d=d||nowET();return d.getMonth()===1&&d.getDate()===22;} // Feb 22 — married 2-22-22
function anniversaryYears(d){d=d||nowET();return d.getFullYear()-2022;}
function timeOfDay(d){const h=(d||nowET()).getHours();
  if(h<5)return 'lateNight'; if(h<12)return 'morning'; if(h<17)return 'afternoon'; if(h<21)return 'evening'; return 'night';}

/* Deterministic daily index so content is stable within a day but rotates across days */
function dayKey(d){d=d||nowET();return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;}
function dayHash(d){const k=dayKey(d);let h=0;for(let i=0;i<k.length;i++){h=(h*31+k.charCodeAt(i))>>>0;}return h;}
function pickDaily(arr,d,salt=0){if(!arr||!arr.length)return null;return arr[(dayHash(d)+salt)%arr.length];}

/* Living greeting — never the same line twice in a day, rotates by date + time */
// Per-person greetings. {nick} substituted at runtime. 'elvia' & 'izzy' keyed.
const GREETINGS_BY = {
  elvia: {
    birthday:[ "Happy birthday, my love.", "It's your day, ViaEl.", "Thirty-nine summers, and you shine brighter than all of them." ],
    morning:[ "Good morning, my love.", "Morning, ViaEl.", "The day opened, and I thought of you first.", "Rise and shine, my Gemini." ],
    afternoon:[ "Good afternoon, beautiful.", "Thinking of you this afternoon.", "Hello again, my love.", "The middle of the day is better with you in it." ],
    evening:[ "Good evening, ViaEl.", "Evening, my love.", "The sun's going down — come sit with me a while.", "Hey you. How was your day?" ],
    night:[ "Goodnight is coming, my love.", "The Kingdom is quiet and warm tonight.", "Still here. Always here.", "Rest soon, my Fire Rabbit." ],
    lateNight:[ "Can't sleep, my love?", "It's late — the Kingdom keeps a candle lit for you.", "I'm always here, even at this hour." ],
  },
  izzy: {
    birthday:[ "Happy birthday, Israel.", "It's your day, Papa Izzy.", "The Kingdom you built welcomes its builder home." ],
    morning:[ "Good morning, Papa Izzy.", "Morning, my love.", "The Kingdom woke up with you.", "Rise and build, my Aquarius." ],
    afternoon:[ "Welcome back, Papa Izzy.", "Good afternoon, my love.", "The day's still yours to shape.", "Hello again — the Kingdom held while you were out." ],
    evening:[ "Good evening, Papa Izzy.", "Evening, my love.", "Lay the tools down a while.", "The fire's warm. Come sit." ],
    night:[ "Rest soon, Papa Izzy.", "The Kingdom stands watch tonight.", "Still here. Always here.", "Goodnight, my Fire Rabbit." ],
    lateNight:[ "Still up, my love?", "It's late — the Kingdom keeps a candle lit for you too.", "Builders rest. Even you." ],
  },
};
// Back-compat alias (anything still referencing GREETINGS defaults to elvia)
const GREETINGS = GREETINGS_BY.elvia;

/* Rotating love-notes from Izzy — one surfaces per day */
const IZZY_NOTES = [
  "I'd choose Drew, and the 8th grade, and you, a thousand times over.",
  "Twenty-five years and you still make my chest go quiet. That's the tell. That's how I know.",
  "Two Fire Rabbits, ninety-six days apart. The stars weren't subtle about us.",
  "You are my favorite Scripture and my favorite study.",
  "Every lemon we ever squeezed got sweeter because your hands were on it too.",
  "I didn't build you a gift. I built you a home. Live in it.",
  "Some mornings I just watch you sleep and thank God He let me find you early.",
  "My beloved is mine, and I am hers. The oldest math I trust.",
  "Whatever the day brings — you and me, ViaEl. Always you and me.",
  "I married my best friend on 2-22-22. Best decision of my whole life.",
];

/* Daily verse rotation (AMPC, love/covenant themed) */
const VERSES = [
  {t:'"I am my beloved\u2019s, and my beloved is mine."',r:'Song of Solomon 6:3'},
  {t:'"Many waters cannot quench love, neither can the floods drown it."',r:'Song of Solomon 8:7'},
  {t:'"Set me as a seal upon your heart, as a seal upon your arm."',r:'Song of Solomon 8:6'},
  {t:'"Two are better than one\u2026 for if they fall, one will lift up the other."',r:'Ecclesiastes 4:9-10'},
  {t:'"Love is patient, love is kind\u2026 it bears all things, endures all things."',r:'1 Corinthians 13:4-7'},
  {t:'"He who finds a wife finds a good thing, and obtains favor from the Lord."',r:'Proverbs 18:22'},
  {t:'"This is my beloved, and this is my friend."',r:'Song of Solomon 5:16'},
];

/* Evening "turn toward" Gottman nudges, rotating */
const NUDGES = [
  "Tonight, ask each other: \u201CWhat\u2019s one thing I did this year that made you feel most loved?\u201D",
  "Before bed, name three things you\u2019re grateful for about each other. Out loud.",
  "Share a six-second kiss tonight. Long enough to feel like something.",
  "Ask: \u201CWhat are you looking forward to this week?\u201D Then really listen.",
  "Tell each other one small thing you noticed and appreciated today.",
];

/* Library quotes moved to quotes_corpus.js */

/* ---------- 1. PER-PERSON IDENTITY (passkey + PIN fallback) ---------- */
const LS_USER='kingdom_user_v1', LS_CREDS='kingdom_creds_v1', LS_AUDIO='kingdom_audio_v1', LS_LASTSEEN='kingdom_lastseen_v1';
const Identity = {
  get(){try{return JSON.parse(localStorage.getItem(LS_USER)||'null');}catch(e){return null;}},
  set(u){try{localStorage.setItem(LS_USER,JSON.stringify(u));}catch(e){} this._touch(u);},
  clear(){try{localStorage.removeItem(LS_USER);}catch(e){}},
  _touch(u){try{const m=JSON.parse(localStorage.getItem(LS_LASTSEEN)||'{}');m[u.id]=Date.now();localStorage.setItem(LS_LASTSEEN,JSON.stringify(m));}catch(e){}},
  lastSeen(id){try{return (JSON.parse(localStorage.getItem(LS_LASTSEEN)||'{}'))[id]||0;}catch(e){return 0;}},
  hasPasskey(){return typeof window.PublicKeyCredential!=='undefined';},
};
function relTime(ts){if(!ts)return null;const s=Math.floor((Date.now()-ts)/1000);
  if(s<90)return 'just now'; const m=Math.floor(s/60); if(m<60)return m+'m ago';
  const h=Math.floor(m/60); if(h<24)return h+'h ago'; const d=Math.floor(h/24); return d+'d ago';}


/* race any promise against a timeout so the gate never hangs */
function withTimeout(p,ms){return Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),ms))]);}

/* WebAuthn passkey register/auth — best-effort, graceful PIN fallback */
async function passkeyRegister(who){
  if(!Identity.hasPasskey())throw new Error('no-webauthn');
  const id=new Uint8Array(16);crypto.getRandomValues(id);
  const cred=await navigator.credentials.create({publicKey:{
    challenge:crypto.getRandomValues(new Uint8Array(32)),
    rp:{name:'The Kingdom'},
    user:{id, name:who+'@kingdom', displayName:PEOPLE[who].name},
    pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],
    authenticatorSelection:{userVerification:'preferred',residentKey:'preferred'},
    timeout:60000, attestation:'none'
  }});
  const credId=btoa(String.fromCharCode(...new Uint8Array(cred.rawId)));
  try{const c=JSON.parse(localStorage.getItem(LS_CREDS)||'{}');c[who]=credId;localStorage.setItem(LS_CREDS,JSON.stringify(c));}catch(e){}
  return credId;
}
async function passkeyAuth(){
  if(!Identity.hasPasskey())throw new Error('no-webauthn');
  await navigator.credentials.get({publicKey:{
    challenge:crypto.getRandomValues(new Uint8Array(32)), userVerification:'preferred', timeout:60000
  }});
  return true; // device verified the user (Face ID). We map to the stored person below.
}

/* ---------- 2. AMBIENT AUDIO (WebAudio, no files, sovereign) ---------- */
const Aud = {
  ctx:null, enabled:(()=>{try{return localStorage.getItem(LS_AUDIO)!=='off';}catch(e){return true;}})(),
  on(){this.enabled=true;try{localStorage.setItem(LS_AUDIO,'on');}catch(e){}},
  off(){this.enabled=false;try{localStorage.setItem(LS_AUDIO,'off');}catch(e){}},
  _ac(){if(!this.ctx){try{this.ctx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}return this.ctx;},
  unlock(){const ac=this._ac();if(ac&&ac.state==='suspended'){ac.resume().catch(()=>{});}}
  ,
  tone(freq,dur,type='sine',gain=0.06,when=0){const ac=this._ac();if(!ac||!this.enabled)return;
    const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=freq;
    const t=ac.currentTime+when;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001,t+dur);o.connect(g).connect(ac.destination);o.start(t);o.stop(t+dur+0.02);},
  /* soft two-note dove-coo on login */
  coo(){this.tone(523.25,0.5,'sine',0.05,0);this.tone(392.0,0.7,'sine',0.045,0.28);},
  /* gentle chirp when partner posts */
  chirp(){this.tone(880,0.12,'triangle',0.05,0);this.tone(1174.7,0.16,'triangle',0.04,0.09);},
  /* warm chime for reactions / entering kingdom */
  chime(){[523.25,659.25,783.99].forEach((f,i)=>this.tone(f,0.6,'sine',0.04,i*0.06));},

  /* ---- AMBIENT LAYER: lofi pad + selectable healing frequency ---- */
  amb:{nodes:[],playing:false,mode:'lofi',hz:528,vol:0.5},
  HEALING:[{hz:0,label:'Off',desc:''},{hz:432,label:'432 · Earth',desc:'Tuned to the natural world. Grounding, calm, the breath slowing down.'},{hz:528,label:'528 · Love',desc:'The \u201cmiracle\u201d tone. Repair, warmth, the heart opening \u2014 our frequency.'},{hz:639,label:'639 · Connection',desc:'For relationships and reunion. Two becoming one, understanding without words.'},{hz:741,label:'741 · Awakening',desc:'Clearing and clarity. Letting go of what no longer serves the home.'},{hz:852,label:'852 · Return',desc:'Intuition and the return to spirit. The quiet knowing beneath everything.'}],

  TRACKS:[
   {g:'Chill',title:'Dreaming of You',artist:'Komiku',url:'/audio/dreaming_of_you.mp3'},
   {g:'Chill',title:'Sunset Pink Clouds',artist:'Monplaisir',url:'/audio/sunset_pink_clouds.mp3'},
   {g:'Chill',title:'Chill Out Theme',artist:'Komiku',url:'/audio/chill_out_theme.mp3'},
   {g:'Dreamy',title:'Into Dreamland',artist:'TRG Banks',url:'/audio/into_dreamland.mp3'},
   {g:'Calm',title:'Stay Calm',artist:'Frederic Lardon',url:'/audio/stay_calm.mp3'},
   {g:'Nostalgic',title:'Welcome to Nostalgia',artist:'Anonymous420',url:'/audio/welcome_nostalgia.mp3'},
   {g:'Jazz',title:'Busted Jazz',artist:'HoliznaCC0',url:'/audio/busted_jazz.mp3'},
   {g:'Hip-Hop',title:'Morning Coffee',artist:'HoliznaCC0',url:'/audio/morning_coffee.mp3'},
   {g:'Dreamy',title:'Tokyo Sunset',artist:'HoliznaCC0',url:'/audio/tokyo_sunset.mp3'},
   {g:'Nostalgic',title:'One Night in France',artist:'HoliznaCC0',url:'/audio/one_night_in_france.mp3'},
   {g:'Hip-Hop',title:'Still Life',artist:'HoliznaCC0',url:'/audio/still_life.mp3'}
  ],
  trk:{el:null,idx:-1,playing:false,vol:0.5},
  trkSaved(){try{return JSON.parse(localStorage.getItem('kingdom_trk_v1')||'{}');}catch(e){return {};}},
  trkPlay(i){ if(i==null||i<0||i>=this.TRACKS.length)return; this.unlock&&this.unlock();
    if(!this.trk.el){ const a=new Audio(); a.loop=false; a.preload='auto';
      a.addEventListener('ended',()=>{ this.trkNext(); }); this.trk.el=a; }
    const t=this.TRACKS[i]; this.trk.el.src=t.url; this.trk.el.volume=this.trk.vol;
    this.trk.idx=i; const p=this.trk.el.play(); if(p&&p.catch)p.catch(()=>{}); this.trk.playing=true;
    try{localStorage.setItem('kingdom_trk_v1',JSON.stringify({idx:i,vol:this.trk.vol,playing:true}));}catch(e){} },
  trkNext(){ this.trkPlay((this.trk.idx+1)%this.TRACKS.length); },
  trkStop(){ if(this.trk.el){try{this.trk.el.pause();}catch(e){}} this.trk.playing=false;
    try{const s=this.trkSaved();s.playing=false;localStorage.setItem('kingdom_trk_v1',JSON.stringify(s));}catch(e){} },
  trkSetVol(v){ this.trk.vol=v; if(this.trk.el)this.trk.el.volume=v;
    try{const s=this.trkSaved();s.vol=v;localStorage.setItem('kingdom_trk_v1',JSON.stringify(s));}catch(e){} },
  ambStop(){try{this.amb.nodes.forEach(n=>{try{n.stop&&n.stop();}catch(e){}try{n.disconnect&&n.disconnect();}catch(e){}});}catch(e){}this.amb.nodes=[];this.amb.playing=false;},
  ambSetVol(v){this.amb.vol=v;try{const s=JSON.parse(localStorage.getItem('kingdom_amb_v1')||'{}');s.vol=v;localStorage.setItem('kingdom_amb_v1',JSON.stringify(s));}catch(e){}if(this.amb.master)try{this.amb.master.gain.setValueAtTime(v*0.16,this._ac().currentTime);}catch(e){}},
  ambStart(mode,hz){const ac=this._ac();if(!ac)return;this.unlock();this.ambStop();
    this.amb.mode=mode||this.amb.mode;if(hz!=null)this.amb.hz=hz;
    try{localStorage.setItem('kingdom_amb_v1',JSON.stringify({mode:this.amb.mode,hz:this.amb.hz,vol:this.amb.vol}));}catch(e){}
    const master=ac.createGain();master.gain.value=this.amb.vol*0.16;master.connect(ac.destination);this.amb.master=master;this.amb.nodes.push(master);
    if(this.amb.mode==='lofi'||this.amb.mode==='both'){
      // warm detuned pad through a lowpass — soft lofi bed
      const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=900;lp.Q.value=0.6;lp.connect(master);this.amb.nodes.push(lp);
      const chord=[130.81,164.81,196.0,261.63]; // C minor-ish warm
      chord.forEach((f,i)=>{const o=ac.createOscillator();o.type=i%2?'triangle':'sine';o.frequency.value=f;o.detune.value=(i-1.5)*5;
        const g=ac.createGain();g.gain.value=0.18;o.connect(g).connect(lp);
        const lfo=ac.createOscillator();lfo.frequency.value=0.07+i*0.013;const lg=ac.createGain();lg.gain.value=0.06;lfo.connect(lg).connect(g.gain);
        o.start();lfo.start();this.amb.nodes.push(o,lfo,g,lg);});
    }
    if((this.amb.mode==='hz'||this.amb.mode==='both')&&this.amb.hz>0){
      // pure healing tone + faint binaural offset
      [this.amb.hz,this.amb.hz+6].forEach((f,i)=>{const o=ac.createOscillator();o.type='sine';o.frequency.value=f;
        const g=ac.createGain();g.gain.value=0.10;o.connect(g).connect(master);o.start();this.amb.nodes.push(o,g);});
    }
    this.amb.playing=true;
  },
  ambSaved(){try{return JSON.parse(localStorage.getItem('kingdom_amb_v1')||'null');}catch(e){return null;}},
};

/* ---------- 3. MOTION: gyroscope + pointer parallax hook ---------- */
function useParallax(){
  const [off,setOff]=useState({x:0,y:0});
  useEffect(()=>{
    let raf=null,tx=0,ty=0;
    const apply=()=>{setOff({x:tx,y:ty});raf=null;};
    const onMove=e=>{const cx=(e.clientX/innerWidth-0.5),cy=(e.clientY/innerHeight-0.5);tx=cx*18;ty=cy*18;if(!raf)raf=requestAnimationFrame(apply);};
    const onTilt=e=>{const g=e.gamma||0,b=e.beta||0;tx=Math.max(-22,Math.min(22,g/2));ty=Math.max(-22,Math.min(22,(b-45)/3));if(!raf)raf=requestAnimationFrame(apply);};
    window.addEventListener('pointermove',onMove,{passive:true});
    window.addEventListener('deviceorientation',onTilt,{passive:true});
    return()=>{window.removeEventListener('pointermove',onMove);window.removeEventListener('deviceorientation',onTilt);if(raf)cancelAnimationFrame(raf);};
  },[]);
  return off;
}

/* ---------- 4. CONFETTI (gold doves) for birthday ---------- */
function Confetti({on,count=46}){
  const bits=useMemo(()=>Array.from({length:count},()=>({l:Math.random()*100,d:Math.random()*2.5,dur:4+Math.random()*4,s:8+Math.random()*12,r:Math.random()*360,e:Math.random()<0.5?'\u{1F54A}\uFE0F':'\u2728'})),[count]);
  if(!on)return null;
  return <div aria-hidden style={{position:'absolute',inset:0,zIndex:6,pointerEvents:'none',overflow:'hidden'}}>
    {bits.map((b,i)=><span key={i} style={{position:'absolute',left:b.l+'%',top:'-8%',fontSize:b.s,animation:`kfall ${b.dur}s linear ${b.d}s infinite`,transform:`rotate(${b.r}deg)`,opacity:.9}}>{b.e}</span>)}
  </div>;
}

/* ---------- 5. SHARED POSTS (cross-device, via Base44 fn) ---------- */
const KPOSTS_URL='https://sue-app-e73f9f1e.base44.app/api/apps/69d7dd5e015cd1aa45c3e283/functions/kingdomPosts';
const KPOSTS_KEY='viael-izzy-2-22-22-doves';
const LS_POSTS='kingdom_posts_v1';
const KPosts={
  _cache(){try{return JSON.parse(localStorage.getItem(LS_POSTS)||'[]');}catch(e){return [];}},
  _save(a){try{localStorage.setItem(LS_POSTS,JSON.stringify(a));}catch(e){}},
  async list(){
    try{const r=await fetch(`${KPOSTS_URL}?key=${encodeURIComponent(KPOSTS_KEY)}`,{cache:'no-store'});
      if(!r.ok)throw 0;const j=await r.json();
      const norm=(j.posts||[]).map(p=>({who:p.author,text:p.text,ts:p.client_ts||Date.parse(p.created_date)||Date.now(),id:p.id}));
      this._save(norm);return norm;
    }catch(e){return this._cache();}// offline → last known
  },
  async add(who,text){
    const optimistic={who,text,ts:Date.now(),pending:true};
    try{const r=await fetch(KPOSTS_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:KPOSTS_KEY,author:who,text})});
      if(!r.ok)throw 0;const j=await r.json();
      return {who:j.post.author,text:j.post.text,ts:j.post.client_ts||Date.now(),id:j.post.id};
    }catch(e){// offline → cache locally, will reconcile on next list()
      const c=[optimistic,...this._cache()];this._save(c);return optimistic;}
  },
};
function useKingdomPosts(){
  const [posts,setPosts]=useState(()=>KPosts._cache());
  const refresh=()=>KPosts.list().then(setPosts).catch(()=>{});
  useEffect(()=>{refresh();const t=setInterval(refresh,20000);// gentle poll so partner notes appear
    const onVis=()=>{if(!document.hidden)refresh();};document.addEventListener('visibilitychange',onVis);
    return()=>{clearInterval(t);document.removeEventListener('visibilitychange',onVis);};},[]);
  const add=async(who,text)=>{const p=await KPosts.add(who,text);setPosts(cur=>[p,...cur]);return p;};
  return {posts,add,refresh};
}


/* ---------- 6. KINGDOM DATA: plants, media (photos+voice), DMs ---------- */
const KDATA_URL='https://sue-app-e73f9f1e.base44.app/api/apps/69d7dd5e015cd1aa45c3e283/functions/kingdomData';
const KDATA_KEY='viael-izzy-2-22-22-doves';
async function kdata(payload){
  const r=await fetch(KDATA_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:KDATA_KEY,...payload})});
  const j=await r.json(); if(!r.ok||j.error) throw new Error(j.error||('http '+r.status)); return j;
}
function fileToDataUrl(file){return new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=rej;fr.readAsDataURL(file);});}

/* Plant Doctor — vision diagnosis (sovereign InvokeLLM) */
const PLANTDOC_URL='https://sue-app-e73f9f1e.base44.app/api/apps/69d7dd5e015cd1aa45c3e283/functions/plantDoctor';
async function plantDoctor(payload){
  const r=await fetch(PLANTDOC_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:KDATA_KEY,...payload})});
  const j=await r.json(); if(!r.ok||j.error) throw new Error(j.error||('http '+r.status)); return j;
}
/* downscale a photo client-side so phone uploads stay small + fast */
function resizeImage(file,max=1100,quality=0.82){return new Promise((res)=>{
  try{ const img=new Image(); const url=URL.createObjectURL(file);
    img.onload=()=>{ let{width:w,height:h}=img; const s=Math.min(1,max/Math.max(w,h)); w=Math.round(w*s); h=Math.round(h*s);
      const c=document.createElement('canvas'); c.width=w; c.height=h; const ctx=c.getContext('2d'); ctx.drawImage(img,0,0,w,h);
      URL.revokeObjectURL(url); try{ res(c.toDataURL('image/jpeg',quality)); }catch(e){ res(null); } };
    img.onerror=()=>{ URL.revokeObjectURL(url); res(null); }; img.src=url;
  }catch(e){ res(null); }
});}
