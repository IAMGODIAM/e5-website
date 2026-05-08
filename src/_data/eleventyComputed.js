module.exports = {
  permalink: (data) => data.permalink,
  canonical: (data) => {
    const base = (data.site && data.site.url) || '';
    return base + (data.page && data.page.url ? data.page.url : '/');
  },
  ogImageAbs: (data) => {
    const base = (data.site && data.site.url) || '';
    const img = data.ogImage || (data.site && data.site.ogImage) || '/assets/img/og/default.png';
    if (/^https?:/.test(img)) return img;
    return base + img;
  },
};
