// Donate page — preserved Stripe flow:
//   - selected amount-btn / freq-btn drives selectedAmount / frequency
//   - submit POSTs { amount, frequency } to /api/create-checkout (Azure Function)
//   - Function returns { url } for Stripe Checkout redirect

(function () {
  var form = document.getElementById('checkout-form');
  if (!form) return;
  var amountBtns = form.querySelectorAll('.amount-btn');
  var freqBtns = form.querySelectorAll('.freq-btn');
  var customInput = form.querySelector('#customAmount');
  var submit = form.querySelector('#donate-submit');

  var state = { amount: 100, frequency: 'one-time' };

  function setAmount(value, btn) {
    state.amount = parseInt(value, 10) || 0;
    amountBtns.forEach(function (b) {
      var active = b === btn;
      b.classList.toggle('selected', active);
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
      b.style.borderColor = active ? 'var(--vc-oxblood)' : 'var(--vc-rule-2)';
    });
    if (btn && customInput) customInput.value = '';
  }

  function setFreq(value, btn) {
    state.frequency = value;
    freqBtns.forEach(function (b) {
      var active = b === btn;
      b.classList.toggle('selected', active);
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
      b.style.color = active ? 'var(--vc-ink)' : 'var(--vc-muted)';
      b.style.borderColor = active ? 'var(--vc-oxblood)' : 'var(--vc-rule-2)';
    });
  }

  amountBtns.forEach(function (btn) {
    btn.addEventListener('click', function () { setAmount(btn.dataset.amount, btn); });
  });
  freqBtns.forEach(function (btn) {
    btn.addEventListener('click', function () { setFreq(btn.dataset.freq, btn); });
  });
  if (customInput) {
    customInput.addEventListener('input', function () {
      var v = parseInt(customInput.value, 10);
      if (v && v > 0) {
        state.amount = v;
        amountBtns.forEach(function (b) { b.classList.remove('selected'); b.setAttribute('aria-pressed', 'false'); b.style.borderColor = 'var(--vc-rule-2)'; });
      }
    });
  }

  // Initial
  setFreq(state.frequency, freqBtns[0]);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!state.amount || state.amount < 1) {
      alert('Please choose an amount.');
      return;
    }
    if (submit) { submit.disabled = true; submit.firstChild.nodeValue = 'Redirecting…'; }
    fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: state.amount, frequency: state.frequency }),
    })
      .then(function (r) {
        if (!r.ok) throw new Error('Network error');
        return r.json();
      })
      .then(function (data) {
        if (data && data.url) {
          window.location.href = data.url;
        } else {
          throw new Error('Missing checkout URL');
        }
      })
      .catch(function () {
        alert('We could not start the checkout. Please email contact@e5enclave.com and we will route you manually.');
        if (submit) { submit.disabled = false; submit.firstChild.nodeValue = 'Continue to checkout '; }
      });
  });
})();
