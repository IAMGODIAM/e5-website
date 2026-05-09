const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

module.exports = function (eleventyConfig) {
  // Passthrough copy
  eleventyConfig.addPassthroughCopy({ 'src/assets': 'assets' });
  eleventyConfig.addPassthroughCopy('favicon.ico');
  eleventyConfig.addPassthroughCopy('llms.txt');
  eleventyConfig.addPassthroughCopy('staticwebapp.config.json');
  eleventyConfig.addPassthroughCopy('CNAME');
  eleventyConfig.addPassthroughCopy('.nojekyll');
  eleventyConfig.addPassthroughCopy({ 'images': 'images' });

  // Watch targets
  eleventyConfig.addWatchTarget('src/assets/css/');
  eleventyConfig.addWatchTarget('src/assets/js/');

  // Filters
  eleventyConfig.addFilter('isoDate', (d) => new Date(d).toISOString());
  eleventyConfig.addFilter('longDate', (d) =>
    new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }),
  );
  eleventyConfig.addFilter('roman', (n) => (ROMAN[n] || String(n)).toLowerCase());
  eleventyConfig.addFilter('upperRoman', (n) => ROMAN[n] || String(n));
  eleventyConfig.addFilter('absoluteUrl', (path, base) => {
    try {
      return new URL(path || '/', base).toString();
    } catch (e) {
      return path;
    }
  });
  eleventyConfig.addFilter('byKey', (arr, key, val) =>
    (arr || []).find((o) => o[key] === val),
  );
  eleventyConfig.addFilter('limit', (arr, n) => (arr || []).slice(0, n));
  eleventyConfig.addFilter('where', (arr, key, val) =>
    (arr || []).filter((o) => o[key] === val),
  );

  // Shortcodes
  eleventyConfig.addShortcode('year', () => String(new Date().getFullYear()));
  eleventyConfig.addShortcode('ornament', (glyph) =>
    `<div class="vc-disp-ornament" aria-hidden="true">${glyph || '§'}</div>`,
  );

  // Paired shortcodes — body chrome for dispatch readers
  // Args are positional, comma-separated.
  eleventyConfig.addPairedShortcode('pullQuote', (content, mark) =>
    `<aside class="vc-disp-pull"><span class="mark">${mark || '❧'}</span>${content}</aside>`,
  );
  eleventyConfig.addPairedShortcode('qCard', (content, num, eyebrow, title) => {
    const e = eyebrow ? `<div class="q-eyebrow">${eyebrow}</div>` : '';
    const n = num ? `<div class="q-num">${num}</div>` : '';
    const t = title ? `<h3 class="q-title">${title}</h3>` : '';
    return `<section class="vc-disp-q-card">${e}${n}${t}<div class="q-body">${content}</div></section>`;
  });
  eleventyConfig.addPairedShortcode('witness', (content, lbl, title, source) => {
    const l = lbl ? `<div class="w-lbl">${lbl}</div>` : '<div class="w-lbl">Witness</div>';
    const t = title ? `<h3 class="w-title">${title}</h3>` : '';
    const s = source ? `<div class="w-source">${source}</div>` : '';
    return `<aside class="vc-disp-witness">${l}${t}<div class="w-body">${content}</div>${s}</aside>`;
  });
  eleventyConfig.addPairedShortcode('statRibbon', (content, num, lbl) => {
    const n = num ? `<div class="s-num">${num}</div>` : '';
    const l = lbl ? `<div class="s-lbl">${lbl}</div>` : '';
    return `<aside class="vc-disp-stat-ribbon">${n}<div class="s-content">${l}<p>${content}</p></div></aside>`;
  });
  eleventyConfig.addPairedShortcode('marginalia', (content, lbl) => {
    const l = lbl ? `<span class="m-lbl">${lbl}</span>` : '';
    return `<aside class="vc-disp-marg">${l}${content}</aside>`;
  });

  // Collections
  eleventyConfig.addCollection('post', (api) =>
    api
      .getFilteredByTag('post')
      .sort((a, b) => new Date(b.data.date) - new Date(a.data.date)),
  );
  eleventyConfig.addCollection('paper', (api) =>
    api
      .getFilteredByGlob('src/record/*.md')
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0)),
  );
  eleventyConfig.addCollection('pillar', (api) =>
    api
      .getFilteredByGlob('src/pillars/*.md')
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0)),
  );
  eleventyConfig.addCollection('program', (api) =>
    api
      .getFilteredByGlob('src/programs/*.md')
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0)),
  );

  // Layout aliases — point at files in dir.layouts
  eleventyConfig.addLayoutAlias('base', 'base.njk');
  eleventyConfig.addLayoutAlias('page', 'page.njk');
  eleventyConfig.addLayoutAlias('post', 'post.njk');
  eleventyConfig.addLayoutAlias('record', 'record.njk');
  eleventyConfig.addLayoutAlias('dispatch', 'dispatch.njk');
  eleventyConfig.addLayoutAlias('pillar', 'pillar.njk');
  eleventyConfig.addLayoutAlias('program', 'program.njk');
  eleventyConfig.addLayoutAlias('legal', 'legal.njk');
  eleventyConfig.addLayoutAlias('monumental', 'monumental.njk');
  eleventyConfig.addLayoutAlias('scaffold', 'scaffold.njk');

  return {
    dir: {
      input: 'src',
      includes: '_includes',
      layouts: '_layouts',
      data: '_data',
      output: '_site',
    },
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    templateFormats: ['njk', 'md', '11ty.js'],
  };
};
