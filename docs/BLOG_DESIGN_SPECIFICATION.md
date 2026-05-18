# E5 Enclave Blog — Complete Design Specification

> Extracted from auditing blog/index.html, blog/post.html (template), 
> blog/buying-black-blocks-economic-sovereignty/index.html (example article),
> css/style.css, css/blog.css, js/blog/*.js, data/posts/*.json, 
> and scripts/build-blog.js.

---

## 1. ARCHITECTURE OVERVIEW

The blog uses a **JSON-driven static generation** pipeline:

1. **Data**: Post content lives in `data/posts/` as JSON files
2. **Build**: `scripts/build-blog.js` reads JSON + template → generates `blog/[slug]/index.html`
3. **Template**: `blog/post.html` is the Mustache-style template (uses `{{PLACEHOLDER}}` syntax)
4. **JS**: `js/blog-bundle.js` (esbuild bundle of `js/blog/index.js` + masonry.js + editorial.js)
5. **CSS**: `css/style.css` (global) + `css/blog.css` (blog-specific)

### File Structure
```
e5-website/
├── blog/
│   ├── index.html                          # Blog listing page
│   ├── post.html                           # Article HTML template
│   └── [slug]/index.html                   # Generated article pages
├── css/
│   ├── style.css                           # Global styles (1179 lines)
│   └── blog.css                            # Blog-specific styles (542 lines)
├── js/
│   ├── blog-bundle.js                      # Bundled JS (built by esbuild)
│   └── blog/
│       ├── index.js                        # Entry: detects page type, fetches JSON
│       ├── masonry.js                      # Blog index: virtualized masonry grid
│       └── editorial.js                    # Article page: Pretext layout engine
├── data/
│   └── posts/
│       ├── index.json                      # Array of all posts (summary data)
│       └── [slug].json                     # Full post content per article
├── images/blog/
│   └── [slug].svg                          # Article card/OG images
└── scripts/
    └── build-blog.js                       # Static HTML generator
```

---

## 2. COLOR PALETTE

### CSS Custom Properties (from :root in style.css)
```css
--black:        #0a0a0a      /* Page background */
--black-light:  #1a1a1a      /* Card backgrounds, secondary bg */
--black-medium: #2a2a2a      /* Placeholder bg, tertiary */
--gold:         #c9a84c      /* Primary brand gold — headings, accents, CTAs */
--gold-light:   #d4b86a      /* Hover state gold, pull quote text */
--gold-dark:    #a8882e      /* Avatar gradient end */
--gold-muted:   #b89d45      /* Motto text, subdued gold */
--red:          #8b1a1a      /* Deep red — borders, accents */
--red-light:    #a52a2a      /* Lighter red accent */
--red-accent:   #c0392b      /* Bright red (rarely used) */
--white:        #f5f5f0      /* Primary text color (warm white) */
--white-pure:   #ffffff      /* Pure white (sparingly used) */
--gray:         #888          /* Meta text, subtle labels */
--gray-light:   #bbb          /* Body text on dark bg, nav links */
--gray-dark:    #444          /* Dot separators, dividers */
```

### Key RGBA Values Used Throughout
```
rgba(201, 168, 76, 0.06)  — Very subtle gold tint (tag bg, hero gradient)
rgba(201, 168, 76, 0.08)  — Card borders, heading top borders
rgba(201, 168, 76, 0.1)   — Section borders, meta dividers
rgba(201, 168, 76, 0.12)  — Article tag borders
rgba(201, 168, 76, 0.15)  — Nav border when scrolled
rgba(201, 168, 76, 0.2)   — Featured card borders, filter borders
rgba(201, 168, 76, 0.25)  — Card hover borders
rgba(201, 168, 76, 0.5)   — Filter hover border
rgba(139, 26, 26, 0.04)   — Red tint in CTA gradient
```

---

## 3. TYPOGRAPHY

### Font Loading
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### Font Stacks
```css
--font-heading: 'Playfair Display', Georgia, serif;
--font-body:    'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

### Typography Scale

| Element                    | Font              | Size                         | Weight | Line-Height | Color   | Extra                          |
|---------------------------|-------------------|------------------------------|--------|-------------|---------|--------------------------------|
| Blog hero label           | Inter             | 0.7rem                       | 600    | —           | #c9a84c | letter-spacing: 0.4em, uppercase |
| Blog hero title           | Playfair Display  | clamp(2.2rem, 5vw, 3.4rem)  | 700    | 1.2         | #f5f5f0 | —                              |
| Blog hero subtitle        | Inter             | 1.05rem                      | 300    | 1.7         | #bbb    | max-width: 600px               |
| Article header category   | Inter             | 0.7rem                       | 600    | —           | #c9a84c | letter-spacing: 0.4em, uppercase |
| Article header title      | Playfair Display  | clamp(2rem, 5vw, 3rem)      | 700    | 1.2         | #f5f5f0 | —                              |
| Article header subtitle   | Inter             | 1.1rem                       | 300    | 1.6         | #999    | —                              |
| Article author name       | Inter             | 0.9rem                       | 600    | —           | #f5f5f0 | —                              |
| Article author role       | Inter             | 0.75rem                      | 400    | —           | #888    | margin-top: 2px                |
| Article date/details      | Inter             | 0.8rem                       | 400    | —           | #888    | —                              |
| Article body paragraph    | Inter             | 1.05rem                      | 400    | 1.8         | #ccc    | margin-bottom: 1.5rem          |
| Article heading (h2)      | Playfair Display  | 1.6rem                       | 700    | 1.3         | #f5f5f0 | border-top, padding-top: 1rem  |
| Article drop cap          | Playfair Display  | 4.2rem                       | 700    | 0.85        | #c9a84c | float: left                    |
| Article pull quote text   | Playfair Display  | 1.3rem                       | 400    | 1.65        | #d4b86a | italic                         |
| Article tag               | Inter             | 0.65rem                      | 500    | —           | #999    | letter-spacing: 0.08em, uppercase |
| Blog card category        | Inter             | 0.65rem                      | 600    | —           | #c9a84c | letter-spacing: 0.35em, uppercase |
| Blog card title           | Playfair Display  | 1.2rem                       | 700    | 1.35        | #f5f5f0 | —                              |
| Blog card excerpt         | Inter             | 0.88rem                      | 400    | 1.6         | #999    | —                              |
| Blog card meta            | Inter             | 0.72rem                      | 500    | —           | #666    | letter-spacing: 0.04em         |
| Blog card tag             | Inter             | 0.62rem                      | 500    | —           | #888    | letter-spacing: 0.06em, uppercase |
| Blog filter button        | Inter             | 0.75rem                      | 500    | —           | #bbb    | letter-spacing: 0.12em, uppercase |
| Article nav link          | Inter             | 0.8rem                       | 500    | —           | #c9a84c | letter-spacing: 0.1em, uppercase |

---

## 4. JSON DATA MODEL

### index.json (Post Summary — used by blog index)
Each entry in the array:
```json
{
  "slug": "kebab-case-slug",
  "title": "Full Article Title",
  "excerpt": "1-2 sentence description for card + meta",
  "date": "YYYY-MM-DD",
  "author": "Full Name",
  "authorRole": "Title / Role",
  "category": "One of: FarmBlock | Economic | Emancipated | Environmental | Educational | Equality",
  "tags": ["kebab-case-tag-1", "kebab-case-tag-2", ...],
  "image": "/images/blog/slug-name.svg",
  "readTime": "X min read",
  "featured": true|false,
  "pullQuotes": [
    "Quote text 1 — inserted after paragraph 3",
    "Quote text 2 — inserted after paragraph 7"
  ]
}
```

### [slug].json (Full Article Data — used by article page)
```json
{
  "slug": "kebab-case-slug",
  "title": "Full Article Title",
  "subtitle": "Shorter subtitle for article header",
  "date": "YYYY-MM-DD",
  "author": "Full Name",
  "authorRole": "Title / Role",
  "category": "Category Name",
  "tags": ["kebab-case-tag-1", "kebab-case-tag-2", ...],
  "readTime": "X min read",
  "pullQuotes": ["Quote 1", "Quote 2"],
  "body": [
    { "type": "dropcap", "text": "First paragraph with drop cap (first char auto-extracted)" },
    { "type": "paragraph", "text": "Standard paragraph text" },
    { "type": "heading", "text": "Section heading text (renders as h2)" },
    { "type": "paragraph", "text": "More paragraph text" }
  ]
}
```

### Body Block Types
| Type        | Description                                               |
|-------------|-----------------------------------------------------------|
| `dropcap`   | First paragraph — first character becomes a large gold drop cap (float left) |
| `paragraph` | Standard body paragraph                                   |
| `heading`   | Section heading (renders as `<h2 class="article-heading">`) |

### Pull Quote Insertion Logic
Pull quotes from the `pullQuotes` array are inserted **after paragraphs 3 and 7** (counted across all dropcap + paragraph blocks, not headings). This is hardcoded in both `build-blog.js` and `editorial.js`:
```javascript
const pullQuoteAfterParagraph = [3, 7]
```

---

## 5. HTML TEMPLATES

### Article Page Template (blog/post.html)
Template variables (double-brace syntax):
```
{{TITLE}}        — Article title (escaped HTML)
{{EXCERPT}}      — Article excerpt/description
{{SLUG}}         — URL slug (kebab-case)
{{DATE}}         — ISO date YYYY-MM-DD
{{AUTHOR}}       — Author full name
{{IMAGE}}        — Image path (e.g., /images/blog/slug.svg)
{{OG_TAGS}}      — Generated <meta property="article:tag"> elements
{{SSR_CONTENT}}  — Server-rendered article body HTML
```

### Full Article HTML Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- meta charset, viewport -->
  <title>{{TITLE}} | E5 Enclave</title>
  <meta name="description" content="{{EXCERPT}}">
  <!-- Open Graph: og:title, og:description, og:type=article, og:url, og:site_name, og:image -->
  <!-- article:published_time, article:author, article:tag (per tag) -->
  <!-- Twitter: summary_large_image card -->
  <!-- JSON-LD: BlogPosting schema -->
  <!-- Google Fonts: Playfair Display + Inter -->
  <!-- CSS: /css/style.css + /css/blog.css -->
  <!-- Favicon + Analytics -->
</head>
<body class="article-page">
  <nav class="navbar scrolled" id="navbar">...</nav>

  <article>
    <div class="article-content" id="article-content" data-slug="{{SLUG}}">
      <header class="article-header">
        <div class="article-header__category">Category</div>
        <h1 class="article-header__title">Title</h1>
        <p class="article-header__subtitle">Subtitle</p>
        <div class="article-header__meta">
          <div class="article-header__author">
            <div class="article-header__author-avatar">ILA</div>
            <div>
              <div class="article-header__author-name">Author Name</div>
              <div class="article-header__author-role">Role</div>
            </div>
          </div>
          <div class="article-header__details">
            <time datetime="YYYY-MM-DD">Month DD, YYYY</time>
            <span class="article-header__dot">·</span>
            <span>X min read</span>
          </div>
        </div>
        <div class="article-header__tags">
          <span class="article-tag">tag name</span>...
        </div>
      </header>

      <div class="article-body">
        <!-- Drop cap block -->
        <div class="article-dropcap-block">
          <span class="article-dropcap">L</span>
          <p class="article-paragraph">rest of first paragraph...</p>
          <div style="clear:both"></div>
        </div>

        <!-- Standard paragraph -->
        <p class="article-paragraph">Paragraph text...</p>

        <!-- Section heading -->
        <h2 class="article-heading">Heading Text</h2>

        <!-- Pull quote (inserted after paragraphs 3 and 7) -->
        <blockquote class="article-pullquote">
          <div class="article-pullquote__border"></div>
          <p class="article-pullquote__text">Quote text</p>
        </blockquote>
      </div>
    </div>

    <!-- Article Footer (outside article-content for full width CTA) -->
    <div class="article-content">
      <div class="article-footer">
        <div class="article-footer__cta">
          <h3>Support This Work</h3>
          <p>E5 Enclave is a 501(c)(3) nonprofit building sustainable communities through the five pillars of empowerment. Every contribution makes a difference.</p>
          <a href="/donate" class="btn btn-primary">Donate Now</a>
        </div>
        <nav class="article-nav">
          <a href="/blog" class="article-nav__link">&larr; All Posts</a>
        </nav>
      </div>
    </div>
  </article>

  <footer class="footer">...</footer>
  <script src="/js/blog-bundle.js"></script>
  <!-- Nav hamburger toggle script -->
</body>
</html>
```

---

## 6. NAVIGATION (shared across all pages)

```html
<nav class="navbar scrolled" id="navbar">
  <div class="container">
    <a href="/" class="logo">
      <span class="logo-e5">E5</span>
      <span class="logo-text">Enclave</span>
    </a>
    <div class="nav-menu" id="navMenu">
      <a href="/" class="nav-link">Home</a>
      <a href="/#about" class="nav-link">About</a>
      <a href="/#pillars" class="nav-link">Our Pillars</a>
      <a href="/#programs" class="nav-link">Programs</a>
      <a href="/#farmblock" class="nav-link">FarmBlock</a>
      <a href="/blog" class="nav-link active">Blog</a>
      <a href="/#contact" class="nav-link">Contact</a>
      <a href="/donate" class="nav-link nav-donate">Donate</a>
    </div>
    <button class="hamburger" id="hamburger" aria-label="Toggle navigation">
      <span></span><span></span><span></span>
    </button>
  </div>
</nav>
```

Key CSS details:
- `navbar`: fixed, z-index 1000, transitions padding on scroll
- `navbar.scrolled`: rgba(10,10,10,0.95) bg, blur(20px) backdrop, gold border-bottom
- Blog pages always get `class="navbar scrolled"` (already scrolled state)
- `nav-donate`: gold bg button, black text, 2px border-radius
- Active link: `class="nav-link active"` (Blog is active on blog pages)

---

## 7. FOOTER (shared across all pages)

```html
<footer class="footer">
  <div class="container">
    <div class="footer-grid">  <!-- 4-col: 2fr 1fr 1fr 1.2fr -->
      <div class="footer-about">
        <a href="/" class="footer-logo">
          <span class="logo-e5">E5</span>
          <span class="logo-text">Enclave</span>
        </a>
        <p class="footer-motto">"Dum Spiro, Spero"</p>
        <p class="footer-description">Building sustainable communities through the five pillars of empowerment.</p>
      </div>
      <div class="footer-links">
        <h4>The Five E's</h4>
        <a href="/pillars/environmental">Environmental</a>
        <a href="/pillars/economic">Economic</a>
        <a href="/pillars/educational">Educational</a>
        <a href="/pillars/equality">Equality</a>
        <a href="/pillars/emancipated">Emancipated</a>
      </div>
      <div class="footer-links">
        <h4>Get Involved</h4>
        <a href="/donate">Donate</a>
        <a href="/blog">Blog</a>
        <a href="/#contact">Volunteer</a>
        <a href="/#contact">Partner</a>
        <a href="/#contact">Contact</a>
      </div>
      <div class="footer-contact">
        <h4>Contact</h4>
        <p>E5 Enclave Inc.</p>
        <p>Miami, FL</p>
        <p><a href="mailto:info@e5enclave.com">info@e5enclave.com</a></p>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2026 E5 Enclave Inc. All rights reserved. 501(c)(3) Nonprofit Organization.</p>
    </div>
  </div>
</footer>
```

---

## 8. LAYOUT STRUCTURE

### Global
- `body`: background #0a0a0a, color #f5f5f0, Inter font, line-height 1.7
- `.container`: max-width 1200px, margin 0 auto, padding 0 2rem
- All HTML elements: box-sizing border-box, margin/padding reset

### Blog Index Page
- `.blog-hero`: padding 10rem 0 4rem, centered, gold gradient top, gold border-bottom
- `.blog-filters`: flexbox centered, gap 0.75rem, flex-wrap
- `.blog-masonry`: position relative, max-width 1200px, margin auto, padding 0 2rem 6rem
  - Cards are absolutely positioned via JS transforms
  - Virtualized rendering (only visible cards in DOM)
  - 1-3 columns depending on viewport (min-col-width: 340px, max: 420px)
  - Card gap: 24px

### Article Page
- `body.article-page`: applied to body on article pages
- `.article-content`: max-width 760px, margin 0 auto, padding 0 2rem 6rem
- `.article-header`: padding 10rem 0 3rem, centered, max-width 760px
- `.article-body`: margin-top 3rem

---

## 9. BLOG CARD FORMAT (Index Page)

Generated by JS (`masonry.js`), structure:
```html
<a href="/blog/slug" class="blog-card blog-card--featured">
  <div class="blog-card__image" style="background-image:url(/images/blog/slug.svg);padding-bottom:56%"></div>
  <div class="blog-card__body">
    <span class="blog-card__category">Category</span>
    <h3 class="blog-card__title">Title Text</h3>
    <p class="blog-card__excerpt">Excerpt text...</p>
    <div class="blog-card__meta">
      <time>March 1, 2026</time>
      <span>12 min read</span>
    </div>
    <div class="blog-card__tags">
      <span class="blog-card__tag">tag name</span>
      <span class="blog-card__tag">tag name</span>
      <span class="blog-card__tag">tag name</span>
    </div>
  </div>
</a>
```

Key card CSS:
- Background: #1a1a1a
- Border: 1px solid rgba(201, 168, 76, 0.08)
- Border-radius: 3px
- Hover: translateY(-4px), gold border, shadow
- Featured variant: `.blog-card--featured` — gold border 0.2, gradient bg
- Image: 56% padding-bottom (16:9 ratio), background-size: cover
- Tags limited to first 3, hyphens replaced with spaces
- Max 3 tags shown (`.slice(0, 3)` in JS)

---

## 10. RESPONSIVE BREAKPOINTS

### 768px (tablet)
Blog:
- `.blog-hero`: padding 7rem 1.5rem 3rem
- `.blog-masonry`: padding 0 1rem 4rem
- `.blog-filters`: padding 1.5rem 1rem, gap 0.5rem
- `.blog-filter`: smaller padding/font
- `.article-header`: padding 7rem 1.5rem 2rem, text-align left
- `.article-header__meta`: flex-direction column, align flex-start
- `.article-content`: padding 0 1.5rem 4rem
- `.article-pullquote`: smaller margins/padding, font-size 1.15rem
- `.article-dropcap`: font-size 3.2rem
- `.article-paragraph`: font-size 1rem

Global:
- Mobile nav drawer (280px slide-in from right)
- Single column for most grids

### 480px (mobile)
Blog:
- `.blog-card__body`: padding 18px
- `.blog-card__title`: font-size 1.05rem
- `.blog-card__excerpt`: font-size 0.82rem

Global:
- Full-width buttons
- Single column impact grid

---

## 11. BUTTONS

```css
.btn {
  display: inline-block;
  padding: 0.9rem 2.5rem;
  font-family: Inter;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #c9a84c;
  color: #0a0a0a;
}
/* hover: #d4b86a bg, translateY(-2px) */

.btn-outline {
  background: transparent;
  color: #c9a84c;
  border: 1px solid #c9a84c;
}
/* hover: gold bg, black text, translateY(-2px) */
```

---

## 12. BUILD PROCESS

To create a new blog article:

### Step 1: Create data/posts/[slug].json
Full article content following the JSON schema above.

### Step 2: Add entry to data/posts/index.json
Append to the array (newest first — array order = display order).

### Step 3: Create article image
Place SVG at `images/blog/[slug].svg`

### Step 4: Run build
```bash
cd ~/e5-website
node scripts/build-blog.js
```

This will:
1. Bundle JS (esbuild) → `js/blog-bundle.js`
2. Read `data/posts/index.json`
3. For each post: read `data/posts/[slug].json`, generate SSR HTML, fill template, write `blog/[slug]/index.html`

### Template Placeholders Filled by Build
| Placeholder       | Source                                     |
|-------------------|--------------------------------------------|
| `{{TITLE}}`       | `post.title` (HTML-escaped)                |
| `{{EXCERPT}}`     | `post.excerpt` (HTML-escaped)              |
| `{{SLUG}}`        | `post.slug`                                |
| `{{DATE}}`        | `post.date`                                |
| `{{AUTHOR}}`      | `post.author` (HTML-escaped)               |
| `{{IMAGE}}`       | `post.image` or `/images/og-blog.jpg`      |
| `{{OG_TAGS}}`     | Generated `<meta>` tags from `post.tags`   |
| `{{SSR_CONTENT}}` | Full rendered article HTML                 |

---

## 13. SEO / STRUCTURED DATA

Every article page includes:
- `<title>Title | E5 Enclave</title>`
- `<meta name="description">` with excerpt
- Open Graph: og:title, og:description, og:type=article, og:url, og:site_name, og:image, article:published_time, article:author, article:tag (one per tag)
- Twitter Card: summary_large_image
- JSON-LD: BlogPosting schema with headline, description, datePublished, author (Person), publisher (Organization), mainEntityOfPage

### Analytics
Google Tag Manager: `AW-18059035038`

---

## 14. JAVASCRIPT BEHAVIOR

### Blog Index (`js/blog/index.js` + `masonry.js`)
- Detects `#blog-masonry` element → fetches `/data/posts/index.json`
- Initializes Pretext-based masonry layout (virtualized, transforms-based)
- Creates filter buttons from unique categories
- Filter: "All" + each unique category; clicking filters cards via `setCards()`

### Article Page (`js/blog/index.js` + `editorial.js`)
- Detects `#article-content` element → reads `data-slug` attribute
- Fetches `/data/posts/[slug].json`
- Initializes Pretext editorial engine (re-renders article with precise text measurement)
- SSR content is already visible for SEO; JS enhances with proper typographic layout

### Pretext Library
Uses `@chenglou/pretext` for zero-DOM text height prediction. The masonry layout computes all card heights mathematically before rendering. The editorial engine uses `prepareWithSegments`, `layoutWithLines`, `walkLineRanges` for precise text measurement.

---

## 15. EXISTING CATEGORIES

Current categories in use:
- `FarmBlock`
- `Economic`
- `Emancipated`
- `Environmental`

Potential (from pillars): `Educational`, `Equality`

---

## 16. AUTHOR AVATAR GENERATION

The author avatar is generated from initials:
```javascript
post.author.split(' ').map(n => n[0]).join('')
```
Example: "Israel Lee Armstead" → "ILA"

Styled as a 44px gold gradient circle with Playfair Display font, black text.

---

## 17. DATE FORMATTING

Dates are stored as ISO `YYYY-MM-DD` and formatted for display as:
```javascript
new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { 
  month: 'long', day: 'numeric', year: 'numeric' 
})
```
Example: "2026-03-01" → "March 1, 2026"

---

## 18. KEY DESIGN PATTERNS

1. **Gold accent borders**: 1px solid rgba(201,168,76, 0.08-0.25) — ubiquitous
2. **Gradient gold-to-red**: `linear-gradient(180deg, #c9a84c, #8b1a1a)` — pull quote borders
3. **Subtle gold gradients**: `rgba(201,168,76, 0.04-0.06)` tints for backgrounds
4. **Hover lift**: translateY(-4px) with box-shadow for interactive elements
5. **Transition timing**: 0.3s ease for most, 0.35s cubic-bezier(0.25,0.46,0.45,0.94) for cards
6. **Label pattern**: 0.65-0.7rem Inter, 600 weight, 0.3-0.4em letter-spacing, uppercase, gold
7. **Border-top dividers**: 1px solid rgba(201,168,76, 0.06-0.1) to separate sections
8. **Card radius**: 2-3px (very subtle, not rounded)
9. **Content max-width**: 760px for articles, 1200px for containers
10. **Warm white text**: #f5f5f0 (not pure white) for headings, #ccc for body, #999/#888/#666 for meta
