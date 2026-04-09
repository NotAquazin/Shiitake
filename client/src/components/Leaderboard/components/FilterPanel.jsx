// FilterPanel.jsx
// The filter form for the leaderboard.
// Mirrors the shape/style of ReviewForm.jsx from the CR review app.

import { useState } from 'react'

function FilterPanel({ buildings = [], statuses = [], allAmenities = [], onApply, onCancel }) {

  const [building,  setBuilding]  = useState('')
  const [floor,     setFloor]     = useState('')
  const [distance,  setDistance]  = useState('')
  const [status,    setStatus]    = useState('')
  const [amenities, setAmenities] = useState([])

  function toggleAmenity(amenity) {
    setAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    )
  }

  function handleApply() {
    onApply({ building, floor, distance, status, amenities })
  }

  function handleReset() {
    setBuilding('')
    setFloor('')
    setDistance('')
    setStatus('')
    setAmenities([])
    onApply({ building: '', floor: '', distance: '', status: '', amenities: [] })
  }

  return (
    <div style={{
      background: '#EDE5D5',
      border: '1px solid #c9b99a',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '16px',
    }}>

      <h3 style={{ margin: '0 0 16px', color: '#153448', fontSize: '15px' }}>
        Filter Restrooms
      </h3>

      {/* Building + Distance row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px', marginBottom: '14px' }}>

        <div>
          <label style={labelStyle}>Building</label>
          <select
            value={building}
            onChange={e => setBuilding(e.target.value)}
            style={inputStyle}
          >
            <option value=''>Select building</option>
            {buildings.map(b => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Max Distance (m)</label>
          <input
            type='number'
            value={distance}
            onChange={e => setDistance(e.target.value)}
            placeholder='e.g. 300'
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Floor</label>
          <input
            type='number'
            value={floor}
            onChange={e => setFloor(e.target.value)}
            placeholder='e.g. 2'
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Status</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            style={inputStyle}
          >
            <option value=''>Select status</option>
            {statuses.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Amenities toggles — same pill-button style as ReviewForm amenity toggles */}
      <div style={{ marginBottom: '18px' }}>
        <label style={labelStyle}>Amenities (must have all selected)</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {allAmenities.map(amenity => {
            const active = amenities.includes(amenity)
            return (
              <button
                key={amenity}
                onClick={() => toggleAmenity(amenity)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  background: active ? '#153448' : '#d9cdb8',
                  color:      active ? 'white'   : '#3a3020',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {active ? '✓ ' : ''}{amenity}
              </button>
            )
          })}
        </div>
      </div>

      {/* Buttons — same layout as ReviewForm */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button onClick={handleReset} style={resetBtnStyle}>Reset</button>
        <button onClick={onCancel}    style={cancelBtnStyle}>Cancel</button>
        <button onClick={handleApply} style={applyBtnStyle}>Apply Filter</button>
      </div>

    </div>
  )
}

// ── Shared styles (mirrors ReviewForm label/button styles) ──────────────────

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: '600',
  color: '#666',
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const inputStyle = {
  width: '100%',
  padding: '7px 10px',
  borderRadius: '6px',
  border: '1px solid #948979',
  fontSize: '13px',
  background: 'white',
  color: '#3a3020',
  boxSizing: 'border-box',
  fontFamily: 'Roboto, sans-serif',
  cursor: 'pointer',
}

const applyBtnStyle = {
  padding: '8px 20px',
  background: '#153448',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '600',
}

const cancelBtnStyle = {
  padding: '8px 20px',
  background: 'transparent',
  color: '#153448',
  border: '1px solid #153448',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '13px',
}

const resetBtnStyle = {
  padding: '8px 20px',
  background: 'transparent',
  color: '#888',
  border: '1px solid #ccc',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '13px',
}

export default FilterPanel
