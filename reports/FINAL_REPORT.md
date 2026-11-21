# Kinematics: motion upgrade final report

The site now has a looping cinematic hero film, two-way scroll animation on every page, micro-interactions on every button, card, link and form, and View Transitions between pages. Every Lighthouse category is still 98–100 on mobile and desktop.

All numbers come from the production build served locally (`npm run build && npm run preview`) with **Lighthouse 13, median of 3 runs**. Mobile uses simulated slow 4G and 4× CPU; desktop uses Lighthouse's desktop preset. Raw data is in `reports/before.json`, `reports/after.json`, `reports/weights-before.json` and `reports/weights-after.json`. Re-run on production after deploy, because real CDN latency will move the numbers slightly.

## 1. Lighthouse scores (Performance / Accessibility / Best Practices / SEO)

| Page | Mobile before | Mobile after | Desktop before | Desktop after |
|---|---|---|---|---|
| `/` | 100 / 100 / 100 / 100 | 98 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
| `/services/fulfillment` | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
| `/service-areas/mississauga` | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
| `/blog/next-day-delivery-in-the-gta` | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |

The only change below 100 is Home mobile Performance (98), caused by the poster image becoming the LCP element (see §2). Accessibility briefly dropped to 96 during the work: the hero eyebrow was teal on Cloud, and that was fixed by extending the contrast guard.

## 2. Core Web Vitals

| Page | Preset | LCP before → after | CLS before → after | TBT before → after |
|---|---|---|---|---|
| `/` | mobile | 1.05 s → 2.11 s | 0 → 0 | 0 ms → 93 ms |
| `/` | desktop | 0.28 s → 0.50 s | 0 → 0 | 0 ms → 20 ms |
| `/services/fulfillment` | mobile | 0.75 s → 0.93 s | 0 → 0 | 0 ms → 69 ms |
| `/services/fulfillment` | desktop | 0.20 s → 0.25 s | 0 → 0 | 0 ms → 0 ms |
| `/service-areas/mississauga` | mobile | 0.75 s → 0.93 s | 0 → 0 | 0 ms → 64 ms |
| `/service-areas/mississauga` | desktop | 0.20 s → 0.25 s | 0 → 0 | 0 ms → 0 ms |
| `/blog/next-day-delivery-in-the-gta` | mobile | 0.75 s → 0.93 s | 0 → 0 | 0 ms → 45 ms |
| `/blog/next-day-delivery-in-the-gta` | desktop | 0.36 s → 0.41 s | 0 → 0 | 0 ms → 0 ms |

**INP.** Lighthouse doesn't measure INP in navigation mode, so I measured real interactions with the Event Timing API under 4× CPU throttling: the hero pause/play button, the nav dropdown, FAQ toggles, card hovers and quote-form typing and steps. The page was scrolled with the mouse wheel like a person.

| Scenario | Worst interaction (INP proxy) |
|---|---|
| Desktop, real-time 3D hero + 3D story running | **32 ms** |
| Mobile emulation, video hero | **48 ms** |
| Quote form, typing + step changes (mobile) | **24 ms** |

All are well under the 200 ms budget. A synthetic test that jump-scrolled the page straight to the FAQ and clicked in the same frame produced one 712 ms event under 4× throttling. Tracing showed no long task: it was presentation delay from repainting many sections at once, which real wheel or touch scrolling doesn't do.

**Home mobile LCP went from 1.05 s to 2.11 s, still under the 2.5 s budget.** The LCP element is now the hero poster image (a 7–10 KB AVIF on phones, preloaded with `fetchpriority=high`), where before it was the H1 text. Images can't paint with fallback fonts, so in Lighthouse's simulation the poster shares the throttled connection with the five web-font files and the CSS. I tried smaller poster variants and delaying all heavy requests until after LCP. That kept LCP at about 2.1 s and kept the video and GSAP off the critical path for real users, but the fonts are the remaining cost.

## 3. Weight per page

**Bytes transferred during the Lighthouse window (mobile):**

| Page | Lighthouse transfer, mobile (before → after) | JS transferred in LH window (before → after) |
|---|---|---|
| `/` | 139.4 KB → 1082.4 KB | 1.3 KB → 63.6 KB |
| `/services/fulfillment` | 127.1 KB → 190.1 KB | 1.3 KB → 61.4 KB |
| `/service-areas/mississauga` | 124.5 KB → 187.8 KB | 1.3 KB → 61.4 KB |
| `/blog/next-day-delivery-in-the-gta` | 127.9 KB → 191.2 KB | 1.3 KB → 61.4 KB |

**Built assets (gzip -9), from `scripts/page-weight.mjs`:**

| Page | HTML gz | Initial JS gz | Lazy JS gz | CSS gz |
|---|---|---|---|---|
| `/` | 23.4 → 25.3 KB | 74.7 → 84.2 KB | 246.3 → 263.8 KB | 11.6 → 16.1 KB |
| `/services/fulfillment` | 12.3 → 12.7 KB | 2.7 → 10.6 KB | 0 → 48.8 KB | 10.7 → 13.7 KB |
| `/service-areas/mississauga` | 9.6 → 10.4 KB | 2.7 → 10.6 KB | 0 → 48.8 KB | 10.7 → 13.7 KB |
| `/blog/next-day-delivery-in-the-gta` | 12 → 12.7 KB | 2.7 → 10.6 KB | 0 → 48.8 KB | 11 → 14 KB |


How to read these:
- **Inner pages:** 10.6 KB of JS loads with the page. The 48.8 KB lazy chunk is GSAP + ScrollTrigger + SplitText + the scroll module, fetched after load + LCP + idle. That's about 60 KB in total, inside the **80 KB budget**.
- **Home:** "initial" includes the React runtime (64 KB) for the scroll-story island, which hydrates when the story scrolls into view. JS needed at first paint is about 12.6 KB (site scripts + the hero controller). Home JS **excluding 3D** is about 124 KB, inside the **300 KB budget**.
- **3D chunks (lazy, separate):** 197 KB shared three.js/R3F/drei core, 10 KB hero scene, 12 KB story scene. They only load on desktops that pass the capability checks.
- **Media (home):** the hero poster is 6.6 KB (480w) to 41 KB (1920w) as AVIF. The hero video is **2.36 MB AV1 WebM** or **2.57 MB H.264 MP4**; a browser downloads only one, inside the **3 MB budget**. It is requested only after LCP + idle, only in video mode, and is never fetched under reduced motion or Save-Data. The 1,082 KB Lighthouse mobile transfer for Home includes the start of that video stream.
- **CSS** grew by about 3–4.5 KB gz for the whole motion layer.

## 4. Every animation added

| Where | Component / file | What moves | Trigger |
|---|---|---|---|
| Home hero | `HeroScene.tsx` (R3F) | 36 s, 8-shot film: truck reverses, dock door rolls up, cartons slide onto a pallet → forklift putaway, camera rises → shelf light blinks, carton slides onto the pick conveyor → repack (flaps open, item moves, new box folds, tape runs) → label prints and sticks, teal scan sweep → sorter arch glow, diverter arms push parcels into lanes → parcels into the van and car, doors and lid close → van drives out at dusk, dotted route draws ahead, stop dots, parcel lands, orange delivered pulse → fade to loop | Load (after LCP + idle); loops |
| Home hero | `HeroScene.tsx` | Ambient: background conveyor, blinking rack lights, worker pushing a cart, van suspension bob, scan-arch pulse | Continuous while playing |
| Home hero | `HeroFilm.astro` | Chapter caption chip (number, label swap, progress dots) synced to shots; canvas/video cross-fade over the poster | Timeline / video time |
| Home hero | `HeroFilm.astro` | Pause / play button | Click / keyboard |
| Home story | `StoryScene.tsx` (existing) + `scroll.ts` | 3D Store → Pack → Sort → Drive → Deliver → Return, now with a dotted route line threading the six chapters, a parcel travelling along it, and stop dots popping in (orange at the end) | Scroll (scrubbed, two-way) |
| All pages | `scroll.ts` | Cards and list items rise 48 px + fade, 75 ms stagger; reverse when scrolling back up | Scroll (enter / enter-back / leave-back) |
| All pages | `scroll.ts` (SplitText) | Section H2s reveal word by word (masked, 45 ms stagger) | Scroll, `play reverse play reverse` |
| All pages | `scroll.ts` | Illustrations unmask with a clip-path wipe | Scroll, two-way |
| Long pages (≥ 1328 px) | `scroll.ts` | Dotted teal route line down the gutter draws itself, a parcel icon travels along it, stop dots at each section, orange final dot | Scroll (scrubbed) |
| Page heroes, home sections, CTA bands | `Decor.astro` + `scroll.ts` | Floating cartons and pallets at different depths (parallax) | Scroll (scrubbed) |
| City pages | `Art.astro` (`cityRoute`) + `scroll.ts` | Mini-map route draws through the city, stops pop in sequence, final stop orange | In view, two-way |
| Blog posts, job pages | `ReadProgress.astro` + `read-progress.ts` | Tiny van drives across the top; teal fill; end dot turns orange | Scroll |
| All primary buttons | `global.css` | Navy fill sweeps from the left (text inverts to orange), arrow nudges right | Hover / focus |
| All primary buttons | `interactions.ts` | Magnetic pull toward the cursor (max 8 px) | Pointer move (desktop) |
| All buttons | `global.css` + `interactions.ts` | Press scale 0.97 + ripple from the click point | Pointer down |
| Secondary buttons | `global.css` | Border draws around (clip-path sweep) + 10% teal fill | Hover / focus |
| Links (`.link`) | `global.css` | Navy underline draws left to right over the resting teal rule | Hover / focus |
| All cards | `motion.css` + `interactions.ts` | 3D tilt (max 6°), 5 px lift, soft shadow, teal glow ring | Hover / focus-within / pointer move |
| All cards | `interactions.ts` | Brief "selected" tint before navigating | Click |
| Service and feature icons | `Icon.astro` + `motion.css` | Idle loops: van drives, clock hand ticks, box lid opens, rack light blinks, return arrow nudges, camera lens flashes, plug bobs, layers lift, route dots shift, chart bars grow | Hover / focus of the card or link |
| Header dropdowns | `motion.css` | Panel scales + fades in, items stagger in (40 ms) | Click / keyboard |
| Forms | `global.css` | Teal focus ring grows out of each field | Focus |
| Quote form | `form-enhance.ts` | Steps slide horizontally (direction-aware) | Next / Back / Enter |
| All forms | `FormShell.astro` + `motion.css` | Success: box drops in, dotted route draws, orange dot pops and pulses | Successful submit |
| Every navigation | `BaseLayout.astro` (Astro `<ClientRouter />`) | Content slides + fades (direction-aware); header stays fixed; teal progress line across the top | Link navigation |
| Desktop (optional) | `interactions.ts` | Cursor dot that grows over clickable items (native cursor never hidden) | Pointer move |

Timings and easing are centralised in `src/lib/motion.ts`, mirrored as CSS variables (`--dur-fast` 150 ms, `--dur-base` 300 ms, `--dur-reveal` 600 ms, `--ease-brand` cubic-bezier(.22,1,.36,1) / GSAP `power4.out`).

## 5. Fallback behaviour

| Situation | Hero | Scroll story | Site-wide motion |
|---|---|---|---|
| **Desktop, capable** (fine pointer, ≥ 1024 px, > 4 cores, > 4 GB memory, WebGL, probe ≥ 45 fps) | Real-time 3D, starting at the poster frame | Real-time 3D | Everything |
| **Mobile / tablet / coarse pointer** | Video loop (AV1 or H.264), same film, captions synced to video time | 3D on capable phones; SVG frames otherwise | Everything except tilt, magnet and cursor dot (fine pointer only) |
| **Low-end** (≤ 4 cores, ≤ 4 GB, slow probe, or runtime < 28 fps) | Video loop | SVG frames | Everything (CSS + GSAP are cheap) |
| **No WebGL / context lost** | Video loop | SVG frames | Everything |
| **prefers-reduced-motion** | Poster + static 8-step strip, no autoplay, no video download | SVG frames, no Lenis | GSAP never loads; no reveals, tilt, magnet, ripple or cursor; hovers become instant state changes; transitions handled by Astro's reduced-motion behaviour |
| **Save-Data** | Poster + static strip | SVG frames | Unchanged (small) |
| **JavaScript disabled** | Poster + static strip | SVG frames with all chapter text | All content visible; forms post normally |

Verified with Puppeteer and Playwright:
- **Chromium:** 375, 768, 1280 and 1920 px.
- **WebKit (Safari's engine):** 375 and 1280 px.

At every one of those combinations: correct mode, no horizontal overflow, nothing left hidden after scrolling, no console errors. Reduced-motion and no-JS runs confirmed no GSAP, 3D or video requests and full SSR text.

## 6. What was optimised, and how

- **Hero never blocks first paint.**
  - The poster (AVIF/WebP `srcset`, 480–1920w) is preloaded with `fetchpriority=high`.
  - The 3D chunk, video and GSAP start only after `load`, after the LCP entry has painted (PerformanceObserver), and then idle.
- **No React for non-3D devices.** Mode selection is a 2 KB vanilla controller; React + three.js are only imported when real-time 3D will run.
- **Video:** rendered from the actual scene (deterministic seek + headless capture), 24 fps, H.264 `-tune animation -crf 31` with `+faststart`, plus AV1 (SVT-AV1 CRF 46). Both under 2.6 MB. `preload="none"`; the source is attached late.
- **3D cost:**
  - Instancing for about 400 rack boxes, uprights, beams, rollers, city buildings, windows, route dots and rack lights.
  - Lambert materials, no shadow maps (blob contact shadows), no post-processing.
  - `dpr` capped at 1.5, `frameloop="demand"`.
  - The hero renders only while visible, playing and the tab is shown; the story renders only while on screen.
  - Shaders compile via `compileAsync` (parallel) before the first frame.
  - The three.js namespace is trimmed for R3F (`src/lib/three/slim.ts`).
- **GSAP is per page and lazy**, never loaded under reduced motion. Only below-the-fold elements get a hidden start state (no flash, no CLS), and GSAP context cleanup runs on every View Transition.
- **Animated properties:** transform, opacity and clip-path. The documented paint-only exceptions are button text colour, the link underline `background-size`, and the hover and focus box-shadows (see `DECISIONS.md`).
- **CLS 0 everywhere.** Mode switches cross-fade opacity only; poster, video and canvas share one sized box.
- **Bugs found and fixed during testing:**
  - Header dropdown items stayed unpainted after a keyframe animation in Chrome, so they now use transitions.
  - The side-route parcel SVG inherited full-height sizing and stretched the page by 7,000 px.
  - The video couldn't seek without HTTP Range support; the preview server now matches Vercel.
  - The hero eyebrow contrast (now in the contrast guard).
  - The timeline didn't sync when the page loads mid-story.
- **Revalidated:** `astro check` reports 0 errors; `npm run audit` shows 47 pages and 248 JSON-LD nodes valid, titles, descriptions and H1s correct, and no broken links; the sitemap lists 45 indexable URLs.

## 7. Known issues, trade-offs and next steps

**Trade-offs**
1. **Home mobile LCP 1.05 s → 2.11 s** (within budget), because the LCP is now an image. Options if you want more headroom:
   - drop one font weight (Inter 500 is used sparingly)
   - inline a tiny blurred poster as a data URI
   - make the H1 the LCP on phones by placing the film below the headline
2. **No real depth of field, bloom or motion blur.** A post-processing pass would add about 40–60 KB gz and GPU cost. Depth comes from fog, colour grading, contact shadows and easing. A desktop-only DOF pass is a possible add-on.
3. **Video is 720p.** On large desktops that fall back to video (low-end), it's slightly soft. A 1080p encode would be about 5 MB, above budget.
4. **Firefox could not be tested here.** Headless Firefox (both Playwright's build and Mozilla's stable 160) fails to start on this machine with "Could not find profile folder", even outside the sandbox. Everything used has Firefox support:
   - WebGL2, AV1, GSAP and `clip-path` work in Firefox.
   - Firefox has no View Transitions, so Astro's fallback (a plain fade or instant navigation) applies.

   **Please do a manual pass in Firefox before launch.** Real Safari on macOS and iOS should also get a hands-on check; the WebKit engine passed here.
5. The **cursor dot** is an optional nicety. Remove `initInteractions`'s cursor block if the team finds it distracting.
6. The **city mini-map routes are illustrative**, not real geography, and are deliberately unlabelled.

**Recommended next steps**
- **Real footage.** Once the warehouse is running, film real B-roll per `PHOTO_SHOTLIST.md` (dock, racks, packing, sorter, EV vans). It could replace or alternate with the rendered film; keep the same 8-chapter captions and the 3 MB budget.
- After any change to `HeroScene.tsx`: `npm run build && npm run preview`, then `npm run capture:hero`, and bump `VIDEO_VERSION` in `HeroFilm.astro` (the files are cached immutably).
- Re-run `RUNS=3 npm run lighthouse` (and `PRESET=desktop`) against production and compare with `reports/after.json`.
- Field data: once analytics consent is live, add `web-vitals` reporting for real-user INP, LCP and CLS.

## Media

- `reports/media/hero-loop-preview.mp4`: the full 36 s hero loop (640 px preview).
- `reports/media/hero-pack-to-sort.gif`: repack → label → scan → sorter.
- `reports/media/hero-load-and-road.gif`: loading the van and car, then the dusk drive.
- `reports/media/scroll-service-page.gif`: card rise, word reveals, side route line on a service page.
- `reports/media/scroll-story.gif`: the homepage scroll story with the route connecting chapters.


---

## Changelog: follow-up round (7 requested changes)

**New Home mobile scores** (Lighthouse 13, median of 3, simulated slow 4G + 4× CPU): **99 / 100 / 100 / 100**, **LCP 1.96 s** (was 2.11 s), CLS 0, TBT 49 ms. The fulfillment, Mississauga and blog pages remain 100 / 100 / 100 / 100. Data: `reports/after-v2.json`.

### 1. Hero film starts at shot 1
- The 3D timeline starts at 0 on load. The video starts at 0:00. The poster is the shot 1 frame (truck dock), and the captions start at "Receive" (both the server-rendered caption and the live one).
- Verified in Chrome: the desktop 3D and mobile video both open on "Receive" and move to "Store" in order.
- One necessary detail: the loop used to fade in from white at 0:00, which would have made the first frame (and so the poster) blank. The loop now opens on the clean shot 1 frame, keeps its existing fade to white at the end, and cuts back in to shot 1. Nothing else in the film changed.
- Re-rendered with `npm run capture:hero`. The video files are now `hero-loop-v2.mp4` (2.57 MB) and `hero-loop-v2.webm` (2.36 MB); v1 was deleted because the files are cached immutably.
- Files: `src/data/hero.ts`, `src/components/hero/HeroScene.tsx`, `src/components/hero/HeroFilm.astro`, `scripts/capture-hero.mjs`, `src/assets/hero/poster.png`, `public/media/hero-loop-v2.mp4`, `public/media/hero-loop-v2.webm` (v1 files removed), `reports/media/*` (regenerated previews).

### 2. Hyphens and dashes removed from visible text
- Hyphenated words now use spaces ("next day", "same day", "EV first", "pick and pack", "final mile", "third party", "direct to consumer") or standard closed forms ("ecommerce", "stockouts", "handoff", "reattempt", "cutoff", "midday"). "cul-de-sac" was reworded.
- Em and en dashes in sentences were replaced with a comma, colon, period or parentheses, chosen per sentence. Numeric ranges now read "300 to 1,000".
- **Kept, because they are required:** URLs and slugs (unchanged); code and meta values (`device-width`, `en-CA`, the `kin-consent` storage key shown on the cookie page, timestamps); photo shot IDs (TEAM-01 and so on); official names (the AI crawler user-agents in robots.txt, "User-agent", Canada's Anti-Spam Legislation, the Sandringham-Wellington neighbourhood).
- Verified by scanning every built page's text, alt, aria-label, title and meta/OG tags, plus llms.txt, RSS and the manifest: no other hyphens or sentence dashes remain.
- The quote form's monthly order options now read "300 to 1,000" and so on; the server validates against the same list.
- Files changed:
  - `scripts/generate-assets.mjs`
  - `src/components/forms/FormShell.astro`
  - `src/components/hero/HeroFilm.astro`
  - `src/components/layout/CookieBanner.astro`
  - `src/components/layout/Footer.astro`
  - `src/components/seo/SEO.astro`
  - `src/components/story/ScrollStory.astro`
  - `src/components/story/StoryScene.tsx`
  - `src/components/ui/CtaBand.astro`
  - `src/config/site.ts`
  - `src/content/blog/canada-post-alternatives-for-shopify-brands.mdx`
  - `src/content/blog/ev-delivery-fleets-explained.mdx`
  - `src/content/blog/how-to-choose-a-3pl-in-toronto.mdx`
  - `src/content/blog/next-day-delivery-in-the-gta.mdx`
  - `src/content/blog/returns-that-dont-hurt-margins.mdx`
  - `src/content/blog/shopify-fulfillment-in-canada.mdx`
  - `src/content/careers/delivery-driver.mdx`
  - `src/content/careers/dispatcher.mdx`
  - `src/content/careers/warehouse-associate.mdx`
  - `src/data/cities.ts`
  - `src/data/faqs.ts`
  - `src/data/hero.ts`
  - `src/data/industries.ts`
  - `src/data/services.ts`
  - `src/data/story.ts`
  - `src/lib/forms.ts`
  - `src/lib/schema.ts`
  - `src/pages/404.astro`
  - `src/pages/about.astro`
  - `src/pages/api/submit.ts`
  - `src/pages/blog/[slug].astro`
  - `src/pages/blog/category/[cat].astro`
  - `src/pages/blog/index.astro`
  - `src/pages/careers/[slug].astro`
  - `src/pages/careers/index.astro`
  - `src/pages/contact.astro`
  - `src/pages/cookies.astro`
  - `src/pages/drive-with-us.astro`
  - `src/pages/ev-delivery.astro`
  - `src/pages/faq.astro`
  - `src/pages/get-a-quote.astro`
  - `src/pages/how-it-works.astro`
  - `src/pages/index.astro`
  - `src/pages/industries/[slug].astro`
  - `src/pages/industries/index.astro`
  - `src/pages/integrations.astro`
  - `src/pages/llms.txt.ts`
  - `src/pages/privacy.astro`
  - `src/pages/robots.txt.ts`
  - `src/pages/service-areas/[city].astro`
  - `src/pages/service-areas/index.astro`
  - `src/pages/terms.astro`
  - `src/pages/thanks.astro`
  - `src/pages/track.astro`

### 3. Logo geometry
- `M28 34 L44 18` → `M24 38 L44 18` and `M34 31 L49 51` → `M31 27 L49 51` in the Logo component (colour, reversed and mono variants) and the asset generator.
- The project had no separate small/favicon variant using `M28 34 L46 16` / `M34 31 L50 52`: every favicon and icon is generated from the main mark, so they all picked up the change.
- Regenerated: `public/favicon.svg`, `favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `og/default.png`, `og/blog/*.png`. The hero film and poster don't contain the logo.
- Files: `src/components/Logo.astro`, `scripts/generate-assets.mjs` + the generated files above.

### 4. Careers
- Pay is removed from job pages (the "Pay" field and the schema field). JobPosting has no `baseSalary`. Existing jobs are unchanged.
- New job: **Final Mile Delivery Drivers** (`/careers/final-mile-delivery-drivers`):
  - "we are hiring drivers for final mile delivery across the GTA", with no headcount
  - "What you'll do" and "What you need" sections (valid G or DZ licence, clean driving record, smartphone, comfortable lifting parcels)
  - how to apply: "Send your resume to info@kinematicstech.ca with the subject 'Driver Application'" as a mailto link with that subject; the address comes from the config
  - JobPosting schema without salary; the schema description text is now cleaned of MDX code
- Note: Ontario's pay-transparency rule for public postings by employers with 25+ employees still applies by law; this is the owner's call.
- Files: `src/content.config.ts`, `src/pages/careers/[slug].astro`, `src/content/careers/final-mile-delivery-drivers.mdx` (new).

### 5. Socials
- Instagram and X/Twitter are removed everywhere, including the `twitter:*` meta tags. X falls back to the Open Graph tags for link previews.
- LinkedIn is the only entry, with an empty link (`SITE.social` in `src/config/site.ts`). The footer hides the LinkedIn link and icon, and schema `sameAs` is omitted, until a URL is filled in.
- Files: `src/config/site.ts`, `src/components/layout/Footer.astro`, `src/components/seo/SEO.astro`.

### 6. Phone hidden until set
- `SITE.phone` is now empty, and a new `hasPhone()` helper controls display. The phone is hidden in the footer, on the contact, privacy, terms, accessibility and city pages, and in schema `telephone`. It appears everywhere automatically once a number is set in `src/config/site.ts`. (The header never showed a phone.)
- Files: `src/config/site.ts`, `src/components/layout/Footer.astro`, `src/pages/contact.astro`, `src/pages/accessibility.astro`, `src/pages/privacy.astro`, `src/pages/terms.astro`, `src/pages/service-areas/[city].astro`.

### 7. Mobile speed (no visual changes)
- **Font subsetting:** each weight now loads a small "core" WOFF2 containing only the characters the site uses, with kerning and layout features kept, so text renders identically. Across the five files that's 76 KB → 55 KB.
- The full Fontsource Latin files remain as a `unicode-range` fallback and only download if a rarer character appears.
- Preloads now point at the core files.
- The poster was already 6.6 KB AVIF on phones, so it wasn't recompressed further, to avoid visible quality loss.
- **Result:** Home mobile LCP 2.11 s → **1.96 s**, Performance 98 → **99**. Layout and design are unchanged.
- Files: `scripts/subset-fonts.mjs` (new), `src/styles/fonts.css` (new), `src/assets/fonts/*-core.woff2` (5 new), `src/layouts/BaseLayout.astro`, `package.json` and `package-lock.json` (`subset-font` dev dependency).

**Docs updated:** `README.md`, `LAUNCH_CHECKLIST.md` (v2 video file name), `DECISIONS.md` (hero start, pay decision), this report.
