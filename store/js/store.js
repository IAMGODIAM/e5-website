/**
 * BLACK DRAGON COLLECTION — Store Logic
 * E5 Enclave — e5enclave.com/store
 */

(function () {
  'use strict';

  /* ========================
     PRODUCT DATA
     ======================== */
  const PRODUCTS = [
    {
      id: 'bd-tee-001',
      name: 'Black Dragon Tee',
      price: 35.00,
      category: 'apparel',
      badge: 'new',
      image: '/images/store/black-dragon-tee.webp',
      description: 'Premium heavyweight cotton tee with photorealistic dragon print. Oversized streetwear fit.',
      url: '/store',
      weight: 250,
      sizes: ['S', 'M', 'L', 'XL', 'XXL']
    },
    {
      id: 'bd-hoodie-001',
      name: 'Premium Hoodie',
      price: 65.00,
      category: 'apparel',
      badge: 'limited',
      image: '/images/store/premium-hoodie.webp',
      description: 'Heavyweight fleece hoodie with embroidered dragon crest. Brushed interior, drop shoulders.',
      url: '/store',
      weight: 600,
      sizes: ['S', 'M', 'L', 'XL', 'XXL']
    },
    {
      id: 'bd-hat-001',
      name: 'Dad Hat',
      price: 32.00,
      category: 'accessories',
      badge: null,
      image: '/images/store/dad-hat.webp',
      description: 'Unstructured cotton twill cap with gold-thread dragon emblem. Adjustable brass buckle.',
      url: '/store',
      weight: 100,
      sizes: null
    },
    {
      id: 'bd-poster-001',
      name: 'Poster 18x24',
      price: 25.00,
      category: 'art-prints',
      badge: null,
      image: '/images/store/poster-18x24.webp',
      description: 'Museum-quality giclée poster on 200gsm matte paper. Photorealistic Black Dragon artwork.',
      url: '/store',
      weight: 150,
      sizes: null
    },
    {
      id: 'bd-mug-001',
      name: 'Ceramic Mug',
      price: 18.00,
      category: 'accessories',
      badge: null,
      image: '/images/store/ceramic-mug.webp',
      description: '11oz ceramic mug with wraparound dragon illustration. Dishwasher and microwave safe.',
      url: '/store',
      weight: 350,
      sizes: null
    },
    {
      id: 'bd-case-001',
      name: 'Phone Case',
      price: 25.00,
      category: 'accessories',
      badge: 'new',
      image: '/images/store/phone-case.webp',
      description: 'Impact-resistant snap case with edge-to-edge dragon design. Available for major models.',
      url: '/store',
      weight: 50,
      sizes: null
    },
    {
      id: 'bd-sticker-001',
      name: 'Sticker Pack',
      price: 5.00,
      category: 'accessories',
      badge: null,
      image: '/images/store/sticker-pack.webp',
      description: 'Set of 6 die-cut vinyl stickers. Waterproof, UV-resistant. Dragon collection series.',
      url: '/store',
      weight: 20,
      sizes: null
    },
    {
      id: 'bd-tote-001',
      name: 'Tote Bag',
      price: 25.00,
      category: 'accessories',
      badge: null,
      image: '/images/store/tote-bag.webp',
      description: 'Heavy-duty canvas tote with reinforced stitching. All-over dragon print both sides.',
      url: '/store',
      weight: 300,
      sizes: null
    },
    {
      id: 'bd-ebook-001',
      name: 'BDI eBook',
      price: 12.99,
      category: 'digital',
      badge: 'digital',
      image: '/images/store/bdi-ebook.webp',
      description: 'The Black Dragon Initiative — digital handbook. Instant PDF download after purchase.',
      url: '/store',
      weight: 0,
      sizes: null
    },
    {
      id: 'bd-artpack-001',
      name: 'Dragon Art Print Pack',
      price: 9.99,
      category: 'digital',
      badge: 'digital',
      image: '/images/store/dragon-art-pack.webp',
      description: 'Digital art collection — 10 high-res dragon illustrations. 4K resolution, print-ready files.',
      url: '/store',
      weight: 0,
      sizes: null
    }
  ];

  /* ========================
     DOM REFERENCES
     ======================== */
  const productGrid = document.getElementById('product-grid');
  const filterTabs = document.querySelectorAll('.filter-tab');
  const productCount = document.getElementById('product-count');
  const heroCtaBtn = document.getElementById('hero-cta');

  /* ========================
     RENDER PRODUCTS
     ======================== */
  function createProductCard(product) {
    const card = document.createElement('article');
    card.className = 'product-card fade-in';
    card.setAttribute('data-category', product.category);

    // Badge HTML
    let badgeHTML = '';
    if (product.badge) {
      const badgeClass = `product-card__badge product-card__badge--${product.badge}`;
      const badgeLabel = product.badge === 'new' ? 'New' : product.badge === 'limited' ? 'Limited' : 'Digital';
      badgeHTML = `<span class="${badgeClass}">${badgeLabel}</span>`;
    }

    // Size custom field for Snipcart
    let sizeAttr = '';
    if (product.sizes) {
      sizeAttr = `
        data-item-custom1-name="Size"
        data-item-custom1-options="${product.sizes.join('|')}"
        data-item-custom1-required="true"`;
    }

    // Digital flag
    let digitalAttr = product.weight === 0 ? 'data-item-shippable="false" data-item-file-guid=""' : '';

    card.innerHTML = `
      ${badgeHTML}
      <div class="product-card__image-wrap">
        <img
          class="product-card__image"
          src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23141414'/%3E%3Ctext x='50%25' y='48%25' font-family='sans-serif' font-size='40' fill='%23c9a84c' text-anchor='middle' dominant-baseline='central' opacity='0.15'%3E%F0%9F%90%89%3C/text%3E%3Ctext x='50%25' y='58%25' font-family='sans-serif' font-size='11' fill='%23666' text-anchor='middle'%3E${product.name}%3C/text%3E%3C/svg%3E"
          data-src="${product.image}"
          alt="${product.name} — Black Dragon Collection"
          loading="lazy"
          width="400"
          height="400"
        />
        <div class="product-card__image-overlay"></div>
        <div class="product-card__quick-add">
          <button
            class="btn-add-cart snipcart-add-item"
            data-item-id="${product.id}"
            data-item-name="${product.name}"
            data-item-price="${product.price.toFixed(2)}"
            data-item-url="${product.url}"
            data-item-image="${product.image}"
            data-item-description="${product.description}"
            data-item-weight="${product.weight}"
            ${sizeAttr}
            ${digitalAttr}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            Add to Cart
          </button>
        </div>
      </div>
      <div class="product-card__info">
        <p class="product-card__category">${formatCategory(product.category)}</p>
        <h3 class="product-card__name">${product.name}</h3>
        <p class="product-card__desc">${product.description}</p>
        <div class="product-card__footer">
          <span class="product-card__price">$${product.price.toFixed(2)}${product.weight === 0 ? '<small>digital</small>' : ''}</span>
        </div>
      </div>
    `;

    return card;
  }

  function formatCategory(cat) {
    const map = {
      'apparel': 'Apparel',
      'accessories': 'Accessories',
      'art-prints': 'Art & Prints',
      'digital': 'Digital'
    };
    return map[cat] || cat;
  }

  function renderProducts(filter = 'all') {
    productGrid.innerHTML = '';

    const filtered = filter === 'all'
      ? PRODUCTS
      : PRODUCTS.filter(p => p.category === filter);

    if (filtered.length === 0) {
      productGrid.innerHTML = `
        <div class="no-results">
          <div class="no-results__icon">🐉</div>
          <p class="no-results__text">No items found in this category.</p>
        </div>
      `;
    } else {
      filtered.forEach((product, index) => {
        const card = createProductCard(product);
        card.style.transitionDelay = `${index * 0.06}s`;
        productGrid.appendChild(card);
      });
    }

    // Update count
    if (productCount) {
      productCount.textContent = `${filtered.length} item${filtered.length !== 1 ? 's' : ''}`;
    }

    // Trigger fade-in animations
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.querySelectorAll('.product-card.fade-in').forEach(el => {
          el.classList.add('visible');
        });
      });
    });
  }

  /* ========================
     FILTER LOGIC
     ======================== */
  filterTabs.forEach(tab => {
    tab.addEventListener('click', function () {
      // Update active state
      filterTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');

      // Render filtered products
      const filter = this.getAttribute('data-filter');
      renderProducts(filter);

      // Update URL hash without scroll
      history.replaceState(null, '', filter === 'all' ? '/store' : `/store#${filter}`);
    });
  });

  /* ========================
     SMOOTH SCROLL TO PRODUCTS
     ======================== */
  if (heroCtaBtn) {
    heroCtaBtn.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.getElementById('collection');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  /* ========================
     INTERSECTION OBSERVER — Fade In
     ======================== */
  function initObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    document.querySelectorAll('.fade-in').forEach(el => {
      observer.observe(el);
    });
  }

  /* ========================
     HASH-BASED FILTER ON LOAD
     ======================== */
  function initFromHash() {
    const hash = window.location.hash.replace('#', '');
    const validFilters = ['apparel', 'accessories', 'art-prints', 'digital'];

    if (hash && validFilters.includes(hash)) {
      filterTabs.forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-filter') === hash);
      });
      renderProducts(hash);
    } else {
      renderProducts('all');
    }
  }

  /* ========================
     JSON-LD SCHEMA INJECTION
     ======================== */
  function injectProductSchema() {
    const schemaItems = PRODUCTS.map(product => ({
      '@type': 'Product',
      'name': product.name,
      'description': product.description,
      'image': `https://e5enclave.com${product.image}`,
      'sku': product.id,
      'brand': {
        '@type': 'Brand',
        'name': 'Black Dragon Collection'
      },
      'offers': {
        '@type': 'Offer',
        'url': `https://e5enclave.com/store#${product.category}`,
        'priceCurrency': 'USD',
        'price': product.price.toFixed(2),
        'availability': 'https://schema.org/InStock',
        'seller': {
          '@type': 'Organization',
          'name': 'E5 Enclave'
        }
      }
    }));

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': 'Black Dragon Collection — E5 Enclave Merch Store',
      'description': 'Premium streetwear and accessories featuring photorealistic black dragon artwork with gold accents.',
      'numberOfItems': schemaItems.length,
      'itemListElement': schemaItems.map((item, i) => ({
        '@type': 'ListItem',
        'position': i + 1,
        'item': item
      }))
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  /* ========================
     SNIPCART CART COUNT
     ======================== */
  function initSnipcartBindings() {
    // Listen for Snipcart ready event to update cart count badge
    if (typeof window.Snipcart !== 'undefined') {
      window.Snipcart.store.subscribe(() => {
        try {
          const count = window.Snipcart.store.getState().cart.items.count;
          const badge = document.querySelector('.cart-btn__count');
          if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
          }
        } catch (e) {
          // Snipcart not fully loaded yet
        }
      });
    }
  }

  // Listen for Snipcart script load
  document.addEventListener('snipcart.ready', initSnipcartBindings);

  /* ========================
     INIT
     ======================== */
  function init() {
    initFromHash();
    initObserver();
    injectProductSchema();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
