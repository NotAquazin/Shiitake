// crData.js
// This is the CR that the user is currently viewing and reviewing.
// In the future this would come from a database/API.

const sampleCR = {
  id: 'faura-1',
  building: 'Faura',
  floor: 1,
  availability: 'Available',
  amenities: [
    { label: 'Toilet Paper', working: true  },
    { label: 'Soap',         working: true  },
    { label: 'Air Con',      working: false },
    { label: 'Bidet',        working: true  },
  ],
  reviews: [
    {
      id: 'r1',
      author: 'El J.',
      rating: 4,
      text: 'Pretty clean! Soap is always stocked.',
      likes: 3,
      dislikes: 0,
      timestamp: '2025-03-01',
    },
    {
      id: 'r2',
      author: 'Abdul I.',
      rating: 2,
      text: 'AC has been broken for weeks, very hot inside.',
      likes: 5,
      dislikes: 1,
      timestamp: '2025-03-03',
    },
  ],
}

export default sampleCR
