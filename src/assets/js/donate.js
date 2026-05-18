// DONATE.JS — Stripe Payment Element
// Zero redirect. Full on-page processing. E5 brand skin.
// Supports: one-time (PaymentIntent) + monthly (SetupIntent → subscription)

(function () {
  // ── Config ─────────────────────────────────────────────────────────
  var STRIPE_PK = 'pk_live_51R8xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'; // REPLACE with live pk_live_ key
  var PI_ENDPOINT = '/.netlify/functions/create-payment-intent';
  var SUB_ENDPOINT = '/.netlify/functions/confirm-subscription';

  // ── E5 Appearance API ─────────────────────────────────────────────
  var e5Appearance = {
    theme: 'flat',
    variables: {
      colorPrimary:     '#8B1A1A',   // oxblood
      colorBackground:  '#FDFAF4',   // near-bone
      colorText:        '#0f0f0e',   // ink
      colorDanger:      '#cc1111',
      colorSuccess:     '#2e6b3e',
      fontFamily:       '"Inter", "system-ui", sans-serif',
      fontSizeBase:     '15px',
      spacingUnit:      '5px',
      borderRadius:     '2px',
      colorTextSecondary:  '#5a5a58',
      colorTextPlaceholder: '#9a9490',
    },
    rules: {
      '.Input': {
        border: '1px solid #d4cfc5',
        boxShadow: 'none',
        backgroundColor: '#FDFAF4',
        fontSize: '15px',
        padding: '12px 14px',
      },
      '.Input:focus': {
        border: '1px solid #8B1A1A',
        boxShadow: '0 0 0 2px rgba(139,26,26,.12)',
        outline: 'none',
      },
      '.Input--invalid': {
        border: '1px solid #cc1111',
        boxShadow: '0 0 0 2px rgba(204,17,17,.1)',
      },
      '.Label': {
        fontFamily: '"Inter", system-ui, sans-serif',
        fontSize: '9px',
        fontWeight: '600',
        letterSpacing: '0.35em',
        textTransform: 'uppercase',
        color: '#8B1A1A',
        marginBottom: '6px',
      },
      '.Tab': {
        border: '1px solid #d4cfc5',
        backgroundColor: '#FDFAF4',
        boxShadow: 'none',
        borderRadius: '2px',
      },
      '.Tab:hover': {
        border: '1px solid #8B1A1A',
        backgroundColor: '#f7f3ea',
      },
      '.Tab--selected': {
        border: '2px solid #8B1A1A',
        backgroundColor: '#f7f3ea',
        boxShadow: 'none',
        color: '#0f0f0e',
      },
      '.Tab--selected:focus': {
        boxShadow: '0 0 0 3px rgba(139,26,26,.15)',
      },
      '.CheckboxLabel': {
        fontFamily: '"Inter", system-ui, sans-serif',
        fontSize: '13px',
        color: '#3a3a38',
      },
      '.Error': {
        fontFamily: '"Inter", system-ui, sans-serif',
        fontSize: '12px',
        color: '#cc1111',
      },
    },
  };

  // ── State ─────────────────────────────────────────────────────────
  var state = {
    amount: 100,
    frequency: 'one-time',
    designation: 'General Fund',
    email: '',
    stripeReady: false,
  };

  var stripe, elements, paymentElement;
  var clientSecret, intentType, customerId, setupIntentId;

  // ── DOM refs ──────────────────────────────────────────────────────
  var form          = document.getElementById('checkout-form');
  var amountBtns    = form ? form.querySelectorAll('.amount-btn') : [];
  var freqBtns      = form ? form.querySelectorAll('.freq-btn') : [];
  var customInput   = form ? form.querySelector('#customAmount') : null;
  var desigSelect   = form ? form.querySelector('#designation') : null;
  var emailInput    = form ? form.querySelector('#donorEmail') : null;
  var submitBtn     = form ? form.querySelector('#donate-submit') : null;
  var mountPoint    = document.getElementById('stripe-payment-element');
  var formSection   = document.getElementById('stripe-form-section');
  var successPanel  = document.getElementById('donate-success');
  var errorMsg      = document.getElementById('donate-error');
  var loadingState  = document.getElementById('stripe-loading');
  var btnLabel      = submitBtn ? submitBtn.querySelector('.btn-label') : null;
  var btnSpinner    = submitBtn ? submitBtn.querySelector('.btn-spinner') : null;

  if (!form || !mountPoint) return;

  // ── Stripe init ───────────────────────────────────────────────────
  function loadStripe(cb) {
    if (window.Stripe) { cb(); return; }
    var s = document.createElement('script');
    s.src = 'https://js.stripe.com/v3/';
    s.onload = function() { stripe = Stripe(STRIPE_PK); cb(); };
    document.head.appendChild(s);
  }

  function showError(msg) {
    if (errorMsg) { errorMsg.textContent = msg; errorMsg.style.display = 'block'; }
    setLoading(false);
  }

  function setLoading(on) {
    if (submitBtn) submitBtn.disabled = on;
    if (btnLabel)   btnLabel.style.display   = on ? 'none'  : 'inline';
    if (btnSpinner) btnSpinner.style.display  = on ? 'inline' : 'none';
  }

  function setAmount(val, btn) {
    state.amount = parseInt(val, 10) || 0;
    amountBtns.forEach(function(b) {
      var active = (b === btn);
      b.classList.toggle('selected', active);
      b.setAttribute('aria-pressed', String(active));
      b.style.borderColor = active ? 'var(--vc-oxblood)' : 'var(--vc-rule-2)';
      b.style.background  = active ? 'rgba(139,26,26,.06)' : '';
    });
    if (btn && customInput) customInput.value = '';
    reinitStripe();
  }

  function setFreq(val, btn) {
    state.frequency = val;
    freqBtns.forEach(function(b) {
      var active = (b === btn);
      b.classList.toggle('selected', active);
      b.setAttribute('aria-pressed', String(active));
      b.style.color       = active ? 'var(--vc-ink)'   : 'var(--vc-muted)';
      b.style.borderColor = active ? 'var(--vc-oxblood)' : 'var(--vc-rule-2)';
      b.style.background  = active ? 'rgba(139,26,26,.06)' : '';
    });
    // Show/hide email field for monthly (needed to create customer)
    var emailRow = document.getElementById('email-row');
    if (emailRow) emailRow.style.display = (val === 'monthly') ? 'flex' : 'none';
    reinitStripe();
  }

  // ── Re-initialize Payment Element whenever amount/freq changes ────
  var reinitTimer;
  function reinitStripe() {
    clearTimeout(reinitTimer);
    reinitTimer = setTimeout(function() { fetchIntentAndMount(); }, 400);
  }

  function fetchIntentAndMount() {
    if (!state.amount || state.amount < 1) return;
    if (loadingState) loadingState.style.display = 'flex';
    if (mountPoint)   mountPoint.style.display = 'none';

    fetch(PI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount:      state.amount,
        frequency:   state.frequency,
        designation: state.designation,
        email:       state.frequency === 'monthly' ? (emailInput ? emailInput.value : '') : undefined,
      }),
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.error) { showError(data.error); return; }
      clientSecret  = data.clientSecret;
      intentType    = data.intentType;
      customerId    = data.customerId;

      if (!stripe) { stripe = Stripe(STRIPE_PK); }

      elements = stripe.elements({
        clientSecret: clientSecret,
        appearance: e5Appearance,
      });

      if (paymentElement) paymentElement.destroy();
      paymentElement = elements.create('payment', {
        layout: { type: 'tabs', defaultCollapsed: false },
        wallets: { applePay: 'auto', googlePay: 'auto' },
        fields: { billingDetails: { email: 'auto', name: 'auto' } },
        terms: { card: 'never' },
      });

      paymentElement.mount('#stripe-payment-element');
      paymentElement.on('ready', function() {
        if (loadingState) loadingState.style.display = 'none';
        if (mountPoint)   mountPoint.style.display = 'block';
        state.stripeReady = true;
      });
    })
    .catch(function(err) { showError('Could not initialize payment. Please refresh and try again.'); });
  }

  // ── Submit ─────────────────────────────────────────────────────────
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!state.stripeReady || !elements) { showError('Payment form is loading. Please wait a moment.'); return; }
    if (!state.amount || state.amount < 1) { showError('Please choose a donation amount.'); return; }
    if (errorMsg) errorMsg.style.display = 'none';
    setLoading(true);

    var returnUrl = window.location.origin + '/donate/?status=success';

    if (intentType === 'payment') {
      // One-time: confirm PaymentIntent
      var result = await stripe.confirmPayment({
        elements: elements,
        confirmParams: {
          return_url: returnUrl,
          payment_method_data: {
            billing_details: {
              email: emailInput ? emailInput.value : undefined,
            },
          },
        },
        redirect: 'if_required',
      });
      if (result.error) {
        showError(result.error.message);
      } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        showSuccess();
      } else {
        showError('Something went wrong. Please try again or email accounts@e5enclave.com.');
      }
    } else {
      // Monthly: confirm SetupIntent → create subscription
      var setupResult = await stripe.confirmSetup({
        elements: elements,
        confirmParams: { return_url: returnUrl },
        redirect: 'if_required',
      });
      if (setupResult.error) {
        showError(setupResult.error.message);
        return;
      }
      setupIntentId = setupResult.setupIntent.id;
      // Now call confirm-subscription
      fetch(SUB_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setupIntentId: setupIntentId,
          customerId:    customerId,
          amountCents:   Math.round(state.amount * 100),
          designation:   state.designation,
        }),
      })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d.subscriptionId) { showSuccess(true); }
        else { showError(d.error || 'Subscription could not be created. Please contact accounts@e5enclave.com'); }
      })
      .catch(function() { showError('Subscription error. Please contact accounts@e5enclave.com'); });
    }
  });

  function showSuccess(isMonthly) {
    if (formSection) formSection.style.display = 'none';
    if (successPanel) {
      successPanel.style.display = 'block';
      var heading = successPanel.querySelector('.success-heading');
      var body    = successPanel.querySelector('.success-body');
      if (heading) heading.textContent = isMonthly
        ? 'Monthly gift confirmed. Thank you.'
        : 'Your donation is confirmed. Thank you.';
      if (body) body.textContent = isMonthly
        ? 'You\'ll receive a receipt by email each month. Your recurring support means the record stays alive. By Grace.'
        : 'A receipt is on its way to your email. Your investment in coordinated lineage power matters. By Grace.';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLoading(false);
  }

  // ── Wire up controls ──────────────────────────────────────────────
  amountBtns.forEach(function(btn) {
    btn.addEventListener('click', function() { setAmount(btn.dataset.amount, btn); });
  });
  freqBtns.forEach(function(btn) {
    btn.addEventListener('click', function() { setFreq(btn.dataset.freq, btn); });
  });
  if (customInput) {
    customInput.addEventListener('input', function() {
      var v = parseFloat(customInput.value);
      if (v && v > 0) {
        state.amount = v;
        amountBtns.forEach(function(b) {
          b.classList.remove('selected');
          b.setAttribute('aria-pressed', 'false');
          b.style.borderColor = 'var(--vc-rule-2)';
          b.style.background  = '';
        });
        reinitStripe();
      }
    });
  }
  if (desigSelect) {
    desigSelect.addEventListener('change', function() {
      state.designation = desigSelect.value;
    });
  }
  if (emailInput) {
    emailInput.addEventListener('change', function() {
      state.email = emailInput.value;
    });
  }

  // ── Bootstrap ─────────────────────────────────────────────────────
  setFreq('one-time', freqBtns[0]);
  setAmount(100, Array.from(amountBtns).find(function(b){ return b.dataset.amount === '100'; }));
  loadStripe(function() {
    stripe = Stripe(STRIPE_PK);
    fetchIntentAndMount();
  });

})();
