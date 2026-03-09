// reviews - the list of reviews (starts with sample data)
// showForm - whether the review form is visible
// editingReview - the review being edited (null = writing a new one)
// sortBy - how reviews are sorted
// reported - Set of review IDs that have been reported (hides them)

import { useState } from 'react';

import sampleCR from './crData';
import StarRating from './StarRating';
import ReviewForm from './ReviewForm';
import ReviewCard from './ReviewCard';
import { useParams } from 'react-router-dom';

const CRPage = () => {
  const { id } = useParams(); // 'faura-1' in this example

// The logged-in user's name. Replace with real auth later.
  const CURRENT_USER = 'You'

  const SORT_OPTIONS = ['Newest', 'Oldest', 'Highest Rated', 'Lowest Rated', 'Most Liked']


    const [reviews,       setReviews]       = useState(sampleCR.reviews)
    const [showForm,      setShowForm]      = useState(false)
    const [editingReview, setEditingReview] = useState(null)
    const [sortBy,        setSortBy]        = useState('Newest')
    const [reported,      setReported]      = useState(new Set())

    // Checks if already posted review
    const alreadyReviewed = reviews.some((r) => r.author === CURRENT_USER)

    // Average rating across all reviews
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

    // Sort a copy of reviews (never mutate state directly)
    const sortedReviews = [...reviews].sort((a, b) => {
      if (sortBy === 'Newest')        return b.timestamp.localeCompare(a.timestamp)
      if (sortBy === 'Oldest')        return a.timestamp.localeCompare(b.timestamp)
      if (sortBy === 'Highest Rated') return b.rating - a.rating
      if (sortBy === 'Lowest Rated')  return a.rating - b.rating
      if (sortBy === 'Most Liked')    return b.likes   - a.likes
      return 0
    })

    // Event handlers 

    function handleSubmitReview(reviewData) {
      if (editingReview) {
        // Replace the old review with the edited one
        setReviews(reviews.map((r) => r.id === reviewData.id ? reviewData : r))
      } else {
        // Add the new review to the front of the list
        setReviews([reviewData, ...reviews])
      }
      setShowForm(false)
      setEditingReview(null)
    }

    function handleLike(reviewId) {
      setReviews(reviews.map((r) =>
        r.id === reviewId ? { ...r, likes: r.likes + 1 } : r
      ))
    }

    function handleDislike(reviewId) {
      setReviews(reviews.map((r) =>
        r.id === reviewId ? { ...r, dislikes: r.dislikes + 1 } : r
      ))
    }

    function handleEdit(review) {
      setEditingReview(review)
      setShowForm(true)
    }

    function handleDelete(reviewId) {
      if (window.confirm('Delete your review?')) {
        setReviews(reviews.filter((r) => r.id !== reviewId))
      }
    }

    function handleReport(reviewId) {
      // Add to the reported set so it disappears from the list
      setReported(new Set([...reported, reviewId]))
      alert('Review reported. Thank you!')
    }

    function handleClickLeaveReview() {
      if (alreadyReviewed) {
        alert('You have already reviewed this CR. Edit your existing review below.')
        return
      }
      setEditingReview(null)
      setShowForm(true)
    }

    // Render

    return (
      <div style={{ minHeight: '100vh', background: '#DFD0B8', padding: '24px 16px' }}>

        <div style={{ maxWidth: '600px', margin: '0 auto' }}>

          <div style={{
            background: '#153448',
            borderRadius: '12px',
            padding: '20px 24px',
            marginBottom: '20px',
            color: 'white',
          }}>
            <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontFamily: 'Georgia, serif' }}>
              {sampleCR.building} Hall — Floor {sampleCR.floor}
            </h1>

            {/* Availability badge */}
            <span style={{
              display: 'inline-block',
              padding: '2px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              background: sampleCR.availability === 'Available' ? '#4CAF50' : '#e53935',
              marginBottom: '12px',
            }}>
              {sampleCR.availability}
            </span>

            {/* Average rating */}
            <div style={{ marginBottom: '12px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '12px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Average Rating ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
              </p>
              <StarRating rating={Math.round(avgRating)} interactive={false} />
            </div>

            {/* Amenities */}
            <p style={{ margin: '0 0 6px', fontSize: '12px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Amenities
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {sampleCR.amenities.map((amenity) => (
                <span
                  key={amenity.label}
                  style={{
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500',
                    background: amenity.working ? '#d4edda' : '#f8d7da',
                    color:      amenity.working ? '#155724' : '#721c24',
                  }}
                >
                  {amenity.working ? '✓' : '✗'} {amenity.label}
                </span>
              ))}
            </div>
          </div>

          {/* ── Reviews Section ── */}
          <div style={{
            background: '#EDE5D5',
            borderRadius: '12px',
            padding: '20px 24px',
          }}>

            {/* Header row: title + sort dropdown */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#153448' }}>
                Reviews
              </h2>

              {/* Only show the sort dropdown if there's more than 1 review */}
              {reviews.length > 1 && (
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1px solid #948979',
                    background: 'white',
                    cursor: 'pointer',
                  }}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Leave a review button (hidden while the form is open) */}
            {!showForm && (
              <button
                onClick={handleClickLeaveReview}
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
                }}
              >
                {alreadyReviewed ? 'You already reviewed this — Edit below' : '+ Leave a Review'}
              </button>
            )}

            {/* The review form — only shown when showForm is true */}
            {showForm && (
              <ReviewForm
                cr={sampleCR}
                existingReview={editingReview}
                onSubmit={handleSubmitReview}
                onCancel={() => {
                  setShowForm(false)
                  setEditingReview(null)
                }}
              />
            )}

            {/* The list of reviews */}
            {sortedReviews.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999', padding: '24px 0' }}>
                No reviews yet. Be the first!
              </p>
            ) : (
              sortedReviews
                // Hide reported reviews
                .filter((r) => !reported.has(r.id))
                .map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    currentUser={CURRENT_USER}
                    onLike={handleLike}
                    onDislike={handleDislike}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onReport={handleReport}
                  />
                ))
            )}

          </div>
        </div>
      </div>
    )
};

export default CRPage;