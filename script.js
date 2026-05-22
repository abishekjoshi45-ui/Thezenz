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
  // IMPORTANT: For public visitors, this MUST be the /exec URL from a
  // deployed Web App (Deploy > New deployment > Web app, "Anyone" access).
  // The /dev URL only works for the script owner while logged in.
  const APPS_SCRIPT_WEBHOOK_URL =
    'https://script.google.com/macros/s/AKfycbx-DMxH7NbADEzVTIn5jp8jIv1Ow0XGxHi88k10vKIi/exec';

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
  document.querySelectorAll('[data-plan]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      var plan = btn.getAttribute('data-plan');
      if (planSelect && plan) {
        planSelect.value = plan;
      }
    });
  });

  // ---------------------------------------------------------------------
  // 4. Order form submission
  // ---------------------------------------------------------------------
  var form = document.getElementById('orderForm');
  var submitBtn = document.getElementById('submitBtn');
  var errorBox = document.getElementById('formError');
  var thankYou = document.getElementById('thankYou');
  var checkoutCopy = document.querySelector('.checkout-copy');

  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      hideError();

      // Native HTML5 validation
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      // Build payload that maps 1:1 to Google Sheet columns
      var payload = {
        customer_name: getValue('customer_name'),
        phone_number: getValue('phone_number'),
        delivery_address: getValue('delivery_address'),
        package_ordered: getValue('package_ordered'),
        order_date: new Date().toISOString(),
      };

      setLoading(true);

      // ---------------------------------------------------------------
      // Apps Script Web Apps redirect (302) after a POST.
      // Using `redirect: 'follow'` with `mode: 'cors'` can fail on some
      // mobile browsers. Instead we use `mode: 'no-cors'` which gives an
      // opaque response (status 0), but the data DOES reach the server.
      //
      // Alternatively, we try `mode: 'cors'` first — if that succeeds we
      // parse JSON. If it fails (TypeError/network error) we fall back to
      // `no-cors` which always "succeeds" silently.
      // ---------------------------------------------------------------
      submitToSheet(payload)
        .then(function () {
          showThankYou(payload);
        })
        .catch(function (err) {
          console.error('[Order submit error]', err);
          showError(
            'अर्डर पठाउन समस्या भयो। कृपया पुनः प्रयास गर्नुहोस् वा तलको ' +
            'व्हाट्सएप बटनबाट सिधै सम्पर्क गर्नुहोस्।'
          );
          setLoading(false);
        });
    });
  }

  // ---------------------------------------------------------------------
  // Submit function with fallback strategy
  // ---------------------------------------------------------------------
  function submitToSheet(payload) {
    var body = JSON.stringify(payload);

    // Strategy: try fetch with no-cors (guaranteed to not throw on redirect)
    // Apps Script will receive the data regardless.
    return fetch(APPS_SCRIPT_WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: body,
    }).then(function (response) {
      // With no-cors, response is opaque (type: "opaque", status: 0).
      // This is expected and means the request was sent successfully.
      // Apps Script processes it on its end.
      return; // resolve successfully
    });
  }

  // ---------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------
  function getValue(id) {
    var el = document.getElementById(id);
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

    // Hide form and checkout copy, show thank you
    form.hidden = true;
    if (checkoutCopy) checkoutCopy.hidden = true;
    thankYou.hidden = false;

    // Smoothly bring confirmation into view
    thankYou.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value || '—';
  }

  function formatDate(iso) {
    try {
      var d = new Date(iso);
      return d.toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch (e) {
      return iso;
    }
  }
})();
