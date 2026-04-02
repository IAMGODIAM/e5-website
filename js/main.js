// ============================================
// E5 ENCLAVE INCORPORATED — Main JS
// ============================================

document.addEventListener('DOMContentLoaded', () => {

    // --- Navbar scroll effect ---
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        if (currentScroll > 80) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        lastScroll = currentScroll;
    });

    // --- Mobile menu toggle ---
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });

    // Close menu on link click
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });

    // --- Smooth scroll for anchor links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offset = navbar.offsetHeight + 20;
                const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });

    // --- Intersection Observer for fade-in animations ---
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                fadeObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Add fade-in to key elements
    const fadeElements = document.querySelectorAll(
        '.pillar-card, .program-card, .impact-card, .tier-card, .vision-card, .about-main, .farmblock-text, .founder-text, .contact-info, .contact-form-wrapper, .donate-leviathan'
    );

    fadeElements.forEach((el, i) => {
        el.classList.add('fade-in');
        el.style.transitionDelay = `${(i % 6) * 0.1}s`;
        fadeObserver.observe(el);
    });

    // --- Counter animation for impact numbers ---
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counters = entry.target.querySelectorAll('.impact-number[data-target]');
                counters.forEach(counter => {
                    animateCounter(counter);
                });
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    const impactSection = document.querySelector('.impact-grid');
    if (impactSection) {
        counterObserver.observe(impactSection);
    }

    function animateCounter(el) {
        const target = parseInt(el.dataset.target);
        const duration = 2000;
        el.textContent = '0'; // Reset to 0 before animating
        const start = performance.now();

        function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(eased * target);
            el.textContent = current >= 1000 ? current.toLocaleString() : current;

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                el.textContent = target >= 1000 ? target.toLocaleString() : target;
            }
        }

        requestAnimationFrame(update);
    }

    // --- Active nav link highlighting ---
    const sections = document.querySelectorAll('section[id]');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            if (window.pageYOffset >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        navMenu.querySelectorAll('a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    });

    // --- Contact form handler ---
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const data = Object.fromEntries(formData);

            // Simple validation
            if (!data.name || !data.email || !data.message) {
                alert('Please fill in all required fields.');
                return;
            }

            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    // Show success state
                    submitBtn.textContent = '✓ Message Sent';
                    submitBtn.classList.add('btn-success');
                    this.reset();
                    setTimeout(() => {
                        submitBtn.textContent = originalText;
                        submitBtn.classList.remove('btn-success');
                        submitBtn.disabled = false;
                    }, 3000);
                } else {
                    throw new Error(result.error || 'Failed to send message');
                }
            } catch (err) {
                // Fallback to mailto
                const subject = encodeURIComponent(data.subject || 'Website Inquiry');
                const body = encodeURIComponent(
                    `Name: ${data.name}\nEmail: ${data.email}\n\n${data.message}`
                );
                window.location.href = `mailto:hermes@e5enclave.com?subject=${subject}&body=${body}`;
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

});
