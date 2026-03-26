// All possible amenity labels used across CRs — used to render filter chips
export const ALL_AMENITIES = ['Toilet Paper', 'Soap', 'Air Con', 'Bidet', 'Hand Dryer', 'Baby Changing Table'];

// Sample CR database. distance is in metres from the campus main gate (placeholder).
const allCRs = [
  {
    id: 'faura-1',
    building: 'Faura Hall',
    floor: 1,
    availability: 'Available',
    distance: 80,
    amenities: [
      { label: 'Toilet Paper',        working: true  },
      { label: 'Soap',                working: true  },
      { label: 'Air Con',             working: false },
      { label: 'Bidet',               working: true  },
    ],
    reviews: [],
  },
  {
    id: 'faura-2',
    building: 'Faura Hall',
    floor: 2,
    availability: 'Occupied',
    distance: 80,
    amenities: [
      { label: 'Toilet Paper',        working: true  },
      { label: 'Soap',                working: false },
      { label: 'Air Con',             working: true  },
      { label: 'Bidet',               working: true  },
    ],
    reviews: [],
  },
  {
    id: 'ctc-1',
    building: 'CTC',
    floor: 1,
    availability: 'Available',
    distance: 200,
    amenities: [
      { label: 'Toilet Paper',        working: true  },
      { label: 'Soap',                working: true  },
      { label: 'Hand Dryer',          working: true  },
    ],
    reviews: [],
  },
  {
    id: 'ctc-3',
    building: 'CTC',
    floor: 3,
    availability: 'Closed',
    distance: 200,
    amenities: [
      { label: 'Toilet Paper',        working: false },
      { label: 'Soap',                working: false },
    ],
    reviews: [],
  },
  {
    id: 'seca-2',
    building: 'SEC-A',
    floor: 2,
    availability: 'Available',
    distance: 350,
    amenities: [
      { label: 'Toilet Paper',        working: true  },
      { label: 'Soap',                working: true  },
      { label: 'Bidet',               working: true  },
      { label: 'Air Con',             working: true  },
      { label: 'Hand Dryer',          working: false },
    ],
    reviews: [],
  },
  {
    id: 'mvp-1',
    building: 'MVP',
    floor: 1,
    availability: 'Available',
    distance: 450,
    amenities: [
      { label: 'Toilet Paper',        working: true  },
      { label: 'Soap',                working: true  },
      { label: 'Air Con',             working: true  },
      { label: 'Hand Dryer',          working: true  },
      { label: 'Baby Changing Table', working: true  },
    ],
    reviews: [],
  },
  {
    id: 'arete-1',
    building: 'Arete',
    floor: 1,
    availability: 'Occupied',
    distance: 600,
    amenities: [
      { label: 'Toilet Paper',        working: true  },
      { label: 'Soap',                working: true  },
      { label: 'Air Con',             working: true  },
      { label: 'Bidet',               working: false },
    ],
    reviews: [],
  },
  {
    id: 'nrl-2',
    building: 'New Rizal Library',
    floor: 2,
    availability: 'Available',
    distance: 520,
    amenities: [
      { label: 'Toilet Paper',        working: true  },
      { label: 'Soap',                working: true  },
      { label: 'Air Con',             working: true  },
      { label: 'Bidet',               working: true  },
      { label: 'Hand Dryer',          working: true  },
    ],
    reviews: [],
  },
];

export default allCRs;
