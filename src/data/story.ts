import type { SceneName } from '@/components/illustrations/art';

export type Chapter = {
  id: SceneName;
  step: string;
  title: string;
  text: string;
  points: string[];
  link: { href: string; label: string };
  alt: string;
};

/** Homepage scroll story. This copy is server-rendered, so crawlers read it without WebGL. */
export const CHAPTERS: Chapter[] = [
  {
    id: 'store',
    step: 'Store',
    title: '3PL storage with live stock counts',
    text: 'Your inventory arrives at our Toronto area warehouse, gets checked against what you sent, and goes onto racks with a home for every SKU. Counts update as units move, so the number on your storefront matches the number on our shelf.',
    points: ['Receiving checked against your shipment notice', 'Bin locations for every SKU', 'Stock levels you can see any time'],
    link: { href: '/services/fulfillment', label: 'Fulfillment (3PL) services' },
    alt: 'Illustration: a warehouse rack stocked with parcels while a new box drops onto a shelf, with a live stock count badge.',
  },
  {
    id: 'pack',
    step: 'Pack',
    title: 'Same day pick and pack',
    text: 'When an order comes in, the right item comes off the shelf and goes to a packing station. We box it to fit, add your inserts, seal it and print the label, the same day for orders that reach us before the daily cutoff.',
    points: ['Right sized packaging', 'Branded inserts and kitting', 'Label printed at the bench'],
    link: { href: '/how-it-works', label: 'How the process works' },
    alt: 'Illustration: a packing table where a box folds closed beside a label printer printing a barcode label.',
  },
  {
    id: 'sort',
    step: 'Sort',
    title: 'Smart sort and route planning',
    text: 'Every parcel rides through a scan point, gets matched to a delivery zone and drops into the lane for its route. Routes are planned around the addresses on board and the range of the vehicle driving them.',
    points: ['Scanned at every handoff', 'Sorted by zone and route', 'Routes planned before the van rolls'],
    link: { href: '/services/final-mile-delivery', label: 'Final mile delivery' },
    alt: 'Illustration: a parcel on a conveyor passing through a teal scanning arch toward three sorting lanes labelled A, B and C.',
  },
  {
    id: 'drive',
    step: 'Drive',
    title: 'EV final mile, next day across the GTA',
    text: 'Loaded parcels head out in our EV first fleet across Toronto, Mississauga, Brampton, Vaughan and Markham. Next day delivery is the standard; same day is there when an order can’t wait.',
    points: ['Next day across the GTA', 'Same day for orders placed by late morning', 'Electric vans first, wherever the route allows'],
    link: { href: '/ev-delivery', label: 'EV delivery and sustainability' },
    alt: 'Illustration: an electric delivery van with a teal stripe driving a dotted route across a stylized map of the GTA.',
  },
  {
    id: 'deliver',
    step: 'Deliver',
    title: 'Photo proof and live tracking',
    text: 'Your customer follows the van in real time and gets a text the moment the parcel is at the door, with a photo showing exactly where it was left. You see the same proof, so “where is my order?” has a fast answer.',
    points: ['Live tracking link by text', 'Photo proof of delivery', 'A plan for every missed delivery'],
    link: { href: '/services/final-mile-delivery', label: 'Tracking and proof of delivery' },
    alt: 'Illustration: a parcel at a front door with a pulsing photo proof ring, next to a phone showing a Delivered text message.',
  },
  {
    id: 'return',
    step: 'Return',
    title: 'Easy returns, restocked fast',
    text: 'When something needs to come back, we collect it, inspect it and sort it: back on the shelf if it’s sellable, set aside if it isn’t. Your stock count updates, and you get a clear record of every return.',
    points: ['Return pickups across the GTA', 'Inspection and grading', 'Sellable items restocked quickly'],
    link: { href: '/services/returns', label: 'Returns management' },
    alt: 'Illustration: a parcel travelling along a dashed arc from a house back to the warehouse.',
  },
];
