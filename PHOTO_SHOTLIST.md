# Photo shot list

The site currently uses on-brand SVG illustrations everywhere, plus clearly labelled `<PhotoPlaceholder>` slots where a real photo belongs. This list covers every slot (by **shot ID**, matching the `shot` prop in the code) and a few optional shots for later.

## General direction

- **Look:** natural light, clean and uncluttered, plenty of negative space, matching the site's minimalist style. Avoid heavy filters.
- **Colour:** let the brand colours show up naturally: navy uniforms or vans, teal stripe and tape, white or light-grey surroundings. Orange only as a small accent (for example, a safety vest detail). Avoid other strong brand colours in frame.
- **People:** real team members, with signed model releases. **Never photograph customers, their faces, house numbers or licence plates.** Blur or avoid any identifying details.
- **Format:** shoot RAW, deliver high-res JPEG (at least 2400 px on the long edge). The site converts to AVIF/WebP with responsive sizes through `astro:assets`.
- **Orientation:** shoot each scene landscape *and* portrait where you can.
- **Accessibility:** for each delivered photo, write a one-line description to use as alt text.

## Required shots (used on the site now)

| Shot ID | Where it appears | Ratio | Description |
|---|---|---|---|
| **CAR-01** | `/careers` hero (currently a rendered 3D still of the warehouse exterior, `src/assets/careers/warehouse.png`; replace with a real photo when available) | 4:3 | 3–5 team members on the warehouse floor between racks, mid-conversation, relaxed and candid. Mixed roles (driver in uniform, warehouse associate, dispatcher). |
| **WH-01** | `/about` | 16:9 | Wide shot down a clean warehouse aisle with stocked, labelled racks. Low angle, symmetrical, with a teal floor line if available. |
| **FLEET-01** | `/about` | 16:9 | An electric van with the teal stripe at the loading dock, rear doors open, parcels being loaded. Plate not visible. |

## Optional shots (for later pages, blog posts and social)

| Shot ID | Suggested use | Description |
|---|---|---|
| OPT-PACK | Fulfillment page, beauty industry page | Hands packing a branded box at a packing bench: tissue, insert card, label printer in the background. |
| OPT-SCAN | How it works | Close-up of a handheld scanner reading a parcel barcode. |
| OPT-SORT | Final-mile page | Parcels sorted into route lanes or cages, shot from above. |
| OPT-DOOR | Final-mile, city pages | A parcel set neatly at a front door: the photo-proof moment. No house number, no people. |
| OPT-CHARGE | EV page | An electric van plugged in at a charger, early morning or dusk light. |
| OPT-RETURNS | Returns page | An associate inspecting a returned garment at a bench with grading bins. |
| OPT-DISPATCH | Dispatcher job, careers | A dispatcher at a desk with route maps on screen (blur any customer data). |
| OPT-CITY-x | City pages | A recognisable but generic streetscape in each city (Toronto, Mississauga, Brampton, Vaughan, Markham), with no identifiable people. |

## Swapping a placeholder for a photo

1. Put the image in `src/assets/photos/` (for example, `src/assets/photos/wh-01.jpg`).
2. Replace the `<PhotoPlaceholder shot="WH-01" … />` with:

   ```astro
   ---
   import { Image } from 'astro:assets';
   import wh01 from '@/assets/photos/wh-01.jpg';
   ---
   <Image src={wh01} alt="A clean warehouse aisle with labelled racks of parcels" widths={[480, 800, 1200, 1600]} sizes="(min-width: 1024px) 50vw, 100vw" formats={['avif', 'webp']} class="rounded-card" />
   ```

3. Above-the-fold photos get `loading="eager" fetchpriority="high"`; everything else stays lazy (the default).
