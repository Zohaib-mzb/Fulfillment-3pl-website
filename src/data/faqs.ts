import type { QA } from '@/lib/schema';

export type FaqGroup = { id: string; title: string; items: QA[] };

export const FAQ_GROUPS: FaqGroup[] = [
  {
    id: 'fulfillment',
    title: 'Fulfillment',
    items: [
      { q: 'What is a 3PL?', a: 'A third party logistics provider (3PL) stores your inventory and packs and ships your orders for you. Kinematics also delivers those orders across the GTA with our own fleet. See [fulfillment services](/services/fulfillment).' },
      { q: 'Where is Kinematics based?', a: 'We are a Toronto company serving brands with customers across the Greater Toronto Area: Toronto, Mississauga, Brampton, Vaughan and Markham.' },
      { q: 'How quickly are orders packed?', a: 'Orders that reach us before the daily cutoff are picked and packed the same day. Your cutoff is set in your plan.' },
      { q: 'Can I use my own packaging and inserts?', a: 'Yes. Send branded boxes, mailers, tissue and inserts with your stock and we will pack to your standard.' },
      { q: 'Do you handle wholesale and retail orders?', a: 'Yes. We prepare case packs, mixed cartons and pallet shipments for retail partners alongside direct to consumer orders, and deliver them across the GTA with [B2B and retail delivery](/services/b2b-retail-delivery).' },
      { q: 'Is there a minimum volume to work with Kinematics?', a: 'No. There is no minimum volume. We work with growing brands, so you get big carrier service from your first regular orders and scale with us as you grow.' },
      { q: 'Do you offer Amazon FBA prep?', a: 'Yes. We prep and label inventory for Amazon FBA, following Amazon’s requirements for your products, and pack cartons ready for your inbound shipment. See [warehousing and fulfillment](/services/fulfillment).' },
    ],
  },
  {
    id: 'delivery',
    title: 'Delivery',
    items: [
      { q: 'Which areas does Kinematics deliver to?', a: 'Our own fleet delivers across Toronto, Mississauga, Brampton, Vaughan and Markham. See all [service areas](/service-areas).' },
      { q: 'Do you offer same day delivery in Toronto?', a: 'Yes. Same day is our lead service: order by late morning, delivered the same day across our GTA service areas. See [same day delivery](/services/same-day-delivery).' },
      { q: 'What is the same day cutoff?', a: 'Order by late morning, delivered the same day. The exact cutoff for your account is set in your plan, based on your delivery areas and how orders reach us. Orders that miss it go out next day.' },
      { q: 'Do you offer next day delivery in the GTA?', a: 'Yes. Next day delivery across the GTA is our standard option for parcels that reach us by the daily cutoff. See [next day delivery](/services/final-mile-delivery).' },
      { q: 'Can I book a rush delivery?', a: 'Yes. Request an on demand pickup within our GTA service areas and we deliver it directly, without waiting for the next route. We confirm the expected delivery time when you book. See [rush and scheduled delivery](/services/rush-scheduled-delivery).' },
      { q: 'Can I schedule a delivery time window?', a: 'Yes. Choose a delivery day and time window for appointments, business receiving hours or customers who need to be home, and we plan the route around it.' },
      { q: 'How does tracking work?', a: 'Your customer gets live tracking by SMS and email and can follow progress on delivery day. Every delivery is completed with photo proof, and we collect a signature on request.' },
      { q: 'Are your delivery vehicles electric?', a: 'Our fleet is EV first: electric vans are assigned to routes first, and route plans are built around their range. Read about [EV delivery](/ev-delivery).' },
      { q: 'Is your whole fleet electric?', a: 'We are EV first. Most routes run on EVs, and we use cargo vans and box trucks when a load needs more space.' },
      { q: 'What if my customer is not home?', a: 'Parcels are left safely where possible and photographed. If a parcel can’t be left, the customer is notified and the parcel is held for another attempt or pickup, following rules agreed with you.' },
    ],
  },
  {
    id: 'returns',
    title: 'Returns',
    items: [
      { q: 'Can you pick up returns from my customers?', a: 'Yes. For customers in our GTA service areas, drivers can collect returns from the door. See [returns](/services/returns).' },
      { q: 'What happens to returned items?', a: 'Each return is inspected and graded. Sellable items are restocked, items needing attention are repacked, and the rest are handled according to your rules.' },
    ],
  },
  {
    id: 'integrations',
    title: 'Integrations',
    items: [
      { q: 'Does Kinematics work with Shopify?', a: 'Yes. Shopify is our primary integration: orders flow to us automatically and stock levels sync back. A Kinematics app in the Shopify App Store is coming soon. See [integrations](/integrations).' },
      { q: 'What if I don’t use Shopify?', a: 'We also connect with WooCommerce and BigCommerce and accept orders by CSV upload. An API is coming soon.' },
      { q: 'How do your shipping labels work?', a: 'If you pack your own orders, print Kinematics labels for parcels going to our GTA service areas. Each day’s parcels are listed on a daily manifest, which our driver checks at pickup. If we fulfil your orders, we label them at the packing bench. See [integrations](/integrations).' },
    ],
  },
  {
    id: 'careers',
    title: 'Careers and drivers',
    items: [
      { q: 'Is Kinematics hiring?', a: 'We hire for warehouse, dispatch and driving roles. See [open roles](/careers).' },
      { q: 'I own a van or run a small fleet. Can I work with you?', a: 'Yes. Independent drivers and fleet operators can apply on the [drive with us](/drive-with-us) page.' },
      { q: 'How much does it cost to get a quote?', a: 'Nothing. [Get a custom quote](/get-a-quote) and we will reply with a plan built around your products and volume.' },
    ],
  },
];

export const ALL_FAQS: QA[] = FAQ_GROUPS.flatMap((g) => g.items);
const pick = (q: string) => ALL_FAQS.find((f) => f.q === q)!;
export const HOME_FAQS: QA[] = [
  pick('What is a 3PL?'),
  pick('What is the same day cutoff?'),
  pick('Is there a minimum volume to work with Kinematics?'),
  pick('Which areas does Kinematics deliver to?'),
  pick('Does Kinematics work with Shopify?'),
];
