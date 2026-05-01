# Divine Guest Lodge — Operations TODO

Off-site setup items deferred from the dev session. These need user action (account sign-ups, DNS access, external dashboards). Code changes for these items are unblocked once the listed inputs land.

---

## 1. WhatsApp click-to-chat
**Status:** Pending real number from owner.
**Needed from owner:**
- Real WhatsApp Business number (format `+27XXXXXXXXX`).
- Confirm whether the same number is the main reservation phone (currently a placeholder `+27 14 000 0000` appears in `index.html`, JSON-LD schema, FAQ answers, and OG meta — needs replacing in ~8 places).

**Code work to do once number is in:**
- Floating WhatsApp FAB (bottom-right, gold/dark palette match).
- Inline WhatsApp links in FAQ booking answers + Reserve area.
- Pre-filled message: `Hi Divine Guest Lodge, I'd like to enquire about a room.`
- Replace placeholder phone everywhere.

---

## 2. Google Search Console
**Status:** Site not yet verified.
**Owner action:**
1. Go to https://search.google.com/search-console.
2. Add property `https://divineguestlodge.co.za` (URL-prefix property, not domain).
3. Choose **HTML tag** verification method, copy the `content="..."` token.
4. Send the token to dev — it goes into `index.html` `<head>` as one meta tag.
5. After verification: submit `https://divineguestlodge.co.za/sitemap.xml`.

**Code work to do once token is in:**
- Add `<meta name="google-site-verification" content="...">` near the other meta tags.

---

## 3. Microsoft Clarity (free heatmaps + session recordings)
**Status:** No analytics installed.
**Owner action:**
1. Sign in at https://clarity.microsoft.com with a Microsoft account.
2. Create project: name `Divine Guest Lodge`, URL `https://divineguestlodge.co.za`.
3. Copy the project ID (looks like `abcd1234ef`) and send to dev.

**Code work to do once ID is in:**
- Insert the Clarity snippet in `<head>`, gated to skip on `localhost`.

---

## 4. Google Business Profile (highest-impact local SEO)
**Status:** Not claimed (verify by searching the lodge name on Google Maps).
**Owner action — fully self-serve, ~30 mins:**
1. Go to https://business.google.com.
2. Search for "Divine Guest Lodge, 12 Keurtjie Avenue, Rustenburg" — claim if it exists, or create new.
3. Category: **Lodging** > **Guest house**.
4. Verification: most likely postcard to physical address (5–10 days). Phone or email verification sometimes offered.
5. Once verified: upload 10+ photos (exterior, every room type, lounge, parking), set hours, add booking link, write the description.

**Why first:** for a Rustenburg guest house this drives more bookings than the website itself. No code work needed.

---

## 5. Email auth — SPF / DKIM / DMARC
**Status:** Unknown — needs DNS audit.
**Needed from owner:**
- Where is mail for `info@divineguestlodge.co.za` hosted? (Google Workspace / Zoho / cPanel / Microsoft 365 / something else).
- Where is DNS for `divineguestlodge.co.za` managed? (registrar e.g. domains.co.za / Afrihost / Cloudflare / etc.).

**Dev work once known:**
- Provide the three exact TXT records to paste in.
- Walk through MXToolbox verification after propagation (~24 hrs).

---

## 6. Security headers audit
**Status:** Only `X-Content-Type-Options` and `Referrer-Policy` set in HTML. CSP, HSTS, Permissions-Policy, X-Frame-Options should live in **server response headers**, not `<meta>`.
**Needed from owner:**
- Hosting provider name (looks like FTPS deploy → likely shared/cPanel hosting).

**Dev work once known:**
- Curl the live URL, list headers actually being sent.
- Write the right `.htaccess` (Apache/cPanel) or `_headers` (Netlify/Cloudflare) snippet.
- Re-run securityheaders.com — target A/A+.

---

## 7. Bing Webmaster Tools
**Status:** Not registered.
**Owner action — 5 mins:**
1. https://www.bing.com/webmasters → sign in with Microsoft account.
2. Add site, choose "Import from Google Search Console" once GSC is verified (saves the verification step).
3. Submit sitemap.

**Why bother:** ChatGPT and Copilot lean on Bing's index. AI-search visibility.

---

## 8. UptimeRobot (free uptime monitoring)
**Status:** Not set up.
**Owner action — 5 mins:**
1. https://uptimerobot.com — free tier covers 50 monitors at 5-min intervals.
2. Add monitor for `https://divineguestlodge.co.za`.
3. Add an email alert contact.

---

## 9. Reviews aggregation
**Status:** JSON-LD schema currently lists three hand-coded reviews. No live source.
**Options:**
- Trustindex / Elfsight free tier — embeds Google reviews widget pulled from the GBP listing (depends on item 4 being done).
- Manual: keep the JSON-LD reviews in sync with real Google reviews quarterly.

---

## 10. Newsletter / lead capture (optional)
- Brevo or Mailerlite free tier, embed a form before the footer.
- Useful for repeat-stay marketing to past guests.

---

## 11. Room gallery image optimisation (perf round 2)
**Status:** Hero + logo done. Room/family/about/experience galleries still untouched (~4 MB total of 200–440 KB JPGs).
**Plan when revisiting:**
- Run the same sharp conversion script over `/images/deluxeRoom/`, `/images/familyRoom/`, `/images/about/`, `/images/experience/`, `/images/gallery/` to produce 800w/1200w AVIF + WebP variants.
- Update the `[data-bg]` loader in `js/app.js` (~line 25–52) to feature-detect AVIF/WebP support once on init, then rewrite `data-bg` URLs to the right variant before assigning. Falls back to JPG cleanly.
- Expected total page-weight reduction: ~2 MB → ~800 KB.

---

## Execution order suggested

1. Owner: items **4** (GBP) and **2** (GSC) — both can start today, GBP has the longest verification wait.
2. Owner: item **1** number, item **5** mail/DNS info → dev ships code.
3. Dev: items **6** headers and **3** Clarity once owner accounts/info are in.
4. Items **7, 8, 9, 10** as time allows.
