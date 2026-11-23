# Decisions log

Choices made while building the Kinematics site, with the reason for each. Items marked **⚠ Confirm** need a business answer before launch. Items marked **❓ Ask** might conflict with the brief, so I have not acted on them.

## Open questions

1. **Decided: no pay ranges.** The owner chose not to show pay anywhere (pages or schema). Ontario's Working for Workers Act requires pay ranges in public postings for employers with 25+ employees; revisit if that threshold applies.

## Stack

| Choice | Why |
|---|---|
| Astro 7.4 (static output) + `@astrojs/node` (standalone) | Every page is prerendered; only `/api/submit` runs on demand (`prerender = false`). Hosted as a Hostinger Node.js web app (see "Launch round"). |
| Tailwind CSS 4.3, tokens in `tailwind.config.mjs` loaded with `@config` | The brief asks for tokens in `tailwind.config`. Tailwind v4 is CSS-first, and `@config` keeps the JS token file as the single source. |
| TypeScript 6 (not 7) | `@astrojs/check` supports TS ≤ 6. TS 7 (the native compiler) would break `astro check`. |
| React 19 only inside the 3D island | Every other page ships zero framework JS. The header, forms, cookie banner and tracking use small vanilla scripts. |
| three r187, @react-three/fiber 9.8, drei 10.7, GSAP 3.15 + ScrollTrigger, Lenis 1.3 | As specified. |
| `build.format: 'file'` | Pages are emitted as `path.html` and served at clean URLs. With `trailingSlash: 'never'`, the server 301-redirects `/path/` to `/path`. Canonicals never have a trailing slash. |

## Information architecture and copy

- The site map follows the brief, which already mirrors the competitor information architecture (services, industries, how it works, sustainability, integrations, service areas, tracking, quote, careers, drivers, resources). No competitor text, imagery, layout or logos were used, and no competitor is named anywhere.
- *Canada Post* appears only in the blog post you asked for ("Canada Post alternatives…"). It is written neutrally and notes Canada Post's strengths. No other carriers are named.
- There is no `/services` hub page because it isn't in the site map. Service breadcrumbs are **Home → Service**.
- I added `/service-areas` and `/industries` hub pages (both in your table), plus `/thanks` (noindex) for no-JS form submissions.
- All copy is original and qualitative. There are no statistics, client names, testimonials, awards, years in business or fleet sizes. The proof slots (`<Proof>`) are built but hidden behind `FLAGS` in `src/config/site.ts`.
- **⚠ Confirm these operational statements**, which the copy implies:
  - Orders outside the GTA are handed to national carriers.
  - Parcels can be dropped at a sort centre, and pickups from the brand's dock are on a schedule.
  - Doorstep return pickups are offered in the five cities.
  - Picking is scan-verified, labels are printed at the bench, and inventory has bin locations.
  - Condo deliveries follow building rules, and a failed delivery is held for a re-attempt or pickup.
  - Charging is scheduled between route waves, and range margins are increased in winter.
  - Shopify is connected during onboarding today (the app is "coming soon").
  - Careers and partner copy: training, the walkthrough before the first route, the DZ/straight-truck routes, forklift as an asset.
  - The neighbourhood lists on the city pages are illustrative and labelled "Examples, not a complete list."
- Blog publish dates are staggered across November 2026 as placeholders. **⚠ Set them to the real publish dates.**
- The blog author is "Kinematics Team", emitted as an `Organization` author in BlogPosting schema.
- Blog H1s are your exact titles. The ones longer than 60 characters use a separate `seoTitle` for `<title>`.

## Brand and visual system

- **Parcels use brand colours** (Cloud/white box with teal tape) instead of kraft brown, because of the "brand colours only" rule. Orange appears only on CTAs and the final "delivered" dot.
- **No lightning bolts.** EVs are shown with a charging-plug icon throughout.
- **⚠ Contrast adjustment:** teal text `#12806F` is 4.84:1 on white, which passes AA, but only 4.46:1 on Cloud and 4.5:1 on teal tints, which fails. On tinted backgrounds only, teal text uses `#107868` (same hue, slightly deeper, ≥ 4.68:1). It is defined as `teal-deep` and applied in an unlayered rule at the end of `global.css`. On white, `#12806F` is used exactly as specified.
- The illustration kit (`src/components/illustrations/art.ts`) is one set of string builders used for the story fallback frames, page heroes, blog covers, OG images and city maps. That keeps every image consistent.
- Fonts: `@fontsource` **latin subsets only** (Space Grotesk 600/700, Inter 400/500/600) with `font-display: swap`. Space Grotesk 700 and Inter 400 are preloaded. The metric-matched fallbacks (`size-adjust`, ascent/descent overrides) are computed from Capsize metrics, so swapping fonts causes no layout shift (CLS 0 measured).

## 3D scroll story

- **Architecture:** `ScrollStory.astro` server-renders all six chapters (text plus a matching SVG frame). `StoryStage.tsx` (`client:visible`, 1.8 KB gz) checks capability first, then lazy-loads `StoryScene.tsx`. The checks, in order:
  - `prefers-reduced-motion`
  - Save-Data
  - `hardwareConcurrency ≤ 4`
  - `deviceMemory ≤ 2`
  - WebGL support
  - a 24-frame rAF probe that needs at least 40 fps
  - a runtime FPS guard after the first 1.2 s of rendering (falls back below 24 fps)
- **No CLS:** switching to 3D only changes opacity. Chapter boxes are the same size in both modes.
- **Choreography:** one GSAP timeline, scrubbed by ScrollTrigger from "top center" to "bottom center" of the story, tweens a plain state object. `useFrame` reads it.
  - The camera flies between keyframes.
  - The Return chapter blends into a chase camera so the parcel stays in frame.
  - The timeline syncs immediately if the page loads mid-story.
  - The "Delivered" SMS phone is a decorative DOM overlay (`aria-hidden`), so it costs no 3D text renderer.
- **Rendering cost:**
  - `frameloop="demand"`; frames render only on scroll or in a 5-second idle window after activity (the tiny idle motion), then stop completely.
  - Rendering is set to `never` when off-screen.
  - `dpr` is capped at [1, 1.5].
  - Lambert materials, no shadow maps, and soft blob contact shadows (radial-gradient decals) instead of drei's `ContactShadows`, which would re-render depth every frame.
  - Instanced meshes for shelf boxes, tape, rollers, map tiles, buildings, route dots and return dashes.
- **Bundle:** R3F v9 calls `extend(THREE)` with the whole namespace, which ships all of three.js. A small Vite plugin in `astro.config.mjs` points R3F's `three` import at `src/lib/three/slim.ts`, which exports only the classes used. That keeps three tree-shakeable. **If you add a new JSX element (e.g. `<torusGeometry>`), export its class from `slim.ts`.**
  - Scene chunk: **251 KB gzipped**, mostly the three.js WebGL renderer core, plus R3F, GSAP + ScrollTrigger and Lenis.
  - Stage: 1.8 KB.
  - React runtime: 64 KB gzipped, shared island runtime, loaded only when the story scrolls into view.
- Models are procedural, built from boxes, rounded boxes (drei `RoundedBox`), cylinders, rings and one extruded gable roof. There are no model files.
- **Lenis** smooth scroll runs only while the 3D story is active on the homepage. It is never loaded under reduced motion or on fallback devices.
- **Optional 3D accents on other pages were not built.** The EV page van, the service-area maps and the services art are SVG instead, to keep those pages at zero JS. They can be added later as `client:visible` islands reusing the scene's components.
- The static fallback frames are **hand-drawn SVGs that match each chapter**, not rendered stills, so they stay crisp at any size and weigh about 3–6 KB each.

## SEO, GEO and AEO

- `<SEO>` emits one JSON-LD `@graph` per page: Organization, WebSite and WebPage everywhere; BreadcrumbList on inner pages; and the page-specific type (Service, LocalBusiness, FAQPage, BlogPosting, JobPosting, HowTo, ItemList).
- **Placeholders are never published in schema.** The phone is omitted while it is `[+1 XXX XXX XXXX]`. Only `addressLocality`/`Region`/`Country` are emitted until a street address is set in `site.ts`.
- `WebSite` → `SearchAction` is gated by `FLAGS.siteSearch` (off, because the site has no search).
- `HowTo` schema on `/how-it-works`: Google no longer shows HowTo rich results, but the markup is valid and other answer engines read it.
- The city maps are an **inline SVG stylized map** (illustrative, labelled "not to scale") instead of a raster map image. It needs no map JS, makes no extra request and stays crisp. Swap in a static raster export via `astro:assets` if you want real geography.
- `robots.txt` explicitly allows GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, PerplexityBot, Google-Extended, Applebot-Extended, CCBot and others. It disallows `/api/` and `/thanks`.
- `/llms.txt` is generated from the same data files as the pages, so it never drifts from them.
- `npm run audit` enforces the following on every build:
  - title ≤ 60 characters and description ≤ 155
  - exactly one H1 and sensible heading order
  - canonical and hreflang present
  - alt attributes on all images
  - no broken internal links
  - valid JSON-LD with required fields
  - a 40–60 word answer paragraph on every service and city page

## Forms

- One endpoint, `POST /api/submit`, handles the quote, contact, careers and driver forms. It works as a plain HTML post (303 to `/thanks`), and JavaScript adds inline validation, multi-step navigation and success states.
- Email providers are swappable via `EMAIL_PROVIDER`: `resend` (default), `postmark`, `webhook` or `console`. All use `fetch`, with no SDK in the function bundle.
- Spam protection:
  - honeypot field
  - 2.5 s minimum fill time
  - same-origin check
  - per-IP rate limit (default 5 per 10 minutes per form): in memory per warm instance, or shared through Upstash Redis if `UPSTASH_REDIS_REST_*` is set
- CV uploads: PDF or Word up to 4 MB (kept small on purpose), sent as email attachments.
- The CASL checkbox is **unchecked by default** and optional. Express consent is recorded in the email.
- Conversion events (`quote_submit`, `contact_submit`, `apply_submit`) go through `window.kinTrack`, which only sends after cookie consent.

## Analytics and cookies

- The provider is chosen by env var (`plausible`, `ga4` or `none`; default `none`). Nothing loads until the visitor clicks "Accept analytics." The choice is stored in `localStorage` (`kin-consent`). The banner can be reopened from `/cookies`.

## Track a parcel

- The form does a GET to `PUBLIC_TRACKING_URL?tracking=<number>` once that env var is set. Until then it shows a friendly "Tracking is launching soon" message with the email address.

## Deployment

- Security and cache headers are set by `scripts/hosting/server-hardening.mjs` (it replaced `vercel.json`). **⚠ After the first deploy, check the headers with `curl -I`.**

---

# Motion upgrade (cinematic pass)

## Hero film
- **One scene, three outputs.** `src/components/hero/HeroScene.tsx` is the real-time film. It is deterministic (every object poses itself from the master timeline time), so `scripts/capture-hero.mjs` renders the **same** scene frame by frame into the MP4/AV1 video fallback and the poster image. If the scene changes, re-run `npm run capture:hero` and bump `VIDEO_VERSION` in `HeroFilm.astro`.
- **Master timeline:** GSAP `repeat: -1`, 36 s, 8 shots. It drives the fade, the dusk colour grade, caption callbacks and pause/play. Camera moves are computed per frame from the same time (a dolly within each shot plus a 1.2 s eased cross-move between shots), which is smoother and seek-safe compared with stacking overlapping camera tweens.
- **Poster = playback start = shot 1.** The film always starts at 0 (Receive). The poster is that exact frame, so poster → motion is seamless. The loop fades to white at the end and cuts back in to shot 1 (there is no fade-in at 0, which would make the first frame blank).
- **Mode selection** happens in a small vanilla controller, so React isn't downloaded unless real-time 3D will run:
  - **3D:** desktop with a fine pointer and width ≥ 1024, more than 4 cores, more than 4 GB memory, WebGL available, and a 30-frame probe ≥ 45 fps. A runtime check also falls back below 28 fps.
  - **Video:** mobile or coarse pointer, low-end devices, no WebGL, or a slow probe.
  - **Poster plus a static 8-step strip:** reduced motion or Save-Data.
  - Overrides for QA: `?hero=3d|video|poster`.
- **LCP** is the poster `<img>` (AVIF/WebP `srcset`, preloaded with `fetchpriority=high`) or the H1. The canvas and video fade in over the poster after `load` + idle, so they're never LCP and never block first paint.
- **Visual direction within the rules:**
  - Brand palette only. Orange appears only in the delivered moment: the parcel at the door, the dot and its pulse ring.
  - "Warm–cool contrast" comes from a warm key light tinted with Orange-soft (`#FFE6DD`) against a cool hemisphere and navy dusk sky.
  - City windows and street lamps use the glass tint (`#BFE8E3`), not orange.
- **No post-processing:** depth of field, bloom and motion blur would add a postprocessing library (about 40–60 KB gz) and GPU cost. "Depth" comes from distance fog, a colour grade, blob contact shadows and eased camera moves instead. A subtle DOF pass could be added later for desktop only.
- **Captions** are an `aria-hidden` visual overlay. The 8-step list is always in the DOM (screen-reader text, and visible under reduced motion and no-JS), so assistive tech and crawlers get the same content without a chatty live region.
- **Pause/play** is a real `<button aria-pressed>`, keyboard-focusable, and controls whichever mode is running (WCAG 2.2.2).
- **Video:** muted, `playsinline`, `loop`, `preload="none"`. Its source is only attached after load + idle, so it never competes with LCP.

## Scroll motion
- **GSAP is lazy-loaded per page** (`import()` after `load` + idle), together with ScrollTrigger and SplitText. It is never loaded under reduced motion. It's about 50 KB gz and stays off the critical path.
- **Two-way everywhere:** batches use `onEnter`/`onEnterBack` to play and `onLeaveBack` to reverse; headings, unmasks and the city route use `toggleActions: "play reverse play reverse"`; route lines and parallax are scrubbed.
- Only elements that start **below the fold** get a hidden start state, so there's no flash of hidden content and no layout shift (`transform`/`opacity` only). With JS off, all content is visible.
- **Word-by-word headings** use GSAP SplitText with `aria: 'auto'` (the full text stays as the heading's accessible name; the word spans are hidden from AT). Only plain-text H2s are split.
- **Line drawing uses `clip-path` wipes**, not `stroke-dashoffset`, which keeps every animated property to transform, opacity or clip-path.
- **The city mini-map route is illustrative and unlabelled.** Naming real neighbourhoods at made-up positions would imply geography the map doesn't show.
- The side route line only appears where there's a gutter (viewport ≥ 1328 px) on long pages (> 2.6 viewports).

## Micro-interactions
- **Pure CSS** (no JS) for: button fill sweep and arrow nudge, the secondary button's border draw and teal fill, link underline draw, card lift/glow, icon loops, dropdown scale-and-stagger, and the focus ring.
- **Tiny vanilla JS** (`interactions.ts`) only for what CSS can't do: the magnetic pull, the ripple position, card tilt, and the cursor dot.
- **Exceptions to "transform/opacity only"**, all paint-only (no layout):
  - button text colour swapping with the sweep
  - the link underline drawn with `background-size` (works across line breaks, keeps a static underline as the non-colour link cue required by WCAG 1.4.1)
  - the card hover `box-shadow`
  - the input focus ring `box-shadow`
- **Contrast:** the primary hover state is navy with orange text (6.1:1). The secondary button's resting border is navy at 32% opacity; the label carries the meaning, and the full navy border draws in on hover and focus.
- **Keyboard focus gets every hover state:** `:focus-visible` on buttons and links, and `:focus-within` on cards.
- The **cursor dot** is an addition, not a replacement. The native cursor is never hidden. The dot is disabled on touch, under reduced motion and in forced-colours mode.

## Page transitions
- **Astro `<ClientRouter />`:**
  - The header carries `transition:name` + `animate="none"`, so it stays put.
  - `<main>` slides and fades (`kin-page-*` keyframes).
  - A persisted 3 px teal line shows navigation progress.
  - Reduced motion is respected by Astro automatically.
- All page scripts moved to an `onPage()` lifecycle (`src/scripts/lifecycle.ts`): they re-initialise after each navigation and clean up before the next swap. The React story island is unmounted by Astro, and the hero film is disposed manually.

---

# Pre-launch round

- **Careers image is a render, not a photo.** It's built from the hero film's parts and rendered via a hidden `/render/careers` page that exists only when building with `KIN_RENDER=1` (`npm run render:careers`). Swap it for a real photo later (shot CAR-01 in `PHOTO_SHOTLIST.md`).
- **CSS is inlined in every page** (`inlineStylesheets: 'always'`). This removes the render-blocking stylesheet request: mobile LCP improved by 0.15–0.27 s. The trade-off is about 16 KB gz of CSS per HTML page instead of one cached file; that's worth it for first visits.
- **Multi-step forms render their enhanced state before JS runs** (CSS keyed on `html.js` and `form:not([data-enhanced])`), so there is no layout shift. Without JS, all steps show.
- **Keyword targeting stays honest.** No page claims "best"; "best" queries get neutral checklists. Queries implying a facility we can't confirm (for example "pallet storage Mississauga") are not targeted. See `reports/KEYWORDS.md`.
- **Careers is no longer in the header nav**, only in the footer (owner decision).


## Launch round (GitHub + Hostinger)

- **Hosting moved from Vercel to a Hostinger Node.js web app**, deployed from GitHub. `@astrojs/vercel` and `vercel.json` are removed; `@astrojs/node` runs in `standalone` mode and `npm start` runs `node ./dist/server/entry.mjs`, which reads `PORT` and `HOST`. Pages stay prerendered; only `/api/submit` is on demand.
- **The standalone server doesn't compress responses or set security headers**, and the home page would go out as about 226 KB of HTML instead of about 31 KB. Instead of adding a separate server file (which would change the entry file Hostinger runs), the `kin:hosting` integration (`scripts/hosting/integration.mjs`):
  - precompresses text files to `.br` and `.gz` after the build;
  - makes `entry.mjs` import `server-hardening.mjs` first. That module wraps the HTTP listener to serve the precompressed files and set the old `vercel.json` headers and cache rules, and adds a `www` → apex 301.
  - Everything else (pages, ranges, 404, the trailing slash 301, the form API) is still handled by Astro.
- **The trailing slash redirect is now a 301** (the Node adapter's), not Vercel's 308. Both are permanent; canonicals are unchanged.
- **`security.allowedDomains`** lists the apex and `www`, so Astro trusts `X-Forwarded-Host`/`Proto` from Hostinger's proxy for its origin check and request URLs.
- **`satori` and `@resvg/resvg-js` moved to `dependencies`**: `prebuild` uses them, and a host that installs with `--omit=dev` would otherwise fail the build.
- **About is now a company page.** The team grid is removed, along with `FLAGS.showTeamPhotos` and the TEAM shots in the shot list. No people are named anywhere on the site.
- **Hours live in `SITE.hours`** (structured), and are rendered on Contact and in the footer and emitted as `openingHoursSpecification` (Sunday omitted, which schema.org reads as closed).
- **Legal pages are final**: draft notes and placeholders are removed, and `LEGAL_EFFECTIVE_DATE` drives the "Effective date" on all four pages. The Privacy Officer is named by role only and reached at `SITE.email`. The page structure was checked against how Canadian carriers organize theirs (who is covered, what is collected, recipient data held for the shipper, notifications, cross border storage, rights). All wording is original.


## Agent readiness round (2026-11-23)

- **robots.txt** declares `Content-Signal: search=yes, ai-input=yes, ai-train=yes` in the `User-agent: *` group. The rules for named AI crawlers are unchanged.
- **Sitemap `<lastmod>` comes from real change dates** (`scripts/hosting/lastmod.mjs`). Blog posts use `updated` or `published` from their frontmatter (this repo's names for updatedDate/pubDate). The blog index and category pages use their newest post. Every other page uses the git last commit date of its source file; dynamic routes use the newer of the route template and its data file (for example `services/[slug].astro` and `data/services.ts`). Anything unknown falls back to the build date. Dates are ISO 8601.
  - The build server may clone without full history, so local builds write `scripts/hosting/lastmod.json`, which records each file's committed date and git blob hash. Without usable git, a file whose content still matches its recorded blob gets the recorded date; changed files get the build date. Commit `lastmod.json` after a local build so the live dates stay exact.
- **sameAs** is driven by `SITE.socials.linkedin` and `SITE.googleBusinessProfile`. Only values that are set and real `https://` URLs are emitted, on Organization and on the LocalBusiness nodes. Both are empty for now, so no `sameAs` is output. The footer LinkedIn link reads from the same field.
- **Markdown for agents.** After the build, `scripts/hosting/markdown.mjs` converts the `<main>` of every indexable page into a `.md` twin at the same path (`/index.md`, `/services/fulfillment.md`). It uses turndown and drops scripts, nav, SVG, video and canvas, `aria-hidden` and hidden markup, and form controls; a form becomes a one line pointer to the HTML page. `server-hardening.mjs` serves the `.md` files and negotiates the page URL itself: Markdown only when `Accept` ranks `text/markdown` above `text/html`. Ties, `*/*` and every browser Accept header get HTML. Both representations send `Vary: Accept, Accept-Encoding`, and a negotiated response adds `Content-Location: /page.md`. llms.txt lists every `.md` URL in a "Markdown versions" section, written at build time from the files actually generated.
- **Link header on every HTML page:** `</llms.txt>; rel="describedby"; type="text/plain"`, plus `</page.md>; rel="alternate"; type="text/markdown"` when the page has a twin. Noindex pages and the 404 get only the llms.txt link. Indexable pages also carry `<link rel="alternate" type="text/markdown">` in the head.
- **Home canonical fixed.** With `build.format: 'file'`, Astro reports the home path as `/index`, so the canonical, og:url and schema ids pointed at `https://kinematicstech.ca/index`. SEO.astro now normalizes that to `/`.
- **WebMCP (declarative API).** The quote form (`toolname="request_quote"`) and the tracking form (`toolname="track_parcel"`) carry `tooldescription`, and their inputs carry `toolparamdescription`. This follows Chrome's [declarative API docs](https://developer.chrome.com/docs/ai/webmcp/declarative-api) as of 2026-11-23. That API is an origin trial and **the attribute names are not stable yet**; check the docs again and rename if they change. No script is loaded and `toolautosubmit` is deliberately not set: an agent can fill a form, but a person still clicks submit, so the honeypot, fill time check, origin check and rate limits behave exactly as before. The honeypot's parameter description tells agents to leave it empty, and the marketing consent box tells them to leave it unchecked unless the person explicitly said yes (CASL). The contact, driver and careers forms are not annotated. Types for the attributes are in `src/webmcp.d.ts`.
- **No MCP Server Card.** We don't run an MCP server, so no placeholder card is published.
