# Kinematics: pre-launch report

Prepared 2026-11-21. **Nothing has been deployed.** This report covers the four requested items, a full audit of the production build, and what remains before launch.

All measurements come from the production build served locally with the same routing, compression and byte-range behaviour as Vercel. Lighthouse 13 ran a median of 3 runs per page: mobile is simulated slow 4G with 4× CPU; desktop is Lighthouse's desktop preset. Raw data is in `reports/prelaunch.json`.

---

## 1. Changelog

### Item 1: Careers page image
- New 3D still: a GTA warehouse exterior. It has:
  - a navy **KINEMATICS** sign showing the current Motion K mark and the wordmark (canvas-drawn in Space Grotesk 700)
  - three dock doors, one open with pallets inside
  - an electric van (navy, teal stripe, plug icon) backed up to the open door
  - a second EV van at the parking chargers
- Built from the hero film's shared parts: same palette, lighting, Lambert materials, blob contact shadows and van model. No stock photos, no AI-generated images.
- Rendered at 2400×1350 (`npm run render:careers`). It builds the site with a hidden `/render/careers` page, captures it, then rebuilds without that page, so it never ships and never appears in the sitemap.
- Served through `astro:assets` as AVIF and WebP, 640 / 960 / 1280 / 1600 px wide, with `sizes`. AVIF ranges from 7 KB to 19 KB.
- It's the careers hero, set eager with high fetch priority because it's that page's LCP.
- Also the careers OG image (`/og/careers.png`, 1200×630).
- Alt text: "Kinematics warehouse in the GTA with an electric delivery van at the dock".
- `PHOTO_SHOTLIST.md` notes this render can be swapped for a real photo later.
- Files: `src/components/stills/CareersStill.tsx` (new), `src/pages/render/[still].astro` (new, dev-only), `scripts/render-careers.mjs` (new), `src/assets/careers/warehouse.png` (new), `public/og/careers.png` (new), `src/pages/careers/index.astro`, `package.json`, `PHOTO_SHOTLIST.md`.

### Item 2: Navigation
- "Careers" is removed from the header nav, desktop and mobile (both read from `HEADER_NAV`). It stays in the footer's Company column. Nothing else in the nav changed.
- Files: `src/config/site.ts`.

### Item 3: Audit fixes (design unchanged)
- **Get a quote, desktop: CLS 0.317 → 0** (Performance 84 → 100). The multi-step form's JavaScript collapsed steps 2–3 and swapped the submit button for "Next" after first paint. Pre-paint CSS now renders the enhanced state from the first frame for JS-capable browsers; without JS, every step and the submit button still show. Files: `src/styles/global.css`, `src/pages/get-a-quote.astro`.
- **Render-blocking CSS:** stylesheets are now inlined in each page (`inlineStylesheets: 'always'`). Mobile LCP improved:
  - Home 1.96 s → 1.81 s
  - Fulfillment 1.05 s → 0.78 s
  - Careers 1.05 s → 0.78 s

  The trade-off is about 16 KB gz of CSS per page instead of one cached file; that's worth it for first visits. File: `astro.config.mjs`.
- **Weakly linked job pages:** each job page now ends with an "Other open roles" list, so every role has several inbound links. File: `src/pages/careers/[slug].astro`.
- **Structured data:** the blog author and the job hiring organisation now include `url` and `logo`. File: `src/lib/schema.ts`.
- **Question-style H2s:** FAQ block headings on service, city and industry pages are now questions ("What do brands ask about…?"). Files: `src/pages/services/[slug].astro`, `src/pages/service-areas/[city].astro`, `src/pages/industries/[slug].astro`.
- **New repeatable audit tools:**
  - `npm run crawl`: link crawler plus sitemap, orphan, robots, 404 and routing checks
  - `npm run validate:schema`: validation against the official schema.org vocabulary
  - `npm run audit`: the existing SEO audit

### Item 4: Keywords and on-page
- Research, the keyword map and the on-page edits are summarised in §4, with full detail in `reports/KEYWORDS.md`.
- Two new posts: `/blog/best-shopify-fulfillment-company-canada` (1,024 words) and `/blog/small-business-warehousing-toronto` (928 words). Both have answer boxes, question H2s, FAQs with FAQPage schema, internal links and OG images.
- Files: `src/data/services.ts`, `src/data/cities.ts`, `src/pages/index.astro`, `src/pages/ev-delivery.astro`, `src/pages/integrations.astro`, `src/pages/how-it-works.astro`, `src/pages/careers/index.astro`, `src/pages/drive-with-us.astro`, `src/components/hero/HeroFilm.astro` (poster alt), `src/content/blog/how-to-choose-a-3pl-in-toronto.mdx`, `src/content/blog/shopify-fulfillment-in-canada.mdx`, two new posts, `scripts/generate-assets.mjs` (cover mapping).

---

## 2. Lighthouse and Core Web Vitals

| Page | Device | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| `/` | mobile | 100 | 100 | 100 | 100 | 1.80 s | 0 | 55 ms |
| `/` | desktop | 100 | 100 | 100 | 100 | 0.45 s | 0 | 20 ms |
| `/services/fulfillment` | mobile | 100 | 100 | 100 | 100 | 0.78 s | 0 | 72 ms |
| `/services/fulfillment` | desktop | 100 | 100 | 100 | 100 | 0.25 s | 0 | 0 ms |
| `/service-areas/toronto` | mobile | 100 | 100 | 100 | 100 | 0.78 s | 0 | 83 ms |
| `/service-areas/toronto` | desktop | 100 | 100 | 100 | 100 | 0.21 s | 0 | 0 ms |
| `/blog/how-to-choose-a-3pl-in-toronto` | mobile | 100 | 100 | 100 | 100 | 0.78 s | 0 | 32 ms |
| `/blog/how-to-choose-a-3pl-in-toronto` | desktop | 100 | 100 | 100 | 100 | 0.41 s | 0 | 0 ms |
| `/careers` | mobile | 100 | 100 | 100 | 100 | 0.78 s | 0 | 20 ms |
| `/careers` | desktop | 100 | 100 | 100 | 100 | 0.41 s | 0 | 0 ms |
| `/get-a-quote` | mobile | 100 | 100 | 100 | 100 | 0.78 s | 0 | 0 ms |
| `/get-a-quote` | desktop | 100 | 100 | 100 | 100 | 0.21 s | 0 | 0 ms |

**Result: 100 in all four categories on all six pages, mobile and desktop (12 of 12).**

**Core Web Vitals:**
- **LCP:** 0.78–1.81 s on mobile and 0.21–0.45 s on desktop, against a 2.5 s budget. Home mobile's LCP is the hero poster image.
- **CLS:** 0 on every page, against a 0.05 budget.
- **INP:** Lighthouse can't measure it in navigation mode. Measured with the Event Timing API on real interactions under 4× CPU throttling: worst event 32 ms on desktop with the 3D film running, 48 ms on mobile in video mode, 24 ms on the quote form. Budget 200 ms. The changes this round didn't touch interaction code.
- **TBT:** 0–83 ms.

**Detail audits:**
- **Image sizes and formats:** pass everywhere (responsive AVIF/WebP, correctly sized).
- **Unused CSS:** pass.
- **Unused JavaScript:** passes on every page except Home on desktop. There, Lighthouse flags about 110 KiB in the lazily loaded 3D film chunk, which loads after LCP and idle and is only partly executed during the trace. This is expected and doesn't affect scores.
- **Render-blocking resources:** CSS is now inline. Lighthouse still reports a small estimated saving (40–440 ms) on some runs for the font preloads and inline styles. That's within simulation noise, and every page scores 100.
- **Caching:**
  - `/_astro/*` (all JS, CSS, fonts, images) is immutable for one year, set by the Vercel adapter (verified in `.vercel/output/config.json`) and `vercel.json`.
  - `/media/*` videos are immutable and versioned (`-v2`).
  - Icons are cached for 7 days; OG images, `robots.txt`, the sitemap and RSS for 1 hour to 1 day.
  - HTML is always revalidated, so new deploys show immediately.
  - The local preview can't show Vercel's headers; confirm with `curl -I` after deploy (it's on the checklist).

**Page weight:** inner pages load 10.6 KB of JS with the page, plus about 49 KB of lazily loaded animation code. Home JS excluding 3D is about 124 KB, with the 3D chunks (219 KB) loaded separately on capable desktops only. The hero video is 2.36 MB (AV1) or 2.57 MB (H.264), and only one is downloaded. All are inside budget.

---

## 3. Audit results

### Technical SEO
| Check | Result |
|---|---|
| One H1 per page; title ≤ 60; meta description ≤ 155; canonical; `hreflang="en-CA"` + x-default; `lang="en-CA"` | **Pass**: 50 pages, 0 errors (`npm run audit`) |
| Broken links (crawler from "/", every page and asset fetched over HTTP) | **Pass**: 48 pages reachable, 65 assets, 0 broken |
| Orphan pages | **Pass**: none. `/thanks` is only reached after a form post and is intentionally noindex. Job pages were weakly linked: fixed |
| Sitemap | **Pass**: lists exactly the 48 indexable pages; excludes `/thanks` (noindex) and `/404`; every URL returns 200 |
| robots.txt | **Pass**: allows all, disallows `/api/` and `/thanks`, lists the sitemap |
| Redirects | **Pass**: Vercel config 308-redirects trailing-slash URLs to the canonical; the hidden render route isn't in the build |
| 404 | **Pass**: unknown URLs return HTTP 404 with the branded page |
| Structured data | **Pass**. Validated against the official schema.org vocabulary (1,016 types, 1,694 properties): every type and property is valid on its type, and Google's required fields are present for Organization, LocalBusiness, Service, FAQPage, BlogPosting, JobPosting and BreadcrumbList. Fixed: nested author and hiring-organisation details. **Left:** Google's Rich Results Test needs a public URL, so run it after deploy |

### GEO / AEO
| Check | Result |
|---|---|
| `llms.txt` current | **Pass**: generated from the same data at build; includes all 8 posts, services, cities, FAQ and the careers link; no hyphenated copy |
| 40–60 word direct answer at the top of every service and city page | **Pass**: enforced by `npm run audit` |
| Question-style H2s and FAQ blocks | **Pass**: every service and city page has FAQPage schema; all content H2s are questions (the only label headings are navigation blocks like "Keep exploring"). Fixed: FAQ titles |
| Consistent name, area served, email | **Pass**: one email everywhere (info@kinematicstech.ca); "Kinematics" / "Kinematics Technologies Inc." in all schema; the same five cities in every areaServed and in llms.txt |
| AI crawlers allowed | **Pass**: GPTBot, ClaudeBot, PerplexityBot, Google-Extended and others explicitly allowed |

### Accessibility (WCAG 2.1 AA)
| Check | Result |
|---|---|
| axe-core (WCAG 2.0/2.1 A + AA + best practice) on all 50 pages at 1280 px and 375 px | **Pass**: 0 violations across 100 page loads |
| Keyboard | **Pass**: skip link first; logical tab order; dropdowns open with Enter, Tab enters them, Escape closes and returns focus; mobile menu operable by keyboard |
| Visible focus | **Pass**: a 2 px+ outline on every focus stop tested |
| Contrast | **Pass**: no axe contrast violations; earlier contrast fixes still in place |
| Alt text | **Pass**: every image has alt (decorative card images use empty alt); the new careers image uses the requested text |
| Reduced motion | **Pass**: the hero shows the poster plus the static steps; no GSAP, 3D or video downloaded; reveals and tilt off |

### Content rules
| Check | Result |
|---|---|
| No hyphens or dashes in visible text | **Pass**: scan of all visible text, alt, labels and meta shows only allowed hyphens (code values, shot IDs, official names); 0 dashes |
| No prices or pay ranges | **Pass** |
| No invented stats, testimonials or awards | **Pass**: the proof components are still hidden behind flags |
| No Instagram or X links | **Pass** |
| Phone hidden until set | **Pass**: no phone in pages or schema |

### Cross-browser
Chrome and WebKit (Safari's engine) were tested in the last round. Headless Firefox can't start on this build machine, so **a manual Firefox check is still on the checklist**.

---

## 4. Keyword map summary

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

## 5. Remaining launch checklist (for you)

Full step-by-step instructions are in `LAUNCH_CHECKLIST.md`.

**Content you need to supply** (visible placeholders still on the site):
- [ ] **About page team cards:** "[Name]" and "[Founder & CEO]" style placeholders (4 cards). Add real names and roles, or I can hide the team section until photos and names exist.
- [ ] **Contact page hours:** "[Hours to be confirmed]".
- [ ] **Privacy policy:** Privacy Officer "[Name]" and three "[retention period to be confirmed]" items.
- [ ] **Accessibility statement:** "[response time to be confirmed]".
- [ ] **Blog dates:** posts are dated in November 2026; set them to the real publish dates.

**Domain and DNS**
- [ ] Add `kinematicstech.ca` and `www` in Vercel (www redirects to apex); set the A and CNAME records; wait for HTTPS.
- [ ] After deploy, check: `curl -I` shows security and cache headers; `/about/` 308-redirects to `/about`; a video responds with `Accept-Ranges`.

**Email (forms)**
- [ ] Verify `kinematicstech.ca` in Resend (or your chosen provider): **SPF, DKIM and DMARC** DNS records.
- [ ] Set the Vercel env vars (`EMAIL_PROVIDER`, `RESEND_API_KEY`, `EMAIL_TO`, `EMAIL_FROM`, `PUBLIC_SITE_URL`; optional Upstash for rate limiting).
- [ ] Send a test from each form (quote, contact, a careers application with a PDF, drive with us).

**Search engines**
- [ ] Google Search Console: verify the domain (DNS TXT), submit `https://kinematicstech.ca/sitemap-index.xml`, request indexing for the home, service and city pages.
- [ ] Run Google's Rich Results Test on a service page, a city page, a blog post and a job page.
- [ ] Bing Webmaster Tools: import from Search Console, submit the sitemap.

**Google Business Profile**
- [ ] Create or claim it as a service-area business (Toronto, Mississauga, Brampton, Vaughan, Markham). Use exactly "Kinematics" and the same email and website. Add the phone and hours once decided, so the NAP matches the site.

**Analytics**
- [ ] Choose Plausible or GA4 (`PUBLIC_ANALYTICS_PROVIDER` + ID), redeploy, confirm nothing loads before consent, and register the conversion events `quote_submit`, `contact_submit` and `apply_submit`.

**Legal**
- [ ] Lawyer review of `/privacy`, `/terms`, `/accessibility` and `/cookies` (each page carries a "Draft: have a lawyer review" marker); then remove the markers and update the dates. Also confirm the CASL consent wording.
- [ ] Ontario pay transparency: you chose not to show pay. Confirm with counsel whether the 25+ employee rule applies to you.

**Profiles and contact**
- [ ] **LinkedIn:** add the URL to `SITE.social` in `src/config/site.ts`. The link and icon appear automatically.
- [ ] **Phone:** add it to `SITE.phone` once decided. It appears automatically in the footer, contact, legal pages and schema.

**Final QA after deploy**
- [ ] Manual check in **Firefox** (desktop and Android) and **real Safari** (macOS and iOS): hero video or 3D, page transitions, forms.
- [ ] Re-run Lighthouse against production (`BASE=https://kinematicstech.ca RUNS=3 npm run lighthouse`).

---

## 6. Ready to launch?

**Technically: yes. As a public launch today: no, not until a few owner and legal items are done.**

**Why it's technically ready:**
- 100 in every Lighthouse category on all tested pages, mobile and desktop.
- Core Web Vitals well inside budget.
- 0 accessibility violations.
- Valid structured data, a clean sitemap, robots.txt, no broken links and no orphans.
- All content rules met.

**What blocks a public launch:**
1. **Visible placeholders:** team names on About, hours on Contact, privacy officer and retention periods on Privacy, response time on Accessibility. Visitors and Google would see bracketed text.
2. **Legal review** of the privacy, terms, accessibility and cookie pages has not happened.
3. **Form email isn't connected:** domain verification (SPF/DKIM/DMARC) and the API key are needed, or quote and contact submissions won't reach you.
4. **Domain and DNS** aren't set up yet.

Optional, and not blocking: LinkedIn URL, phone number, analytics, Google Business Profile (best done right after launch), and the manual Firefox and Safari pass.

Once items 1–4 are done, the site can go live. **I have not deployed anything and will wait for your go-ahead.**
