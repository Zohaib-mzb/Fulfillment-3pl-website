# Launch checklist

Work through this list top to bottom before pointing `kinematicstech.ca` at the site.

## 1. Replace the placeholders in the config

All business details live in **`src/config/site.ts`**. Search the repo for `[` to find any remaining placeholders.

- [x] `SITE.phone`: (437) 665 9457 (with `phoneE164` +14376659457). It then appears automatically in the footer, on contact and legal pages, as a `tel:` link and in Organization/LocalBusiness schema.
- [x] `SITE.hours`: Monday to Friday 9am to 6pm, Saturday 9am to 2pm, Sunday closed (Toronto time). Shown on `/contact`, in the footer and as `openingHoursSpecification`.
- [ ] `SITE.address.streetAddress` and `postalCode`: add them if the address is public (needed for strong LocalBusiness / Google Business Profile consistency). Otherwise leave them `null`.
- [ ] `SITE.social`: add the LinkedIn URL (the only social profile). While empty, the link and icon stay hidden and schema `sameAs` is omitted.
- [x] Privacy Officer (role only), retention periods and the accessibility response time are filled in.
- [x] About page: the team section is removed; no names, roles or portraits anywhere on the site.
- [ ] City pages: confirm the neighbourhood lists and same-day eligibility (`src/data/cities.ts`).
- [ ] Confirm the operational statements listed under "⚠ Confirm" in `DECISIONS.md`.
- [ ] Blog: set each post's `published` date to its real publish date.
- [ ] Keep the NAP (name, address, phone) **exactly identical** across the site, Google Business Profile, Bing Places and any directories.

## 2. Legal pages

- [x] `/privacy`, `/terms`, `/cookies` and `/accessibility` are complete, with no draft notes or placeholders.
- [ ] Set `LEGAL_EFFECTIVE_DATE` in `src/config/site.ts` to the actual deploy date (currently `2026-11-21`). It is shown as the "Effective date" on all four pages.
- [ ] Recommended: have counsel read the four pages once before launch, especially the retention periods, cross border storage and SMS notification wording.
- [ ] Keep the privacy policy's list of service providers true as tools change (hosting: Hostinger; email: Resend; analytics if enabled; routing and SMS tools when chosen).

## 3. Email and forms

- [ ] Create a Resend account and **verify `kinematicstech.ca`** (add the SPF, DKIM and DMARC DNS records Resend gives you).
- [ ] In hPanel → the Node.js app → Environment variables, set (copy from `.env.example`), then redeploy:
  - `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_TO=info@kinematicstech.ca`, `EMAIL_FROM="Kinematics Website <forms@kinematicstech.ca>"`
  - `PUBLIC_SITE_URL=https://kinematicstech.ca`
  - Nothing for `PORT` or `HOST`: Hostinger sets `PORT`, and the server binds to all interfaces
- [ ] Submit each form on production: **Get a quote, Contact, a Careers application (with a PDF), Drive with us.** Confirm the emails arrive, Reply-To is the submitter, and the CV is attached.
- [ ] Test with JavaScript disabled: each form should redirect to `/thanks`.

## 4. GitHub, Hostinger and the domain

- [ ] Create a private GitHub repository and push `main` (see README → Deploying).
- [ ] hPanel → Websites → Add website → **Node.js web app** → Import Git repository. Settings: Astro, Node 24.x, build `npm run build`, output `dist`, entry file `dist/server/entry.mjs`.
- [ ] Connect `kinematicstech.ca` to the app in hPanel. If the domain is registered elsewhere, point it at Hostinger with the nameservers or `A` record hPanel shows. Add `www.kinematicstech.ca` too: the server 301s `www` to the apex.
- [ ] Wait for the SSL certificate, then load `https://kinematicstech.ca` and `https://www.kinematicstech.ca` and check the redirect. Check `http://` redirects to `https://`.
- [ ] Check headers: `curl -I https://kinematicstech.ca/` should show `strict-transport-security`, `x-content-type-options` and `content-encoding: br` (send `-H 'Accept-Encoding: br'`); `curl -I https://kinematicstech.ca/_astro/<any>.js` should show `immutable`.
- [ ] Check that a trailing slash URL redirects: `curl -I https://kinematicstech.ca/about/` should return 301 to `/about`.
- [ ] Run `BASE=https://kinematicstech.ca npm run crawl` against production: no errors.

## 5. Google Search Console

- [ ] Add a **Domain property** for `kinematicstech.ca` and verify it with the DNS TXT record.
- [ ] Sitemaps → submit `https://kinematicstech.ca/sitemap-index.xml`.
- [ ] URL Inspection → request indexing for `/`, the four service pages and the five city pages.
- [ ] Run key pages through the **Rich Results Test** (FAQ, BlogPosting, JobPosting, Breadcrumb, LocalBusiness) and the **Schema Markup Validator** (validator.schema.org).
- [ ] After a week, check the Page indexing and Core Web Vitals reports.

## 6. Bing Webmaster Tools

- [ ] Sign in at bing.com/webmasters and **import the site from Google Search Console** (fastest), or verify via DNS.
- [ ] Submit `https://kinematicstech.ca/sitemap-index.xml`.
- [ ] Optional: enable IndexNow.
- [ ] Optional: claim the business in **Bing Places** with the identical NAP.

## 7. Google Business Profile

- [ ] Create or claim the profile at business.google.com for **Kinematics Technologies Inc.** (display name "Kinematics").
- [ ] If customers don't visit your premises, set it up as a **service-area business** and hide the street address.
- [ ] Primary category: the closest match to logistics/delivery (for example "Logistics service"). Add relevant secondary categories (for example "Courier service", "Warehouse").
- [ ] Service areas: Toronto, Mississauga, Brampton, Vaughan, Markham.
- [ ] Hours, phone and website: **identical** to `site.ts`. Website: `https://kinematicstech.ca`.
- [ ] Description: adapt the homepage value proposition (no prices, no unverifiable claims).
- [ ] Add real photos from `PHOTO_SHOTLIST.md` once they are available.
- [ ] Complete verification (video, postcard or phone, depending on what Google offers).

## 8. Submit and monitor the sitemap

- [ ] Sitemap index: `https://kinematicstech.ca/sitemap-index.xml` (submitted in both GSC and Bing).
- [ ] Also check `https://kinematicstech.ca/robots.txt`, `https://kinematicstech.ca/llms.txt` and `https://kinematicstech.ca/rss.xml` load.

## 9. Analytics and consent

- [ ] Choose a provider: set `PUBLIC_ANALYTICS_PROVIDER=plausible` (plus `PUBLIC_PLAUSIBLE_DOMAIN`) or `ga4` (plus `PUBLIC_GA4_ID`), then redeploy.
- [ ] Check that **nothing** loads before "Accept analytics" (DevTools → Network), and that it loads after accepting.
- [ ] Submit a test quote and contact form after accepting, and confirm the `quote_submit`, `contact_submit` and `apply_submit` events appear. In Plausible, add them as Goals; in GA4, mark them as Key events.

## 10. Final QA

- [ ] `npm run check && npm run build && npm run audit`: no errors.
- [ ] Lighthouse (mobile) on production for `/`, a service page, a city page and a blog post: all four categories ≥ 90.
- [ ] Keyboard-only pass through the header menus, mobile menu, quote form and cookie banner.
- [ ] Screen-reader spot check (VoiceOver on macOS/iOS, or NVDA on Windows) of the homepage story and the quote form.
- [ ] Turn on "Reduce motion" in the OS and confirm the homepage shows the static story frames.
- [ ] Test the homepage on a mid-range Android phone and an iPhone (hero video autoplay, 3D story, scroll smoothness).
- [ ] **Manual Firefox pass** (desktop + Android): hero 3D/video, reveals, page navigation. Headless Firefox couldn't run in the build environment; see `reports/FINAL_REPORT.md` §7.
- [ ] Real Safari (macOS + iOS): hero video plays inline and muted, the pause button works, View Transitions behave.
- [ ] Hero video: `curl -I https://kinematicstech.ca/media/hero-loop-v2.mp4` shows `Accept-Ranges: bytes` and an immutable cache header.
- [ ] Check the 404 page: `https://kinematicstech.ca/does-not-exist`.
- [ ] If you are replacing an older site, add 301 redirects for its URLs under `redirects` in `astro.config.mjs`.

## 11. Later (feature flags in `src/config/site.ts`)

- [ ] Tracking backend ready: set `PUBLIC_TRACKING_URL` (this switches on `FLAGS.trackingLive`).
- [ ] Shopify app published: set `FLAGS.shopifyAppLive = true` and update the copy on `/integrations`.
- [ ] Emissions reporting live: set `FLAGS.emissionsReportingLive = true` and publish the method.
- [ ] Real testimonials, logos or stats with permission and sources: add them to `<Proof>` and switch on the matching flag.
