/* =====================================================================
   The Zenz Planter — Front-end interactivity
   - Plan selection sync (pricing card -> form select)
   - Order form submission via fetch() to Google Apps Script Web App
   - On success: show Thank You confirmation (COD)
   - Footer year, sticky CTA helpers
   ===================================================================== */

(function () {
  'use strict';

  // ---------------------------------------------------------------------
  // 1. CONFIG — Replace this with YOUR deployed Google Apps Script URL.
  //    After you deploy Code.gs as a Web App (Anyone with link),
  //    paste the /exec URL below.
  // ---------------------------------------------------------------------
  const APPS_SCRIPT_WEBHOOK_URL =
    'https://script.google.com/macros/s/AKfycbyNXmP7MVWBN5G_X_3Ncb5XHzOvVils5kJU-Axl3mwb3SSripfRhVDgH2kgP7Ogu_TKLg/exec';

  // ---------------------------------------------------------------------
  // 2. Footer year
  // ---------------------------------------------------------------------
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------------------------------------------------------------------
  // 3. Plan selector sync — clicking a price card CTA pre-selects the
  //    matching option in the order form's <select>.
  // ---------------------------------------------------------------------
  const planSelect = document.getElementById('package_ordered');
  document.querySelectorAll('[data-plan]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const plan = btn.getAttribute('data-plan');
      if (planSelect && plan) planSelect.value = plan;
    });
  });

  // ---------------------------------------------------------------------
  // 4. Order form submission
  // ---------------------------------------------------------------------
  const form = document.getElementById('orderForm');
  const submitBtn = document.getElementById('submitBtn');
  const errorBox = document.getElementById('formError');
  const thankYou = document.getElementById('thankYou');

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      hideError();

      // Native HTML5 validation
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      // Build payload that maps 1:1 to Google Sheet columns
      const payload = {
        customer_name: getValue('customer_name'),
        phone_number: getValue('phone_number'),
        delivery_address: getValue('delivery_address'),
        package_ordered: getValue('package_ordered'),
        order_date: new Date().toISOString(), // timestamp
      };

      setLoading(true);

      try {
        // NOTE: Apps Script Web Apps require text/plain to avoid the CORS
        // preflight (OPTIONS) request, which Apps Script does not support.
        // The doPost(e) handler reads e.postData.contents and JSON.parse() it.
        const response = await fetch(APPS_SCRIPT_WEBHOOK_URL, {
          method: 'POST',
          mode: 'cors',
          redirect: 'follow',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('Server responded with ' + response.status);
        }

        // Apps Script returns JSON: { status: 'success', ... }
        let result = {};
        try { result = await response.json(); } catch (_) { /* tolerate */ }

        if (result && result.status && result.status !== 'success') {
          throw new Error(result.message || 'Submission failed.');
        }

        showThankYou(payload);
      } catch (err) {
        console.error('[Order submit error]', err);
        showError(
          'अर्डर पठाउन समस्या भयो। कृपया पुनः प्रयास गर्नुहोस् वा तलको ' +
          'व्हाट्सएप बटनबाट सिधै सम्पर्क गर्नुहोस्।'
        );
        setLoading(false);
      }
    });
  }

  // ---------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------
  function getValue(id) {
    const el = document.getElementById(id);
    return el ? String(el.value || '').trim() : '';
  }

  function setLoading(isLoading) {
    if (!submitBtn) return;
    submitBtn.disabled = isLoading;
    submitBtn.classList.toggle('is-loading', isLoading);
  }

  function showError(message) {
    if (!errorBox) return;
    errorBox.textContent = message;
    errorBox.hidden = false;
    errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function hideError() {
    if (!errorBox) return;
    errorBox.hidden = true;
    errorBox.textContent = '';
  }

  function showThankYou(payload) {
    if (!form || !thankYou) return;

    // Populate confirmation details
    setText('ty-name', payload.customer_name);
    setText('ty-phone', payload.phone_number);
    setText('ty-address', payload.delivery_address);
    setText('ty-package', payload.package_ordered);
    setText('ty-date', formatDate(payload.order_date));

    // Hide form, show thank you
    form.hidden = true;
    thankYou.hidden = false;

    // Smoothly bring confirmation into view
    thankYou.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || '—';
  }

  function formatDate(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch (_) {
      return iso;
    }
  }
})();
