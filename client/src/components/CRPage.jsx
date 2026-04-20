// reviews - the list of reviews (starts with sample data)
// showForm - whether the review form is visible
// editingReview - the review being edited (null = writing a new one)
// sortBy - how reviews are sorted
// reported - Set of review IDs that have been reported (hides them)

import { useState, useEffect } from 'react';

import StarRating from './StarRating';
import ReviewForm from './ReviewForm';
import ReviewCard from './ReviewCard';
import { useParams, useNavigate } from 'react-router-dom';

const API_BASE = '';

const CRPage = () => {
  const { pk } = useParams(); 
  const [cr, setCR] = useState({
    building: '',
    floor: '',
    status: '',
    tags: []
  });
  const [reviews, setReviews] = useState([]); 
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true);
  const [showForm,      setShowForm]      = useState(false)
  const [editingReview, setEditingReview] = useState(null)
  const [sortBy,        setSortBy]        = useState('Newest')
  const [reported,      setReported]      = useState(new Set())
  const [userVotes,     setUserVotes]     = useState(() => {
    const username = localStorage.getItem('shiitake_username') || '';
    if (!username || !localStorage.getItem('shiitake_token')) return {};
    try {
      return JSON.parse(localStorage.getItem(`shiitake_votes_${username}`) || '{}');
    } catch {
      return {};
    }
  })
  const [liveAmenities, setLiveAmenities] = useState(null)

  const currentUsername = localStorage.getItem('shiitake_username') || 'Anonymous';
  const currentUserId = localStorage.getItem('shiitake_userID')

  const navigate = useNavigate();

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

            const revRes = await fetch(`${API_BASE}/reviews?CRId=${pk}`);
            const revData = await revRes.json();

            const revArray = Array.isArray(revData) ? revData : [];
            const reviews = revArray
              .filter((r) => String(r.CRId) === String(pk)) 
              .map(mapReviewFromApi);

            setReviews(reviews);

            if (currentUserId) {
              const userRes = await fetch(`${API_BASE}/users/${currentUserId}`);
              const userData = await userRes.json();
              setUser(userData); 
            }
            setLoading(false);
          
        } catch (err) {
            console.error("Fetch error:", err);
            setLoading(false);
        }
    }
    loadCR();
      }, [pk]); // Re-run if the primary key changes

  const isLoggedIn = !!localStorage.getItem('shiitake_token');
  const CURRENT_USER = localStorage.getItem('shiitake_username') || currentUsername

  const SORT_OPTIONS = ['Newest', 'Oldest', 'Highest Rated', 'Lowest Rated', 'Most Liked']

    const REVIEW_WINDOW_MS = 24 * 60 * 60 * 1000

    // Check if user reviewed within the current time window (by UserId when available, else by author name)
    const userReviews = currentUserId
      ? reviews.filter(r => String(r.UserId) === String(currentUserId))
      : reviews.filter(r => r.author === CURRENT_USER)

    const latestUserReview = userReviews.length > 0
      ? userReviews.reduce((latest, r) =>
          new Date(r.createdAt) > new Date(latest.createdAt) ? r : latest
        )
      : null

    const alreadyReviewed = latestUserReview
      ? (Date.now() - new Date(latestUserReview.createdAt).getTime()) < REVIEW_WINDOW_MS
      : false

    // Average rating across all reviews
    const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0

    const visibleTags = liveAmenities
      ? liveAmenities.filter(a => a.working).map(a => a.label)
      : cr.tags

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
              author: currentUsername,
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

          if (!response.ok) {
            const data = await response.json()
            if (response.status === 429 && data.nextAllowed) {
              const nextTime = new Date(data.nextAllowed).toLocaleString()
              alert(`You already reviewed this CR recently. You can review it again after ${nextTime}.`)
            } else {
              throw new Error('Failed to create review')
            }
            return
          }

          const data = await response.json()
          const created = mapReviewFromApi(data.review)
          setReviews((prev) => [created, ...prev])
        }

        // Update CR tags: remove amenities marked as not working
        if (Array.isArray(reviewData.amenities) && reviewData.amenities.length > 0) {
          const newTags = reviewData.amenities.filter(a => a.working).map(a => a.label)
          try {
            await fetch(`${API_BASE}/crs/${cr.id ?? Number(pk)}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tags: newTags }),
            })
            setCR(prev => ({ ...prev, tags: newTags }))
          } catch (tagErr) {
            console.error('Could not update CR tags:', tagErr)
          }
        }

        setLiveAmenities(null)
        setShowForm(false)
        setEditingReview(null)
      } catch (error) {
        console.error(error)
        alert('Could not save review. Please try again.')
      }
    }

    async function applyVote(reviewId, nextVote) {
      if (!isLoggedIn) {
        alert('Please log in to like or dislike reviews.')
        return
      }
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

          const username = localStorage.getItem('shiitake_username') || ''
          if (username) {
            localStorage.setItem(`shiitake_votes_${username}`, JSON.stringify(updated))
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
          const token = localStorage.getItem('shiitake_token')
          const response = await fetch(`${API_BASE}/reviews/${reviewId}`, {
            method: 'DELETE',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          })

          if (!response.ok) throw new Error('Failed to delete review')

          setReviews((prev) => prev.filter((r) => getReviewId(r) !== reviewId))
        } catch (error) {
          console.error(error)
          alert('Could not delete review. Please try again.')
        }
      }
    }

    async function handleReport(reviewId) {
      try {
        const response = await fetch(`${API_BASE}/reviews/${reviewId}/report`, {
          method: 'PATCH',
        })
        if (!response.ok) throw new Error('Failed to report review')
        // Add to the reported set so it disappears from the list
        setReported(new Set([...reported, reviewId]))
        alert('Review reported. Thank you!')
      } catch (error) {
        console.error(error)
        alert('Could not report review. Please try again.')
      }
    }

    function handleClickLeaveReview() {
      if (alreadyReviewed) {
        alert('You have already reviewed this CR. Edit your existing review below.')
        return
      }
      setEditingReview(null)
      setShowForm(true)
    }

    function handleNavigate() {
      navigate('/', {
        state: {
          cr: cr
        }
      } );
    }

    async function handleToggleFavorite() {
      const currentFavorites = user.favoriteCRs || []
      let updatedFavorites; 
      const isFavorite = user?.favoriteCRs?.some(favId => String(favId) === String(pk))
      if (isFavorite)
        updatedFavorites = currentFavorites.filter(favId => String(favId) !== String(pk));
      else {
        const newFavorite = [Number(pk)]
        updatedFavorites = [...new Set([...currentFavorites, ...newFavorite])];
      }
      setUser({ ...user, favoriteCRs: updatedFavorites });
      const previousUser = { ...user };

      try {
            const response = await fetch(`${API_BASE}/users/${currentUserId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            favoriteCRs: updatedFavorites
            }),
          });
        if (!response.ok) throw new Error('Failed to add favorite')
      } catch (error) {
        console.error(error)
        setUser(previousUser);
        alert('Could not add favorite. Please try again.')
      }
    }

    const isFavorite = user?.favoriteCRs?.some(favId => String(favId) === String(pk))
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
            {loading ? <h1 style={{ margin: '0 0 12px', fontSize: '22px', fontFamily: 'Georgia, serif' }}>Fetching CR...</h1> : 
            <><h1 style={{ margin: '0 0 12px', fontSize: '22px', fontFamily: 'Georgia, serif' }}>
              {cr.building} — {cr.name}    
            </h1>

            {/* Availability badge */}
            <span style={{
              display: 'inline-block',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              background: cr.status === 'available' ? '#4CAF50' : '#e53935',
              marginBottom: '12px',
            }}>
              {cr.status}
            </span>
            <button
                onClick={handleNavigate}
                style={{
                  padding: '8px 10px',
                  marginLeft: '16px',
                  background: '#e6f0eb',
                  color: '#153448',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '12px',
                }}
              >
                Navigate
              </button>
              {isLoggedIn ? <><button
                onClick={handleToggleFavorite}
                style={{
                  padding: '3px 8px',
                  marginLeft: '16px',
                  background: isFavorite
                  ? '#d83110'  // blue if in favorites
                  : '#e6f0eb', // white otherwise
                  color: isFavorite
                  ? '#e6f0eb'  // white if in favorites
                  : '#153448', // blue otherwise
                  border: 'none',
                  borderRadius: '8px',
                  align: 'center',  
                  cursor: 'pointer',
                  fontWeight: '1000',
                  fontSize: '16px',
                }}
              >
                ♡
              </button></> : <></>}

           

            {/* Average rating */}
            <div style={{ marginBottom: '12px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '12px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Average Rating ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
              </p>
              <StarRating rating={avgRating} interactive={false} />
            </div>

            {/* Amenities */}
            <p style={{ margin: '0 0 6px', fontSize: '12px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Amenities
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {visibleTags.map((amenity) => (
                <span
                  key={amenity}
                  style={{
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500',
                    background: '#d4edda',
                    color: '#155724',
                  }}
                >
                  {amenity}
                </span>
              ))}
            </div></>}
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

            {/* Leave a review button (only for logged-in users, hidden while the form is open) */}
            {!showForm && !isLoggedIn && (
              <p style={{ textAlign: 'center', color: '#888', fontSize: '13px', marginBottom: '16px' }}>
                <a href="/login" style={{ color: '#153448', fontWeight: '700' }}>Log in</a> to leave a review.
              </p>
            )}
            {!showForm && isLoggedIn && (
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
                onAmenityChange={(amenities) => setLiveAmenities(amenities)}
                onCancel={() => {
                  setShowForm(false)
                  setEditingReview(null)
                  setLiveAmenities(null)
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
                    isLoggedIn={isLoggedIn}
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