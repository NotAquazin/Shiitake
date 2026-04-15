// App.jsx — Leaderboard
//
// State overview (mirrors the CR review App.jsx pattern):
//   restrooms     - the full list loaded from leaderboardData
//   filtered      - the subset currently displayed after filters
//   showFilter    - whether the FilterPanel is open
//   activeFilters - the currently applied filter values (for active-filter badge)
//   sortBy        - how the list is sorted

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

import LeaderboardRow  from './components/LeaderboardRow'
import FilterPanel     from './components/FilterPanel'

const SORT_OPTIONS = ['Highest Rated', 'Lowest Rated', 'Nearest', 'Most Reviews']

// How many filters are currently active (for the badge count on the button)
function countActiveFilters(filters) {
  let count = 0
  if (filters.building)         count++
  if (filters.floor)            count++
  if (filters.distance)         count++
  if (filters.status)           count++
  if (filters.amenities.length) count++
  return count
}

export default function Leaderboard() {
  const navigate = useNavigate()

  const [restrooms,     setRestrooms]     = useState([])
  const [filtered,      setFiltered]      = useState([])
  const [showFilter,    setShowFilter]    = useState(false)
  const [activeFilters, setActiveFilters] = useState({ building: '', floor: '', distance: '', status: '', amenities: [] })
  const [sortBy,        setSortBy]        = useState('Highest Rated')
  const [loading,       setLoading]       = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const crsRes = await axios.get('http://localhost:13000/crs');
        const revsRes = await axios.get('http://localhost:13000/reviews');
        
        const crsData = crsRes.data;
        const revsData = revsRes.data;

        const formattedCrs = crsData.map(cr => {
          const crReviews = revsData.filter(r => r.CRId === cr.id);
          let statusText = 'Open';
          if (cr.status === 'closed') statusText = 'Closed';
          if (cr.status === 'under maintenance') statusText = 'Maintenance';

          // Calculate average dynamically if the backend database cached value is outdated/0
          let calculatedRating = cr.averageRating || 0;
          if (crReviews.length > 0) {
            const sum = crReviews.reduce((acc, curr) => acc + curr.rating, 0);
            calculatedRating = sum / crReviews.length;
          }
          calculatedRating = parseFloat(Number(calculatedRating).toFixed(1));

          return {
            id: cr.id,
            code: cr.name || 'Unknown',
            buildingName: cr.building || 'Unknown',
            floor: cr.floor || 0,
            distance: 0, // Placeholder
            status: statusText,
            rating: calculatedRating,
            reviewCount: crReviews.length,
            amenities: cr.tags || []
          };
        });

        setRestrooms(formattedCrs);
        setFiltered(formattedCrs);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Sort a copy of filtered (never mutate state directly)
  const sortedRestrooms = [...filtered].sort((a, b) => {
    if (sortBy === 'Highest Rated') return b.rating       - a.rating
    if (sortBy === 'Lowest Rated')  return a.rating       - b.rating
    if (sortBy === 'Nearest')       return a.distance     - b.distance
    if (sortBy === 'Most Reviews')  return b.reviewCount  - a.reviewCount
    return 0
  })

  // Event handlers

  function handleApplyFilter(filters) {
    let result = [...restrooms]

    if (filters.building)
      result = result.filter(r => r.buildingName === filters.building)

    if (filters.floor)
      result = result.filter(r => r.floor === parseInt(filters.floor))

    if (filters.distance)
      result = result.filter(r => r.distance <= parseInt(filters.distance))

    if (filters.status)
      result = result.filter(r => r.status === filters.status)

    if (filters.amenities.length > 0)
      result = result.filter(r =>
        filters.amenities.every(a => r.amenities.includes(a))
      )

    setFiltered(result)
    setActiveFilters(filters)
    setShowFilter(false)
  }

  function handleRowClick(restroom) {
    navigate(`/cr/${restroom.id}`)
  }

  function handleClickFilter() {
    setShowFilter(true)
  }

  const filterCount = countActiveFilters(activeFilters)


  // Render 

  return (
    <div style={{ minHeight: '100vh', background: '#DFD0B8', padding: '0 0 40px' }}>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px 0' }}>

        {/* Leaderboard header card */}
        <div style={{
          background: '#153448',
          borderRadius: '12px',
          padding: '20px 24px',
          marginBottom: '20px',
          color: 'white',
        }}>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontFamily: 'Roboto' }}>
            CR Leaderboard
          </h1>
          <p style={{ margin: '0 0 12px', fontSize: '13px', opacity: 0.7 }}>
            Best-rated comfort rooms on campus
          </p>

          {/* Summary stats row */}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '11px', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total CRs
              </p>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: '700', fontFamily: 'Roboto' }}>
                {restrooms.length}
              </p>
            </div>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '11px', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Showing
              </p>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: '700', fontFamily: 'Roboto' }}>
                {filtered.length}
              </p>
            </div>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '11px', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Top Rated
              </p>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: '700', fontFamily: 'Roboto', color: '#E8A020' }}>
                {filtered.length > 0
                  ? Math.max(...filtered.map(r => r.rating)).toFixed(1)
                  : '—'} ★
              </p>
            </div>
          </div>
        </div>

        {/* Leaderboard list section */}
        <div style={{
          background: '#EDE5D5',
          borderRadius: '12px',
          padding: '20px 24px',
        }}>

          {/* Header row: title + sort dropdown (same pattern as Reviews header) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#153448' }}>
              Rankings
            </h2>

            {/* Sort dropdown */}
            {filtered.length > 1 && (
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: '1px solid #948979',
                  background: 'white',
                  cursor: 'pointer',
                }}
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            )}
          </div>

          {/* Filter button */}
          {!showFilter && (
            <button
              onClick={handleClickFilter}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '16px',
                background: '#FFA239',
                color: '#153448',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <span>⚙ Filter Restrooms</span>
              {filterCount > 0 && (
                <span style={{
                  background: '#153448',
                  color: 'white',
                  borderRadius: '20px',
                  padding: '1px 8px',
                  fontSize: '11px',
                  fontWeight: '700',
                }}>
                  {filterCount} active
                </span>
              )}
            </button>
          )}

          {/* Active filter summary chips --> shown when filters are applied */}
          {filterCount > 0 && !showFilter && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
              {activeFilters.building && (
                <span style={chipStyle}>{activeFilters.building}</span>
              )}
              {activeFilters.floor && (
                <span style={chipStyle}>Floor {activeFilters.floor}</span>
              )}
              {activeFilters.distance && (
                <span style={chipStyle}>≤ {activeFilters.distance}m</span>
              )}
              {activeFilters.status && (
                <span style={chipStyle}>{activeFilters.status}</span>
              )}
              {activeFilters.amenities.map(a => (
                <span key={a} style={chipStyle}>{a}</span>
              ))}
              <button
                onClick={() => handleApplyFilter({ building: '', floor: '', distance: '', status: '', amenities: [] })}
                style={{ ...chipStyle, background: '#f8d7da', color: '#721c24', cursor: 'pointer', border: 'none' }}
              >
                ✕ Clear all
              </button>
            </div>
          )}

          {/* FilterPanel */}
          {showFilter && (
            <FilterPanel
              buildings={[...new Set(restrooms.map(r => r.buildingName))].filter(Boolean).sort()}
              statuses={['Open', 'Maintenance', 'Closed']}
              allAmenities={[...new Set(restrooms.flatMap(r => r.amenities))].filter(Boolean).sort()}
              onApply={handleApplyFilter}
              onCancel={() => setShowFilter(false)}
            />
          )}

          {/* The leaderboard rows */}
          {loading ? (
             <p style={{ textAlign: 'center', color: '#999', padding: '24px 0' }}>
               Loading data...
             </p>
          ) : sortedRestrooms.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#999', padding: '24px 0' }}>
              No restrooms match the selected filters.
            </p>
          ) : (
            <div style={{
              background: '#d9cdb8',
              borderRadius: '14px',
              padding: '14px 12px',
            }}>
              {sortedRestrooms.map((restroom, index) => (
                <LeaderboardRow
                  key={restroom.id}
                  restroom={restroom}
                  rank={index + 1}
                  onClick={handleRowClick}
                />
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ── Shared local styles ───────────────────────────────────────────────────

const chipStyle = {
  padding: '3px 10px',
  borderRadius: '20px',
  fontSize: '11px',
  fontWeight: '500',
  background: '#c9b99a',
  color: '#3a3020',
}
