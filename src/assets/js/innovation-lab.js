/**
 * Innovation Lab — Photo Studio Client
 * Handles file upload, preview, API call, and result rendering
 * DAG: innovation-lab-client-2026-0520
 */
(function () {
  'use strict';

  const API_ENDPOINT = '/api/innovation/photo-analyze';
  const MAX_SIZE_MB = 10;
  const MAX_DIMENSION = 1600; // Resize before sending to keep payload small

  const els = {
    dropZone:   document.getElementById('labDropZone'),
    browseBtn:  document.getElementById('labBrowseBtn'),
    fileInput:  document.getElementById('labFileInput'),
    outputPanel:document.getElementById('labOutputPanel'),
    idle:       document.getElementById('labIdle'),
    preview:    document.getElementById('labPreview'),
    previewImg: document.getElementById('labPreviewImg'),
    overlay:    document.getElementById('labOverlay'),
    result:     document.getElementById('labResult'),
    error:      document.getElementById('labError'),
    errorMsg:   document.getElementById('labErrorMsg'),
    // Result fields
    caption:    document.getElementById('labCaption'),
    alt:        document.getElementById('labAlt'),
    mood:       document.getElementById('labMood'),
    theme:      document.getElementById('labTheme'),
    lineage:    document.getElementById('labLineage'),
    context:    document.getElementById('labContext'),
    ts:         document.getElementById('labResultTs'),
    rawJson:    document.getElementById('labRawJson'),
    // Buttons
    reset:      document.getElementById('labReset'),
    errorReset: document.getElementById('labErrorReset'),
    copyJson:   document.getElementById('labCopyJson'),
  };

  let lastResult = null;

  // ── Drag & drop ──────────────────────────────────────────────
  if (els.dropZone) {
    els.dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      els.dropZone.classList.add('is-over');
    });
    els.dropZone.addEventListener('dragleave', () => {
      els.dropZone.classList.remove('is-over');
    });
    els.dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      els.dropZone.classList.remove('is-over');
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    });
    els.dropZone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') els.fileInput.click();
    });
  }

  if (els.browseBtn) els.browseBtn.addEventListener('click', () => els.fileInput.click());
  if (els.fileInput) els.fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) handleFile(e.target.files[0]);
  });
  if (els.reset)       els.reset.addEventListener('click', resetToIdle);
  if (els.errorReset)  els.errorReset.addEventListener('click', resetToIdle);
  if (els.copyJson)    els.copyJson.addEventListener('click', copyJsonToClipboard);

  // ── File handler ─────────────────────────────────────────────
  function handleFile(file) {
    if (!file.type.startsWith('image/')) {
      return showError('Please upload an image file (JPG, PNG, WEBP, or GIF).');
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return showError('Image is too large. Please use an image under 10 MB.');
    }
    showPreview(file);
    resizeAndEncode(file).then(({ base64, mimeType }) => {
      showLoading();
      return callAPI(base64, mimeType);
    }).then(data => {
      showResult(data);
    }).catch(err => {
      showError(err.message || 'Unknown error. Please try again.');
    });
  }

  // ── Image resize + encode ─────────────────────────────────────
  function resizeAndEncode(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height, 1);
          canvas.width  = Math.round(width  * ratio);
          canvas.height = Math.round(height * ratio);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          const base64  = dataUrl.split(',')[1];
          resolve({ base64, mimeType: 'image/jpeg' });
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  // ── API call ──────────────────────────────────────────────────
  async function callAPI(imageBase64, mimeType) {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, mimeType }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || `API error ${res.status}`);
    }
    return data;
  }

  // ── UI state transitions ──────────────────────────────────────
  function showPreview(file) {
    const url = URL.createObjectURL(file);
    els.previewImg.src = url;
    els.idle.hidden   = true;
    els.result.hidden = true;
    els.error.hidden  = true;
    els.preview.hidden = false;
  }

  function showLoading() {
    els.overlay.hidden = false;
  }

  function showResult(data) {
    lastResult = data;
    const a = data.analysis || {};
    els.overlay.hidden = true;

    els.caption.textContent  = a.caption  || '—';
    els.alt.textContent      = a.alt_text || '—';
    els.mood.textContent     = a.mood     || '—';
    els.theme.textContent    = a.suggested_theme || '—';

    if (Array.isArray(a.lineage_signals) && a.lineage_signals.length) {
      els.lineage.innerHTML = a.lineage_signals
        .map(s => `<span class="lab-tag">${escHtml(s)}</span>`)
        .join(' ');
    } else {
      els.lineage.textContent = a.lineage_signals || '—';
    }

    els.context.textContent  = a.context  || '—';
    els.ts.textContent       = `${data.model} · ${new Date(data.timestamp).toLocaleTimeString()}`;
    els.rawJson.textContent  = JSON.stringify(data, null, 2);

    els.result.hidden = false;
  }

  function showError(msg) {
    els.overlay.hidden    = true;
    els.result.hidden     = true;
    els.idle.hidden       = true;
    els.error.hidden      = false;
    els.errorMsg.textContent = ' ' + msg;
  }

  function resetToIdle() {
    els.idle.hidden    = false;
    els.preview.hidden = true;
    els.result.hidden  = true;
    els.error.hidden   = true;
    els.overlay.hidden = true;
    els.fileInput.value = '';
    lastResult = null;
  }

  function copyJsonToClipboard() {
    if (!lastResult) return;
    navigator.clipboard.writeText(JSON.stringify(lastResult, null, 2))
      .then(() => {
        els.copyJson.textContent = 'Copied ✓';
        setTimeout(() => { els.copyJson.textContent = 'Copy JSON'; }, 2000);
      });
  }

  function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

})();
