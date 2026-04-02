/**
 * E5 Enclave Blog — Entry Point
 * 
 * Detects whether we're on the blog index or an article page
 * and initializes the appropriate layout engine.
 */
import { initMasonry, setCards, destroy as destroyMasonry } from './masonry.js'
import { initEditorial, destroy as destroyEditorial } from './editorial.js'

// Detect page type from DOM
const masonryContainer = document.getElementById('blog-masonry')
const articleContainer = document.getElementById('article-content')

if (masonryContainer) {
  // Blog index page — load post index and init masonry
  initMasonry(masonryContainer)
  
  fetch('/data/posts/index.json')
    .then(r => r.json())
    .then(posts => {
      setCards(posts)
      
      // Also set up filter controls
      initFilters(posts)
    })
    .catch(err => {
      console.error('Failed to load blog posts:', err)
      masonryContainer.innerHTML = '<p class="blog-error">Unable to load posts. Please try again later.</p>'
    })
}

if (articleContainer) {
  // Article page — load post data and init editorial engine
  const slug = articleContainer.dataset.slug
  
  if (slug) {
    fetch(`/data/posts/${slug}.json`)
      .then(r => r.json())
      .then(post => {
        initEditorial(articleContainer, post)
      })
      .catch(err => {
        console.error('Failed to load article:', err)
        articleContainer.innerHTML = '<p class="blog-error">Unable to load article. Please try again later.</p>'
      })
  }
}

/**
 * Initialize category filter buttons
 */
function initFilters(posts) {
  const filterContainer = document.getElementById('blog-filters')
  if (!filterContainer) return
  
  // Extract unique categories
  const categories = [...new Set(posts.map(p => p.category))]
  
  filterContainer.innerHTML = `
    <button class="blog-filter active" data-category="all">All</button>
    ${categories.map(cat => 
      `<button class="blog-filter" data-category="${cat}">${cat}</button>`
    ).join('')}
  `
  
  filterContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.blog-filter')
    if (!btn) return
    
    // Update active state
    filterContainer.querySelectorAll('.blog-filter').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    
    const category = btn.dataset.category
    const filtered = category === 'all' ? posts : posts.filter(p => p.category === category)
    setCards(filtered)
  })
}
