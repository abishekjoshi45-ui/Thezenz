# The Zenz Planter — Sales Landing Page

A mobile-first, conversion-focused landing page for **4 Mukhi (Four-Faced) Buddhachitta saplings** — naturally grown, authentic seed-grown plants from Temal, Kavre.

Static stack: **HTML + CSS + Vanilla JS**. No build step. Deploy anywhere (Netlify, Vercel, GitHub Pages, Hostinger, cPanel — drop the files in).

---

## File Structure

```
.
├── index.html              # Landing page (header, hero, value, pricing, trust, form, footer)
├── styles.css              # Mobile-first responsive styling
├── script.js               # Form submission via fetch -> Apps Script
└── apps-script/
    └── Code.gs             # Google Apps Script Web App (Sheet append)
```

---

## Sections (mapped to brief)

1. **Header** — Brand "The Zenz Planter" + sticky CTA.
2. **Hero** — Nepali headline, sub-headline, primary CTA + secondary "मूल्य हेर्नुहोस्".
3. **Dual Value Proposition** — आध्यात्मिक महत्व | वर्षौंसम्मको आम्दानी.
4. **Offer Block** — Single (Rs. 450) and Bundle of 3 (Rs. 1,099, Best Value, Rs. 251 बचत).
5. **Trust Badges** — 4 horizontal badges (Temal origin, 4 Mukhi guarantee, healthy stock, COD).
6. **Checkout Form** — Minimal 4 fields (Name, Phone, Address, Package).
7. **Sticky Floating CTA** — "व्हाट्सएप वा फोनबाट सिधै अर्डर गर्न यहाँ थिच्नुहोस्".

---

## Backend Automation — Google Sheets via Apps Script

Form submissions are POSTed as JSON to a deployed Google Apps Script Web App, which appends a row to your Google Sheet and returns a JSON success response. The front-end then renders the in-page **Thank You** confirmation (no page reload).

### 1. Create the Google Sheet

1. Create a new Google Sheet (e.g. "TheZenzPlanter — Orders").
2. From the URL `https://docs.google.com/spreadsheets/d/{ID}/edit`, copy the `{ID}` portion.

### 2. Deploy the Apps Script

1. In the Sheet: **Extensions → Apps Script**.
2. Replace the default `Code.gs` with the contents of [`apps-script/Code.gs`](apps-script/Code.gs).
3. Edit the constant at the top:
   ```js
   const SHEET_ID   = 'PASTE_YOUR_SHEET_ID_HERE';
   const SHEET_NAME = 'Orders'; // or any tab name
   ```
4. Save, then run `setupHeaders` once (Run menu) — this seeds the header row and authorizes the script.
5. **Deploy → New deployment**:
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Copy the deployment `/exec` URL.

### 3. Wire it to the landing page

Open `script.js` and replace the placeholder:

```js
const APPS_SCRIPT_WEBHOOK_URL =
  'https://script.google.com/macros/s/REPLACE_WITH_YOUR_DEPLOYMENT_ID/exec';
```

That's it — submitting the form will append a row with these columns:

| order_date | customer_name | phone_number | delivery_address | package_ordered | source |
|------------|---------------|--------------|------------------|------------------|--------|

### Why `Content-Type: text/plain`?

Apps Script Web Apps don't respond to CORS preflight (OPTIONS) requests. Sending the JSON body as `text/plain` keeps the request "simple" so the browser skips preflight. The Apps Script `doPost(e)` reads `e.postData.contents` and `JSON.parse`s it — exact behavior is unchanged.

---

## User Experience Flow

1. User fills form → clicks **अर्डर पुष्टि गर्नुहोस् (COD)**.
2. Submit button shows a spinner (`is-loading`).
3. `fetch()` POSTs payload to Apps Script.
4. On success → form is hidden and a **Thank You** panel appears in-place with:
   - Personalized greeting + brand name
   - Echo of name, phone, address, package, and timestamp
   - Reassurance: "पैसा डेलिभरीको समयमा मात्र तिर्नुहोस्"
   - WhatsApp confirmation CTA
5. On failure → friendly error with WhatsApp fallback hint.

---

## WhatsApp / Phone Floating CTA

Update the `href` in `index.html` (search for `wa.me/9779800000000`) with your real number in international format (no `+`, no spaces). Example:

```html
<a href="https://wa.me/9779812345678" class="floating-cta" ...>
```

---

## Local Preview

Just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080
# then visit http://localhost:8080
```
