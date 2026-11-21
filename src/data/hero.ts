/** Hero film: shot list (seconds on a 36 s loop). Shared by the 3D scene, the video captions and the static strip. */
export const HERO_LOOP = 36;
/** Playback always starts at shot 1 (Receive). The poster is this same frame, so poster → motion is seamless. */
export const HERO_POSTER_T = 0;

export const HERO_SHOTS = [
  { id: 'receive', label: 'Receive', start: 0, end: 4.5, text: 'A trailer backs into the dock and cartons come off onto a pallet.' },
  { id: 'store', label: 'Store', start: 4.5, end: 9, text: 'A forklift lifts the pallet into a high rack and every unit gets a bin.' },
  { id: 'pick', label: 'Pick', start: 9, end: 13, text: 'A shelf light blinks and the ordered item slides out onto the line.' },
  { id: 'pack', label: 'Pack', start: 13, end: 17.5, text: 'The item is repacked into a right sized branded box and taped shut.' },
  { id: 'label', label: 'Label', start: 17.5, end: 21.5, text: 'A label prints, sticks, and a teal scan confirms the parcel.' },
  { id: 'sort', label: 'Sort', start: 21.5, end: 26, text: 'The sorter routes each parcel into the lane for its delivery route.' },
  { id: 'load', label: 'Load', start: 26, end: 30, text: 'Parcels slide into an electric van and a small car, and the doors close.' },
  { id: 'deliver', label: 'Deliver', start: 30, end: 36, text: 'The van heads out across the GTA at dusk, following its route to the door.' },
] as const;

export const shotAt = (t: number) => {
  const tt = ((t % HERO_LOOP) + HERO_LOOP) % HERO_LOOP;
  return Math.max(0, HERO_SHOTS.findIndex((s) => tt >= s.start && tt < s.end));
};
