# Deploying kinematicstech.ca on Hostinger

Step by step instructions for putting the site live on a Hostinger **Node.js web app**, deployed from GitHub. Work through the parts in order. Each part ends with a check, so you know it worked before moving on.

- **Repository:** `github.com/Zohaib-mzb/Fulfillment-3pl-website` (private), branch `main`
- **What runs:** one Node process. Every page is a prebuilt static file; only the form endpoint `/api/submit` runs on the server.
- **Time needed:** about an hour of clicking, plus waiting for DNS (usually minutes, up to 24 to 48 hours).

Menu names in hPanel change from time to time. If a label below doesn't match exactly, look for the closest one.

---

## Part 1. Create the web app from GitHub

1. Log in to **hPanel** (hpanel.hostinger.com).
2. Go to **Websites → Create site** (or **Add website**) and choose **Web App** (Node.js).
3. Choose **Import Git repository**, then **Connect with GitHub**.
   - A GitHub window opens. Sign in as **Zohaib-mzb** and allow the Hostinger app access. You can limit it to just the **Fulfillment-3pl-website** repository.
4. Select the repository **Fulfillment-3pl-website**. Your earlier note called it `kinematics-website`, but on GitHub it is named Fulfillment-3pl-website.
5. Hostinger should detect **Astro**. Check every setting and change any that differ:

   | Setting | Value |
   | --- | --- |
   | Framework | **Astro** |
   | Node.js version | **24.x** |
   | Branch | **main** |
   | Install command | `npm ci` (or leave Hostinger's default, `npm install`) |
   | Build command | `npm run build` |
   | Output directory | `dist` |
   | Entry file | `dist/server/entry.mjs` |
   | Start command | `npm start` |

6. **Environment variables.** Add them now. The table is in Part 1a just below. You can come back for `RESEND_API_KEY` after Part 3, because forms only need it to send email.
7. Click **Deploy**. The first build takes a few minutes. You can follow it in the build log.

**Check:** when the build finishes, Hostinger gives the app a temporary address (something like `*.hostingersite.com`). Open it and the home page should load. If the build succeeded but the page doesn't load, open the app's **Runtime logs**.

### Part 1a. Environment variables

Add each one as a separate variable: the **name** in the left box and the **value** in the right box, with no quotes around values.

| Name | What to put in it |
| --- | --- |
| `EMAIL_PROVIDER` | `resend` |
| `RESEND_API_KEY` | Your Resend API key, which starts with `re_` (from Part 3, step 6). Keep it secret and never put it in GitHub. |
| `EMAIL_TO` | `info@kinematicstech.ca`: where form submissions are delivered. |
| `EMAIL_FROM` | `Kinematics Website <forms@kinematicstech.ca>`: the sender shown on form emails. It must be on the domain you verify in Resend. No mailbox is needed for `forms@`. |
| `PUBLIC_SITE_URL` | `https://kinematicstech.ca` |
| `PUBLIC_ANALYTICS_PROVIDER` | `none` for now. Later `plausible` or `ga4`, with the matching variable below. |
| `FORM_RATE_LIMIT` | `5` (optional; submissions allowed per visitor per form in each window) |
| `FORM_RATE_WINDOW_SEC` | `600` (optional; the window in seconds) |

Only when you turn analytics on:

| Name | What to put in it |
| --- | --- |
| `PUBLIC_PLAUSIBLE_DOMAIN` | `kinematicstech.ca` (with `PUBLIC_ANALYTICS_PROVIDER=plausible`) |
| `PUBLIC_GA4_ID` | Your GA4 measurement ID, `G-XXXXXXXXXX` (with `PUBLIC_ANALYTICS_PROVIDER=ga4`) |

**Do not add** `PORT` or `HOST`. Hostinger sets `PORT` itself, and the server already listens on all interfaces. Leave `PUBLIC_TRACKING_URL` out until a tracking system exists.

> Variables that start with `PUBLIC_` are built into the pages, so after changing one you must **redeploy**, not just restart. The others are read while the app runs; after changing those, **restart or redeploy** the app.

---

## Part 2. Connect kinematicstech.ca and www, and enable SSL

1. Open the app's dashboard in hPanel and choose **Connect domain** (or **Domains → Connect domain**).
2. Enter **kinematicstech.ca** and follow the prompts.
   - **If the domain is registered at Hostinger** and uses Hostinger nameservers, the DNS records are set for you.
   - **If it is registered elsewhere,** hPanel shows either nameservers to switch to or an `A` record to add at your registrar. Use exactly what hPanel shows. Switching to Hostinger's nameservers is simplest, because the email records in Part 3 then all live in one place: **hPanel → Domains → kinematicstech.ca → DNS / Nameservers**.
3. Add **www.kinematicstech.ca** as well, if hPanel lets you add it as an alias. If it asks for a record, add a `CNAME` named `www` pointing to `kinematicstech.ca` (or the value hPanel shows). The site itself sends `www` to the main address with a permanent redirect.
4. **SSL:** Hostinger installs a free certificate automatically once the domain points at the app. If it shows as not active after an hour, go to **Security → SSL**, select kinematicstech.ca and click **Install** (or **Reinstall**). Turn on **Force HTTPS** if the option appears.

**Check** (in a browser, or Terminal on your Mac):

```bash
curl -I https://kinematicstech.ca/                 # 200, with "strict-transport-security"
curl -I https://www.kinematicstech.ca/about        # 301 to https://kinematicstech.ca/about
curl -I http://kinematicstech.ca/                  # redirects to https://
curl -I https://kinematicstech.ca/about/           # 301 to /about
curl -sI -H 'Accept-Encoding: br' https://kinematicstech.ca/ | grep -i content-encoding   # br
```

---

## Part 3. Resend: form email for kinematicstech.ca

The website sends form submissions through **Resend**. Your inbox, `info@kinematicstech.ca` on **Hostinger Email**, keeps working exactly as it does now. Resend uses its own subdomain (`send.kinematicstech.ca`), so its records sit beside your existing email records rather than replacing them.

### 3.1 Add the domain in Resend

1. Create an account at **resend.com** and sign in.
2. Go to **Domains → Add domain**, enter `kinematicstech.ca` and pick a region. **North Virginia (us-east-1)** is the default; any region works.
3. Resend shows a table of DNS records. **Copy the values from that table**, not from this guide. The DKIM key is unique to your account, and the MX value depends on the region.

### 3.2 Add the records in Hostinger DNS

Go to **hPanel → Domains → kinematicstech.ca → DNS / Nameservers → DNS records**. Add each record below. In the **Name** box type only the part shown (for example `send`); Hostinger adds `.kinematicstech.ca` itself.

| # | Type | Name | Value | Priority | TTL |
| --- | --- | --- | --- | --- | --- |
| 1 | **MX** | `send` | `feedback-smtp.us-east-1.amazonses.com` (copy from Resend; the region part changes if you picked another region) | `10` | default |
| 2 | **TXT** | `send` | `v=spf1 include:amazonses.com ~all` | | default |
| 3 | **TXT** | `resend._domainkey` | The long value from Resend, starting `p=MIGfMA0...`. Paste it exactly, on one line. | | default |
| 4 | **TXT** | `_dmarc` | `v=DMARC1; p=none; rua=mailto:info@kinematicstech.ca; adkim=r; aspf=r` (see 3.4 first) | | default |

Records 1 to 3 are **Resend's**. Record 4 is your domain's **DMARC** policy, which covers both Resend and Hostinger Email.

### 3.3 SPF: how this fits with Hostinger Email's record

Your domain already has (or should have) Hostinger Email's records. **Do not delete or change them:**

| Type | Name | Value | Purpose |
| --- | --- | --- | --- |
| MX | `@` | `mx1.hostinger.com` (priority 5) and `mx2.hostinger.com` (priority 10) | delivers mail to your inbox |
| TXT | `@` | `v=spf1 include:_spf.mail.hostinger.com ~all` | SPF for mail you send from info@ |
| CNAME | `hostingermail-b._domainkey` and `hostingermail-c._domainkey` (some accounts also have `-a`) | `hostingermail-b.dkim.mail.hostinger.com`, `hostingermail-c.dkim.mail.hostinger.com` | DKIM for Hostinger Email |

The exact Hostinger Email values are listed at **hPanel → Emails → kinematicstech.ca → Connect domain / DNS records**. If any are missing, add them from there.

**Why you don't need to merge SPF records:** Resend sends with a return address on `send.kinematicstech.ca`, so receiving servers check the SPF record on `send` (record 2 above), not the one on `@`. Each name has one SPF record:

- `kinematicstech.ca` (`@`): `v=spf1 include:_spf.mail.hostinger.com ~all` (Hostinger Email; unchanged)
- `send.kinematicstech.ca`: `v=spf1 include:amazonses.com ~all` (Resend; new)

Rules to keep it working:

- **Never create a second SPF record on `@`.** Two `v=spf1` TXT records on the same name make SPF fail for both, which would hurt info@ as well.
- **Only if** you ever need another service to send directly from `@` (most don't), merge everything into the one `@` record. For example: `v=spf1 include:_spf.mail.hostinger.com include:amazonses.com ~all`. Keep a single `~all` at the end, and no more than 10 includes in total.
- Leave the `mx1/mx2.hostinger.com` MX records on `@` alone. The new MX record is on `send`, so it doesn't affect your inbox.

### 3.4 DMARC

- **Before adding record 4,** look in the DNS list for an existing TXT record named `_dmarc`. Hostinger sometimes creates one. **A domain may have only one DMARC record**, so if one exists, **edit** it to the value above instead of adding another.
- `p=none` only collects reports and blocks nothing. Daily summary reports go to info@kinematicstech.ca; if they become noise, change `rua` to another address or a free DMARC report service.
- After 2 to 4 weeks with both senders passing, which you can see in the reports, tighten it to `v=DMARC1; p=quarantine; rua=mailto:info@kinematicstech.ca; adkim=r; aspf=r`.

### 3.5 Verify the domain and set the variables

1. Back in Resend, click **Verify DNS records**. It usually passes within 15 minutes but can take up to 48 hours. If one record fails:
   - Check the **Name** doesn't end up doubled (for example `send.kinematicstech.ca.kinematicstech.ca`). Type only `send`.
   - Check the DKIM value was pasted whole, with no spaces or line breaks.
   - Check there is no other MX record on `send`.
2. When the domain shows **Verified**, go to **API Keys → Create API key**.
   - Name it `kinematicstech.ca website`.
   - Permission: **Sending access**, limited to the `kinematicstech.ca` domain.
   - Copy the key. Resend shows it only once.
3. In hPanel, open the app's **Environment variables** and set:
   - `RESEND_API_KEY`: the key you copied
   - `EMAIL_PROVIDER`: `resend`
   - `EMAIL_TO`: `info@kinematicstech.ca`
   - `EMAIL_FROM`: `Kinematics Website <forms@kinematicstech.ca>`
4. Save, then **restart or redeploy** the app.
5. Send a test email from **info@** to a Gmail address and back, to confirm your inbox still sends and receives normally.

---

## Part 4. After deploy: checks

### 4.1 Test every form end to end

On **https://kinematicstech.ca**, submit each form with real-looking test details, using your own email address as the sender:

| Form | Page | What to check |
| --- | --- | --- |
| Quote request | `/get-a-quote` | All three steps work; you land on the thank you message. An email arrives at info@ with subject "Quote request: …". **Reply** goes to the address you entered. |
| Contact | `/contact` | Email arrives with subject "Contact: …". |
| Job application | any job, for example `/careers/warehouse-associate` | Attach a small **PDF CV**. The email arrives with the CV attached. |
| Driver application | `/drive-with-us` | Email arrives with subject "Driver partner: …". |

Also check:

- **Without JavaScript:** in Chrome, DevTools → ⌘⇧P → "Disable JavaScript". Submit the contact form; you should land on `/thanks`. Turn JavaScript back on.
- **Marketing checkbox:** tick it once. The email should say "Marketing consent (CASL): Yes".
- **Not arriving?** Check spam first. Then look at **Resend → Emails** (did it send?) and the app's **Runtime logs** in hPanel (look for `[forms] send failed`).

### 4.2 Sitemap and robots

Open these and check they load:

- https://kinematicstech.ca/sitemap-index.xml: links to `sitemap-0.xml`, which lists 48 pages, all starting `https://kinematicstech.ca/`.
- https://kinematicstech.ca/robots.txt: shows `Allow: /` and the `Sitemap:` line.
- Also: https://kinematicstech.ca/llms.txt, https://kinematicstech.ca/rss.xml, and https://kinematicstech.ca/does-not-exist (the branded "missed the door" page).

### 4.3 Google Rich Results Test

Go to **search.google.com/test/rich-results**, test each URL below and confirm it reports **no errors**. Warnings about optional fields are fine.

| URL | Should detect |
| --- | --- |
| `https://kinematicstech.ca/` | Organization, Breadcrumbs |
| `https://kinematicstech.ca/services/fulfillment` | FAQ, Breadcrumbs |
| `https://kinematicstech.ca/service-areas/toronto` | Local business, FAQ, Breadcrumbs |
| `https://kinematicstech.ca/blog/how-to-choose-a-3pl-in-toronto` | Article, FAQ, Breadcrumbs |
| `https://kinematicstech.ca/careers/final-mile-delivery-drivers` | Job posting, Breadcrumbs |

Optionally, run the same URLs through **validator.schema.org** for a full schema view.

### 4.4 Google Search Console

1. Go to **search.google.com/search-console → Add property → Domain**, and enter `kinematicstech.ca`.
2. Google shows a **TXT** record (`google-site-verification=…`). Add it in **hPanel → Domains → kinematicstech.ca → DNS records** as Type **TXT**, Name `@`, with that value. It sits beside the SPF record on `@`, which is fine because it isn't an SPF record.
3. Click **Verify**. If it fails, wait 10 to 30 minutes and try again.
4. **Sitemaps** → enter `sitemap-index.xml` → **Submit**.
5. **URL Inspection** → paste `https://kinematicstech.ca/` → **Request indexing**. Repeat for the four service pages and the five city pages.
6. A week later, check **Pages** (indexing) and **Core Web Vitals**.

### 4.5 Bing Webmaster Tools

1. Go to **bing.com/webmasters**, sign in, and choose **Import from Google Search Console**. This is the fastest way: it brings the site and sitemap across. If you prefer, verify with DNS instead.
2. Open **Sitemaps** and confirm `https://kinematicstech.ca/sitemap-index.xml` is listed. If not, submit it.
3. Optional: turn on **IndexNow** in Bing's settings.

### 4.6 Google Business Profile

1. Go to **business.google.com → Add business**. Use business name **Kinematics** and pick a category such as **Logistics service**. Add secondary categories that fit, such as **Courier service** and **Warehouse**.
2. When asked whether customers visit your location, choose **No**. This makes it a **service area business** with the street address hidden.
3. **Service areas:** Toronto, Mississauga, Brampton, Vaughan, Markham.
4. **Hours:** Monday to Friday 9:00 to 18:00, Saturday 9:00 to 14:00, Sunday closed. These must match the website exactly.
5. **Website:** `https://kinematicstech.ca`.
6. **Phone:** add it only once it is also on the website (`SITE.phone` in `src/config/site.ts`), so the two always match.
7. **Description:** adapt the homepage summary. Leave out prices, rankings and anything that can't be verified.
8. Complete **verification**: Google offers video, phone, email or postcard, depending on the business.
9. Add real photos from `PHOTO_SHOTLIST.md` once you have them.

---

## Part 5. How updates work

- **Every push to `main` redeploys the site automatically.** Make a change, commit, `git push`, and Hostinger rebuilds. The new version is usually live within a few minutes. You can watch progress under the app's **Deployments** list in hPanel.
- **Before pushing,** you can check locally:
  ```bash
  npm run build && npm run audit
  PORT=4321 npm start          # open http://localhost:4321
  ```
- **If a deploy breaks something:** run `git revert HEAD` and `git push`, which redeploys the previous version. Or use **Redeploy** on an earlier deployment in hPanel, if offered.
- **Environment variables:** after changing a `PUBLIC_` variable, **redeploy**. After changing any other variable, restart or redeploy.
- **Content updates** (blog posts, jobs, hours, phone, LinkedIn): edit the files described in `README.md` (business details are all in `src/config/site.ts`), then push.
- **Legal pages:** if you change one, update `LEGAL_EFFECTIVE_DATE` in `src/config/site.ts` so the effective date stays accurate.

---

## Quick reference

| What | Where |
| --- | --- |
| App settings, environment variables, logs, deployments | hPanel → Websites → the web app's dashboard |
| DNS records | hPanel → Domains → kinematicstech.ca → DNS / Nameservers |
| SSL | hPanel → Security → SSL |
| Inbox (info@) | Hostinger Email / hPanel → Emails |
| Form email delivery log | resend.com → Emails |
| Business details on the site | `src/config/site.ts` |
| Full launch checklist | `LAUNCH_CHECKLIST.md` |
