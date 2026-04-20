import { useState, useEffect } from 'react'
import StarRating from './StarRating'

function ReviewForm({ cr, existingReview, onSubmit, onCancel, onAmenityChange }) {

  // pre-fill if editing, otherwise start blank
  const [rating, setRating] = useState(existingReview ? existingReview.rating : 0)
  const [text, setText] = useState(existingReview ? existingReview.text : '')
  const [amenities, setAmenities] = useState([])
  const [error, setError] = useState('')

  // Fetch the global tag list and initialise amenity toggles
  useEffect(() => {
    fetch('/global-tags')
      .then(res => res.json())
      .then(tagNames => {
        if (existingReview) {
          // Editing: restore previous review's amenity selections
          const prev = Array.isArray(existingReview.amenities) ? existingReview.amenities : []
          setAmenities(tagNames.map(label => {
            const match = prev.find(a => a.label === label)
            return match || { label, working: false }
          }))
        } else {
          // New review: pre-check amenities the CR already has tagged
          const crTags = Array.isArray(cr?.tags) ? cr.tags : []
          setAmenities(tagNames.map(label => ({ label, working: crTags.includes(label) })))
        }
      })
      .catch(() => {})
  }, [])

  // flip the working status of whichever amenity was clicked
  function toggleAmenity(index) {
    const sourceAmenities = Array.isArray(amenities) ? amenities : []
    const updated = sourceAmenities.map((amenity, i) => {
      if (i === index) {
        return { ...amenity, working: !amenity.working }
      }
      return amenity
    })
    setAmenities(updated)
    onAmenityChange?.(updated)
  }

  function handleSubmit() {
    if (rating === 0) {
      setError('Please choose a star rating.')
      return
    }
    onSubmit({
      id: existingReview ? existingReview.id : 'r-' + Date.now(),
      author: 'You',
      rating,
      text: text.trim(),
      amenities,
      likes: existingReview ? existingReview.likes : 0,
      dislikes: existingReview ? existingReview.dislikes : 0,
      timestamp: new Date().toISOString().split('T')[0],
    })
  }

  return (
    <div style={{ background: '#EDE5D5', border: '1px solid #DFD0B8', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>

      <h3 style={{ margin: '0 0 16px', color: '#153448' }}>
        {existingReview ? 'Edit Your Review' : 'Write a Review'}
      </h3>

      {/* star picker */}
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Rating</label>
        <StarRating rating={rating} interactive={true} onRate={setRating} />
      </div>

      {/* amenity toggles — click to mark present or absent */}
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Amenities Present</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {amenities.map((amenity, index) => (
            <button
              key={amenity.label}
              onClick={() => toggleAmenity(index)}
              title={amenity.working ? 'Mark as not present' : 'Mark as present'}
              style={{
                padding: '4px 12px',
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                background: amenity.working ? '#d4edda' : '#f8d7da',
                color: amenity.working ? '#155724' : '#721c24',
              }}
            >
              {amenity.working ? '✅' : '❌'} {amenity.label}
            </button>
          ))}
        </div>
        <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#888' }}>
          Tap to mark which amenities are present.
        </p>
      </div>

      {/* optional text box */}
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Review (optional)</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your experience..."
          rows={4}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #948979', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }}
        />
      </div>

      {/* only shows if there's an error */}
      {error && (
        <p style={{ color: 'red', fontSize: '12px', marginBottom: '10px' }}>{error}</p>
      )}

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={cancelBtnStyle}>Cancel</button>
        <button onClick={handleSubmit} style={submitBtnStyle}>
          {existingReview ? 'Save Changes' : 'Post Review'}
        </button>
      </div>

    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: '600',
  color: '#666',
  marginBottom: '8px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const submitBtnStyle = {
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

export default ReviewForm