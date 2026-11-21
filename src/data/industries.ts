import type { QA } from '@/lib/schema';
import type { SceneName } from '@/components/illustrations/art';

export type Industry = {
  slug: string;
  name: string;
  short: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  answer: string;
  art: SceneName;
  artAlt: string;
  pains: { title: string; text: string }[];
  solutions: { title: string; text: string; href?: string }[];
  faqs: QA[];
  relatedServices: string[];
  relatedPosts: string[];
};

export const INDUSTRIES: Industry[] = [
  {
    slug: 'apparel-footwear',
    name: 'Apparel and footwear',
    short: 'Size and colour SKUs, launch day spikes and a steady flow of exchanges.',
    metaTitle: 'Apparel & Footwear Fulfillment in Toronto | Kinematics',
    metaDescription:
      'Fulfillment and next day GTA delivery for apparel and footwear brands: variant level accuracy, launch day packing, fast exchanges and returns restocking.',
    h1: 'Fulfillment and delivery for apparel and footwear brands',
    answer:
      'Kinematics helps apparel and footwear brands selling online in the Greater Toronto Area store every size and colour accurately, pack launch day orders quickly, deliver next day across the GTA and turn returns and exchanges around fast, all with one team handling storage, packing, delivery and returns.',
    art: 'store',
    artAlt: 'Illustration of a rack with parcels organized by SKU.',
    pains: [
      { title: 'Variants multiply fast', text: 'One style in six sizes and four colours is 24 SKUs. Picking the wrong one means a return before the customer has even worn it.' },
      { title: 'Drops create spikes', text: 'A launch or a sale can bring a week’s orders in a morning, and customers expect the same speed as on a quiet Tuesday.' },
      { title: 'Returns are part of the model', text: 'Fit is personal. Exchanges and returns are normal. The cost comes from how slowly they get back on the shelf.' },
    ],
    solutions: [
      { title: 'A bin for every variant', text: 'Each size and colour has its own location and is scan verified at pick, so the right variant goes in the box.', href: '/services/fulfillment' },
      { title: 'Launch planning', text: 'Tell us about drops ahead of time and we plan receiving, kitting and packing capacity around them.' },
      { title: 'Folded, protected, on brand', text: 'Garments are folded and bagged to your standard, with your tissue, stickers and inserts.' },
      { title: 'Exchanges that move', text: 'Doorstep return pickups in the GTA, inspection and restocking, so exchanged sizes are back in stock quickly.', href: '/services/returns' },
    ],
    faqs: [
      { q: 'Can you handle exchanges as well as returns?', a: 'Yes. When the returned item is graded, the replacement size or colour is packed and sent, and the original is restocked if it is sellable.' },
      { q: 'Can you steam or relabel garments?', a: 'Tell us what your products need on the [quote form](/get-a-quote) and we will confirm what we can do as part of your plan.' },
    ],
    relatedServices: ['fulfillment', 'returns', 'final-mile-delivery'],
    relatedPosts: ['returns-that-dont-hurt-margins', 'how-to-choose-a-3pl-in-toronto'],
  },
  {
    slug: 'beauty-wellness',
    name: 'Beauty and wellness',
    short: 'Small, valuable, often fragile products, and customers who reorder.',
    metaTitle: 'Beauty & Wellness Fulfillment in the GTA | Kinematics',
    metaDescription:
      'Fulfillment and same day or next day GTA delivery for beauty and wellness brands: careful packing, gift set kitting and fast restocks for repeat buyers.',
    h1: 'Fulfillment and delivery for beauty and wellness brands',
    answer:
      'Kinematics gives beauty and wellness brands selling in the Greater Toronto Area careful packing for glass and liquids, kitting for gift sets and bundles, and fast next day or same day delivery across the GTA, so repeat customers get their favourite products before they run out.',
    art: 'pack',
    artAlt: 'Illustration of a packing station with a box being closed and a label printing.',
    pains: [
      { title: 'Fragile and leak prone', text: 'Glass bottles, droppers and pumps need packing that survives the trip without drowning the unboxing in filler.' },
      { title: 'Unboxing is the brand', text: 'The moment the box opens is part of the product. Sloppy packing undoes good marketing.' },
      { title: 'Running out is a churn risk', text: 'When a customer runs out of a daily product, a slow restock is an invitation to try something else.' },
    ],
    solutions: [
      { title: 'Packed to protect', text: 'Liquids sealed and bagged, glass cushioned, every box sized to the order.', href: '/services/fulfillment' },
      { title: 'Gift sets and bundles', text: 'Kits assembled to a set recipe and tracked as their own SKUs, ready for holiday peaks.' },
      { title: 'Same day restocks', text: 'Offer same day across the GTA for customers who have just run out.', href: '/services/same-day-delivery' },
      { title: 'Your unboxing, every time', text: 'Branded boxes, tissue, samples and cards placed exactly to your spec.' },
    ],
    faqs: [
      { q: 'Can you track batch numbers or best before dates?', a: 'Tell us what your products need during onboarding. We will confirm how batch and date information is handled for your account before you send stock.' },
      { q: 'Can you include free samples in certain orders?', a: 'Yes. Inserts and samples can be added to every order or to orders that meet rules you set, such as a first purchase.' },
    ],
    relatedServices: ['fulfillment', 'same-day-delivery', 'final-mile-delivery'],
    relatedPosts: ['shopify-fulfillment-in-canada', 'next-day-delivery-in-the-gta'],
  },
  {
    slug: 'home-goods',
    name: 'Home goods',
    short: 'Breakables, awkward sizes and multi box orders, handled with care.',
    metaTitle: 'Home Goods Fulfillment & Delivery in the GTA | Kinematics',
    metaDescription:
      'Fulfillment and final mile delivery for home goods brands in the GTA: protective packing, multi box orders, photo proof at the door and easy returns.',
    h1: 'Fulfillment and delivery for home goods brands',
    answer:
      'Kinematics helps home goods brands with customers in the Greater Toronto Area pack breakable and awkwardly sized products properly, keep multi box orders together, and deliver them next day across the GTA with photo proof at the door, so damage claims and lost parcel disputes become rare.',
    art: 'deliver',
    artAlt: 'Illustration of a parcel delivered to a front door with a photo proof ring.',
    pains: [
      { title: 'Breakage eats margin', text: 'A broken vase costs the item, the reshipment, the return and often the customer.' },
      { title: 'Odd shapes, multiple boxes', text: 'Lamps, frames and sets don’t fit standard boxes, and multi box orders tend to arrive on different days.' },
      { title: '“It never arrived”', text: 'Bigger parcels left at the wrong door turn into expensive disputes without proof.' },
    ],
    solutions: [
      { title: 'Protective packing', text: 'Right sized boxes and proper protection for ceramics, glass and finishes.', href: '/services/fulfillment' },
      { title: 'Orders that travel together', text: 'Multi box orders are labelled as a set and delivered on the same route.', href: '/services/final-mile-delivery' },
      { title: 'Photo proof at every door', text: 'Every delivery is photographed where it was left, and the photo goes to you and your customer.' },
      { title: 'Returns graded honestly', text: 'Returned items are inspected and graded, so only sellable stock goes back on the shelf.', href: '/services/returns' },
    ],
    faqs: [
      { q: 'Can you deliver bulky items?', a: 'We deliver typical ecommerce parcels and larger boxes. For furniture scale items, tell us your product sizes on the [quote form](/get-a-quote) and we will confirm fit.' },
      { q: 'Do you photograph deliveries for every order?', a: 'Yes. Every delivery by our fleet is completed with a photo of where the parcel was left.' },
    ],
    relatedServices: ['fulfillment', 'final-mile-delivery', 'returns'],
    relatedPosts: ['returns-that-dont-hurt-margins', 'next-day-delivery-in-the-gta'],
  },
  {
    slug: 'subscription-boxes',
    name: 'Subscription boxes',
    short: 'Monthly peaks, multi item kits and boxes that need to land on time.',
    metaTitle: 'Subscription Box Fulfillment in Toronto & GTA | Kinematics',
    metaDescription:
      'Subscription box fulfillment in the GTA: scheduled kitting runs, personalized inserts and next day delivery so every box lands in the same window.',
    h1: 'Fulfillment and delivery for subscription boxes',
    answer:
      'Kinematics helps subscription box brands with subscribers in the Greater Toronto Area assemble monthly boxes on schedule, add personalized inserts, and deliver every box next day across the GTA, so subscribers receive their box in the window they expect and churn from late or wrong boxes drops.',
    art: 'sort',
    artAlt: 'Illustration of parcels passing through a scanning arch into sorting lanes.',
    pains: [
      { title: 'All the orders, all at once', text: 'Most of the month is quiet, then every box has to ship in a few days.' },
      { title: 'Many items, one box', text: 'Each box combines several SKUs, sometimes with variations by subscriber.' },
      { title: 'Late boxes cause churn', text: 'Subscribers compare notes. A box that arrives days after everyone else’s is a cancellation waiting to happen.' },
    ],
    solutions: [
      { title: 'Scheduled kitting runs', text: 'We book your assembly run ahead of your ship window and build boxes to an agreed recipe.', href: '/services/fulfillment' },
      { title: 'Personalized inserts', text: 'Names, notes and variant picks matched to each subscriber’s order.' },
      { title: 'Delivered in the same window', text: 'Next day delivery across the GTA means local subscribers receive their boxes together.', href: '/services/final-mile-delivery' },
      { title: 'Skips and swaps handled', text: 'Returns and swapped items are inspected and restocked for the next cycle.', href: '/services/returns' },
    ],
    faqs: [
      { q: 'Can you store inventory between cycles?', a: 'Yes. Components are stored between runs and counted, so you know what you have before planning next month’s box.' },
      { q: 'Can boxes vary by subscriber?', a: 'Yes, within rules we agree in advance, for example size or flavour preferences that change one item in the box.' },
    ],
    relatedServices: ['fulfillment', 'final-mile-delivery'],
    relatedPosts: ['shopify-fulfillment-in-canada', 'how-to-choose-a-3pl-in-toronto'],
  },
];

export const industryBySlug = (slug: string) => INDUSTRIES.find((i) => i.slug === slug)!;
