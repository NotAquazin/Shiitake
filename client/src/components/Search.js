import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:13000';

const STATUSES = [
  { value: 'available',         label: 'Available'         },
  { value: 'under maintenance', label: 'Under Maintenance' },
  { value: 'closed',            label: 'Closed'            },
];

function Search() {

  // Filter values
  const [building,  setBuilding]  = useState('');
  const [distance,  setDistance]  = useState('');
  const [floor,     setFloor]     = useState('');
  const [status,    setStatus]    = useState('');
  const [amenities, setAmenities] = useState([]);
  const [minRating, setMinRating] = useState('');

  // Options derived from real DB data
  const [allBuildings, setAllBuildings] = useState([]);
  const [allTags,      setAllTags]      = useState([]);

  // Search results
  const [results, setResults] = useState(null);

  // On mount: fetch all CRs to populate filter options and show default results
  useEffect(() => {
    fetch(`${API_URL}/crs`)
      .then((res) => res.json())
      .then((data) => {
        const buildings = [...new Set(data.map((cr) => cr.building).filter(Boolean))].sort();
        const tags = [...new Set(data.flatMap((cr) => Array.isArray(cr.tags) ? cr.tags : []))].sort();
        setAllBuildings(buildings);
        setAllTags(tags);
        setResults(data);
      })
      .catch((err) => console.error('Failed to load filter options:', err));
  }, []);

  function toggleAmenity(label) {
    if (amenities.includes(label)) {
      setAmenities(amenities.filter((a) => a !== label));
    } else {
      setAmenities([...amenities, label]);
    }
  }

  async function handleSearch() {
    try {
      const response = await fetch(`${API_URL}/crs`);
      const data = await response.json();
      let filtered = data;

      if (building) {
        filtered = filtered.filter((cr) => cr.building === building);
      }
      if (floor !== '' && Number(floor) >= 0) {
        filtered = filtered.filter((cr) => cr.floor === Number(floor));
      }
      if (status) {
        filtered = filtered.filter((cr) => cr.status === status);
      }
      if (amenities.length > 0) {
        filtered = filtered.filter((cr) => {
          const crTags = Array.isArray(cr.tags) ? cr.tags : [];
          return amenities.every((label) => crTags.includes(label));
        });
      }
      if (minRating !== '') {
        filtered = filtered.filter(
          (cr) => cr.averageRating > 0 && cr.averageRating >= Number(minRating)
        );
      }

      setResults(filtered);
    } catch (err) {
      console.error('Failed to fetch CRs:', err);
      setResults([]);
    }
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
              {allBuildings.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Distance (m)</label>
            <input
              type="number"
              placeholder="To add with GPS functionality"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              disabled
              style={{ ...inputStyle, background: '#f0ece6', color: '#aaa', cursor: 'not-allowed' }}
            />
          </div>

        </div>

        {/* Floor + Status + Min. Rating */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '14px' }}>

          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Floor</label>
            <input
              type="number"
              placeholder="Type valid integer"
              min="0"
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
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Minimum Rating</label>
            <select value={minRating} onChange={(e) => setMinRating(e.target.value)} style={inputStyle}>
              <option value="">Any</option>
              <option value="1">&ge; 1★</option>
              <option value="2">&ge; 2★</option>
              <option value="3">&ge; 3★</option>
              <option value="4">&ge; 4★</option>
              <option value="5">5★ only</option>
            </select>
          </div>

        </div>

        {/* Tags */}
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Tags</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
            {allTags.map((label) => {
              const isSelected = amenities.includes(label);
              return (
                <button
                  key={label}
                  onClick={() => toggleAmenity(label)}
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
                  {isSelected ? '✓' : '+'} {label}
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
        {results && (
          results.length === 0
            ? <p style={{ textAlign: 'center', color: '#777' }}>No CR matches found</p>
            : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {results.map((cr) => (
                  <Link key={cr.id} to={`/cr/${cr.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '2px 4px 14px rgba(0,0,0,0.18)', cursor: 'pointer' }}>

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
                        <p><strong>Tags:</strong> {Array.isArray(cr.tags) && cr.tags.length > 0 ? cr.tags.join(' • ') : '—'}</p>
                        <p><strong>Status:</strong> {cr.status}</p>
                        <p><strong>Rating:</strong> {cr.averageRating > 0 ? `${Number(cr.averageRating).toFixed(1)} / 5.0` : 'No ratings yet'}</p>
                      </div>

                    </div>
                  </Link>
                ))}
              </div>
            )
        )}

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
