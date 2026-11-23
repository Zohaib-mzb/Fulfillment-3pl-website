# Kinematics: launch report

Prepared 2026-11-21. The code is pushed to GitHub (`Zohaib-mzb/Fulfillment-3pl-website`, branch `main`). **The Hostinger app is not created yet**; follow `DEPLOY_HOSTINGER.md` to put the site live.

Every measurement in this report comes from the **production server itself** (`npm run build`, then `npm start`, which runs `node ./dist/server/entry.mjs`), served locally. That is the same server, compression and headers Hostinger will run. Lighthouse 13 ran one pass per page: mobile uses simulated slow 4G with 4× CPU; desktop uses Lighthouse's desktop preset. Raw data is in `reports/launch.json` and `reports/launch-desktop.json`.

---

**2026-11-23, email fallback and MCP:** if /api/submit fails (for example, Resend isn't configured), forms now show "Almost done: send this from your email" with Gmail, mail app and copy options. The page also registers 5 read-only WebMCP tools in an inline script (2 KB, only runs where `navigator.modelContext` exists), and the same tools are served from a read-only MCP server at `/mcp` (rate and size limited), described by `/.well-known/mcp/server-card.json`. Both are listed in llms.txt and the Link header. Home mobile Lighthouse: 99 (TBT 101 ms in a single run).

**2026-11-23, agent readiness (Hostinger check items 1 to 6; item 7, the MCP Server Card, skipped on purpose):** robots.txt now has `Content-Signal: search=yes, ai-input=yes, ai-train=yes` in the `User-agent: *` group. All 50 sitemap URLs carry an ISO 8601 `<lastmod>`: blog posts use their frontmatter dates, other pages the git date of their source. `sameAs` is wired to `SITE.socials.linkedin` and `SITE.googleBusinessProfile`; both are empty, so it is not output yet. Every indexable page has a Markdown twin at `/page.md`, which is listed in llms.txt and also served from the page URL when `Accept` prefers `text/markdown`. Both versions send `Vary: Accept`. Every HTML page sends a `Link` header (llms.txt and its .md), and the head has a matching `<link rel="alternate" type="text/markdown">`. The quote and tracking forms carry WebMCP attributes, with no script and no autosubmit. The home canonical also had a bug, pointing at `/index`; it now points at `/`.
- **Live check through Hostinger's CDN:** curl with `Accept: text/markdown` gets Markdown on `/`, `/services/fulfillment` and `/about`. Normal browser Accept headers, no Accept header and real Chrome loads all get HTML, including straight after a Markdown request to the same URL. Pages come back as `DYNAMIC`, meaning the CDN does not cache them, so there is no cache mixing and content negotiation stays.
- **Local checks:** build, audit, crawl (with new checks for these features), schema validation, axe (0 violations in 104 loads) and astro check all pass. Home scores 100 in all four Lighthouse categories on both mobile and desktop.
- **Commits:** `93c2e67`, `9333fea`. See DECISIONS.md, "Agent readiness round".

**2026-11-23, hero video on phones:** phones now get a 480p H.264 loop (1.35 MB instead of 2.5 MB AV1) that starts right after the poster paints. That cut time to first frame from 2.3–2.5 s to about 1.7 s on emulated slow 4G (locally), and it is verified live on kinematicstech.ca: 854×480 served from the CDN and playing (commit `5334ed0`).

## 0. Update: positioning, services and phone (2026-11-21)

A copy and content update. Design, animations and page structure are unchanged, apart from the two grid tweaks and one bug fix noted below.

**Phone:** (437) 665 9457, set once in `src/config/site.ts` (`phone` for display, `phoneE164` `+14376659457` for links and schema). It is a `tel:` link in:
- the mobile menu ("Call (437) 665 9457"); the desktop header has no room, as screenshots at 1280 and 1536 px showed the nav wrapping;
- the footer and the Contact page;
- the privacy, terms and accessibility pages and every city page;
- the Final Mile Delivery Drivers job ("or call us").

It is also in the Organization and LocalBusiness schema (`telephone`, E.164) and in llms.txt.

**Positioning:** "3PL, fulfillment and same day final mile delivery across the GTA." (`SITE.mainLine`); the tagline is still "Commerce in motion.".
- **Updated:** hero eyebrow, subline and highlights (same day first); home title and meta; the services overview; Why Kinematics; the footer descriptor; the About intro and meta; Organization and LocalBusiness descriptions; the OG image kicker and footer line; the web manifest; llms.txt; the FAQ intro; How it works.
- **City pages** now mention same day before next day.

**Services:**
- **Order:** Same day delivery (lead), Next day delivery, Rush and scheduled delivery, B2B and retail delivery, Warehousing and fulfillment, Returns. It is the same in the Services menu, footer, homepage cards, sidebars, Related blocks and the 404 page.
- **New pages:** `/services/rush-scheduled-delivery` and `/services/b2b-retail-delivery`. Each has a 40 to 60 word answer, question headings, an FAQ, Service and FAQPage schema, and breadcrumbs, and is in the sitemap (50 indexable pages).
- **`/services/same-day-delivery`:** rewritten as the lead service, with the cutoff "order by late morning, delivered the same day" (no exact times), a new "same day courier for businesses" section, and no minimum volume.
- **`/services/fulfillment`** (now "Warehousing and fulfillment"): pallet and shelf storage, inventory counts, overflow and Q4 peak storage, and an Amazon FBA prep and labelling section (no new page).
- **Everywhere:** live SMS and email tracking, photo proof and signature on request. Our shipping labels and the daily manifest are on Integrations and in the FAQ.
- **API:** now shows "coming soon" everywhere. WooCommerce and BigCommerce stay as supported, as you confirmed.
- **No minimum volume:** on the homepage, every service FAQ, the footer and llms.txt, worded positively.
- **FAQ:** new questions on the same day cutoff, minimum volume, rush delivery, scheduled windows, FBA prep and how labels work. The homepage FAQ now features the cutoff and minimum volume questions.

**Layout tweaks:** the homepage service cards (6) and Why Kinematics cards (6) now use 3 columns on desktop instead of 4 and 5, so there are no orphan cards. Spacing, styles and motion are unchanged.

**Bug fix (existing):** the mobile menu panel opened at 1 px tall, so the menu was effectively invisible on phones. The header's blur effect made the header the containing block for the fixed panel. The fix sets the panel's height from the viewport; the menu looks exactly as designed. This bug was also in the version already on GitHub.

**Research and SEO:**
- `reports/COMPETITOR_GAPS.md`: a gap table covering GoBolt, Apple Express, Intelcom, UniUni, Stallion Express, Purolator and ShipHype, for structure and features only. No competitor is named on the site.
- `reports/KEYWORDS.md`: a new positioning section. Home's primary is "3PL and same day delivery Toronto". Same day delivery Toronto/GTA, same day courier for businesses, rush, scheduled, B2B delivery GTA, Amazon FBA prep Toronto and fulfillment and delivery Toronto (About) are assigned, with one unique primary per page.

**Checks** (production server, `npm start`):

| Check | Result |
| --- | --- |
| `astro check` | 0 errors |
| `npm run audit` | 52 pages, 0 errors (titles, descriptions, H1s, 40 to 60 word answers) |
| `npm run validate:schema` | 0 errors (22 Service nodes, 115 Q&A, telephone valid) |
| `npm run crawl` | 50 pages reachable, 0 broken links, 0 orphans, sitemap 50 indexable pages, redirects and headers OK |
| axe (WCAG 2.1 AA) | 0 violations, 104 page loads (desktop + mobile) |
| Content scan | no dashes or hyphens in visible copy (only URLs and code), no prices or pay, no competitor names, no invented stats |

| Page | Device | Perf | A11y | BP | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| `/` | mobile | 100 | 100 | 100 | 100 | 1.81 s | 0 | 51 ms |
| `/` | desktop | 100 | 100 | 100 | 100 | 0.42 s | 0 | 47 ms |
| `/services/same-day-delivery` | mobile | 100 | 100 | 100 | 100 | 0.78 s | 0 | 70 ms |
| `/services/same-day-delivery` | desktop | 100 | 100 | 100 | 100 | 0.25 s | 0 | 0 ms |
| `/services/fulfillment` | mobile | 100 | 100 | 100 | 100 | 0.78 s | 0 | 87 ms |
| `/services/fulfillment` | desktop | 100 | 100 | 100 | 100 | 0.21 s | 0 | 0 ms |
| `/contact` | mobile | 100 | 100 | 100 | 100 | 0.78 s | 0 | 0 ms |
| `/contact` | desktop | 100 | 100 | 100 | 100 | 0.21 s | 0 | 0 ms |

**About home mobile transfer:** Lighthouse counted 2.6 MB this run because the hero video (about 2.4 MB) finished loading inside the trace. By design the video starts only after LCP and the page is idle. Earlier runs stopped before it finished (20 KB, then 306 KB). Video loading didn't change this round; LCP and scores are unaffected. Raw data: `reports/positioning.json` and `reports/positioning-desktop.json`.

**Remaining checklist update:** the phone number is now done. Add it to the Google Business Profile so the NAP matches the site.

---

## 1. Changelog (launch round)

### About page
- The team section is removed: no names, roles or portraits anywhere on the site. `FLAGS.showTeamPhotos` and the TEAM shots in `PHOTO_SHOTLIST.md` are gone too.
- The page is rewritten as a company page:
  - **Who Kinematics is:** a Toronto fulfillment and final mile delivery company for growing brands.
  - **How we work, from store to doorstep:** eight steps, each linking to its detail page. Connect your store; send stock or print our label; we receive; we store; we pick and pack; we sort by postal zone; we deliver next day or same day with tracking and photo proof; we handle returns.
  - **Why we are EV first:** worded to match the EV delivery page, with no emissions figures.
  - **What we value:** reliability, clear communication, and visibility from shelf to doorstep.
  - **Why we started:** big carrier service without big carrier minimums.
- No invented stats, claims or history, and no hyphens or dashes. The mission and "Toronto roots" panels and the CTA are kept.

### Contact hours
- **Hours:** Monday to Friday 9am to 6pm, Saturday 9am to 2pm, Sunday closed (Toronto time). They are stored once, in `SITE.hours`.
- **Where they show:** on the Contact page and in the footer of every page.
- **Schema:** added to LocalBusiness as `openingHoursSpecification` (Sunday omitted, which schema.org reads as closed).

### Legal pages (privacy, terms, cookies, accessibility)
- Complete and final: every "Draft / lawyer review" note and every placeholder is removed.
- **Effective date** on each page: 21 November 2026, from `LEGAL_EFFECTIVE_DATE` in `src/config/site.ts`.
- **Contact:** the role "Privacy Officer, Kinematics Technologies Inc." only, no personal name. People are pointed to info@kinematicstech.ca and the contact page.
- **Privacy policy:** written for PIPEDA and Ontario and covers:
  - website visitors, merchants (business contacts and account data), recipients (name, address, phone, email, delivery notes, delivery photos, signatures), job applicants, and driver location during routes;
  - SMS and email delivery notifications;
  - cookies and analytics only after consent;
  - purposes, and recipient data handled on behalf of the merchant who shipped the parcel;
  - sharing (merchants and service providers; never sold), and storage outside Canada, including the US;
  - safeguards, and breach notification under PIPEDA;
  - **retention:** quote and contact data 24 months, job applications 12 months, delivery photos 90 days, tracking and delivery records 24 months;
  - rights (access, correction, withdrawing consent, complaints to the OPC);
  - CASL (consent only, unsubscribe in every email), children, and changes.
- **Terms of use:** website use, the quote form is not a binding offer, tracking provided as is, intellectual property, links, limitation of liability, Ontario law, changes and contact.
- **Cookies:** necessary and analytics categories, and how to change consent (the Cookie settings button).
- **Accessibility:** the AODA and WCAG 2.1 AA commitment, feedback and accessible formats, and a **response within 5 business days**.
- **Research:** structure was checked against how Canadian carriers organize these pages. All wording is original, and no competitor is named anywhere on the site.

### Node / Hostinger switch
- `@astrojs/vercel` and `vercel.json` are removed. `@astrojs/node` runs in **standalone** mode.
- Every page is still prerendered. Only `/api/submit` runs on demand (`prerender = false`).
- `npm start` runs `node ./dist/server/entry.mjs`, which reads `PORT` and `HOST`. By default it listens on all interfaces, so Hostinger's proxy can reach it.
- `security.allowedDomains` (the apex and www) lets Astro trust Hostinger's forwarded host and protocol for its origin check. Verified: a same-origin post through a simulated proxy returns 200 (or 303 without JavaScript), and a foreign origin returns 403.
- `satori` and `@resvg/resvg-js` moved to `dependencies`. A **clean install with dev packages omitted** builds and crawls with 0 errors.
- New docs: `DEPLOY_HOSTINGER.md` (step by step) and updated `README.md`, `LAUNCH_CHECKLIST.md`, `DECISIONS.md` and `.env.example`.

### Compression and headers
- The Node server on its own sends files uncompressed and sets few headers. A build step (`scripts/hosting/`) fixes this inside the same `entry.mjs`:
  - **Brotli and gzip** copies of every text file are written at build time and served when the browser accepts them. Home HTML goes from 226 KB to 31 KB over the wire; 101 files total 7.9 MB raw and 1.3 MB Brotli.
  - **Security headers:** HSTS (2 years, preload), `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`.
  - **Cache rules:**
    - `/_astro` and `/media` are immutable for 1 year;
    - icons are cached for 7 days;
    - OG images for 1 day;
    - `robots.txt`, the sitemap, RSS and `llms.txt` for 1 hour;
    - HTML is always revalidated;
    - `/api` is `no-store`.
  - **Redirects:** `www` → apex 301, and `/path/` → `/path` 301.
  - Weak ETags and 304 responses are supported. Byte ranges for the hero video still work (206).

---

## 2. Lighthouse and Core Web Vitals (production server)

| Page | Device | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT | Transfer |
|---|---|---|---|---|---|---|---|---|---|
| `/` | mobile | 100 | 100 | 100 | 100 | 1.81 s | 0 | 49 ms | 482 KB |
| `/` | desktop | 100 | 100 | 100 | 100 | 0.42 s | 0 | 45 ms | 418 KB |
| `/about` | mobile | 99 | 100 | 100 | 100 | 0.78 s | 0 | 96 ms | 164 KB |
| `/about` | desktop | 100 | 100 | 100 | 100 | 0.21 s | 0 | 0 ms | 164 KB |
| `/contact` | mobile | 100 | 100 | 100 | 100 | 0.78 s | 0 | 2 ms | 164 KB |
| `/contact` | desktop | 100 | 100 | 100 | 100 | 0.21 s | 0 | 0 ms | 164 KB |
| `/privacy` | mobile | 100 | 100 | 100 | 100 | 0.75 s | 0 | 76 ms | 164 KB |
| `/privacy` | desktop | 100 | 100 | 100 | 100 | 0.21 s | 0 | 0 ms | 164 KB |
| `/careers` | mobile | 100 | 100 | 100 | 100 | 0.78 s | 0 | 34 ms | 173 KB |
| `/careers` | desktop | 100 | 100 | 100 | 100 | 0.45 s | 0 | 0 ms | 169 KB |
| `/get-a-quote` | mobile | 100 | 100 | 100 | 100 | 0.78 s | 0 | 46 ms | 164 KB |
| `/get-a-quote` | desktop | 100 | 100 | 100 | 100 | 0.25 s | 0 | 0 ms | 164 KB |

**Result:** 100 in all four categories on all six pages, mobile and desktop, except About mobile Performance at 99 (TBT 96 ms in that run; single run noise).

**Core Web Vitals:**
- **LCP:** 0.75–1.81 s on mobile and 0.21–0.45 s on desktop, against a 2.5 s budget. Home mobile's LCP is the hero poster image.
- **CLS:** 0 on every page, against a 0.05 budget.
- **INP:** not measurable in Lighthouse navigation mode. Interaction code is unchanged since the last measurement (worst event 48 ms on mobile, against a 200 ms budget).
- **TBT:** 0–96 ms.

**Caching and compression:** verified with `curl` against `npm start`:
- `content-encoding: br` on HTML, JS, CSS, SVG, XML and TXT;
- `immutable` on `/_astro` and `/media`;
- a 206 on video range requests;
- 304 on a repeat request with `If-None-Match`.

Check the same on production after deploy (Part 2 of `DEPLOY_HOSTINGER.md`).

---

## 3. Audit results

### Technical SEO
| Check | Result |
|---|---|
| One H1 per page; title ≤ 60; meta description ≤ 155; canonical; `hreflang="en-CA"` + x-default; `lang="en-CA"` | **Pass**: 50 pages, 0 errors (`npm run audit`) |
| Broken links (crawler from "/", every page and asset fetched over HTTP from the production server) | **Pass**: 48 pages reachable, 62 assets, 0 broken |
| Orphan pages | **Pass**: none. `/thanks` is only reached after a form post and is intentionally noindex. |
| Sitemap | **Pass**: lists exactly the 48 indexable pages; excludes `/thanks` (noindex) and `/404`; every URL returns 200 |
| robots.txt | **Pass**: allows all, disallows `/api/` and `/thanks`, lists the sitemap |
| Redirects | **Pass**: the Node server 301-redirects trailing slash URLs and `www` to the canonical; the hidden render route isn't in the build |
| 404 | **Pass**: unknown URLs return HTTP 404 with the branded page |
| Structured data | **Pass**. Validated against the official schema.org vocabulary (1,016 types, 1,694 properties): every type and property is valid on its type, and Google's required fields are present for Organization, LocalBusiness, Service, FAQPage, BlogPosting, JobPosting and BreadcrumbList. LocalBusiness now includes `openingHoursSpecification` (14 nodes, valid). **Left:** Google's Rich Results Test needs a public URL, so run it after deploy |

### GEO / AEO
| Check | Result |
|---|---|
| `llms.txt` current | **Pass**: generated from the same data at build; includes all 8 posts, services, cities, FAQ and the careers link; no hyphenated copy |
| 40–60 word direct answer at the top of every service and city page | **Pass**: enforced by `npm run audit` |
| Question-style H2s and FAQ blocks | **Pass**: every service and city page has FAQPage schema; all content H2s are questions (the only label headings are navigation blocks like "Keep exploring"). |
| Consistent name, area served, email | **Pass**: one email everywhere (info@kinematicstech.ca); "Kinematics" / "Kinematics Technologies Inc." in all schema; the same five cities in every areaServed and in llms.txt |
| AI crawlers allowed | **Pass**: GPTBot, ClaudeBot, PerplexityBot, Google-Extended and others explicitly allowed |

### Accessibility (WCAG 2.1 AA)
| Check | Result |
|---|---|
| axe-core (WCAG 2.0/2.1 A + AA + best practice) on all 50 pages at 1280 px and 375 px | **Pass**: 0 violations across 100 page loads |
| Keyboard | **Pass**: skip link first; logical tab order; dropdowns open with Enter, Tab enters them, Escape closes and returns focus; mobile menu operable by keyboard |
| Visible focus | **Pass**: a 2 px+ outline on every focus stop tested |
| Contrast | **Pass**: no axe contrast violations, including the new About sections and footer hours |
| Alt text | **Pass**: every image has alt (decorative card images use empty alt); the careers image uses the requested text |
| Reduced motion | **Pass**: the hero shows the poster plus the static steps; no GSAP, 3D or video downloaded; reveals and tilt off |

### Content rules
| Check | Result |
|---|---|
| No hyphens or dashes in visible text | **Pass**: scan of all visible text, alt, labels and meta shows only allowed hyphens (code values, shot IDs, official names); 0 dashes |
| No prices or pay ranges | **Pass** |
| No invented stats, testimonials or awards | **Pass**: the proof components are still hidden behind flags |
| No Instagram or X links | **Pass** |
| Phone hidden until set | **Pass**: no phone in pages or schema |
| No people named | **Pass**: team section removed; no names, roles or portraits anywhere |
| No placeholders or draft notes | **Pass**: scan of all built HTML finds no `[bracketed]` placeholders and no draft or lawyer review markers |

### Cross-browser
Chrome and WebKit (Safari's engine) were tested in the last round. Headless Firefox can't start on this build machine, so **a manual Firefox check is still on the checklist**, together with real Safari on macOS and iOS.

---

Re-run this round, all against the production server: `astro check` 0 errors; `npm run audit` 50 pages, 0 errors; `npm run validate:schema` 0 errors; `npm run crawl` 0 errors; axe 0 violations across 100 page loads.

---

## 4. Keyword map summary (unchanged this round)

Full detail, sources and estimates are in `reports/KEYWORDS.md`. Volumes are estimates: no Keyword Planner or SEO-tool access was available. Evidence comes from Google autocomplete (Canada) and live SERP review.

| Page | Primary keyword | Difficulty |
|---|---|---|
| / | 3PL GTA | Medium |
| /services/fulfillment | 3PL Toronto | High |
| /services/final-mile-delivery | last mile delivery Toronto | High |
| /services/same-day-delivery | same day delivery Toronto | High |
| /services/returns | ecommerce returns management Canada | Medium |
| /ev-delivery | EV delivery Toronto | Low |
| /integrations | 3PL for Shopify Canada | High |
| /how-it-works | how 3PL fulfillment works | Medium |
| /service-areas/toronto | ecommerce delivery Toronto | Medium |
| /service-areas/mississauga | next day delivery Mississauga | Medium |
| /service-areas/brampton | same day delivery Brampton | Medium |
| /service-areas/vaughan | last mile delivery Vaughan | Low |
| /service-areas/markham | ecommerce delivery Markham | Low |
| /blog/how-to-choose-a-3pl-in-toronto | best 3PL in Toronto (honest checklist) | High |
| /blog/best-shopify-fulfillment-company-canada (new) | best fulfillment company for Shopify Canada | High |
| /blog/small-business-warehousing-toronto (new) | warehousing Toronto small business | Low |
| /careers | logistics jobs Toronto | Medium |

**Approach:**
- Head terms stay as primaries for relevance, but early wins will come from city long tails, EV and returns terms, and honest guides.
- No page claims "best".
- Facility-specific queries such as "pallet storage Mississauga" and "fulfillment centre Mississauga" are not targeted, because they would imply a facility we can't confirm. Brampton and Vaughan storage terms use honest wording: stock held at our Toronto area warehouse.
- Four more post ideas are listed in KEYWORDS.md.

---

---

## 5. Remaining checklist

**To go live:** follow `DEPLOY_HOSTINGER.md` in this order:
1. create the web app from GitHub;
2. connect the domain and SSL;
3. set up Resend (SPF, DKIM, DMARC) and the environment variables;
4. test every form;
5. check the sitemap and robots;
6. run the Rich Results Test;
7. submit to Search Console and Bing.

**Still open after launch:**
- [ ] **LinkedIn link:** add the URL to `SITE.social` in `src/config/site.ts` and push. The link and icon appear in the footer, and in schema `sameAs`, automatically.
- [x] **Phone number:** (437) 665 9457 is live in config, pages and schema. Use the same number on the Google Business Profile.
- [ ] **Analytics:** choose Plausible or GA4. Set `PUBLIC_ANALYTICS_PROVIDER` and its ID in hPanel, then **redeploy**. Confirm nothing loads before consent, and register `quote_submit`, `contact_submit` and `apply_submit` as goals or key events.
- [ ] **Manual Firefox and Safari check:** Firefox on desktop and Android, and real Safari on macOS and iOS. Check the hero video or 3D, page transitions and every form.
- [ ] **Google Business Profile:** a service area business (Toronto, Mississauga, Brampton, Vaughan, Markham). Use the same name, hours and website as the site. Steps are in `DEPLOY_HOSTINGER.md` §4.6.

**Recommended:**
- [ ] Have counsel read the four legal pages once.
- [ ] Set each blog post's `published` date to its real date.
- [ ] Tighten DMARC to `p=quarantine` after 2 to 4 weeks of clean reports.
- [ ] Re-run Lighthouse against production: `BASE=https://kinematicstech.ca RUNS=3 npm run lighthouse`.

---

## 6. Ready to launch?

**Yes.** The earlier blockers are cleared: no visible placeholders, no team section, final legal pages, and the code is on GitHub with a working Hostinger setup. The site goes live when you complete `DEPLOY_HOSTINGER.md`. Forms deliver email once Resend is verified and `RESEND_API_KEY` is set.
