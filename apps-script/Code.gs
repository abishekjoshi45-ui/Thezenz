/**
 * The Zenz Planter — Order Intake (Google Apps Script Web App)
 * ----------------------------------------------------------------
 * Receives form submissions from the landing page (POST JSON) and
 * appends a new row to the configured Google Sheet.
 *
 * DEPLOYMENT STEPS
 *   1. Create a Google Sheet. Copy its ID from the URL:
 *        https://docs.google.com/spreadsheets/d/{THIS_PART}/edit
 *      Paste it into SHEET_ID below.
 *   2. (Optional) Rename the target tab to "Orders" or update SHEET_NAME.
 *   3. In the Sheet, run Extensions > Apps Script and paste this file.
 *   4. Deploy:  Deploy > New deployment > Type: Web app
 *        - Execute as: Me
 *        - Who has access: Anyone
 *      Copy the /exec URL it gives you.
 *   5. Paste that URL into APPS_SCRIPT_WEBHOOK_URL inside script.js.
 *   6. Run setupHeaders() once from the Apps Script editor to seed the
 *      header row (it's also safe to call repeatedly — it's idempotent).
 */

// ---------- CONFIG ----------
const SHEET_ID   = '1JsQxFg894RKRLiKUsuClFWNq8VLvBcL_hD2paPtgw80';
const SHEET_NAME = 'Orders';

const HEADERS = [
  'order_date',
  'customer_name',
  'phone_number',
  'delivery_address',
  'package_ordered',
  'source',
];

// ---------- WEB APP ENTRY ----------
function doPost(e) {
  try {
    const payload = parsePayload_(e);

    // Basic validation — required fields
    const required = ['customer_name', 'phone_number', 'delivery_address', 'package_ordered'];
    for (const key of required) {
      if (!payload[key] || String(payload[key]).trim() === '') {
        return jsonResponse_({ status: 'error', message: 'Missing field: ' + key });
      }
    }

    const sheet = getSheet_();

    // Use server-side timestamp if client did not send one
    const orderDate = payload.order_date
      ? new Date(payload.order_date)
      : new Date();

    sheet.appendRow([
      orderDate,
      String(payload.customer_name).trim(),
      String(payload.phone_number).trim(),
      String(payload.delivery_address).trim(),
      String(payload.package_ordered).trim(),
      'landing-page',
    ]);

    return jsonResponse_({
      status: 'success',
      message: 'Order recorded',
      received_at: orderDate.toISOString(),
    });
  } catch (err) {
    return jsonResponse_({ status: 'error', message: String(err && err.message || err) });
  }
}

// Optional GET handler — returns a simple healthcheck.
function doGet() {
  return jsonResponse_({ status: 'ok', service: 'TheZenzPlanter Orders' });
}

// ---------- HELPERS ----------
function parsePayload_(e) {
  // Front-end posts JSON as text/plain to dodge CORS preflight.
  if (e && e.postData && e.postData.contents) {
    try { return JSON.parse(e.postData.contents); } catch (_) { /* fall through */ }
  }
  // Fallback: form-encoded params
  if (e && e.parameter) return e.parameter;
  return {};
}

function getSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---------- ONE-TIME UTILITY ----------
/**
 * Run this manually once from the Apps Script editor to ensure the
 * header row exists. Safe to re-run.
 */
function setupHeaders() {
  const sheet = getSheet_();
  const firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const matches = HEADERS.every((h, i) => firstRow[i] === h);
  if (!matches) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
}
