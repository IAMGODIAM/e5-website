(function() {
  'use strict';

  // ── Slide data ──────────────────────────────────────────────
  const slides = Array.from(document.querySelectorAll('#ajSwiper .swiper-slide'));
  const totalSlides = slides.length;

  // ── Swiper init ─────────────────────────────────────────────
  const swiper = new Swiper('#ajSwiper', {
    slidesPerView: 'auto',
    spaceBetween: 18,
    centeredSlides: true,
    loop: true,
    grabCursor: true,
    keyboard: { enabled: true },
    a11y: {
      prevSlideMessage: 'Previous photo',
      nextSlideMessage: 'Next photo',
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    breakpoints: {
      0:   { spaceBetween: 10 },
      640: { spaceBetween: 18 },
    },
    on: {
      slideChange: updateCounter,
      init: updateCounter,
    },
  });

  // Counter
  const counterEl = document.getElementById('slideCounter');
  function updateCounter() {
    const real = swiper.realIndex + 1;
    counterEl.textContent = real + ' / ' + totalSlides;
  }

  // Custom nav buttons
  document.getElementById('ajPrev').addEventListener('click', () => swiper.slidePrev());
  document.getElementById('ajNext').addEventListener('click', () => swiper.slideNext());

  // ── Lightbox ────────────────────────────────────────────────
  const lb        = document.getElementById('aj-lightbox');
  const lbImg     = document.getElementById('lbImg');
  const lbCaption = document.getElementById('lbCaption');
  const lbCounter = document.getElementById('lbCounter');
  const lbClose   = document.getElementById('lbClose');
  const lbPrev    = document.getElementById('lbPrev');
  const lbNext    = document.getElementById('lbNext');

  let lbIndex = 0;

  // Build flat array of real (non-duplicate) slide data
  // Swiper loop duplicates slides; use original slides array for data
  const originalSlides = document.querySelectorAll('#ajSwiper .swiper-slide:not(.swiper-slide-duplicate)');
  const photoData = Array.from(originalSlides).map(s => ({
    img: s.dataset.img,
    cap: s.dataset.cap || '',
    alt: s.querySelector('img')?.alt || '',
  }));

  function openLightbox(index) {
    lbIndex = ((index % photoData.length) + photoData.length) % photoData.length;
    renderLightbox();
    lb.classList.add('open');
    lb.focus();
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }

  function renderLightbox() {
    const d = photoData[lbIndex];
    // Use View Transitions API if available
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        lbImg.src = d.img;
        lbImg.alt = d.alt;
        lbCaption.innerHTML = d.cap;
        lbCounter.textContent = (lbIndex + 1) + ' / ' + photoData.length;
      });
    } else {
      lbImg.src = d.img;
      lbImg.alt = d.alt;
      lbCaption.innerHTML = d.cap;
      lbCounter.textContent = (lbIndex + 1) + ' / ' + photoData.length;
    }
  }

  // Open on slide click or Enter key
  slides.forEach((slide, i) => {
    slide.addEventListener('click', () => {
      // Map loop slide index back to real index
      openLightbox(swiper.realIndex);
    });
    slide.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(swiper.realIndex); }
    });
  });

  lbClose.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', () => { lbIndex = (lbIndex - 1 + photoData.length) % photoData.length; renderLightbox(); });
  lbNext.addEventListener('click', () => { lbIndex = (lbIndex + 1) % photoData.length; renderLightbox(); });

  // Keyboard nav in lightbox
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft')  { lbIndex = (lbIndex - 1 + photoData.length) % photoData.length; renderLightbox(); }
    if (e.key === 'ArrowRight') { lbIndex = (lbIndex + 1) % photoData.length; renderLightbox(); }
  });

  // Click backdrop to close
  lb.addEventListener('click', (e) => {
    if (e.target === lb) closeLightbox();
  });

  // ── Touch swipe in lightbox ─────────────────────────────────
  let touchStartX = 0;
  lb.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].screenX - touchStartX;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) { lbIndex = (lbIndex + 1) % photoData.length; }
    else        { lbIndex = (lbIndex - 1 + photoData.length) % photoData.length; }
    renderLightbox();
  }, { passive: true });

})();