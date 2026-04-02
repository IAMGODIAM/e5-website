#!/usr/bin/env node
/**
 * E5 Enclave Blog Build Script
 * 
 * 1. Bundles JS with Pretext via esbuild
 * 2. Generates static HTML per blog post (SEO-optimized)
 */
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const POSTS_DIR = path.join(ROOT, 'data', 'posts')
const BLOG_DIR = path.join(ROOT, 'blog')
const TEMPLATE = path.join(BLOG_DIR, 'post.html')

console.log('=== E5 Enclave Blog Build ===\n')

// Step 1: Bundle JS with esbuild
console.log('1. Bundling JS with Pretext...')
try {
  execSync(`npx esbuild js/blog/index.js --bundle --outfile=js/blog-bundle.js --format=iife --target=es2020 --minify`, {
    cwd: ROOT,
    stdio: 'inherit'
  })
  console.log('   ✓ blog-bundle.js created\n')
} catch (err) {
  console.error('   ✗ Bundle failed:', err.message)
  process.exit(1)
}

// Step 2: Load post index
console.log('2. Loading post data...')
const indexPath = path.join(POSTS_DIR, 'index.json')
const posts = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
console.log(`   ✓ Found ${posts.length} posts\n`)

// Step 3: Load template
console.log('3. Loading article template...')
const template = fs.readFileSync(TEMPLATE, 'utf8')
console.log('   ✓ Template loaded\n')

// Step 4: Generate static pages
console.log('4. Generating static article pages...')
for (const post of posts) {
  // Load full post data
  const postPath = path.join(POSTS_DIR, `${post.slug}.json`)
  let fullPost
  try {
    fullPost = JSON.parse(fs.readFileSync(postPath, 'utf8'))
  } catch (err) {
    console.log(`   ⚠ Skipping ${post.slug}: no data file`)
    continue
  }
  
  // Generate SSR content (plain text fallback for crawlers)
  const ssrContent = generateSSRContent(fullPost)
  
  // Generate OG tags for article tags
  const ogTags = (post.tags || [])
    .map(tag => `<meta property="article:tag" content="${escapeHtml(tag.replace(/-/g, ' '))}">`)
    .join('\n  ')
  
  // Fill template
  let html = template
    .replace(/\{\{TITLE\}\}/g, escapeHtml(post.title))
    .replace(/\{\{EXCERPT\}\}/g, escapeHtml(post.excerpt))
    .replace(/\{\{SLUG\}\}/g, post.slug)
    .replace(/\{\{DATE\}\}/g, post.date)
    .replace(/\{\{AUTHOR\}\}/g, escapeHtml(post.author))
    .replace(/\{\{IMAGE\}\}/g, post.image || '/images/og-blog.jpg')
    .replace(/\{\{OG_TAGS\}\}/g, ogTags)
    .replace(/\{\{SSR_CONTENT\}\}/g, ssrContent)
  
  // Write to blog/[slug]/index.html for clean URLs
  const outDir = path.join(BLOG_DIR, post.slug)
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'index.html'), html)
  console.log(`   ✓ /blog/${post.slug}/`)
}

console.log('\n=== Build complete ===')

// --- Helpers ---

function generateSSRContent(post) {
  let html = ''
  
  // Header (baked into SSR for SEO)
  html += `<header class="article-header">
    <div class="article-header__category">${escapeHtml(post.category)}</div>
    <h1 class="article-header__title">${escapeHtml(post.title)}</h1>
    ${post.subtitle ? `<p class="article-header__subtitle">${escapeHtml(post.subtitle)}</p>` : ''}
    <div class="article-header__meta">
      <div class="article-header__author">
        <div class="article-header__author-avatar">${post.author.split(' ').map(n => n[0]).join('')}</div>
        <div>
          <div class="article-header__author-name">${escapeHtml(post.author)}</div>
          ${post.authorRole ? `<div class="article-header__author-role">${escapeHtml(post.authorRole)}</div>` : ''}
        </div>
      </div>
      <div class="article-header__details">
        <time datetime="${post.date}">${formatDate(post.date)}</time>
        <span class="article-header__dot">·</span>
        <span>${post.readTime}</span>
      </div>
    </div>
    <div class="article-header__tags">
      ${(post.tags || []).map(t => `<span class="article-tag">${escapeHtml(t.replace(/-/g, ' '))}</span>`).join('')}
    </div>
  </header>\n`
  
  // Body
  html += '<div class="article-body">\n'
  
  let paragraphCount = 0
  let pullQuoteIndex = 0
  const pullQuotes = post.pullQuotes || []
  const pullQuoteAfterParagraph = [3, 7]
  
  for (const block of post.body) {
    if (block.type === 'dropcap') {
      const firstChar = block.text[0]
      const rest = block.text.slice(1)
      html += `<div class="article-dropcap-block">
        <span class="article-dropcap">${escapeHtml(firstChar)}</span>
        <p class="article-paragraph">${escapeHtml(rest)}</p>
        <div style="clear:both"></div>
      </div>\n`
      paragraphCount++
    } else if (block.type === 'paragraph') {
      html += `<p class="article-paragraph">${escapeHtml(block.text)}</p>\n`
      paragraphCount++
      
      if (pullQuoteIndex < pullQuotes.length && pullQuoteAfterParagraph.includes(paragraphCount)) {
        html += `<blockquote class="article-pullquote">
          <div class="article-pullquote__border"></div>
          <p class="article-pullquote__text">${escapeHtml(pullQuotes[pullQuoteIndex])}</p>
        </blockquote>\n`
        pullQuoteIndex++
      }
    } else if (block.type === 'heading') {
      html += `<h2 class="article-heading">${escapeHtml(block.text)}</h2>\n`
    }
  }
  
  html += '</div>\n'
  
  return html
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}
