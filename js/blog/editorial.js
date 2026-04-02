/**
 * E5 Enclave Blog — Editorial Article Layout with Pretext
 * 
 * Multi-column text flow with pull quotes, drop caps, and 
 * obstacle avoidance — inspired by Pretext's editorial-engine demo.
 */
import { prepareWithSegments, layoutNextLine, walkLineRanges, layoutWithLines } from '@chenglou/pretext'

// Typography constants
const BODY_FONT = '400 18px "Inter", sans-serif'
const BODY_FONT_BOLD = '700 18px "Inter", sans-serif'
const HEADING_FONT = '700 28px "Playfair Display", Georgia, serif'
const DROPCAP_FONT = '700 72px "Playfair Display", Georgia, serif'
const PULLQUOTE_FONT = '400 22px "Playfair Display", Georgia, serif'
const META_FONT = '500 14px "Inter", sans-serif'
const BODY_LINE_HEIGHT = 30
const HEADING_LINE_HEIGHT = 36
const PULLQUOTE_LINE_HEIGHT = 32
const MIN_SLOT_WIDTH = 40

// Layout state
let articleContainer = null
let articleData = null
let rafId = null
let lastWidth = 0

/**
 * Initialize the editorial layout engine
 */
export function initEditorial(containerEl, post) {
  articleContainer = containerEl
  articleData = post
  
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      renderArticle()
    })
  } else {
    renderArticle()
  }
  
  window.addEventListener('resize', handleResize)
}

/**
 * Render the complete article
 */
function renderArticle() {
  if (!articleContainer || !articleData) return
  
  const width = articleContainer.offsetWidth
  if (width === lastWidth && articleContainer.children.length > 0) return
  lastWidth = width

  // Clear previous render
  articleContainer.innerHTML = ''
  
  const post = articleData
  const contentWidth = Math.min(width, 720) // max content width
  const wideWidth = Math.min(width, 900)    // wide for pull quotes
  
  // Article header
  const header = createHeader(post, contentWidth)
  articleContainer.appendChild(header)
  
  // Article body with editorial layout
  const body = document.createElement('div')
  body.className = 'article-body'
  body.style.position = 'relative'
  
  let yOffset = 0
  let pullQuoteIndex = 0
  const pullQuotes = post.pullQuotes || []
  
  // Track paragraphs for pull quote insertion
  let paragraphCount = 0
  const pullQuoteAfterParagraph = [3, 7] // Insert pull quotes after these paragraph indices
  
  for (const block of post.body) {
    if (block.type === 'dropcap') {
      yOffset = renderDropcapBlock(body, block.text, contentWidth, yOffset)
      paragraphCount++
    } else if (block.type === 'paragraph') {
      yOffset = renderParagraph(body, block.text, contentWidth, yOffset)
      paragraphCount++
      
      // Insert pull quote after specific paragraphs
      if (pullQuoteIndex < pullQuotes.length && 
          pullQuoteAfterParagraph.includes(paragraphCount)) {
        yOffset += 20
        yOffset = renderPullQuote(body, pullQuotes[pullQuoteIndex], wideWidth, contentWidth, yOffset)
        pullQuoteIndex++
      }
    } else if (block.type === 'heading') {
      yOffset += 24 // extra space before heading
      yOffset = renderHeading(body, block.text, contentWidth, yOffset)
    }
    
    yOffset += 8 // inter-block spacing
  }
  
  body.style.height = yOffset + 'px'
  articleContainer.appendChild(body)
}

/**
 * Create the article header
 */
function createHeader(post, width) {
  const header = document.createElement('header')
  header.className = 'article-header'
  
  header.innerHTML = `
    <div class="article-header__category">${post.category}</div>
    <h1 class="article-header__title">${post.title}</h1>
    ${post.subtitle ? `<p class="article-header__subtitle">${post.subtitle}</p>` : ''}
    <div class="article-header__meta">
      <div class="article-header__author">
        <div class="article-header__author-avatar">${post.author.split(' ').map(n => n[0]).join('')}</div>
        <div>
          <div class="article-header__author-name">${post.author}</div>
          <div class="article-header__author-role">${post.authorRole || ''}</div>
        </div>
      </div>
      <div class="article-header__details">
        <time>${formatDate(post.date)}</time>
        <span class="article-header__dot">·</span>
        <span>${post.readTime}</span>
      </div>
    </div>
    <div class="article-header__tags">
      ${post.tags.map(t => `<span class="article-tag">${t.replace(/-/g, ' ')}</span>`).join('')}
    </div>
  `
  
  return header
}

/**
 * Render a paragraph with drop cap using Pretext
 */
function renderDropcapBlock(container, text, width, yOffset) {
  const wrapper = document.createElement('div')
  wrapper.className = 'article-dropcap-block'
  wrapper.style.position = 'relative'
  wrapper.style.top = yOffset + 'px'
  
  if (text.length === 0) {
    container.appendChild(wrapper)
    return yOffset
  }
  
  const firstChar = text[0]
  const restText = text.slice(1)
  
  // Measure drop cap
  const dropCapPrepared = prepareWithSegments(firstChar, DROPCAP_FONT)
  let dropCapWidth = 0
  walkLineRanges(dropCapPrepared, 200, (line) => {
    dropCapWidth = Math.max(dropCapWidth, line.usedWidth)
  })
  dropCapWidth += 12 // padding right
  const dropCapHeight = 72 * 2.5 // ~3 lines tall
  
  // Create drop cap element
  const dropCapEl = document.createElement('span')
  dropCapEl.className = 'article-dropcap'
  dropCapEl.textContent = firstChar
  dropCapEl.style.cssText = `
    float: left;
    font: ${DROPCAP_FONT};
    color: #c9a84c;
    line-height: 0.85;
    padding-right: 12px;
    padding-top: 4px;
  `
  wrapper.appendChild(dropCapEl)
  
  // Render rest of text normally (float handles the wrapping)
  const textEl = document.createElement('p')
  textEl.className = 'article-paragraph'
  textEl.textContent = restText
  wrapper.appendChild(textEl)
  
  // Clear the float
  const clearEl = document.createElement('div')
  clearEl.style.clear = 'both'
  wrapper.appendChild(clearEl)
  
  container.appendChild(wrapper)
  
  // Estimate height 
  const prepared = prepareWithSegments(restText, BODY_FONT)
  const result = layoutWithLines(prepared, width, BODY_LINE_HEIGHT)
  const textHeight = Math.max(result.height, dropCapHeight)
  
  return yOffset + textHeight + 8
}

/**
 * Render a standard paragraph
 */
function renderParagraph(container, text, width, yOffset) {
  const el = document.createElement('p')
  el.className = 'article-paragraph'
  el.textContent = text
  el.style.position = 'relative'
  el.style.top = yOffset + 'px'
  container.appendChild(el)
  
  // Measure with Pretext for accurate height
  const prepared = prepareWithSegments(text, BODY_FONT)
  const result = layoutWithLines(prepared, width, BODY_LINE_HEIGHT)
  
  return yOffset + result.height + 8
}

/**
 * Render a section heading
 */
function renderHeading(container, text, width, yOffset) {
  const el = document.createElement('h2')
  el.className = 'article-heading'
  el.textContent = text
  el.style.position = 'relative'
  el.style.top = yOffset + 'px'
  container.appendChild(el)
  
  const prepared = prepareWithSegments(text, HEADING_FONT)
  const result = layoutWithLines(prepared, width, HEADING_LINE_HEIGHT)
  
  return yOffset + result.height + 12
}

/**
 * Render a pull quote with gold accent
 */
function renderPullQuote(container, text, wideWidth, contentWidth, yOffset) {
  const el = document.createElement('blockquote')
  el.className = 'article-pullquote'
  el.style.position = 'relative'
  el.style.top = yOffset + 'px'
  
  el.innerHTML = `
    <div class="article-pullquote__border"></div>
    <p class="article-pullquote__text">${text}</p>
  `
  
  container.appendChild(el)
  
  // Measure with Pretext
  const prepared = prepareWithSegments(text, PULLQUOTE_FONT)
  const quoteWidth = Math.min(wideWidth, contentWidth) - 40 // account for border + padding
  const result = layoutWithLines(prepared, quoteWidth, PULLQUOTE_LINE_HEIGHT)
  
  return yOffset + result.height + 56 // padding top + bottom
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function handleResize() {
  lastWidth = 0
  if (rafId) cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(renderArticle)
}

export function destroy() {
  window.removeEventListener('resize', handleResize)
  if (rafId) cancelAnimationFrame(rafId)
}
