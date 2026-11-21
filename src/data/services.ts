import type { QA } from '@/lib/schema';
import type { SceneName } from '@/components/illustrations/art';

export type ServiceSection = { h2: string; body: string; bullets?: string[] };

export type Service = {
  slug: string;
  href: string;
  name: string;
  short: string;
  serviceType: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  h1: string;
  /** 40–60 word plain answer: what, who for, where (AEO). */
  answer: string;
  art: SceneName;
  artAlt: string;
  sections: ServiceSection[];
  steps?: { title: string; text: string }[];
  stepsTitle?: string;
  faqs: QA[];
  relatedPosts: string[];
  relatedIndustries: string[];
};

export const SERVICES: Service[] = [
  {
    slug: 'fulfillment',
    href: '/services/fulfillment',
    name: 'Warehousing and fulfillment',
    short: 'Pallet and shelf storage, receiving, pick and pack, kitting, B2B orders and Amazon FBA prep.',
    serviceType: 'Third-party logistics (3PL) fulfillment',
    metaTitle: '3PL in Toronto for Ecommerce Brands | Kinematics',
    metaDescription:
      'Toronto 3PL for growing brands: pallet and shelf storage, pick and pack, kitting, B2B orders and Amazon FBA prep. No minimum volume. Get a custom quote.',
    eyebrow: '3PL warehousing and fulfillment',
    h1: 'A Toronto 3PL that packs it and delivers it',
    answer:
      'Kinematics Warehousing and Fulfillment is a third party logistics (3PL) service for ecommerce and wholesale brands in the Greater Toronto Area. We receive and store your inventory on pallets or shelves, pick and pack every order, prep Amazon FBA shipments and hand local orders straight to our own same day and next day delivery team.',
    art: 'store',
    artAlt: 'Illustration of a warehouse rack stocked with parcels and a live stock count badge.',
    sections: [
      {
        h2: 'What does a 3PL fulfillment partner actually do?',
        body:
          'A 3PL takes the physical side of selling off your plate. Instead of packing orders in a spare room or a rented unit, you send your inventory to us. We keep it organized, pack each order as it comes in from your store, and get it moving to your customer. You stay focused on product, marketing and the customers themselves.\n\nWhat makes Kinematics different is that fulfillment and delivery sit with one team. The people packing your orders hand them directly to the people delivering them across the GTA, so there is no handoff to a separate carrier for local orders and one place to ask when something needs attention.',
      },
      {
        h2: 'How does receiving work?',
        body:
          'Before stock arrives, you tell us what is coming: SKUs, quantities and how it is packed. When the shipment lands, we count it against that notice, check for visible damage and put each SKU into its own bin location. If anything doesn’t match, you hear about it with the details, not weeks later during a stocktake.',
        bullets: ['Parcels, cartons and pallets', 'Counts checked against your shipment notice', 'Discrepancies and damage reported to you', 'Put away into labelled bin locations'],
      },
      {
        h2: 'What storage do you offer?',
        body:
          'Every SKU gets a home. We store products the way they need to be stored: on shelving for small items and on pallet racking for cartons and full pallets. Bin locations keep picking accurate and fast, and we plan space around your sales pattern, not the other way round.',
        bullets: ['Pallet storage for cartons and bulk stock', 'Shelf storage for small, fast moving items', 'A bin location for every SKU', 'Regular inventory counts, reported to you'],
      },
      {
        h2: 'How do inventory counts work?',
        body:
          'Stock is counted when it arrives, and bin locations are counted again on a regular cycle so problems are caught early instead of at year end. Any difference between the count and the system is investigated and reported to you with the details.',
      },
      {
        h2: 'Can you hold overflow and Q4 peak stock?',
        body:
          'Yes. If your own space fills up before a launch or the holiday season, send the extra stock to us. We can hold overflow and Q4 peak inventory on its own, or use it to fulfil orders directly, and the space scales back down when the rush is over.',
      },
      {
        h2: 'How does pick and pack work?',
        body:
          'Orders flow from your store to us automatically. Each one is picked by scanning the item against the order, packed in a box or mailer that fits, and labelled at the bench. Orders that reach us before the daily cutoff are packed the same day. Your inserts, thank you cards and samples go in exactly where you want them.',
        bullets: ['Scan verified picking', 'Right sized boxes and mailers', 'Your inserts, samples and packing slips', 'Same day packing before the daily cutoff'],
      },
      {
        h2: 'Can you handle kitting and bundles?',
        body:
          'Yes. Gift sets, starter bundles, subscription boxes and promotional kits can be assembled ahead of time or built to order. We agree a kit recipe with you, so every bundle goes out the same way, and kits are tracked as their own SKUs so stock stays accurate.',
      },
      {
        h2: 'Do you fulfil B2B and wholesale orders?',
        body:
          'Yes. Alongside direct to consumer orders, we prepare wholesale and retail replenishment orders: case packs, mixed cartons and palletized shipments, labelled to your retail partner’s requirements. Local store deliveries across the GTA can ride with our own fleet through [B2B and retail delivery](/services/b2b-retail-delivery).',
      },
      {
        h2: 'Do you prep inventory for Amazon FBA?',
        body:
          'Yes. If you sell through Fulfillment by Amazon, we can prepare and label your inventory before it goes to Amazon, so it arrives ready to be checked in. Tell us what each shipment needs and we follow Amazon’s prep and labelling requirements for your products.',
        bullets: ['Unit labelling with your Amazon barcodes', 'Prep and packaging to Amazon’s requirements', 'Cartons packed and labelled for your inbound shipment', 'The same stock can also serve your own store'],
      },
      {
        h2: 'How do I see what is in stock?',
        body:
          'Stock levels update as units are received, picked, returned or adjusted, so the number your storefront shows is the number on our shelf. You can see order status, receiving history and inventory by SKU, and a real person on our team is a message away when you need context behind a number.',
      },
    ],
    stepsTitle: 'How does onboarding work?',
    steps: [
      { title: 'Talk it through', text: 'A short call about your products, order volume, packaging and delivery areas.' },
      { title: 'Get a plan and quote', text: 'We send a custom quote and an onboarding plan with dates. No published rate cards, no surprises.' },
      { title: 'Connect your store', text: 'We connect your Shopify, WooCommerce or BigCommerce store, or set up CSV ordering. Our API is coming soon.' },
      { title: 'Send your first stock', text: 'You ship inventory to us; we receive, count and put it away, and confirm the numbers with you.' },
      { title: 'Go live', text: 'Orders start flowing. We watch the first weeks closely and tune packaging and cutoffs with you.' },
    ],
    faqs: [
      { q: 'Do you work with small businesses in Toronto?', a: 'Yes. Many brands come to us when packing orders at home or in a small unit stops scaling. If you ship orders most days, a Toronto 3PL like Kinematics can usually take that work off your plate. [Get a custom quote](/get-a-quote) and we will tell you honestly whether it makes sense yet.' },
      { q: 'Is there a minimum order volume?', a: 'No. There is no minimum volume. We work with growing brands, so you can start with the orders you have today and scale with us. Tell us your monthly order range on the [quote form](/get-a-quote) and we will plan around it.' },
      { q: 'Do you offer Amazon FBA prep in Toronto?', a: 'Yes. We prep and label inventory for Amazon FBA at our Toronto area warehouse, following Amazon’s requirements for your products, and pack cartons ready for your inbound shipment.' },
      { q: 'Can I keep using my own packaging?', a: 'Yes. Send your branded boxes, mailers and inserts with your inventory and we will use them. We can also suggest right sized options if you need them.' },
      { q: 'Do you only deliver in the GTA?', a: 'Our own fleet delivers across Toronto, Mississauga, Brampton, Vaughan and Markham. Orders going further are handed to national carriers, so one fulfillment partner can cover all your orders.' },
      { q: 'How is fulfillment priced?', a: 'Every brand is different, so we do not publish rates. [Get a custom quote](/get-a-quote) and we will build pricing around your products and volume.' },
    ],
    relatedPosts: ['how-to-choose-a-3pl-in-toronto', 'small-business-warehousing-toronto', 'shopify-fulfillment-in-canada'],
    relatedIndustries: ['apparel-footwear', 'beauty-wellness', 'home-goods', 'subscription-boxes'],
  },
  {
    slug: 'final-mile-delivery',
    href: '/services/final-mile-delivery',
    name: 'Next day delivery',
    short: 'Next day delivery across the GTA as standard, with live tracking and photo proof.',
    serviceType: 'Last mile parcel delivery',
    metaTitle: 'Last Mile Delivery in Toronto and the GTA | Kinematics',
    metaDescription:
      'Next day last mile delivery across Toronto, Mississauga, Brampton, Vaughan and Markham. EV first fleet, live tracking and photo proof. Get a custom quote.',
    eyebrow: 'Next day delivery',
    h1: 'Next day last mile delivery across Toronto and the GTA',
    answer:
      'Kinematics Final Mile Delivery is a next day last mile delivery service for online brands with customers in Toronto, Mississauga, Brampton, Vaughan and Markham. We collect from your dock, or you drop parcels at our sort centre, and our EV first fleet delivers them with live tracking and photo proof of delivery.',
    art: 'drive',
    artAlt: 'Illustration of an electric delivery van following a dotted route across a map of the GTA.',
    sections: [
      {
        h2: 'How do my parcels get to Kinematics?',
        body:
          'Two ways, and you can mix them. If you ship from your own warehouse or store, we pick up from your dock on an agreed schedule. If it suits you better, drop parcels at our sort centre. And if we already store your inventory, there is nothing to arrange, orders go from our packing benches straight to sort.',
        bullets: ['Scheduled pickups from your dock', 'Drop off at our sort centre', 'Direct handoff when we fulfil your orders'],
      },
      {
        h2: 'How does next day delivery work across the GTA?',
        body:
          'Parcels that reach us by the daily cutoff are sorted the same evening, planned onto routes and out for delivery the next day. Your cutoff and pickup times are agreed in your plan so they fit your own order flow. When an order can’t wait until tomorrow, there is [same day delivery](/services/same-day-delivery).',
      },
      {
        h2: 'How do customers track their delivery?',
        body:
          'Your customer receives live tracking by SMS and email. They can see when their parcel is out for delivery and follow progress on the day, which cuts down on “where is my order?” messages to your support team.',
      },
      {
        h2: 'What proof of delivery do I get?',
        body:
          'Every delivery is completed with a photo showing where the parcel was left, time stamped at the door. For orders that need it, we collect a signature on request. The same proof goes to your customer and to you, so questions about a delivery can be settled in a minute rather than a week.',
        bullets: ['Photo of the parcel at the door', 'Signature on request', 'Delivery time recorded', 'Shared with you and your customer'],
      },
      {
        h2: 'What happens if a delivery can’t be completed?',
        body:
          'Sometimes a building is locked, or a parcel can’t safely be left unattended and nobody is home. When that happens, the customer is notified straight away, and the parcel is held at our sort centre for another attempt or for pickup, following rules we agree with you in advance. Parcels that can’t be delivered come back to you with a clear reason, not a mystery.',
      },
      {
        h2: 'Why does an EV first fleet matter?',
        body:
          'Dense city routes are where electric vans make the most sense: lots of short hops, lots of stops, no idling. We put electric vehicles on routes first and plan around their range. Read more about [EV delivery and our approach to sustainability](/ev-delivery).',
      },
    ],
    faqs: [
      { q: 'Which areas do you deliver to?', a: 'Our own fleet covers Toronto, Mississauga, Brampton, Vaughan and Markham. See all [GTA service areas](/service-areas).' },
      { q: 'Do I need to use your fulfillment to use your delivery?', a: 'No. Many brands use final mile delivery on its own. We collect from your dock or you drop parcels at our sort centre.' },
      { q: 'What size parcels do you deliver?', a: 'Typical ecommerce parcels, from mailers to larger boxes. If you ship bulky or unusual items, mention it on the [quote form](/get-a-quote) and we will confirm what works.' },
      { q: 'Can I get a delivery rate card?', a: 'We quote every account individually based on volume, parcel profile and delivery areas. [Get a custom quote](/get-a-quote).' },
      { q: 'Is there a minimum volume for next day delivery?', a: 'No. There is no minimum volume. Growing brands can start with the parcels they ship today.' },
    ],
    relatedPosts: ['next-day-delivery-in-the-gta', 'canada-post-alternatives-for-shopify-brands', 'ev-delivery-fleets-explained'],
    relatedIndustries: ['apparel-footwear', 'beauty-wellness', 'home-goods', 'subscription-boxes'],
  },
  {
    slug: 'same-day-delivery',
    href: '/services/same-day-delivery',
    name: 'Same day delivery',
    short: 'Our lead service: order by late morning, delivered the same day across the GTA.',
    serviceType: 'Same day parcel delivery',
    metaTitle: 'Same Day Delivery in Toronto and the GTA | Kinematics',
    metaDescription:
      'Same day delivery across Toronto and the GTA for businesses and online stores: order by late morning, delivered the same day. Photo proof, no minimums.',
    eyebrow: 'Same day delivery',
    h1: 'Same day delivery across Toronto and the GTA',
    answer:
      'Kinematics Same Day Delivery is our lead service for businesses and online stores across Toronto and the GTA. Order by late morning, delivered the same day: we pick, pack and deliver in our EV first fleet, with live SMS and email tracking, photo proof, signature on request and no minimum volume.',
    art: 'deliver',
    artAlt: 'Illustration of a parcel delivered to a front door with a phone showing a Delivered text.',
    sections: [
      {
        h2: 'How does the same day cutoff work?',
        body:
          'Same day runs on a simple rule: order by late morning, delivered the same day. The exact cutoff depends on where your customers are and how your orders reach us, and it is set in your plan. Orders that miss the cutoff roll into [next day delivery](/services/final-mile-delivery) automatically, so nothing falls through the gap.',
        bullets: ['Order by late morning for same day', 'Exact cutoff agreed in your plan', 'Missed cutoffs roll into next day'],
      },
      {
        h2: 'Is there a same day courier for businesses in Toronto?',
        body:
          'Yes. Same day is built for businesses as much as online stores. Shops, studios, offices and wholesale brands use it to get stock, samples and replacements across the GTA the same day, with the same tracking and proof as every other delivery. For a pickup that can’t wait for the usual schedule, book [rush delivery](/services/rush-scheduled-delivery).',
      },
      {
        h2: 'Which orders are a good fit for same day?',
        body:
          'Same day earns its keep when timing matters more than anything else in the order. Brands use it for:',
        bullets: [
          'Gifts and occasions: birthdays, holidays, last minute presents',
          'Replacements for an item that arrived damaged or wrong',
          'Beauty and wellness restocks customers have run out of',
          'Urgent wholesale top ups for local retail partners',
          'High value orders where a short time in transit is reassuring',
        ],
      },
      {
        h2: 'Can I offer same day at checkout?',
        body:
          'Yes. We help you set up a same day option for eligible GTA postal codes, with the cutoff shown clearly so customers know what they are choosing. Pair it with next day as the default and you have a fast, honest delivery promise at checkout.',
      },
      {
        h2: 'Do same day orders get tracking and photo proof?',
        body:
          'Always. Same day orders get the same live SMS and email tracking and photo proof of delivery as every other Kinematics delivery, and we collect a signature on request.',
      },
    ],
    faqs: [
      { q: 'What time is the same day cutoff?', a: 'Orders placed by late morning are delivered the same day. The precise cutoff for your account is set in your plan, based on your delivery areas.' },
      { q: 'Is same day available everywhere you deliver?', a: 'Same day is available across our GTA service areas for eligible postal codes. We confirm coverage for your customer base when we set up your account.' },
      { q: 'Can I use same day for only some orders?', a: 'Yes. You can offer it as a checkout option alongside next day, so customers choose it when they need it.' },
      { q: 'Is there a minimum volume for same day delivery?', a: 'No. There is no minimum volume, so growing brands can offer same day from their first orders. [Get a custom quote](/get-a-quote).' },
      { q: 'Do I need to store stock with you to use same day?', a: 'No. If we hold your inventory, orders go from our packing benches straight onto same day routes. If you pack yourself, print our labels and we collect from you.' },
    ],
    relatedPosts: ['next-day-delivery-in-the-gta', 'shopify-fulfillment-in-canada', 'canada-post-alternatives-for-shopify-brands'],
    relatedIndustries: ['beauty-wellness', 'apparel-footwear', 'home-goods'],
  },
  {
    slug: 'rush-scheduled-delivery',
    href: '/services/rush-scheduled-delivery',
    name: 'Rush and scheduled delivery',
    short: 'On demand pickups within the GTA for urgent orders, and delivery time windows.',
    serviceType: 'Rush and scheduled courier delivery',
    metaTitle: 'Rush and Scheduled Delivery in Toronto | Kinematics',
    metaDescription:
      'Rush delivery in Toronto and the GTA with on demand pickups, plus scheduled delivery windows for appointments and business receiving hours. Get a quote.',
    eyebrow: 'Rush and scheduled delivery',
    h1: 'Rush and scheduled delivery in Toronto and the GTA',
    answer:
      'Kinematics Rush and Scheduled Delivery is for orders that need a specific time. Book an on demand pickup anywhere in our GTA service areas for rush delivery in Toronto, or schedule delivery in a time window for appointments, business receiving hours and customers who need to be home. Every delivery is tracked and photographed.',
    art: 'drive',
    artAlt: 'Illustration of an electric delivery van following a dotted route across a map of the GTA.',
    sections: [
      {
        h2: 'How does rush delivery work?',
        body:
          'When something can’t wait for the next scheduled run, request an on demand pickup. We send a driver to collect it from your shop, office or warehouse within our GTA service areas and take it straight to its destination. We confirm the expected delivery time when you book, so you can tell your customer exactly what to expect.',
        bullets: ['On demand pickups within the GTA', 'Delivered directly, without waiting for the next route', 'Expected delivery time confirmed when you book', 'Live tracking and photo proof'],
      },
      {
        h2: 'What is a scheduled delivery window?',
        body:
          'Some deliveries need to arrive at a set time: a customer who has to be home, an office with set receiving hours, or a launch that has to land on a particular day. Scheduled delivery lets you choose a delivery day and time window, and we plan the route around it. Your customer is told the window in advance and gets live updates on the day.',
      },
      {
        h2: 'Who uses rush and scheduled delivery?',
        body: 'Brands and businesses across the GTA use it for:',
        bullets: [
          'Urgent replacements and missing items',
          'Deliveries to offices and stores with receiving hours',
          'Larger or high value orders where someone needs to be home',
          'Launches, events and gifts that must arrive on a set day',
          'Stock moves between your own locations in the GTA',
        ],
      },
      {
        h2: 'Do rush and scheduled deliveries get tracking and proof?',
        body:
          'Yes. Every rush and scheduled delivery gets live SMS and email tracking, a photo of where the parcel was left, and a signature on request. You see the same proof as your customer.',
      },
    ],
    faqs: [
      { q: 'How fast is rush delivery in Toronto?', a: 'Rush orders are picked up on demand and delivered directly, without waiting for the next scheduled route. We confirm the expected delivery time when you book, based on the pickup and drop off addresses.' },
      { q: 'Can I book a scheduled delivery window?', a: 'Yes. Choose a delivery day and time window when you book, and we plan the route around it. Your customer is told the window in advance.' },
      { q: 'Where are rush and scheduled deliveries available?', a: 'Within our GTA service areas: Toronto, Mississauga, Brampton, Vaughan and Markham. See all [service areas](/service-areas).' },
      { q: 'Is there a minimum volume?', a: 'No. Book a single rush pickup or schedule regular windows. [Get a custom quote](/get-a-quote) for your usual pattern.' },
    ],
    relatedPosts: ['next-day-delivery-in-the-gta', 'ev-delivery-fleets-explained'],
    relatedIndustries: ['home-goods', 'beauty-wellness', 'apparel-footwear'],
  },
  {
    slug: 'b2b-retail-delivery',
    href: '/services/b2b-retail-delivery',
    name: 'B2B and retail delivery',
    short: 'Store replenishment, wholesale orders and business to business drops across the GTA.',
    serviceType: 'B2B and retail store delivery',
    metaTitle: 'B2B and Retail Delivery Across the GTA | Kinematics',
    metaDescription:
      'B2B delivery across the GTA: store replenishment, wholesale orders and business to business drops, routed around receiving hours, with proof. Get a quote.',
    eyebrow: 'B2B and retail delivery',
    h1: 'B2B and retail delivery across the GTA',
    answer:
      'Kinematics B2B and Retail Delivery moves stock between businesses across the GTA. We deliver store replenishment to your retail partners, wholesale and case pack orders, and business to business drops to shops and offices, routed around receiving hours, with tracking, photo proof and a signature on request.',
    art: 'pack',
    artAlt: 'Illustration of a packing station with a box being closed and a label printing.',
    sections: [
      {
        h2: 'What B2B deliveries do you handle?',
        body: 'The same fleet that delivers to your customers’ doors also delivers to businesses:',
        bullets: [
          'Store replenishment for retail partners',
          'Wholesale and case pack orders',
          'Business to business drops to shops, studios and offices',
          'Stock moves between your own locations',
        ],
      },
      {
        h2: 'How does store replenishment work?',
        body:
          'If we hold your inventory, replenishment orders are picked and packed in our warehouse, labelled to your retail partner’s requirements and delivered across the GTA by our own team. If you pack them yourself, we collect from you on an agreed schedule. Either way, you get one record for every store drop.',
      },
      {
        h2: 'Can you deliver during receiving hours?',
        body:
          'Yes. Business addresses are routed for delivery during working hours, and we can book a [scheduled delivery window](/services/rush-scheduled-delivery) when a store or office has set receiving times. Drivers follow the delivery notes you give us, such as a loading door or a contact name.',
      },
      {
        h2: 'What proof do businesses get?',
        body:
          'Every B2B delivery is recorded with a photo of where it was handed over and the delivery time, and we collect a signature on request. That record makes questions from a store or a buyer quick to settle.',
      },
      {
        h2: 'Can my B2B and online orders share one partner?',
        body:
          'Yes. Wholesale orders and direct to consumer orders can come from the same stock in our [warehouse](/services/fulfillment) and travel in the same fleet, so you manage one inventory and one delivery partner instead of several.',
      },
    ],
    faqs: [
      { q: 'Do you offer B2B delivery across the GTA?', a: 'Yes. We deliver store replenishment, wholesale orders and business to business drops across Toronto, Mississauga, Brampton, Vaughan and Markham.' },
      { q: 'Can you label orders to a retailer’s requirements?', a: 'Yes. Tell us your retail partner’s labelling and packing requirements and we prepare replenishment orders to match.' },
      { q: 'Can I get a signature for B2B deliveries?', a: 'Yes. Signature is available on request, alongside photo proof and the delivery time.' },
      { q: 'Is there a minimum volume?', a: 'No. We work with growing brands, from a few store drops a week upward. [Get a custom quote](/get-a-quote).' },
    ],
    relatedPosts: ['how-to-choose-a-3pl-in-toronto', 'small-business-warehousing-toronto'],
    relatedIndustries: ['home-goods', 'apparel-footwear', 'beauty-wellness'],
  },
  {
    slug: 'returns',
    href: '/services/returns',
    name: 'Returns',
    short: 'Customer pickup, inspection, restock or dispose, and reporting on every return.',
    serviceType: 'Returns management and reverse logistics',
    metaTitle: 'Ecommerce Returns Management in Canada | Kinematics',
    metaDescription:
      'Ecommerce returns management and reverse logistics from Toronto: doorstep pickups in the GTA, inspection, fast restocking and clear reporting.',
    eyebrow: 'Returns',
    h1: 'Returns that get back on the shelf, fast',
    answer:
      'Kinematics Returns is an ecommerce returns management and reverse logistics service for online brands with customers in the Greater Toronto Area. We collect returns from customers’ doors or accept them at our facility, inspect every item, restock what is sellable, handle what is not, and report back so refunds and inventory stay accurate.',
    art: 'return',
    artAlt: 'Illustration of a parcel travelling along a dashed arc from a house back to the warehouse.',
    sections: [
      {
        h2: 'How do return pickups work?',
        body:
          'Your customer starts a return through your store’s usual returns process. For customers in our GTA service areas, our drivers can collect the parcel from their door on a delivery route, with no trip to a post office. Returns from further away can come back to us by national carrier.',
      },
      {
        h2: 'What happens during inspection?',
        body:
          'Every return is opened, checked against what was ordered and graded using rules you set. Typical grades are:',
        bullets: [
          'Sellable: back into stock as new',
          'Repack: needs new packaging or a tidy up before restocking',
          'Not sellable: set aside to donate, recycle or dispose of, per your instructions',
        ],
      },
      {
        h2: 'How quickly are returns restocked?',
        body:
          'Returns are processed as they arrive, and sellable items go straight back into their bin location. Your stock count updates as soon as an item is restocked, so a returned item can be sold again quickly instead of sitting in a pile.',
      },
      {
        h2: 'What reporting do I get on returns?',
        body:
          'Each return is logged with the order, SKU, return reason your customer gave, the condition we found and what we did with it. That record makes refunds and exchanges straightforward, and over time it shows you which products come back and why.',
        bullets: ['Order and SKU', 'Customer’s stated reason', 'Condition and grade', 'Outcome: restocked, repacked or disposed'],
      },
    ],
    faqs: [
      { q: 'Can you handle exchanges?', a: 'Yes. When a return is received and graded, the exchange item can be packed and sent out, and the returned item is restocked if it is sellable.' },
      { q: 'Do you process returns for brands that don’t use your fulfillment?', a: 'Returns work best when we also hold your inventory, because restocking is immediate. Talk to us if you only need returns and we will look at the options.' },
      { q: 'Is there a minimum volume for returns?', a: 'No. There is no minimum volume, so returns work for growing brands from the first parcel back.' },
      { q: 'What do you do with items that can’t be resold?', a: 'Whatever you choose: hold them for you, donate, recycle or dispose of them responsibly. Your rules are set during onboarding.' },
    ],
    relatedPosts: ['returns-that-dont-hurt-margins'],
    relatedIndustries: ['apparel-footwear', 'home-goods', 'beauty-wellness'],
  },
];

const ORDER = ['same-day-delivery', 'final-mile-delivery', 'rush-scheduled-delivery', 'b2b-retail-delivery', 'fulfillment', 'returns'];
SERVICES.sort((a, b) => ORDER.indexOf(a.slug) - ORDER.indexOf(b.slug));

export const serviceBySlug = (slug: string) => SERVICES.find((s) => s.slug === slug)!;
