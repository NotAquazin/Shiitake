import { useState } from 'react';
import sampleCR from './crData';

const BUILDINGS = ['Faura Hall', 'CTC', 'SEC-A', 'MVP', 'Arete', 'New Rizal Library'];
const STATUSES  = ['Available', 'Occupied', 'Closed'];

function Search() {

  // Store what the user typed/selected in the filters
  const [building,  setBuilding]  = useState('');
  const [distance,  setDistance]  = useState('');
  const [floor,     setFloor]     = useState('');
  const [status,    setStatus]    = useState('');
  const [amenities, setAmenities] = useState([]);

  // Store the results to show after clicking Search
  const [results, setResults] = useState(null);

  // Toggle an amenity when the user clicks it
  function toggleAmenity(label) {
    if (amenities.includes(label)) {
      // remove it
      setAmenities(amenities.filter((a) => a !== label));
    } else {
      // add it
      setAmenities([...amenities, label]);
    }
  }

  // For now, just show sampleCR as the result
  function handleSearch() {
    setResults([sampleCR]);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#DFD0B8', padding: '24px 16px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>

        {/* Building + Distance */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '14px' }}>

          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Building</label>
            <select value={building} onChange={(e) => setBuilding(e.target.value)} style={inputStyle}>
              <option value="">Select building</option>
              {BUILDINGS.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Distance (m)</label>
            <input
              type="number"
              placeholder="Type valid integer"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              style={inputStyle}
            />
          </div>

        </div>

        {/* Floor + Status */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '14px' }}>

          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Floor</label>
            <input
              type="number"
              placeholder="Type valid integer"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
              <option value="">Select status</option>
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Amenities */}
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Amenities</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
            {sampleCR.amenities.map((amenity) => {
              const isSelected = amenities.includes(amenity.label);
              return (
                <button
                  key={amenity.label}
                  onClick={() => toggleAmenity(amenity.label)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    border: '1px solid #948979',
                    fontSize: '12px',
                    cursor: 'pointer',
                    background: isSelected ? '#153448' : 'white',
                    color:      isSelected ? 'white'   : '#153448',
                  }}
                >
                  {isSelected ? '✓' : '+'} {amenity.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
          <button onClick={handleSearch} style={searchButtonStyle}>
            Search
          </button>
        </div>

        {/* Results */}
        {results && results.map((cr) => (
          <div key={cr.id} style={{ width: '260px', borderRadius: '12px', overflow: 'hidden', boxShadow: '2px 4px 14px rgba(0,0,0,0.18)' }}>

            {/* Card header */}
            <div style={{ background: '#153448', padding: '12px 16px', textAlign: 'center' }}>
              <span style={{ color: 'white', fontSize: '15px', fontStyle: 'italic' }}>
                {cr.building} — Floor {cr.floor}
              </span>
            </div>

            {/* Card body */}
            <div style={{ background: 'white', padding: '14px 16px', fontSize: '13px' }}>
              <p><strong>Building:</strong> {cr.building}</p>
              <p><strong>Floor:</strong> {cr.floor}</p>
              <p><strong>Amenities:</strong> {cr.amenities.map((a) => a.label).join(' • ')}</p>
              <p><strong>Status:</strong> {cr.availability}</p>
            </div>

          </div>
        ))}

      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: '700',
  color: '#555',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  marginBottom: '6px',
};

const inputStyle = {
  width: '100%',
  padding: '7px 10px',
  fontSize: '13px',
  borderRadius: '6px',
  border: '1px solid #b0a898',
  background: 'white',
  color: '#153448',
  boxSizing: 'border-box',
};

const searchButtonStyle = {
  padding: '9px 26px',
  background: '#3a3a3a',
  color: 'white',
  border: 'none',
  borderRadius: '20px',
  cursor: 'pointer',
  fontSize: '13px',
};

export default Search;