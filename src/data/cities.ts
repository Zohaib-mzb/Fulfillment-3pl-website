import type { QA } from '@/lib/schema';

export type City = {
  slug: string;
  name: string;
  region: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  /** 40–60 word plain answer (AEO): what, who for, where. */
  answer: string;
  intro: string[];
  neighbourhoods: string[];
  sections: { h2: string; body: string }[];
  faqs: QA[];
  nearby: string[];
};

/**
 * Local SEO pages. Copy is unique per city. Neighbourhood lists are illustrative
 * coverage examples — confirm against the live delivery zone before launch
 * (see LAUNCH_CHECKLIST.md). Coverage is ultimately by postal code.
 */
export const CITIES: City[] = [
  {
    slug: 'toronto',
    name: 'Toronto',
    region: 'City of Toronto',
    metaTitle: 'Ecommerce Delivery in Toronto: Same Day & Next Day',
    metaDescription:
      'Same day and next day delivery in Toronto for online brands, from the downtown core to Scarborough and Etobicoke. EV first, photo proof, live tracking.',
    h1: 'Ecommerce delivery in Toronto, same day and next day',
    answer:
      'Kinematics delivers online orders to customers across the City of Toronto (downtown, midtown, North York, Scarborough, Etobicoke and East York), next day as standard and same day for orders placed by late morning. It is built for ecommerce brands that want fast local delivery with photo proof and live tracking.',
    intro: [
      'Toronto is our home city. It is also where final mile delivery is hardest to get right: towers with parcel rooms and concierge desks, laneway homes, tight street parking and traffic that changes by the hour.',
      'We plan Toronto routes around those realities. Condo deliveries follow building rules, houses get a photo at the door, and electric vans handle the dense stop heavy routes they are best suited to.',
    ],
    neighbourhoods: ['Downtown Core', 'King West', 'Liberty Village', 'Yorkville', 'The Annex', 'Leslieville', 'Riverdale', 'The Beaches', 'High Park', 'The Junction', 'Yonge and Eglinton', 'North York', 'East York', 'Scarborough', 'Etobicoke'],
    sections: [
      {
        h2: 'How do condo deliveries work in Toronto?',
        body: 'Many Toronto customers live in buildings with a concierge, a parcel room or smart lockers. Drivers follow each building’s delivery rules and photograph where the parcel was handed over or stored. If a building can’t accept a parcel, the customer is notified and we try again or hold it for pickup.',
      },
      {
        h2: 'Can Toronto customers get same day delivery?',
        body: 'Yes. Orders that reach us by late morning can be delivered the same day across our Toronto service area. It is popular for gifts, replacements and anything a customer has just run out of. See [same day delivery](/services/same-day-delivery) for how the cutoff works.',
      },
      {
        h2: 'Why use a Toronto based 3PL?',
        body: 'When your stock sits close to your customers, local orders can skip long haul shipping altogether: packed in the morning, delivered by our own drivers. Our [fulfillment service](/services/fulfillment) and delivery fleet work as one, so Toronto orders move from shelf to doorstep without changing hands.',
      },
    ],
    faqs: [
      { q: 'Do you deliver to all of Toronto?', a: 'We deliver across the City of Toronto, from Etobicoke to Scarborough and from the lakeshore to Steeles. Coverage is confirmed by postal code when we set up your account.' },
      { q: 'Do you deliver on weekends in Toronto?', a: 'Delivery days are agreed in your plan. Tell us what your customers expect on the [quote form](/get-a-quote).' },
    ],
    nearby: ['mississauga', 'vaughan', 'markham'],
  },
  {
    slug: 'mississauga',
    name: 'Mississauga',
    region: 'Region of Peel',
    metaTitle: 'Next Day Delivery in Mississauga | Kinematics',
    metaDescription:
      'Next day and same day parcel delivery in Mississauga, from Port Credit to Meadowvale, for online brands. EV first fleet, live tracking and photo proof.',
    h1: 'Next day delivery in Mississauga',
    answer:
      'Kinematics provides next day parcel delivery in Mississauga for online brands, covering neighbourhoods from Port Credit and Clarkson to Meadowvale, Erin Mills and Malton, with same day delivery for orders placed by late morning. Every delivery comes with live tracking for your customer and photo proof of where the parcel was left.',
    intro: [
      'Mississauga mixes high rise living around City Centre with long residential streets in Erin Mills, Churchill Meadows and Meadowvale, and older lakeside neighbourhoods in Port Credit and Lorne Park. A route here can go from a concierge desk to a side street in a few minutes.',
      'We route Mississauga deliveries by neighbourhood, so vans stay in one area instead of crisscrossing the city, which keeps arrival times predictable and suits our electric vans well.',
    ],
    neighbourhoods: ['Port Credit', 'Lorne Park', 'Clarkson', 'Mississauga City Centre', 'Cooksville', 'Hurontario', 'Erin Mills', 'Churchill Meadows', 'Streetsville', 'Meadowvale', 'Lisgar', 'Malton'],
    sections: [
      {
        h2: 'How fast is delivery in Mississauga?',
        body: 'Next day is the standard for Mississauga: parcels that reach us by the daily cutoff are out for delivery the following day. For time sensitive orders, [same day delivery](/services/same-day-delivery) covers eligible Mississauga postal codes when the order is placed by late morning.',
      },
      {
        h2: 'Can you collect from my Mississauga warehouse?',
        body: 'Yes. Plenty of brands ship from their own space in Mississauga’s industrial areas. We can collect from your dock on a schedule that fits your packing day, then sort and deliver across the GTA. See [final mile delivery](/services/final-mile-delivery) for pickup options.',
      },
      {
        h2: 'What happens if a Mississauga customer isn’t home?',
        body: 'If a parcel can be left safely, it is photographed where it was left. If not, your customer gets a message and the parcel is held for another attempt or pickup, following rules you set with us.',
      },
    ],
    faqs: [
      { q: 'Can Mississauga brands use Kinematics as their 3PL?', a: 'Yes. Mississauga brands can keep inventory at our Toronto area warehouse while we pick, pack and deliver orders across the GTA. See [fulfillment](/services/fulfillment).' },
      { q: 'Do you deliver to Malton and the airport area?', a: 'Malton is within our Mississauga coverage. Commercial addresses near the airport are confirmed by postal code during setup.' },
      { q: 'Do you handle returns from Mississauga customers?', a: 'Yes. Drivers can collect returns from customers’ doors in Mississauga. See [returns](/services/returns).' },
    ],
    nearby: ['brampton', 'toronto'],
  },
  {
    slug: 'brampton',
    name: 'Brampton',
    region: 'Region of Peel',
    metaTitle: 'Same Day & Next Day Delivery in Brampton | Kinematics',
    metaDescription:
      'Parcel delivery in Brampton for online brands: next day across Bramalea, Springdale, Mount Pleasant and more, plus same day. Live tracking and photo proof.',
    h1: 'Same day and next day delivery in Brampton',
    answer:
      'Kinematics delivers ecommerce orders to customers across Brampton, from Downtown Brampton and Bramalea to Springdale, Mount Pleasant and Castlemore, next day as standard and same day for orders placed by late morning. Online brands get live tracking for customers and a photo at every door.',
    intro: [
      'Brampton has some of the GTA’s newest neighbourhoods. New streets and new addresses appear faster than many mapping tools catch up, which is a common source of late or misdelivered parcels.',
      'Routes are planned by area so drivers get to know the streets they cover, and every delivery is photographed, so new build addresses get delivered properly and there is a record if a customer asks where their parcel went.',
    ],
    neighbourhoods: ['Downtown Brampton', 'Bramalea', 'Springdale', 'Mount Pleasant', 'Heart Lake', 'Castlemore', 'Sandringham-Wellington', 'Fletcher’s Meadow', 'Credit Valley', 'Gore Meadows', 'Snelgrove'],
    sections: [
      {
        h2: 'How do you handle new build addresses in Brampton?',
        body: 'New subdivisions can be missing from maps for a while. We check addresses during route planning and drivers who know the area handle the rest. If an address can’t be found, the customer is contacted before the parcel goes back to the sort centre.',
      },
      {
        h2: 'Is same day delivery available in Brampton?',
        body: 'Yes, for eligible postal codes. Orders that reach us by late morning can be delivered the same day. Most Brampton orders go next day, which is our standard across the GTA. Learn how [final mile delivery](/services/final-mile-delivery) works.',
      },
      {
        h2: 'Do you deliver multi box orders in Brampton?',
        body: 'Yes. Orders that ship in more than one box are labelled as a set and travel on the same route, so they arrive together. That matters for home goods and bundles. See [home goods](/industries/home-goods).',
      },
    ],
    faqs: [
      { q: 'Is there an ecommerce warehouse option for Brampton brands?', a: 'Brampton brands can store stock at our Toronto area warehouse, and we deliver orders back across Brampton and the GTA. See [fulfillment](/services/fulfillment).' },
      { q: 'Which parts of Brampton do you cover?', a: 'Our Brampton coverage includes the neighbourhoods listed on this page and more. Coverage is confirmed by postal code when we set up your account.' },
      { q: 'Can Brampton customers track their parcel?', a: 'Yes. Every customer gets a live tracking link by text and email, and a photo when the parcel is delivered.' },
    ],
    nearby: ['mississauga', 'vaughan'],
  },
  {
    slug: 'vaughan',
    name: 'Vaughan',
    region: 'York Region',
    metaTitle: 'Last Mile Delivery in Vaughan | Kinematics',
    metaDescription:
      'Last mile delivery in Vaughan for online brands: Woodbridge, Maple, Thornhill, Kleinburg and the VMC. Next day standard, same day available, photo proof.',
    h1: 'Last mile delivery in Vaughan',
    answer:
      'Kinematics provides last mile delivery in Vaughan for online brands, reaching customers in Woodbridge, Maple, Concord, Thornhill, Kleinburg and the Vaughan Metropolitan Centre. Delivery is next day as standard, same day for orders placed by late morning, and every parcel comes with live tracking and photo proof at the door.',
    intro: [
      'Vaughan stretches from new towers around the Vaughan Metropolitan Centre to spread out streets in Kleinburg and Vellore Village. That range makes route planning matter: dense stops in one part of the city, longer drives between homes in another.',
      'We plan Vaughan routes to keep each van in a tight area and to stay well within its range, so electric vans can cover the city reliably.',
    ],
    neighbourhoods: ['Vaughan Metropolitan Centre', 'Woodbridge', 'Maple', 'Concord', 'Thornhill (Vaughan)', 'Patterson', 'Carrville', 'Vellore Village', 'Sonoma Heights', 'Kleinburg'],
    sections: [
      {
        h2: 'How fast is delivery in Vaughan?',
        body: 'Most Vaughan orders are delivered next day. When an order can’t wait, [same day delivery](/services/same-day-delivery) covers eligible Vaughan postal codes for orders placed by late morning.',
      },
      {
        h2: 'Can you deliver wholesale orders to Vaughan retailers?',
        body: 'Yes. Alongside home deliveries, we deliver replenishment orders to shops and showrooms. If we store your inventory, retail top ups can be packed and delivered on the same day’s routes. See [fulfillment](/services/fulfillment).',
      },
      {
        h2: 'How do your EVs handle Vaughan’s longer routes?',
        body: 'Each route is checked against the range of the van assigned to it, with a margin for weather and traffic. Longer routes are split before vans head out, so the delivery promise holds. Read more about [EV delivery](/ev-delivery).',
      },
    ],
    faqs: [
      { q: 'Can Vaughan businesses store inventory with you?', a: 'Yes. Inventory is stored at our Toronto area warehouse, counted live, and shipped to customers in Vaughan and across the GTA. See [fulfillment](/services/fulfillment).' },
      { q: 'Do you cover Kleinburg?', a: 'Kleinburg is within our Vaughan coverage. Coverage is confirmed by postal code during setup.' },
      { q: 'Can Vaughan customers return items through you?', a: 'Yes. Drivers can collect returns from the door in Vaughan. See [returns](/services/returns).' },
    ],
    nearby: ['brampton', 'markham', 'toronto'],
  },
  {
    slug: 'markham',
    name: 'Markham',
    region: 'York Region',
    metaTitle: 'Ecommerce Delivery in Markham | Kinematics',
    metaDescription:
      'Ecommerce delivery in Markham: next day across Unionville, Cornell, Markham Village and Milliken, with same day available. EV first, photo proof.',
    h1: 'Ecommerce delivery in Markham',
    answer:
      'Kinematics delivers ecommerce orders to customers in Markham (Unionville, Markham Village, Cornell, Cathedraltown, Milliken and more), next day as standard, with same day for orders placed by late morning. It suits online brands that want reliable local delivery with live tracking and a photo at every door.',
    intro: [
      'Markham combines heritage main streets in Unionville and Markham Village with newer communities like Cornell and Cathedraltown, plus busy office and business parks. Customers here order to their homes and their workplaces.',
      'We handle both: residential deliveries photographed at the door, and business addresses delivered during working hours, routed so vans don’t double back.',
    ],
    neighbourhoods: ['Unionville', 'Markham Village', 'Cornell', 'Cathedraltown', 'Berczy Village', 'Angus Glen', 'Wismer', 'Box Grove', 'Milliken', 'Armadale', 'Thornhill (Markham)'],
    sections: [
      {
        h2: 'Do you deliver to businesses in Markham?',
        body: 'Yes. Business addresses are routed for delivery during working hours, and the delivery photo shows where the parcel was handed over. If you sell to offices or deliver wholesale orders locally, mention it on the [quote form](/get-a-quote).',
      },
      {
        h2: 'Is same day delivery available in Markham?',
        body: 'Yes, for eligible postal codes. Orders that reach us by late morning can be delivered the same day; everything else is next day. See [final mile delivery](/services/final-mile-delivery).',
      },
      {
        h2: 'Can Markham customers track their parcels live?',
        body: 'Every customer gets a tracking link by text and email, follows progress on delivery day and receives a photo when the parcel arrives. You see the same proof on your side.',
      },
    ],
    faqs: [
      { q: 'Do you cover all of Markham?', a: 'We cover Markham’s residential and business areas, including the neighbourhoods listed here. Coverage is confirmed by postal code during setup.' },
      { q: 'Can I use Kinematics if my warehouse is outside Markham?', a: 'Yes. We collect from your dock anywhere in our service area or you can drop parcels at our sort centre.' },
    ],
    nearby: ['vaughan', 'toronto'],
  },
];

export const cityBySlug = (slug: string) => CITIES.find((c) => c.slug === slug)!;
