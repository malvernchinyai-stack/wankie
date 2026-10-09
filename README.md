# Wankie Docs

Offline Android app for **Wankie Chicken & Hatchery (Private) Limited** to create branded:

- **Quotations** – with product price list, VAT, discount, validity date; one tap converts to an invoice
- **Invoices** – payment tracking (Unpaid / Part paid / Paid), balance due, banking details, PAID stamp
- **Bills of Quantities (BOQ)** – multiple bill sections, item numbering (1.1, 1.2…), contingency, summary
- **Contracts** – Supply, Distribution/Agency, Contract Grower (out-grower) and Services agreements with editable clauses, schedule of key terms and signature/witness blocks
- **Distributor application letters** – auto reference numbers (`WCH/BD/2026/003` onwards), letter written automatically from the supplier name and products, enclosures list

Every document prints on A4 with the Wankie logo, colours and contact details, and can be saved as PDF and shared on WhatsApp or email.

**Designed & developed by Pilotage Business Consultants (Private) Limited**
info@pilotage.co.zw · +263 716 572 205 · www.pilotage.co.zw

---

## 1. Put the app on GitHub (free hosting)

1. Sign in at **github.com** → **New repository** → name it `wankie-docs` → **Public** → **Create repository**.
2. Click **uploading an existing file**. Drag in **everything inside this folder** (`index.html`, `app.js`, `styles.css`, `sw.js`, `manifest.json`, `.nojekyll`, `README.md`, and the `icons` and `screenshots` folders). Click **Commit changes**.
   - `index.html` must sit at the top level of the repository, not inside another folder.
3. Go to **Settings → Pages**. Under *Build and deployment* choose **Deploy from a branch**, branch **main**, folder **/ (root)** → **Save**.
4. After 1–2 minutes your app is live at:
   `https://YOUR-GITHUB-USERNAME.github.io/wankie-docs/`
5. Open that link in **Chrome on an Android phone**. It should load, and Chrome will offer **Install** (or use the ⋮ menu → *Add to Home screen*). Turn on airplane mode and open it again to confirm it works offline.

## 2. Make the Android app with PWABuilder

1. Go to **www.pwabuilder.com**, paste your GitHub Pages link and click **Start**.
2. The report should show the manifest, service worker and icons as passing. Click **Package For Stores** → **Android** → **Generate Package**.
3. Recommended options:
   - **Package ID:** `zw.co.wankiechickens.docs`
   - **App name:** `Wankie Docs` · **Launcher name:** `Wankie Docs`
   - **Version:** `1.0.0` (version code `1`)
   - **Signing key:** *Create new* — fill in Wankie Chicken & Hatchery details.
4. Download the zip. Inside you will find:
   - **`.apk`** – install directly on company phones (allow “Install unknown apps” for Files/WhatsApp).
   - **`.aab`** – upload this to Google Play Console if you publish on the Play Store.
   - **`signing.keystore` + `signing-key-info.txt`** – **keep these safe and backed up.** You need the same key for every future update.
   - **`assetlinks.json`** – see step 3.

## 3. (Optional) Hide the browser address bar

The installed Android app shows a thin address bar unless Android can verify you own the website. Verification needs `assetlinks.json` at the **root** of the domain, e.g. `https://docs.wankiechickens.co.zw/.well-known/assetlinks.json`. A GitHub project site (`username.github.io/wankie-docs`) cannot do this, so:

1. In the repository create the file `CNAME` containing `docs.wankiechickens.co.zw`.
2. At your domain host, add a DNS **CNAME** record: `docs` → `YOUR-GITHUB-USERNAME.github.io`.
3. In **Settings → Pages**, set the custom domain to `docs.wankiechickens.co.zw` and tick **Enforce HTTPS**.
4. Upload PWABuilder's `assetlinks.json` to the repository at `.well-known/assetlinks.json`.
5. Re-run PWABuilder using `https://docs.wankiechickens.co.zw/` (same signing key) and reinstall.

The app works fully without this step — it is cosmetic.

## 4. Updating the app later

1. Edit or replace the files on GitHub.
2. In `sw.js` change `CACHE_VERSION` (e.g. `wankie-docs-v1.0.1`) — otherwise phones keep the old cached version.
3. Phones pick up the update the next time the app opens with internet (close and reopen once).
4. You only need to rebuild with PWABuilder if you change the app name, icons or package details.

## 5. Using the app

- **Products tab** – enter current prices once (chicks, feed, eggs, delivery…). Picking a product on a quotation or invoice fills in its unit and price.
- **Settings tab** – company registration, BP and VAT numbers, banking/mobile-money details, VAT rate (default 15.5%, off by default), default terms, signatory, letter reference prefix and next number, logo upload.
- **Print / Save PDF** – in the print screen choose **Save as PDF**, then share the PDF.
- **Backups** – all data is stored only on the phone. Use **Settings → Export backup** regularly and keep the file on Google Drive or WhatsApp. **Restore backup** loads it onto a new phone. Clearing Chrome/app data or uninstalling deletes the records.
- Each phone has its own data and numbering. If several people use the app, agree who issues which documents, or move data between phones with backup/restore.

## Files

| File | Purpose |
|---|---|
| `index.html` | App shell |
| `app.js` | All logic: documents, templates, numbering, storage, printing |
| `styles.css` | App and A4 document styling (brand colours) |
| `sw.js` | Service worker — offline caching |
| `manifest.json` | Install details used by Chrome and PWABuilder |
| `icons/` | Logo, rooster icon, app icons (incl. maskable) |
| `screenshots/` | Store/installer screenshots |
| `.nojekyll` | Tells GitHub Pages to serve files as-is |

---
© Wankie Chicken & Hatchery (Private) Limited · App developed by Pilotage Business Consultants (Private) Limited
