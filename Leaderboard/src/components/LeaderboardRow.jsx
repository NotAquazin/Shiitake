// LeaderboardRow.jsx
// One ranked row in the leaderboard list.
// Mirrors the shape of ReviewCard.jsx from the CR review app.

function LeaderboardRow({ restroom, rank, onClick }) {

  const rankColors = { 1: '#E8A020', 2: '#8a9db5', 3: '#b5895a' }
  const badgeBg = rankColors[rank] || '#E8A020'

  const statusColors = {
    'Available':         { bg: '#d4edda', color: '#155724' },
    'Occupied':          { bg: '#fff3cd', color: '#856404' },
    'Under Maintenance': { bg: '#f8d7da', color: '#721c24' },
    'Closed':            { bg: '#e2e3e5', color: '#383d41' },
  }
  const statusStyle = statusColors[restroom.status] || statusColors['Closed']

  return (
    <div
      onClick={() => onClick && onClick(restroom)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        background: 'linear-gradient(90deg, #7a96a8 0%, #8eaabb 100%)',
        border: '1px solid #6a8898',
        borderRadius: '10px',
        padding: '12px 16px',
        marginBottom: '10px',
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateX(4px)'
        e.currentTarget.style.boxShadow = '-4px 0 0 #E8A020, 0 4px 18px rgba(0,0,0,0.12)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateX(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >

      {/* Rank badge */}
      <div style={{
        width: '34px',
        height: '34px',
        borderRadius: '50%',
        background: badgeBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '800',
        fontSize: '15px',
        color: 'white',
        flexShrink: 0,
        boxShadow: rank <= 3 ? `0 2px 8px ${badgeBg}88` : 'none',
        fontFamily: 'Roboto',
      }}>
        {rank}
      </div>

      {/* CR code + building name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'Roboto',
          fontStyle: 'italic',
          fontWeight: '600',
          fontSize: '18px',
          color: '#1a2e40',
          letterSpacing: '0.01em',
        }}>
          {restroom.code}
        </div>
        <div style={{ fontSize: '11px', color: '#2c4a5e', opacity: 0.85, marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {restroom.buildingName} · Floor {restroom.floor}
        </div>
      </div>

      {/* Status badge */}
      <span style={{
        padding: '2px 8px',
        borderRadius: '20px',
        fontSize: '10px',
        fontWeight: '600',
        background: statusStyle.bg,
        color: statusStyle.color,
        flexShrink: 0,
        display: 'none',  // hidden on small, shown via inline override below
      }}
        className="status-badge"
      >
        {restroom.status}
      </span>

      {/* Rating */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
        <span style={{
          fontFamily: 'Roboto',
          fontSize: '17px',
          fontWeight: '700',
          color: '#1a2e40',
        }}>
          {restroom.rating % 1 === 0 ? restroom.rating.toFixed(1) : restroom.rating}
        </span>
        <span style={{ fontSize: '16px', color: '#E8A020' }}>★</span>
      </div>

    </div>
  )
}

export default LeaderboardRow
