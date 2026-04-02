/**
 * E5 Enclave Blog — Masonry Layout with Pretext
 * 
 * Uses @chenglou/pretext for zero-DOM text height prediction.
 * Cards are positioned via pure arithmetic, no layout thrashing.
 */
import { prepare, layout } from '@chenglou/pretext'

const CARD_PADDING = 32
const CARD_GAP = 24
const TITLE_LINE_HEIGHT = 30
const EXCERPT_LINE_HEIGHT = 24
const META_HEIGHT = 44  // date + read time row
const TAGS_HEIGHT = 36  // tag pills row
const CATEGORY_HEIGHT = 28  // category label
const IMAGE_RATIO = 0.56  // 16:9 aspect ratio for card images
const CARD_BOTTOM_PADDING = 24
const MIN_COL_WIDTH = 340
const MAX_COL_WIDTH = 420
const BUFFER = 300 // virtualization buffer in px

// Card state
let cards = []
let columnCount = 0
let containerWidth = 0
let contentHeight = 0
let cardElements = new Map()
let container = null
let scrollContainer = null
let fontsReady = false

/**
 * Initialize the masonry layout
 */
export function initMasonry(containerEl) {
  container = containerEl
  scrollContainer = window

  // Wait for fonts to load before measuring
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      fontsReady = true
      if (cards.length > 0) scheduleRender()
    })
  } else {
    fontsReady = true
  }

  window.addEventListener('resize', handleResize)
  window.addEventListener('scroll', scheduleRender, { passive: true })
}

/**
 * Set the blog post data and prepare text measurements
 */
export function setCards(posts) {
  cards = posts.map(post => {
    // Prepare text for measurement (one-time cost)
    const titlePrepared = prepare(post.title, '700 22px "Playfair Display", Georgia, serif')
    const excerptPrepared = prepare(post.excerpt, '400 15px "Inter", sans-serif')
    return {
      post,
      titlePrepared,
      excerptPrepared,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    }
  })
  computeLayout()
  scheduleRender()
}

/**
 * Compute the full masonry layout — pure arithmetic, zero DOM reads
 */
function computeLayout() {
  if (!container || cards.length === 0) return

  containerWidth = container.offsetWidth
  columnCount = Math.max(1, Math.min(3, Math.floor((containerWidth + CARD_GAP) / (MIN_COL_WIDTH + CARD_GAP))))
  const colWidth = (containerWidth - (columnCount - 1) * CARD_GAP) / columnCount
  const textWidth = colWidth - CARD_PADDING * 2

  // Column height trackers
  const colHeights = new Float64Array(columnCount)

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i]
    
    // Find shortest column
    let minCol = 0
    for (let c = 1; c < columnCount; c++) {
      if (colHeights[c] < colHeights[minCol]) minCol = c
    }

    // Compute card height with Pretext — pure math
    const imageHeight = card.post.image ? Math.round(colWidth * IMAGE_RATIO) : 0
    
    const titleResult = layout(card.titlePrepared, textWidth, TITLE_LINE_HEIGHT)
    const excerptResult = layout(card.excerptPrepared, textWidth, EXCERPT_LINE_HEIGHT)

    const totalHeight = imageHeight 
      + CARD_PADDING 
      + CATEGORY_HEIGHT 
      + titleResult.height 
      + 12 // gap between title and excerpt
      + excerptResult.height 
      + 16 // gap between excerpt and meta
      + META_HEIGHT 
      + TAGS_HEIGHT
      + CARD_BOTTOM_PADDING

    // Position the card
    card.x = minCol * (colWidth + CARD_GAP)
    card.y = colHeights[minCol]
    card.width = colWidth
    card.height = totalHeight

    colHeights[minCol] += totalHeight + CARD_GAP
  }

  // Content height is the max column height
  contentHeight = 0
  for (let c = 0; c < columnCount; c++) {
    if (colHeights[c] > contentHeight) contentHeight = colHeights[c]
  }
  
  container.style.height = contentHeight + 'px'
  container.style.position = 'relative'
}

/**
 * Render only visible cards (virtualized)
 */
let rafId = null
function scheduleRender() {
  if (rafId) return
  rafId = requestAnimationFrame(render)
}

function render() {
  rafId = null
  if (!container || cards.length === 0 || !fontsReady) return

  const scrollTop = window.scrollY || document.documentElement.scrollTop
  const viewportHeight = window.innerHeight
  const containerRect = container.getBoundingClientRect()
  const containerTop = scrollTop + containerRect.top

  const viewStart = scrollTop - containerTop - BUFFER
  const viewEnd = scrollTop - containerTop + viewportHeight + BUFFER

  // Show/hide cards based on visibility
  const visible = new Set()

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i]
    const cardTop = card.y
    const cardBottom = card.y + card.height

    if (cardBottom >= viewStart && cardTop <= viewEnd) {
      visible.add(i)
      let el = cardElements.get(i)
      if (!el) {
        el = createCardElement(card, i)
        cardElements.set(i, el)
        container.appendChild(el)
      }
      // Position via transform (no reflow)
      el.style.transform = `translate(${card.x}px, ${card.y}px)`
      el.style.width = card.width + 'px'
    }
  }

  // Remove cards that scrolled out of view
  for (const [idx, el] of cardElements) {
    if (!visible.has(idx)) {
      el.remove()
      cardElements.delete(idx)
    }
  }
}

/**
 * Create a card DOM element
 */
function createCardElement(card, index) {
  const post = card.post
  const el = document.createElement('a')
  el.href = `/blog/${post.slug}`
  el.className = `blog-card${post.featured ? ' blog-card--featured' : ''}`
  el.style.position = 'absolute'
  el.style.top = '0'
  el.style.left = '0'
  el.style.willChange = 'transform'

  const imageHtml = post.image 
    ? `<div class="blog-card__image" style="background-image:url(${post.image});padding-bottom:${IMAGE_RATIO * 100}%"></div>` 
    : ''
  
  const tagsHtml = post.tags.slice(0, 3).map(tag => 
    `<span class="blog-card__tag">${tag.replace(/-/g, ' ')}</span>`
  ).join('')

  el.innerHTML = `
    ${imageHtml}
    <div class="blog-card__body">
      <span class="blog-card__category">${post.category}</span>
      <h3 class="blog-card__title">${post.title}</h3>
      <p class="blog-card__excerpt">${post.excerpt}</p>
      <div class="blog-card__meta">
        <time>${formatDate(post.date)}</time>
        <span>${post.readTime}</span>
      </div>
      <div class="blog-card__tags">${tagsHtml}</div>
    </div>
  `
  
  return el
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function handleResize() {
  computeLayout()
  // Reposition all visible cards
  for (const [idx, el] of cardElements) {
    const card = cards[idx]
    el.style.transform = `translate(${card.x}px, ${card.y}px)`
    el.style.width = card.width + 'px'
  }
  scheduleRender()
}

export function destroy() {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('scroll', scheduleRender)
  if (rafId) cancelAnimationFrame(rafId)
  cardElements.clear()
}
