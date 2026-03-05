import { useState } from 'react'

function StarRating({ rating, interactive, onRate }) {

  const [hovered, setHovered] = useState(0)

  // show hovered star if hovering, otherwise show actual rating
  const displayRating = hovered > 0 ? hovered : rating

  return (
    <div style={{ display: 'flex', gap: '4px' }}>

      {/* loop through 1-5 and render a star for each */}
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => {
            if (interactive && onRate) onRate(star)
          }}
          onMouseEnter={() => {
            if (interactive) setHovered(star)
          }}
          onMouseLeave={() => {
            if (interactive) setHovered(0)
          }}
          style={{
            fontSize: interactive ? '28px' : '18px',
            cursor: interactive ? 'pointer' : 'default',
            color: star <= displayRating ? '#FFA239' : '#ccc', // gold or grey
          }}
        >
          ★
        </span>
      ))}

      {/* show the number beside stars when just displaying */}
      {!interactive && rating > 0 && (
        <span style={{ fontSize: '13px', color: '#888', alignSelf: 'center', marginLeft: '4px' }}>
          {rating}/5
        </span>
      )}

    </div>
  )
}

export default StarRating