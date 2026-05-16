// Lightweight form poster used by /contact/ and /coalition/apply/.
// Posts to /api/contact (Netlify Function via redirect in netlify.toml). Falls back to a mailto: link
// when the function is unavailable.
(function () {
  var forms = document.querySelectorAll('[data-vc-form]');
  if (!forms.length) return;
  forms.forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var payload = {};
      fd.forEach(function (v, k) { payload[k] = v; });
      payload.subject = form.dataset.subject || 'website-contact';
      var endpoint = form.dataset.endpoint || '/api/contact';
      var btn = form.querySelector('button[type="submit"]');
      var success = form.parentElement.querySelector('.vc-form-success');
      if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function (r) {
          if (!r.ok) throw new Error('Network error');
          return r.json().catch(function () { return {}; });
        })
        .then(function () {
          if (success) success.classList.add('show');
          form.reset();
        })
        .catch(function () {
          if (success) {
            success.classList.add('show');
            success.innerHTML = 'Could not reach the relay. Please email <a href="mailto:contact@e5enclave.com">contact@e5enclave.com</a> directly — we will respond promptly.';
          }
        })
        .finally(function () {
          if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || 'Send'; }
        });
    });
  });
})();
