# Kinematics website

Production marketing site for **Kinematics Technologies Inc.**: 3PL fulfillment and EV-first next-day and same-day delivery across the GTA. *Commerce in motion.*

- **Astro 7** static site with TypeScript; React only for the homepage 3D island
- **Tailwind CSS 4** with brand tokens in `tailwind.config.mjs`
- **three.js + React Three Fiber + drei**, choreographed with **GSAP ScrollTrigger** and **Lenis**
- Blog and careers as **MDX content collections**
- Every page prerendered; one on demand route (`/api/submit`) for forms (Resend, Postmark or a webhook), served by a small **Node** server (`@astrojs/node`, standalone) on a **Hostinger Node.js web app**

See `DECISIONS.md` for why things are built the way they are, `LAUNCH_CHECKLIST.md` before going live, and `PHOTO_SHOTLIST.md` for the photo brief.

---

## Requirements

- Node **22.23.4 or newer** (developed on Node 24)
- npm 10 or newer

## Setup and run

```bash
npm ci                    # install exact dependency versions
cp .env.example .env      # then edit; EMAIL_PROVIDER=console logs form emails locally
npm run dev               # http://localhost:4321  (forms work here)
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload. The `/api/submit` form handler runs here too. |
| `npm run build` | Generates brand assets (favicons, OG images, blog covers), then builds static pages to `dist/client/` and the Node server to `dist/server/` (with Brotli/gzip copies of every text file). |
| `npm start` | Runs the production server: `node ./dist/server/entry.mjs`. Reads `PORT` and `HOST` from the environment. |
| `npm run preview` | Serves the production build at http://localhost:4321 with clean URLs and gzip. Static pages only; `/api` returns 501, so use `dev` for forms. |
| `npm run check` | Type-checks `.astro`, `.ts` and `.tsx` files. |
| `npm run audit` | Post-build audit: titles ≤ 60, descriptions ≤ 155, one H1, canonicals, alt text, broken internal links, JSON-LD validity and the 40–60 word answer on service and city pages. Exits 1 on errors. |
| `npm run lighthouse` | Lighthouse mobile on four key pages against `npm run preview`. Reports go to `lighthouse-reports/`. Use `RUNS=3` for medians, `PRESET=desktop` for desktop, `OUT=reports/x.json` to save a summary, `BASE=https://kinematicstech.ca` for production, and pass paths to choose pages. |
| `npm run assets` | Regenerates favicons, the manifest, OG images and blog covers only. |
| `npm run capture:hero` | Renders the hero film (the real 3D scene) to `public/media/hero-loop-v2.{mp4,webm}` and the poster `src/assets/hero/poster.png`. Needs `npm run preview` running. Add `-- --gif` for report previews. |
| `npm run render:careers` | Renders the careers hero still from the 3D scene (`src/components/stills/CareersStill.tsx`) to `src/assets/careers/warehouse.png` and the careers OG image. Builds with a hidden render page, then rebuilds without it. |
| `npm run crawl` | Crawls the running preview from "/": broken links and assets, orphan pages, sitemap coverage, robots.txt, 404 status, trailing slash redirect, compression and security headers. Run it against `npm start`. |
| `npm run validate:schema` | Validates all JSON-LD against the official schema.org vocabulary (download once to `.cache/schemaorg.jsonld`, see the script header). |
| `npm run weight` | Per-page gzip weight of HTML, initial JS, lazy JS, CSS and media from the build. Add `-- --json out.json`. |

A typical QA loop:

```bash
npm run check && npm run build && npm run audit
npm run preview &          # then, in another terminal:
RUNS=3 npm run lighthouse
```

## Environment variables

All of them are documented in `.env.example`. Summary:

| Variable | Purpose |
|---|---|
| `EMAIL_PROVIDER` | `resend` (default), `postmark`, `webhook` or `console` |
| `EMAIL_TO` / `EMAIL_FROM` | Recipient (`info@kinematicstech.ca`) and verified sender |
| `RESEND_API_KEY` / `POSTMARK_SERVER_TOKEN` / `FORM_WEBHOOK_URL` (+ `FORM_WEBHOOK_SECRET`) | Credentials for the chosen provider |
| `FORM_RATE_LIMIT`, `FORM_RATE_WINDOW_SEC` | Submissions allowed per IP per window (default 5 per 600 s) |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Optional shared rate limiter across serverless instances |
| `PUBLIC_SITE_URL` | Used for the form origin check |
| `PUBLIC_TRACKING_URL` | When set, `/track` submits `?tracking=…` there and the "launching soon" state disappears |
| `PUBLIC_ANALYTICS_PROVIDER` | `plausible`, `ga4` or `none`; loads only after cookie consent |
| `PUBLIC_PLAUSIBLE_DOMAIN`, `PUBLIC_PLAUSIBLE_SRC`, `PUBLIC_GA4_ID` | Analytics settings |

`PUBLIC_*` variables are baked in at build time, so redeploy after changing them.

## Project structure

```
src/
  config/site.ts            ← business details (NAP), feature flags, navigation. Edit this first.
  styles/global.css         ← Tailwind entry, font fallbacks, base and component styles
  layouts/                  ← BaseLayout (SEO, header, footer, consent), LegalLayout
  components/
    Logo.astro              ← <Logo variant="color|reversed|mono" wordmark size />
    seo/SEO.astro           ← title/meta/OG/Twitter/canonical/hreflang + JSON-LD @graph
    layout/                 ← Header, Footer, CookieBanner, Analytics
    illustrations/          ← art.ts (SVG illustration kit) + <Art scene="…" />
    story/                  ← ScrollStory.astro, StoryStage.tsx (gate), StoryScene.tsx (3D)
    forms/                  ← FormShell, fields, form-enhance.ts (progressive enhancement)
    ui/                     ← PageHero, FAQ, CtaBand, Related, Breadcrumbs, PhotoPlaceholder, Proof…
  data/                     ← services, industries, cities, faqs, story chapters (all page copy)
  content/
    blog/*.mdx              ← blog posts (+ covers/ generated SVGs)
    careers/*.mdx           ← job postings
  content.config.ts         ← typed frontmatter schemas
  lib/                      ← schema.ts (JSON-LD builders), forms, email providers, rate limit, blog helpers
  pages/                    ← routes (api/submit.ts is the only serverless function)
scripts/                    ← generate-assets, serve-static, audit-site, lighthouse
```

## Editing content

**Business details** (phone, hours, address, social links) live only in `src/config/site.ts`. Everything else, including the JSON-LD, reads from there.

**Services, industries and cities.** Edit `src/data/services.ts`, `industries.ts` and `cities.ts`. Each entry holds:

- the meta title (≤ 60) and description (≤ 155)
- the H1
- the **40–60 word answer** paragraph (AEO)
- question-style sections
- FAQs
- related links

Pages are generated from these entries, and `npm run audit` checks the limits.

### Adding a blog post

1. Create `src/content/blog/my-post-slug.mdx`. The file name becomes the URL (`/blog/my-post-slug`).
2. Frontmatter (validated by `src/content.config.ts`):

   ```yaml
   ---
   title: "The H1 of the post"
   seoTitle: "Optional <title> if the H1 is longer than ~48 chars | Kinematics"  # ≤ 60
   description: "Meta description, ≤ 155 characters."
   answer: "2–3 sentence direct answer shown at the top of the post (AEO)."
   published: 2026-12-01
   # updated: 2026-12-15
   category: delivery          # fulfillment | delivery | shopify | returns | sustainability
   cover: ./covers/my-post-slug.svg
   coverAlt: "Describe the cover image."
   relatedServices: ["final-mile-delivery", "fulfillment"]
   faqs:
     - q: "Question?"
       a: "Concise answer."
     - q: "Another question?"
       a: "Another answer."
   # draft: true               # hides it from production builds
   ---
   ```

3. Write the body in Markdown/MDX: use `##` and `###` question-style headings, and link to 2–3 service pages (for example `[final-mile delivery](/services/final-mile-delivery)`).
4. **Cover image:** either add `'my-post-slug': 'drive'` (any scene: `store`, `pack`, `sort`, `drive`, `deliver`, `return`, `hero`) to `COVER_SCENES` in `scripts/generate-assets.mjs`, or put your own SVG, PNG or JPG in `src/content/blog/covers/` and point `cover` at it.
5. `npm run build` creates the page, the OG image (`/og/blog/my-post-slug.png`), and the RSS, sitemap and `llms.txt` entries automatically.
6. Don't cite statistics unless you link a real, checkable source.

### Adding a job

1. Create `src/content/careers/role-slug.mdx`:

   ```yaml
   ---
   title: "Job title"
   summary: "One or two sentences (≤ 200 chars)."
   location: "Toronto, ON"
   city: "Toronto"
   department: "Warehouse"      # Operations | Delivery | Warehouse | Dispatch | Corporate
   employmentType: ["FULL_TIME"] # FULL_TIME | PART_TIME | CONTRACTOR | TEMPORARY
   published: 2026-12-01
   # validThrough: 2027-01-31
   existingVacancy: true
   open: true                    # set false to unpublish
   ---
   ```

2. Write the body with `## About the role`, `## What you'll do` and `## What we're looking for` sections.
3. The page at `/careers/role-slug` gets JobPosting schema and the apply form (with CV upload) automatically.

### Feature flags

`FLAGS` in `src/config/site.ts` controls the following. **Never switch a proof flag on with invented content.**

- `showTestimonials`, `showClientLogos`, `showStats`: keep proof sections hidden until real, verifiable content exists
- `trackingLive`: on automatically when `PUBLIC_TRACKING_URL` is set
- `shopifyAppLive`, `emissionsReportingLive`: replace the "coming soon" states
- `siteSearch`: emits `WebSite → SearchAction` only if a search page exists

## The 3D scroll story

- The copy for the six chapters lives in `src/data/story.ts` and is server-rendered with matching SVG frames.
- The 3D loads only on capable devices. It is skipped under reduced motion, Save-Data, ≤ 4 CPU cores, ≤ 2 GB memory, no WebGL, or a slow frame probe. Otherwise the SVG frames remain.
- The animation is one GSAP timeline in `StoryScene.tsx` (the `Director` component). Camera keyframes are in `KEYS`. Positions come from the `P`, `ROUTE` and `RETURN` constants.
- **Bundle guard:** `src/lib/three/slim.ts` lists the three.js classes R3F may use. If you add a new JSX element such as `<sphereGeometry>`, export its class there, or R3F will report it as not part of the THREE namespace.
- For debugging, the current timeline time is exposed as `data-t` on `#story`.

## Motion system

- **Tokens:** `src/lib/motion.ts` (durations, brand easing, reveal distances), mirrored as CSS variables in `global.css`.
- **CSS interactions:** `src/styles/motion.css` and the button and link rules in `global.css`. These cover hovers, focus, cards, icons and the dropdown, with no JS.
- **JS:** `src/scripts/motion/` holds three modules.
  - `index.ts` runs on every page.
  - `interactions.ts` handles magnet, ripple, tilt and the cursor dot.
  - `scroll.ts` (GSAP + ScrollTrigger + SplitText, lazy) handles reveals, route lines, parallax and city routes.
- **Opting in:** add `card-motion` to a card; `data-reveal` to any element that should rise in; `data-unmask` for a clip-path wipe; `data-parallax="0.2"` for parallax; `<Decor />` for floating cartons. H2s reveal word by word automatically.
- **Page scripts must use `onPage()`** from `src/scripts/lifecycle.ts`, because the site uses Astro View Transitions (`<ClientRouter />`).
- **Hero film:** `src/components/hero/` (`HeroFilm.astro` controller, `HeroScene.tsx` scene) and `src/data/hero.ts` (shots, captions, poster time). Force a mode with `?hero=3d|video|poster`. After editing the scene, re-run `npm run capture:hero` and bump `VIDEO_VERSION`.
- **Reduced motion:** everything respects `prefers-reduced-motion`. GSAP, video and 3D don't load, and content is never hidden.

## Deploying: GitHub, then Hostinger (Node.js web app)

The site runs as one small Node process. Every page is a prerendered static file; only `POST /api/submit` runs on the server.

**1. Push to GitHub.** Create an empty **private** repository (no README), then:

```bash
git remote add origin git@github.com:<account>/<repo>.git
git push -u origin main
```

**2. Create the app in Hostinger.** hPanel → **Websites → Add website → Node.js web app** → **Import Git repository**, connect GitHub and pick the repo and the `main` branch. Hostinger detects Astro; check the settings:

| Setting | Value |
| --- | --- |
| Framework | Astro |
| Node.js version | **24.x** (or 22.x, at least 22.23.4: Astro 7's minimum) |
| Install command | `npm ci` (leave the default if Hostinger does not ask) |
| Build command | `npm run build` |
| Output directory | `dist` |
| Entry file | `dist/server/entry.mjs` |
| Start command (if asked) | `npm start` |

**3. Environment variables** (hPanel → the app → Environment variables), copied from `.env.example`:
`EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_TO`, `EMAIL_FROM`, `PUBLIC_SITE_URL=https://kinematicstech.ca`, and optionally `PUBLIC_ANALYTICS_PROVIDER` and its ID. Hostinger sets `PORT` itself. Variables starting with `PUBLIC_` are baked in at build time, so **redeploy after changing them**.

**4. Deploy.** Every push to `main` rebuilds and redeploys automatically. If a build succeeds but the site does not answer, open the app's **Runtime logs** (a missing env var or the wrong port are the usual causes).

**What the server does** (`scripts/hosting/`): after `astro build`, an integration writes `.br` and `.gz` copies of every text file and makes `entry.mjs` load `server-hardening.mjs` first. That adds the security headers (HSTS, nosniff, referrer, frame and permissions policies), long cache headers for `/_astro`, `/media`, `/og` and icons, precompressed responses, and a 301 from `www` to the apex. `/about/` redirects to `/about`, and unknown URLs return the branded 404 with status 404.

Check locally exactly what will run in production:

```bash
npm run build
PORT=4321 npm start
BASE=http://localhost:4321 npm run crawl
```

Then follow `LAUNCH_CHECKLIST.md` to connect `kinematicstech.ca`, verify the email domain, submit the sitemap and set up Search Console, Bing and Google Business Profile.

## Performance budget and results

See `reports/FINAL_REPORT.md` for before/after Lighthouse (mobile + desktop), Core Web Vitals, weights and the full animation inventory. The current local production build scores 98–100 in every category on Home, a service page, a city page and a blog post, with CLS 0 everywhere.
