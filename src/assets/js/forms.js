// E5 Form Protocol — Global Form Handler
// Routes vc-form subjects to correct E5FP backend functions
// DAG: e5fp-forms-js-2026-0524
(function () {
  var ENDPOINTS = {
    "website-contact":   "https://sue-45c3e283.base44.app/functions/contactForm",
    "coalition-apply":   "https://sue-45c3e283.base44.app/functions/contactForm",
    "newsletter-signup": "https://sue-45c3e283.base44.app/functions/contactForm",
  };

  var forms = document.querySelectorAll("[data-vc-form]");
  if (!forms.length) return;

  forms.forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var payload = {};
      fd.forEach(function (v, k) { payload[k] = v; });
      payload.subject = form.dataset.subject || "website-contact";

      var subject  = payload.subject;
      var endpoint = ENDPOINTS[subject] || ENDPOINTS["website-contact"];

      var btn     = form.querySelector("button[type="submit"]");
      var success = form.parentElement ? form.parentElement.querySelector(".vc-form-success") : null;

      if (btn) { btn.disabled = true; btn.textContent = "Sending..."; }

      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (r) {
          if (!r.ok) throw new Error("Network error " + r.status);
          return r.json().catch(function () { return {}; });
        })
        .then(function () {
          if (success) success.classList.add("show");
          form.reset();
        })
        .catch(function () {
          if (success) {
            success.classList.add("show");
            success.innerHTML = "Could not reach the server. Please email <a href="mailto:accounts@e5enclave.com">accounts@e5enclave.com</a> directly.";
          }
        })
        .finally(function () {
          if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || "Send"; }
        });
    });
  });
})();
