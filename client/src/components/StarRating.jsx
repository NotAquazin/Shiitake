import { useState } from 'react'

function StarRating({ rating, interactive, onRate }) {

  const [hovered, setHovered] = useState(0)

  // show hovered star if hovering, otherwise show actual rating
  const displayRating = hovered > 0 ? hovered : rating

  if (!interactive) {
    // Display mode: support half stars using an overlay clipped to fill%
    return (
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map((star) => {
          const fill = Math.min(1, Math.max(0, displayRating - (star - 1)))
          const percent = Math.round(fill * 100)
          return (
            <span
              key={star}
              style={{ fontSize: '18px', position: 'relative', display: 'inline-block', color: '#ccc' }}
            >
              ★
              {percent > 0 && (
                <span style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: `${percent}%`,
                  overflow: 'hidden',
                  color: '#FFA239',
                }}>
                  ★
                </span>
              )}
            </span>
          )
        })}
        {rating > 0 && (
          <span style={{ fontSize: '13px', color: '#888', marginLeft: '4px' }}>
            {parseFloat(rating.toFixed(2))}/5
          </span>
        )}
      </div>
    )
  }

  // Interactive mode: whole stars only (for writing a review)
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => {
            if (onRate) onRate(star)
          }}
          onMouseEnter={() => {
            setHovered(star)
          }}
          onMouseLeave={() => {
            setHovered(0)
          }}
          style={{
            fontSize: '28px',
            cursor: 'pointer',
            color: star <= displayRating ? '#FFA239' : '#ccc',
          }}
        >
          ★
        </span>
      ))}
    </div>
  )
}

export default StarRating
