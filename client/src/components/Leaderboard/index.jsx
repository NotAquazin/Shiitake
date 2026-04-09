// App.jsx — Leaderboard
//
// State overview (mirrors the CR review App.jsx pattern):
//   restrooms     - the full list loaded from leaderboardData
//   filtered      - the subset currently displayed after filters
//   showFilter    - whether the FilterPanel is open
//   activeFilters - the currently applied filter values (for active-filter badge)
//   sortBy        - how the list is sorted

import { useState } from 'react'

import leaderboardData from './leaderboardData'
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

  const [restrooms,     setRestrooms]     = useState(leaderboardData.restrooms)
  const [filtered,      setFiltered]      = useState(leaderboardData.restrooms)
  const [showFilter,    setShowFilter]    = useState(false)
  const [activeFilters, setActiveFilters] = useState({ building: '', floor: '', distance: '', status: '', amenities: [] })
  const [sortBy,        setSortBy]        = useState('Highest Rated')

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
      result = result.filter(r => r.building === filters.building)

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
    // Placeholder — would navigate to the CR detail / review page
    alert(`Viewing ${restroom.code} — ${restroom.buildingName}, Floor ${restroom.floor}`)
  }

  function handleClickFilter() {
    setShowFilter(true)
  }

  const filterCount = countActiveFilters(activeFilters)


  const NavIcon = ({ d, active, onClick, isMap }) => (
    <div
      onClick={onClick}
      style={{
        color: active ? '#E8A020' : '#8aafcc',
        borderBottom: active ? '2.5px solid #E8A020' : '2.5px solid transparent',
        paddingBottom: '4px',
        cursor: 'pointer',
        transition: 'color 0.15s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width='26' height='26' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
        {d}
      </svg>
    </div>
  )

  // Render 

  return (
    <div style={{ minHeight: '100vh', background: '#DFD0B8', padding: '0 0 40px' }}>

      {/* Top Nav Bar */}
      <div style={{
        background: 'linear-gradient(135deg, #1a2e40 0%, #24435e 100%)',
        borderRadius: '0 0 18px 18px',
        padding: '14px 0 10px',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
        marginBottom: '20px',
      }}>
        <NavIcon active={false} d={<><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></>} />
        <NavIcon active={true}  d={<><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></>} />
        <NavIcon active={false} d={<><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></>} />
        <NavIcon active={false} d={<><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></>} />
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 16px' }}>

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
              onApply={handleApplyFilter}
              onCancel={() => setShowFilter(false)}
            />
          )}

          {/* The leaderboard rows */}
          {sortedRestrooms.length === 0 ? (
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
