import { useState } from 'react'
import StarRating from './StarRating'

function ReviewForm({ cr, existingReview, onSubmit, onCancel }) {

  function buildInitialAmenities() {
    if (Array.isArray(existingReview?.amenities) && existingReview.amenities.length > 0) {
      return existingReview.amenities
    }
    if (Array.isArray(existingReview?.reviewTags) && existingReview.reviewTags.length > 0) {
      return existingReview.reviewTags
    }
    // New review: pull from cr.tags (strings) and wrap into objects
    if (Array.isArray(cr?.tags) && cr.tags.length > 0) {
      return cr.tags.map((tag) =>
        typeof tag === 'string' ? { label: tag, working: true } : tag
      )
    }
    // Fallback: cr.amenities if it's already an array of objects
    if (Array.isArray(cr?.amenities) && cr.amenities.length > 0) {
      return cr.amenities
    }
    return []
  }

  // const initialAmenities = Array.isArray(existingReview?.amenities)
  //   ? existingReview.amenities
  //   : Array.isArray(cr?.amenities)
  //     ? cr.amenities
  //     : []

  // pre-fill if editing, otherwise start blank
  const [rating, setRating] = useState(existingReview ? existingReview.rating : 0)
  const [text, setText] = useState(existingReview ? existingReview.text : '')
  const [amenities, setAmenities] = useState(buildInitialAmenities)
  const [error, setError] = useState('')

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

      {/* amenity toggles — click to flip working/broken */}
      {amenities.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Update Amenity Status</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {amenities.map((amenity, index) => (
              <button
                key={amenity.label}
                onClick={() => toggleAmenity(index)}
                title={amenity.working ? 'Mark as not working' : 'Mark as working'}
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
                {amenity.working ? '✓' : '✗'} {amenity.label}
              </button>
            ))}
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#888' }}>
            Tap a tag to toggle whether it's currently working.
          </p>
        </div>
      )}

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