// reviews - the list of reviews (starts with sample data)
// showForm - whether the review form is visible
// editingReview - the review being edited (null = writing a new one)
// sortBy - how reviews are sorted
// reported - Set of review IDs that have been reported (hides them)

import { useState, useEffect } from 'react';

import StarRating from './StarRating';
import ReviewForm from './ReviewForm';
import ReviewCard from './ReviewCard';
import { useParams } from 'react-router-dom';

const API_BASE = 'http://localhost:13000';

const CRPage = () => {
  const { pk } = useParams(); // 'faura-1' in this example
  const [cr, setCR] = useState({
    building: '',
    floor: '',
    status: '',
    tags: []
  });
  const [reviews, setReviews] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [showForm,      setShowForm]      = useState(false)
  const [editingReview, setEditingReview] = useState(null)
  const [sortBy,        setSortBy]        = useState('Newest')
  const [reported,      setReported]      = useState(new Set())
  const [userVotes,     setUserVotes]     = useState({})

  const currentUsername = localStorage.getItem('shiitake_username') || 'Anonymous';
  const currentUserId = localStorage.getItem('shiitake_userID')

  function getReviewId(review) {
    return review?.pk ?? review?.id
  }

  function mapReviewFromApi(review) {
    return {
      ...review,
      id: getReviewId(review),
      author: review.author || 'Anonymous',
      text: review.text ?? review.comment ?? '',
      timestamp: review.timestamp ?? (review.createdAt ? review.createdAt.split('T')[0] : ''),
      likes: review.likes ?? 0,
      dislikes: review.dislikes ?? 0,
      amenities: Array.isArray(review.reviewTags) ? review.reviewTags : [],
    }
  }

  useEffect(() => {
    async function loadCR() {
        try {
            // Use pk in the fetch URL
            const crRes = await fetch(`${API_BASE}/CRs/${pk}`);
            const crData = await crRes.json();
            setCR(crData);
            console.log(crData);

            const revRes = await fetch(`${API_BASE}/reviews`);
            const allReviews = await revRes.json();

            // Filter reviews using the primary key
            const pkNumber = Number(pk);
            const myReviews = allReviews.filter((r) => r.CRId === pkNumber || String(r.CRId) === String(pk)).map(mapReviewFromApi);
            setReviews(myReviews);

            setLoading(false);
        } catch (err) {
            console.error("Fetch error:", err);
            setLoading(false);
        }
    }
    loadCR();
      }, [pk]); // Re-run if the primary key changes

// The logged-in user's name. Replace with real auth later.
  const CURRENT_USER = currentUsername

  const SORT_OPTIONS = ['Newest', 'Oldest', 'Highest Rated', 'Lowest Rated', 'Most Liked']     

    // Checks if already posted review
    const alreadyReviewed = reviews.some((r) => r.author === CURRENT_USER)

    // Average rating across all reviews
    const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0

    // Sort a copy of reviews (never mutate state directly)
    const sortedReviews = [...reviews].sort((a, b) => {
      if (sortBy === 'Newest')        return b.createdAt.localeCompare(a.createdAt)
      if (sortBy === 'Oldest')        return a.createdAt.localeCompare(b.createdAt)
      if (sortBy === 'Highest Rated') return b.rating - a.rating
      if (sortBy === 'Lowest Rated')  return a.rating - b.rating
      if (sortBy === 'Most Liked')    return b.likes   - a.likes
      return 0
    })

    // Event handlers 

    async function handleSubmitReview(reviewData) {
      try {
        if (editingReview) {
          const response = await fetch(`${API_BASE}/reviews/${getReviewId(editingReview)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              rating: reviewData.rating,
              comment: reviewData.text,
              reviewTags: reviewData.amenities,
              author: reviewData.author,
            }),
          })

          if (!response.ok) throw new Error('Failed to update review')

          const data = await response.json()
          const updated = mapReviewFromApi(data.review)
          setReviews((prev) => prev.map((r) => (getReviewId(r) === getReviewId(updated) ? updated : r)))
        } else {
          const response = await fetch(`${API_BASE}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              CRId: cr.id ?? Number(pk),
              UserId: currentUserId ? Number(currentUserId) : null,
              rating: reviewData.rating,
              comment: reviewData.text,
              reviewTags: reviewData.amenities,
              author: currentUsername,
            }),
          })

          if (!response.ok) throw new Error('Failed to create review')

          const data = await response.json()
          const created = mapReviewFromApi(data.review)
          setReviews((prev) => [created, ...prev])
        }

        setShowForm(false)
        setEditingReview(null)
      } catch (error) {
        console.error(error)
        alert('Could not save review. Please try again.')
      }
    }

    async function applyVote(reviewId, nextVote) {
      const prevVote = userVotes[reviewId]
      if (prevVote === nextVote) return

      try {
        const response = await fetch(`${API_BASE}/reviews/${reviewId}/vote`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ previousVote: prevVote, nextVote }),
        })

        if (!response.ok) throw new Error('Failed to update vote')

        const data = await response.json()
        const nextLikes = data.review?.likes ?? 0
        const nextDislikes = data.review?.dislikes ?? 0

        setReviews((prevReviews) =>
          prevReviews.map((review) =>
            getReviewId(review) === reviewId
              ? { ...review, likes: nextLikes, dislikes: nextDislikes }
              : review
          )
        )

        setUserVotes((prev) => {
          const updated = { ...prev }

          if (nextVote) {
            updated[reviewId] = nextVote
          }

          if (!nextVote) {
            delete updated[reviewId]
          }

          return updated
        })
      } catch (error) {
        console.error(error)
        alert('Could not update vote. Please try again.')
      }
    }

    function handleLike(reviewId) {
      const currentVote = userVotes[reviewId]
      applyVote(reviewId, currentVote === 'like' ? null : 'like')
    }

    function handleDislike(reviewId) {
      const currentVote = userVotes[reviewId]
      applyVote(reviewId, currentVote === 'dislike' ? null : 'dislike')
    }

    function handleEdit(review) {
      setEditingReview(review)
      setShowForm(true)
    }

    async function handleDelete(reviewId) {
      if (window.confirm('Delete your review?')) {
        try {
          const response = await fetch(`${API_BASE}/reviews/${reviewId}`, {
            method: 'DELETE',
          })

          if (!response.ok) throw new Error('Failed to delete review')

          setReviews((prev) => prev.filter((r) => getReviewId(r) !== reviewId))
        } catch (error) {
          console.error(error)
          alert('Could not delete review. Please try again.')
        }
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
              {cr.building} — {cr.name}
            </h1>

            {/* Availability badge */}
            <span style={{
              display: 'inline-block',
              padding: '2px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              background: cr.status === 'available' ? '#4CAF50' : '#e53935',
              marginBottom: '12px',
            }}>
              {cr.status}
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
              {cr.tags.map((amenity) => (
                <span
                  key={amenity}
                  style={{
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500',
                    background: '#d4edda'

                  }}
                >
                {amenity}
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
                cr={cr}
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
                .filter((r) => !reported.has(getReviewId(r)))
                .map((review) => (
                  <ReviewCard
                    key={getReviewId(review)}
                    review={review}
                    currentUser={CURRENT_USER}
                    currentVote={userVotes[getReviewId(review)] || null}
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