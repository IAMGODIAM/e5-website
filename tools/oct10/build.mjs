#!/usr/bin/env node
/**
 * tools/oct10/build.mjs — E5's landing page for the Political Education Party (Sat Oct 10, Dallas).
 *
 *   node tools/oct10/build.mjs --fetch   # pull the manifest from freekarmelo.net, then build
 *   node tools/oct10/build.mjs           # build from the vendored tools/oct10/event.json
 *   npm run chrome                       # fills the masthead/footer markers (build runs it for you)
 *
 * The single source of truth is https://freekarmelo.net/oct10/event.json — the file the campaign's
 * own event page, flyers and share card are built from. This script vendors a copy, renders every
 * fact into static HTML (so crawlers, the Ad Grants reviewer and no-JS visitors see the real page),
 * and the page re-reads the live manifest at runtime only to flip the status banner and hide
 * itself after the event. Never type a date, time, name or table into the HTML by hand.
 *
 * E5's role is stated as co-host (Chairman's decision, 2026-09-25). Guardrails: no countdowns,
 * no city tallies, case copy only from event.json → case.lines, posture line verbatim.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = 'https://freekarmelo.net/oct10/event.json';
const VENDORED = path.join(ROOT, 'tools/oct10/event.json');
const OUT = path.join(ROOT, 'public/events/political-education-party/index.html');
const ROUTE = '/events/political-education-party/';
const CANON = 'https://e5enclave.com' + ROUTE;

if (process.argv.includes('--fetch')) {
  const r = await fetch(SRC, { cache: 'no-store' });
  if (!r.ok) throw new Error('fetch ' + SRC + ' → ' + r.status);
  fs.writeFileSync(VENDORED, JSON.stringify(await r.json(), null, 2) + '\n');
  console.log('vendored', SRC);
}
const E = JSON.parse(fs.readFileSync(VENDORED, 'utf8'));
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const v = E.venue;
const addr = `${v.street}, ${v.city}, ${v.region} ${v.postal}`;
const FK = 'https://freekarmelo.net';
const fk = (p, src) => `${FK}${p}${p.includes('?') ? '&' : '?'}utm_source=e5enclave&utm_medium=referral&utm_campaign=oct10${src ? '&utm_content=' + src : ''}`;
const card = E.assets.find(a => a.id === 'card');
const feed = E.assets.find(a => a.id === 'feed');
const img = p => FK + '/' + p.replace(/^\//, '');
const thumb = p => img(p).replace(/\/([^/]+)\.png$/, '/thumbs/$1.jpg');
const z = d => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const gcal = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(E.name)}&dates=${z(E.start)}/${z(E.end)}&details=${encodeURIComponent(E.shareText + ' ' + CANON)}&location=${encodeURIComponent(v.name + ', ' + addr)}`;
const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.mapsQuery)}`;
const words = E.name.split(' ');
const h1 = `${esc(words.slice(0, -1).join(' '))} <span>${esc(words[words.length - 1])}</span>`;
const [day, md] = E.dateLong.split(', ');
const desc = `${E.name} — ${E.dateLong}, ${E.timeLabel}, ${v.name}, ${v.city}. Free, all ages. Co-hosted by E5 Enclave. RSVP here.`;
if (desc.length > 160) console.warn('! description', desc.length, 'chars');
const kindTag = { talk: 'Talk', youth: 'Youth', music: 'Music', feature: 'Featured', community: 'Open' };
const program = E.program.filter(p => p.confirmed).map(p =>
  `<li class="${p.kind === 'feature' ? 'ft' : ''}"><time>${esc(p.t)}<small>${esc(p.m)}</small></time><div><b>${esc(p.title)}</b>${p.who ? `<span>${esc(p.who)}</span>` : ''}</div><i class="k-${esc(p.kind)}">${kindTag[p.kind] || ''}</i></li>`).join('\n          ');
const tables = E.tables.filter(t => t.confirmed && !t.open).map(t => `<li><b>${esc(t.org)}</b>${t.what ? ` — ${esc(t.what)}` : ''}</li>`).join('\n            ');
const openTables = E.tables.filter(t => t.open).length;
const hl = E.highlights.map(h => `<li><b>${esc(h.k)}</b>${esc(h.v)}</li>`).join('');
const bring = E.bring.map(b => `<li><b>${esc(b.item)}</b><span>${esc(b.note)}</span></li>`).join('');
const brackets = E.tournament.brackets.map(b => `<li><b>Ages ${esc(b.ages)}</b><span>${esc(b.time)} · ${b.status === 'full' ? 'full — wait list' : esc(b.teams) + ' teams'}</span></li>`).join('');
const ld = {
  '@context': 'https://schema.org', '@type': 'Event', name: E.name, description: E.shareText, startDate: E.start, endDate: E.end,
  eventStatus: 'https://schema.org/' + (E.status === 'moved' ? 'EventRescheduled' : 'EventScheduled'),
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode', isAccessibleForFree: true,
  location: { '@type': 'Place', name: v.name, address: { '@type': 'PostalAddress', streetAddress: v.street, addressLocality: v.city, addressRegion: v.region, postalCode: v.postal, addressCountry: 'US' } },
  organizer: [{ '@type': 'NGO', name: 'E5 Enclave Incorporated', url: 'https://e5enclave.com/' }, { '@type': 'Organization', name: E.umbrella, url: FK + '/' }],
  image: [img(card.png)], url: CANON,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock', url: CANON }
};
const GTAG = `<script>/* Google tag (GA4 G-3YJ6C72JSJ + G-05PYDYP5S0 + Ads AW-16672489240) — E5 Enclave Inc property. */(function(){if(window.gtag||document.querySelector('script[src*="googletagmanager.com/gtag/js"]'))return;var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id=G-3YJ6C72JSJ';document.head.appendChild(s);window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','G-3YJ6C72JSJ');gtag('config','G-05PYDYP5S0');gtag('config','AW-16672489240');})();</script>`;

const html = `<!doctype html>
<html lang="en">
<head>
${GTAG}
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<!-- Generated by tools/oct10/build.mjs from ${SRC} — edit the manifest, not this file. -->
<title>${esc(E.name)} · ${esc(md)} · Dallas · E5 Enclave</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${CANON}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="E5 Enclave">
<meta property="og:url" content="${CANON}">
<meta property="og:title" content="${esc(E.name)} — ${esc(E.dateLong)}, ${esc(E.timeLabel)}">
<meta property="og:description" content="${esc(E.shareText)}">
<meta property="og:image" content="${img(card.png)}">
<meta property="og:image:width" content="${card.w}">
<meta property="og:image:height" content="${card.h}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0B0710">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=Archivo+Black&family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap">
<link rel="stylesheet" href="/assets/front/sovereign-chrome.css">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<style>
main.pep{--ink:#0B0710;--paper:#F4EFE4;--body:#3A3340;--purple:#4B2FA0;--gold:#D9B36C;--gold-lift:#F0DCAC;--gold-dark:#7A5A14;--red:#9A2E2E;--hair:rgba(11,7,16,.18);--mono:'IBM Plex Mono',ui-monospace,monospace;--disp:'Archivo Black',Archivo,sans-serif;background:var(--paper);color:var(--ink);font-family:Archivo,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
main.pep *{box-sizing:border-box}
main.pep a{color:var(--purple)}main.pep a:hover{color:var(--ink)}
.pep .w{max-width:1160px;margin:0 auto;padding-left:clamp(16px,4vw,40px);padding-right:clamp(16px,4vw,40px)}
.pep .eb{font-family:var(--mono);font-weight:600;font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:var(--purple)}
.pep h2{margin:0;font-family:var(--disp);font-weight:400;font-size:clamp(30px,4.6vw,50px);line-height:1}
.pep .sec{padding-top:64px;scroll-margin-top:96px}
.pep .rule{border-bottom:3px solid var(--ink);padding-bottom:12px;margin-bottom:6px;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:10px}
.pep .rule small{font-size:14px;color:var(--body)}
#pepBanner{display:none;background:var(--purple);color:var(--paper);text-align:center;padding:13px 16px;font-weight:600}
#pepBanner.on{display:block}#pepBanner b{font-family:var(--mono);letter-spacing:.18em;margin-right:10px}
.pep .co{background:var(--ink);color:var(--paper);border-bottom:5px solid var(--gold-dark)}
.pep .co .w{display:flex;flex-wrap:wrap;justify-content:space-between;gap:6px 18px;padding-top:12px;padding-bottom:12px;font-family:var(--mono);font-size:12.5px;letter-spacing:.12em;text-transform:uppercase}
.pep .co b{color:var(--gold)}
.pep .hero>div{min-width:0;container-type:inline-size}.pep .hero{padding-top:clamp(34px,5vw,64px);padding-bottom:32px;display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,.9fr);gap:clamp(24px,4vw,56px);align-items:center}
@media(max-width:880px){.pep .hero{grid-template-columns:1fr}.pep .flyer{max-width:400px;justify-self:center}}
.pep h1{margin:14px 0 0;font-family:var(--disp);font-weight:400;font-size:clamp(44px,8.4vw,104px);line-height:.9;letter-spacing:-.02em;text-transform:uppercase;color:var(--ink)}
@supports (font-size:1cqi){.pep h1{font-size:min(14cqi,104px)}}
.pep h1 span{color:var(--purple)}
.pep .purpose{margin:18px 0 0;font-size:clamp(17px,1.8vw,20px);line-height:1.55;color:var(--body);max-width:600px}
.pep .when{margin-top:22px;padding:14px 0;border-top:3px solid var(--ink);border-bottom:1px solid var(--hair);display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 18px}
.pep .when .d{font-family:var(--disp);font-size:clamp(24px,3.2vw,34px)}.pep .when .t{font-family:var(--disp);font-size:clamp(18px,2.2vw,24px);color:var(--purple)}
.pep .where{margin:12px 0 0;font-weight:800;font-size:19px}.pep .where small{display:block;font-family:var(--mono);font-weight:500;font-size:13.5px;color:var(--body);margin-top:3px}
.pep .ctas{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}
.pep .btn{display:inline-block;text-decoration:none;font-weight:800;font-size:16px;padding:14px 20px;border:2px solid var(--ink);color:var(--ink);background:transparent;cursor:pointer;border-radius:0;font-family:Archivo,sans-serif}
.pep .btn:hover{background:var(--ink);color:var(--paper)}
.pep .btn.p{background:var(--purple);border-color:var(--purple);color:var(--paper)}.pep .btn.p:hover{background:var(--ink);border-color:var(--ink)}
.pep .stamp{display:inline-block;margin-top:18px;transform:rotate(-2deg);border:3px solid var(--red);outline:1px solid var(--red);outline-offset:4px;padding:8px 14px;font-family:var(--mono);font-weight:600;font-size:13px;letter-spacing:.12em;color:var(--red);text-transform:uppercase}
.pep .flyer{display:block;width:100%;max-width:440px;justify-self:end;transform:rotate(1.2deg);box-shadow:10px 12px 0 var(--ink)}
.pep .flyer img{display:block;width:100%;height:auto;border:2px solid var(--ink)}
.pep .hl{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;border-top:3px solid var(--ink);border-bottom:3px solid var(--ink)}
.pep .hl li{flex:1 1 190px;padding:16px 16px 16px 0;font-weight:600;font-size:17px;line-height:1.3}
.pep .hl b{display:block;font-family:var(--mono);font-size:12px;letter-spacing:.2em;color:var(--purple);margin-bottom:4px}
.pep .why{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(24px,4vw,56px)}
@media(max-width:880px){.pep .why{grid-template-columns:1fr}}
.pep .why p{font-size:17.5px;line-height:1.65;color:var(--body);margin:14px 0 0}
.pep .prog{list-style:none;margin:0;padding:0}
.pep .prog li{display:grid;grid-template-columns:86px minmax(0,1fr) auto;gap:14px;align-items:baseline;padding:14px 0;border-bottom:1px solid var(--hair)}
.pep .prog time{font-family:var(--disp);font-size:19px}.pep .prog time small{font-family:var(--mono);font-size:11px;margin-left:4px;color:var(--body)}
.pep .prog b{display:block;font-weight:600;font-size:17.5px;line-height:1.35}.pep .prog span{font-size:15px;color:var(--body)}
.pep .prog li.ft b{font-weight:800;color:var(--purple)}
.pep .prog i{font-style:normal;font-family:var(--mono);font-weight:600;font-size:11px;letter-spacing:.14em;text-transform:uppercase;border:1px solid currentColor;padding:3px 7px;color:var(--purple)}
.pep .prog i.k-feature{color:var(--red)}.pep .prog i.k-youth{color:var(--gold-dark)}
@media(max-width:520px){.pep .prog li{grid-template-columns:62px minmax(0,1fr)}.pep .prog i{grid-column:2;justify-self:start}}
.pep .cols{columns:2 320px;column-gap:40px;list-style:none;margin:14px 0 0;padding:0}
.pep .cols li{break-inside:avoid;padding:10px 0;border-bottom:1px solid var(--hair);font-size:16px;line-height:1.5;color:var(--body)}.pep .cols b{color:var(--ink)}
.pep .duo{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(24px,4vw,48px)}
@media(max-width:880px){.pep .duo{grid-template-columns:1fr}}
.pep .plain{list-style:none;margin:14px 0 0;padding:0}.pep .plain li{padding:12px 0;border-bottom:1px solid var(--hair)}.pep .plain b{display:block;font-weight:800}.pep .plain span{color:var(--body);font-size:15px}
.pep .rsvp{background:var(--ink);color:var(--paper);padding:clamp(22px,3vw,36px);border-top:6px solid var(--gold-dark)}
.pep .rsvp h2{color:var(--gold-lift)}.pep .rsvp .eb{color:var(--gold)}
.pep form{display:flex;flex-direction:column;gap:14px;margin:18px 0 0}
.pep label.f{display:flex;flex-direction:column;gap:6px;font-size:14px;font-weight:600}
main.pep .rsvp .f input,main.pep .rsvp .f select{padding:12px;border:2px solid var(--paper);background:var(--paper)!important;color:var(--ink)!important;font:inherit;font-size:16px;border-radius:0;width:100%;-webkit-appearance:none;appearance:none}
.pep .row{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}
.pep label.cb{display:flex;gap:10px;align-items:flex-start;font-size:14px;line-height:1.45;color:#E6DFD2}.pep label.cb input{margin-top:3px;width:18px;height:18px;flex:none}
.pep .rsvp a{color:var(--gold)}
.pep .hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
.pep .err{display:none;margin:0;font-family:var(--mono);font-size:13px;font-weight:600;color:#F3A9A9}
.pep .done{display:none}.pep .done p{color:#E6DFD2;font-size:16px;line-height:1.55}
.pep .btn.g{background:var(--gold);border-color:var(--gold);color:var(--ink)}.pep .btn.g:hover{background:var(--gold-lift);border-color:var(--gold-lift)}
.pep .fine{font-size:13px;line-height:1.5;color:#CFC6D8;margin:0}
.pep .case p{margin:0;padding:14px 0;border-bottom:1px solid var(--hair);font-size:18px;line-height:1.5}
.pep .case .src{font-family:var(--mono);font-size:12px;color:var(--body);margin-top:10px;display:block}
.pep .inst{margin-top:72px;background:#EAE3D4;border-top:3px solid var(--ink)}
.pep .inst .w{padding-top:40px;padding-bottom:48px;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px 40px}
.pep .inst h3{margin:0 0 8px;font-family:var(--disp);font-weight:400;font-size:20px}
.pep .inst p{margin:0;font-size:15.5px;line-height:1.6;color:var(--body)}
.pep .posture{padding:22px 0 26px;text-align:center;font-weight:700;font-size:16px}
</style>
</head>
<body>
<!-- e5:chrome-head -->
<!-- /e5:chrome-head -->

<main class="pep" id="main">
  <div id="pepBanner" role="status" aria-live="polite"><b id="pepBannerK"></b><span id="pepBannerV"></span></div>
  <div class="co"><div class="w"><span><b>E5 Enclave</b> co-hosts with ${esc(E.umbrella)}</span><span>E5 Justice Support · Dallas</span></div></div>

  <header class="w hero">
    <div>
      <span class="eb">${esc(day)} · ${esc(md)} · ${esc(v.city)} · Free · All ages</span>
      <h1>${h1}</h1>
      <p class="purpose">${esc(E.purpose)}</p>
      <div class="when"><span class="d">${esc(E.dateLong)}</span><span class="t">${esc(E.timeLabel)}</span></div>
      <p class="where">${esc(v.name)}<small>${esc(addr)}${v.aka ? ' · ' + esc(v.aka) : ''} · <a href="${maps}" rel="noopener" target="_blank">Directions</a></small></p>
      <div class="ctas">
        <a class="btn p" href="#rsvp" data-t="hero_rsvp">I’m coming — RSVP</a>
        <a class="btn" href="${gcal}" target="_blank" rel="noopener" data-t="gcal">Add to Google Calendar</a>
        <a class="btn" href="${fk('/events/political-education-party/', 'hero_youth')}#youth" data-t="youth">Register a youth team</a>
      </div>
      ${E.featured && E.featured.confirmed ? `<span class="stamp">Featuring ${esc(E.featured.name)}</span>` : ''}
    </div>
    <a class="flyer" href="${fk('/events/political-education-party/', 'hero_flyer')}#share" data-t="flyer"><img src="${thumb(feed.png)}" alt="${esc(feed.alt)}" width="${feed.w}" height="${feed.h}" decoding="async"></a>
  </header>

  <section class="w" aria-label="What's there"><ul class="hl">${hl}</ul></section>

  <section class="w sec why">
    <div>
      <span class="eb">Why E5 is in the park</span>
      <h2>The people inside are still ours.</h2>
      <p>E5 Enclave is a lineage-led 501(c)(3) institution from Liberty City, Miami. Its Justice Support work keeps the public record on cases like Karmelo Anthony’s and puts families, organizers and neighbors in the same place. The Political Education Party is that work in person: a free day in the park named for Fahim J. Minkah, an original member of the Black Panther Party in Dallas.</p>
      <p>Hosted by ${esc(E.hosts)} and co-hosted by E5 with ${esc(E.umbrella)}. Come for the food, the music and the kids’ 3-on-3. Stay to meet the people doing prison support, and leave knowing one thing you can do this week.</p>
    </div>
    <div class="case">
      <span class="eb">Where Karmelo’s case stands</span>
      <div style="border-top:3px solid var(--ink);margin-top:14px">${E.case.lines.map(l => `<p>${esc(l)}</p>`).join('')}</div>
      <span class="src">Last confirmed ${esc(E.case.lastConfirmed)} · <a href="/justice/karmelo-anthony/">Read E5’s case record →</a></span>
    </div>
  </section>

  <section class="w sec" id="program">
    <div class="rule"><h2>Program</h2><small>Times are a guide — the park sets the pace.</small></div>
    <ol class="prog">
          ${program}
    </ol>
  </section>

  <section class="w sec" id="tables">
    <div class="rule"><h2>At the tables</h2><small>${openTables ? `${openTables} tables still open to community groups — <a href="mailto:events@freekarmelo.net?subject=${encodeURIComponent('Table request — ' + E.name)}">ask for one</a>.` : ''}</small></div>
    <ul class="cols">
            ${tables}
    </ul>
  </section>

  <section class="w sec duo">
    <div id="youth">
      <div class="rule"><h2>Youth 3-on-3</h2></div>
      <p style="font-size:17px;line-height:1.6;color:var(--body)">${esc(E.tournament.format)}. Hosted by ${esc(E.tournament.host)}. ${esc(E.tournament.prize)}. A parent or guardian registers each team and stays at the park while they play.</p>
      <ul class="plain">${brackets}</ul>
      <p style="margin-top:16px"><a class="btn" href="${fk('/events/political-education-party/', 'youth_section')}#youth" data-t="youth">Register a team →</a></p>
    </div>
    <div id="bring">
      <div class="rule"><h2>Bring a bag</h2></div>
      <ul class="plain">${bring}</ul>
      <p style="color:var(--body);font-family:var(--mono);font-size:14px">${esc(E.comfort)}</p>
    </div>
  </section>

  <section class="w sec" id="rsvp">
    <div class="rsvp">
      <span class="eb">RSVP · helps us bring enough food</span>
      <h2>Count me in.</h2>
      <div class="done" id="rsvpDone"><p><b>You’re counted.</b> See you at ${esc(v.name)}. Bring someone with you — the flyers and share kit are on the <a href="${fk('/events/political-education-party/', 'rsvp_done')}#share">campaign’s event page</a>.</p></div>
      <form id="rsvpForm" novalidate>
        <div class="row">
          <label class="f">First name<input name="name" required maxlength="80" autocomplete="given-name"></label>
          <label class="f">Email<input name="email" type="email" required maxlength="254" autocomplete="email"></label>
        </div>
        <div class="row">
          <label class="f">How many of you?<select name="count"><option>1</option><option>2</option><option>3</option><option>4</option><option>5+</option></select></label>
          <label class="f">Mobile (optional, for day-of texts)<input name="phone" type="tel" maxlength="30" autocomplete="tel"></label>
        </div>
        <label class="cb"><input type="checkbox" name="sms"><span>Text me day-of updates (weather, changes). Msg &amp; data rates may apply. Reply STOP any time. <a href="/terms/">SMS terms</a>.</span></label>
        <label class="f">Anything we should plan for? (optional)<input name="needs" maxlength="300"></label>
        <div class="hp" aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div>
        <div id="tsRsvp" style="min-height:65px"></div>
        <p class="err" id="rsvpErr" role="alert"></p>
        <div><button class="btn g" type="submit">Count me in</button></div>
        <p class="fine">Used only to plan the day and send event updates. <a href="/privacy-policy/">Privacy</a>.</p>
      </form>
    </div>
  </section>

  <section class="inst" aria-label="Who stands behind this page">
    <div class="w">
      <div><h3>E5 Enclave Incorporated</h3><p>A lineage-led 501(c)(3) public charity (EIN 99-3822441), founded in Liberty City, Miami. <a href="/about/">About E5</a> · <a href="/mission/">Mission</a> · <a href="/justice/">Justice Support</a></p></div>
      <div><h3>Co-host</h3><p>${esc(E.umbrella)} — the campaign for Karmelo Anthony and for people inside. Full event page, flyers and share kit at <a href="${fk('/events/political-education-party/', 'inst')}">freekarmelo.net</a>.</p></div>
      <div><h3>Questions</h3><p>Hosts and tables: <a href="mailto:events@freekarmelo.net">events@freekarmelo.net</a>. E5: <a href="/contact/">contact E5</a>. Press: check in at the welcome table on the day.</p></div>
    </div>
    <p class="w posture">${esc(E.posture)}</p>
  </section>
</main>

<!-- e5:chrome-foot -->
<!-- /e5:chrome-foot -->

<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=pepTsInit&render=explicit" async defer></script>
<script>
(function(){
  var EP='https://e5-fk-events.yisraelleemccartney.workers.dev/submit', SK='0x4AAAAAAEAo1uozlYeV9QpL', LIVE='${SRC}', wid=null;
  function track(n,p){try{if(typeof gtag==='function')gtag('event',n,p||{})}catch(e){}}
  window.pepTsInit=function(){var el=document.getElementById('tsRsvp');if(el&&window.turnstile&&wid===null){try{wid=turnstile.render(el,{sitekey:SK,theme:'dark'})}catch(e){}}};
  if(window.turnstile)window.pepTsInit();
  document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('[data-t]');if(a)track('select_content',{content_type:'oct10',item_id:a.getAttribute('data-t')})});
  var f=document.getElementById('rsvpForm'),err=document.getElementById('rsvpErr'),EM=/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  function c(s){return String(s||'').replace(/[<>]/g,'').trim()}
  function bad(m){err.textContent=m;err.style.display='block'}
  f.addEventListener('submit',function(ev){
    ev.preventDefault();var d=new FormData(f);if(d.get('website'))return;
    if(!c(d.get('name')))return bad('PLEASE ADD YOUR FIRST NAME.');
    if(!EM.test(c(d.get('email'))))return bad('PLEASE ENTER A VALID EMAIL.');
    if(d.get('sms')&&!c(d.get('phone')))return bad('ADD A MOBILE NUMBER FOR TEXT UPDATES.');
    var tok='';try{tok=window.turnstile?turnstile.getResponse(wid)||'':''}catch(e){}
    if(!tok)return bad('PLEASE COMPLETE THE SECURITY CHECK ABOVE.');
    err.style.display='none';var b=f.querySelector('button[type=submit]'),o=b.textContent;b.disabled=true;b.textContent='Sending…';
    var p={form_type:'local-action',action_type:'oct10-rsvp',name:c(d.get('name')),email:c(d.get('email')),city:'Dallas',state:'TX',proposed_date:'${E.start.slice(0, 10)}',turnstile_token:tok,
      details:['RSVP · ${esc(E.name)} · via e5enclave.com','party size: '+d.get('count'),'mobile: '+(c(d.get('phone'))||'—'),'sms opt-in: '+(d.get('sms')?'yes':'no'),'needs: '+(c(d.get('needs'))||'—')].join(' | ')};
    fetch(EP,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)})
      .then(function(r){return r.json().catch(function(){return{}}).then(function(j){if(!r.ok||j.ok===false)throw 0})})
      .then(function(){f.style.display='none';document.getElementById('rsvpDone').style.display='block';track('generate_lead',{form_name:'oct10_rsvp_e5',event_slug:'${esc(E.slug)}'})})
      .catch(function(){bad('THAT DIDN’T GO THROUGH — PLEASE TRY AGAIN.');try{turnstile.reset(wid)}catch(e){}b.disabled=false;b.textContent=o});
  });
  /* live status only: banner on the day / for weather or a change; the page steps aside after the event */
  fetch(LIVE,{cache:'no-cache'}).then(function(r){return r.json()}).then(function(E){
    var now=Date.now(),chi=function(t){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago'}).format(new Date(t))};
    var st=E.status==='weather'||E.status==='moved'?E.status:(now>Date.parse(E.end)||E.status==='past')?'past':chi(now)===chi(E.start)?'today':'';
    var B={today:['HAPPENING TODAY','We’re at '+E.venue.name+' until '+(E.timeLabel.split('–')[1]||'').trim()+'.'],weather:['WEATHER WATCH','Storms are in the forecast. Check back here by 8 AM on the day.'],moved:['CHANGE','Details have changed — check the date, time and place below.'],past:['THANK YOU','Thank you to everyone who came out. Photos and next steps are coming soon.']}[st];
    if(B){document.getElementById('pepBannerK').textContent=B[0];document.getElementById('pepBannerV').textContent=B[1];document.getElementById('pepBanner').classList.add('on')}
    if(st==='past'){var r=document.getElementById('rsvp');if(r)r.style.display='none';document.querySelectorAll('a[href="#rsvp"]').forEach(function(a){a.style.display='none'})}
  }).catch(function(){});
})();
</script>
</body>
</html>
`;
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);
console.log('wrote', path.relative(ROOT, OUT), (html.length / 1024).toFixed(1) + ' KB');
try { execFileSync('node', [path.join(ROOT, 'scripts/apply-chrome.mjs')], { stdio: 'inherit' }); } catch (e) { console.error('chrome step failed — run npm run chrome'); process.exitCode = 1; }
