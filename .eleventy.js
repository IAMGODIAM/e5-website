const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

module.exports = function (eleventyConfig) {
  // Passthrough copy
  eleventyConfig.addPassthroughCopy({ 'src/assets': 'assets' });
  eleventyConfig.addPassthroughCopy('favicon.ico');
  eleventyConfig.addPassthroughCopy('llms.txt');
  eleventyConfig.addPassthroughCopy('staticwebapp.config.json');
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
  eleventyConfig.addLayoutAlias('pillar', 'pillar.njk');
  eleventyConfig.addLayoutAlias('program', 'program.njk');
  eleventyConfig.addLayoutAlias('legal', 'legal.njk');

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
