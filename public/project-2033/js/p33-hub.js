/* ============================================================
   p33-hub.js — Project 2033 "Reparations Now" hub (2026-09-13)
   Sign-on posts to dc.e5enclave.com/api/sign; live count reads
   /api/signatories. Fail-closed: no-JS => the form posts to the
   API endpoint directly via its method/action attributes.
   ============================================================ */
(function () {
'use strict';

var SIGN_URL = 'https://dc.e5enclave.com/api/sign';
var LIST_URL = 'https://dc.e5enclave.com/api/signatories';
var tsToken = '';

/* Turnstile callbacks (rendered by the managed widget) */
window.p33tsDone = function (t) { tsToken = t || ''; };
window.p33tsExpired = function () { tsToken = ''; };

/* ---------- live signature count ---------- */
var countEls = document.querySelectorAll('[data-p33-count]');
function paintCount(n) {
  for (var i = 0; i < countEls.length; i++) countEls[i].textContent = String(n);
}
function loadCount() {
  if (!countEls.length) return;
  fetch(LIST_URL, { headers: { 'Accept': 'application/json' } })
    .then(function (r) {
      if (!r.ok) throw new Error('http ' + r.status);
      return r.json();
    })
    .then(function (d) {
      var n = (d && typeof d.count === 'number') ? d.count :
              (d && Array.isArray(d.signatories)) ? d.signatories.length : null;
      if (n === null) throw new Error('bad payload');
      paintCount(n);
    })
    .catch(function () { /* keep the last known value; never error the page */ });
}
loadCount();
setInterval(function () { if (!document.hidden) loadCount(); }, 30000);

/* ---------- sign-on form ---------- */
var form = document.getElementById('p33SignForm');
if (!form) return;
var errBox = document.getElementById('p33FormErr');
var success = document.getElementById('p33SignSuccess');
var submitBtn = form.querySelector('.p33-fsubmit');
var STORE_KEY = 'project-2033_signed';

function showError(msg) {
  errBox.textContent = msg;
  errBox.hidden = false;
  errBox.setAttribute('tabindex', '-1');
  try { errBox.focus({ preventScroll: false }); } catch (e) {}
}

function showSuccess(confirmed) {
  var h3 = success.querySelector('h3');
  if (h3) h3.innerHTML = confirmed
    ? 'You are on the <em>record.</em>'
    : 'Almost there. <em>Check your email.</em>';
  form.hidden = true;
  success.hidden = false;
}

try {
  if (sessionStorage.getItem(STORE_KEY)) showSuccess(false);
} catch (e) {}

form.addEventListener('submit', function (e) {
  e.preventDefault();
  errBox.hidden = true;

  /* honeypot — quiet pass, no tell */
  var hp = form.querySelector('input[name="website"]');
  if (hp && hp.value) { showSuccess(false); return; }

  function get(name) {
    var f = form.querySelector('[name="' + name + '"]');
    return f ? f.value.trim() : '';
  }
  var firstName = get('firstName'), lastName = get('lastName');
  var email = get('email'), organization = get('organization');
  var message = get('message');
  var cert = form.querySelector('#p33_certify');

  var problems = [];
  if (!firstName) problems.push('first name');
  if (!lastName) problems.push('last name');
  if (!email) problems.push('email');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) problems.push('a valid email address');
  if (!organization) problems.push('organization');
  if (message.length > 2000) problems.push('a statement under 2,000 characters');
  if (!cert || !cert.checked) problems.push('the certification checkbox');
  if (!tsToken) problems.push('the human-verification check');

  if (problems.length) {
    showError('Please complete: ' + problems.join(', ') + '.');
    return;
  }

  var orig = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Adding\u2026';

  fetch(SIGN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: firstName,
      lastName: lastName,
      fullName: (firstName + ' ' + lastName).trim(),
      email: email,
      organization: organization,
      title: get('title'),
      city: get('city'),
      state: get('state').toUpperCase(),
      message: message,
      certify: true,
      source: 'project-2033',
      turnstileToken: tsToken
    })
  })
    .then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok) throw new Error((j && (j.error || j.message)) || ('Server error ' + r.status));
        return j;
      });
    })
    .then(function (data) {
      try { sessionStorage.setItem(STORE_KEY, '1'); } catch (e) {}
      showSuccess(data && data.status === 'confirmed');
      loadCount();
    })
    .catch(function (ex) {
      submitBtn.disabled = false;
      submitBtn.textContent = orig;
      showError(ex.message || 'Network error. Please try again.');
    });
});
})();
