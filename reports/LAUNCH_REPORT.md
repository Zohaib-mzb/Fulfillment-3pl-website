# Kinematics: launch report

Prepared 2026-11-21. The code is pushed to GitHub (`Zohaib-mzb/Fulfillment-3pl-website`, branch `main`). **The Hostinger app is not created yet**; follow `DEPLOY_HOSTINGER.md` to put the site live.

Every measurement in this report comes from the **production server itself** (`npm run build`, then `npm start`, which runs `node ./dist/server/entry.mjs`), served locally. That is the same server, compression and headers Hostinger will run. Lighthouse 13 ran one pass per page: mobile uses simulated slow 4G with 4× CPU; desktop uses Lighthouse's desktop preset. Raw data is in `reports/launch.json` and `reports/launch-desktop.json`.

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
- [ ] **Phone number:** add it to `SITE.phone` and push. It appears automatically in the footer, on the Contact and legal pages, and in schema. Add the same number to the Google Business Profile.
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
