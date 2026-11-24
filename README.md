<div align="center">

<a href="https://kinematicstech.ca"><img src="https://kinematicstech.ca/og/default.png" alt="Kinematics, commerce in motion" width="100%" /></a>

# Kinematics Website

**3PL fulfillment and same day delivery across the GTA**

[![Live site](https://img.shields.io/badge/live-kinematicstech.ca-ff6a3d?style=for-the-badge)](https://kinematicstech.ca)

![Astro](https://img.shields.io/badge/Astro-7-BC52EE?logo=astro&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-000000?logo=threedotjs&logoColor=white)
![GSAP](https://img.shields.io/badge/GSAP-88CE02?logo=greensock&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-22+-339933?logo=nodedotjs&logoColor=white)

</div>

## Tech stack

| Layer | Technologies |
| --- | --- |
| Framework | Astro 7 (static, every page prerendered), TypeScript |
| UI | React 19 (only for the interactive 3D island), Astro components |
| Styling | Tailwind CSS 4, Tailwind Typography, Inter + Space Grotesk (self-hosted, subset) |
| 3D and motion | three.js, React Three Fiber, drei, GSAP + ScrollTrigger, Lenis smooth scroll |
| Content | MDX content collections for blog and careers, typed frontmatter |
| SEO / AEO / GEO | JSON-LD schema, sitemap, RSS, `llms.txt`, Markdown page twins, OG images generated with Satori + resvg |
| Server | Node.js (`@astrojs/node` standalone) for one form endpoint, security headers, Brotli/gzip |
| Forms | Resend / Postmark / webhook, rate limited |
| Tooling | Sharp, ffmpeg (hero video), Lighthouse, custom SEO and link audits |
| Hosting | Hostinger Node.js app, auto deploy from GitHub |

## How it's built

- **Static first.** Every page is prerendered HTML, only `/api/submit` runs on the server.
- **3D hero and scroll story.** A real three.js scene choreographed with one GSAP timeline. It loads only on capable devices; on slow devices or with reduced motion, lightweight SVG frames and a video take over.
- **Content driven.** Services, industries and city pages are generated from typed data files.
- **Performance.** Lighthouse 98 to 100 in every category on key pages, CLS 0.

## Run locally

```bash
npm ci
cp .env.example .env
npm run dev      # http://localhost:4321
npm run build    # production build
```
