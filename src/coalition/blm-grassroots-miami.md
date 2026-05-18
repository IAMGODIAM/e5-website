---
layout: base
title: "BLM Grassroots Miami — E5 Enclave Coalition | E5 Enclave"
description: "BLM Grassroots Miami is one of 51 frontline chapters of the movement that changed the world. E5 Enclave is honored to stand alongside them in Liberty City."
permalink: /coalition/blm-grassroots-miami/
---

<style>
.blm-page { max-width: 1180px; margin: 0 auto; padding: 0 40px; }
@media (max-width: 700px) { .blm-page { padding: 0 20px; } }

.blm-hero { padding: 96px 0 80px; border-bottom: 1px solid var(--vc-rule, #d4c5a0); }
.blm-hero-eyebrow { font-family: var(--sans, sans-serif); font-size: 10px; letter-spacing: 0.44em; text-transform: uppercase; color: var(--vc-oxblood, #8b1a1a); font-weight: 600; margin-bottom: 24px; }
.blm-hero h1 { font-family: var(--serif, Georgia, serif); font-size: clamp(42px, 7vw, 88px); font-weight: 400; line-height: 1.0; letter-spacing: -0.03em; color: var(--vc-ink, #1a1614); margin: 0 0 32px; max-width: 900px; }
.blm-hero h1 em { font-style: italic; color: var(--vc-oxblood, #8b1a1a); }
.blm-hero-deck { font-family: var(--serif, Georgia, serif); font-size: clamp(18px, 2.2vw, 24px); line-height: 1.6; color: var(--vc-muted, #7a6a50); max-width: 680px; margin: 0 0 40px; }
.blm-hero-meta { display: flex; gap: 32px; flex-wrap: wrap; font-family: var(--sans, sans-serif); font-size: 10px; letter-spacing: 0.28em; text-transform: uppercase; color: var(--vc-muted, #7a6a50); border-top: 1px solid var(--vc-rule, #d4c5a0); padding-top: 24px; }
.blm-hero-meta span em { display: block; font-style: normal; font-family: var(--serif, Georgia, serif); font-size: 14px; color: var(--vc-ink, #1a1614); letter-spacing: 0; text-transform: none; margin-top: 4px; }

.blm-stats { display: grid; grid-template-columns: repeat(4, 1fr); border-bottom: 1px solid var(--vc-rule, #d4c5a0); }
@media (max-width: 700px) { .blm-stats { grid-template-columns: repeat(2, 1fr); } }
.blm-stat { padding: 40px 28px; border-right: 1px solid var(--vc-rule, #d4c5a0); }
.blm-stat:last-child { border-right: none; }
.blm-stat-num { font-family: var(--serif, Georgia, serif); font-size: 52px; font-weight: 400; color: var(--vc-oxblood, #8b1a1a); line-height: 1; margin-bottom: 8px; }
.blm-stat-label { font-family: var(--sans, sans-serif); font-size: 10px; letter-spacing: 0.28em; text-transform: uppercase; color: var(--vc-muted, #7a6a50); }

.blm-body { padding: 88px 0; display: grid; grid-template-columns: 1fr 320px; gap: 80px; align-items: start; }
@media (max-width: 900px) { .blm-body { grid-template-columns: 1fr; gap: 48px; } }

.blm-prose h2 { font-family: var(--serif, Georgia, serif); font-size: clamp(22px, 3vw, 30px); font-weight: 400; color: var(--vc-ink, #1a1614); margin: 56px 0 20px; letter-spacing: -0.01em; padding-top: 56px; border-top: 1px solid var(--vc-rule, #d4c5a0); }
.blm-prose h2:first-child { margin-top: 0; padding-top: 0; border-top: none; }
.blm-prose p { font-family: var(--serif, Georgia, serif); font-size: 17px; line-height: 1.8; color: var(--vc-ink-2, #3a2e24); margin: 0 0 20px; }
.blm-prose .lede { font-size: 20px; line-height: 1.65; color: var(--vc-ink, #1a1614); margin-bottom: 28px; }
.blm-prose blockquote { margin: 40px 0; padding: 32px 36px; border-left: 3px solid var(--vc-oxblood, #8b1a1a); background: var(--vc-bone-2, #f5f0e6); }
.blm-prose blockquote p { font-size: 20px; font-style: italic; line-height: 1.6; color: var(--vc-ink, #1a1614); margin: 0 0 12px; }
.blm-prose blockquote cite { font-family: var(--sans, sans-serif); font-size: 10px; letter-spacing: 0.28em; text-transform: uppercase; color: var(--vc-muted, #7a6a50); font-style: normal; }

.blm-pillars { margin: 40px 0; }
.blm-pillar { display: grid; grid-template-columns: 48px 1fr; align-items: start; gap: 20px; padding: 24px 0; border-bottom: 1px solid var(--vc-rule, #d4c5a0); }
.blm-pillar:last-child { border-bottom: none; }
.blm-pillar-num { font-family: var(--serif, Georgia, serif); font-size: 28px; color: var(--vc-oxblood, #8b1a1a); line-height: 1; padding-top: 2px; }
.blm-pillar-title { font-family: var(--serif, Georgia, serif); font-size: 16px; font-weight: 400; color: var(--vc-ink, #1a1614); margin: 0 0 6px; }
.blm-pillar-text { font-family: var(--serif, Georgia, serif); font-size: 14px; line-height: 1.7; color: var(--vc-muted, #7a6a50); margin: 0; }

.blm-sidebar-card { background: var(--vc-bone-2, #f5f0e6); border: 1px solid var(--vc-rule, #d4c5a0); padding: 32px; margin-bottom: 24px; position: sticky; top: 32px; }
.blm-sidebar-label { font-family: var(--sans, sans-serif); font-size: 9.5px; letter-spacing: 0.4em; text-transform: uppercase; color: var(--vc-oxblood, #8b1a1a); font-weight: 600; margin-bottom: 20px; }
.blm-sidebar-item { display: flex; flex-direction: column; gap: 4px; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid var(--vc-rule, #d4c5a0); }
.blm-sidebar-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.blm-sidebar-item dt { font-family: var(--sans, sans-serif); font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--vc-muted, #7a6a50); }
.blm-sidebar-item dd { font-family: var(--serif, Georgia, serif); font-size: 15px; color: var(--vc-ink, #1a1614); margin: 0; }
.blm-sidebar-item dd a { color: var(--vc-oxblood, #8b1a1a); text-decoration: none; border-bottom: 1px solid transparent; transition: border-color 0.2s; }
.blm-sidebar-item dd a:hover { border-bottom-color: var(--vc-oxblood, #8b1a1a); }

.blm-anthem { padding: 88px 0; text-align: center; }
.blm-anthem-label { font-family: var(--sans, sans-serif); font-size: 9.5px; letter-spacing: 0.44em; text-transform: uppercase; color: var(--vc-bone-2, #c9b99a); margin-bottom: 24px; }
.blm-anthem-quote { font-family: var(--serif, Georgia, serif); font-size: clamp(24px, 4vw, 42px); font-weight: 400; font-style: italic; line-height: 1.35; color: var(--vc-bone, #fdfaf4); max-width: 820px; margin: 0 auto 24px; letter-spacing: -0.015em; }
.blm-anthem-attr { font-family: var(--sans, sans-serif); font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--vc-bone-2, #c9b99a); }

.blm-cta { padding: 64px 0 96px; border-top: 1.5px solid var(--vc-ink, #1a1614); display: flex; justify-content: space-between; align-items: center; gap: 32px; flex-wrap: wrap; }
.blm-cta-eyebrow { font-family: var(--sans, sans-serif); font-size: 9.5px; letter-spacing: 0.4em; text-transform: uppercase; color: var(--vc-oxblood, #8b1a1a); font-weight: 600; margin-bottom: 8px; }
.blm-cta-heading { font-family: var(--serif, Georgia, serif); font-size: clamp(20px, 2.5vw, 26px); color: var(--vc-ink, #1a1614); margin: 0; }
.blm-cta-actions { display: flex; gap: 16px; flex-wrap: wrap; align-items: center; }
.blm-btn-primary { display: inline-block; padding: 14px 28px; background: var(--vc-ink, #1a1614); color: var(--vc-bone, #fdfaf4); font-family: var(--sans, sans-serif); font-size: 10px; letter-spacing: 0.28em; text-transform: uppercase; text-decoration: none; transition: background 0.2s; }
.blm-btn-primary:hover { background: var(--vc-oxblood, #8b1a1a); }
.blm-btn-link { display: inline-block; padding: 14px 4px; color: var(--vc-muted, #7a6a50); font-family: var(--sans, sans-serif); font-size: 10px; letter-spacing: 0.28em; text-transform: uppercase; text-decoration: none; border-bottom: 1px solid var(--vc-rule, #d4c5a0); transition: color 0.2s, border-color 0.2s; }
.blm-btn-link:hover { color: var(--vc-ink, #1a1614); border-bottom-color: var(--vc-ink, #1a1614); }
</style>

<div class="blm-page">

  <div class="blm-hero">
    <div class="blm-hero-eyebrow">The Coalition of the Willing &nbsp;·&nbsp; Coalition Partner</div>
    <h1>Black Lives Matter<br><em>Grassroots Miami</em></h1>
    <p class="blm-hero-deck">Fifty-one frontline chapters. One unbroken mission: end state-sanctioned violence in all its forms. E5 Enclave stands with BLM Grassroots Miami — on the same ground, in the same city, in the same fight.</p>
    <div class="blm-hero-meta">
      <span>Type<em>Coalition Partner</em></span>
      <span>Founded<em>2013</em></span>
      <span>Base<em>Miami, Florida</em></span>
      <span>Network<em>51 Frontline Chapters</em></span>
    </div>
  </div>

  <div class="blm-stats">
    <div class="blm-stat">
      <div class="blm-stat-num">51</div>
      <div class="blm-stat-label">Frontline Chapters Worldwide</div>
    </div>
    <div class="blm-stat">
      <div class="blm-stat-num">13</div>
      <div class="blm-stat-label">Years of Organizing</div>
    </div>
    <div class="blm-stat">
      <div class="blm-stat-num">∞</div>
      <div class="blm-stat-label">The Movement Continues</div>
    </div>
    <div class="blm-stat">
      <div class="blm-stat-num">#BLM</div>
      <div class="blm-stat-label">Born on the Ground. Still Here.</div>
    </div>
  </div>

  <div class="blm-body">

    <div class="blm-prose">

      <h2>Who They Are</h2>
      <p class="lede">Black Lives Matter Grassroots IS Black Lives Matter. Not the foundation, not the brand — the movement. The 51 chapters. The thousands of organizers. The people who were there in 2013 and have never left.</p>

      <p>BLM Grassroots was born from a simple, radical declaration: Black lives matter. What began as a response to the acquittal of Trayvon Martin's killer has grown into the most significant Black-led social movement of the 21st century — a global network of frontline chapters organized around abolition, reparations, land sovereignty, and the protection of Black life from state violence.</p>

      <p>The Miami chapter carries that mandate into the streets of one of America's most unequal cities — where Liberty City, Overtown, and Little Haiti hold the memory of what has been done to Black people and the blueprint for what Black people are building next.</p>

      <blockquote>
        <p>"We are 51 frontline chapters and thousands of organizers who birthed, built, and fuel the global movement."</p>
        <cite>— Black Lives Matter Grassroots</cite>
      </blockquote>

      <h2>The Work</h2>
      <p>BLM Grassroots Miami doesn't run programs. It runs the movement. That means showing up — in courtrooms, at city hall, in the streets, in the schools, and in the spaces where Black Miami decides its own future.</p>

      <div class="blm-pillars">
        <div class="blm-pillar">
          <div class="blm-pillar-num">I</div>
          <div>
            <p class="blm-pillar-title">End State-Sanctioned Violence</p>
            <p class="blm-pillar-text">Police accountability, criminal justice reform, and the demand to protect Black bodies from the violence of institutions designed to harm them. Every name. Every case. Every city.</p>
          </div>
        </div>
        <div class="blm-pillar">
          <div class="blm-pillar-num">II</div>
          <div>
            <p class="blm-pillar-title">Reparations &amp; Economic Justice</p>
            <p class="blm-pillar-text">The demand is not new. It is overdue. BLM Grassroots has been among the most consistent voices connecting the carceral state to economic extraction — and economic repair to Black liberation.</p>
          </div>
        </div>
        <div class="blm-pillar">
          <div class="blm-pillar-num">III</div>
          <div>
            <p class="blm-pillar-title">Black Women Are Divine</p>
            <p class="blm-pillar-text">A national campaign reclaiming the divinity, strength, and resilience of Black women — in the names of Breonna Taylor, Sandra Bland, and every Black woman whose life was stolen by state violence.</p>
          </div>
        </div>
        <div class="blm-pillar">
          <div class="blm-pillar-num">IV</div>
          <div>
            <p class="blm-pillar-title">Land Back &amp; Community Sovereignty</p>
            <p class="blm-pillar-text">From the Gullah Geechee land demands in Charleston to urban food systems in Miami — land sovereignty is a material condition of Black freedom, not an abstraction.</p>
          </div>
        </div>
        <div class="blm-pillar">
          <div class="blm-pillar-num">V</div>
          <div>
            <p class="blm-pillar-title">Political Prisoners &amp; Abolition</p>
            <p class="blm-pillar-text">Black August. Free Jay Burton. Free them all. BLM Grassroots refuses to let the movement forget who is still caged — and why abolition is a destination, not a slogan.</p>
          </div>
        </div>
      </div>

      <h2>Why E5 Enclave Stands Here</h2>
      <p>E5 Enclave Incorporated was built from the same soil. Liberty City is not a backdrop — it is the reason this organization exists. The same corridor BLM Grassroots Miami has organized, E5 was founded to serve: with evidence, with infrastructure, with the long memory of what this community has survived and what it is owed.</p>

      <p>This is not a vendor relationship. It is a coalition between two organizations that share a city, share a lineage, and share a conviction — that the work of Black liberation requires both the power to move people and the infrastructure to hold what is won.</p>

      <p>Small, intentional, and sovereign. E5 is in its beginning. BLM Grassroots Miami has been doing this for thirteen years. The only reason to stand in coalition is if you are prepared to carry your weight — and that is exactly what E5 brings to this table.</p>

    </div>

    <aside>
      <div class="blm-sidebar-card">
        <div class="blm-sidebar-label">Organization</div>
        <dl>
          <div class="blm-sidebar-item">
            <dt>Full Name</dt>
            <dd>Black Lives Matter Grassroots</dd>
          </div>
          <div class="blm-sidebar-item">
            <dt>Chapter</dt>
            <dd>Miami, Florida</dd>
          </div>
          <div class="blm-sidebar-item">
            <dt>Founded</dt>
            <dd>2013</dd>
          </div>
          <div class="blm-sidebar-item">
            <dt>Network Director</dt>
            <dd>Dr. Melina Abdullah</dd>
          </div>
          <div class="blm-sidebar-item">
            <dt>Mission</dt>
            <dd>End state-sanctioned violence in all its forms</dd>
          </div>
          <div class="blm-sidebar-item">
            <dt>Website</dt>
            <dd><a href="https://blmgrassroots.org" target="_blank" rel="noopener">blmgrassroots.org ↗</a></dd>
          </div>
        </dl>
      </div>

      <div class="blm-sidebar-card">
        <div class="blm-sidebar-label">Coalition Standing</div>
        <dl>
          <div class="blm-sidebar-item">
            <dt>Partner Since</dt>
            <dd>May 2026</dd>
          </div>
          <div class="blm-sidebar-item">
            <dt>Collaboration Type</dt>
            <dd>Civic Infrastructure + Evidence Systems</dd>
          </div>
          <div class="blm-sidebar-item">
            <dt>E5 Contact</dt>
            <dd><a href="mailto:israel@e5enclave.com">israel@e5enclave.com</a></dd>
          </div>
        </dl>
      </div>

      <div style="margin-top:8px;">
        <a href="/coalition/" class="blm-btn-link">← Back to The Coalition</a>
      </div>
    </aside>

  </div>

</div>

<div class="blm-anthem" style="background: var(--vc-ink, #1a1614); margin: 0; padding: 88px 0;">
  <div class="blm-page">
    <div class="blm-anthem-label">The Declaration</div>
    <p class="blm-anthem-quote">"The mission of Black Lives Matter Grassroots is to support, sustain, and uplift the necessary agitations, mobilizations, and community organizing that fuel the movement for Black liberation."</p>
    <div class="blm-anthem-attr">Black Lives Matter Grassroots · Since 2013</div>
  </div>
</div>

<div class="blm-page">
  <div class="blm-cta">
    <div>
      <div class="blm-cta-eyebrow">E5 Enclave · The Coalition of the Willing</div>
      <p class="blm-cta-heading">Stand with the coalition. Build what endures.</p>
    </div>
    <div class="blm-cta-actions">
      <a href="/donate/" class="blm-btn-primary">Support the Work →</a>
      <a href="/coalition/" class="blm-btn-link">View Full Coalition →</a>
    </div>
  </div>
</div>
